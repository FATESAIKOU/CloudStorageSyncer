"""S3 storage class enumeration."""

from enum import Enum


class S3StorageClass(str, Enum):
    """S3 storage class enumeration."""

    STANDARD = "STANDARD"
    INTELLIGENT_TIERING = "INTELLIGENT_TIERING"
    STANDARD_IA = "STANDARD_IA"
    ONEZONE_IA = "ONEZONE_IA"
    GLACIER_IR = "GLACIER_IR"  # Instant Retrieval
    GLACIER = "GLACIER"  # Flexible Retrieval
    DEEP_ARCHIVE = "DEEP_ARCHIVE"
