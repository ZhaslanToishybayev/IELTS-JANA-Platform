"""Mistake review endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import MistakeReview
from ..routers.auth import get_current_user

router = APIRouter(prefix="/review", tags=["Review"])


def _passage_excerpt(passage: str | None, max_length: int = 220) -> str | None:
    if not passage:
        return None
    normalized = " ".join(passage.split())
    if len(normalized) <= max_length:
        return normalized
    return f"{normalized[:max_length].rstrip()}..."


def _serialize_mistake(mistake: MistakeReview) -> dict:
    question = mistake.question
    skill = question.skill if question else None
    attempted_at = mistake.attempt.created_at if mistake.attempt else mistake.created_at
    question_type = mistake.question_type or (question.question_type if question else "")
    module = mistake.module or (question.module if question else "")
    return {
        "id": mistake.id,
        "question_id": mistake.question_id,
        "module": module,
        "question_type": question_type,
        "skill_category": skill.category if skill else question_type,
        "question_text": question.question_text if question else "",
        "passage_title": question.passage_title if question else None,
        "passage_excerpt": _passage_excerpt(question.passage if question else None),
        "user_answer": mistake.user_answer,
        "correct_answer": mistake.correct_answer,
        "explanation": mistake.explanation,
        "is_resolved": mistake.is_resolved,
        "created_at": mistake.created_at,
        "attempted_at": attempted_at,
        "practice_href": f"/practice?module={module}&question_type={question_type}&mode=drill",
        "skill": {
            "id": skill.id,
            "name": skill.name,
            "category": skill.category,
        } if skill else None,
    }


def _normalize_status(status: str | None, resolved: str | None) -> str:
    if status:
        normalized = status.strip().lower()
        if normalized in {"unresolved", "resolved", "all"}:
            return normalized
    if resolved:
        normalized = resolved.strip().lower()
        if normalized == "all":
            return "all"
        if normalized == "true":
            return "resolved"
    return "unresolved"


def _apply_status_filter(query, status: str):
    if status == "all":
        return query
    if status == "resolved":
        return query.filter(MistakeReview.is_resolved == True)
    return query.filter(MistakeReview.is_resolved == False)


@router.get("/mistakes")
async def list_mistakes(
    limit: int = 20,
    module: str | None = "READING",
    question_type: str | None = None,
    status: str | None = None,
    resolved: str | None = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(MistakeReview).filter(
        MistakeReview.user_id == current_user.id,
    )
    normalized_status = _normalize_status(status, resolved)
    query = _apply_status_filter(query, normalized_status)
    if module and module.upper() != "ALL":
        query = query.filter(MistakeReview.module == module.upper())
    if question_type and question_type.upper() != "ALL":
        query = query.filter(MistakeReview.question_type == question_type)
    mistakes = query.order_by(MistakeReview.created_at.desc()).limit(min(limit, 100)).all()
    return {
        "mistakes": [_serialize_mistake(mistake) for mistake in mistakes]
    }


def _get_owned_mistake(db: Session, user_id: int, review_id: int) -> MistakeReview:
    mistake = db.query(MistakeReview).filter(
        MistakeReview.id == review_id,
        MistakeReview.user_id == user_id,
    ).first()
    if not mistake:
        raise HTTPException(status_code=404, detail="Mistake not found")
    return mistake


@router.get("/summary")
async def get_review_summary(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base_query = db.query(MistakeReview).filter(
        MistakeReview.user_id == current_user.id,
        MistakeReview.is_resolved == False,
    )
    total_unresolved = base_query.count()
    by_module_rows = (
        db.query(MistakeReview.module, func.count(MistakeReview.id))
        .filter(
            MistakeReview.user_id == current_user.id,
            MistakeReview.is_resolved == False,
        )
        .group_by(MistakeReview.module)
        .all()
    )
    by_type_rows = (
        db.query(MistakeReview.question_type, func.count(MistakeReview.id).label("count"))
        .filter(
            MistakeReview.user_id == current_user.id,
            MistakeReview.is_resolved == False,
        )
        .group_by(MistakeReview.question_type)
        .order_by(func.count(MistakeReview.id).desc())
        .all()
    )
    return {
        "total_unresolved": total_unresolved,
        "by_module": {module: count for module, count in by_module_rows},
        "by_question_type": [
            {"question_type": question_type, "count": count}
            for question_type, count in by_type_rows
        ],
    }


@router.post("/{review_id}/resolve")
async def resolve_review_item(
    review_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mistake = _get_owned_mistake(db, current_user.id, review_id)
    mistake.is_resolved = True
    db.commit()
    db.refresh(mistake)
    return _serialize_mistake(mistake)


@router.post("/{review_id}/unresolve")
async def unresolve_review_item(
    review_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mistake = _get_owned_mistake(db, current_user.id, review_id)
    mistake.is_resolved = False
    db.commit()
    db.refresh(mistake)
    return _serialize_mistake(mistake)


@router.post("/mistakes/{mistake_id}/resolve")
async def resolve_mistake_legacy(
    mistake_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await resolve_review_item(mistake_id, current_user, db)
