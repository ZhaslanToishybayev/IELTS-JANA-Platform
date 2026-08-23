"""Edge TTS service — natural-sounding voices with random accent support."""
import hashlib
import random
from pathlib import Path

import edge_tts

DEFAULT_VOICE = "en-GB-SoniaNeural"

ALL_VOICES: list[dict[str, str]] = [
    # British
    {"id": "en-GB-SoniaNeural",  "name": "Sonia",  "accent": "British",  "gender": "female"},
    {"id": "en-GB-RyanNeural",   "name": "Ryan",   "accent": "British",  "gender": "male"},
    {"id": "en-GB-LibbyNeural",  "name": "Libby",  "accent": "British",  "gender": "female"},
    {"id": "en-GB-ThomasNeural", "name": "Thomas", "accent": "British",  "gender": "male"},
    # Australian
    {"id": "en-AU-NatashaNeural", "name": "Natasha", "accent": "Australian", "gender": "female"},
    {"id": "en-AU-WilliamNeural", "name": "William", "accent": "Australian", "gender": "male"},
    # American
    {"id": "en-US-JennyNeural",    "name": "Jenny",    "accent": "American", "gender": "female"},
    {"id": "en-US-GuyNeural",      "name": "Guy",      "accent": "American", "gender": "male"},
    {"id": "en-US-AriaNeural",     "name": "Aria",     "accent": "American", "gender": "female"},
    {"id": "en-US-DavisNeural",    "name": "Davis",    "accent": "American", "gender": "male"},
    {"id": "en-US-JaneNeural",     "name": "Jane",     "accent": "American", "gender": "female"},
    {"id": "en-US-AndrewNeural",   "name": "Andrew",   "accent": "American", "gender": "male"},
    {"id": "en-US-MichelleNeural", "name": "Michelle", "accent": "American", "gender": "female"},
    # Canadian
    {"id": "en-CA-LiamNeural",   "name": "Liam",   "accent": "Canadian",  "gender": "male"},
    {"id": "en-CA-ClaraNeural",  "name": "Clara",  "accent": "Canadian",  "gender": "female"},
    # Irish
    {"id": "en-IE-ConnorNeural", "name": "Connor", "accent": "Irish",     "gender": "male"},
    {"id": "en-IE-EmilyNeural",  "name": "Emily",  "accent": "Irish",     "gender": "female"},
    # Indian
    {"id": "en-IN-PrabhatNeural",   "name": "Prabhat",   "accent": "Indian",    "gender": "male"},
    {"id": "en-IN-NeerjaNeural",    "name": "Neerja",    "accent": "Indian",    "gender": "female"},
    # South African
    {"id": "en-ZA-LeahNeural",   "name": "Leah",   "accent": "South African", "gender": "female"},
    {"id": "en-ZA-LukeNeural",   "name": "Luke",   "accent": "South African", "gender": "male"},
    # Scottish
    {"id": "en-GB-MaisieNeural", "name": "Maisie", "accent": "Scottish",  "gender": "female"},
    # New Zealand
    {"id": "en-NZ-MitchellNeural", "name": "Mitchell", "accent": "New Zealand", "gender": "male"},
    {"id": "en-NZ-MollyNeural",    "name": "Molly",    "accent": "New Zealand", "gender": "female"},
    # Singapore
    {"id": "en-SG-LunaNeural",  "name": "Luna",  "accent": "Singaporean", "gender": "female"},
    {"id": "en-SG-WayneNeural", "name": "Wayne", "accent": "Singaporean", "gender": "male"},
    # Hong Kong
    {"id": "en-HK-SamNeural",   "name": "Sam",   "accent": "Hong Kong",  "gender": "male"},
    {"id": "en-HK-YanNeural",   "name": "Yan",   "accent": "Hong Kong",  "gender": "female"},
]

VOICE_IDS = [v["id"] for v in ALL_VOICES]
VOICE_IDS_BY_ACCENT: dict[str, list[str]] = {}
for v in ALL_VOICES:
    VOICE_IDS_BY_ACCENT.setdefault(v["accent"], []).append(v["id"])

CACHE_DIR = Path(__file__).parent.parent.parent / "audio_cache"


def _get_cache_path(text: str, voice: str) -> Path:
    CACHE_DIR.mkdir(exist_ok=True)
    key = hashlib.sha256(f"{voice}:{text}".encode()).hexdigest()[:16]
    return CACHE_DIR / f"{voice}_{key}.mp3"


async def generate_tts(text: str, voice: str | None = None) -> Path:
    voice = voice or DEFAULT_VOICE
    if voice not in VOICE_IDS:
        voice = DEFAULT_VOICE
    cache_path = _get_cache_path(text, voice)
    if cache_path.exists():
        return cache_path
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(cache_path))
    return cache_path


def get_random_voice(exclude: list[str] | None = None) -> str:
    """Return a random voice ID, optionally excluding specific ones."""
    pool = [v for v in VOICE_IDS if not exclude or v not in exclude]
    return random.choice(pool) if pool else DEFAULT_VOICE


def get_random_voice_per_accent(accent: str) -> str:
    """Return a random voice from a specific accent group."""
    voices = VOICE_IDS_BY_ACCENT.get(accent, [])
    return random.choice(voices) if voices else DEFAULT_VOICE


def get_available_voices() -> list[dict[str, str]]:
    return list(ALL_VOICES)
