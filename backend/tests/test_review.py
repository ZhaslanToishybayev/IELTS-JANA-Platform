"""Tests for mistake review endpoints."""

from app.models import MistakeReview, Question, Skill, User


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


def _create_question(db, category="HEADINGS", module="READING") -> Question:
    skill = Skill(name=f"{module} {category}", category=category)
    db.add(skill)
    db.flush()
    question = Question(
        skill_id=skill.id,
        module=module,
        passage="This is a longer IELTS passage used for a review excerpt.",
        passage_title="Practice Passage",
        question_text="Choose the best answer.",
        question_type=category,
        correct_answer="A",
        explanation="A is correct because it matches the main idea.",
    )
    db.add(question)
    db.flush()
    return question


def _create_mistake(db, user_id: int, question: Question, resolved=False) -> MistakeReview:
    mistake = MistakeReview(
        user_id=user_id,
        question_id=question.id,
        module=question.module,
        question_type=question.question_type,
        user_answer="B",
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        is_resolved=resolved,
    )
    db.add(mistake)
    db.flush()
    return mistake


def test_user_can_list_own_mistakes(client, db):
    token = _signup_and_login(client, "review@example.com", "reviewer")
    user = db.query(User).filter(User.email == "review@example.com").first()
    question = _create_question(db)
    mistake = _create_mistake(db, user.id, question)
    db.commit()

    response = client.get(
        "/api/review/mistakes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["mistakes"]) == 1
    assert data["mistakes"][0]["id"] == mistake.id
    assert data["mistakes"][0]["question_id"] == question.id
    assert data["mistakes"][0]["passage_title"] == "Practice Passage"
    assert data["mistakes"][0]["passage_excerpt"]
    assert data["mistakes"][0]["skill_category"] == "HEADINGS"
    assert data["mistakes"][0]["skill"]["category"] == "HEADINGS"
    assert data["mistakes"][0]["attempted_at"]
    assert data["mistakes"][0]["practice_href"] == "/practice?module=READING&question_type=HEADINGS&mode=drill"


def test_user_cannot_see_another_users_mistakes(client, db):
    token = _signup_and_login(client, "owner@example.com", "owner")
    _signup_and_login(client, "other@example.com", "otheruser")
    other = db.query(User).filter(User.email == "other@example.com").first()
    question = _create_question(db)
    _create_mistake(db, other.id, question)
    db.commit()

    response = client.get(
        "/api/review/mistakes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["mistakes"] == []


def test_resolving_mistake_marks_it_resolved(client, db):
    token = _signup_and_login(client, "resolve@example.com", "resolver")
    user = db.query(User).filter(User.email == "resolve@example.com").first()
    question = _create_question(db)
    mistake = _create_mistake(db, user.id, question)
    db.commit()

    response = client.post(
        f"/api/review/mistakes/{mistake.id}/resolve",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    db.refresh(mistake)
    assert mistake.is_resolved is True


def test_review_summary_counts_unresolved_mistakes(client, db):
    token = _signup_and_login(client, "summary@example.com", "summaryuser")
    user = db.query(User).filter(User.email == "summary@example.com").first()
    reading_question = _create_question(db, "HEADINGS", "READING")
    listening_question = _create_question(db, "LISTENING_FORM", "LISTENING")
    _create_mistake(db, user.id, reading_question)
    _create_mistake(db, user.id, reading_question)
    _create_mistake(db, user.id, listening_question)
    _create_mistake(db, user.id, listening_question, resolved=True)
    db.commit()

    response = client.get(
        "/api/review/summary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_unresolved"] == 3
    assert data["by_module"] == {"READING": 2, "LISTENING": 1}
    assert data["by_question_type"][0] == {"question_type": "HEADINGS", "count": 2}


def test_review_filters_work_for_module_question_type_and_resolved(client, db):
    token = _signup_and_login(client, "filters@example.com", "filteruser")
    user = db.query(User).filter(User.email == "filters@example.com").first()
    headings = _create_question(db, "HEADINGS", "READING")
    tf_ng = _create_question(db, "TF_NG", "READING")
    listening = _create_question(db, "LISTENING_FORM", "LISTENING")
    _create_mistake(db, user.id, headings)
    resolved = _create_mistake(db, user.id, tf_ng, resolved=True)
    _create_mistake(db, user.id, listening)
    db.commit()

    response = client.get(
        "/api/review/mistakes?module=READING&question_type=TF_NG&status=all",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    mistakes = response.json()["mistakes"]
    assert len(mistakes) == 1
    assert mistakes[0]["id"] == resolved.id

    response = client.get(
        "/api/review/mistakes?status=resolved",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert [item["id"] for item in response.json()["mistakes"]] == [resolved.id]


def test_default_review_list_returns_unresolved_reading_mistakes(client, db):
    token = _signup_and_login(client, "defaultreview@example.com", "defaultreview")
    user = db.query(User).filter(User.email == "defaultreview@example.com").first()
    reading = _create_question(db, "TF_NG", "READING")
    listening = _create_question(db, "LISTENING_FORM", "LISTENING")
    resolved = _create_mistake(db, user.id, reading, resolved=True)
    unresolved_reading = _create_mistake(db, user.id, reading)
    _create_mistake(db, user.id, listening)
    db.commit()

    response = client.get(
        "/api/review/mistakes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    ids = [item["id"] for item in response.json()["mistakes"]]
    assert ids == [unresolved_reading.id]
    assert resolved.id not in ids


def test_new_resolve_endpoint_returns_updated_review_item(client, db):
    token = _signup_and_login(client, "newresolve@example.com", "newresolve")
    user = db.query(User).filter(User.email == "newresolve@example.com").first()
    question = _create_question(db, "MCQ", "READING")
    mistake = _create_mistake(db, user.id, question)
    db.commit()

    response = client.post(
        f"/api/review/{mistake.id}/resolve",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == mistake.id
    assert data["is_resolved"] is True
    assert data["practice_href"] == "/practice?module=READING&question_type=MCQ&mode=drill"


def test_unresolve_endpoint_marks_item_unresolved(client, db):
    token = _signup_and_login(client, "unresolve@example.com", "unresolve")
    user = db.query(User).filter(User.email == "unresolve@example.com").first()
    question = _create_question(db, "SUMMARY", "READING")
    mistake = _create_mistake(db, user.id, question, resolved=True)
    db.commit()

    response = client.post(
        f"/api/review/{mistake.id}/unresolve",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["is_resolved"] is False
    db.refresh(mistake)
    assert mistake.is_resolved is False


def test_another_user_cannot_resolve_someone_elses_mistake(client, db):
    _signup_and_login(client, "owner2@example.com", "owner2")
    other_token = _signup_and_login(client, "intruder@example.com", "intruder")
    owner = db.query(User).filter(User.email == "owner2@example.com").first()
    question = _create_question(db, "HEADINGS", "READING")
    mistake = _create_mistake(db, owner.id, question)
    db.commit()

    response = client.post(
        f"/api/review/{mistake.id}/resolve",
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert response.status_code == 404
    db.refresh(mistake)
    assert mistake.is_resolved is False
