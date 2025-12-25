"""Dashboard API router for progress and metrics."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..schemas import DashboardResponse, ProgressHistoryItem, SkillProgress
from ..routers.auth import get_current_user
from ..services import get_dashboard_data, get_progress_history

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/progress", response_model=DashboardResponse)
async def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard data.
    
    Returns:
    - User info (level, XP, streak)
    - Estimated band score
    - Overall accuracy and response time
    - Per-skill breakdown with mastery levels
    """
    data = get_dashboard_data(db, current_user.id)
    
    if not data:
        return DashboardResponse(
            username=current_user.username,
            level=current_user.level,
            xp=current_user.xp,
            xp_to_next_level=100,
            current_streak=current_user.current_streak,
            estimated_band=4.0,
            total_attempts=0,
            overall_accuracy=0,
            avg_response_time_ms=0,
            skills=[]
        )
    
    return DashboardResponse(
        username=data["username"],
        level=data["level"],
        xp=data["xp"],
        xp_to_next_level=data["xp_to_next_level"],
        current_streak=data["current_streak"],
        estimated_band=data["estimated_band"],
        total_attempts=data["total_attempts"],
        overall_accuracy=data["overall_accuracy"],
        avg_response_time_ms=data["avg_response_time_ms"],
        skills=[SkillProgress(**s) for s in data["skills"]]
    )


@router.get("/history", response_model=List[ProgressHistoryItem])
async def get_history(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily progress history for the last N days.
    
    Returns:
    - Daily estimated band scores
    - Daily accuracy rates
    - Daily attempt counts
    - Daily XP earned
    """
    history = get_progress_history(db, current_user.id, days)
    return [ProgressHistoryItem(**h) for h in history]


@router.get("/skills", response_model=List[SkillProgress])
async def get_skills_breakdown(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed skill breakdown.
    
    Returns per-skill:
    - Mastery probability
    - Attempt count
    - Accuracy rate
    - Unlock status
    """
    data = get_dashboard_data(db, current_user.id)
    
    if not data or "skills" not in data:
        return []
    
    return [SkillProgress(**s) for s in data["skills"]]
