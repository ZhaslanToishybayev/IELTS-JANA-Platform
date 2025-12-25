"""IELTS JANA - Gamified AI-Powered Reading Prep Platform"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import (
    auth_router, questions_router, dashboard_router, 
    gamification_router, writing_router, speaking_router, 
    vocabulary_router, generator_router, mock_router,
    achievements_router, listening_router, admin_router
)
from .middleware.rate_limiter import setup_rate_limiter

# Create FastAPI app
app = FastAPI(
    title="IELTS JANA",
    description="Gamified AI-powered IELTS Reading preparation platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for frontend
# In production, this should be set to the actual domain
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ielts-jana.vercel.app",  # Production domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],  # Explicit methods instead of *
    allow_headers=["Authorization", "Content-Type"],  # Explicit headers
)

# Setup rate limiting
setup_rate_limiter(app)

# Create database tables
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
