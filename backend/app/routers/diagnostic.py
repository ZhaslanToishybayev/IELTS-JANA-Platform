"""Reading diagnostic endpoints for first-use IELTS onboarding."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Attempt, DiagnosticSession, Question, Skill, User, UserSkillMastery
from ..routers.auth import get_current_user
from ..schemas import AttemptCreate, NextQuestionResponse, QuestionResponse
from ..services.attempts import submit_question_attempt
from ..services.module_skills import get_categories_for_module
from ..services.scoring import raw_to_band

router = APIRouter(prefix="/diagnostic", tags=["Diagnostic"])

DIAGNOSTIC_MODULE = "READING"
DIAGNOSTIC_TARGET = 10
DIAGNOSTIC_STATUS_IN_PROGRESS = "in_progress"
DIAGNOSTIC_STATUS_COMPLETED = "completed"


class DiagnosticStatusResponse(BaseModel):
    completed: bool
    answered: int
    target: int
    remaining: int
    recommended: bool
    session_id: int | None = None
    status: str | None = None


class DiagnosticStartResponse(BaseModel):
    session_id: int
    module: str
    status: str
    target: int
    answered: int
    completed: bool


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
    session_id: int | None = None
    status: str | None = None


def _latest_session(db: Session, user_id: int) -> DiagnosticSession | None:
    return (
        db.query(DiagnosticSession)
        .filter(
            DiagnosticSession.user_id == user_id,
            DiagnosticSession.module == DIAGNOSTIC_MODULE,
        )
        .order_by(DiagnosticSession.started_at.desc(), DiagnosticSession.id.desc())
        .first()
    )


def _active_session(db: Session, user_id: int) -> DiagnosticSession | None:
    return (
        db.query(DiagnosticSession)
        .filter(
            DiagnosticSession.user_id == user_id,
            DiagnosticSession.module == DIAGNOSTIC_MODULE,
            DiagnosticSession.status == DIAGNOSTIC_STATUS_IN_PROGRESS,
        )
        .order_by(DiagnosticSession.started_at.desc(), DiagnosticSession.id.desc())
        .first()
    )


def _create_session(db: Session, user_id: int) -> DiagnosticSession:
    session = DiagnosticSession(
        user_id=user_id,
        module=DIAGNOSTIC_MODULE,
        target_questions=DIAGNOSTIC_TARGET,
        status=DIAGNOSTIC_STATUS_IN_PROGRESS,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _attempts_query(db: Session, session_id: int):
    return db.query(Attempt).join(Question).filter(
        Attempt.diagnostic_session_id == session_id,
        Question.module == DIAGNOSTIC_MODULE,
    )


def _answered_count(db: Session, session: DiagnosticSession | None) -> int:
    if not session:
        return 0
    return _attempts_query(db, session.id).count()


def _status_payload(db: Session, session: DiagnosticSession | None) -> DiagnosticStatusResponse:
    if not session:
        return DiagnosticStatusResponse(
            completed=False,
            answered=0,
            target=DIAGNOSTIC_TARGET,
            remaining=DIAGNOSTIC_TARGET,
            recommended=True,
            session_id=None,
            status=None,
        )

    answered = _answered_count(db, session)
    completed = session.status == DIAGNOSTIC_STATUS_COMPLETED
    return DiagnosticStatusResponse(
        completed=completed,
        answered=answered,
        target=session.target_questions,
        remaining=max(session.target_questions - answered, 0),
        recommended=not completed,
        session_id=session.id,
        status=session.status,
    )


def _reading_question_query(db: Session):
    reading_categories = get_categories_for_module(DIAGNOSTIC_MODULE)
    return db.query(Question).join(Skill).filter(
        Question.module == DIAGNOSTIC_MODULE,
        Question.is_active.is_(True),
        Question.approved.is_(True),
        Skill.category.in_(reading_categories),
    )


def _build_result_snapshot(db: Session, session: DiagnosticSession) -> dict[str, Any]:
    answered = _answered_count(db, session)
    correct = _attempts_query(db, session.id).filter(Attempt.is_correct.is_(True)).count()
    accuracy = correct / answered if answered else 0.0
    estimated_band = raw_to_band(correct, DIAGNOSTIC_MODULE, answered) if answered else 0.0

    reading_categories = get_categories_for_module(DIAGNOSTIC_MODULE)
    skill_rows = (
        db.query(UserSkillMastery, Skill)
        .join(Skill, UserSkillMastery.skill_id == Skill.id)
        .filter(
            UserSkillMastery.user_id == session.user_id,
            Skill.category.in_(reading_categories),
        )
        .all()
    )

    weak_skills: list[dict[str, Any]] = []
    for mastery, skill in skill_rows:
        attempts_count = _attempts_query(db, session.id).filter(Question.skill_id == skill.id).count()
        correct_count = (
            _attempts_query(db, session.id)
            .filter(Question.skill_id == skill.id, Attempt.is_correct.is_(True))
            .count()
        )
        weak_skills.append({
            "skill_id": skill.id,
            "skill_name": skill.name,
            "category": skill.category,
            "mastery_probability": round(mastery.mastery_probability, 4),
            "accuracy_rate": round(correct_count / attempts_count, 4) if attempts_count else 0.0,
            "attempts_count": attempts_count,
        })

    weak_skills.sort(key=lambda item: (
        item["mastery_probability"],
        item["accuracy_rate"],
        -item["attempts_count"],
    ))
    weak_skills = weak_skills[:3]

    if weak_skills:
        recommendation = f"Start with {weak_skills[0]['skill_name']} and review recent mistakes."
    elif answered < session.target_questions:
        recommendation = "Complete the Reading diagnostic to unlock a more reliable skill profile."
    else:
        recommendation = "Keep practicing Reading questions and review any mistakes from this diagnostic."

    return {
        "completed": session.status == DIAGNOSTIC_STATUS_COMPLETED,
        "answered": answered,
        "accuracy": round(accuracy, 4),
        "estimated_reading_band": estimated_band,
        "weak_skills": weak_skills,
        "recommendation": recommendation,
        "session_id": session.id,
        "status": session.status,
    }


def _complete_session_if_ready(db: Session, session: DiagnosticSession) -> None:
    answered = _answered_count(db, session)
    if answered < session.target_questions or session.status == DIAGNOSTIC_STATUS_COMPLETED:
        return

    session.status = DIAGNOSTIC_STATUS_COMPLETED
    session.completed_at = datetime.now()
    snapshot = _build_result_snapshot(db, session)
    snapshot["completed"] = True
    snapshot["status"] = DIAGNOSTIC_STATUS_COMPLETED
    session.accuracy = snapshot["accuracy"]
    session.estimated_band = snapshot["estimated_reading_band"]
    session.result_snapshot = snapshot
    db.commit()
    db.refresh(session)


@router.get("/status", response_model=DiagnosticStatusResponse)
async def get_diagnostic_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return current persisted Reading diagnostic progress."""
    return _status_payload(db, _active_session(db, current_user.id) or _latest_session(db, current_user.id))


