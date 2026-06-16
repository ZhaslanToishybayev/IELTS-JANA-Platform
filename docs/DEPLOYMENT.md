# IELTS JANA Deployment Guide

This guide covers the minimal deployment path for the current MVP. It keeps local
development unchanged while making production expectations explicit.

## Local Quick Check

Run these before opening a deployment PR or release:

```bash
cd backend
alembic upgrade head
python -m pytest
python -m compileall app
```

```bash
cd frontend
npm run build
npm run lint
```

## Backend Environment

Use `backend/.env.production.example` as the production template.

Required production values:

- `ENVIRONMENT=production`
- `SECRET_KEY` set to a strong random value
- `DATABASE_URL` pointing at the production database. The production examples
  assume PostgreSQL through SQLAlchemy's `postgresql+psycopg://` driver URL.
- `BACKEND_CORS_ORIGINS` set to exact frontend origins
- `ADMIN_EMAILS` set to explicit admin account emails
- `RATE_LIMIT_ENABLED=true`
- `FRONTEND_URL` set to the deployed frontend URL

Do not commit real secrets or provider keys.

## Frontend Environment

Use `frontend/.env.production.example` as the production template.

Required production values:

- `NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api`
- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false`

Only enable demo login in a demo environment.

## Database Migrations

Production startup does not auto-create tables. Run Alembic migrations before
starting the API:

```bash
cd backend
alembic upgrade head
```

For demo environments only, seed original demo content and the demo learner:

```bash
cd backend
python seed_ielts_v1.py
python seed_demo_user.py
python check_content_coverage.py
```

Do not seed demo data in real production.

## Start Commands

Development:

```bash
uvicorn app.main:app --reload --port 8000
```

Production example:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Health Check

Use the API health endpoint after deploy:

```text
GET https://your-backend-domain.com/api/health
```

Expected healthy response:

```json
{
  "status": "ok",
  "service": "ielts-jana-api",
  "environment": "production",
  "database": "ok",
  "version": "1.0.0"
}
```

If the database is unreachable, the endpoint returns HTTP 503 with
`database: "unavailable"`.

## Suggested Hosting

- Frontend: Vercel
- Backend: Render, Railway, Fly.io, or any ASGI host

## Production Warnings

- `SECRET_KEY` must be strong and unique.
- `BACKEND_CORS_ORIGINS` should list exact domains, not broad wildcards.
- Keep demo login disabled unless intentionally presenting a demo.
- Run Alembic before starting the backend.
- Seed demo data only in demo environments.
- Never commit real secrets.
