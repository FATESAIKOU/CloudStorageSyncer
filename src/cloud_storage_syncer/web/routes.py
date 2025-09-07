"""File operations API routes."""
# ruff: noqa: B008

import io

from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import StreamingResponse

from ..models.download import DownloadRequest
from ..models.storage import S3StorageClass
from ..models.upload import UploadRequest
from ..services.config_service import ConfigService
from ..services.s3_service import S3Service
from ..web.auth import require_auth
from ..web.models import (
    ApiErrorCode,
    ApiResponse,
    FileDeleteResponse,
    FileListResponse,
    FileUploadResponse,
)

router = APIRouter(prefix="/files", tags=["files"])


def get_s3_service() -> S3Service:
    """Get configured S3 service instance."""
    config_service = ConfigService()
    config = config_service.load_config()

    if not config or not config.is_valid():
        raise HTTPException(
            status_code=500,
            detail=ApiResponse.error_response(
                error="S3 configuration not found or invalid",
                error_code=ApiErrorCode.S3_CONNECTION_ERROR,
                message="Please configure S3 settings first",
            ).dict(),
        )

    return S3Service(config)


@router.get("/list")
async def list_files(
    request: Request,
    prefix: str = Query("", description="Prefix to filter files"),
    max_keys: int = Query(100, description="Maximum number of files to return"),
):
    """List files in S3 bucket."""
    require_auth(request)

    try:
        s3_service = get_s3_service()
        objects = s3_service.list_objects(prefix=prefix, max_keys=max_keys)

        return ApiResponse.success_response(
            data=FileListResponse(
                files=objects, total_count=len(objects), prefix=prefix
            ).dict(),
            message=f"Found {len(objects)} files",
        )

    except Exception as e:
        return ApiResponse.error_response(
            error=str(e),
            error_code=ApiErrorCode.LIST_FAILED,
            message="Failed to list files",
        )


@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    s3_key: str = Form(None),
    storage_class: str = Form("STANDARD"),
):
    """Upload file to S3 bucket."""
    require_auth(request)

    try:
        import os
        import tempfile

        s3_service = get_s3_service()

        # Use filename if s3_key not provided
        if not s3_key:
            s3_key = file.filename

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            # Read and write file content to temporary file
            file_content = await file.read()
            tmp_file.write(file_content)
            tmp_file_path = tmp_file.name

        try:
            # Create upload request with temporary file path
            upload_request = UploadRequest(
                file_path=tmp_file_path,
                s3_key=s3_key,
                storage_class=S3StorageClass(storage_class),
            )

            # Upload file
            result = s3_service.upload_file(upload_request)

            if result.success:
                return ApiResponse.success_response(
                    data=FileUploadResponse(
                        s3_key=s3_key,
                        size=len(file_content),
                        storage_class=result.storage_class,
                    ).dict(),
                    message="File uploaded successfully",
                )
            else:
                return ApiResponse.error_response(
                    error=result.error_message or "Upload failed",
                    error_code=ApiErrorCode.UPLOAD_FAILED,
                    message="Failed to upload file",
                )
        finally:
            # Clean up temporary file
            try:
                os.unlink(tmp_file_path)
            except OSError:
                pass  # Ignore cleanup errors

    except Exception as e:
        return ApiResponse.error_response(
            error=str(e),
            error_code=ApiErrorCode.UPLOAD_FAILED,
            message="Failed to upload file",
        )


@router.get("/download/{s3_key:path}")
async def download_file(request: Request, s3_key: str):
    """Download file from S3 bucket."""
    require_auth(request)

    try:
        s3_service = get_s3_service()

        # Create a unique temporary file to download to
        import os
        import tempfile
        import uuid

        # Use with statement to ensure proper cleanup
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create unique filename to avoid conflicts
            unique_filename = f"download_{uuid.uuid4().hex}_{s3_key.replace('/', '_')}"
            temp_path = os.path.join(temp_dir, unique_filename)

            # Create download request with temporary file path
            download_request = DownloadRequest(s3_key=s3_key, output_path=temp_path)

            # Download file to temporary location
            result = s3_service.download_file(download_request)

            if result.success:
                # Read the downloaded file content
                with open(temp_path, "rb") as f:
                    file_content = f.read()

                # Create streaming response
                return StreamingResponse(
                    io.BytesIO(file_content),
                    media_type="application/octet-stream",
                    headers={
                        "Content-Disposition": (
                            f"attachment; filename={s3_key.split('/')[-1]}"
                        )
                    },
                )
            else:
                raise HTTPException(
                    status_code=404,
                    detail=ApiResponse.error_response(
                        error=result.error_message or "File not found",
                        error_code=ApiErrorCode.FILE_NOT_FOUND,
                        message="File not found or download failed",
                    ).dict(),
                )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=ApiResponse.error_response(
                error=str(e),
                error_code=ApiErrorCode.DOWNLOAD_FAILED,
                message="Failed to download file",
            ).dict(),
        ) from e


@router.get("/search")
async def search_files(
    request: Request,
    pattern: str = Query(..., description="Search pattern"),
    prefix: str = Query("", description="Prefix to limit search scope"),
):
    """Search files in S3 bucket."""
    require_auth(request)

    try:
        s3_service = get_s3_service()

        # Get all objects with prefix
        all_objects = s3_service.list_objects(prefix=prefix, max_keys=1000)

        # Filter by pattern (simple substring search)
        matching_files = [
            obj for obj in all_objects if pattern.lower() in obj.get("Key", "").lower()
        ]

        return ApiResponse.success_response(
            data={
                "files": matching_files,
                "total_count": len(matching_files),
                "prefix": prefix,
            },
            message=f"Found {len(matching_files)} matching files",
        )

    except Exception as e:
        return ApiResponse.error_response(
            error=str(e),
            error_code=ApiErrorCode.SEARCH_FAILED,
            message="Failed to search files",
        )


@router.delete("/{s3_key:path}")
async def delete_file(request: Request, s3_key: str):
    """Delete file from S3 bucket."""
    require_auth(request)

    # Validate s3_key is not empty
    if not s3_key or s3_key.strip() == "":
        raise HTTPException(
            status_code=422,
            detail=ApiResponse.error_response(
                error="File path cannot be empty",
                error_code=ApiErrorCode.DELETE_FAILED,
                message="Invalid file path provided",
            ).dict(),
        )

    try:
        s3_service = get_s3_service()

        # Delete file
        result = s3_service.delete_file(s3_key)

        if result.success:
            return ApiResponse.success_response(
                data=FileDeleteResponse(s3_key=result.s3_key, deleted=True).dict(),
                message="File deleted successfully",
            )
        else:
            return ApiResponse.error_response(
                error=result.error_message or "Delete failed",
                error_code=ApiErrorCode.DELETE_FAILED,
                message="Failed to delete file",
            )

    except Exception as e:
        return ApiResponse.error_response(
            error=str(e),
            error_code=ApiErrorCode.DELETE_FAILED,
            message="Failed to delete file",
        )
