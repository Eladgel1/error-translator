from fastapi import FastAPI
from .core.config import settings
from .core.middleware import init_middlewares
from .core.errors import init_error_handlers


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


    @app.get("/health", tags=["system"])
    async def health_check():
        return {
            "status": "ok",
            "app": settings.app_name,
            "environment": settings.environment,
        }
    
    return app

app = create_app()