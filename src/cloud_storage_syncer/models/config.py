"""S3 configuration data model."""

from dataclasses import dataclass


@dataclass
class S3Config:
    """S3 configuration data model."""

    access_key: str = ""
    secret_key: str = ""
    bucket: str = ""
    region: str = "us-east-1"

    def is_valid(self) -> bool:
        """Check if configuration is complete and valid."""
        return bool(
            self.access_key
            and self.access_key.strip()
            and self.secret_key
            and self.secret_key.strip()
            and self.bucket
            and self.bucket.strip()
            and self.region
            and self.region.strip()
        )
