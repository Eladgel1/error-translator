from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Error Translator API"
    environment: str = "local"
    debug: bool = True

    class config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()