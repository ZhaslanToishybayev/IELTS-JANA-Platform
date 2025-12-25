"""Gamification service for XP, levels, streaks, and skill tree."""

from datetime import datetime, date, timedelta
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import User, UserSkillMastery, Skill, Attempt
from ..config import get_settings

settings = get_settings()

# Level thresholds (XP required to reach each level)
LEVEL_THRESHOLDS = [
    0,      # Level 1
    100,    # Level 2
    300,    # Level 3
    600,    # Level 4
    1000,   # Level 5
    1500,   # Level 6
    2200,   # Level 7
    3000,   # Level 8
    4000,   # Level 9
    5000,   # Level 10
    6500,   # Level 11
    8000,   # Level 12
    10000,  # Level 13
    12500,  # Level 14
    15000,  # Level 15+
]


def calculate_xp_for_attempt(difficulty: int, is_correct: bool, streak: int) -> int:
    """
    Calculate XP earned for an attempt.
    
    Formula: base_xp * difficulty_multiplier^(difficulty/5) + streak_bonus
    """
    if not is_correct:
        return 0
    
    base = settings.base_xp
    multiplier = settings.difficulty_multiplier ** (difficulty / 5)
    xp = int(base * multiplier)
    
    # Streak bonus
    if streak > 0:
        xp += min(streak, 7) * settings.streak_bonus  # Cap at 7 days bonus
    
    return xp


def get_level_for_xp(xp: int) -> int:
    """Get level for a given XP amount."""
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if xp >= threshold:
            level = i + 1
        else:
            break
    return level


def get_xp_to_next_level(xp: int) -> int:
    """Get XP required to reach the next level."""
    current_level = get_level_for_xp(xp)
    if current_level >= len(LEVEL_THRESHOLDS):
        # Max level - show progress to arbitrary next milestone
        return 5000 - (xp % 5000)
    return LEVEL_THRESHOLDS[current_level] - xp


def update_user_xp(db: Session, user: User, xp_earned: int) -> Tuple[int, int, bool]:
    """
    Update user's XP and level.
    
    Returns: (new_xp, new_level, level_up_occurred)
    """
    old_level = user.level
    user.xp += xp_earned
    new_level = get_level_for_xp(user.xp)
    user.level = new_level
    
    db.commit()
    db.refresh(user)
    
    return user.xp, new_level, new_level > old_level


def update_streak(db: Session, user: User) -> int:
    """
    Update user's streak based on practice activity.
    
    Returns: Updated streak count
    """
    today = date.today()
    last_practice = user.last_practice_date
    
    if last_practice is None:
        # First practice ever
        user.current_streak = 1
    elif last_practice.date() == today:
        # Already practiced today, no change
        pass
    elif last_practice.date() == today - timedelta(days=1):
        # Practiced yesterday, increment streak
        user.current_streak += 1
    else:
        # Missed a day, reset streak
        user.current_streak = 1
    
    # Update longest streak
    if user.current_streak > user.longest_streak:
        user.longest_streak = user.current_streak
    
    user.last_practice_date = datetime.now()
    db.commit()
    db.refresh(user)
    
    return user.current_streak


def get_skill_tree_status(db: Session, user_id: int) -> Dict:
    """
    Get the skill tree status for a user.
    
    Returns dict with:
    - nodes: list of skill nodes with mastery and unlock status
    - total_unlocked: count of unlocked skills
    - total_mastered: count of mastered skills (mastery > 0.7)
    """
    # Get all skills with their relationships
    skills = db.query(Skill).all()
    
    # Get user's mastery for each skill
    masteries = db.query(UserSkillMastery).filter(
        UserSkillMastery.user_id == user_id
    ).all()
    
    mastery_map = {m.skill_id: m for m in masteries}
    
    nodes = []
    total_unlocked = 0
    total_mastered = 0
    
    for skill in skills:
        mastery = mastery_map.get(skill.id)
        
        mastery_prob = mastery.mastery_probability if mastery else 0.3
        is_unlocked = mastery.is_unlocked if mastery else (skill.parent_skill_id is None)
        is_mastered = mastery_prob >= skill.mastery_threshold
        
        if is_unlocked:
            total_unlocked += 1
        if is_mastered:
            total_mastered += 1
        
        # Find children (skills that require this one)
        children_ids = [s.id for s in skills if s.parent_skill_id == skill.id]
        
        nodes.append({
            "skill_id": skill.id,
            "skill_name": skill.name,
            "category": skill.category,
            "mastery_probability": mastery_prob,
            "is_unlocked": is_unlocked,
            "is_mastered": is_mastered,
            "requires": [skill.parent_skill_id] if skill.parent_skill_id else [],
            "children": children_ids
        })
    
    return {
        "nodes": nodes,
        "total_unlocked": total_unlocked,
        "total_mastered": total_mastered
    }


def check_and_unlock_skills(db: Session, user_id: int) -> List[int]:
    """
    Check if any new skills should be unlocked based on mastery.
    
    Returns: List of newly unlocked skill IDs
    """
    skills = db.query(Skill).all()
    masteries = db.query(UserSkillMastery).filter(
        UserSkillMastery.user_id == user_id
    ).all()
    
    mastery_map = {m.skill_id: m for m in masteries}
    newly_unlocked = []
    
    for skill in skills:
        if skill.parent_skill_id is None:
            continue  # Root skills are always unlocked
        
        mastery = mastery_map.get(skill.id)
        if mastery and mastery.is_unlocked:
            continue  # Already unlocked
        
        # Check if parent is mastered
        parent_mastery = mastery_map.get(skill.parent_skill_id)
        parent_skill = next((s for s in skills if s.id == skill.parent_skill_id), None)
        
        if parent_mastery and parent_skill:
            if parent_mastery.mastery_probability >= parent_skill.mastery_threshold:
                # Unlock this skill
                if mastery:
                    mastery.is_unlocked = True
                else:
                    # Create mastery record
                    new_mastery = UserSkillMastery(
                        user_id=user_id,
                        skill_id=skill.id,
                        is_unlocked=True
                    )
                    db.add(new_mastery)
                
                newly_unlocked.append(skill.id)
    
    if newly_unlocked:
        db.commit()
    
    return newly_unlocked


def get_user_stats(db: Session, user_id: int) -> Dict:
    """Get comprehensive user gamification stats."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}
    
    # Get attempt stats
    total_attempts = db.query(func.count(Attempt.id)).filter(
        Attempt.user_id == user_id
    ).scalar() or 0
    
    correct_attempts = db.query(func.count(Attempt.id)).filter(
        Attempt.user_id == user_id,
        Attempt.is_correct == True
    ).scalar() or 0
    
    accuracy = correct_attempts / total_attempts if total_attempts > 0 else 0
    
    return {
        "xp": user.xp,
        "level": user.level,
        "xp_to_next_level": get_xp_to_next_level(user.xp),
        "current_streak": user.current_streak,
        "longest_streak": user.longest_streak,
        "total_questions_answered": total_attempts,
        "accuracy_rate": accuracy
    }
