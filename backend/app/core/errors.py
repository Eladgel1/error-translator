from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import get_logger
from app.services.ai.errors import (
    AIClientError,
    AIConfigurationError,
    AINetworkError,
    AIProviderError,
    AIResponseParseError,
    AIResponseValidationError,
)

logger = get_logger("error-translator.errors")


class AppError(Exception):
    """
    Custom application-level error.

    Use this for predictable business logic erros.
    """

    def __init__(
        self,
        message: str,
        *,
        status_code: int = 400,
        code: str = "app_error",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details or {}
        super().__init__(message)


def _build_error_response(
    request: Request,
    *,
    status_code: int,
    code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)

    payload: Dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
        },
        "request_id": request_id,
    }

    if details:
        payload["error"]["details"] = details

    return JSONResponse(status_code=status_code, content=payload)


def init_error_handlers(app: FastAPI) -> None:
    """
    Register global exception handlers for the app.
    """

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        logger.warning(
            "AppError: %s",
            exc.message,
            extra={
                "code": exc.code,
                "status_code": exc.status_code,
                "path": request.url.path,
                "request_id": getattr(request.state, "request_id", None),
            },
        )
        return _build_error_response(
            request,
            status_code=exc.status_code,
            code=exc.code,
            message=exc.message,
            details=exc.details,
        )

    @app.exception_handler(HTTPException)
    async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
        logger.info(
            "HTTPException: %s",
            exc.detail,
            extra={
                "status_code": exc.status_code,
                "path": request.url.path,
                "request_id": getattr(request.state, "request_id", None),
            },
        )
        return _build_error_response(
            request,
            status_code=exc.status_code,
            code="http_error",
            message=str(exc.detail),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.info(
            "Validation error",
            extra={
                "path": request.url.path,
                "request_id": getattr(request.state, "request_id", None),
            },
        )
        return _build_error_response(
            request,
            status_code=422,
            code="validation_error",
            message="Request validation failed",
            details={"errors": exc.errors()},
        )
    
    @app.exception_handler(AIConfigurationError)
    async def handle_ai_configuration_error(
        request: Request, exc: AIConfigurationError
    ) -> JSONResponse:
        logger.error(
            "AI configuaration error",
            extra={
                "path": request.url.path,
                "request_id": getattr(request.state, "request_id", None),
            },
        )

        return _build_error_response(
            request,
            status_code=500,
            code="ai_configuration_error",
            message="AI provider is not properly configured.",
        )
    
    @app.exception_handler(AINetworkError)
    @app.exception_handler(AIProviderError)
    async def handle_ai_provider_error(
        request: Request, exc: AIClientError
    ) -> JSONResponse:
        logger.warning(
            "AI provider error.",
            extra={
                "path": request.url.path,
                "request_id": getattr(request.state, "request_id", None),
            },
        )

        return _build_error_response(
            request,
            status_code=502,
            code="ai_provider_error",
            message="Failed to reach AI provider",
        )
    
    @app.exception_handler(AIResponseParseError)
    @app.exception_handler(AIResponseValidationError)
    async def handle_ai_response_error(
        request: Request, exc: AIClientError
    ) -> JSONResponse:
        logger.warning(
            "AI response error",
            extra={
                "path": request.url.path,
                "request_id": getattr(request.state, "request_id", None),
            },
        )

        return _build_error_response(
            request,
            status_code=502,
            code="ai_invalid_response",
            message="AI returned an invalid or malformed response.",
        )
    
    @app.exception_handler(AIClientError)
    async def handle_ai_client_error(
        request: Request, exc: AIClientError
    ) -> JSONResponse:
        logger.error(
            "Unexpected AI client error",
            extra={
                "path": request.url.path,
                "request_id": getattr(request.state, "request_id", None),
            },
        )

        return _build_error_response(
            request,
            status_code=500,
            code="ai_client_error",
            message="Unexpected AI client failure."
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "Unhandled error",
            extra={
                "path": request.url.path,
                "request_id": getattr(request.state, "request_id", None),
            },
        )

        return _build_error_response(
            request,
            status_code=500,
            code="internal_error",
            message="Internal server error",
        )
