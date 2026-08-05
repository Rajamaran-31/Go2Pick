from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Go2Pick"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Go2Pick is a pickup-only local shop pre-order application. Customers order products in advance and collect them from the shop using a unique pickup code, reducing waiting time. This MVP does not include online payment or delivery."

    # Firebase Settings
    FIREBASE_CREDENTIALS: str = "firebase-service-account.json"
    FIREBASE_CREDENTIALS_PATH: str = "firebase-service-account.json"
    FIREBASE_STORAGE_BUCKET: str = "go2pick-345bf.firebasestorage.app"
    FIREBASE_API_KEY: str = "AIzaSyC-yVxjHB9_sKuKPUsRv-x_yDXEudxnTII"

    # Legacy configuration shims to prevent loading issues
    MONGODB_URL: Optional[str] = None
    DATABASE_NAME: Optional[str] = "Go2Pick"

    # JWT Settings (still available if needed)
    JWT_SECRET: str = "go2pick-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24

    # Backend URL
    BACKEND_URL: str = "http://localhost:8000"

    # Seed Admin Settings
    ADMIN_EMAIL: str = "admin@go2pick.com"
    ADMIN_PASSWORD: str = "Admin@123"

    # SMTP Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_SENDER: str = ""

    # Cloudinary Settings
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
