"""Daily adaptive IELTS study plan."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Attempt, Question, MistakeReview
from ..routers.auth import get_current_user

router = APIRouter(prefix="/study-plan", tags=["Study Plan"])


@router.get("/today")
async def get_today_plan(
    minutes: int = 60,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    weak_rows = (
        db.query(Question.module, Question.question_type, func.count(MistakeReview.id).label("mistakes"))
        .join(MistakeReview, MistakeReview.question_id == Question.id)
        .filter(MistakeReview.user_id == current_user.id, MistakeReview.is_resolved == False)
        .group_by(Question.module, Question.question_type)
        .order_by(func.count(MistakeReview.id).desc())
        .limit(3)
        .all()
    )

    items = []
    duration = 30 if minutes <= 30 else 20
    for module, question_type, count in weak_rows:
        items.append({
            "module": module,
            "mode": "mistake_review",
            "title": f"Review {question_type} mistakes",
            "reason": f"{count} unresolved mistakes in this question type",
            "duration_minutes": duration,
            "priority": len(items) + 1,
        })

    defaults = [
        ("READING", "weakness", "Adaptive reading practice", "Build accuracy on your weakest reading skills"),
        ("LISTENING", "timed", "Listening section drill", "Practice answer extraction under audio timing"),
        ("WRITING", "task", "Write one IELTS task", "Keep writing criteria active with one full response"),
        ("SPEAKING", "part_flow", "Record one speaking set", "Practice fluency and self-correction"),
    ]
    for module, mode, title, reason in defaults:
        if len(items) >= (2 if minutes <= 30 else 4):
            break
        if any(item["module"] == module for item in items):
            continue
        items.append({
            "module": module,
            "mode": mode,
            "title": title,
            "reason": reason,
            "duration_minutes": duration,
            "priority": len(items) + 1,
        })

    total_attempts = db.query(Attempt).filter(Attempt.user_id == current_user.id).count()
    return {
        "minutes": minutes,
        "total_attempts": total_attempts,
        "items": items,
    }
