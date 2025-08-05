"""Tests for the models package."""

from cloud_storage_syncer.models import (
    S3Config,
    S3StorageClass,
    UploadRequest,
    UploadResult,
)


class TestS3Config:
    """Test S3Config model."""

    def test_valid_config(self):
        """Test valid configuration."""
        config = S3Config(
            access_key="test_key",
            secret_key="test_secret",
            bucket="test-bucket",
            region="us-east-1",
        )
        assert config.is_valid() is True

    def test_invalid_config_empty_fields(self):
        """Test invalid configuration with empty fields."""
        config = S3Config(
            access_key="",
            secret_key="test_secret",
            bucket="test-bucket",
            region="us-east-1",
        )
        assert config.is_valid() is False

        config = S3Config(
            access_key="test_key",
            secret_key="",
            bucket="test-bucket",
            region="us-east-1",
        )
        assert config.is_valid() is False

        config = S3Config(
            access_key="test_key",
            secret_key="test_secret",
            bucket="",
            region="us-east-1",
        )
        assert config.is_valid() is False

        config = S3Config(
            access_key="test_key",
            secret_key="test_secret",
            bucket="test-bucket",
            region="",
        )
        assert config.is_valid() is False


class TestS3StorageClass:
    """Test S3StorageClass enum."""

    def test_storage_classes(self):
        """Test storage class values."""
        assert S3StorageClass.STANDARD.value == "STANDARD"
        assert S3StorageClass.INTELLIGENT_TIERING.value == "INTELLIGENT_TIERING"
        assert S3StorageClass.STANDARD_IA.value == "STANDARD_IA"
        assert S3StorageClass.ONEZONE_IA.value == "ONEZONE_IA"
        assert S3StorageClass.GLACIER.value == "GLACIER"
        assert S3StorageClass.GLACIER_IR.value == "GLACIER_IR"
        assert S3StorageClass.DEEP_ARCHIVE.value == "DEEP_ARCHIVE"


class TestUploadRequest:
    """Test UploadRequest model."""

    def test_create_request(self):
        """Test creating upload request."""
        request = UploadRequest(
            file_path="/path/to/file.txt",
            s3_key="uploads/file.txt",
            storage_class=S3StorageClass.STANDARD,
        )
        assert request.file_path == "/path/to/file.txt"
        assert request.s3_key == "uploads/file.txt"
        assert request.storage_class == S3StorageClass.STANDARD

    def test_create_request_no_storage_class(self):
        """Test creating upload request without storage class."""
        request = UploadRequest(
            file_path="/path/to/file.txt", s3_key="uploads/file.txt"
        )
        assert request.file_path == "/path/to/file.txt"
        assert request.s3_key == "uploads/file.txt"
        assert request.storage_class is None


class TestUploadResult:
    """Test UploadResult model."""

    def test_success_result(self):
        """Test creating success result."""
        result = UploadResult.success(
            s3_url="s3://bucket/key", storage_class="STANDARD"
        )
        assert result.success is True
        assert result.s3_url == "s3://bucket/key"
        assert result.storage_class == "STANDARD"
        assert result.error_message == ""

    def test_error_result(self):
        """Test creating error result."""
        result = UploadResult.error("Upload failed")
        assert result.success is False
        assert result.error_message == "Upload failed"
        assert result.s3_url == ""
        assert result.storage_class == ""
