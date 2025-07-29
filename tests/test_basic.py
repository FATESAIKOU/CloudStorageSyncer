"""Basic tests for the CloudStorageSyncer application."""

from typer.testing import CliRunner

from cloud_storage_syncer import __version__
from cloud_storage_syncer.cli.main import app


class TestBasicFunctionality:
    """Test basic application functionality."""

    def setup_method(self) -> None:
        """Set up test fixtures."""
        self.runner = CliRunner()

    def test_version_command(self) -> None:
        """Test version command."""
        result = self.runner.invoke(app, ["version"])
        assert result.exit_code == 0
        assert __version__ in result.stdout

    def test_health_command(self) -> None:
        """Test health command."""
        result = self.runner.invoke(app, ["health"])
        assert result.exit_code == 0
        assert "healthy" in result.stdout

    def test_info_command(self) -> None:
        """Test info command."""
        result = self.runner.invoke(app, ["info"])
        assert result.exit_code == 0
        assert "CloudStorageSyncer" in result.stdout
        assert __version__ in result.stdout

    def test_help_command(self) -> None:
        """Test help command."""
        result = self.runner.invoke(app, ["--help"])
        assert result.exit_code == 0
        assert "cloud storage syncer" in result.stdout.lower()


class TestVersionInfo:
    """Test version and metadata information."""

    def test_version_format(self) -> None:
        """Test version format is valid."""
        assert isinstance(__version__, str)
        assert len(__version__.split(".")) >= 2

    def test_version_not_empty(self) -> None:
        """Test version is not empty."""
        assert __version__
        assert __version__ != "0.0.0"
