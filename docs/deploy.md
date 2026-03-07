# Deployment Strategy - Error Translator

This document describes the deployment strategy for the project.

We use **Vercel** for both the backend (FastAPI) and the frontend (Vite + React).
Docker is used locally and in CI only - Vercel itself runs the code using its own
build images and runtimes.

---

## 1. Vercel Projects

We will create **two Vercel projects** from the same GitHub repository:

### 1.1 Backend - FastAPI (Production)

- **Project name:** `error-translator-backend`
- **Root directory:** `backend`
- **Runtime:** Python (FastAPI on Vercel Functions)
- **Git integration:** connect the same GitHub repo as the monorepo
- **Build & run:**
  - Vercel will detect Python / FastAPI automatically.
  - No Docker image is deployed to Vercel. Docker is only for local dev and CI.

### 1.2 Frontend - Vite + React (Production)

- **Project name:** `error-translator-frontend`
- **Root directory:** `frontend`
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

---

## 2. Branch Policy

We deploy **production only**.

**Important note (temporary):**
- At the moment, the repository default branch is set to `develop` so Vercel can
  import the repo and detect the monorepo folder structure (`backend/`, `frontend/`)
  correctly.
- After the first clean merge from `develop` into `main`, we will switch the repo
  default branch back to `main`.

---

## 3. Production URLs

Backend:
- Production: `https://error-translator-backend.vercel.app`

Frontend:
- Production: `https://error-translator.vercel.app`

Later, we can attach custom domains if needed.

---

## 4. Environment Variables

### 4.1 Backend environment variables

For the backend Vercel project (`error-translator-backend`),
we define the following env vars:

- `APP_NAME`
- `ENVIRONMENT` (e.g. `production`)
- `DEBUG` (`false`)
- `AI_PROVIDER` (e.g. `gemini`)
- `AI_MODEL` (e.g. `gemini-2.5-flash`)
- `AI_BASE_URL`
- `GEMINI_API_KEY` (stored only in Vercel / GitHub Secrets)
- `AI_REQUEST_TIMEOUT_SECONDS`
- `AI_MAX_RETRIES`

### 4.2 Frontend environment variables

For the frontend Vercel project (`error-translator-frontend`),
we only need:

- `VITE_API_BASE_URL`

Value:

- `VITE_API_BASE_URL` = backend production URL  
  (e.g. `https://error-translator-backend.vercel.app`)

This keeps the same contract as in local Docker: the frontend never
hardcodes URLs, it always reads from `VITE_API_BASE_URL`.

---

## 5. CI → CD Integration

We already have:

- `Backend CI` workflow:
  - installs deps
  - runs `ruff`
  - runs `pytest`
  - builds backend Docker image and saves artifact

- `Frontend CI` workflow:
  - installs deps
  - runs ESLint
  - runs unit tests
  - builds frontend
  - builds frontend Docker image and saves artifact

### 5.1 Backend CI - future CD step

In a future step, we will append to the backend CI workflow:

- If the pipeline runs on the production branch and succeeds:
  - Trigger backend production deploy hook:

    ```yaml
    - name: Trigger backend production deploy
      if: github.ref == 'refs/heads/main'
      run: curl -X POST "$VERCEL_BACKEND_PROD_HOOK"
      env:
        VERCEL_BACKEND_PROD_HOOK: ${{ secrets.VERCEL_BACKEND_PROD_HOOK }}
    ```

### 5.2 Frontend CI - future CD step

Similarly, for the frontend CI workflow:

- If the pipeline runs on the production branch and succeeds:
  - Trigger frontend production deploy hook:

    ```yaml
    - name: Trigger frontend production deploy
      if: github.ref == 'refs/heads/main'
      run: curl -X POST "$VERCEL_FRONTEND_PROD_HOOK"
      env:
        VERCEL_FRONTEND_PROD_HOOK: ${{ secrets.VERCEL_FRONTEND_PROD_HOOK }}
    ```

---

## 6. Summary

- Two Vercel projects: backend (FastAPI) and frontend (Vite).
- Production only deployment.
- Backend and frontend communicate via `VITE_API_BASE_URL`.
- Deploy Hooks + GitHub Actions will provide CD:
  - CI runs tests and builds images.
  - On success, CI triggers Vercel deploys via secrets-based deploy hooks.
- All sensitive data (API keys, deploy hooks) lives in Vercel / GitHub Secrets,
  not in the repository.