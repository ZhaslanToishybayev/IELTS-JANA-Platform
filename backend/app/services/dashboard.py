"""Dashboard service for aggregated metrics and progress tracking."""

from datetime import datetime, date, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer, cast

from ..models import User, Attempt, UserSkillMastery, Skill, DashboardMetric, Question, MistakeReview
from ..ml import knowledge_tracer
from ..services.gamification import get_xp_to_next_level
from ..services.scoring import raw_to_band, overall_band


def get_dashboard_data(db: Session, user_id: int) -> Dict:
    """
    Get comprehensive dashboard data for a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}

    # Aggregate attempts in SQL instead of loading all into Python
    attempt_stats = db.query(
        func.count(Attempt.id).label("total"),
        func.sum(cast(Attempt.is_correct, Integer)).label("correct"),
        func.avg(Attempt.response_time_ms).label("avg_time"),
    ).filter(Attempt.user_id == user_id).one()

    total_attempts = attempt_stats.total or 0
    correct_attempts = attempt_stats.correct or 0
    overall_accuracy = correct_attempts / total_attempts if total_attempts > 0 else 0
    avg_response_time = float(attempt_stats.avg_time or 0)

    # Get skill masteries joined with Skill in one query (fixes N+1)
    mastery_rows = db.query(
        Skill.id,
        Skill.name,
        Skill.category,
        Skill.parent_skill_id,
        UserSkillMastery.mastery_probability,
        UserSkillMastery.attempts_count,
        UserSkillMastery.is_unlocked,
    ).outerjoin(UserSkillMastery, and_(
        UserSkillMastery.skill_id == Skill.id,
        UserSkillMastery.user_id == user_id,
    )).all()

    # Average mastery per category (from joined query)
    skill_masteries_by_category: Dict[str, list] = {}
    for row in mastery_rows:
        if row.mastery_probability is not None:
            skill_masteries_by_category.setdefault(row.category, []).append(row.mastery_probability)

    category_avg = {
        cat: sum(probs) / len(probs)
        for cat, probs in skill_masteries_by_category.items()
    }

    estimated_band = knowledge_tracer.estimate_band_score(category_avg)

    # Build skills breakdown
    skills_data = [
        {
            "skill_id": row.id,
            "skill_name": row.name,
            "category": row.category,
            "mastery_probability": row.mastery_probability if row.mastery_probability is not None else 0.3,
            "attempts_count": row.attempts_count if row.attempts_count is not None else 0,
            "accuracy_rate": 0,  # computed below in SQL
            "is_unlocked": row.is_unlocked if row.is_unlocked is not None else (row.parent_skill_id is None),
        }
        for row in mastery_rows
    ]

    # Batch accuracy per skill in SQL
    accuracy_rows = db.query(
        Question.skill_id,
        func.count(Attempt.id).label("total"),
        func.sum(cast(Attempt.is_correct, Integer)).label("correct"),
    ).join(Question, Question.id == Attempt.question_id).filter(
        Attempt.user_id == user_id,
    ).group_by(Question.skill_id).all()

    accuracy_map = {r.skill_id: (r.correct or 0) / r.total for r in accuracy_rows if r.total > 0}
    for skill in skills_data:
        skill["accuracy_rate"] = accuracy_map.get(skill["skill_id"], 0)

    # Section bands via SQL aggregation
    section_bands = {}
    for module in ["READING", "LISTENING"]:
        stats = db.query(
            func.count(Attempt.id).label("total"),
            func.sum(cast(Attempt.is_correct, Integer)).label("correct"),
        ).join(Question).filter(
            Attempt.user_id == user_id,
            Question.module == module,
        ).one()
        if stats.total and stats.total > 0:
            section_bands[module.lower()] = raw_to_band(stats.correct or 0, module, stats.total)

    writing_scores = [w.band_score for w in getattr(user, "writing_attempts", []) if w.band_score]
    speaking_scores = [s.band_score for s in getattr(user, "speaking_attempts", []) if s.band_score]
    if writing_scores:
        section_bands["writing"] = writing_scores[-1]
    if speaking_scores:
        section_bands["speaking"] = speaking_scores[-1]
    if section_bands:
        estimated_band = overall_band(section_bands.values())

    weak_rows = db.query(
        Question.module,
        Question.question_type,
        func.count(MistakeReview.id).label("mistakes")
    ).join(MistakeReview, MistakeReview.question_id == Question.id).filter(
        MistakeReview.user_id == user_id,
        MistakeReview.is_resolved == False
    ).group_by(Question.module, Question.question_type).order_by(
        func.count(MistakeReview.id).desc()
    ).limit(5).all()
    weak_question_types = [
        {"module": module, "question_type": question_type, "mistakes": count}
        for module, question_type, count in weak_rows
    ]

    mistakes = db.query(MistakeReview).filter(
        MistakeReview.user_id == user_id,
        MistakeReview.is_resolved == False
    ).order_by(MistakeReview.created_at.desc()).limit(5).all()
    mistake_log = [
        {
            "id": item.id,
            "module": item.module,
            "question_type": item.question_type,
            "question_text": item.question.question_text,
            "correct_answer": item.correct_answer,
            "created_at": item.created_at,
        }
        for item in mistakes
    ]

    if weak_question_types:
        weak = weak_question_types[0]
        next_recommended_session = {
            "module": weak["module"],
            "mode": "mistake_review",
            "question_type": weak["question_type"],
            "duration_minutes": 30,
            "reason": f"Most unresolved mistakes: {weak['question_type']}",
        }
    else:
        next_recommended_session = {
            "module": "READING",
            "mode": "weakness",
            "duration_minutes": 30,
            "reason": "Start with adaptive reading to establish your baseline.",
        }

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
        "skills": skills_data,
        "section_bands": section_bands,
        "weak_question_types": weak_question_types,
        "mistake_log": mistake_log,
        "next_recommended_session": next_recommended_session,
    }


def get_progress_history(db: Session, user_id: int, days: int = 30) -> List[Dict]:
    """
    Get daily progress history for the last N days.
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    metrics = db.query(DashboardMetric).filter(
        DashboardMetric.user_id == user_id,
        DashboardMetric.date >= datetime.combine(start_date, datetime.min.time())
    ).order_by(DashboardMetric.date).all()

    return [
        {
            "date": m.date,
            "estimated_band": m.estimated_band or 4.0,
            "accuracy_rate": m.accuracy_rate or 0,
            "attempts_count": m.total_attempts or 0,
            "xp_earned": m.xp_earned or 0
        }
        for m in metrics
    ]


