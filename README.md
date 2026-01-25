# Error Message Translator (AI)

AI-powered tool that explains compiler/runtime errors (Java / Python / JavaScript), suggests fixes, and provides debugging steps.

## Monorepo Structure
- `/backend` - FastAPI API (Python)
- `/frontend` - React (Vite + TypeScript)

## Local Development (placeholder)
Backend and frontend setup instructions will be added step-by-step as we build the project.

## Developer commands (Makefile)

This repo uses a root `Makefile` to standardize common developer tasks.

Once backend and frontend are set up, you'll be able to use:

- `make dev` – run full stack (backend + frontend)
- `make backend` – run backend only (dev mode)
- `make frontend` – run frontend only (dev mode)
- `make test` – run tests (backend + frontend)
- `make lint` – run linters/formatters

For now, these commands are placeholders and simply print TODO messages.
They will be wired to real commands as we implement the backend and frontend.
