# CloudStorageSyncer

A personal cloud storage syncer using AWS S3.

## 🚀 Features

This is the base project foundation providing:

- **Development Tools**: Code formatting and static analysis with ruff
- **Testing**: Comprehensive testing with pytest, coverage, and HTML reports
- **CI/CD**: GitHub Actions pipeline with automated testing and Docker builds
- **Code Quality**: Pre-commit hooks for automated code quality checks
- **Containerization**: Docker and Docker Compose support
- **CLI Interface**: Modern CLI using Typer

## 🛠️ Development Setup

### Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FATESAIKOU/CloudStorageSyncer.git
cd CloudStorageSyncer
```

2. Install dependencies:
```bash
uv sync
```

3. Install pre-commit hooks:
```bash
uv run pre-commit install
```

### Usage

Run the CLI application:
```bash
# Show version
uv run cloud-storage-syncer version

# Health check
uv run cloud-storage-syncer health

# Show project info
uv run cloud-storage-syncer info

# Show help
uv run cloud-storage-syncer --help
```

## 🧪 Testing

Run tests with coverage:
```bash
# Run all tests
uv run pytest

# Run with coverage report
uv run pytest --cov=src/cloud_storage_syncer --cov-report=html

# Run specific test file
uv run pytest tests/test_basic.py
```

## 🔧 Code Quality

Format and lint code:
```bash
# Format code
uv run ruff format

# Check linting
uv run ruff check

# Run all pre-commit hooks
uv run pre-commit run --all-files
```

## 🐳 Docker

Build and run with Docker:
```bash
# Build image
docker build -t cloud-storage-syncer .

# Run container
docker run --rm cloud-storage-syncer version

# Using docker-compose
docker-compose up cloud-storage-syncer
```

## 📦 Project Structure

```
CloudStorageSyncer/
├── src/
│   └── cloud_storage_syncer/
│       ├── __init__.py
│       ├── cli/
│       │   ├── __init__.py
│       │   └── main.py
│       └── core/
│           └── __init__.py
├── tests/
│   ├── __init__.py
│   └── test_basic.py
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
├── pyproject.toml
├── .pre-commit-config.yaml
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## 📋 Requirements

- Python 3.13+
- Dependencies managed by uv
- All development tools configured via pyproject.toml

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

FATESAIKOU
