"""
Shared SQLite database utilities.

Provides a connection factory and common helpers so every app
gets the same WAL-mode, Row-factory defaults.
"""

import os
import sqlite3
from pathlib import Path
from contextlib import contextmanager


DEFAULT_DB_DIR = Path(__file__).resolve().parent.parent / "local_data"


def get_db_path(app_name: str | None = None) -> Path:
    """
    Return the absolute database path for an app.

    If *app_name* is given the DB lives at ``<project>/apps/<app>/backend/local_data/<app>.db``,
    otherwise the shared ``backend/local_data/hub.db`` is used.
    """
    if app_name:
        app_data = Path(__file__).resolve().parent.parent.parent / "apps" / app_name / "backend" / "local_data"
        app_data.mkdir(parents=True, exist_ok=True)
        return app_data / f"{app_name}.db"
    DEFAULT_DB_DIR.mkdir(parents=True, exist_ok=True)
    return DEFAULT_DB_DIR / "hub.db"


@contextmanager
def connect(db_path: Path | str | None = None):
    """
    Context-manager that yields a ``sqlite3.Connection`` with:
    - WAL journal mode
    - ``sqlite3.Row`` row factory
    - foreign keys enabled
    - auto-commit on clean exit, rollback on exception
    """
    path = str(db_path or get_db_path())
    conn = sqlite3.connect(path, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
