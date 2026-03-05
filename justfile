# =========================================
# JUSTFILE - Developer commands for error-translator monorepo
# =========================================

# Force Just to use Windows cmd.exe
set windows-shell := ["cmd.exe", "/C"]

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
    @echo "  just backend-dev                 - Run backend dev server (requires venv)"
    @echo "  just test-backend                - Run backend tests (pytest)"
    @echo "  just test-backend-cov            - Run backend tests with coverage"
    @echo "  just lint-backend                - Run backend linter (ruff check)"
    @echo "  just format-backend              - Format backend code (ruff format)"
    @echo ""
    @echo "  just frontend-dev                - Run frontend dev server (Vite)"
    @echo "  just test-frontend               - Run frontend unit tests (Vitest)"
    @echo "  just test-frontend-e2e           - Run frontend E2E tests (Playwright)"
    @echo "  just lint-frontend               - Run frontend linter (ESLint)"
    @echo "  just format-frontend             - Format frontend code (Prettier)"
    @echo "  just build-frontend              - Build frontend for production"
    @echo "  just install-frontend            - Install frontend dependencies"
    @echo ""
    @echo "  just build-backend-docker        - Build backend Docker image"
    @echo "  just run-backend-docker          - Run backend Docker container with local .env"
    @echo "  just build-frontend-docker-dev   - Build frontend Docker image for development"
    @echo "  just run-frontend-docker-dev     - Run frontend Docker container for development"
    @echo "  just build-frontend-docker-prod  - Build frontend Docker image for production"
    @echo "  just run-frontend-docker-prod    - Run frontend Docker container for production"
    @echo ""
    @echo "  just compose-up                  - Build and start the full stack locally (frontend + backend)"
    @echo "  just compose-up-detached         - Build and start the full stack in detached mode"
    @echo "  just compose-down                - Stop and remove the full Docker Compose stack"
    @echo ""
    @echo "Tip: activate backend virtualenv first:"
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

test-backend-cov:
    cd {{BACKEND_DIR}} && pytest --cov=app --cov-report=term-missing

# -----------------------------------------
# BACKEND LINTER
# -----------------------------------------
lint-backend:
    cd {{BACKEND_DIR}} && ruff check app tests

# -----------------------------------------
# BACKEND FORMATTER
# -----------------------------------------
format-backend:
    cd {{BACKEND_DIR}} && ruff format app tests

# -----------------------------------------
# BACKEND DOCKER
# -----------------------------------------

build-backend-docker:
    docker build -t error-translator-backend -f backend/Dockerfile backend

run-backend-docker:
    docker run -d --rm -p 8000:8000 --env-file backend/.env error-translator-backend

# =========================================
# FRONTEND COMMANDS
# =========================================

# -----------------------------------------
# FRONTEND DEV SERVER
# -----------------------------------------
frontend-dev:
    cd {{FRONTEND_DIR}} && npm run dev

# -----------------------------------------
# FRONTEND INSTALL
# -----------------------------------------
install-frontend:
    cd {{FRONTEND_DIR}} && npm install

# -----------------------------------------
# FRONTEND BUILD
# -----------------------------------------
build-frontend:
    cd {{FRONTEND_DIR}} && npm run build

# -----------------------------------------
# FRONTEND TESTS
# -----------------------------------------
test-frontend:
    cd {{FRONTEND_DIR}} && npm run test
    
# -----------------------------------------
# FRONTEND LINTER (ESLINT)
# -----------------------------------------
lint-frontend:
    cd {{FRONTEND_DIR}} && npm run lint

# -----------------------------------------
# FRONTEND FORMATTER (PRETTIER)
# -----------------------------------------
format-frontend:
    cd {{FRONTEND_DIR}} && npm run format

# =========================================
# FRONTEND DOCKER
# =========================================

# Build frontend Docker image for dev
build-frontend-docker-dev:
    cd {{FRONTEND_DIR}} && npm run docker:build:dev

# Run frontend Docker container for dev
run-frontend-docker-dev:
    cd {{FRONTEND_DIR}} && npm run docker:run:dev

# Build frontend Docker image for prod
build-frontend-docker-prod:
    cd {{FRONTEND_DIR}} && npm run docker:build:prod

# Run frontend Docker container for prod
run-frontend-docker-prod:
    cd {{FRONTEND_DIR}} && npm run docker:run:prod

# =========================================
# DOCKER COMPOSE - LOCAL FULL STACK
# =========================================

compose-up:
    docker compose up --build

compose-up-detached:
    docker compose up -d --build

compose-down:
    docker compose down
