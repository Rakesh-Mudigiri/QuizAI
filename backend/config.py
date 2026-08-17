"""
Application configuration — loads from .env file.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # AI Providers (Groq Cloud Engine)
    groq_api_key: str = ""
    groq_api_key_backup: str = ""
    groq_model: str = "openai/gpt-oss-120b"

    # App
    app_name: str = "AI Quiz Generator"
    debug: bool = False
    max_upload_size_mb: int = 10
    uploads_dir: str = "uploads"
    database_url: str = "sqlite:///./quiz_generator.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def is_production(self) -> bool:
        """Check if running in production environment."""
        return not self.debug


@lru_cache()
def get_settings() -> Settings:
    return Settings()
