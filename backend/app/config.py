from functools import lru_cache
from pydantic_settings import BaseSettings


UNSAFE_DEVELOPMENT_SECRET = "unsafe-development-secret-key-change-me"
UNSAFE_SECRET_VALUES = {
    "",
    "change-me-in-production",
    "your-super-secret-key-change-in-production",
    UNSAFE_DEVELOPMENT_SECRET,
}


def parse_csv_setting(value: str) -> list[str]:
    """Parse comma-separated environment values while trimming empty entries."""
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Runtime
    environment: str = "development"
    
    # Database
    database_url: str = "sqlite:///./jana.db"
    
    # JWT Authentication
    # Development-only default. Production must provide a strong SECRET_KEY.
    secret_key: str = UNSAFE_DEVELOPMENT_SECRET
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Authorization and browser access
    admin_emails: str = ""
    backend_cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,https://ielts-jana.vercel.app"
    rate_limit_enabled: bool = True
    
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
    ai_provider: str = "ollama"  # ollama, gemini, local, auto
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:7b"
    ollama_timeout_sec: int = 20
    whisper_model: str = "base"
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

    @property
    def admin_email_set(self) -> set[str]:
        return {email.lower() for email in parse_csv_setting(self.admin_emails)}

    @property
    def cors_origins(self) -> list[str]:
        return parse_csv_setting(self.backend_cors_origins)

    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() == "production"

    def validate_production_safety(self) -> None:
        if self.is_production and self.secret_key.strip() in UNSAFE_SECRET_VALUES:
            raise RuntimeError(
                "SECRET_KEY must be set to a strong non-default value when ENVIRONMENT=production."
            )


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_production_safety()
    return settings
