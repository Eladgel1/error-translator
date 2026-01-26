from fastapi import FastAPI
from .core.config import settings

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        debug=settings.debug,
    )

    @app.get("/health", tags=["system"])
    async def health_check():
        return {
            "status": "ok",
            "app": settings.app_name,
            "environment": settings.environment,
        }
    
    return app

app = create_app()