"""Add persisted diagnostic sessions.

Revision ID: 20260616_0002
Revises: 20260616_0001
Create Date: 2026-06-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "20260616_0002"
down_revision: Union[str, Sequence[str], None] = "20260616_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_names(bind) -> set[str]:
    return set(inspect(bind).get_table_names())


def _column_names(bind, table_name: str) -> set[str]:
    return {column["name"] for column in inspect(bind).get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    tables = _table_names(bind)

    if "diagnostic_sessions" not in tables:
        op.create_table(
            "diagnostic_sessions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("module", sa.String(length=20), nullable=False),
            sa.Column("target_questions", sa.Integer(), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("started_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.Column("accuracy", sa.Float(), nullable=True),
            sa.Column("estimated_band", sa.Float(), nullable=True),
            sa.Column("result_snapshot", sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_diagnostic_sessions_id"),
            "diagnostic_sessions",
            ["id"],
            unique=False,
        )

    if "attempts" in tables and "diagnostic_session_id" not in _column_names(bind, "attempts"):
        with op.batch_alter_table("attempts") as batch_op:
            batch_op.add_column(sa.Column("diagnostic_session_id", sa.Integer(), nullable=True))
            batch_op.create_foreign_key(
                "fk_attempts_diagnostic_session_id_diagnostic_sessions",
                "diagnostic_sessions",
                ["diagnostic_session_id"],
                ["id"],
            )


def downgrade() -> None:
    """No-op downgrade to avoid destructive local data loss."""
    pass
