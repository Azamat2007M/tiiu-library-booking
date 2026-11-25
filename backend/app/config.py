import os
from pydantic_settings import BaseSettings

def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://"):]
    return url

class Settings(BaseSettings):
    DATABASE_URL: str = normalize_database_url(
        os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://postgres:postgres@localhost:5432/library_db",
        )
    )
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key-change-in-production-32chars")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", os.getenv("CORS_ORIGINS", "http://localhost:3000"))
    ENV: str = os.getenv("ENV", "development")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
