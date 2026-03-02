# Deployment Strategy - Error Translator

This document describes the deployment strategy for the project.

We use **Vercel** for both the backend (FastAPI) and the frontend (Vite + React).
Docker is used locally and in CI only - Vercel itself runs the code using its own
build images and runtimes.

---

## 1. Vercel Projects

We will create **two Vercel projects** from the same GitHub repository:

### 1.1 Backend - FastAPI

- **Project name:** `error-translator-backend`
- **Root directory:** `backend`
- **Runtime:** Python (FastAPI on Vercel Functions)
- **Git integration:** connect the same GitHub repo as the monorepo
- **Build & run:**
  - Vercel will detect Python / FastAPI automatically.
  - No Docker image is deployed to Vercel. Docker is only for local dev and CI.
- **Environments:**
  - `develop` → Staging environment (pre-production API)
  - `main` → Production environment (public API)

### 1.2 Frontend - Vite + React

- **Project name:** `error-translator-frontend`
- **Root directory:** `frontend`
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environments:**
  - `develop` → Staging environment (pre-production UI)
  - `main` → Production environment (public UI)

---

## 2. Branch → Environment Mapping

We keep the same Git branching strategy as in the rest of the repo:

- `develop` - integration branch, used as **Staging** in Vercel
- `main` - stable branch, used as **Production** in Vercel

### 2.1 Example domains

Backend:

- Staging: `https://error-translator-backend-staging.vercel.app`
- Production: `https://error-translator-backend.vercel.app`

Frontend:

- Staging: `https://error-translator-staging.vercel.app`
- Production: `https://error-translator.vercel.app`

Later, we can attach custom domains if needed.

---

## 3. Environment Variables

### 3.1 Backend environment variables

For the backend Vercel project (`error-translator-backend`),
we define the following env vars per environment:

- `APP_NAME`
- `ENVIRONMENT` (e.g. `staging` / `production`)
- `DEBUG` (`false` in both staging and production)
- `AI_PROVIDER` (e.g. `gemini`)
- `AI_MODEL` (e.g. `gemini-2.5-flash`)
- `AI_BASE_URL`
- `GEMINI_API_KEY` (stored only in Vercel / GitHub Secrets)
- `AI_REQUEST_TIMEOUT_SECONDS`
- `AI_MAX_RETRIES`

Each environment will have its own `ENVIRONMENT`
and its own `GEMINI_API_KEY` if needed.

### 3.2 Frontend environment variables

For the frontend Vercel project (`error-translator-frontend`),
we only need:

- `VITE_API_BASE_URL`

Values:

- **Staging frontend**:  
  `VITE_API_BASE_URL` = backend staging URL  
  (e.g. `https://error-translator-backend-staging.vercel.app`)

- **Production frontend**:  
  `VITE_API_BASE_URL` = backend production URL  
  (e.g. `https://error-translator-backend.vercel.app`)

This keeps the same contract as in local Docker: the frontend never
hardcodes URLs, it always reads from `VITE_API_BASE_URL`.

---

## 4. CI → CD Integration (Plan)

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

### 4.1 Backend CI - future CD step

In a future step, we will append to the backend CI workflow:

- If the pipeline runs on `develop` and succeeds:
  - Trigger backend **staging** deploy hook:

    ```yaml
    - name: Trigger backend staging deploy
      if: github.ref == 'refs/heads/develop'
      run: curl -X POST "$VERCEL_BACKEND_STAGING_HOOK"
      env:
        VERCEL_BACKEND_STAGING_HOOK: ${{ secrets.VERCEL_BACKEND_STAGING_HOOK }}
    ```

- If the pipeline runs on `main` and succeeds:
  - Trigger backend **production** deploy hook:

    ```yaml
    - name: Trigger backend production deploy
      if: github.ref == 'refs/heads/main'
      run: curl -X POST "$VERCEL_BACKEND_PROD_HOOK"
      env:
        VERCEL_BACKEND_PROD_HOOK: ${{ secrets.VERCEL_BACKEND_PROD_HOOK }}
    ```

### 4.2 Frontend CI - future CD step

Similarly, for the frontend CI workflow:

- If the pipeline runs on `develop` and succeeds:
  - Trigger frontend **staging** deploy hook:

    ```yaml
    - name: Trigger frontend staging deploy
      if: github.ref == 'refs/heads/develop'
      run: curl -X POST "$VERCEL_FRONTEND_STAGING_HOOK"
      env:
        VERCEL_FRONTEND_STAGING_HOOK: ${{ secrets.VERCEL_FRONTEND_STAGING_HOOK }}
    ```

- If the pipeline runs on `main` and succeeds:
  - Trigger frontend **production** deploy hook:

    ```yaml
    - name: Trigger frontend production deploy
      if: github.ref == 'refs/heads/main'
      run: curl -X POST "$VERCEL_FRONTEND_PROD_HOOK"
      env:
        VERCEL_FRONTEND_PROD_HOOK: ${{ secrets.VERCEL_FRONTEND_PROD_HOOK }}
    ```

This means:

- `develop` branch → passes CI → automatically deploys to **staging** (FE+BE).
- `main` branch → passes CI → automatically deploys to **production** (FE+BE).

---

## 5. Summary

- Two Vercel projects: backend (FastAPI) and frontend (Vite).
- `develop` → staging, `main` → production.
- Backend and frontend communicate via `VITE_API_BASE_URL`, different per environment.
- Deploy Hooks + GitHub Actions will provide CD:
  - CI runs tests and builds images.
  - On success, CI triggers Vercel deploys via secrets-based deploy hooks.
- All sensitive data (API keys, deploy hooks) lives in Vercel / GitHub Secrets,
  not in the repository.
  