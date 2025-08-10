"""Delete request and result models."""

from dataclasses import dataclass


@dataclass
class DeleteRequest:
    """Request for deleting a file from S3."""

    s3_key: str
    force: bool = False

    def __post_init__(self):
        """Post-initialization validation."""
        if not self.s3_key:
            raise ValueError("S3 key cannot be empty")
        if not self.s3_key.strip():
            raise ValueError("S3 key cannot be whitespace only")


@dataclass
class DeleteResult:
    """Result of a file delete operation."""

    success: bool
    s3_key: str
    existed_before_delete: bool = True
    error_message: str | None = None

    @classmethod
    def success_result(cls, s3_key: str, existed: bool = True) -> "DeleteResult":
        """Create a successful delete result."""
        return cls(success=True, s3_key=s3_key, existed_before_delete=existed)

    @classmethod
    def error_result(cls, s3_key: str, error_message: str) -> "DeleteResult":
        """Create a failed delete result."""
        return cls(success=False, s3_key=s3_key, error_message=error_message)
