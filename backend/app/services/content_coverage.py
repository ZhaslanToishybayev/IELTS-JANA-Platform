"""Content readiness checks for Reading diagnostic and practice."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models import Question, Skill
from .module_skills import get_categories_for_module

READING_MODULE = "READING"


def get_reading_category_coverage(db: Session, minimum_per_category: int = 2) -> dict:
    """Return active approved Reading question counts by expected category."""
    categories = get_categories_for_module(READING_MODULE)
    rows = (
        db.query(Skill.category, func.count(Question.id))
        .join(Question, Question.skill_id == Skill.id)
        .filter(
            Question.module == READING_MODULE,
            Question.is_active.is_(True),
            Question.approved.is_(True),
            Skill.category.in_(categories),
        )
        .group_by(Skill.category)
        .all()
    )
    counts = {category: 0 for category in categories}
    counts.update({category: count for category, count in rows})

    category_items = [
        {
            "category": category,
            "count": counts[category],
            "ready": counts[category] >= minimum_per_category,
        }
        for category in categories
    ]
    return {
        "module": READING_MODULE,
        "minimum_per_category": minimum_per_category,
        "ready": all(item["ready"] for item in category_items),
        "total_questions": sum(counts.values()),
        "categories": category_items,
        "missing_categories": [
            item["category"]
            for item in category_items
            if not item["ready"]
        ],
    }


def has_minimum_reading_coverage(db: Session, minimum_per_category: int = 2) -> bool:
    """Return whether all expected Reading categories meet the minimum count."""
    return bool(get_reading_category_coverage(db, minimum_per_category)["ready"])


def get_missing_reading_categories(db: Session, minimum_per_category: int = 2) -> list[str]:
    """Return Reading categories below the minimum active approved question count."""
    return list(get_reading_category_coverage(db, minimum_per_category)["missing_categories"])
