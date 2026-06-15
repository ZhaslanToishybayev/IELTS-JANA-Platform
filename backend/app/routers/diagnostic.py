"""Reading diagnostic endpoints for first-use IELTS onboarding."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Attempt, Question, Skill, User, UserSkillMastery
from ..routers.auth import get_current_user
from ..schemas import NextQuestionResponse, QuestionResponse
from ..services.module_skills import get_categories_for_module
from ..services.scoring import raw_to_band

router = APIRouter(prefix="/diagnostic", tags=["Diagnostic"])

DIAGNOSTIC_MODULE = "READING"
DIAGNOSTIC_TARGET = 10


class DiagnosticStatusResponse(BaseModel):
    completed: bool
    answered: int
    target: int
    remaining: int
    recommended: bool


class DiagnosticWeakSkill(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    mastery_probability: float
    accuracy_rate: float
    attempts_count: int


class DiagnosticResultResponse(BaseModel):
    completed: bool
    answered: int
    accuracy: float
    estimated_reading_band: float
    weak_skills: list[DiagnosticWeakSkill]
    recommendation: str


def _reading_attempts_query(db: Session, user_id: int):
    return db.query(Attempt).join(Question).filter(
        Attempt.user_id == user_id,
        Question.module == DIAGNOSTIC_MODULE,
    )


def _answered_count(db: Session, user_id: int) -> int:
    return _reading_attempts_query(db, user_id).count()


def _status_payload(answered: int) -> DiagnosticStatusResponse:
    completed = answered >= DIAGNOSTIC_TARGET
    return DiagnosticStatusResponse(
        completed=completed,
        answered=answered,
        target=DIAGNOSTIC_TARGET,
        remaining=max(DIAGNOSTIC_TARGET - answered, 0),
        recommended=not completed,
    )


def _reading_question_query(db: Session):
    reading_categories = get_categories_for_module(DIAGNOSTIC_MODULE)
    return db.query(Question).join(Skill).filter(
        Question.module == DIAGNOSTIC_MODULE,
        Question.is_active.is_(True),
        Question.approved.is_(True),
        Skill.category.in_(reading_categories),
    )


@router.get("/status", response_model=DiagnosticStatusResponse)
async def get_diagnostic_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return current Reading diagnostic progress for the authenticated user."""
    return _status_payload(_answered_count(db, current_user.id))


@router.get("/next", response_model=NextQuestionResponse)
async def get_diagnostic_next(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the next Reading diagnostic question without exposing the answer."""
    reading_categories = get_categories_for_module(DIAGNOSTIC_MODULE)

    attempted_question_ids = [
        row[0]
        for row in _reading_attempts_query(db, current_user.id)
        .with_entities(Attempt.question_id)
        .all()
    ]

    category_attempt_counts = dict(
        _reading_attempts_query(db, current_user.id)
        .join(Skill, Question.skill_id == Skill.id)
        .with_entities(Skill.category, func.count(Attempt.id))
        .group_by(Skill.category)
        .all()
    )
    categories_by_need = sorted(
        reading_categories,
        key=lambda category: (category_attempt_counts.get(category, 0), reading_categories.index(category)),
    )

    question = None
    selected_category = None
    for category in categories_by_need:
        query = _reading_question_query(db).filter(Skill.category == category)
        if attempted_question_ids:
            query = query.filter(~Question.id.in_(attempted_question_ids))
        question = query.order_by(func.random()).first()
        if question:
            selected_category = category
            break

    if not question:
        query = _reading_question_query(db)
        if attempted_question_ids:
            query = query.filter(~Question.id.in_(attempted_question_ids))
        question = query.order_by(func.random()).first()

    if not question:
        question = _reading_question_query(db).order_by(func.random()).first()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Reading diagnostic questions available",
        )

    answered = _answered_count(db, current_user.id)
    skill_name = question.skill.name if question.skill else "Reading"
    category = selected_category or (question.skill.category if question.skill else question.question_type)

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
            audio_url=None,
            audio_duration_sec=None,
            transcript_available=False,
        ),
        target_skill=skill_name,
        reason=f"Diagnostic coverage: {category}",
        session_progress=min(answered + 1, DIAGNOSTIC_TARGET),
    )


@router.get("/result", response_model=DiagnosticResultResponse)
async def get_diagnostic_result(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Summarize the user's current Reading diagnostic profile."""
    answered = _answered_count(db, current_user.id)
    correct = _reading_attempts_query(db, current_user.id).filter(Attempt.is_correct.is_(True)).count()
    accuracy = correct / answered if answered else 0.0
    estimated_band = raw_to_band(correct, DIAGNOSTIC_MODULE, answered) if answered else 0.0

    reading_categories = get_categories_for_module(DIAGNOSTIC_MODULE)
    masteries = (
        db.query(UserSkillMastery, Skill)
        .join(Skill, UserSkillMastery.skill_id == Skill.id)
        .filter(
            UserSkillMastery.user_id == current_user.id,
            Skill.category.in_(reading_categories),
        )
        .all()
    )

    weak_skills: list[DiagnosticWeakSkill] = []
    for mastery, skill in masteries:
        attempts_count = (
            _reading_attempts_query(db, current_user.id)
            .filter(Question.skill_id == skill.id)
            .count()
        )
        correct_count = (
            _reading_attempts_query(db, current_user.id)
            .filter(Question.skill_id == skill.id, Attempt.is_correct.is_(True))
            .count()
        )
        weak_skills.append(
            DiagnosticWeakSkill(
                skill_id=skill.id,
                skill_name=skill.name,
                category=skill.category,
                mastery_probability=round(mastery.mastery_probability, 4),
                accuracy_rate=round(correct_count / attempts_count, 4) if attempts_count else 0.0,
                attempts_count=attempts_count,
            )
        )

    weak_skills.sort(key=lambda item: (item.mastery_probability, item.accuracy_rate, -item.attempts_count))
    weak_skills = weak_skills[:3]

    if weak_skills:
        recommendation = f"Start with {weak_skills[0].skill_name} and review recent mistakes."
    elif answered < DIAGNOSTIC_TARGET:
        recommendation = "Complete the Reading diagnostic to unlock a more reliable skill profile."
    else:
        recommendation = "Keep practicing Reading questions and review any mistakes from this diagnostic."

    return DiagnosticResultResponse(
        completed=answered >= DIAGNOSTIC_TARGET,
        answered=answered,
        accuracy=round(accuracy, 4),
        estimated_reading_band=estimated_band,
        weak_skills=weak_skills,
        recommendation=recommendation,
    )
