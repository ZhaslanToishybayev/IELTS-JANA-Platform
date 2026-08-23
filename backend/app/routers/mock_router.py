
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from app.database import get_db
from app.routers.auth import get_current_user
from app.services.mock_service import mock_service
from app.schemas import MockSessionResponse
from app.models import Question, WritingPrompt, SpeakingPrompt
from typing import Dict, Any

router = APIRouter(
    prefix="/mock",
    tags=["Mock Exam"]
)


@router.get("/questions")
def get_mock_questions(
    module: str,
    limit: int = 12,
    session_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Return real approved questions for a deterministic local mock section."""
    if session_id:
        session = mock_service.get_session(db, session_id, current_user.id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        questions = mock_service.get_questions(db, session, module, limit)
    else:
        questions = db.query(Question).filter(
            Question.module == module.upper(),
            Question.approved == True,
            Question.is_active == True,
        ).order_by(Question.id).limit(limit).all()
    return {
        "questions": [
            {
                "id": q.id,
                "text": q.question_text,
                "type": q.question_type,
                "options": q.options,
                "passage": q.passage,
                "passage_title": q.passage_title,
                "audio_url": q.audio_url,
                "section": q.section,
            }
            for q in questions
        ]
    }


@router.get("/prompts/writing")
def get_mock_writing_prompt(
    task_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return a random active writing prompt for mock exam."""
    query = db.query(WritingPrompt).filter(WritingPrompt.is_active == True)
    if task_type:
        query = query.filter(WritingPrompt.task_type == task_type)
    count = query.count()
    if count == 0:
        raise HTTPException(status_code=404, detail="No writing prompts available")
    offset = sqlfunc.floor(sqlfunc.random() * count).scalar_subquery()
    prompt = query.offset(offset).limit(1).first()
    return {
        "id": prompt.id,
        "task_type": prompt.task_type,
        "title": prompt.title,
        "prompt_text": prompt.prompt_text,
        "category": prompt.category,
        "word_limit": prompt.word_limit,
        "time_limit_minutes": prompt.time_limit_minutes,
        "tips": prompt.tips or [],
    }


@router.get("/prompts/speaking")
def get_mock_speaking_prompt(
    part: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return a random active speaking prompt for mock exam."""
    query = db.query(SpeakingPrompt).filter(SpeakingPrompt.is_active == True)
    if part:
        query = query.filter(SpeakingPrompt.part == part)
    count = query.count()
    if count == 0:
        raise HTTPException(status_code=404, detail="No speaking prompts available")
    offset = sqlfunc.floor(sqlfunc.random() * count).scalar_subquery()
    prompt = query.offset(offset).limit(1).first()
    return {
        "id": prompt.id,
        "part": prompt.part,
        "title": prompt.title,
        "cue_card": prompt.cue_card,
        "questions": prompt.questions or [],
        "prep_time_sec": prompt.prep_time_sec,
        "speak_time_sec": prompt.speak_time_sec,
    }


@router.post("/start", response_model=MockSessionResponse)
def start_mock_exam(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Start a new 2h 45m mock exam."""
    return mock_service.start_session(db, current_user.id)

@router.get("/{session_id}", response_model=MockSessionResponse)
def get_mock_status(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = mock_service.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/{session_id}/listening")
def submit_listening(
    session_id: str,
    answers: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = mock_service.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return mock_service.submit_listening(db, session, answers)

@router.post("/{session_id}/reading")
def submit_reading(
    session_id: str,
    answers: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = mock_service.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return mock_service.submit_reading(db, session, answers)

@router.post("/{session_id}/writing")
def submit_writing(
    session_id: str,
    payload: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = mock_service.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return mock_service.submit_writing(db, session, payload.get("text", ""))

@router.post("/{session_id}/speaking")
def submit_speaking(
    session_id: str,
    payload: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = mock_service.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return mock_service.submit_speaking(db, session, payload.get("transcript", ""))
