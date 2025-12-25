from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "sqlite:///./jana.db"
    
    # JWT Authentication
    # WARNING: Change this in production using .env file!
    secret_key: str = "unsafe-development-secret-key-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Gamification
    base_xp: int = 10
    difficulty_multiplier: float = 1.5
    streak_bonus: int = 5
    perfect_session_bonus: int = 20
    
    # Knowledge Tracing Parameters
    bkt_initial_mastery: float = 0.3
    bkt_learn_rate: float = 0.1
    bkt_guess_rate: float = 0.2
    bkt_slip_rate: float = 0.1
    
    # AI Configuration
    gemini_api_key: str | None = None
    
    # Email Configuration (SMTP)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "noreply@ielts-jana.com"
    smtp_from_name: str = "IELTS JANA"
    smtp_use_tls: bool = True
    
    # Frontend URL for email links
    frontend_url: str = "http://localhost:3000"
    
    # Email token expiry
    email_verification_expire_hours: int = 24
    password_reset_expire_hours: int = 1
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra env vars without erroring


@lru_cache()
def get_settings() -> Settings:
    return Settings()
