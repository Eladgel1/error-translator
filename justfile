# =========================================
# JUSTFILE — Developer commands for error-translator monorepo
# =========================================

# Directory variables
BACKEND_DIR := "backend"
FRONTEND_DIR := "frontend"

# Default command: list all tasks
default:
    @just help

# -----------------------------------------
# HELP
# -----------------------------------------
help:
    @echo ""
    @echo "Available commands:"
    @echo "  just backend-dev       - Run backend dev server (requires venv)"
    @echo "  just test-backend      - Run backend tests (pytest)"
    @echo "  just lint-backend      - Run backend linter (ruff check)"
    @echo "  just format-backend    - Format backend code (ruff format)"
    @echo "  just test              - Run all tests (currently backend only)"
    @echo "  just lint              - Run all linters (currently backend only)"
    @echo ""
    @echo "Tip: for backend Python commands, activate the venv first:"
    @echo "  cd backend && .\\.venv\\Scripts\\Activate.ps1"

# -----------------------------------------
# BACKEND DEV SERVER
# -----------------------------------------
backend-dev:
    cd {{BACKEND_DIR}} && python -m uvicorn app.main:app --reload

# -----------------------------------------
# BACKEND TESTS
# -----------------------------------------
test-backend:
    cd {{BACKEND_DIR}} && pytest

# -----------------------------------------
# BACKEND LINT
# -----------------------------------------
lint-backend:
    cd {{BACKEND_DIR}} && ruff check app tests

# -----------------------------------------
# BACKEND FORMATTER
# -----------------------------------------
format-backend:
    cd {{BACKEND_DIR}} && ruff format app tests

# -----------------------------------------
# GLOBAL ALIASES
# -----------------------------------------
test: test-backend

lint: lint-backend
