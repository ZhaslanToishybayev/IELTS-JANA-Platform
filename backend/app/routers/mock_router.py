
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from app.database import get_db
from app.routers.auth import get_current_user
from app.services.mock_service import mock_service
from app.schemas import MockSessionResponse
from app.models import Question, WritingPrompt, SpeakingPrompt
from typing import Dict, Any, Optional

router = APIRouter(
    prefix="/mock",
    tags=["Mock Exam"]
)


def _random_prompt(db: Session, model, filters: dict | None = None):
    query = db.query(model).filter(model.is_active == True)
    if filters:
        for col, val in filters.items():
            query = query.filter(getattr(model, col) == val)
    count = query.count()
    if count == 0:
        return None
    offset = int(db.query(sqlfunc.floor(sqlfunc.random() * count)).scalar())
    return query.offset(offset).limit(1).first()


def _prompt_dict(prompt):
    if prompt is None:
        return None
    if isinstance(prompt, WritingPrompt):
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
    if isinstance(prompt, SpeakingPrompt):
        return {
            "id": prompt.id,
            "part": prompt.part,
            "title": prompt.title,
            "cue_card": prompt.cue_card,
            "questions": prompt.questions or [],
            "prep_time_sec": prompt.prep_time_sec,
            "speak_time_sec": prompt.speak_time_sec,
        }
    return None


@router.get("/questions")
def get_mock_questions(
    module: str,
    limit: int = 12,
    session_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
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
    prompt = _random_prompt(db, WritingPrompt, {"task_type": task_type} if task_type else None)
    if not prompt:
        raise HTTPException(status_code=404, detail="No writing prompts available")
    return _prompt_dict(prompt)


@router.get("/prompts/writing/all")
def get_mock_writing_prompts_all(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return one random Task 1 + one random Task 2 prompt for a full writing section."""
    task1 = _random_prompt(db, WritingPrompt, {"task_type": "TASK_1"})
    task2 = _random_prompt(db, WritingPrompt, {"task_type": "TASK_2"})
    if not task1 and not task2:
        raise HTTPException(status_code=404, detail="No writing prompts available")
    return {
        "task1": _prompt_dict(task1),
        "task2": _prompt_dict(task2),
    }


@router.get("/prompts/speaking")
def get_mock_speaking_prompt(
    part: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    prompt = _random_prompt(db, SpeakingPrompt, {"part": part} if part else None)
    if not prompt:
        raise HTTPException(status_code=404, detail="No speaking prompts available")
    return _prompt_dict(prompt)


@router.get("/prompts/speaking/all")
def get_mock_speaking_prompts_all(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return one random prompt for each Part 1, Part 2, Part 3 of speaking."""
    part1 = _random_prompt(db, SpeakingPrompt, {"part": "PART_1"})
    part2 = _random_prompt(db, SpeakingPrompt, {"part": "PART_2"})
    part3 = _random_prompt(db, SpeakingPrompt, {"part": "PART_3"})
    if not part1 and not part2 and not part3:
        raise HTTPException(status_code=404, detail="No speaking prompts available")
    return {
        "part1": _prompt_dict(part1),
        "part2": _prompt_dict(part2),
        "part3": _prompt_dict(part3),
    }


@router.post("/start", response_model=MockSessionResponse)
def start_mock_exam(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
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
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = mock_service.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    task1_text = payload.get("task1", "")
    task2_text = payload.get("task2", "")
    legacy_text = payload.get("text", "")
    if not task1_text and not task2_text and legacy_text:
        task2_text = legacy_text
    return mock_service.submit_writing(db, session, task1_text, task2_text)

@router.post("/{session_id}/speaking")
def submit_speaking(
    session_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = mock_service.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    part1 = payload.get("part1", "")
    part2 = payload.get("part2", "")
    part3 = payload.get("part3", "")
    legacy = payload.get("transcript", "")
    if not part1 and not part2 and not part3 and legacy:
        part2 = legacy
    return mock_service.submit_speaking(db, session, part1, part2, part3)
