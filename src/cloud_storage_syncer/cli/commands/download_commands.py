"""Download commands for the CLI."""

from pathlib import Path
from typing import Annotated

import typer

from ...models import DownloadRequest
from ...services import ConfigService, S3Service

app = typer.Typer()


@app.command()
def file(
    s3_key: Annotated[
        str, typer.Argument(help="S3 key (file or directory prefix) to download")
    ],
    output_path: Annotated[
        str | None,
        typer.Option(
            "--output-path", "-o", help="Local output path (file or directory)"
        ),
    ] = None,
    force: Annotated[
        bool, typer.Option("--force", help="Overwrite existing files")
    ] = False,
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Download a file or directory from S3."""
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
        # Single file download
        request = DownloadRequest(s3_key=s3_key, output_path=output_path, force=force)

        typer.echo(f"📥 Downloading s3://{config.bucket}/{s3_key}")
        if output_path:
            typer.echo(f"   📍 Target: {output_path}")

        result = s3_service.download_file(request)

        if result.success:
            typer.echo("✅ Download successful!")
            typer.echo(f"   📄 File: {result.local_path}")
            if result.file_size:
                # Format file size
                size_mb = result.file_size / (1024 * 1024)
                if size_mb >= 1:
                    size_str = f"{size_mb:.1f} MB"
                else:
                    size_kb = result.file_size / 1024
                    if size_kb >= 1:
                        size_str = f"{size_kb:.1f} KB"
                    else:
                        size_str = f"{result.file_size} B"
                typer.echo(f"   📊 Size: {size_str}")
        else:
            typer.echo(f"❌ Download failed: {result.error_message}", err=True)
            raise typer.Exit(1)

    elif has_children or (objects and not exact_match):
        # Directory download
        if output_path:
            local_dir = Path(output_path)
        else:
            # Use the last part of the S3 key as the local directory name
            dir_name = s3_key.rstrip("/").split("/")[-1] or "download"
            local_dir = Path.cwd() / dir_name

        typer.echo(
            f"📂 Downloading directory s3://{config.bucket}/{s3_key}/ to {local_dir}/"
        )

        results = s3_service.download_directory(s3_key, local_dir, force)

        # Count results
        successful = sum(1 for r in results if r.success)
        failed = sum(1 for r in results if not r.success)

        if failed == 0:
            typer.echo("✅ Directory download successful!")
            typer.echo(f"   📁 Downloaded {successful} files to {local_dir}/")
        else:
            typer.echo("⚠️  Directory download completed with errors:")
            typer.echo(f"   ✅ Successful: {successful}")
            typer.echo(f"   ❌ Failed: {failed}")

            # Show failed files
            for result in results:
                if not result.success:
                    typer.echo(f"   ❌ {result.s3_key}: {result.error_message}")

            if successful == 0:
                raise typer.Exit(1)
    else:
        typer.echo(
            f"❌ No files found matching: s3://{config.bucket}/{s3_key}", err=True
        )
        raise typer.Exit(1)
