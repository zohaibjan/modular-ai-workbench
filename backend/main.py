"""
Hub Platform — Main FastAPI application.

Auto-discovers and mounts app routers from ``apps/*/backend/router.py``.
Each app exposes a ``router`` (APIRouter) instance that gets mounted
under ``/api/<app_name>/…``.
"""

import os
import json
import importlib
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")                       # backend/.env

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


# ── App setup ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="Hub Platform API",
    description="Multi-app platform — auto-discovers apps from the apps/ directory",
    version="1.0.0",
)

# CORS — locked to configured origins; falls back to same-origin only in production.
_allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
_allowed_origins = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()] or ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth middleware — protects all /api/* routes except the auth endpoints themselves.
from backend.auth import verify_token  # noqa: E402  (imported after app creation)

_PUBLIC_PATHS = {
    "/",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/verify",
}


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # Allow public paths and anything that isn't under /api/
        if path in _PUBLIC_PATHS or not path.startswith("/api/"):
            return await call_next(request)
        token = request.cookies.get("hub_token")
        if not token or not verify_token(token):
            return JSONResponse({"detail": "Not authenticated."}, status_code=401)
        from backend.auth import decode_token
        payload = decode_token(token)
        app_id = path.split('/')[2] if len(path.split('/')) > 2 else ''
        allowed = payload.get('allowed_apps')
        if app_id not in ('apps', 'auth', 'admin') and allowed is not None and app_id not in allowed:
            return JSONResponse({'detail': 'App access denied.'}, status_code=403)
        return await call_next(request)


app.add_middleware(AuthMiddleware)

from backend.auth import router as auth_router       # noqa: E402
from backend.admin import router as admin_router     # noqa: E402
from backend.users import init_db                    # noqa: E402
from backend.auth import decode_token                # noqa: E402

app.include_router(auth_router, prefix="/api/auth")
app.include_router(admin_router, prefix="/api/admin")

# Initialise user DB on startup (creates tables + seeds default admin if empty)
init_db()

APPS_DIR = Path(__file__).resolve().parent.parent / "apps"


# ── App discovery ────────────────────────────────────────────────────────

def discover_apps():
    """
    Scan ``apps/`` for subdirectories that contain both
    ``app.json`` (manifest) and ``backend/router.py`` (API routes).
    Yields ``(app_id, manifest_dict, module)`` tuples.
    """
    if not APPS_DIR.is_dir():
        return

    for child in sorted(APPS_DIR.iterdir()):
        if not child.is_dir():
            continue

        manifest_path = child / "app.json"
        router_path   = child / "backend" / "router.py"

        if not manifest_path.exists() or not router_path.exists():
            continue

        app_id = child.name
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

        try:
            module = importlib.import_module(f"apps.{app_id}.backend.router")
        except Exception as exc:
            print(f"[WARN] Failed to import apps.{app_id}.backend.router: {exc}")
            continue

        if not hasattr(module, "router"):
            print(f"[WARN] apps.{app_id}.backend.router has no 'router' attribute, skipping")
            continue

        yield app_id, manifest, module


# Mount discovered routers
_loaded: list[dict] = []

for app_id, manifest, module in discover_apps():
    prefix = f"/api/{app_id}"
    app.include_router(module.router, prefix=prefix, tags=[manifest.get("name", app_id)])
    _loaded.append({**manifest, "id": app_id, "api_prefix": prefix})
    print(f"[OK] Mounted app '{app_id}' at {prefix}")


# ── Platform endpoints ───────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "platform": "Hub",
        "version": "1.0.0",
        "apps": len(_loaded),
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "apps_loaded": len(_loaded)}


@app.get("/api/apps")
async def list_apps(request: Request):
    """Return apps the current user is allowed to access (filtered by JWT allowed_apps)."""
    token = request.cookies.get("hub_token")
    payload = decode_token(token) if token else None
    allowed = payload.get("allowed_apps") if payload else None  # None = all apps

    if allowed is None:
        return {"apps": _loaded}

    filtered = [a for a in _loaded if a.get("id") in allowed]
    return {"apps": filtered}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, access_log=False)
