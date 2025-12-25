"""Achievements service for checking and awarding achievements."""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models.models import Achievement, UserAchievement, User, Attempt, UserSkillMastery


# Achievement definitions to seed
ACHIEVEMENT_DEFINITIONS = [
    # Streak achievements
    {"code": "STREAK_3", "name": "Warming Up", "description": "Maintain a 3-day streak", 
     "icon": "🔥", "category": "STREAK", "requirement": {"type": "streak", "value": 3}, 
     "xp_reward": 50, "rarity": "COMMON"},
    {"code": "STREAK_7", "name": "Week Warrior", "description": "Maintain a 7-day streak", 
     "icon": "⚡", "category": "STREAK", "requirement": {"type": "streak", "value": 7}, 
     "xp_reward": 100, "rarity": "UNCOMMON"},
    {"code": "STREAK_30", "name": "Monthly Master", "description": "Maintain a 30-day streak", 
     "icon": "💪", "category": "STREAK", "requirement": {"type": "streak", "value": 30}, 
     "xp_reward": 500, "rarity": "EPIC"},
    
    # Level achievements
    {"code": "LEVEL_5", "name": "Rising Star", "description": "Reach level 5", 
     "icon": "⭐", "category": "LEVEL", "requirement": {"type": "level", "value": 5}, 
     "xp_reward": 100, "rarity": "COMMON"},
    {"code": "LEVEL_10", "name": "Dedicated Learner", "description": "Reach level 10", 
     "icon": "🌟", "category": "LEVEL", "requirement": {"type": "level", "value": 10}, 
     "xp_reward": 200, "rarity": "UNCOMMON"},
    {"code": "LEVEL_25", "name": "IELTS Expert", "description": "Reach level 25", 
     "icon": "👑", "category": "LEVEL", "requirement": {"type": "level", "value": 25}, 
     "xp_reward": 500, "rarity": "RARE"},
    
    # Accuracy achievements
    {"code": "ACCURACY_80", "name": "Sharp Mind", "description": "Achieve 80% accuracy (min 50 attempts)", 
     "icon": "🎯", "category": "ACCURACY", "requirement": {"type": "accuracy", "value": 0.8, "min_attempts": 50}, 
     "xp_reward": 150, "rarity": "UNCOMMON"},
    {"code": "ACCURACY_90", "name": "Precision Master", "description": "Achieve 90% accuracy (min 100 attempts)", 
     "icon": "💎", "category": "ACCURACY", "requirement": {"type": "accuracy", "value": 0.9, "min_attempts": 100}, 
     "xp_reward": 300, "rarity": "RARE"},
    
    # Progress achievements
    {"code": "FIRST_CORRECT", "name": "First Steps", "description": "Answer your first question correctly", 
     "icon": "🎉", "category": "PROGRESS", "requirement": {"type": "correct_count", "value": 1}, 
     "xp_reward": 25, "rarity": "COMMON"},
    {"code": "ATTEMPTS_100", "name": "Century", "description": "Complete 100 practice questions", 
     "icon": "💯", "category": "PROGRESS", "requirement": {"type": "attempts", "value": 100}, 
     "xp_reward": 200, "rarity": "UNCOMMON"},
    {"code": "ATTEMPTS_500", "name": "Practice Makes Perfect", "description": "Complete 500 practice questions", 
     "icon": "🏅", "category": "PROGRESS", "requirement": {"type": "attempts", "value": 500}, 
     "xp_reward": 500, "rarity": "RARE"},
    
    # Band score achievements
    {"code": "BAND_6", "name": "Competent User", "description": "Reach estimated band score 6.0", 
     "icon": "📈", "category": "BAND", "requirement": {"type": "band", "value": 6.0}, 
     "xp_reward": 200, "rarity": "UNCOMMON"},
    {"code": "BAND_7", "name": "Good User", "description": "Reach estimated band score 7.0", 
     "icon": "🚀", "category": "BAND", "requirement": {"type": "band", "value": 7.0}, 
     "xp_reward": 400, "rarity": "RARE"},
    {"code": "BAND_8", "name": "Very Good User", "description": "Reach estimated band score 8.0", 
     "icon": "🏆", "category": "BAND", "requirement": {"type": "band", "value": 8.0}, 
     "xp_reward": 750, "rarity": "EPIC"},
]


def seed_achievements(db: Session) -> None:
    """Seed achievement definitions into database."""
    for achievement_data in ACHIEVEMENT_DEFINITIONS:
        existing = db.query(Achievement).filter(Achievement.code == achievement_data["code"]).first()
        if not existing:
            achievement = Achievement(**achievement_data)
            db.add(achievement)
    db.commit()


def get_all_achievements(db: Session) -> List[Achievement]:
    """Get all available achievements."""
    return db.query(Achievement).all()


def get_user_achievements(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """Get achievements with user's unlock status."""
    achievements = db.query(Achievement).all()
    user_unlocked = db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
    unlocked_ids = {ua.achievement_id: ua for ua in user_unlocked}
    
    result = []
    for achievement in achievements:
        is_unlocked = achievement.id in unlocked_ids
        result.append({
            "id": achievement.id,
            "code": achievement.code,
            "name": achievement.name,
            "description": achievement.description,
            "icon": achievement.icon,
            "category": achievement.category,
            "xp_reward": achievement.xp_reward,
            "rarity": achievement.rarity,
            "is_unlocked": is_unlocked,
            "unlocked_at": unlocked_ids[achievement.id].unlocked_at if is_unlocked else None
        })
    
    return result


def check_and_award_achievements(db: Session, user: User) -> List[Achievement]:
    """Check user's progress and award any newly earned achievements."""
    newly_earned = []
    
    # Get all achievements user hasn't unlocked
    unlocked_ids = [ua.achievement_id for ua in db.query(UserAchievement).filter(
        UserAchievement.user_id == user.id
    ).all()]
    
    locked_achievements = db.query(Achievement).filter(
        ~Achievement.id.in_(unlocked_ids) if unlocked_ids else True
    ).all()
    
    # Get user stats
    total_attempts = db.query(Attempt).filter(Attempt.user_id == user.id).count()
    correct_attempts = db.query(Attempt).filter(
        Attempt.user_id == user.id, 
        Attempt.is_correct == True
    ).count()
    accuracy = correct_attempts / total_attempts if total_attempts > 0 else 0
    
    # Get estimated band from dashboard service
    from ..services.dashboard import get_dashboard_data
    dashboard = get_dashboard_data(db, user.id)
    estimated_band = dashboard.get("estimated_band", 4.0)
    
    for achievement in locked_achievements:
        req = achievement.requirement
        earned = False
        
        if req["type"] == "streak":
            earned = user.current_streak >= req["value"]
        elif req["type"] == "level":
            earned = user.level >= req["value"]
        elif req["type"] == "accuracy":
            earned = accuracy >= req["value"] and total_attempts >= req.get("min_attempts", 0)
        elif req["type"] == "correct_count":
            earned = correct_attempts >= req["value"]
        elif req["type"] == "attempts":
            earned = total_attempts >= req["value"]
        elif req["type"] == "band":
            earned = estimated_band >= req["value"]
        
        if earned:
            # Award achievement
            user_achievement = UserAchievement(
                user_id=user.id,
                achievement_id=achievement.id
            )
            db.add(user_achievement)
            
            # Add XP reward
            user.xp += achievement.xp_reward
            
            newly_earned.append(achievement)
    
    if newly_earned:
        db.commit()
    
    return newly_earned