def update_daily_metrics(db: Session, user_id: int):
    """
    Update or create today's dashboard metrics.
    Called after each attempt.
    """
    today = datetime.combine(date.today(), datetime.min.time())

    metric = db.query(DashboardMetric).filter(
        DashboardMetric.user_id == user_id,
        DashboardMetric.date == today
    ).first()

    if not metric:
        metric = DashboardMetric(user_id=user_id, date=today)
        db.add(metric)

    # Aggregate today's stats in SQL
    today_stats = db.query(
        func.count(Attempt.id).label("total"),
        func.sum(cast(Attempt.is_correct, Integer)).label("correct"),
        func.avg(Attempt.response_time_ms).label("avg_time"),
        func.sum(Attempt.xp_earned).label("xp"),
    ).filter(
        Attempt.user_id == user_id,
        Attempt.created_at >= today
    ).one()

    if today_stats.total and today_stats.total > 0:
        metric.total_attempts = today_stats.total
        metric.correct_attempts = today_stats.correct or 0
        metric.accuracy_rate = (today_stats.correct or 0) / today_stats.total
        metric.avg_response_time_ms = float(today_stats.avg_time or 0)
        metric.xp_earned = today_stats.xp or 0

    # Calculate estimated band from current masteries (single JOIN query)
    category_avg_rows = db.query(
        Skill.category,
        func.avg(UserSkillMastery.mastery_probability).label("avg_mastery"),
    ).join(UserSkillMastery, and_(
        UserSkillMastery.skill_id == Skill.id,
        UserSkillMastery.user_id == user_id,
    )).group_by(Skill.category).all()

    category_avg = {row.category: float(row.avg_mastery) for row in category_avg_rows}
    metric.estimated_band = knowledge_tracer.estimate_band_score(category_avg)

    db.commit()
