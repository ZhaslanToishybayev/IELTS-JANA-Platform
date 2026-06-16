"""Smoke-check Alembic migrations against a PostgreSQL database.

This script is intentionally non-destructive: it only runs migrations to head
and verifies the configured database is at the latest Alembic revision.
"""

from pathlib import Path
from urllib.parse import urlparse

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine

from app.config import get_settings


EXPECTED_SCHEME = "postgresql+psycopg"


def _database_url_scheme(database_url: str) -> str:
    return urlparse(database_url).scheme or "unknown"


def main() -> int:
    settings = get_settings()
    database_url = settings.database_url

    if _database_url_scheme(database_url) != EXPECTED_SCHEME:
        print("DATABASE_URL must use postgresql+psycopg:// for this check.")
        print(f"Current DATABASE_URL scheme: {_database_url_scheme(database_url)}")
        return 1

    backend_dir = Path(__file__).resolve().parent
    alembic_cfg = Config(str(backend_dir / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", database_url)

    command.upgrade(alembic_cfg, "head")

    script = ScriptDirectory.from_config(alembic_cfg)
    head_revision = script.get_current_head()
    engine = create_engine(database_url)

    try:
        with engine.connect() as connection:
            current_revision = MigrationContext.configure(connection).get_current_revision()
    finally:
        engine.dispose()

    if current_revision != head_revision:
        print("PostgreSQL migration check failed: database is not at Alembic head.")
        print(f"Current revision: {current_revision or 'none'}")
        print(f"Head revision: {head_revision}")
        return 1

    print("PostgreSQL migration check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
