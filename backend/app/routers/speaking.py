from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
import shutil
import os
import uuid
from app.services.speaking_service import analyze_audio_with_gemini
from app.services.auth import get_current_user
from app.database import get_db
from app.models import SpeakingAttempt
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/speaking", tags=["speaking"])

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/analyze")
async def analyze_speaking(
    file: UploadFile = File(...),
    prompt_text: str = Form(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload audio and get AI feedback."""
    
    # Validate file size (10MB limit)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    # Validate file content type
    allowed_types = ["audio/webm", "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/m4a"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}")

    # Generate unique filename
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "webm"
    temp_filename = f"{uuid.uuid4()}.{file_extension}"
    temp_path = os.path.join(TEMP_DIR, temp_filename)
    
    try:
        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = await analyze_audio_with_gemini(temp_path, prompt_text)
        db.add(SpeakingAttempt(
            user_id=current_user.id,
            prompt_text=prompt_text,
            audio_path=None,
            transcription=result.get("transcription", ""),
            band_score=result.get("band_score", 0.0),
            criterion_scores={
                "fluency_coherence": result.get("fluency_coherence", {}).get("score", 0.0),
                "lexical_resource": result.get("lexical_resource", {}).get("score", 0.0),
                "grammatical_range": result.get("grammatical_range", {}).get("score", 0.0),
                "pronunciation": result.get("pronunciation", {}).get("score", 0.0),
            },
            feedback=result,
        ))
        db.commit()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/history")
async def speaking_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempts = db.query(SpeakingAttempt).filter(
        SpeakingAttempt.user_id == current_user.id
    ).order_by(SpeakingAttempt.created_at.desc()).limit(limit).all()
    return {
        "attempts": [
            {
                "id": attempt.id,
                "created_at": attempt.created_at,
                "prompt_text": attempt.prompt_text,
                "band_score": attempt.band_score,
                "criterion_scores": attempt.criterion_scores or {},
                "time_spent_sec": attempt.time_spent_sec,
            }
            for attempt in attempts
        ]
    }
