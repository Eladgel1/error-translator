# 📘 Error Translator API - Backend Documentation

A production-grade backend service for analyzing programming errors, generating explanations, and handling follow‑up questions using AI (Gemini 2.5‑Flash).

Built with **FastAPI**, structured with clean service layers, fully tested, formatted, linted, and ready for deployment.

---

## 🚀 Tech Stack

### **Backend**

* Python 3.12
* FastAPI
* Uvicorn
* HTTPX (async HTTP client)
* Pydantic v2 + pydantic‑settings

### **AI Layer**

* Custom **AIClient** integrating with **Gemini 2.5 Flash**
* Prompt templating system (language‑based + versioned)
* Strict **schema‑validated JSON responses**

### **Tooling**

* Ruff (lint + format)
* Pytest (unit + integration tests)
* pytest‑cov (coverage)
* Justfile automation

---

## 🛠️ Project Structure

```
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
|   |   ├── logging.py
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
├── requirements.txt
└── requirements-dev.txt
```

---

## ⚙️ Local Setup

### **1. Create virtual environment**

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # PowerShell
```

### **2. Install dependencies**

```bash
pip install -r requirements.txt -r requirements-dev.txt
```

---

## ▶️ Running the Development Server

From project root:

```bash
just backend-dev
```

Server will start at:

```
http://127.0.0.1:8000
```
Health check:

```
http://127.0.0.1:8000/health
```

Swagger docs:

```
http://127.0.0.1:8000/docs
```

---

## 🧪 Testing

### **Run all backend tests**

```bash
just test-backend
```

### **Run tests with coverage**

```bash
just test-backend-cov
```

### Run directly:

```bash
cd backend
pytest
pytest --cov=app --cov-report=term-missing
```

---

## 🧹 Lint & Format

### **Lint with Ruff**

```bash
just lint-backend
```

### **Format code**

```bash
just format-backend
```

---

## 🔌 Environment Variables

Create `.env` inside `backend/`:

```
APP_NAME="Error Translator API"
ENVIRONMENT="local"
DEBUG=true

AI_PROVIDER=gemini
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models
GEMINI_API_KEY=your_api_key_here
AI_REQUEST_TIMEOUT_SECONDS=15
AI_MAX_RETRIES=2
```

---

## 🧠 Key Features

### **/api/analyze - Error Analysis**

* Normalizes raw error text
* Detects programming language (Python / JS / Java / Unknown)
* Loads correct prompt template
* Calls Gemini AI
* Returns strict `AIResponse` schema

### **/api/followup - Follow‑up Reasoning**

* Accepts previous AIResponse
* Maintains logical context between questions
* Generates extended explanation

### **Fully Tested**

* Unit tests for analysis logic (normalize + detect_language)
* Integration tests for /api/analyze with mocked AI
* Endpoint tests for both analyze + followup
* Schema validation tests
* AI client tests

---

## 🏁 Production Readiness

* Strict type safety (Pydantic)
* Centralized error handling
* Clean prompt versioning
* AI client abstraction + retries
* 100% async pipeline
* Modular architecture ready for scaling

---
