"""
Configuration management for the AI Chat Application
"""

from pydantic_settings import BaseSettings
from typing import List, Union
import os
from pathlib import Path

# プロジェクトのルートディレクトリを取得
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application settings"""
    
    # Application Configuration
    APP_NAME: str = "AI Chat Platform"
    APP_VERSION: str = "1.0.0"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    APP_RELOAD: bool = True
    DEBUG: bool = True
    
    # OpenAI Configuration
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_TOKENS: int = 4096
    OPENAI_TEMPERATURE: float = 0.7
    
    # Database Configuration
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/chat_app.db"
    DATABASE_ECHO: bool = False
    
    # Redis Configuration (optional)
    REDIS_URL: str = "redis://localhost:6379"
    USE_REDIS_CACHE: bool = False
    
    # Security Configuration
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Chat Configuration
    MAX_MESSAGES_PER_SESSION: int = 1000
    MESSAGE_RETENTION_DAYS: int = 90
    DEFAULT_SYSTEM_PROMPT: str = """あなたは親切で知識豊富なAIアシスタントです。
ユーザーの質問に対して、正確で役立つ情報を提供します。
必要に応じて、コードや例を含めて説明してください。"""
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_EXTENSIONS: List[str] = [".txt", ".pdf", ".doc", ".docx", ".md", ".csv"]
    
    # Static Files Configuration
    STATIC_DIR: str = str(BASE_DIR / "static")
    
    # Session Configuration
    SESSION_COOKIE_NAME: str = "chat_session_id"
    SESSION_EXPIRE_HOURS: int = 24
    
    # Performance Configuration
    ENABLE_VIRTUAL_SCROLL: bool = True
    MESSAGES_BATCH_SIZE: int = 50
    ENABLE_PROGRESSIVE_LOADING: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


# Create settings instance
settings = Settings()

# Ensure directories exist
Path(settings.STATIC_DIR).mkdir(parents=True, exist_ok=True)