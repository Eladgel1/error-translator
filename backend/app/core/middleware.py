import time
from collections import defaultdict
from typing import Dict, List

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("error-translator.middleware")

def get_cors_origins() -> list[str]:
    """
    Parse allowed CORS origins from configuration.

    The value is expected to be a comma-separated string.
    Example:
    CORS_ORIGINS=http://localhost:5173,https://error-translator.vercel.app
    """

    return [
        origin.strip()
        for origin in settings.cors_origins.split(",")
        if origin.strip()
    ]

# ---- Request context ----


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        import uuid

        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start = time.perf_counter()

        response = await call_next(request)

        duration = time.perf_counter() - start
        response.headers["X-Request-ID"] = request_id

        logger.info(
            "request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2),
            },
        )

        return response


# ---- Simple in-memory rate Limiter ----


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: FastAPI,
        max_requests: int = 60,
        window_seconds: int = 60,
    ) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        now = time.monotonic()
        client_ip = request.client.host if request.client else "unknown"
        window_start = now - self.window_seconds

        timestamps = self._requests[client_ip]
        # Filtering old requests
        filtered = [ts for ts in timestamps if ts >= window_start]
        filtered.append(now)
        self._requests[client_ip] = filtered

        if len(filtered) > self.max_requests:
            request_id = getattr(request.state, "request_id", None)

            logger.warning(
                "Rate limit exceeded",
                extra={
                    "client_ip": client_ip,
                    "request_id": request_id,
                    "path": request.url.path,
                },
            )

            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "rate_limit_exceeded",
                        "message": "Too many requests, please try again later.",
                    },
                    "request_id": request_id,
                },
            )

        return await call_next(request)


# ---- Main init function ----


def init_middlewares(app: FastAPI) -> None:
    """
    Attach all middlewares to the FastAPI app.
    Order matters.
    """

    # CORS for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request context
    app.add_middleware(RequestContextMiddleware)

    # Rate limiting
    app.add_middleware(RateLimitMiddleware)
