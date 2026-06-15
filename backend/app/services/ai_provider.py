"""Local-first AI provider utilities for IELTS feedback."""

from __future__ import annotations

import json
import re
from typing import Any

import requests

from ..config import get_settings


def extract_json(text: str) -> dict[str, Any] | None:
    """Extract a JSON object from model output."""
    if not text:
        return None
    cleaned = text.strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            return None
        try:
            parsed = json.loads(match.group(0))
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None


def complete_json_with_ollama(prompt: str) -> dict[str, Any] | None:
    """Call a local Ollama model and parse JSON output."""
    settings = get_settings()
    try:
        response = requests.post(
            f"{settings.ollama_base_url.rstrip('/')}/api/generate",
            json={
                "model": settings.ollama_model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
            },
            timeout=settings.ollama_timeout_sec,
        )
        response.raise_for_status()
        payload = response.json()
        return extract_json(str(payload.get("response", "")))
    except Exception:
        return None


def provider_order() -> list[str]:
    """Return configured provider order."""
    provider = get_settings().ai_provider.lower().strip()
    if provider == "auto":
        return ["ollama", "gemini", "local"]
    if provider in {"ollama", "gemini", "local"}:
        return [provider, "local"] if provider != "local" else ["local"]
    return ["ollama", "local"]


def with_provider_meta(result: dict[str, Any], provider: str) -> dict[str, Any]:
    result["ai_provider"] = provider
    return result
