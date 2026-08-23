"""Edge TTS service for natural-sounding British English audio."""
import hashlib
import os
from pathlib import Path

import edge_tts

# Voice selection - British English for IELTS
DEFAULT_VOICE = "en-GB-SoniaNeural"  # Clear British female voice
VOICE_OPTIONS = {
    "female": "en-GB-SoniaNeural",
    "male": "en-GB-RyanNeural",
}

# Cache directory
CACHE_DIR = Path(__file__).parent.parent.parent / "audio_cache"


def _get_cache_path(text: str, voice: str) -> Path:
    """Generate a deterministic cache file path from text + voice."""
    CACHE_DIR.mkdir(exist_ok=True)
    key = hashlib.sha256(f"{voice}:{text}".encode()).hexdigest()[:16]
    return CACHE_DIR / f"{voice}_{key}.mp3"


async def generate_tts(text: str, voice: str | None = None) -> Path:
    """Generate TTS audio, returning path to MP3 file. Cached on disk."""
    voice = voice or DEFAULT_VOICE
    cache_path = _get_cache_path(text, voice)
    if cache_path.exists():
        return cache_path

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(cache_path))
    return cache_path


def get_available_voices() -> list[dict[str, str]]:
    """Return available IELTS voices."""
    return [
        {"id": "en-GB-SoniaNeural", "name": "Sonia (British Female)", "gender": "female"},
        {"id": "en-GB-RyanNeural", "name": "Ryan (British Male)", "gender": "male"},
        {"id": "en-GB-LibbyNeural", "name": "Libby (British Female)", "gender": "female"},
        {"id": "en-AU-NatashaNeural", "name": "Natasha (Australian Female)", "gender": "female"},
        {"id": "en-US-JennyNeural", "name": "Jenny (American Female)", "gender": "female"},
    ]
