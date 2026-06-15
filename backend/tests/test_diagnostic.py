"""Tests for the Reading diagnostic onboarding flow."""

from app.models import Attempt, Question, Skill, User, UserSkillMastery


def _signup_and_login(client, email: str, username: str) -> str:
    client.post("/api/auth/signup", json={
        "email": email,
        "username": username,
        "password": "TestPass123",
    })
    response = client.post("/api/auth/login/json", json={
        "email": email,
        "password": "TestPass123",
    })
    return response.json()["access_token"]


def _create_question(db, category="HEADINGS", module="READING", suffix="") -> Question:
    skill = Skill(name=f"{module} {category} {suffix}".strip(), category=category)
    db.add(skill)
    db.flush()
    question = Question(
        skill_id=skill.id,
        module=module,
        passage="This IELTS passage is used for diagnostic testing.",
        passage_title="Diagnostic Passage",
        question_text=f"Choose the best answer for {category}.",
        question_type=category,
        options=["A", "B", "C"],
        correct_answer="A",
        explanation="A is supported by the passage.",
    )
    db.add(question)
    db.flush()
    return question


def _create_attempt(db, user_id: int, question: Question, is_correct=False):
    attempt = Attempt(
        user_id=user_id,
        question_id=question.id,
        user_answer="A" if is_correct else "B",
        is_correct=is_correct,
        response_time_ms=1000,
        xp_earned=0,
    )
    db.add(attempt)
    db.flush()
    return attempt


def test_diagnostic_status_for_new_user(client):
    token = _signup_and_login(client, "diag-new@example.com", "diagnew")

    response = client.get("/api/diagnostic/status", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json() == {
        "completed": False,
        "answered": 0,
        "target": 10,
        "remaining": 10,
        "recommended": True,
    }


def test_diagnostic_status_counts_reading_attempts_only(client, db):
    token = _signup_and_login(client, "diag-count@example.com", "diagcount")
    user = db.query(User).filter(User.email == "diag-count@example.com").first()
    reading_question = _create_question(db, "HEADINGS", "READING")
    listening_question = _create_question(db, "LISTENING_FORM", "LISTENING")
    for _ in range(3):
        _create_attempt(db, user.id, reading_question)
    for _ in range(2):
        _create_attempt(db, user.id, listening_question)
    db.commit()

    response = client.get("/api/diagnostic/status", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["answered"] == 3
    assert response.json()["remaining"] == 7


def test_diagnostic_next_returns_only_reading_questions(client, db):
    token = _signup_and_login(client, "diag-next@example.com", "diagnext")
    _create_question(db, "HEADINGS", "READING")
    _create_question(db, "LISTENING_FORM", "LISTENING")
    db.commit()

    response = client.get("/api/diagnostic/next", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert data["question"]["question_type"] == "HEADINGS"
    assert data["target_skill"].startswith("READING")


def test_diagnostic_next_does_not_expose_correct_answer(client, db):
    token = _signup_and_login(client, "diag-safe@example.com", "diagsafe")
    _create_question(db, "TF_NG", "READING")
    db.commit()

    response = client.get("/api/diagnostic/next", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert "correct_answer" not in response.json()["question"]


def test_diagnostic_result_returns_weak_skills_after_attempts(client, db):
    token = _signup_and_login(client, "diag-result@example.com", "diagresult")
    user = db.query(User).filter(User.email == "diag-result@example.com").first()
    headings = _create_question(db, "HEADINGS", "READING", "weak")
    summary = _create_question(db, "SUMMARY", "READING", "strong")
    db.add_all([
        UserSkillMastery(
            user_id=user.id,
            skill_id=headings.skill_id,
            mastery_probability=0.25,
            attempts_count=3,
            correct_count=1,
        ),
        UserSkillMastery(
            user_id=user.id,
            skill_id=summary.skill_id,
            mastery_probability=0.72,
            attempts_count=2,
            correct_count=2,
        ),
    ])
    _create_attempt(db, user.id, headings, is_correct=False)
    _create_attempt(db, user.id, headings, is_correct=False)
    _create_attempt(db, user.id, headings, is_correct=True)
    _create_attempt(db, user.id, summary, is_correct=True)
    db.commit()

    response = client.get("/api/diagnostic/result", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert data["answered"] == 4
    assert data["accuracy"] == 0.5
    assert data["estimated_reading_band"] >= 0
    assert data["weak_skills"][0]["category"] == "HEADINGS"
    assert data["weak_skills"][0]["attempts_count"] == 3
    assert "Matching" not in data["recommendation"] or data["weak_skills"][0]["skill_name"] in data["recommendation"]


def test_diagnostic_ignores_other_users_data(client, db):
    token = _signup_and_login(client, "diag-owner@example.com", "diagowner")
    _signup_and_login(client, "diag-other@example.com", "diagother")
    other = db.query(User).filter(User.email == "diag-other@example.com").first()
    question = _create_question(db, "HEADINGS", "READING")
    for _ in range(5):
        _create_attempt(db, other.id, question)
    db.commit()

    status_response = client.get("/api/diagnostic/status", headers={"Authorization": f"Bearer {token}"})
    result_response = client.get("/api/diagnostic/result", headers={"Authorization": f"Bearer {token}"})

    assert status_response.status_code == 200
    assert status_response.json()["answered"] == 0
    assert result_response.status_code == 200
    assert result_response.json()["answered"] == 0
    assert result_response.json()["weak_skills"] == []
