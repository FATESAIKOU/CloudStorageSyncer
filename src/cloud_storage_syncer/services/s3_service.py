"""S3 service for cloud storage operations."""

import logging
from pathlib import Path

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from ..models import S3Config, UploadRequest, UploadResult

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
