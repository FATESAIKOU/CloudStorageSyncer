"""Configuration service for managing S3 settings."""

import json
import os
from pathlib import Path

from ..models import S3Config


class ConfigService:
    """Service for managing configuration."""

    def __init__(self, config_path: Path | None = None):
        """Initialize configuration service.

        Args:
            config_path: Path to config file, defaults to
                ~/.cloud_storage_syncer/config.json
        """
        if config_path is None:
            config_path = Path.home() / ".cloud_storage_syncer" / "config.json"

        self.config_path = config_path

    def load_config(self) -> S3Config | None:
        """Load configuration from file.

        Returns:
            S3Config if found and valid, None otherwise
        """
        if not self.config_path.exists():
            return None

        try:
            with open(self.config_path) as f:
                data = json.load(f)

            # Validate required fields
            required_fields = ["access_key", "secret_key", "bucket", "region"]
            if not all(field in data for field in required_fields):
                return None

            config = S3Config(
                access_key=data["access_key"],
                secret_key=data["secret_key"],
                bucket=data["bucket"],
                region=data["region"],
            )

            return config if config.is_valid() else None

        except (json.JSONDecodeError, KeyError, TypeError):
            return None

    def save_config(self, config: S3Config) -> bool:
        """Save configuration to file.

        Args:
            config: S3 configuration to save

        Returns:
            True if saved successfully, False otherwise
        """
        if not config.is_valid():
            return False

        try:
            # Create directory if it doesn't exist
            self.config_path.parent.mkdir(parents=True, exist_ok=True)

            data = {
                "access_key": config.access_key,
                "secret_key": config.secret_key,
                "bucket": config.bucket,
                "region": config.region,
            }

            with open(self.config_path, "w") as f:
                json.dump(data, f, indent=2)

            # Set restrictive permissions for security
            os.chmod(self.config_path, 0o600)

            return True

        except Exception:
            return False

    def config_exists(self) -> bool:
        """Check if configuration file exists.

        Returns:
            True if config file exists, False otherwise
        """
        return self.config_path.exists()

    def delete_config(self) -> bool:
        """Delete configuration file.

        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            if self.config_path.exists():
                self.config_path.unlink()
            return True
        except Exception:
            return False
