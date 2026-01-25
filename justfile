# justfile — Developer commands for error-translator monorepo

# Directory variables
BACKEND_DIR := "backend"
FRONTEND_DIR := "frontend"

# Default command: list all tasks
default:
    @just --list

# Show help with descriptions
help:
    @echo ""
    @echo "Available commands:"
    @echo "  just dev        - Run backend and frontend (placeholder)"
    @echo "  just backend    - Run backend only (placeholder)"
    @echo "  just frontend   - Run frontend only (placeholder)"
    @echo "  just test       - Run all tests (placeholder)"
    @echo "  just lint       - Run linters/formatters (placeholder)"
    @echo ""
    @echo "(These will become real commands as backend/frontend are implemented.)"

# Backend dev server (placeholder)
backend:
    echo "TODO: implement backend dev command"
    echo "Run backend manually from {{BACKEND_DIR}} for now."

# Frontend dev server (placeholder)
frontend:
    echo "TODO: implement frontend dev command"
    echo "Run frontend manually from {{FRONTEND_DIR}} for now."

# Full dev (FE + BE)
dev:
    echo "TODO: implement full dev environment (backend + frontend)"
    echo "For now, run backend and frontend in two terminals."

# Run tests
test:
    echo "TODO: implement pytest + vitest tests"

# Run linters
lint:
    echo "TODO: implement ruff + eslint linters"
