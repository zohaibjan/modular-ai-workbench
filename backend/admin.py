"""
Hub Platform — Admin API.

All routes are protected — caller must be an active admin (role='admin' in JWT).
Mounted at /api/admin/* by main.py.
"""

from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException
from pydantic import BaseModel

from backend.auth import decode_token
from backend import users as user_store
from backend.users import _UNSET

router = APIRouter(tags=["admin"])


# ── Admin guard ───────────────────────────────────────────────────────────────

def require_admin(hub_token: Optional[str] = Cookie(default=None)) -> dict:
    if not hub_token:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    payload = decode_token(hub_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return payload


# ── Request / response models ─────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str = "user"
    allowed_apps: Optional[list[str]] = None  # None = access to all apps


class UpdateUserRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    allowed_apps: Optional[list[str]] = None   # send [] for "all apps"
    is_active: Optional[bool] = None
    clear_app_restriction: bool = False        # set True to give access to all apps


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(_admin: dict = Depends(require_admin)):
    return {"users": user_store.list_users()}


@router.post("/users", status_code=201)
def create_user(body: CreateUserRequest, _admin: dict = Depends(require_admin)):
    if not body.username.strip():
        raise HTTPException(status_code=400, detail="Username cannot be empty.")
    if len(body.password) < 12:
        raise HTTPException(status_code=400, detail="Password must be at least 12 characters.")
    if body.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'user'.")
    try:
        user_id = user_store.create_user(
            body.username.strip(),
            body.password,
            role=body.role,
            allowed_apps=body.allowed_apps,
        )
    except Exception as exc:
        if "UNIQUE" in str(exc).upper():
            raise HTTPException(status_code=409, detail="Username already exists.")
        raise HTTPException(status_code=500, detail=str(exc))
    return {"ok": True, "id": user_id}


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    body: UpdateUserRequest,
    admin: dict = Depends(require_admin),
):
    if body.password is not None and len(body.password) < 12:
        raise HTTPException(status_code=400, detail="Password must be at least 12 characters.")
    if body.role is not None and body.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Invalid role.")
    # Prevent demoting the last admin
    target = user_store.get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    if (body.role == "user" or body.is_active is False) and target["role"] == "admin":
        if user_store.count_admins() <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote or disable the last admin account.",
            )

    # Prevent admin from locking themselves out
    if body.is_active is False and str(user_id) == str(admin.get("sub")):
        raise HTTPException(status_code=400, detail="You cannot disable your own account.")

    allowed_apps_sentinel = _UNSET  # means "not provided — don't update"
    if body.clear_app_restriction:
        allowed_apps_sentinel = None  # None in DB = access to all apps
    elif body.allowed_apps is not None:
        allowed_apps_sentinel = body.allowed_apps  # specific list

    changed = user_store.update_user(
        user_id,
        username=body.username,
        password=body.password,
        role=body.role,
        allowed_apps=allowed_apps_sentinel,
        is_active=body.is_active,
    )
    if not changed:
        raise HTTPException(status_code=400, detail="No changes were made.")
    return {"ok": True}


@router.delete("/users/{user_id}", status_code=200)
def delete_user(user_id: int, admin: dict = Depends(require_admin)):
    target = user_store.get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    if str(user_id) == str(admin.get("sub")):
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")

    if target["role"] == "admin" and user_store.count_admins() <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last admin account.")

    user_store.delete_user(user_id)
    return {"ok": True}
