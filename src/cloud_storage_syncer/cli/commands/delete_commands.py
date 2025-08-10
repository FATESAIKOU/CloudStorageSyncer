"""Delete commands for the CLI."""

from pathlib import Path
from typing import Annotated

import typer

from ...services import ConfigService, S3Service

app = typer.Typer()


@app.command()
def file(
    s3_key: Annotated[
        str, typer.Argument(help="S3 key (file or directory prefix) to delete")
    ],
    force: Annotated[
        bool,
        typer.Option("--force", "-f", help="Force deletion without additional checks"),
    ] = False,
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Delete a file or directory from S3."""
    # Load configuration
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    s3_service = S3Service(config)

    # Check if this is a directory by listing objects with the prefix
    objects = s3_service.list_objects(prefix=s3_key)

    # Determine if it's a single file or directory
    exact_match = any(obj["key"] == s3_key for obj in objects)
    has_children = any(obj["key"].startswith(s3_key + "/") for obj in objects)

    if exact_match and not has_children:
        # Single file delete
        typer.echo(f"🗑️  Deleting s3://{config.bucket}/{s3_key}")

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

    elif has_children or (objects and not exact_match):
        # Directory delete
        typer.echo(f"🗑️  Deleting directory s3://{config.bucket}/{s3_key}/")

        results = s3_service.delete_directory(s3_key, force)

        # Count results
        successful = sum(1 for r in results if r.success)
        failed = sum(1 for r in results if not r.success)
        total_existed = sum(
            1
            for r in results
            if r.success and getattr(r, "existed_before_delete", True)
        )

        if failed == 0:
            typer.echo("✅ Directory delete successful!")
            typer.echo(f"   🗑️  Deleted {successful} files")
            if successful != total_existed:
                typer.echo(
                    f"   ℹ️  {successful - total_existed} files were already deleted"
                )
        else:
            typer.echo("⚠️  Directory delete completed with errors:")
            typer.echo(f"   ✅ Successful: {successful}")
            typer.echo(f"   ❌ Failed: {failed}")

            # Show failed files
            for result in results:
                if not result.success:
                    typer.echo(f"   ❌ {result.s3_key}: {result.error_message}")

            if successful == 0:
                raise typer.Exit(1)
    else:
        if not force:
            typer.echo(
                f"❌ No files found matching: s3://{config.bucket}/{s3_key}",
                err=True,
            )
            typer.echo(
                "   💡 Use --force to suppress this error for non-existent files"
            )
            raise typer.Exit(1)
        else:
            typer.echo(
                f"✅ Delete operation completed (no files found matching: {s3_key})"
            )
