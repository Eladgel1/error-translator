# Error Translator - Frontend (Vite + React)

This directory contains the React frontend for the **Error Translator** application.  
It provides a polished chat-like UI for pasting errors, viewing AI explanations, and navigating analysis history.

---

## 🚀 Tech Stack

- **React + TypeScript**
- **Vite**
- **Tailwind CSS**
- **React Markdown**
- **Vitest** (unit tests)
- **Playwright** (E2E)
- **Docker**

---

## 🛠️ Project Structure

```text
frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── pages/
│   │   └── AnalyzerPage.tsx
│   ├── api/
│   │   └── client.ts
│   ├── features/
│   │   ├── history/
│   │   │   ├── types.ts
│   │   │   └── storage.ts
│   │   └── examples/
│   │       └── examplePresets.ts
│   ├── types/
│   │   └── ai.ts
│   └── index.css
├── tests/
│   ├── unit/
│   └── e2e/
│
├── Dockerfile
├── index.html
├── nginx.conf
├── package.json
├── playwright.config.js
├── tailwind.config.js
└── vite.config.ts
```

---

## 🔌 Environment Variables

The frontend expects a single environment variable:

| Name               | Description                 |
|--------------------|-----------------------------|
| `VITE_API_BASE_URL` | Base URL of the backend API |

**Examples**

- Local development:
  ```bash
  VITE_API_BASE_URL=http://localhost:8000
  ```
- Production:
  ```bash
  VITE_API_BASE_URL=https://error-translator-backend.vercel.app
  ```

On Vercel, this variable is configured under **Project → Settings → Environment Variables**.

---

## ⚙️ Local Development

From the repository root or `frontend/` directory:

```bash
cd frontend
npm install

# .env.local
# VITE_API_BASE_URL=http://localhost:8000

npm run dev
```

The app will be available at:

```text
http://localhost:5173
```

---

## 🧪 Testing

### Unit tests

```bash
npm run test:unit
```

### E2E tests (Playwright)

E2E tests require the backend to be running at `VITE_API_BASE_URL` (usually `http://localhost:8000`).

```bash
# Install Playwright browsers once
npx playwright install --with-deps

# Run E2E tests
npm run test:e2e
```

Playwright is configured in `playwright.config.ts` to:

- Start `npm run dev` as the web server.
- Use `http://localhost:5173` as `baseURL`.

---

## 🐳 Docker

### Build & run - development image

```bash
npm run docker:build:dev
npm run docker:run:dev
# → http://localhost:5173 (talking to http://localhost:8000)
```

### Build & run - production image

```bash
npm run docker:build:prod
npm run docker:run:prod
# → http://localhost:5173 (talking to the production backend URL)
```

`docker:build:prod` passes `VITE_API_BASE_URL` via a build arg so the image **bakes in** the correct API endpoint.

---

## 🔁 CI/CD

The frontend CI workflow (`.github/workflows/cicd-frontend.yml`) performs:

1. Install dependencies.
2. Run linting: `npm run lint`.
3. Run unit tests: `npm run test:unit`.
4. Build the Vite app: `npm run build`.
5. Build the Docker image and upload it as an artifact.
6. On pushes to `main`, trigger a Vercel production deploy via `VERCEL_FRONTEND_PROD_HOOK` & Running Playwright E2E tests.

