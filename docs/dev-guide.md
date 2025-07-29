# Development Guide

## 🚀 Quick Start

### 1. Setup Development Environment

```bash
# Clone repository
git clone https://github.com/FATESAIKOU/CloudStorageSyncer.git
cd CloudStorageSyncer

# Activate virtual environment
source .venv/bin/activate

# Install pre-commit hooks
pre-commit install
```

### 2. Development Workflow

```bash
# Make your changes
vim src/cloud_storage_syncer/...

# Run code quality checks
ruff format src tests
ruff check src tests

# Run tests
pytest tests/ -v

# All checks
pre-commit run --all-files
```

### 3. Testing

```bash
# Run all tests with coverage
pytest tests/ --cov=src/cloud_storage_syncer --cov-report=html

# View coverage report
open htmlcov/index.html
```

## 🛠️ Available Commands

### CLI Commands
- `cloud-storage-syncer version` - Show version
- `cloud-storage-syncer health` - Health check
- `cloud-storage-syncer info` - Project information
- `cloud-storage-syncer --help` - Show help

### Development Commands
- `pytest` - Run tests
- `ruff format` - Format code
- `ruff check` - Lint code
- `pre-commit run --all-files` - Run all hooks

### Docker Commands
- `docker build -t cloud-storage-syncer .` - Build image
- `docker run --rm cloud-storage-syncer version` - Run CLI
- `docker-compose up cloud-storage-syncer` - Run with compose

## 📁 Project Structure

```
src/cloud_storage_syncer/
├── __init__.py          # Package initialization
├── cli/                 # CLI interface
│   ├── __init__.py
│   └── main.py         # Typer CLI app
└── core/               # Core business logic
    └── __init__.py

tests/                  # Test suite
├── __init__.py
└── test_basic.py      # Basic functionality tests

.github/workflows/      # CI/CD
└── ci.yml             # GitHub Actions

docs/                  # Documentation
└── dev-guide.md       # This file
```

## 🔧 Configuration Files

- `pyproject.toml` - Project config, dependencies, tool settings
- `.pre-commit-config.yaml` - Git hooks configuration
- `Dockerfile` - Container definition
- `docker-compose.yml` - Container orchestration
- `.gitignore` - Git ignore patterns

## 📊 Code Quality Standards

- **Coverage**: Maintain >85% test coverage
- **Formatting**: Use ruff format
- **Linting**: Pass all ruff checks
- **Documentation**: Document all public APIs
- **Tests**: Write tests for all new features

## 🐳 Docker Development

```bash
# Build development image
docker-compose build

# Run CLI commands
docker-compose run --rm cloud-storage-syncer version
docker-compose run --rm cloud-storage-syncer health

# Development with live reload
docker-compose run --rm dev bash
```
