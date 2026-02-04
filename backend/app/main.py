from fastapi import FastAPI

from .api.routes.analyze import router as analyze_router
from .api.routes.followup import router as followup_router
from .core.config import settings
from .core.errors import init_error_handlers
from .core.middleware import init_middlewares


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

    return app


app = create_app()
