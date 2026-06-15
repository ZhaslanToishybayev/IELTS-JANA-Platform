"""Tests for module-aware adaptive question selection."""

from app.ml import adaptive_selector
from app.models import Question, Skill, User, UserSkillMastery
from app.services.module_skills import skill_belongs_to_module


def _create_user(db) -> User:
    user = User(
        email="adaptive@example.com",
        username="adaptive",
        password_hash="hashed",
    )
    db.add(user)
    db.flush()
    return user


def _add_skill_with_question(db, name: str, category: str, module: str) -> tuple[Skill, Question]:
    skill = Skill(name=name, category=category)
    db.add(skill)
    db.flush()

    question = Question(
        skill_id=skill.id,
        module=module,
        passage="Practice content",
        question_text=f"{name} question",
        question_type=category,
        correct_answer="A",
        difficulty=5,
        is_active=True,
        approved=True,
    )
    db.add(question)
    db.flush()
    return skill, question


def test_adaptive_selector_reading_only_chooses_reading_skill_and_question(db):
    user = _create_user(db)
    reading_skill, reading_question = _add_skill_with_question(
        db, "Matching Headings", "HEADINGS", "READING"
    )
    listening_skill, _ = _add_skill_with_question(
        db, "Listening Forms", "LISTENING_FORM", "LISTENING"
    )
    db.add_all([
        UserSkillMastery(
            user_id=user.id,
            skill_id=reading_skill.id,
            mastery_probability=0.70,
            attempts_count=3,
            correct_count=2,
        ),
        UserSkillMastery(
            user_id=user.id,
            skill_id=listening_skill.id,
            mastery_probability=0.05,
            attempts_count=3,
            correct_count=0,
        ),
    ])
    db.commit()

    question, target_skill, _ = adaptive_selector.get_next_question(
        db,
        user.id,
        module="READING",
    )

    assert question.id == reading_question.id
    assert question.module == "READING"
    assert target_skill == reading_skill.name
    assert skill_belongs_to_module(question.skill.category, "READING")


def test_adaptive_selector_listening_chooses_listening_when_available(db):
    user = _create_user(db)
    reading_skill, _ = _add_skill_with_question(
        db, "Matching Headings", "HEADINGS", "READING"
    )
    listening_skill, listening_question = _add_skill_with_question(
        db, "Listening Forms", "LISTENING_FORM", "LISTENING"
    )
    db.add_all([
        UserSkillMastery(
            user_id=user.id,
            skill_id=reading_skill.id,
            mastery_probability=0.10,
            attempts_count=3,
            correct_count=0,
        ),
        UserSkillMastery(
            user_id=user.id,
            skill_id=listening_skill.id,
            mastery_probability=0.70,
            attempts_count=3,
            correct_count=2,
        ),
    ])
    db.commit()

    question, target_skill, _ = adaptive_selector.get_next_question(
        db,
        user.id,
        module="LISTENING",
    )

    assert question.id == listening_question.id
    assert question.module == "LISTENING"
    assert target_skill == listening_skill.name
    assert skill_belongs_to_module(question.skill.category, "LISTENING")
