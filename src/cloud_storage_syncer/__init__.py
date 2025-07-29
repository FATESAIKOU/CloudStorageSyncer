"""CloudStorageSyncer - A personal cloud storage syncer using AWS S3."""

__version__ = "0.1.0"
__author__ = "FATESAIKOU"
__description__ = "A personal cloud storage syncer using AWS S3"


def main() -> None:
    """Main entry point for the CLI application."""
    from cloud_storage_syncer.cli.main import app

    app()
