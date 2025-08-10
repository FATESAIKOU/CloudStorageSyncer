"""Delete commands for the CLI."""

from pathlib import Path
from typing import Annotated

import typer

from ...services import ConfigService, S3Service

app = typer.Typer()


@app.command()
def file(
    s3_key: Annotated[str, typer.Argument(help="S3 key of file to delete")],
    force: Annotated[
        bool, typer.Option("--force", "-f", help="Skip confirmation prompt")
    ] = False,
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Delete a single file from S3."""
    # Load configuration
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    # Confirm deletion if not forced
    if not force:
        confirm = typer.confirm(
            f"⚠️  Are you sure you want to delete "
            f"'s3://{config.bucket}/{s3_key}' from S3?",
            default=False,
        )
        if not confirm:
            typer.echo("🚫 Operation cancelled.")
            return

    # Delete file
    typer.echo(f"🗑️  Deleting s3://{config.bucket}/{s3_key}")

    s3_service = S3Service(config)
    result = s3_service.delete_file(s3_key)

    if result.success:
        if result.existed_before_delete:
            typer.echo("✅ File deleted successfully!")
        else:
            typer.echo("✅ Delete operation completed (file was already deleted).")
        typer.echo(f"   🗂️  S3 Key: {result.s3_key}")
    else:
        typer.echo(f"❌ Delete failed: {result.error_message}", err=True)
        raise typer.Exit(1)
