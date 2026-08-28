from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "Cognitive Classroom Digital Twin"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Database and Caching
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/classroom_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    
    # Security
    SECRET_KEY: str = "change-me-in-production-very-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    OIDC_ENABLED: bool = False
    OIDC_JWKS_URL: str = ""
    OIDC_AUDIENCE: str = ""
    
    # AI Config
    WHISPER_MODEL: str = "large-v3-turbo"
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o"
    
    # App Limits & Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_CAMERAS: int = 8

    model_config = ConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
