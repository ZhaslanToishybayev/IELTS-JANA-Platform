"""Gamification API router for XP, levels, streaks, and skill tree."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserGamificationProfile, SkillTreeResponse, SkillTreeNode
from ..routers.auth import get_current_user
from ..services import get_skill_tree_status, get_user_stats

router = APIRouter(prefix="/gamification", tags=["Gamification"])


@router.get("/profile", response_model=UserGamificationProfile)
async def get_gamification_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's gamification profile.
    
    Returns:
    - Current XP and level
    - XP needed for next level
    - Current and longest streak
    - Total questions answered
    - Overall accuracy rate
    """
    stats = get_user_stats(db, current_user.id)
    
    if not stats:
        return UserGamificationProfile(
            xp=current_user.xp,
            level=current_user.level,
            xp_to_next_level=100,
            current_streak=current_user.current_streak,
            longest_streak=current_user.longest_streak,
            total_questions_answered=0,
            accuracy_rate=0
        )
    
    return UserGamificationProfile(**stats)


@router.get("/skill-tree", response_model=SkillTreeResponse)
async def get_skill_tree(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the skill tree with unlock and mastery status.
    
    Returns:
    - All skill nodes with mastery levels
    - Prerequisite relationships
    - Unlock and mastery status
    - Total unlocked and mastered counts
    """
    tree_data = get_skill_tree_status(db, current_user.id)
    
    return SkillTreeResponse(
        nodes=[SkillTreeNode(**node) for node in tree_data["nodes"]],
        total_unlocked=tree_data["total_unlocked"],
        total_mastered=tree_data["total_mastered"]
    )


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get the top users by XP.
    
    Note: Optional for MVP, basic implementation.
    """
    users = db.query(User).order_by(User.xp.desc()).limit(limit).all()
    
    return [
        {
            "rank": i + 1,
            "username": u.username,
            "xp": u.xp,
            "level": u.level
        }
        for i, u in enumerate(users)
    ]
