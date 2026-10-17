"""
Hub Platform — Authentication module.

Multi-user JWT auth stored in an HttpOnly cookie.

Public endpoints:
  POST /api/auth/login   — validate username+password, set cookie
  POST /api/auth/logout  — clear cookie
  GET  /api/auth/verify  — return current user info (used by frontend on mount)
"""

import os
import time
from typing import Optional

import jwt
from fastapi import APIRouter, Cookie, HTTPException, Response
from pydantic import BaseModel

from backend.users import get_user_by_username, verify_password

router = APIRouter(tags=["auth"])

_JWT_SECRET: str = os.getenv("JWT_SECRET", "")
_JWT_ALGORITHM = "HS256"
_JWT_EXPIRY_SECONDS = 7 * 24 * 3600  # 7 days

_SECURE_COOKIE = os.getenv("ENV", "").lower() == "production"


# ── Token helpers ─────────────────────────────────────────────────────────────

def create_token(user_id: int, username: str, role: str, allowed_apps: list | None) -> str:
    if len(_JWT_SECRET) < 32:
        raise RuntimeError("JWT_SECRET must contain at least 32 characters.")
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "allowed_apps": allowed_apps,  # None = access to all apps
        "exp": int(time.time()) + _JWT_EXPIRY_SECONDS,
        "iat": int(time.time()),
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    if not _JWT_SECRET:
        return None
    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGORITHM])
        from backend.users import get_user_by_id
        current = get_user_by_id(int(payload['sub']))
        if not current or not current['is_active']:
            return None
        payload.update(role=current['role'], allowed_apps=current['allowed_apps'])
        return payload
    except (jwt.PyJWTError, ValueError, KeyError):
        return None


def verify_token(token: str) -> bool:
    return decode_token(token) is not None


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="hub_token",
        value=token,
        httponly=True,
        secure=_SECURE_COOKIE,
        samesite="lax",
        max_age=_JWT_EXPIRY_SECONDS,
        path="/",
    )


# ── Request models ────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/login")
def login(body: LoginRequest, response: Response):
    if not _JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT_SECRET is not configured on the server.")

    user = get_user_by_username(body.username)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="Account is disabled.")

    token = create_token(
        user["id"],
        user["username"],
        user["role"],
        user["allowed_apps"],
    )
    _set_auth_cookie(response, token)
    return {
        "ok": True,
        "username": user["username"],
        "role": user["role"],
        "allowed_apps": user["allowed_apps"],
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="hub_token", path="/", samesite="lax")
    return {"ok": True}


@router.get("/verify")
def verify(hub_token: str | None = Cookie(default=None)):
    """Return current user info — frontend calls this on mount to restore session."""
    if not hub_token:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    payload = decode_token(hub_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return {
        "ok": True,
        "username": payload["username"],
        "role": payload["role"],
        "allowed_apps": payload.get("allowed_apps"),
    }
