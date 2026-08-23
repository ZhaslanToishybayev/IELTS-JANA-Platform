"""TTS endpoint — cached Edge TTS audio with random accent support."""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from ..services.tts_service import generate_tts, get_available_voices, get_random_voice, VOICE_IDS

router = APIRouter(prefix="/api/tts", tags=["tts"])


@router.get("")
async def get_tts_audio(
    text: str = Query(..., min_length=1, max_length=5000),
    voice: str | None = Query(None, description="Voice ID or 'random'"),
):
    """Generate or serve cached TTS audio. Pass voice='random' for a random accent each call."""
    if not text.strip():
        raise HTTPException(400, "Text cannot be empty")
    resolved_voice = get_random_voice() if voice == "random" else voice
    try:
        path = await generate_tts(text.strip(), resolved_voice)
    except Exception as e:
        raise HTTPException(500, f"TTS generation failed: {e}")
    return FileResponse(path, media_type="audio/mpeg", filename="speech.mp3")


@router.get("/voices")
async def list_voices():
    """Return all available TTS voices."""
    return get_available_voices()


@router.get("/random-voices")
async def get_random_voices(count: int = Query(4, ge=1, le=20)):
    """Return `count` random voice IDs, no duplicates. Used by frontend to pre-assign accents to sections."""
    voices: list[str] = []
    pool = list(VOICE_IDS)
    import random
    random.shuffle(pool)
    for v in pool:
        if len(voices) >= count:
            break
        voices.append(v)
    return {"voices": voices}
