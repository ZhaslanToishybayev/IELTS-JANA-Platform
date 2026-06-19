# IELTS JANA - AI-Powered Reading Preparation Platform

A gamified, adaptive IELTS Reading preparation MVP with AI-driven skill tracking and personalized learning.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
alembic upgrade head

# Seed the database with sample questions when needed
python seed_ielts_v1.py

# Optional: seed a realistic local demo learner profile
python seed_demo_user.py

# Check Reading diagnostic/practice content readiness
python check_content_coverage.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Production ASGI start example:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Database Migrations

Alembic is the preferred schema management path for local development and
deployment.

```bash
cd backend
alembic upgrade head
```

Use `alembic upgrade head` after pulling model or migration changes, before
running seed scripts, and before starting the backend against a fresh database.
For content, run seed scripts such as `python seed_ielts_v1.py` after the schema
is current. The IELTS v1 seed content is original IELTS-style demo material for
local development and QA; it is not official IELTS content.

To verify Reading diagnostic and practice readiness locally:

```bash
cd backend
alembic upgrade head
python seed_ielts_v1.py
python check_content_coverage.py
```

### Demo Setup

For portfolio review, diploma presentation, or first user testing, seed the
original demo content and the demo learner account:

```bash
cd backend
alembic upgrade head
python seed_ielts_v1.py
python seed_demo_user.py
python check_content_coverage.py
```

The demo user uses normal authentication, not a backend bypass:

```text
email: demo@ieltsjana.local
password: DemoPass123
```

To show the frontend demo login button, add this to `frontend/.env.local`:

```env
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true
```

`backend/migrate_local_schema.py` is kept only as a legacy best-effort helper for
old local SQLite databases when Alembic cannot be run. New schema changes should
go through Alembic migrations instead.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Access the App
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

### Production Safety Checklist

Before deploying a public environment:

- Set `ENVIRONMENT=production`.
- Set a strong unique `SECRET_KEY`; never use the development default.
- Configure `BACKEND_CORS_ORIGINS` with the exact frontend domains.
- Configure `ADMIN_EMAILS` with explicit admin account emails.
- Keep `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false` unless intentionally showing a demo.
- Run Alembic migrations with `cd backend && alembic upgrade head`.
- Seed demo data only for demo environments, not real production.
- Never commit real secrets or provider keys.

### Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for backend/frontend environment
variables, migration commands, health checks, and suggested hosting options.
Production database examples use PostgreSQL via `psycopg`; local SQLite
development remains unchanged.

### CI

GitHub Actions runs backend tests plus `compileall`, and frontend build plus
lint, on pull requests and pushes to `master`.
CI also runs a PostgreSQL migration smoke check to catch production database
issues early.

### Reading Content Quality

Seeded Reading content is original IELTS-style demo material, not official IELTS
or Cambridge content. After changing Reading seed data, run:

```bash
cd backend
python seed_ielts_v1.py
python validate_reading_content.py
python check_content_coverage.py
```

## 🎮 Features

### AI-Driven Reading Practice
- **Adaptive Difficulty**: Questions adjust based on your performance
- **Bayesian Knowledge Tracing**: Real-time skill mastery estimation
- **Weakness Detection**: Focuses practice on your weakest areas

### Gamification
- **XP System**: Earn points for correct answers
- **Level Progression**: Unlock new challenges as you improve
- **Streak Counter**: Stay motivated with daily practice tracking
- **Skill Tree**: Visual progress through reading skills

### Question Types
- True/False/Not Given
- Matching Headings
- Summary Completion

## 📁 Project Structure

```
JANA/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   └── ml/               # AI/ML engine
│   ├── seed_data.py          # Database seeding
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/              # Next.js pages
    │   ├── components/       # React components
    │   └── lib/              # API client & utilities
    └── package.json
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login/json` | POST | Get JWT token |
| `/api/questions/next` | GET | Get next adaptive question |
| `/api/questions/submit` | POST | Submit answer |
| `/api/dashboard/progress` | GET | Get full dashboard data |
| `/api/gamification/skill-tree` | GET | Get skill tree status |

## 🧠 AI/ML Components

### Local AI Provider
JANA is local-first for IELTS feedback. By default the backend tries Ollama at
`http://localhost:11434` with `qwen2.5:7b`, then falls back to deterministic
local scoring if Ollama is not running.

Recommended local setup:

```bash
ollama pull qwen2.5:7b
ollama serve
```

Backend `.env`:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
WHISPER_MODEL=base
```

`AI_PROVIDER=gemini` or `AI_PROVIDER=auto` can still use `GEMINI_API_KEY` as an
optional cloud provider. Speaking can use local Whisper when the Python
`whisper` package is installed; otherwise it uses deterministic local fallback
and still saves attempts.

### Bayesian Knowledge Tracing (BKT)
Updates skill mastery probability after each attempt:
- **P(L₀)**: Initial mastery probability (0.3)
- **P(T)**: Learning transition rate (0.1)
- **P(G)**: Guess probability (0.2)
- **P(S)**: Slip probability (0.1)

### Adaptive Question Selection
1. Identifies weakest skills (lowest mastery)
2. Selects appropriate difficulty for current level
3. Avoids recently attempted questions
4. Prioritizes skills with fewer attempts

### Band Score Estimation
Maps weighted average mastery to IELTS 4.0-9.0 scale.

## 📊 Database Schema

- **users**: Account info, XP, level, streaks
- **skills**: Reading skill categories
- **questions**: Passages and questions
- **attempts**: User answer history
- **user_skill_masteries**: Per-skill mastery tracking
- **dashboard_metrics**: Daily aggregated stats

## 🎨 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.10+ |
| Database | SQLite (SQLAlchemy) |
| Auth | JWT (python-jose) |
| ML | Custom BKT implementation |

## 📱 Screenshots

The app features:
- Mobile-first responsive design
- Animated XP gains and level-ups
- Real-time mastery progress bars
- Interactive skill tree

## 🔒 Environment Variables

Create `.env` files for custom configuration:

**Backend (.env)**:
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./jana.db
```

**Frontend (.env.local)**:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 📝 License

MIT License - Feel free to use for learning and development.
