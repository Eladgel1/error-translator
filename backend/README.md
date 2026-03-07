# 📘 Error Translator API - Backend Documentation

A production‑grade backend service for analyzing programming errors, generating explanations, and handling follow‑up questions using AI (**Gemini 2.5‑Flash**).

Built with **FastAPI**, structured with clean service layers, fully tested, formatted, linted, and ready for deployment.

---

## 🚀 Tech Stack

- **Python 3.12**
- **FastAPI**
- **Uvicorn**
- **HTTPX** (async HTTP client)
- **Pydantic v2 +** `pydantic-settings`
- **Custom AI Client** (Gemini)
- **Docker** (local + CI image)
- **GitHub Actions** (CI + CD to Vercel)

### 🤖 **AI Layer**

- Custom **AIClient** integrating with **Gemini 2.5‑Flash**
- Prompt templating system (language‑based + versioned)
- Strict **schema‑validated JSON responses** (`AIResponse` model)

### **Tooling**

- Ruff (lint + format)
- Pytest (unit + integration tests)
- `pytest-cov` (coverage)
- `just` task runner for common dev commands

### **Infrastructure & DevOps**

- Docker images for backend (and frontend at repo root)
- `docker-compose` for full local stack (backend + frontend)
- GitHub Actions CI/CD (`.github/workflows/cicd-backend.yaml`)
- Vercel Python serverless deployment (production from `main`)
- Vercel deploy hook triggered from GitHub Actions

---

## 🛠️ Project Structure

```text
backend/
│
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── analyze.py
│   │       └── followup.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── errors.py
│   │   ├── logging.py
│   │   └── middleware.py
│   │
│   ├── schemas/
│   ├── services/
│   │   ├── ai/
│   │   └── analysis/
│   │
│   └── main.py
│
├── tests/
│   ├── api/
│   ├── integration/
│   ├── schemas/
│   └── services/
│
├── Dockerfile
├── pyproject.toml
├── requirements.txt
└── requirements-dev.txt
```

The `app` package is organized into clear layers:

- **api/routes** - FastAPI routers (`/api/analyze`, `/api/followup`).
- **core** - configuration, logging, middleware, shared error types.
- **schemas** - Pydantic models for requests/responses.
- **services/analysis** - normalization, language detection, and error analysis orchestration.
- **services/ai** - AI client abstraction + prompt building.

Tests mirror this layout under `tests/` (API, integration, schemas, and services).

---

## ⚙️ Local Setup

### 1. Create virtual environment

```bash
cd backend
python -m venv .venv
# PowerShell
.\.venv\Scripts\Activate.ps1
# bash/zsh (Linux / macOS)
# source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt -r requirements-dev.txt
```

---

## ▶️ Running the Development Server

### Using `just` (recommended)

From **repository root**:

```bash
just backend-dev
```

This will start the FastAPI app with Uvicorn at:

- http://localhost:8000

Health check:

- http://localhost:8000/health

Interactive docs (Swagger UI):

- http://localhost:8000/docs

### Directly with Uvicorn

From `backend/` (after activating the virtualenv):

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 🐳 Docker & Local Containers

The repository includes Docker support at the root level.

From **repository root**:

```bash
docker compose up --build
```

This will build and start both services:

- **Backend** available at `http://localhost:8000`
- **Frontend** available at `http://localhost:5173`

You can also run only the backend service:

```bash
docker compose up --build backend
```

For full details on the multi‑service Docker setup, see the root `README.md`.

---

## 🧪 Testing

### Run all backend tests

```bash
just test-backend
```

### Run tests with coverage

```bash
just test-backend-cov
```

### Run directly with pytest

```bash
cd backend
pytest
pytest --cov=app --cov-report=term-missing
```

---

## 🧹 Lint & Format

### Lint with Ruff

```bash
just lint-backend
```

### Format code

```bash
just format-backend
```

Under the hood these commands invoke `ruff check` / `ruff format` against the `app` and `tests` packages.

---

## 🔌 Environment Variables

Create a `.env` file inside `backend/` (or configure equivalent variables in your deployment environment):

```env
APP_NAME="Error Translator API"
ENVIRONMENT="local"  # local / dev / production
DEBUG=true

AI_PROVIDER=gemini
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models
GEMINI_API_KEY=your_api_key_here
AI_REQUEST_TIMEOUT_SECONDS=15
AI_MAX_RETRIES=2
```

These values are loaded via `pydantic-settings` into a central `Settings` object under `app.core.config`.

---

## 🧠 Core Endpoints & Features

### `POST /api/analyze` - Error Analysis

- Accepts raw error text (+ optional context and language hint).
- Normalizes and cleans the error string.
- Detects probable programming language (Python / JavaScript / Java / Unknown).
- Loads the appropriate prompt template.
- Calls the AI provider (Gemini 2.5‑Flash) through the `AIClient` abstraction.
- Validates the AI response against the strict `AIResponse` schema.
- Returns a structured JSON payload containing:
  - `summary`
  - `likely_cause`
  - `fix_steps[]`
  - `debug_steps[]`
  - `assumptions[]`
  - `followup_questions[]`
  - `language_detected`
  - `confidence`

### `POST /api/followup` - Follow‑up Reasoning

- Accepts a previous `AIResponse` + a new user question.
- Preserves context from the original error analysis.
- Generates extended explanation or deeper debugging guidance.

### Error Handling

- All operational errors are mapped to a consistent JSON structure via `app.core.errors`.
- Validation, AI, and network issues are normalized into safe user‑facing messages.

---

## 🧪 Test Coverage Highlights

The backend includes:

- Unit tests for analysis logic (normalization + language detection).
- Integration tests for `/api/analyze` with mocked AI responses.
- Endpoint tests for both `analyze-error` and `followup` routes.
- Schema validation tests for `AIResponse` and related models.
- AI client tests (timeouts, retries, error mapping).

---

## 🏁 Production Readiness

- Strong typing and Pydantic v2 models for inputs/outputs.
- Centralized configuration and environment handling.
- Structured logging for API and AI calls.
- Clean prompt versioning and separation between analysis logic and AI provider.
- `AIClient` abstraction makes it easy to swap/extend providers.
- Fully async stack (FastAPI + HTTPX) for high concurrency.
- CI pipeline enforcing lint, tests, and Docker build on every push/PR.

---

## 🚀 Deployment & CI/CD

### Vercel Deployment

The backend is deployed as a **Python serverless function** on Vercel:

- Entry point wraps the FastAPI `app`.
- Environment variables (API keys, timeouts, etc.) are configured via the Vercel dashboard.
- Production deployments are triggered only from the `main` branch.

### GitHub Actions (Backend CI/CD)

Workflow: `.github/workflows/cicd-backend.yaml`:

1. Triggered on pushes and pull requests to `develop` and `main`.
2. Sets up Python 3.12.
3. Installs backend and dev dependencies.
4. Runs Ruff lint.
5. Runs the full pytest suite.
6. Builds a backend Docker image (`error-translator-backend:ci`) and uploads it as an artifact.
7. When the branch is `main`, calls the **Vercel backend production deploy hook** using a GitHub secret.

This ensures that only green builds from `main` reach production.

---

If you are working on the frontend or root project, see the corresponding `README-frontend` and root `README` for the full stack picture (UI, Docker, and CI/CD across both services).

