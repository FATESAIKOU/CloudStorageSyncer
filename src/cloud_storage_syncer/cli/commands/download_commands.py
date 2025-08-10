"""Download commands for the CLI."""

from pathlib import Path
from typing import Annotated

import typer

from ...models import DownloadRequest
from ...services import ConfigService, S3Service

app = typer.Typer()


@app.command()
def file(
    s3_key: Annotated[str, typer.Argument(help="S3 key of file to download")],
    output_path: Annotated[
        str | None, typer.Option("--output-path", "-o", help="Local output file path")
    ] = None,
    output_dir: Annotated[
        str | None, typer.Option("--output-dir", "-d", help="Local output directory")
    ] = None,
    overwrite: Annotated[
        bool, typer.Option("--overwrite", help="Overwrite existing local file")
    ] = False,
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Download a single file from S3."""
    # Validate arguments
    if output_path and output_dir:
        typer.echo("❌ Cannot specify both --output-path and --output-dir", err=True)
        raise typer.Exit(1)

    # Load configuration
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    # Handle output directory option
    final_output_path = output_path
    if output_dir:
        output_dir_path = Path(output_dir)
        filename = Path(s3_key).name
        final_output_path = str(output_dir_path / filename)

    # Create download request
    request = DownloadRequest(
        s3_key=s3_key, output_path=final_output_path, overwrite=overwrite
    )

    # Download file
    typer.echo(f"📥 Downloading s3://{config.bucket}/{s3_key}")
    if final_output_path:
        typer.echo(f"   📍 Target: {final_output_path}")

    s3_service = S3Service(config)
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
