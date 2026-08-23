"""Service for evaluating IELTS speaking audio using Google Gemini Multimodal."""

import os
import json
import google.generativeai as genai
from typing import Dict, Any
from dotenv import load_dotenv

from ..config import get_settings
from .ai_provider import complete_json_with_ollama, extract_json, provider_order, with_provider_meta

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)


def analyze_audio_locally(audio_path: str, prompt_text: str) -> Dict[str, Any]:
    """Deterministic local fallback for speaking when Gemini is not configured."""
    file_size = os.path.getsize(audio_path) if os.path.exists(audio_path) else 0
    estimated_seconds = max(10, min(180, file_size // 1800))
    band = 6.0 if estimated_seconds >= 60 else 5.0 if estimated_seconds >= 30 else 4.0
    return {
        "error": "Gemini API key not configured",
        "band_score": band,
        "transcription": "",
        "fluency_coherence": {"score": band, "comment": f"Local fallback: recording ~{estimated_seconds}s."},
        "lexical_resource": {"score": band, "comment": "Local fallback: vocabulary cannot be transcribed without AI."},
        "grammatical_range": {"score": band, "comment": "Local fallback: grammar cannot be checked without transcription."},
        "pronunciation": {"score": band, "comment": "Local fallback: pronunciation cannot be scored without AI audio analysis."},
        "overall_feedback": "Gemini is not configured. Configure GEMINI_API_KEY for full IELTS speaking evaluation.",
        "improvements": ["Record for the full time limit.", "Answer directly and extend with examples.", "Configure GEMINI_API_KEY for AI feedback."],
        "annotated_errors": [],
    }


def _transcribe_with_local_whisper(audio_path: str) -> str | None:
    try:
        import whisper
    except Exception:
        return None
    try:
        model = whisper.load_model(get_settings().whisper_model)
        result = model.transcribe(audio_path, language="en")
        return str(result.get("text", "")).strip()
    except Exception as e:
        print(f"Local Whisper transcription error: {e}")
        return None


def _ielts_speaking_prompt(transcript: str, prompt_text: str) -> str:
    return f"""You are an expert IELTS Speaking examiner. Evaluate this candidate's spoken response.

PROMPT: {prompt_text}

CANDIDATE TRANSCRIPT:
{transcript}

Score the candidate strictly against the official IELTS Speaking band descriptors (bands 0-9) for EACH of these four criteria:

1. FLUENCY & COHERENCE (FC)
- Rate 0-9 based on: speech rate, hesitation/self-correction, coherence, topic development, discourse markers
- Band 6: willing to produce long turns but may lose coherence; uses discourse markers but not always appropriately
- Band 7: speaks at length without noticeable effort; uses cohesive features appropriately; develops topics fully
- Band 8: speaks fluently with only occasional repetition/self-correction; cohesively connects ideas

2. LEXICAL RESOURCE (LR)
- Rate 0-9 based on: vocabulary range, collocations, idiomatic language, paraphrasing ability
- Band 6: sufficient vocabulary for topics at length; may misuse some words
- Band 7: uses less common lexical items; produces stretch language on familiar topics
- Band 8: uses vocabulary fluently and precisely; uses idiomatic language naturally

3. GRAMMATICAL RANGE & ACCURACY (GRA)
- Rate 0-9 based on: range of structures, complex sentences, error frequency, error impact
- Band 6: mix of short and complex sentences; errors frequent but rarely impede communication
- Band 7: uses range of complex structures with flexibility; majority error-free
- Band 8: uses wide range of structures accurately; very few errors

4. PRONUNCIATION (P)
- Rate 0-9 based on: intelligibility, word stress, sentence stress, intonation, phoneme clarity
- Band 6: generally understood; variable control of phonological features
- Band 7: uses wide range of pronunciation features; sustained use of features with only occasional lapses
- Band 8: uses wide range of pronunciation features flexibly; easily understood throughout

Return STRICTLY valid JSON only (no markdown, no explanation outside JSON):
{{
  "band_score": <float 0-9, overall average of the 4 criteria>,
  "fluency_coherence": {{"score": <float>, "comment": "<specific actionable feedback citing examples from transcript>"}},
  "lexical_resource": {{"score": <float>, "comment": "<specific feedback with vocabulary suggestions>"}},
  "grammatical_range": {{"score": <float>, "comment": "<specific feedback citing grammar errors or strengths>"}},
  "pronunciation": {{"score": <float>, "comment": "<specific feedback on pronunciation features>"}},
  "overall_feedback": "<2-3 sentence examiner summary>",
  "improvements": ["<3 specific, actionable improvements ranked by impact on band score>"],
  "transcript": "{transcript}",
  "annotated_errors": [{{"type": "<grammar|vocab|fluency>", "original": "<error text>", "correction": "<corrected text>", "explanation": "<brief why>"}}]
}}"""


def _valid_speaking_result(result: Dict[str, Any] | None, transcript: str = "") -> Dict[str, Any] | None:
    if not result or "band_score" not in result:
        return None
    result.setdefault("transcription", transcript)
    for key in ["fluency_coherence", "lexical_resource", "grammatical_range", "pronunciation"]:
        if not isinstance(result.get(key), dict):
            result[key] = {"score": float(result.get("band_score", 0.0)), "comment": "No criterion comment returned."}
        result[key].setdefault("score", float(result.get("band_score", 0.0)))
        result[key].setdefault("comment", "No criterion comment returned.")
    result.setdefault("overall_feedback", "Feedback generated by the configured AI provider.")
    result.setdefault("improvements", [])
    result.setdefault("annotated_errors", [])
    return result


def _analyze_audio_with_gemini(audio_path: str, prompt_text: str) -> Dict[str, Any] | None:
    if not api_key:
        return None
    try:
        audio_file = genai.upload_file(path=audio_path)
        model = genai.GenerativeModel('gemini-1.5-flash')
        system_prompt = f"""
You are an expert IELTS Speaking examiner. Listen to the user's response to this prompt: "{prompt_text}".
Evaluate Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.
Return strictly valid JSON with keys: band_score, transcription, fluency_coherence, lexical_resource, grammatical_range, pronunciation, overall_feedback, improvements, annotated_errors.
"""
        response = model.generate_content([system_prompt, audio_file])
        return extract_json(response.text)
    except Exception as e:
        print(f"Gemini speaking evaluation error: {e}")
        return None


async def analyze_audio_with_gemini(
    audio_path: str,
    prompt_text: str
) -> Dict[str, Any]:
    """Evaluates IELTS speaking audio using Gemini 1.5 Flash."""
    transcript = _transcribe_with_local_whisper(audio_path)
    for provider in provider_order():
        if provider == "ollama" and transcript:
            result = _valid_speaking_result(complete_json_with_ollama(_ielts_speaking_prompt(transcript, prompt_text)), transcript)
            if result:
                return with_provider_meta(result, "ollama+whisper")
        if provider == "gemini":
            result = _valid_speaking_result(_analyze_audio_with_gemini(audio_path, prompt_text))
            if result:
                return with_provider_meta(result, "gemini")
        if provider == "local":
            fallback = analyze_audio_locally(audio_path, prompt_text)
            if transcript:
                fallback["transcription"] = transcript
                fallback["overall_feedback"] = "Local Whisper produced a transcript, but no local LLM was available for full IELTS feedback."
            return with_provider_meta(fallback, "local")
    return with_provider_meta(analyze_audio_locally(audio_path, prompt_text), "local")


async def evaluate_text_speaking(text: str, prompt_text: str) -> Dict[str, Any]:
    """Evaluate speaking from text transcript (for mock test submissions without audio)."""
    if not text.strip():
        return {"band_score": 0.0, "error": "Empty response"}

    full_prompt = _ielts_speaking_prompt(text, prompt_text)

    for provider in provider_order():
        if provider == "ollama":
            result = _valid_speaking_result(complete_json_with_ollama(full_prompt), text)
            if result:
                return with_provider_meta(result, "ollama")
        if provider == "gemini" and api_key:
            try:
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(full_prompt)
                result = _valid_speaking_result(extract_json(response.text), text)
                if result:
                    return with_provider_meta(result, "gemini")
            except Exception as e:
                print(f"Gemini text speaking evaluation error: {e}")

    return with_provider_meta(_local_text_fallback(text, prompt_text), "local")


def _local_text_fallback(text: str, prompt_text: str) -> Dict[str, Any]:
    """Heuristic fallback when no AI provider is available."""
    words = [w for w in text.split() if w.strip()]
    wc = len(words)
    sentences = [s.strip() for s in text.replace("?", ".").replace("!", ".").split(".") if s.strip()]
    unique_ratio = len({w.lower().strip(".,;:!?") for w in words}) / max(wc, 1)

    fc = 6.5 if wc >= 180 and len(sentences) >= 8 else 6.0 if wc >= 120 else 5.0 if wc >= 70 else 4.0
    lr = 6.5 if unique_ratio >= 0.55 else 6.0 if unique_ratio >= 0.45 else 5.0
    gra = 6.5 if wc >= 180 and len(sentences) >= 6 else 6.0 if wc >= 120 else 5.0
    pr = 6.0
    band = round((fc + lr + gra + pr) * 2 / 4) / 2

    return {
        "band_score": band,
        "fluency_coherence": {"score": fc, "comment": f"Words: {wc}, sentences: {len(sentences)}. For higher band, extend answers with examples."},
        "lexical_resource": {"score": lr, "comment": f"Unique word ratio: {unique_ratio:.0%}. Use more topic-specific collocations."},
        "grammatical_range": {"score": gra, "comment": "Mix simple and complex structures. Use conditionals and relative clauses."},
        "pronunciation": {"score": pr, "comment": "Cannot be assessed from text. Focus on sentence stress and intonation."},
        "overall_feedback": "Local fallback: AI provider not configured. Practice speaking at length with varied vocabulary.",
        "improvements": ["Extend answers with reasons and examples.", "Use discourse markers (However, Moreover, For instance).", "Practice pronunciation with Shadowing technique."],
        "transcript": text,
        "annotated_errors": [],
    }
