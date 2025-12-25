# Backend Deployment - Railway/Render

## Requirements
- Python 3.12
- SQLite (for MVP) or PostgreSQL (production)

## Files required:
# 1. Procfile
# 2. runtime.txt
# 3. .env.example

# Build Command
pip install -r requirements.txt

# Start Command
uvicorn app.main:app --host 0.0.0.0 --port $PORT
