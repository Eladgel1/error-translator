# Backend - Error Translator API

## Tech stack
- Python
- FastAPI
- Uvicorn
- Pydantic (via pydantic-settings)

## Local setup

1. Create virtualenv:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # PowerShell
```

## Dependencies

Runtime:

- fastapi
- uvicorn[standard]
- httpx
- pydantic-settings

Dev:

- pytest
- pytest-asyncio
- ruff

Install for local development (from `backend/` with venv active):

```bash
pip install -r requirements.txt -r requirements-dev.txt
```

## Commands

From the repo root:

```bash
just backend-dev       # run FastAPI dev server (requires venv)
just test              # run backend tests (pytest)
just lint              # run backend linter (ruff)
just format-backend    # format backend code
```

From backend directly:

```bash
cd backend
.\.venv\Scripts\Activate.ps1  # activate Python virtual environment

# Run tests
pytest

# Run lint
ruff check app tests

# Format code
ruff format app tests
```