"""Tests for strict Reading content validation."""

from app.models import Question, Skill
from app.services.content_validation import (
    VALID_READING_TYPES,
    get_reading_category_counts,
    validate_reading_question,
)
from seed_ielts_v1 import READING_SKILLS, get_or_create_skill, seed_reading


PASSAGE = (
    "This original IELTS-style passage is long enough for validation. It explains how a local council tested a small "
    "transport change, measured public response, and compared several outcomes before publishing a cautious report. "
    "The details are specific enough to support question reasoning and avoid placeholder content."
)


def _skill(db, category="MCQ"):
    skill = db.query(Skill).filter(Skill.category == category).first()
    if not skill:
        skill = Skill(name=f"Reading {category}", category=category)
        db.add(skill)
        db.flush()
    return skill


def _question(db, category="MCQ", **overrides):
    question = Question(
        skill_id=_skill(db, category).id,
        module="READING",
        passage=PASSAGE,
        passage_title="Validation Passage",
        question_text="What did the council publish?",
        question_type=category,
        options=["a cautious report", "a cookbook", "a railway ticket"] if category == "MCQ" else None,
        correct_answer="a cautious report",
        explanation="The passage explains that the council compared outcomes before publishing a cautious report.",
        difficulty=5,
        approved=True,
        is_active=True,
    )
    for key, value in overrides.items():
        setattr(question, key, value)
    db.add(question)
    db.flush()
    return question


def test_valid_reading_question_passes(db):
    assert validate_reading_question(_question(db)) == []


def test_invalid_question_type_fails(db):
    question = _question(db, category="MCQ", question_type="MATCHING")

    assert any("question_type" in error for error in validate_reading_question(question))


def test_missing_passage_fails(db):
    question = _question(db, passage="")

    assert "passage must be present and at least 100 characters" in validate_reading_question(question)


def test_missing_explanation_fails(db):
    question = _question(db, explanation="")

    assert "explanation must be present and at least 30 characters" in validate_reading_question(question)


def test_mcq_without_options_fails(db):
    question = _question(db, options=[])

    assert "MCQ questions must have at least 3 non-empty options" in validate_reading_question(question)


def test_placeholder_explanation_fails_for_active_approved_question(db):
    question = _question(db, explanation="The answer is supported by the passage.")

    assert "active approved question has placeholder explanation" in validate_reading_question(question)


def test_seeded_reading_content_passes_validation_and_covers_categories(db):
    skill_map = {
        category: get_or_create_skill(db, name, category)
        for name, category in READING_SKILLS
    }

    seed_reading(db, skill_map)
    db.commit()

    questions = (
        db.query(Question)
        .filter(Question.module == "READING", Question.is_active.is_(True), Question.approved.is_(True))
        .all()
    )
    errors = {
        question.id: validate_reading_question(question)
        for question in questions
        if validate_reading_question(question)
    }
    counts = get_reading_category_counts(questions)

    assert errors == {}
    assert set(counts) == VALID_READING_TYPES
    assert all(count >= 3 for count in counts.values())
    assert counts["TF_NG"] >= 5
    assert counts["HEADINGS"] >= 5
    assert counts["SUMMARY"] >= 5
    assert counts["MCQ"] >= 5
