"""Configuration commands for the CLI."""

from pathlib import Path
from typing import Annotated

import typer

from ...models import S3Config
from ...services import ConfigService, S3Service

app = typer.Typer()


@app.command()
def setup(
    access_key: Annotated[str, typer.Option(help="AWS access key ID")] = None,
    secret_key: Annotated[str, typer.Option(help="AWS secret access key")] = None,
    bucket: Annotated[str, typer.Option(help="S3 bucket name")] = None,
    region: Annotated[str, typer.Option(help="AWS region")] = None,
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
    test_connection: Annotated[
        bool, typer.Option("--test/--no-test", help="Test connection after setup")
    ] = True,
):
    """Set up S3 configuration."""
    config_service = ConfigService(config_path)

    # Prompt for missing values
    if not access_key:
        access_key = typer.prompt("AWS Access Key ID", hide_input=True)

    if not secret_key:
        secret_key = typer.prompt("AWS Secret Access Key", hide_input=True)

    if not bucket:
        bucket = typer.prompt("S3 Bucket name")

    if not region:
        region = typer.prompt("AWS Region", default="us-east-1")

    # Create and validate config
    config = S3Config(
        access_key=access_key, secret_key=secret_key, bucket=bucket, region=region
    )

    if not config.is_valid():
        typer.echo("❌ Invalid configuration provided", err=True)
        raise typer.Exit(1)

    # Test connection if requested
    if test_connection:
        typer.echo("🔍 Testing S3 connection...")
        s3_service = S3Service(config)
        if not s3_service.test_connection():
            typer.echo(
                "❌ Failed to connect to S3. Please check your credentials and bucket.",
                err=True,
            )
            raise typer.Exit(1)
        typer.echo("✅ S3 connection successful!")

    # Save configuration
    if config_service.save_config(config):
        typer.echo(f"✅ Configuration saved to {config_service.config_path}")
    else:
        typer.echo("❌ Failed to save configuration", err=True)
        raise typer.Exit(1)


@app.command()
def show(
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Show current configuration."""
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    typer.echo("📋 Current S3 Configuration:")
    typer.echo(f"   Access Key: {config.access_key[:8]}...")
    typer.echo(f"   Bucket: {config.bucket}")
    typer.echo(f"   Region: {config.region}")
    typer.echo(f"   Config file: {config_service.config_path}")


@app.command()
def test(
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Test S3 connection."""
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    typer.echo("🔍 Testing S3 connection...")
    s3_service = S3Service(config)

    if s3_service.test_connection():
        typer.echo("✅ S3 connection successful!")
    else:
        typer.echo(
            "❌ Failed to connect to S3. Please check your configuration.", err=True
        )
        raise typer.Exit(1)


@app.command()
def remove(
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Remove configuration file."""
    config_service = ConfigService(config_path)

    if not config_service.config_exists():
        typer.echo("❌ No configuration file found.", err=True)
        raise typer.Exit(1)

    if config_service.delete_config():
        typer.echo("✅ Configuration removed successfully.")
    else:
        typer.echo("❌ Failed to remove configuration.", err=True)
        raise typer.Exit(1)
