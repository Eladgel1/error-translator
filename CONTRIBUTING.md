# Contributing

This project uses a simple but professional Git workflow.

## Branches

- `main`   – production-ready / stable releases
- `develop` – integration branch for ongoing development

### Working branches

We create short-lived branches from `develop`:

- `feature/*` – new features or logical parts of the system  
  - e.g. `feature/backend-core`, `feature/ai-core`, `feature/frontend-core`, `feature/ux-enhancements`
- `chore/*` – tooling, DevX, CI/CD, Docker, documentation  
  - e.g. `chore/devx-and-quality`, `chore/docker-and-compose`, `chore/ci-cd`
- `fix/*` – bug fixes  
  - e.g. `fix/cors-config`, `fix/analyze-java-edge-case`

## Pull Requests

- All changes must go through a Pull Request into `develop`.
- `develop` is merged into `main` when a stable release is ready.
- Use **Squash and merge** for feature/chore/fix branches into `develop`.
- Use a dedicated PR from `develop` to `main` for a release.

## Commit messages (Conventional Commits)

Examples:
- `feat: add basic analyze endpoint`
- `fix: handle empty error_text`
- `chore: configure lint and format`
- `docs: update README with setup instructions`
- `test: add integration tests for /api/analyze`
- `refactor: extract language detection helper`
