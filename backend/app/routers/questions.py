"""Questions API router for adaptive learning."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import User, Question, Attempt, Skill
from ..schemas import AttemptCreate, AttemptResponse, NextQuestionResponse, QuestionResponse
from ..routers.auth import get_current_user
from ..ml import adaptive_selector
from ..services.attempts import submit_question_attempt

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
    return submit_question_attempt(db, current_user, attempt_data)


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
