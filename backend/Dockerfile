# Base image with Python 3.12 on a slim Debian-basded image
FROM python:3.12-slim AS base

# Python runtime settings:no .pyc files, unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Working directory inside the container
WORKDIR /app

# Install curl for the healthcheck and clean up apt cache
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Builder stage = install dependencies
FROM base AS builder

# Copy only the requirements file to leverage Docker layer caching
COPY requirements.txt .

# Install Python dependencies into a temporary prefix
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Runtime stage - final image
FROM base AS runtime

# Copy installed packages from builder into the final image
COPY --from=builder /install /usr/local

# Copy application source code
COPY app ./app
COPY pyproject.toml .

# Expose the port uvicorn will listen on
EXPOSE 8000

# Healthcheck to verify that the FastAPI app is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:8000/health || exit 1

# Default command: run the FastAPI app with uvicorn
CMD [ "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" ]