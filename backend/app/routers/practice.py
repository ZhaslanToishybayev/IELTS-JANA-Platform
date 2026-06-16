"""Unified IELTS practice endpoints."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Question, Attempt, MistakeReview
from ..routers.auth import get_current_user
from ..routers.questions import submit_answer
from ..schemas import AttemptCreate, QuestionResponse, NextQuestionResponse
from ..ml import adaptive_selector

router = APIRouter(prefix="/practice", tags=["Practice"])


class PracticeSubmit(BaseModel):
    question_id: int
    user_answer: str
    response_time_ms: int = Field(..., ge=0)


@router.get("/next", response_model=NextQuestionResponse)
async def get_next_practice(
    module: str = "READING",
    mode: str = "weakness",
    question_type: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question, target_skill, reason = adaptive_selector.get_next_question(
        db,
        current_user.id,
        module=module.upper(),
        question_type=question_type,
    )
    if not question:
        if module.upper() == "READING":
            raise HTTPException(
                status_code=404,
                detail="No Reading questions are available for this focus yet. Add active approved Reading questions or seed demo content.",
            )
        raise HTTPException(status_code=404, detail="No approved questions available")

    today_attempts = db.query(Attempt).filter(
        Attempt.user_id == current_user.id,
        Attempt.created_at >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0),
    ).count()
    return NextQuestionResponse(
        question=QuestionResponse(
            id=question.id,
            skill_id=question.skill_id,
            passage=question.passage or "",
            passage_title=question.passage_title,
            question_text=question.question_text,
            question_type=question.question_type,
            options=question.options,
            difficulty=question.difficulty,
            audio_url=f"/api/listening/audio/{question.id}" if question.audio_url else None,
            audio_duration_sec=question.audio_duration_sec,
            transcript_available=question.module == "LISTENING",
        ),
        target_skill=target_skill,
        reason=f"{mode}: {reason}",
        session_progress=today_attempts + 1,
    )


@router.post("/submit")
async def submit_practice(
    payload: PracticeSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await submit_answer(
        AttemptCreate(
            question_id=payload.question_id,
            user_answer=payload.user_answer,
            response_time_ms=payload.response_time_ms,
        ),
        current_user,
        db,
    )
