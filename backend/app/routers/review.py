"""Mistake review endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import MistakeReview
from ..routers.auth import get_current_user

router = APIRouter(prefix="/review", tags=["Review"])


@router.get("/mistakes")
async def list_mistakes(
    limit: int = 20,
    module: str | None = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(MistakeReview).filter(
        MistakeReview.user_id == current_user.id,
        MistakeReview.is_resolved == False,
    )
    if module:
        query = query.filter(MistakeReview.module == module.upper())
    mistakes = query.order_by(MistakeReview.created_at.desc()).limit(limit).all()
    return {
        "mistakes": [
            {
                "id": mistake.id,
                "module": mistake.module,
                "question_type": mistake.question_type,
                "question_text": mistake.question.question_text,
                "user_answer": mistake.user_answer,
                "correct_answer": mistake.correct_answer,
                "explanation": mistake.explanation,
                "created_at": mistake.created_at,
            }
            for mistake in mistakes
        ]
    }


@router.post("/mistakes/{mistake_id}/resolve")
async def resolve_mistake(
    mistake_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mistake = db.query(MistakeReview).filter(
        MistakeReview.id == mistake_id,
        MistakeReview.user_id == current_user.id,
    ).first()
    if not mistake:
        raise HTTPException(status_code=404, detail="Mistake not found")
    mistake.is_resolved = True
    db.commit()
    return {"message": "Mistake resolved", "id": mistake_id}
