"""Authentication middleware and models for web API."""

import base64
import os

from fastapi import HTTPException, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials


class AuthConfig:
    """Authentication configuration from environment variables."""

    @classmethod
    def get_username(cls) -> str:
        """Get username from environment variable or use default."""
        return os.getenv("WEB_USERNAME", "admin")

    @classmethod
    def get_password(cls) -> str:
        """Get password from environment variable or use default."""
        return os.getenv("WEB_PASSWORD", "cloudsyncer2025")

    @classmethod
    def validate_credentials(cls, username: str, password: str) -> bool:
        """Validate provided credentials against configured values."""
        return username == cls.get_username() and password == cls.get_password()


class AuthService:
    """Service for handling authentication logic."""

    def __init__(self):
        self.security = HTTPBasic()

    def verify_credentials(self, credentials: HTTPBasicCredentials) -> bool:
        """Verify HTTP Basic Auth credentials."""
        return AuthConfig.validate_credentials(
            credentials.username, credentials.password
        )

    def extract_credentials_from_header(
        self, authorization: str
    ) -> tuple[str, str] | None:
        """Extract username and password from Authorization header."""
        try:
            if not authorization.startswith("Basic "):
                return None

            encoded_credentials = authorization.replace("Basic ", "")
            decoded_credentials = base64.b64decode(encoded_credentials).decode("utf-8")
            username, password = decoded_credentials.split(":", 1)
            return username, password
        except (ValueError, UnicodeDecodeError):
            return None


def require_auth(request: Request) -> bool:
    """Middleware function to require authentication for protected routes."""
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "data": None,
                "message": "Authentication required",
                "error": "Missing Authorization header",
                "error_code": "AUTH_001",
            },
            headers={"WWW-Authenticate": "Basic"},
        )

    auth_service = AuthService()
    credentials = auth_service.extract_credentials_from_header(auth_header)

    if not credentials:
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "data": None,
                "message": "Invalid authentication format",
                "error": "Malformed Authorization header",
                "error_code": "AUTH_002",
            },
            headers={"WWW-Authenticate": "Basic"},
        )

    username, password = credentials
    if not AuthConfig.validate_credentials(username, password):
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "data": None,
                "message": "Invalid credentials",
                "error": "Username or password incorrect",
                "error_code": "AUTH_002",
            },
            headers={"WWW-Authenticate": "Basic"},
        )

    return True
