"""Build the lightweight daily IELTS plan shown on the dashboard."""

from sqlalchemy.orm import Session

from ..models import Attempt, MistakeReview, Question, Skill, UserSkillMastery
from .module_skills import get_categories_for_module


READING_MODULE = "READING"


def _reading_diagnostic_plan() -> dict:
    return {
        "title": "Today's IELTS Plan",
        "estimated_minutes": 20,
        "focus_skill": None,
        "tasks": [
            {
                "type": "reading_practice",
                "module": READING_MODULE,
                "label": "Complete your first 10 Reading questions",
                "target": 10,
                "href": "/practice",
            },
            {
                "type": "diagnostic",
                "module": READING_MODULE,
                "label": "Build your initial Reading skill profile",
                "target": 1,
                "href": "/practice",
            },
        ],
        "reason": (
            "Complete a short Reading diagnostic session so IELTS JANA can "
            "personalize your training from real performance data."
        ),
        "reward": {"xp": 50, "streak": True},
    }


def get_today_plan(db: Session, user_id: int) -> dict:
    """Return a minimal actionable plan based on current mastery data."""
    total_attempts = db.query(Attempt).filter(Attempt.user_id == user_id).count()
    reading_categories = get_categories_for_module(READING_MODULE)
    weakest_mastery = (
        db.query(UserSkillMastery, Skill)
        .join(Skill, Skill.id == UserSkillMastery.skill_id)
        .filter(
            UserSkillMastery.user_id == user_id,
            UserSkillMastery.attempts_count > 0,
            Skill.category.in_(reading_categories),
        )
        .order_by(
            UserSkillMastery.mastery_probability.asc(),
            UserSkillMastery.attempts_count.desc(),
        )
        .first()
    )

    if total_attempts == 0 or weakest_mastery is None:
        return _reading_diagnostic_plan()

    mastery, skill = weakest_mastery
    unresolved_mistakes = (
        db.query(MistakeReview)
        .join(Question, Question.id == MistakeReview.question_id)
        .join(Skill, Skill.id == Question.skill_id)
        .filter(
            MistakeReview.user_id == user_id,
            MistakeReview.is_resolved == False,
            MistakeReview.module == READING_MODULE,
            Skill.category.in_(reading_categories),
        )
        .count()
    )

    tasks = [
        {
            "type": "reading_practice",
            "module": READING_MODULE,
            "label": "Practice 10 adaptive Reading questions",
            "target": 10,
            "href": "/practice",
        }
    ]

    if unresolved_mistakes:
        tasks.append({
            "type": "mistake_review",
            "module": READING_MODULE,
            "label": "Review recent Reading mistakes",
            "target": min(unresolved_mistakes, 5),
            "href": "/review",
        })
    else:
        tasks.append({
            "type": "accuracy_check",
            "module": READING_MODULE,
            "label": "Finish with 5 focused accuracy questions",
            "target": 5,
            "href": "/practice",
        })

    return {
        "title": "Today's IELTS Plan",
        "estimated_minutes": 25,
        "focus_skill": {
            "skill_id": skill.id,
            "skill_name": skill.name,
            "category": skill.category,
            "mastery_probability": mastery.mastery_probability,
        },
        "tasks": tasks,
        "reason": "This plan focuses on your weakest skill to improve faster.",
        "reward": {"xp": 50, "streak": True},
    }
