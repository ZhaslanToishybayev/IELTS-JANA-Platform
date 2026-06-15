"""Legacy local SQLite schema helper.

Alembic is now the preferred schema management path:

    alembic upgrade head

Keep this script only as a best-effort fallback for old local databases when a
developer cannot run Alembic yet. Do not add new schema changes here unless
there is a specific local recovery need.
"""

import sys

sys.path.insert(0, ".")

from sqlalchemy import inspect, text

from app.database import Base, engine


def add_column_if_missing(conn, table: str, column: str, ddl: str):
    columns = {col["name"] for col in inspect(conn).get_columns(table)}
    if column not in columns:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
        print(f"Added {table}.{column}")


def main():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        existing_tables = set(inspect(conn).get_table_names())
        if "questions" in existing_tables:
            add_column_if_missing(conn, "questions", "test_set_id", "INTEGER")
            add_column_if_missing(conn, "questions", "section", "VARCHAR(50)")
            add_column_if_missing(conn, "questions", "estimated_band", "FLOAT")
            add_column_if_missing(conn, "questions", "tags", "JSON")
            add_column_if_missing(conn, "questions", "needs_review", "BOOLEAN DEFAULT 0")
            add_column_if_missing(conn, "questions", "approved", "BOOLEAN DEFAULT 1")
    print("Local schema is ready.")


if __name__ == "__main__":
    main()
