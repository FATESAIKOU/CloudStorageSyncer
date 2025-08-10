"""S3 service for cloud storage operations."""

import logging
from pathlib import Path

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from ..models import (
    DeleteResult,
    DownloadRequest,
    DownloadResult,
    S3Config,
    UploadRequest,
    UploadResult,
)

logger = logging.getLogger(__name__)


class S3Service:
    """Service for S3 operations."""

    def __init__(self, config: S3Config):
        """Initialize S3 service with configuration.

        Args:
            config: S3 configuration

        Raises:
            ValueError: If configuration is invalid
        """
        if not config.is_valid():
            raise ValueError("Invalid S3 configuration")

        self.config = config
        self._client = None
        self._bucket_exists_cache: bool | None = None

    @property
    def client(self):
        """Get S3 client, creating it if necessary."""
        if self._client is None:
            try:
                self._client = boto3.client(
                    "s3",
                    aws_access_key_id=self.config.access_key,
                    aws_secret_access_key=self.config.secret_key,
                    region_name=self.config.region,
                )
            except Exception as e:
                logger.error(f"Failed to create S3 client: {e}")
                raise
        return self._client

    def test_connection(self) -> bool:
        """Test S3 connection and bucket access.

        Returns:
            True if connection is successful, False otherwise
        """
        try:
            # Try to list objects in the bucket (with limit 1 to minimize cost)
            self.client.list_objects_v2(Bucket=self.config.bucket, MaxKeys=1)
            self._bucket_exists_cache = True
            return True
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            return False
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "NoSuchBucket":
                logger.error(f"Bucket '{self.config.bucket}' does not exist")
            elif error_code == "AccessDenied":
                logger.error(f"Access denied to bucket '{self.config.bucket}'")
            else:
                logger.error(f"AWS client error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error testing S3 connection: {e}")
            return False

    def upload_file(self, request: UploadRequest) -> UploadResult:
        """Upload a file to S3.

        Args:
            request: Upload request with file path, S3 key, and storage class

        Returns:
            Upload result indicating success or failure
        """
        file_path = Path(request.file_path)

        # Validate file exists
        if not file_path.exists():
            return UploadResult.error(f"File does not exist: {file_path}")

        if not file_path.is_file():
            return UploadResult.error(f"Path is not a file: {file_path}")

        # Test connection if not already cached
        if self._bucket_exists_cache is None and not self.test_connection():
            return UploadResult.error("Cannot connect to S3 bucket")

        try:
            # Upload file with storage class
            extra_args = {}
            if request.storage_class:
                extra_args["StorageClass"] = request.storage_class.value

            self.client.upload_file(
                str(file_path), self.config.bucket, request.s3_key, ExtraArgs=extra_args
            )

            logger.info(
                f"Successfully uploaded {file_path} to s3://{self.config.bucket}/{request.s3_key}"
            )
            return UploadResult.success(
                s3_url=f"s3://{self.config.bucket}/{request.s3_key}",
                storage_class=request.storage_class.value
                if request.storage_class
                else "STANDARD",
            )

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            logger.error(f"AWS client error during upload: {e}")
            return UploadResult.error(f"AWS error ({error_code}): {e}")

        except Exception as e:
            logger.error(f"Unexpected error during upload: {e}")
            return UploadResult.error(f"Upload failed: {e}")

    def get_object_info(self, s3_key: str) -> dict | None:
        """Get information about an S3 object.

        Args:
            s3_key: S3 object key

        Returns:
            Object metadata dict if found, None otherwise
        """
        try:
            response = self.client.head_object(Bucket=self.config.bucket, Key=s3_key)
            return {
                "size": response["ContentLength"],
                "last_modified": response["LastModified"],
                "etag": response["ETag"],
                "storage_class": response.get("StorageClass", "STANDARD"),
            }
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return None
            logger.error(f"Error getting object info: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting object info: {e}")
            return None

    def list_objects(self, prefix: str = "", max_keys: int = 1000) -> list[dict]:
        """List objects in the S3 bucket.

        Args:
            prefix: Prefix to filter objects
            max_keys: Maximum number of objects to return

        Returns:
            List of object information dictionaries
        """
        try:
            paginator = self.client.get_paginator("list_objects_v2")
            page_iterator = paginator.paginate(
                Bucket=self.config.bucket,
                Prefix=prefix,
                PaginationConfig={"MaxItems": max_keys},
            )

            objects = []
            for page in page_iterator:
                if "Contents" in page:
                    for obj in page["Contents"]:
                        objects.append(
                            {
                                "key": obj["Key"],
                                "size": obj["Size"],
                                "last_modified": obj["LastModified"],
                                "etag": obj["ETag"],
                                "storage_class": obj.get("StorageClass", "STANDARD"),
                            }
                        )

            return objects

        except ClientError as e:
            logger.error(f"Error listing objects: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error listing objects: {e}")
            return []

    def file_exists(self, s3_key: str) -> bool:
        """Check if a file exists in S3.

        Args:
            s3_key: S3 object key to check

        Returns:
            True if file exists, False otherwise
        """
        try:
            self.client.head_object(Bucket=self.config.bucket, Key=s3_key)
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return False
            logger.error(f"Error checking if file exists: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error checking file existence: {e}")
            return False

    def download_file(self, request: DownloadRequest) -> DownloadResult:
        """Download a file from S3 to local filesystem.

        Args:
            request: Download request with S3 key and output path

        Returns:
            DownloadResult with success/failure information
        """
        try:
            # Check if S3 file exists
            if not self.file_exists(request.s3_key):
                return DownloadResult.error_result(
                    request.s3_key, f"File not found in S3: {request.s3_key}"
                )

            # Determine local storage path
            local_path = request.get_local_path()

            # Check if local file already exists
            if local_path.exists() and not request.force:
                return DownloadResult.error_result(
                    request.s3_key,
                    f"Local file already exists: {local_path}. "
                    f"Use --force to replace it.",
                )

            # Create target directory if it doesn't exist
            local_path.parent.mkdir(parents=True, exist_ok=True)

            # Download file
            self.client.download_file(
                self.config.bucket, request.s3_key, str(local_path)
            )

            # Get file size
            file_size = local_path.stat().st_size

            logger.info(
                f"Successfully downloaded {request.s3_key} to {local_path} "
                f"({file_size} bytes)"
            )

            return DownloadResult.success_result(
                request.s3_key, str(local_path), file_size
            )

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            logger.error(f"AWS client error during download: {e}")
            return DownloadResult.error_result(
                request.s3_key, f"AWS error ({error_code}): {e}"
            )
        except Exception as e:
            logger.error(f"Unexpected error during download: {e}")
            return DownloadResult.error_result(request.s3_key, f"Download failed: {e}")

    def delete_file(self, s3_key: str) -> DeleteResult:
        """Delete a file from S3.

        Args:
            s3_key: S3 object key to delete

        Returns:
            DeleteResult with success/failure information
        """
        try:
            # Check if file exists before deletion
            existed = self.file_exists(s3_key)

            # Execute delete operation
            # Note: S3 delete_object is idempotent - doesn't fail if file doesn't exist
            self.client.delete_object(Bucket=self.config.bucket, Key=s3_key)

            logger.info(
                f"Delete operation completed for s3://{self.config.bucket}/{s3_key} "
                f"(existed: {existed})"
            )

            return DeleteResult.success_result(s3_key, existed)

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            logger.error(f"AWS client error during delete: {e}")
            return DeleteResult.error_result(s3_key, f"AWS error ({error_code}): {e}")
        except Exception as e:
            logger.error(f"Unexpected error during delete: {e}")
            return DeleteResult.error_result(s3_key, f"Delete failed: {e}")

    def download_directory(
        self, s3_prefix: str, local_base_path: Path, force: bool = False
    ) -> list[DownloadResult]:
        """Download all files with the given S3 prefix to a local directory.

        Args:
            s3_prefix: S3 prefix to download (acts as directory)
            local_base_path: Local directory to download to
            force: Whether to overwrite existing files

        Returns:
            List of DownloadResult for each file
        """
        results = []

        try:
            # List all objects with the prefix
            objects = self.list_objects(prefix=s3_prefix)

            if not objects:
                return [
                    DownloadResult.error_result(
                        s3_prefix, "No files found with this prefix"
                    )
                ]

            # Ensure prefix ends with / for directory-like behavior
            normalized_prefix = (
                s3_prefix.rstrip("/") + "/"
                if s3_prefix and not s3_prefix.endswith("/")
                else s3_prefix
            )

            for obj in objects:
                s3_key = obj["key"]

                # Skip if this is just the prefix itself (empty directory marker)
                if s3_key == normalized_prefix:
                    continue

                # Calculate relative path within the directory
                if normalized_prefix:
                    if not s3_key.startswith(normalized_prefix):
                        continue
                    relative_path = s3_key[len(normalized_prefix) :]
                else:
                    relative_path = s3_key

                # Skip empty relative paths (shouldn't happen but be safe)
                if not relative_path:
                    continue

                # Create local path
                local_file_path = local_base_path / relative_path

                # Create download request
                download_request = DownloadRequest(
                    s3_key=s3_key, output_path=str(local_file_path), force=force
                )

                # Download the file
                result = self.download_file(download_request)
                results.append(result)

        except Exception as e:
            logger.error(f"Unexpected error during directory download: {e}")
            results.append(
                DownloadResult.error_result(
                    s3_prefix, f"Directory download failed: {e}"
                )
            )

        return results

    def delete_directory(
        self, s3_prefix: str, force: bool = False
    ) -> list[DeleteResult]:
        """Delete all files with the given S3 prefix.

        Args:
            s3_prefix: S3 prefix to delete (acts as directory)
            force: Whether to skip confirmation (currently not used but kept for
                consistency)

        Returns:
            List of DeleteResult for each file
        """
        results = []

        try:
            # List all objects with the prefix
            objects = self.list_objects(prefix=s3_prefix)

            if not objects:
                return [DeleteResult.success_result(s3_prefix, existed=False)]

            for obj in objects:
                s3_key = obj["key"]
                result = self.delete_file(s3_key)
                results.append(result)

        except Exception as e:
            logger.error(f"Unexpected error during directory delete: {e}")
            results.append(
                DeleteResult.error_result(s3_prefix, f"Directory delete failed: {e}")
            )

        return results
