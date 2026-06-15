"""Baseline current backend schema.

Revision ID: 20260616_0001
Revises:
Create Date: 2026-06-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

from app.database import Base
from app.models import *  # noqa: F401,F403 - register model metadata for create_all


# revision identifiers, used by Alembic.
revision: str = "20260616_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


QUESTION_COLUMNS = {
    "test_set_id": sa.Column("test_set_id", sa.Integer(), nullable=True),
    "section": sa.Column("section", sa.String(length=50), nullable=True),
    "estimated_band": sa.Column("estimated_band", sa.Float(), nullable=True),
    "tags": sa.Column("tags", sa.JSON(), nullable=True),
    "needs_review": sa.Column(
        "needs_review",
        sa.Boolean(),
        nullable=True,
        server_default=sa.false(),
    ),
    "approved": sa.Column(
        "approved",
        sa.Boolean(),
        nullable=True,
        server_default=sa.true(),
    ),
}


def _table_names(bind) -> set[str]:
    return set(inspect(bind).get_table_names())


def _column_names(bind, table_name: str) -> set[str]:
    return {column["name"] for column in inspect(bind).get_columns(table_name)}


def upgrade() -> None:
    """Create current tables and patch older local SQLite question tables."""
    bind = op.get_bind()

    # Creates all missing current-model tables for fresh databases and older
    # local databases without modifying existing tables or data.
    Base.metadata.create_all(bind=bind)

    if "questions" not in _table_names(bind):
        return

    existing_columns = _column_names(bind, "questions")
    missing_columns = [
        column.copy()
        for name, column in QUESTION_COLUMNS.items()
        if name not in existing_columns
    ]
    if not missing_columns:
        return

    with op.batch_alter_table("questions") as batch_op:
        for column in missing_columns:
            batch_op.add_column(column)


def downgrade() -> None:
    """No-op downgrade to avoid destructive local data loss."""
    pass
