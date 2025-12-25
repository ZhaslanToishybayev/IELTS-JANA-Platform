
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import get_current_user
from app.services.mock_service import mock_service
from app.schemas import MockSessionResponse
from typing import Dict, Any

router = APIRouter(
    prefix="/mock",
    tags=["Mock Exam"]
)

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
    payload: Dict[str, str], # {"text": "essay content"}
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    session = mock_service.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return mock_service.submit_writing(db, session, payload.get("text", ""))
