"""Standard API response models and error codes."""

from typing import Any

from pydantic import BaseModel


class ApiErrorCode:
    """Standardized error codes for API responses."""

    # Authentication errors
    AUTH_REQUIRED = "AUTH_001"
    INVALID_CREDENTIALS = "AUTH_002"

    # File operation errors
    FILE_NOT_FOUND = "FILE_001"
    UPLOAD_FAILED = "FILE_002"
    DOWNLOAD_FAILED = "FILE_003"
    DELETE_FAILED = "FILE_004"
    LIST_FAILED = "FILE_005"
    SEARCH_FAILED = "FILE_006"

    # S3 service errors
    S3_CONNECTION_ERROR = "S3_001"
    S3_PERMISSION_ERROR = "S3_002"
    S3_BUCKET_ERROR = "S3_003"

    # General request errors
    INVALID_REQUEST = "REQ_001"
    VALIDATION_ERROR = "REQ_002"

    # Server errors
    SERVER_ERROR = "SRV_001"
    SERVICE_UNAVAILABLE = "SRV_002"


class ApiResponse(BaseModel):
    """Standard API response format."""

    success: bool
    data: Any | None = None
    message: str = ""
    error: str = ""
    error_code: str = ""

    @classmethod
    def success_response(
        cls, data: Any = None, message: str = "Operation completed successfully"
    ) -> "ApiResponse":
        """Create a successful response."""
        return cls(success=True, data=data, message=message, error="", error_code="")

    @classmethod
    def error_response(
        cls, error: str, error_code: str, message: str = "Operation failed"
    ) -> "ApiResponse":
        """Create an error response."""
        return cls(
            success=False,
            data=None,
            message=message,
            error=error,
            error_code=error_code,
        )


# File operation request/response models
class FileUploadResponse(BaseModel):
    """Response model for file upload."""

    s3_key: str
    size: int
    storage_class: str


class FileListResponse(BaseModel):
    """Response model for file listing."""

    files: list[dict]
    total_count: int
    prefix: str


class FileDeleteResponse(BaseModel):
    """Response model for file deletion."""

    s3_key: str
    deleted: bool
