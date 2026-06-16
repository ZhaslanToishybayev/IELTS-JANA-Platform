"""IELTS JANA - Gamified AI-Powered Reading Prep Platform"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import (
    auth_router, questions_router, dashboard_router, 
    gamification_router, writing_router, speaking_router, 
    vocabulary_router, generator_router, mock_router,
    achievements_router, listening_router, admin_router,
    content_router, practice_router, review_router, study_plan_router,
    prompts_router, plan_router, diagnostic_router
)
from .middleware.rate_limiter import setup_rate_limiter
from .config import get_settings

# Create FastAPI app
settings = get_settings()
app = FastAPI(
    title="IELTS JANA",
    description="Gamified AI-powered IELTS Reading preparation platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],  # Explicit methods instead of *
    allow_headers=["Authorization", "Content-Type"],  # Explicit headers
)

# Setup rate limiting
setup_rate_limiter(app)

# Keep local startup forgiving, but use Alembic for intentional schema changes:
#   cd backend && alembic upgrade head
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(questions_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(gamification_router, prefix="/api")
app.include_router(writing_router)
app.include_router(speaking_router)
app.include_router(vocabulary_router)
app.include_router(generator_router, prefix="/api")
app.include_router(mock_router, prefix="/api")
app.include_router(achievements_router, prefix="/api")
app.include_router(listening_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(content_router, prefix="/api")
app.include_router(practice_router, prefix="/api")
app.include_router(review_router, prefix="/api")
app.include_router(study_plan_router, prefix="/api")
app.include_router(prompts_router, prefix="/api")
app.include_router(plan_router, prefix="/api")
app.include_router(diagnostic_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "IELTS JANA API",
        "version": "1.0.0",
        "docs": "/docs",
        "description": "AI-powered adaptive IELTS Reading preparation"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
