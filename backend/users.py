"""
Hub Platform — User management.

SQLite-backed user store using stdlib-only PBKDF2 password hashing (no extra deps).

Schema
------
users:
  id            INTEGER PK
  username      TEXT UNIQUE (case-insensitive)
  password_hash TEXT   — "{salt}${hex_digest}" via PBKDF2-HMAC-SHA256
  role          TEXT   — 'admin' | 'user'
  allowed_apps  TEXT   — JSON array of app IDs, or NULL (means all apps)
  is_active     INTEGER 1/0
  created_at    TEXT   ISO datetime

On first startup, if no admin user exists, a default admin is created from
the ADMIN_PASSWORD env var. No default password is provided.
"""

import hashlib
import json
import os
import secrets
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).parent / "local_data" / "users.db"


def _ensure_dir() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)


@contextmanager
def _db():
    _ensure_dir()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ── Schema ────────────────────────────────────────────────────────────────────

def init_db() -> None:
    with _db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                username     TEXT    UNIQUE NOT NULL COLLATE NOCASE,
                password_hash TEXT   NOT NULL,
                role         TEXT    NOT NULL DEFAULT 'user',
                allowed_apps TEXT,
                is_active    INTEGER NOT NULL DEFAULT 1,
                created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            )
        """)

    # Seed default admin if none exists
    if count_admins() == 0:
        admin_pw = os.environ.get("ADMIN_PASSWORD", "")
        if len(admin_pw) < 12:
            raise RuntimeError("Set ADMIN_PASSWORD to at least 12 characters before first startup.")
        create_user("admin", admin_pw, role="admin", allowed_apps=None)
        print(f"[OK] Administrator created from supplied configuration.")


# ── Password helpers ──────────────────────────────────────────────────────────

def _hash_password(password: str, salt: str | None = None) -> str:
    if salt is None:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 260_000)
    return f"{salt}${dk.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, _ = stored_hash.split("$", 1)
        expected = _hash_password(password, salt)
        return secrets.compare_digest(expected, stored_hash)
    except Exception:
        return False


# ── CRUD ──────────────────────────────────────────────────────────────────────

def create_user(
    username: str,
    password: str,
    role: str = "user",
    allowed_apps: list[str] | None = None,
) -> int:
    ph = _hash_password(password)
    apps_json = json.dumps(allowed_apps) if allowed_apps is not None else None
    with _db() as conn:
        cur = conn.execute(
            "INSERT INTO users (username, password_hash, role, allowed_apps) VALUES (?,?,?,?)",
            (username, ph, role, apps_json),
        )
        return cur.lastrowid


def get_user_by_username(username: str) -> Optional[dict]:
    with _db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username=? AND is_active=1",
            (username,),
        ).fetchone()
    if not row:
        return None
    user = dict(row)
    user["allowed_apps"] = json.loads(user["allowed_apps"]) if user["allowed_apps"] else None
    return user


def get_user_by_id(user_id: int) -> Optional[dict]:
    with _db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    if not row:
        return None
    user = dict(row)
    user["allowed_apps"] = json.loads(user["allowed_apps"]) if user["allowed_apps"] else None
    return user


def list_users() -> list[dict]:
    with _db() as conn:
        rows = conn.execute(
            "SELECT id, username, role, allowed_apps, is_active, created_at FROM users ORDER BY id"
        ).fetchall()
    result = []
    for row in rows:
        u = dict(row)
        u["allowed_apps"] = json.loads(u["allowed_apps"]) if u["allowed_apps"] else None
        result.append(u)
    return result


# Sentinel meaning "this argument was not supplied — don't update this column"
_UNSET = object()


def update_user(
    user_id: int,
    *,
    username=None,
    password=None,
    role=None,
    allowed_apps=_UNSET,  # _UNSET = not provided; None = all apps; list = specific apps
    is_active=None,
) -> bool:
    """Update only the fields that are provided. Returns True if a row was changed."""
    fields, params = [], []

    if username is not None:
        fields.append("username=?"); params.append(username)
    if password is not None:
        fields.append("password_hash=?"); params.append(_hash_password(password))
    if role is not None:
        fields.append("role=?"); params.append(role)
    if allowed_apps is not _UNSET:
        apps_json = json.dumps(allowed_apps) if allowed_apps is not None else None
        fields.append("allowed_apps=?"); params.append(apps_json)
    if is_active is not None:
        fields.append("is_active=?"); params.append(1 if is_active else 0)

    if not fields:
        return False

    params.append(user_id)
    with _db() as conn:
        cur = conn.execute(
            f"UPDATE users SET {', '.join(fields)} WHERE id=?", params
        )
        return cur.rowcount > 0


def delete_user(user_id: int) -> bool:
    with _db() as conn:
        cur = conn.execute("DELETE FROM users WHERE id=?", (user_id,))
        return cur.rowcount > 0


def count_admins() -> int:
    with _db() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM users WHERE role='admin' AND is_active=1"
        ).fetchone()[0]
