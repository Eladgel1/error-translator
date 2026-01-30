from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Error Translator API"
    environment: str = "local"
    debug: bool = True


    # --- AI client configuration ---
    ai_provider: Literal["gemini", "dummy"] = "gemini"
    ai_base_url: str = "https://generativelanguage.googleapis.com/v1beta/models"
    ai_model: str = "gemini-3-flash-preview"
    ai_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    ai_request_timeout_seconds: float = 15.0
    ai_max_retries: int = 2


    class config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()