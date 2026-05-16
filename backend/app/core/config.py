from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Error Translator API"
    environment: str = "local"
    debug: bool = True
    log_level: str = "INFO"
    cors_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "https://error-translator.vercel.app"
    )

    # --- AI client configuration ---
    ai_provider: Literal["gemini", "dummy"] = "gemini"
    ai_base_url: str = "https://generativelanguage.googleapis.com/v1beta/models"
    ai_model: str = "gemini-2.5-flash"
    ai_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    ai_request_timeout_seconds: float = 15.0
    ai_max_retries: int = 2

    postgres_db: str = Field(alias="POSTGRES_DB")
    postgres_user: str = Field(alias="POSTGRES_USER")
    postgres_password: str = Field(alias="POSTGRES_PASSWORD")

    database_url: str = Field(alias="DATABASE_URL")

    migration_database_url: str | None = Field(
        default=None,
        alias="MIGRATION_DATABASE_URL",
    )

    jwt_secret_key: str = Field(alias="JWT_SECRET_KEY")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

settings = Settings()
