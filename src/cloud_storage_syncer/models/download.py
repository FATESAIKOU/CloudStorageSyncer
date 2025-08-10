"""Download request and result models."""

from dataclasses import dataclass
from pathlib import Path


@dataclass
class DownloadRequest:
    """Request for downloading a file from S3."""

    s3_key: str
    output_path: str | None = None
    overwrite: bool = False

    def __post_init__(self):
        """Post-initialization validation."""
        if not self.s3_key:
            raise ValueError("S3 key cannot be empty")
        if not self.s3_key.strip():
            raise ValueError("S3 key cannot be whitespace only")

    @property
    def local_filename(self) -> str:
        """Get the local filename for the download."""
        if self.output_path:
            return Path(self.output_path).name
        return Path(self.s3_key).name

    def get_local_path(self) -> Path:
        """Get the complete local path for saving the file."""
        if self.output_path:
            return Path(self.output_path)
        return Path.cwd() / self.local_filename


@dataclass
class DownloadResult:
    """Result of a file download operation."""

    success: bool
    s3_key: str
    local_path: str | None = None
    file_size: int | None = None
    error_message: str | None = None

    @classmethod
    def success_result(
        cls, s3_key: str, local_path: str, file_size: int
    ) -> "DownloadResult":
        """Create a successful download result."""
        return cls(
            success=True, s3_key=s3_key, local_path=local_path, file_size=file_size
        )

    @classmethod
    def error_result(cls, s3_key: str, error_message: str) -> "DownloadResult":
        """Create a failed download result."""
        return cls(success=False, s3_key=s3_key, error_message=error_message)
