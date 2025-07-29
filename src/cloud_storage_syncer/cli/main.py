"""Main CLI application using Typer."""

import typer

from cloud_storage_syncer import __description__, __version__

app = typer.Typer(
    name="cloud-storage-syncer",
    help=__description__,
    add_completion=False,
)


@app.command()
def version() -> None:
    """Show version information."""
    typer.echo(f"CloudStorageSyncer version {__version__}")


@app.command()
def health() -> None:
    """Health check command."""
    typer.echo("✅ CloudStorageSyncer is healthy!")


@app.command()
def info() -> None:
    """Show project information."""
    typer.echo("📦 Project: CloudStorageSyncer")
    typer.echo(f"🏷️  Version: {__version__}")
    typer.echo(f"📝 Description: {__description__}")
    typer.echo("👤 Author: FATESAIKOU")


if __name__ == "__main__":
    app()
