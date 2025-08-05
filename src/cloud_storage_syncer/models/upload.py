"""Upload request and result data models."""

from dataclasses import dataclass
from typing import TYPE_CHECKING

from .storage import S3StorageClass

if TYPE_CHECKING:
    from ..services.s3_service import S3Service


@dataclass
class UploadRequest:
    """Upload request DTO."""

    file_path: str
    s3_key: str
    storage_class: S3StorageClass | None = None

    def upload_with_service(self, s3_service: "S3Service") -> "UploadResult":
        """Upload file using the provided S3 service.

        Args:
            s3_service: S3 service instance

        Returns:
            Upload result
        """
        return s3_service.upload_file(self)


@dataclass
class UploadResult:
    """Upload result DTO."""

    success: bool
    error_message: str = ""
    s3_url: str = ""
    storage_class: str = ""

    @classmethod
    def success(cls, s3_url: str, storage_class: str = "STANDARD") -> "UploadResult":
        """Create successful result.

        Args:
            s3_url: S3 URL of uploaded file
            storage_class: Storage class used

        Returns:
            Success result
        """
        return cls(success=True, s3_url=s3_url, storage_class=storage_class)

    @classmethod
    def error(cls, error_message: str) -> "UploadResult":
        """Create error result.

        Args:
            error_message: Error description

        Returns:
            Error result
        """
        return cls(success=False, error_message=error_message)
