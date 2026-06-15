"""Module-to-skill category mapping helpers."""

MODULE_SKILL_CATEGORIES = {
    "READING": [
        "TF_NG",
        "HEADINGS",
        "SUMMARY",
        "MATCHING_INFO",
        "SENTENCE_COMP",
        "MCQ",
        "FILL_BLANK",
    ],
    "LISTENING": [
        "LISTENING_MCQ",
        "LISTENING_FORM",
        "LISTENING_MAP",
        "LISTENING_NOTES",
    ],
}


def normalize_module(module: str) -> str:
    """Normalize incoming module strings to the API's uppercase form."""
    return (module or "READING").strip().upper()


def get_categories_for_module(module: str) -> list[str]:
    """Return known skill categories for a module."""
    return MODULE_SKILL_CATEGORIES.get(normalize_module(module), [])


def skill_belongs_to_module(skill_category: str, module: str) -> bool:
    """Check whether a skill category is part of the requested module."""
    return skill_category in get_categories_for_module(module)
