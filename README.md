# Modular AI Workbench

A FastAPI and React application hub with module discovery, a login flow, user administration,
per-module access restrictions and a shared UI. A small text-statistics module demonstrates the
extension contract without requiring an AI account.

This public edition contains the platform and a synthetic starter module. Original business apps,
customer/candidate records, databases, exports, operations notes and server deployment files are excluded.
Shared `backend/core/ai.py` is available for future AI modules; the included example makes no AI calls.

## Run locally

Requires Python 3.11+ and Node.js 20+.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Put a generated secret in JWT_SECRET; choose ADMIN_PASSWORD with at least 12 characters.
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. Log in as `admin` with the password you configured. The local user
database is created on first startup and ignored by Git. No default password is shipped.

## Add a module

Create `apps/<id>/app.json`, `apps/<id>/backend/router.py` exporting `router`, and a React entry under
`apps/<id>/frontend/`. The backend discovers manifests at startup and mounts `/api/<id>`. Register
the frontend lazy import and route in `frontend/src/App.jsx`; frontend registration is explicit.
The `example` module shows the complete contract. Module permissions are enforced on API calls,
not just hidden in the UI; disabled accounts lose access on the next request.

## Validation and limits

```bash
pip install httpx
python -m unittest discover -s tests -v
cd frontend && npm run build
```

8 offline API tests pass; the Vite production build passes. This is a local reference implementation,
not a hardened hosted identity system. Internet deployment requires TLS, login rate limits, recovery,
CSRF/origin review, monitoring and a review of any modules added. Set `ENV=production` for secure cookies.

## Public edition

This is a separately prepared portfolio edition with fresh history. Private deployment settings,
credentials, operational records, uploads, backups and organisation-specific assets are excluded.
See [PUBLIC_EDITION.md](PUBLIC_EDITION.md). No deployment workflows are included.

## Automated checks

GitHub Actions runs offline regression checks on pushes and pull requests. These do not deploy the app, call paid AI services or establish model quality. A separate job builds the React frontend. 
