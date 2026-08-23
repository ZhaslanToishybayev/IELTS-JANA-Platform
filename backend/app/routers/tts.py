"""TTS endpoint — serves cached Edge TTS audio as MP3."""
import hashlib
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from ..services.tts_service import generate_tts, get_available_voices, CACHE_DIR

router = APIRouter(prefix="/api/tts", tags=["tts"])


@router.get("")
async def get_tts_audio(
    text: str = Query(..., min_length=1, max_length=5000),
    voice: str | None = Query(None, description="Voice ID (e.g. en-GB-SoniaNeural)"),
):
    """Generate or serve cached TTS audio for the given text."""
    if not text.strip():
        raise HTTPException(400, "Text cannot be empty")
    try:
        path = await generate_tts(text.strip(), voice)
    except Exception as e:
        raise HTTPException(500, f"TTS generation failed: {e}")
    return FileResponse(path, media_type="audio/mpeg", filename="speech.mp3")


@router.get("/voices")
async def list_voices():
    """Return available TTS voices for IELTS."""
    return get_available_voices()
