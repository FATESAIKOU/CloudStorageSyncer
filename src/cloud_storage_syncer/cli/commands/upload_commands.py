"""Upload commands for the CLI."""

from pathlib import Path
from typing import Annotated

import typer

from ...models import S3StorageClass, UploadRequest
from ...services import ConfigService, S3Service

app = typer.Typer()


@app.command()
def file(
    file_path: Annotated[Path, typer.Argument(help="Path to file to upload")],
    s3_key: Annotated[str | None, typer.Option(help="S3 key (path in bucket)")] = None,
    storage_class: Annotated[
        S3StorageClass | None, typer.Option(help="S3 storage class")
    ] = None,
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Upload a single file to S3."""
    # Load configuration
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    # Validate file exists
    if not file_path.exists():
        typer.echo(f"❌ File not found: {file_path}", err=True)
        raise typer.Exit(1)

    if not file_path.is_file():
        typer.echo(f"❌ Path is not a file: {file_path}", err=True)
        raise typer.Exit(1)

    # Generate S3 key if not provided
    if not s3_key:
        s3_key = file_path.name

    # Default storage class
    if not storage_class:
        storage_class = S3StorageClass.STANDARD

    # Create upload request
    request = UploadRequest(
        file_path=str(file_path), s3_key=s3_key, storage_class=storage_class
    )

    # Upload file
    typer.echo(f"📤 Uploading {file_path.name} to s3://{config.bucket}/{s3_key}")

    s3_service = S3Service(config)
    result = request.upload_with_service(s3_service)

    if result.success:
        typer.echo("✅ Upload successful!")
        typer.echo(f"   S3 URL: {result.s3_url}")
        typer.echo(f"   Storage Class: {result.storage_class}")
    else:
        typer.echo(f"❌ Upload failed: {result.error_message}", err=True)
        raise typer.Exit(1)


@app.command()
def directory(
    dir_path: Annotated[Path, typer.Argument(help="Directory to upload")],
    prefix: Annotated[
        str | None, typer.Option(help="S3 prefix for uploaded files")
    ] = None,
    storage_class: Annotated[
        S3StorageClass | None, typer.Option(help="S3 storage class")
    ] = None,
    recursive: Annotated[
        bool, typer.Option("--recursive", "-r", help="Upload recursively")
    ] = False,
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Upload all files in a directory to S3."""
    # Load configuration
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    # Validate directory exists
    if not dir_path.exists():
        typer.echo(f"❌ Directory not found: {dir_path}", err=True)
        raise typer.Exit(1)

    if not dir_path.is_dir():
        typer.echo(f"❌ Path is not a directory: {dir_path}", err=True)
        raise typer.Exit(1)

    # Default storage class
    if not storage_class:
        storage_class = S3StorageClass.STANDARD

    # Find files to upload
    pattern = "**/*" if recursive else "*"
    files = [f for f in dir_path.glob(pattern) if f.is_file()]

    if not files:
        typer.echo("❌ No files found to upload.", err=True)
        raise typer.Exit(1)

    typer.echo(f"📂 Found {len(files)} files to upload")

    # Upload files
    s3_service = S3Service(config)
    success_count = 0
    failed_files = []

    for file_path in files:
        # Generate S3 key
        relative_path = file_path.relative_to(dir_path)
        s3_key = str(relative_path)

        if prefix:
            s3_key = f"{prefix.rstrip('/')}/{s3_key}"

        # Create upload request
        request = UploadRequest(
            file_path=str(file_path), s3_key=s3_key, storage_class=storage_class
        )

        typer.echo(f"📤 Uploading {relative_path}")
        result = request.upload_with_service(s3_service)

        if result.success:
            success_count += 1
            typer.echo(f"   ✅ {result.s3_url}")
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


@app.command()
def batch(
    file_list: Annotated[
        Path, typer.Argument(help="Text file containing list of files to upload")
    ],
    storage_class: Annotated[
        S3StorageClass | None, typer.Option(help="S3 storage class")
    ] = None,
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Upload files from a list."""
    # Load configuration
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    # Read file list
    if not file_list.exists():
        typer.echo(f"❌ File list not found: {file_list}", err=True)
        raise typer.Exit(1)

    try:
        with open(file_list) as f:
            file_paths = [line.strip() for line in f if line.strip()]
    except Exception as e:
        typer.echo(f"❌ Error reading file list: {e}", err=True)
        raise typer.Exit(1) from e

    if not file_paths:
        typer.echo("❌ No files found in the list.", err=True)
        raise typer.Exit(1)

    # Default storage class
    if not storage_class:
        storage_class = S3StorageClass.STANDARD

    typer.echo(f"📂 Found {len(file_paths)} files to upload")

    # Upload files
    s3_service = S3Service(config)
    success_count = 0
    failed_files = []

    for file_path_str in file_paths:
        file_path = Path(file_path_str)

        # Validate file exists
        if not file_path.exists():
            failed_files.append((file_path, "File not found"))
            typer.echo(f"❌ File not found: {file_path}")
            continue

        if not file_path.is_file():
            failed_files.append((file_path, "Not a file"))
            typer.echo(f"❌ Not a file: {file_path}")
            continue

        # Use filename as S3 key
        s3_key = file_path.name

        # Create upload request
        request = UploadRequest(
            file_path=str(file_path), s3_key=s3_key, storage_class=storage_class
        )

        typer.echo(f"📤 Uploading {file_path.name}")
        result = request.upload_with_service(s3_service)

        if result.success:
            success_count += 1
            typer.echo(f"   ✅ {result.s3_url}")
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
