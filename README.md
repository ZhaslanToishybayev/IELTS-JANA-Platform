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

# Seed the database with sample questions
python seed_data.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

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
