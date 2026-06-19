"""Add diagnostic issued-question tracking.

Revision ID: 20260619_0003
Revises: 20260616_0002
Create Date: 2026-06-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "20260619_0003"
down_revision: Union[str, Sequence[str], None] = "20260616_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_names(bind) -> set[str]:
    return set(inspect(bind).get_table_names())


def upgrade() -> None:
    bind = op.get_bind()
    if "diagnostic_session_questions" in _table_names(bind):
        return

    op.create_table(
        "diagnostic_session_questions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("question_id", sa.Integer(), nullable=False),
        sa.Column("attempt_id", sa.Integer(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("served_at", sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column("answered_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["attempt_id"], ["attempts.id"]),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"]),
        sa.ForeignKeyConstraint(["session_id"], ["diagnostic_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "question_id", name="uq_diagnostic_session_question"),
    )
    op.create_index(
        op.f("ix_diagnostic_session_questions_id"),
        "diagnostic_session_questions",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_diagnostic_session_questions_session_id",
        "diagnostic_session_questions",
        ["session_id"],
        unique=False,
    )
    op.create_index(
        "ix_diagnostic_session_questions_attempt_id",
        "diagnostic_session_questions",
        ["attempt_id"],
        unique=False,
    )


def downgrade() -> None:
    """No-op downgrade to avoid destructive local data loss."""
    pass
