"""Dashboard service for aggregated metrics and progress tracking."""

from datetime import datetime, date, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ..models import User, Attempt, UserSkillMastery, Skill, DashboardMetric, Question
from ..ml import knowledge_tracer
from ..services.gamification import get_xp_to_next_level


def get_dashboard_data(db: Session, user_id: int) -> Dict:
    """
    Get comprehensive dashboard data for a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}
    
    # Get all attempts
    attempts = db.query(Attempt).filter(Attempt.user_id == user_id).all()
    total_attempts = len(attempts)
    correct_attempts = sum(1 for a in attempts if a.is_correct)
    
    # Calculate overall accuracy
    overall_accuracy = correct_attempts / total_attempts if total_attempts > 0 else 0
    
    # Calculate average response time
    if attempts:
        avg_response_time = sum(a.response_time_ms for a in attempts) / len(attempts)
    else:
        avg_response_time = 0
    
    # Get skill masteries and calculate estimated band
    masteries = db.query(UserSkillMastery).filter(
        UserSkillMastery.user_id == user_id
    ).all()
    
    skill_masteries_by_category = {}
    for m in masteries:
        skill = db.query(Skill).filter(Skill.id == m.skill_id).first()
        if skill:
            if skill.category not in skill_masteries_by_category:
                skill_masteries_by_category[skill.category] = []
            skill_masteries_by_category[skill.category].append(m.mastery_probability)
    
    # Average mastery per category
    category_avg = {
        cat: sum(probs) / len(probs) 
        for cat, probs in skill_masteries_by_category.items()
    }
    
    estimated_band = knowledge_tracer.estimate_band_score(category_avg)
    
    # Build skills breakdown
    skills_data = []
    all_skills = db.query(Skill).all()
    mastery_map = {m.skill_id: m for m in masteries}
    
    for skill in all_skills:
        mastery = mastery_map.get(skill.id)
        
        # Calculate accuracy for this skill
        skill_attempts = db.query(Attempt).join(Question).filter(
            Attempt.user_id == user_id,
            Question.skill_id == skill.id
        ).all()
        
        skill_accuracy = 0
        if skill_attempts:
            skill_accuracy = sum(1 for a in skill_attempts if a.is_correct) / len(skill_attempts)
        
        skills_data.append({
            "skill_id": skill.id,
            "skill_name": skill.name,
            "category": skill.category,
            "mastery_probability": mastery.mastery_probability if mastery else 0.3,
            "attempts_count": mastery.attempts_count if mastery else 0,
            "accuracy_rate": skill_accuracy,
            "is_unlocked": mastery.is_unlocked if mastery else (skill.parent_skill_id is None)
        })
    
    return {
        "username": user.username,
        "level": user.level,
        "xp": user.xp,
        "xp_to_next_level": get_xp_to_next_level(user.xp),
        "current_streak": user.current_streak,
        "estimated_band": estimated_band,
        "total_attempts": total_attempts,
        "overall_accuracy": overall_accuracy,
        "avg_response_time_ms": avg_response_time,
        "skills": skills_data
    }


def get_progress_history(db: Session, user_id: int, days: int = 30) -> List[Dict]:
    """
    Get daily progress history for the last N days.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    # Get stored metrics
    metrics = db.query(DashboardMetric).filter(
        DashboardMetric.user_id == user_id,
        DashboardMetric.date >= datetime.combine(start_date, datetime.min.time())
    ).order_by(DashboardMetric.date).all()
    
    history = []
    for m in metrics:
        history.append({
            "date": m.date,
            "estimated_band": m.estimated_band or 4.0,
            "accuracy_rate": m.accuracy_rate or 0,
            "attempts_count": m.total_attempts or 0,
            "xp_earned": m.xp_earned or 0
        })
    
    return history


def update_daily_metrics(db: Session, user_id: int):
    """
    Update or create today's dashboard metrics.
    Called after each attempt.
    """
    today = datetime.combine(date.today(), datetime.min.time())
    
    # Get or create today's metric
    metric = db.query(DashboardMetric).filter(
        DashboardMetric.user_id == user_id,
        DashboardMetric.date == today
    ).first()
    
    if not metric:
        metric = DashboardMetric(user_id=user_id, date=today)
        db.add(metric)
    
    # Calculate today's stats from attempts
    today_attempts = db.query(Attempt).filter(
        Attempt.user_id == user_id,
        Attempt.created_at >= today
    ).all()
    
    if today_attempts:
        metric.total_attempts = len(today_attempts)
        metric.correct_attempts = sum(1 for a in today_attempts if a.is_correct)
        metric.accuracy_rate = metric.correct_attempts / metric.total_attempts
        metric.avg_response_time_ms = sum(a.response_time_ms for a in today_attempts) / len(today_attempts)
        metric.xp_earned = sum(a.xp_earned for a in today_attempts)
    
    # Calculate estimated band from current masteries
    masteries = db.query(UserSkillMastery).filter(
        UserSkillMastery.user_id == user_id
    ).all()
    
    skill_masteries_by_category = {}
    for m in masteries:
        skill = db.query(Skill).filter(Skill.id == m.skill_id).first()
        if skill:
            if skill.category not in skill_masteries_by_category:
                skill_masteries_by_category[skill.category] = []
            skill_masteries_by_category[skill.category].append(m.mastery_probability)
    
    category_avg = {
        cat: sum(probs) / len(probs) 
        for cat, probs in skill_masteries_by_category.items()
    }
    
    metric.estimated_band = knowledge_tracer.estimate_band_score(category_avg)
    
    db.commit()