@router.post("/start", response_model=DiagnosticStartResponse)
async def start_diagnostic(
    restart: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start or resume a Reading diagnostic without creating duplicate active sessions."""
    active = _active_session(db, current_user.id)
    if active:
        session = active
    else:
        latest = _latest_session(db, current_user.id)
        if latest and latest.status == DIAGNOSTIC_STATUS_COMPLETED and not restart:
            session = latest
        else:
            session = _create_session(db, current_user.id)

    answered = _answered_count(db, session)
    return DiagnosticStartResponse(
        session_id=session.id,
        module=session.module,
        status=session.status,
        target=session.target_questions,
        answered=answered,
        completed=session.status == DIAGNOSTIC_STATUS_COMPLETED,
    )


@router.get("/next", response_model=NextQuestionResponse)
async def get_diagnostic_next(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the next active-session Reading diagnostic question."""
    session = _active_session(db, current_user.id)
    if not session:
        latest = _latest_session(db, current_user.id)
        if latest and latest.status == DIAGNOSTIC_STATUS_COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reading diagnostic is already completed",
            )
        session = _create_session(db, current_user.id)

    reading_categories = get_categories_for_module(DIAGNOSTIC_MODULE)
    attempted_question_ids = [
        row[0]
        for row in _attempts_query(db, session.id)
        .with_entities(Attempt.question_id)
        .all()
    ]

    category_attempt_counts = dict(
        _attempts_query(db, session.id)
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

    answered = _answered_count(db, session)
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
        session_progress=min(answered + 1, session.target_questions),
    )


@router.post("/submit")
async def submit_diagnostic_answer(
    payload: AttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit an answer into the active diagnostic session."""
    session = _active_session(db, current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start a diagnostic session before submitting answers",
        )

    question = db.query(Question).filter(Question.id == payload.question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    if question.module != DIAGNOSTIC_MODULE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Diagnostic only accepts Reading questions",
        )

    feedback = submit_question_attempt(
        db,
        current_user,
        payload,
        diagnostic_session_id=session.id,
    )

    db.refresh(session)
    _complete_session_if_ready(db, session)

    response = feedback.model_dump()
    response["session_id"] = session.id
    response["diagnostic_completed"] = session.status == DIAGNOSTIC_STATUS_COMPLETED
    response["completed"] = session.status == DIAGNOSTIC_STATUS_COMPLETED
    response["answered"] = _answered_count(db, session)
    response["target"] = session.target_questions
    return response


@router.get("/result", response_model=DiagnosticResultResponse)
async def get_diagnostic_result(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return stored completed result or current partial active-session result."""
    latest = _latest_session(db, current_user.id)
    if not latest:
        return DiagnosticResultResponse(
            completed=False,
            answered=0,
            accuracy=0.0,
            estimated_reading_band=0.0,
            weak_skills=[],
            recommendation="Start the Reading diagnostic to build your first skill profile.",
            session_id=None,
            status=None,
        )

    if latest.status == DIAGNOSTIC_STATUS_COMPLETED and latest.result_snapshot:
        return DiagnosticResultResponse(**latest.result_snapshot)

    return DiagnosticResultResponse(**_build_result_snapshot(db, latest))
