"""Web API for CloudStorageSyncer using FastAPI."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .web.auth import require_auth
from .web.models import ApiResponse
from .web.routes import router as files_router

app = FastAPI(
    title="CloudStorageSyncer Web API",
    description="Web API for CloudStorageSyncer file operations",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include file operations router
app.include_router(files_router)


@app.get("/health")
async def health_check():
    """Health check endpoint (no auth required)."""
    return ApiResponse.success_response(
        data={"status": "healthy", "service": "CloudStorageSyncer Web API"},
        message="Service is running normally",
    )


@app.get("/auth/verify")
async def verify_auth(request: Request):
    """Verify authentication credentials."""
    require_auth(request)  # This will raise HTTPException if auth fails
    return ApiResponse.success_response(
        data={"authenticated": True, "user": "admin"},
        message="Authentication verified successfully",
    )
