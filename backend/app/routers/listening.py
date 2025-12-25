"""Listening module router for audio-based practice."""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import os
import uuid
from pathlib import Path

from ..database import get_db
from ..models import User, Question, Skill, Attempt
from ..routers.auth import get_current_user
from ..config import get_settings

settings = get_settings()
router = APIRouter(prefix="/listening", tags=["Listening"])

# Audio storage directory
AUDIO_DIR = Path("static/audio")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


class ListeningQuestionResponse(BaseModel):
    id: int
    skill_id: int
    passage_title: Optional[str]
    question_text: str
    question_type: str
    options: Optional[List[str]]
    difficulty: int
    audio_url: str
    audio_duration_sec: Optional[int]
    transcript: Optional[str] = None  # Hidden by default


class ListeningSubmitRequest(BaseModel):
    question_id: int
    user_answer: str
    response_time_ms: int


@router.get("/questions")
async def get_listening_questions(
    difficulty: Optional[int] = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get listening practice questions with audio."""
    query = db.query(Question).filter(Question.module == "LISTENING")
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    questions = query.limit(limit).all()
    
    result = []
    for q in questions:
        audio_url = f"/api/listening/audio/{q.id}" if q.audio_url else None
        result.append({
            "id": q.id,
            "skill_id": q.skill_id,
            "passage_title": q.passage_title,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": q.options,
            "difficulty": q.difficulty,
            "audio_url": audio_url,
            "audio_duration_sec": q.audio_duration_sec
        })
    
    return {
        "count": len(result),
        "questions": result
    }


@router.get("/questions/{question_id}")
async def get_listening_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific listening question."""
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.module == "LISTENING"
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listening question not found"
        )
    
    audio_url = f"/api/listening/audio/{question.id}" if question.audio_url else None
    
    return {
        "id": question.id,
        "skill_id": question.skill_id,
        "passage_title": question.passage_title,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "options": question.options,
        "difficulty": question.difficulty,
        "audio_url": audio_url,
        "audio_duration_sec": question.audio_duration_sec
    }


@router.get("/audio/{question_id}")
async def stream_audio(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream audio file for a listening question."""
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.module == "LISTENING"
    ).first()
    
    if not question or not question.audio_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio not found"
        )
    
    # Check if it's a local file or external URL
    if question.audio_url.startswith("http"):
        # Redirect to external URL
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=question.audio_url)
    
    # Local file
    audio_path = AUDIO_DIR / question.audio_url
    if not audio_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )
    
    return FileResponse(
        path=str(audio_path),
        media_type="audio/mpeg",
        filename=f"listening_{question_id}.mp3"
    )


@router.get("/transcript/{question_id}")
async def get_transcript(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transcript for a listening question (after answering)."""
    # Check if user has attempted this question
    attempt = db.query(Attempt).filter(
        Attempt.user_id == current_user.id,
        Attempt.question_id == question_id
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Answer the question first to see the transcript"
        )
    
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.module == "LISTENING"
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    return {
        "question_id": question_id,
        "transcript": question.passage,  # Passage contains transcript for listening
        "passage_title": question.passage_title
    }


@router.post("/submit")
async def submit_listening_answer(
    submission: ListeningSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit answer for a listening question."""
    question = db.query(Question).filter(
        Question.id == submission.question_id,
        Question.module == "LISTENING"
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check answer
    is_correct = submission.user_answer.strip().lower() == question.correct_answer.strip().lower()
    
    # Create attempt
    attempt = Attempt(
        user_id=current_user.id,
        question_id=question.id,
        user_answer=submission.user_answer,
        is_correct=is_correct,
        response_time_ms=submission.response_time_ms,
        xp_earned=15 if is_correct else 0  # Base XP for listening
    )
    db.add(attempt)
    db.commit()
    
    return {
        "is_correct": is_correct,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
        "xp_earned": attempt.xp_earned,
        "transcript_available": True  # Now user can access transcript
    }


@router.get("/progress")
async def get_listening_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's listening practice progress."""
    # Get all listening attempts
    listening_attempts = db.query(Attempt).join(Question).filter(
        Attempt.user_id == current_user.id,
        Question.module == "LISTENING"
    ).all()
    
    total = len(listening_attempts)
    correct = sum(1 for a in listening_attempts if a.is_correct)
    
    # Get listened questions count
    unique_questions = len(set(a.question_id for a in listening_attempts))
    total_listening_questions = db.query(Question).filter(Question.module == "LISTENING").count()
    
    return {
        "total_attempts": total,
        "correct_attempts": correct,
        "accuracy": correct / total if total > 0 else 0,
        "questions_completed": unique_questions,
        "questions_available": total_listening_questions,
        "completion_percentage": (unique_questions / total_listening_questions * 100) if total_listening_questions > 0 else 0
    }
