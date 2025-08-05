"""List commands for the CLI."""

from pathlib import Path
from typing import Annotated

import typer

from ...services import ConfigService, S3Service

app = typer.Typer()


@app.command()
def files(
    prefix: Annotated[str | None, typer.Option(help="Prefix to filter files")] = "",
    max_count: Annotated[
        int, typer.Option("--max", help="Maximum number of files to show")
    ] = 100,
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
    show_details: Annotated[
        bool, typer.Option("--details", help="Show detailed information")
    ] = False,
):
    """List files in S3 bucket."""
    # Load configuration
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    # Create S3 service and list objects
    typer.echo(f"📋 Listing files in s3://{config.bucket}")
    if prefix:
        typer.echo(f"   🔍 Filter: {prefix}*")

    s3_service = S3Service(config)
    objects = s3_service.list_objects(prefix=prefix, max_keys=max_count)

    if not objects:
        typer.echo("📭 No files found.")
        return

    typer.echo(f"📊 Found {len(objects)} files:")
    typer.echo()

    if show_details:
        # Detailed view with table format
        typer.echo(
            "📁 File Name                           💾 Size       "
            "📅 Modified           🏷️  Storage Class"
        )
        typer.echo("─" * 90)

        for obj in objects:
            size_mb = obj["size"] / (1024 * 1024)
            if size_mb >= 1:
                size_str = f"{size_mb:.1f} MB"
            else:
                size_kb = obj["size"] / 1024
                if size_kb >= 1:
                    size_str = f"{size_kb:.1f} KB"
                else:
                    size_str = f"{obj['size']} B"

            modified_str = obj["last_modified"].strftime("%Y-%m-%d %H:%M")

            typer.echo(
                f"{obj['key']:<35} {size_str:>10} {modified_str:>16} "
                f"{obj['storage_class']:>15}"
            )
    else:
        # Simple view
        for obj in objects:
            size_mb = obj["size"] / (1024 * 1024)
            if size_mb >= 1:
                size_str = f"({size_mb:.1f} MB)"
            else:
                size_kb = obj["size"] / 1024
                if size_kb >= 1:
                    size_str = f"({size_kb:.1f} KB)"
                else:
                    size_str = f"({obj['size']} B)"

            storage_class = obj["storage_class"]
            if storage_class != "STANDARD":
                storage_info = f" [{storage_class}]"
            else:
                storage_info = ""

            typer.echo(f"📄 {obj['key']} {size_str}{storage_info}")


@app.command()
def storage_summary(
    prefix: Annotated[str | None, typer.Option(help="Prefix to filter files")] = "",
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Show storage class summary for files in S3 bucket."""
    # Load configuration
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    # Create S3 service and list objects
    typer.echo(f"📊 Storage summary for s3://{config.bucket}")
    if prefix:
        typer.echo(f"   🔍 Filter: {prefix}*")

    s3_service = S3Service(config)
    objects = s3_service.list_objects(
        prefix=prefix, max_keys=10000
    )  # Get more for summary

    if not objects:
        typer.echo("📭 No files found.")
        return

    # Calculate storage class statistics
    storage_stats = {}
    total_size = 0

    for obj in objects:
        storage_class = obj["storage_class"]
        size = obj["size"]
        total_size += size

        if storage_class not in storage_stats:
            storage_stats[storage_class] = {"count": 0, "size": 0}

        storage_stats[storage_class]["count"] += 1
        storage_stats[storage_class]["size"] += size

    typer.echo()
    typer.echo(f"📈 Total files: {len(objects)}")

    # Better size formatting
    if total_size >= 1024 * 1024 * 1024:  # GB
        total_size_str = f"{total_size / (1024 * 1024 * 1024):.2f} GB"
    elif total_size >= 1024 * 1024:  # MB
        total_size_str = f"{total_size / (1024 * 1024):.2f} MB"
    elif total_size >= 1024:  # KB
        total_size_str = f"{total_size / 1024:.2f} KB"
    else:  # Bytes
        total_size_str = f"{total_size} B"

    typer.echo(f"💾 Total size: {total_size_str}")
    typer.echo()
    typer.echo("🏷️  Storage Class Breakdown:")
    typer.echo("─" * 60)

    for storage_class, stats in sorted(storage_stats.items()):
        count = stats["count"]
        size_bytes = stats["size"]

        # Better size formatting for each storage class
        if size_bytes >= 1024 * 1024 * 1024:  # GB
            size_str = f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
        elif size_bytes >= 1024 * 1024:  # MB
            size_str = f"{size_bytes / (1024 * 1024):.2f} MB"
        elif size_bytes >= 1024:  # KB
            size_str = f"{size_bytes / 1024:.2f} KB"
        else:  # Bytes
            size_str = f"{size_bytes} B"

        percentage = (stats["size"] / total_size) * 100 if total_size > 0 else 0

        typer.echo(
            f"{storage_class:<20} {count:>6} files  {size_str:>12}  "
            f"({percentage:>5.1f}%)"
        )


@app.command()
def search(
    pattern: Annotated[str, typer.Argument(help="Search pattern for file names")],
    config_path: Annotated[Path | None, typer.Option(help="Config file path")] = None,
):
    """Search for files by name pattern."""
    # Load configuration
    config_service = ConfigService(config_path)
    config = config_service.load_config()

    if not config:
        typer.echo("❌ No configuration found. Run 'config setup' first.", err=True)
        raise typer.Exit(1)

    # Create S3 service and list objects
    typer.echo(f"🔍 Searching for files matching '{pattern}' in s3://{config.bucket}")

    s3_service = S3Service(config)
    all_objects = s3_service.list_objects(max_keys=10000)

    # Filter objects by pattern
    matching_objects = [
        obj for obj in all_objects if pattern.lower() in obj["key"].lower()
    ]

    if not matching_objects:
        typer.echo(f"📭 No files found matching '{pattern}'.")
        return

    typer.echo(f"📊 Found {len(matching_objects)} matching files:")
    typer.echo()

    for obj in matching_objects:
        size_mb = obj["size"] / (1024 * 1024)
        if size_mb >= 1:
            size_str = f"({size_mb:.1f} MB)"
        else:
            size_kb = obj["size"] / 1024
            if size_kb >= 1:
                size_str = f"({size_kb:.1f} KB)"
            else:
                size_str = f"({obj['size']} B)"

        storage_class = obj["storage_class"]
        if storage_class != "STANDARD":
            storage_info = f" [{storage_class}]"
        else:
            storage_info = ""

        modified_str = obj["last_modified"].strftime("%Y-%m-%d %H:%M")
        typer.echo(f"📄 {obj['key']} {size_str}{storage_info} - {modified_str}")
