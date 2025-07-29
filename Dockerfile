# Use Python 3.13 image as base
FROM python:3.13

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src

# Set work directory
WORKDIR /app

# Install uv using system Python
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Copy project files
COPY pyproject.toml uv.lock ./
COPY src/ ./src/
COPY README.md ./

# Install dependencies directly to system Python (no venv)
RUN uv pip install --system -r pyproject.toml

# Install the project itself
RUN uv pip install --system -e .

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app

USER appuser

# Set entry point directly to the installed command
ENTRYPOINT ["cloud-storage-syncer"]

# Default command
CMD ["--help"]
