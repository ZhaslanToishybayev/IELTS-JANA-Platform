"""Tests for the demo learner seed script helpers."""

import pytest

from app.models import Attempt, DiagnosticSession, MistakeReview, Question, Skill, User, UserSkillMastery
from app.services.auth import authenticate_user
from app.services.module_skills import get_categories_for_module
from seed_demo_user import DEMO_EMAIL, DEMO_PASSWORD, seed_demo_profile


def _create_reading_question(db, category: str, index: int) -> None:
    skill = db.query(Skill).filter(Skill.category == category).first()
    if not skill:
        skill = Skill(name=f"Reading {category}", category=category)
        db.add(skill)
        db.flush()
    question = Question(
        skill_id=skill.id,
        module="READING",
        passage_title=f"Demo Passage {category}",
        passage="Original IELTS-style demo content for local testing.",
        question_text=f"{category} demo question {index}",
        question_type=category,
        options=["A", "B", "C"] if category in {"TF_NG", "HEADINGS", "MATCHING_INFO", "MCQ"} else None,
        correct_answer="A",
        explanation="The answer is supported by the demo passage.",
        difficulty=4,
        approved=True,
        is_active=True,
    )
    db.add(question)
    db.flush()


def _seed_minimum_reading_bank(db) -> None:
    for category in get_categories_for_module("READING"):
        _create_reading_question(db, category, 1)
        _create_reading_question(db, category, 2)
    db.commit()


def test_demo_seed_requires_reading_content(db):
    with pytest.raises(RuntimeError, match="Run python seed_ielts_v1.py first."):
        seed_demo_profile(db)


def test_demo_seed_creates_idempotent_profile(db):
    _seed_minimum_reading_bank(db)

    first_user = seed_demo_profile(db)
    second_user = seed_demo_profile(db)

    assert first_user.id == second_user.id
    assert db.query(User).filter(User.email == DEMO_EMAIL).count() == 1
    assert authenticate_user(db, DEMO_EMAIL, DEMO_PASSWORD).id == first_user.id
    assert db.query(DiagnosticSession).filter(DiagnosticSession.user_id == first_user.id).count() == 1
    assert db.query(Attempt).filter(Attempt.user_id == first_user.id).count() == 14
    assert db.query(MistakeReview).filter(MistakeReview.user_id == first_user.id).count() >= 4
    assert db.query(UserSkillMastery).filter(UserSkillMastery.user_id == first_user.id).count() == 7

    session = db.query(DiagnosticSession).filter(DiagnosticSession.user_id == first_user.id).one()
    assert session.status == "completed"
    assert session.result_snapshot["completed"] is True
    assert session.result_snapshot["weak_skills"]
    assert second_user.xp == 760
    assert second_user.current_streak == 4
