"""Questions API router for adaptive learning."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import User, Question, Attempt, UserSkillMastery, Skill
from ..schemas import AttemptCreate, AttemptResponse, NextQuestionResponse, QuestionResponse
from ..routers.auth import get_current_user
from ..ml import knowledge_tracer, adaptive_selector
from ..services import (
    calculate_xp_for_attempt, update_user_xp, update_streak,
    check_and_unlock_skills
)
from ..services.dashboard import update_daily_metrics

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("/next", response_model=NextQuestionResponse)
async def get_next_question(
    category: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the next adaptive question for the user.
    
    The question is selected based on:
    - User's weakest skills (lowest mastery)
    - Appropriate difficulty for current mastery
    - Avoiding recently attempted questions
    """
    question, target_skill, reason = adaptive_selector.get_next_question(
        db, current_user.id, preferred_category=category
    )
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions available"
        )
    
    # Count questions in current session (today)
    today_attempts = db.query(Attempt).filter(
        Attempt.user_id == current_user.id,
        Attempt.created_at >= datetime.now().replace(hour=0, minute=0, second=0)
    ).count()
    
    return NextQuestionResponse(
        question=QuestionResponse(
            id=question.id,
            skill_id=question.skill_id,
            passage=question.passage,
            passage_title=question.passage_title,
            question_text=question.question_text,
            question_type=question.question_type,
            options=question.options,
            difficulty=question.difficulty
        ),
        target_skill=target_skill,
        reason=reason,
        session_progress=today_attempts + 1
    )


@router.post("/submit", response_model=AttemptResponse)
async def submit_answer(
    attempt_data: AttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit an answer to a question.
    
    Returns:
    - Whether the answer was correct
    - XP earned
    - Updated user stats
    - Explanation if incorrect
    """
    # Get the question
    question = db.query(Question).filter(Question.id == attempt_data.question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if answer is correct
    is_correct = attempt_data.user_answer.strip().lower() == question.correct_answer.strip().lower()
    
    # Update streak
    new_streak = update_streak(db, current_user)
    
    # Calculate XP
    xp_earned = calculate_xp_for_attempt(
        difficulty=question.difficulty,
        is_correct=is_correct,
        streak=new_streak
    )
    
    # Update user XP and level
    new_xp, new_level, level_up = update_user_xp(db, current_user, xp_earned)
    
    # Get or create skill mastery record
    mastery = db.query(UserSkillMastery).filter(
        UserSkillMastery.user_id == current_user.id,
        UserSkillMastery.skill_id == question.skill_id
    ).first()
    
    if not mastery:
        skill = db.query(Skill).filter(Skill.id == question.skill_id).first()
        mastery = UserSkillMastery(
            user_id=current_user.id,
            skill_id=question.skill_id,
            is_unlocked=skill.parent_skill_id is None if skill else True
        )
        db.add(mastery)
        db.flush()
    
    # Update mastery using BKT
    old_mastery = mastery.mastery_probability
    new_mastery = knowledge_tracer.update_mastery(old_mastery, is_correct)
    mastery.mastery_probability = new_mastery
    mastery.attempts_count += 1
    if is_correct:
        mastery.correct_count += 1
    
    # Update average response time
    if mastery.avg_response_time_ms:
        mastery.avg_response_time_ms = (
            mastery.avg_response_time_ms * (mastery.attempts_count - 1) + 
            attempt_data.response_time_ms
        ) / mastery.attempts_count
    else:
        mastery.avg_response_time_ms = attempt_data.response_time_ms
    
    mastery.last_attempt_at = datetime.now()
    
    # Create attempt record
    attempt = Attempt(
        user_id=current_user.id,
        question_id=question.id,
        user_answer=attempt_data.user_answer,
        is_correct=is_correct,
        response_time_ms=attempt_data.response_time_ms,
        xp_earned=xp_earned
    )
    db.add(attempt)
    
    # Check for skill unlocks
    check_and_unlock_skills(db, current_user.id)
    
    # Update daily metrics
    db.commit()
    update_daily_metrics(db, current_user.id)
    
    db.refresh(attempt)
    
    mastery_change = new_mastery - old_mastery
    
    return AttemptResponse(
        id=attempt.id,
        question_id=attempt.question_id,
        user_answer=attempt.user_answer,
        is_correct=attempt.is_correct,
        response_time_ms=attempt.response_time_ms,
        xp_earned=attempt.xp_earned,
        created_at=attempt.created_at,
        correct_answer=question.correct_answer,
        explanation=question.explanation if not is_correct else None,
        new_xp=new_xp,
        new_level=new_level,
        level_up=level_up,
        new_streak=new_streak,
        mastery_change=mastery_change
    )


@router.get("/categories")
async def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get available question categories with question counts."""
    categories = db.query(
        Skill.category,
        db.query(Question).filter(Question.skill_id == Skill.id).count()
    ).distinct().all()
    
    return [
        {"category": cat, "question_count": count}
        for cat, count in [
            ("TF_NG", db.query(Question).join(Skill).filter(Skill.category == "TF_NG").count()),
            ("HEADINGS", db.query(Question).join(Skill).filter(Skill.category == "HEADINGS").count()),
            ("SUMMARY", db.query(Question).join(Skill).filter(Skill.category == "SUMMARY").count()),
        ]
    ]
