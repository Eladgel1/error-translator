from fastapi import FastAPI

from .core.config import settings
from .core.errors import init_error_handlers
from .core.middleware import init_middlewares
from .modules.analyses.router import router as analyze_router
from .modules.auth.router import router as auth_router
from .modules.followups.router import router as followup_router


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application instance.
    """

    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
    )

    # Register global errors handlers
    init_error_handlers(app)

    # Register middlewares
    init_middlewares(app)

    # System health
    @app.get("/health", tags=["system"])
    async def health_check():
        return {
            "status": "ok",
            "app": settings.app_name,
            "environment": settings.environment,
        }

    app.include_router(analyze_router, prefix="/api")
    app.include_router(followup_router, prefix="/api")
    app.include_router(auth_router, prefix="/api")

    return app


app = create_app()
