"""Validation helpers for IELTS Reading content quality."""

from collections import Counter
from typing import Any

from .module_skills import get_categories_for_module

VALID_READING_TYPES = set(get_categories_for_module("READING"))
PLACEHOLDER_PHRASES = {
    "the answer is supported by the passage",
    "the answer is stated directly",
    "placeholder",
    "todo",
    "lorem ipsum",
}
TF_NG_ACCEPTED = {"true", "false", "not given"}


def _text(value: Any) -> str:
    return str(value or "").strip()


def _options(question) -> list[str]:
    options = getattr(question, "options", None) or []
    if not isinstance(options, list):
        return []
    return [str(option).strip() for option in options if str(option).strip()]


def validate_reading_question(question) -> list[str]:
    """Return validation errors for a Reading question."""
    errors: list[str] = []
    module = _text(getattr(question, "module", None)).upper()
    question_type = _text(getattr(question, "question_type", None)).upper()
    skill = getattr(question, "skill", None)
    skill_category = _text(getattr(skill, "category", None)).upper()
    passage = _text(getattr(question, "passage", None))
    question_text = _text(getattr(question, "question_text", None))
    correct_answer = _text(getattr(question, "correct_answer", None))
    explanation = _text(getattr(question, "explanation", None))
    options = _options(question)
    difficulty = getattr(question, "difficulty", None)

    if module != "READING":
        errors.append("module must be READING")
    if question_type not in VALID_READING_TYPES:
        errors.append(f"question_type must be one of {sorted(VALID_READING_TYPES)}")
    if not skill_category:
        errors.append("skill category is required")
    elif skill_category not in VALID_READING_TYPES:
        errors.append("skill category must be a valid Reading category")
    elif question_type in VALID_READING_TYPES and skill_category != question_type:
        errors.append("skill category must match question_type")
    if len(passage) < 100:
        errors.append("passage must be present and at least 100 characters")
    if not _text(getattr(question, "passage_title", None)):
        errors.append("passage_title must be present")
    if not question_text:
        errors.append("question_text must be present")
    if not correct_answer:
        errors.append("correct_answer must be present")
    if len(explanation) < 30:
        errors.append("explanation must be present and at least 30 characters")
    if getattr(question, "is_active", False) and getattr(question, "approved", False):
        lower_explanation = explanation.lower()
        if any(phrase in lower_explanation for phrase in PLACEHOLDER_PHRASES):
            errors.append("active approved question has placeholder explanation")
    if question_type == "MCQ" and len(options) < 3:
        errors.append("MCQ questions must have at least 3 non-empty options")
    if question_type == "TF_NG":
        accepted = {option.lower() for option in options}
        if not TF_NG_ACCEPTED.issubset(accepted):
            errors.append("TF_NG questions must offer True, False, and Not Given options")
    if getattr(question, "options", None) and len(options) != len(getattr(question, "options")):
        errors.append("options must not contain empty strings")
    if not isinstance(difficulty, int) or difficulty < 1 or difficulty > 10:
        errors.append("difficulty must be within 1-10")

    return errors


def validate_reading_question_warnings(question) -> list[str]:
    """Return non-blocking quality warnings for a Reading question."""
    warnings: list[str] = []
    passage = _text(getattr(question, "passage", None))
    word_count = len(passage.split())
    if passage and (word_count < 250 or word_count > 450):
        warnings.append("passage should usually be 250-450 words for IELTS-style demo content")
    return warnings


def get_reading_category_counts(questions) -> dict[str, int]:
    """Return counts for all supported Reading categories."""
    counter = Counter(_text(getattr(question, "question_type", None)).upper() for question in questions)
    return {category: counter.get(category, 0) for category in sorted(VALID_READING_TYPES)}
