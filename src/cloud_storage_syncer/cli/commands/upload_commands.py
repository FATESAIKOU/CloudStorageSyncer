"""Upload commands for the CLI."""

from pathlib import Path
from typing import Annotated

import typer

from ...models import S3StorageClass, UploadRequest
from ...services import ConfigService, S3Service

app = typer.Typer()


@app.command()
def file(
    path: Annotated[Path, typer.Argument(help="Path to file or directory to upload")],
    s3_key: Annotated[str | None, typer.Option(help="S3 key/prefix for upload")] = None,
    storage_class: Annotated[
        S3StorageClass | None, typer.Option(help="S3 storage class")
    ] = None,
    recursive: Annotated[
        bool, typer.Option("--recursive", "-r", help="Upload directory recursively")
    ] = False,
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Upload a file or directory to S3."""
    # Load configuration
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    # Validate path exists
    if not path.exists():
        typer.echo(f"❌ Path not found: {path}", err=True)
        raise typer.Exit(1)

    # Default storage class
    if not storage_class:
        storage_class = S3StorageClass.STANDARD

    s3_service = S3Service(config)

    if path.is_file():
        # Upload single file
        # Generate S3 key if not provided
        if not s3_key:
            s3_key = path.name

        # Create upload request
        request = UploadRequest(
            file_path=str(path), s3_key=s3_key, storage_class=storage_class
        )

        # Upload file
        typer.echo(f"📤 Uploading {path.name} to s3://{config.bucket}/{s3_key}")

        result = request.upload_with_service(s3_service)

        if result.success:
            typer.echo("✅ Upload successful!")
            typer.echo(f"   🗂️  S3 URL: {result.s3_url}")
            typer.echo(f"   📦 Storage Class: {result.storage_class}")
        else:
            typer.echo(f"❌ Upload failed: {result.error_message}", err=True)
            raise typer.Exit(1)

    elif path.is_dir():
        # Upload directory
        # Find files to upload
        pattern = "**/*" if recursive else "*"
        files = [f for f in path.glob(pattern) if f.is_file()]

        if not files:
            typer.echo("❌ No files found to upload.", err=True)
            raise typer.Exit(1)

        typer.echo(f"📂 Found {len(files)} files to upload")

        # Upload files
        success_count = 0
        failed_files = []

        for file_path in files:
            # Generate S3 key
            relative_path = file_path.relative_to(path)
            file_s3_key = str(relative_path)

            if s3_key:
                file_s3_key = f"{s3_key.rstrip('/')}/{file_s3_key}"

            # Create upload request
            request = UploadRequest(
                file_path=str(file_path),
                s3_key=file_s3_key,
                storage_class=storage_class,
            )

            typer.echo(f"📤 Uploading {relative_path}")
            result = request.upload_with_service(s3_service)

            if result.success:
                success_count += 1
                typer.echo(f"   ✅ s3://{config.bucket}/{file_s3_key}")
            else:
                failed_files.append((file_path, result.error_message))
                typer.echo(f"   ❌ Failed: {result.error_message}")

        # Summary
        typer.echo("\n📊 Upload Summary:")
        typer.echo(f"   ✅ Successful: {success_count}")
        typer.echo(f"   ❌ Failed: {len(failed_files)}")

        if failed_files:
            typer.echo("\n❌ Failed uploads:")
            for file_path, error in failed_files:
                typer.echo(f"   {file_path}: {error}")
            raise typer.Exit(1)
    else:
        typer.echo(f"❌ Path is neither file nor directory: {path}", err=True)
        raise typer.Exit(1)
