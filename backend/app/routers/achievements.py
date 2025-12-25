"""Achievements API router."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User
from ..routers.auth import get_current_user
from ..services.achievements import (
    get_all_achievements, 
    get_user_achievements, 
    check_and_award_achievements,
    seed_achievements
)

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("")
async def list_all_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all available achievements with user's unlock status."""
    achievements = get_user_achievements(db, current_user.id)
    
    # Group by category
    by_category = {}
    for ach in achievements:
        cat = ach["category"]
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(ach)
    
    return {
        "total": len(achievements),
        "unlocked": sum(1 for a in achievements if a["is_unlocked"]),
        "achievements": achievements,
        "by_category": by_category
    }


@router.get("/unlocked")
async def get_unlocked_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get only the achievements user has unlocked."""
    achievements = get_user_achievements(db, current_user.id)
    unlocked = [a for a in achievements if a["is_unlocked"]]
    
    return {
        "count": len(unlocked),
        "achievements": unlocked
    }


@router.post("/check")
async def check_new_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check and award any new achievements for the user."""
    newly_earned = check_and_award_achievements(db, current_user)
    
    if newly_earned:
        return {
            "new_achievements": [
                {
                    "code": a.code,
                    "name": a.name,
                    "description": a.description,
                    "icon": a.icon,
                    "xp_reward": a.xp_reward,
                    "rarity": a.rarity
                }
                for a in newly_earned
            ],
            "total_xp_earned": sum(a.xp_reward for a in newly_earned)
        }
    
    return {"new_achievements": [], "total_xp_earned": 0}


@router.post("/seed", include_in_schema=False)
async def seed_achievement_definitions(
    db: Session = Depends(get_db)
):
    """Seed achievement definitions (admin only, hidden from docs)."""
    seed_achievements(db)
    return {"status": "seeded"}
