"""Admin API router for content management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, Question, Skill, Achievement, UserAchievement, Attempt
from ..routers.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============ Schemas ============

class QuestionCreate(BaseModel):
    skill_id: int
    passage: str
    passage_title: Optional[str] = None
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: int = 5
    module: str = "READING"


class QuestionUpdate(BaseModel):
    passage: Optional[str] = None
    passage_title: Optional[str] = None
    question_text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[int] = None


class AchievementCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    icon: str = "🏆"
    category: str
    requirement: dict
    xp_reward: int = 50
    rarity: str = "COMMON"


# ============ Admin Auth ============

async def require_admin(current_user: User = Depends(get_current_user)):
    """Check if user has admin privileges (level 50+ or specific flag)."""
    # For now, use level as a simple admin check
    # In production, add is_admin field to User model
    if current_user.level < 50 and current_user.email not in ["admin@ielts-jana.com"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ============ Dashboard ============

@router.get("/dashboard")
async def admin_dashboard(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics."""
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    
    # User stats
    total_users = db.query(User).count()
    new_users_week = db.query(User).filter(User.created_at >= week_ago).count()
    active_users_week = db.query(func.count(func.distinct(Attempt.user_id))).filter(
        Attempt.created_at >= week_ago
    ).scalar()
    
    # Question stats
    total_questions = db.query(Question).count()
    questions_by_module = db.query(
        Question.module, func.count(Question.id)
    ).group_by(Question.module).all()
    
    # Attempt stats
    total_attempts = db.query(Attempt).count()
    attempts_today = db.query(Attempt).filter(Attempt.created_at >= today).count()
    avg_accuracy = db.query(func.avg(
        func.case((Attempt.is_correct, 1), else_=0)
    )).scalar() or 0
    
    # Achievement stats
    total_achievements = db.query(Achievement).count()
    achievements_unlocked = db.query(UserAchievement).count()
    
    return {
        "users": {
            "total": total_users,
            "new_this_week": new_users_week,
            "active_this_week": active_users_week or 0,
        },
        "questions": {
            "total": total_questions,
            "by_module": {m: c for m, c in questions_by_module},
        },
        "attempts": {
            "total": total_attempts,
            "today": attempts_today,
            "avg_accuracy": round(float(avg_accuracy) * 100, 1),
        },
        "achievements": {
            "total": total_achievements,
            "total_unlocked": achievements_unlocked,
        },
    }


# ============ Questions CRUD ============

@router.get("/questions")
async def list_questions(
    skip: int = 0,
    limit: int = 20,
    module: Optional[str] = None,
    skill_id: Optional[int] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all questions with pagination."""
    query = db.query(Question)
    
    if module:
        query = query.filter(Question.module == module)
    if skill_id:
        query = query.filter(Question.skill_id == skill_id)
    
    total = query.count()
    questions = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "questions": [
            {
                "id": q.id,
                "skill_id": q.skill_id,
                "passage_title": q.passage_title,
                "question_text": q.question_text[:100] + "..." if len(q.question_text) > 100 else q.question_text,
                "question_type": q.question_type,
                "difficulty": q.difficulty,
                "module": q.module,
            }
            for q in questions
        ],
    }


@router.post("/questions")
async def create_question(
    question_data: QuestionCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new question."""
    question = Question(**question_data.dict())
    db.add(question)
    db.commit()
    db.refresh(question)
    
    return {"id": question.id, "message": "Question created successfully"}


@router.get("/questions/{question_id}")
async def get_question(
    question_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get a specific question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return {
        "id": question.id,
        "skill_id": question.skill_id,
        "passage": question.passage,
        "passage_title": question.passage_title,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "options": question.options,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
        "difficulty": question.difficulty,
        "module": question.module,
    }


@router.put("/questions/{question_id}")
async def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    for key, value in question_data.dict(exclude_unset=True).items():
        setattr(question, key, value)
    
    db.commit()
    return {"message": "Question updated successfully"}


@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(question)
    db.commit()
    return {"message": "Question deleted successfully"}


# ============ Users Management ============

@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users with pagination."""
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) | 
            (User.email.ilike(f"%{search}%"))
        )
    
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "username": u.username,
                "level": u.level,
                "xp": u.xp,
                "current_streak": u.current_streak,
                "is_active": getattr(u, 'is_active', True),
                "is_email_verified": getattr(u, 'is_email_verified', False),
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get detailed user information."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user stats
    attempts = db.query(Attempt).filter(Attempt.user_id == user_id).all()
    total_attempts = len(attempts)
    correct_attempts = sum(1 for a in attempts if a.is_correct)
    
    # Get achievements
    user_achievements = db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id
    ).count()
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "level": user.level,
        "xp": user.xp,
        "current_streak": user.current_streak,
        "longest_streak": user.longest_streak,
        "is_active": getattr(user, 'is_active', True),
        "is_email_verified": getattr(user, 'is_email_verified', False),
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "stats": {
            "total_attempts": total_attempts,
            "correct_attempts": correct_attempts,
            "accuracy": correct_attempts / total_attempts if total_attempts > 0 else 0,
            "achievements_unlocked": user_achievements,
        },
    }


# ============ Achievements CRUD ============

@router.get("/achievements")
async def list_achievements(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all achievements."""
    achievements = db.query(Achievement).all()
    
    return {
        "total": len(achievements),
        "achievements": [
            {
                "id": a.id,
                "code": a.code,
                "name": a.name,
                "description": a.description,
                "icon": a.icon,
                "category": a.category,
                "xp_reward": a.xp_reward,
                "rarity": a.rarity,
                "times_unlocked": db.query(UserAchievement).filter(
                    UserAchievement.achievement_id == a.id
                ).count(),
            }
            for a in achievements
        ],
    }


@router.post("/achievements")
async def create_achievement(
    achievement_data: AchievementCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new achievement."""
    existing = db.query(Achievement).filter(Achievement.code == achievement_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Achievement code already exists")
    
    achievement = Achievement(**achievement_data.dict())
    db.add(achievement)
    db.commit()
    db.refresh(achievement)
    
    return {"id": achievement.id, "message": "Achievement created successfully"}


@router.delete("/achievements/{achievement_id}")
async def delete_achievement(
    achievement_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete an achievement."""
    achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    
    # Delete related user achievements first
    db.query(UserAchievement).filter(UserAchievement.achievement_id == achievement_id).delete()
    db.delete(achievement)
    db.commit()
    
    return {"message": "Achievement deleted successfully"}
