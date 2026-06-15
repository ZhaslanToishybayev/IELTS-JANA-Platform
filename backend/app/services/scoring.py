"""IELTS scoring and answer normalization utilities."""

from __future__ import annotations

import json
import re
from typing import Iterable


READING_BAND_TABLE = [
    (39, 9.0), (37, 8.5), (35, 8.0), (33, 7.5), (30, 7.0),
    (27, 6.5), (23, 6.0), (19, 5.5), (15, 5.0), (13, 4.5),
    (10, 4.0), (0, 3.5),
]

LISTENING_BAND_TABLE = [
    (39, 9.0), (37, 8.5), (35, 8.0), (32, 7.5), (30, 7.0),
    (26, 6.5), (23, 6.0), (18, 5.5), (16, 5.0), (13, 4.5),
    (10, 4.0), (0, 3.5),
]


def round_half(score: float) -> float:
    """Round to nearest IELTS half band."""
    return round(score * 2) / 2


def raw_to_band(raw_score: int, module: str, total_questions: int = 40) -> float:
    """Convert raw Reading/Listening score to IELTS band."""
    if total_questions <= 0:
        return 0.0
    normalized = round(raw_score * 40 / total_questions)
    table = LISTENING_BAND_TABLE if module.upper() == "LISTENING" else READING_BAND_TABLE
    for threshold, band in table:
        if normalized >= threshold:
            return band
    return 0.0


def normalize_answer(value: object) -> str:
    """Normalize IELTS short answers without destroying meaningful content."""
    text = str(value or "").strip().lower()
    text = text.replace("’", "'")
    text = re.sub(r"^(a|an|the)\s+", "", text)
    text = re.sub(r"[^a-z0-9\s'-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _answer_variants(correct_answer: str) -> Iterable[str]:
    raw = str(correct_answer or "").strip()
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except json.JSONDecodeError:
        pass
    if "|" in raw:
        return [part.strip() for part in raw.split("|")]
    return [raw]


def answer_matches(user_answer: str, correct_answer: str) -> bool:
    """Compare user answer against one or more acceptable answers."""
    normalized_user = normalize_answer(user_answer)
    return any(normalized_user == normalize_answer(answer) for answer in _answer_variants(correct_answer))


def overall_band(scores: Iterable[float]) -> float:
    valid_scores = [score for score in scores if score is not None and score > 0]
    if not valid_scores:
        return 0.0
    return round_half(sum(valid_scores) / len(valid_scores))
