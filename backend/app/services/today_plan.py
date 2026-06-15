"""Build the lightweight daily IELTS plan shown on the dashboard."""

from sqlalchemy.orm import Session

from ..models import Attempt, MistakeReview, Skill, UserSkillMastery


def get_today_plan(db: Session, user_id: int) -> dict:
    """Return a minimal actionable plan based on current mastery data."""
    total_attempts = db.query(Attempt).filter(Attempt.user_id == user_id).count()

    weakest_mastery = (
        db.query(UserSkillMastery, Skill)
        .join(Skill, Skill.id == UserSkillMastery.skill_id)
        .filter(
            UserSkillMastery.user_id == user_id,
            UserSkillMastery.attempts_count > 0,
        )
        .order_by(
            UserSkillMastery.mastery_probability.asc(),
            UserSkillMastery.attempts_count.desc(),
        )
        .first()
    )

    if total_attempts == 0 or weakest_mastery is None:
        return {
            "title": "Today's IELTS Plan",
            "estimated_minutes": 20,
            "focus_skill": None,
            "tasks": [
                {
                    "type": "reading_practice",
                    "label": "Complete your first 10 Reading questions",
                    "target": 10,
                    "href": "/practice",
                },
                {
                    "type": "diagnostic",
                    "label": "Build your initial skill profile",
                    "target": 1,
                    "href": "/practice",
                },
            ],
            "reason": (
                "Complete a short diagnostic session so IELTS JANA can "
                "personalize your training from real performance data."
            ),
            "reward": {"xp": 50, "streak": True},
        }

    mastery, skill = weakest_mastery
    unresolved_mistakes = (
        db.query(MistakeReview)
        .filter(
            MistakeReview.user_id == user_id,
            MistakeReview.is_resolved == False,
        )
        .count()
    )

    tasks = [
        {
            "type": "reading_practice",
            "label": "Practice 10 adaptive Reading questions",
            "target": 10,
            "href": "/practice",
        }
    ]

    if unresolved_mistakes:
        tasks.append({
            "type": "mistake_review",
            "label": "Review recent mistakes",
            "target": min(unresolved_mistakes, 5),
            "href": "/review",
        })
    else:
        tasks.append({
            "type": "accuracy_check",
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
