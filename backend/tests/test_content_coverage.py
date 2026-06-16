"""Tests for Reading content coverage checks."""

from app.models import Question, Skill
from app.services.content_coverage import (
    get_missing_reading_categories,
    get_reading_category_coverage,
    has_minimum_reading_coverage,
)
from app.services.module_skills import get_categories_for_module


def _create_question(db, category: str, index: int = 0, active=True, approved=True) -> Question:
    skill = db.query(Skill).filter(Skill.category == category).first()
    if not skill:
        skill = Skill(name=f"Reading {category}", category=category)
        db.add(skill)
        db.flush()
    question = Question(
        skill_id=skill.id,
        module="READING",
        passage_title=f"Coverage Passage {category}",
        passage="An original IELTS-style demo passage for content coverage testing.",
        question_text=f"{category} coverage question {index}",
        question_type=category,
        options=["A", "B", "C"] if category in {"MCQ", "HEADINGS", "TF_NG", "MATCHING_INFO"} else None,
        correct_answer="A",
        explanation="The answer is stated in the original demo passage.",
        is_active=active,
        approved=approved,
    )
    db.add(question)
    db.flush()
    return question


def test_coverage_endpoint_requires_authentication(client):
    response = client.get("/api/content/reading/coverage")

    assert response.status_code == 401


def test_coverage_response_includes_all_reading_categories(authenticated_client):
    response = authenticated_client.get("/api/content/reading/coverage")

    assert response.status_code == 200
    categories = [item["category"] for item in response.json()["categories"]]
    assert categories == get_categories_for_module("READING")


def test_coverage_ready_false_when_categories_are_missing(authenticated_client, db):
    _create_question(db, "HEADINGS", 1)
    _create_question(db, "HEADINGS", 2)
    db.commit()

    response = authenticated_client.get("/api/content/reading/coverage")

    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is False
    assert "TF_NG" in data["missing_categories"]
    assert has_minimum_reading_coverage(db) is False
    assert "SUMMARY" in get_missing_reading_categories(db)


def test_coverage_ready_true_when_minimum_exists(authenticated_client, db):
    for category in get_categories_for_module("READING"):
        _create_question(db, category, 1)
        _create_question(db, category, 2)
    db.commit()

    response = authenticated_client.get("/api/content/reading/coverage")

    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True
    assert data["total_questions"] == 14
    assert data["missing_categories"] == []
    assert get_reading_category_coverage(db)["ready"] is True


def test_coverage_ignores_inactive_or_unapproved_questions(authenticated_client, db):
    for category in get_categories_for_module("READING"):
        _create_question(db, category, 1, active=False)
        _create_question(db, category, 2, approved=False)
    db.commit()

    response = authenticated_client.get("/api/content/reading/coverage")

    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is False
    assert data["total_questions"] == 0


def test_diagnostic_next_returns_helpful_404_when_no_reading_content(authenticated_client):
    authenticated_client.post("/api/diagnostic/start")

    response = authenticated_client.get("/api/diagnostic/next")

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Reading diagnostic content is not ready yet. Add active approved "
        "Reading questions across IELTS Reading categories."
    )
