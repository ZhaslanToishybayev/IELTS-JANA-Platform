from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.writing_service import evaluate_essay_with_gemini
from app.services.auth import get_current_user
from app.database import get_db
from app.models import WritingAttempt
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/writing", tags=["writing"])

class EssaySubmission(BaseModel):
    task_type: str
    prompt_text: str
    essay_text: str
    time_spent_sec: Optional[int] = None

class EvaluationResponse(BaseModel):
    band_score: float
    task_response: dict
    coherence_cohesion: dict
    lexical_resource: dict
    grammatical_range: dict
    overall_feedback: str
    improvements: List[str]
    error: Optional[str] = None

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_essay(
    submission: EssaySubmission,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Evaluate and persist an IELTS essay attempt."""
    result = await evaluate_essay_with_gemini(
        essay_text=submission.essay_text,
        task_type=submission.task_type,
        prompt_text=submission.prompt_text
    )
    word_count = len([word for word in submission.essay_text.split() if word.strip()])
    db.add(WritingAttempt(
        user_id=current_user.id,
        task_type=submission.task_type,
        prompt_text=submission.prompt_text,
        essay_text=submission.essay_text,
        word_count=word_count,
        time_spent_sec=submission.time_spent_sec,
        band_score=result.get("band_score", 0.0),
        criterion_scores={
            "task_response": result.get("task_response", {}).get("score", 0.0),
            "coherence_cohesion": result.get("coherence_cohesion", {}).get("score", 0.0),
            "lexical_resource": result.get("lexical_resource", {}).get("score", 0.0),
            "grammatical_range": result.get("grammatical_range", {}).get("score", 0.0),
        },
        feedback=result,
    ))
    db.commit()
    return result


@router.post("/submit", response_model=EvaluationResponse)
async def submit_essay(
    submission: EssaySubmission,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await evaluate_essay(submission, current_user, db)


@router.get("/history")
async def writing_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempts = db.query(WritingAttempt).filter(
        WritingAttempt.user_id == current_user.id
    ).order_by(WritingAttempt.created_at.desc()).limit(limit).all()
    return {
        "attempts": [
            {
                "id": attempt.id,
                "created_at": attempt.created_at,
                "task_type": attempt.task_type,
                "prompt_text": attempt.prompt_text,
                "band_score": attempt.band_score,
                "criterion_scores": attempt.criterion_scores or {},
                "word_count": attempt.word_count,
                "time_spent_sec": attempt.time_spent_sec,
            }
            for attempt in attempts
        ]
    }
