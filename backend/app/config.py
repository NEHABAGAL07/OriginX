from dotenv import load_dotenv
import os

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_USE_DIRECT_DB: bool = os.getenv("SUPABASE_USE_DIRECT_DB", "false").lower() == "true"
    SUPABASE_DIRECT_DB_URL: str = os.getenv("SUPABASE_DIRECT_DB_URL", "")
    NEWSAPI_KEY: str = os.getenv("NEWSAPI_KEY", "")
    GOOGLE_AI_STUDIO_API_KEY: str = os.getenv("GOOGLE_AI_STUDIO_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.0-mini")


settings = Settings()


def validate_required_settings() -> None:
    missing: list[str] = []

    if not settings.SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not settings.SUPABASE_KEY:
        missing.append("SUPABASE_KEY")

    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
