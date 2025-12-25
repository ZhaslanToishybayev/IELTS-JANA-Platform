from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
import shutil
import os
import uuid
from app.services.speaking_service import analyze_audio_with_gemini
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/speaking", tags=["speaking"])

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/analyze")
async def analyze_speaking(
    file: UploadFile = File(...),
    prompt_text: str = Form(...),
    current_user: dict = Depends(get_current_user)
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
            
        # Analyze with AI
        result = await analyze_audio_with_gemini(temp_path, prompt_text)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
