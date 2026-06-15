"""Tests for persisted Reading diagnostic sessions."""

from app.models import Attempt, DiagnosticSession, Question, Skill, User


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
        question_text=f"Choose the best answer for {category} {suffix}.",
        question_type=category,
        options=["A", "B", "C"],
        correct_answer="A",
        explanation="A is supported by the passage.",
    )
    db.add(question)
    db.flush()
    return question


def _create_attempt(db, user_id: int, question: Question, session_id: int | None = None, is_correct=False):
    attempt = Attempt(
        user_id=user_id,
        question_id=question.id,
        diagnostic_session_id=session_id,
        user_answer="A" if is_correct else "B",
        is_correct=is_correct,
        response_time_ms=1000,
        xp_earned=0,
    )
    db.add(attempt)
    db.flush()
    return attempt


def test_diagnostic_status_for_new_user_has_no_session(client):
    token = _signup_and_login(client, "diag-new@example.com", "diagnew")

    response = client.get("/api/diagnostic/status", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json() == {
        "completed": False,
        "answered": 0,
        "target": 10,
        "remaining": 10,
        "recommended": True,
        "session_id": None,
        "status": None,
    }


def test_start_diagnostic_creates_one_active_session(client, db):
    token = _signup_and_login(client, "diag-start@example.com", "diagstart")
    user = db.query(User).filter(User.email == "diag-start@example.com").first()

    response = client.post("/api/diagnostic/start", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert data["module"] == "READING"
    assert data["status"] == "in_progress"
    assert data["answered"] == 0
    assert db.query(DiagnosticSession).filter(DiagnosticSession.user_id == user.id).count() == 1


def test_start_diagnostic_twice_does_not_duplicate_active_session(client, db):
    token = _signup_and_login(client, "diag-dup@example.com", "diagdup")

    first = client.post("/api/diagnostic/start", headers={"Authorization": f"Bearer {token}"}).json()
    second = client.post("/api/diagnostic/start", headers={"Authorization": f"Bearer {token}"}).json()

    assert first["session_id"] == second["session_id"]
    assert db.query(DiagnosticSession).count() == 1


def test_diagnostic_next_returns_only_reading_questions(client, db):
    token = _signup_and_login(client, "diag-next@example.com", "diagnext")
    _create_question(db, "HEADINGS", "READING")
    _create_question(db, "LISTENING_FORM", "LISTENING")
    db.commit()

    client.post("/api/diagnostic/start", headers={"Authorization": f"Bearer {token}"})
    response = client.get("/api/diagnostic/next", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert data["question"]["question_type"] == "HEADINGS"
    assert "correct_answer" not in data["question"]


def test_diagnostic_next_avoids_questions_attempted_in_same_session(client, db):
    token = _signup_and_login(client, "diag-avoid@example.com", "diagavoid")
    user = db.query(User).filter(User.email == "diag-avoid@example.com").first()
    first_question = _create_question(db, "HEADINGS", "READING", "first")
    second_question = _create_question(db, "HEADINGS", "READING", "second")
    session_response = client.post("/api/diagnostic/start", headers={"Authorization": f"Bearer {token}"})
    session_id = session_response.json()["session_id"]
    _create_attempt(db, user.id, first_question, session_id=session_id)
    db.commit()

    response = client.get("/api/diagnostic/next", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["question"]["id"] == second_question.id


def test_diagnostic_submit_links_attempt_to_session(client, db):
    token = _signup_and_login(client, "diag-submit@example.com", "diagsubmit")
    question = _create_question(db, "TF_NG", "READING")
    session_id = client.post("/api/diagnostic/start", headers={"Authorization": f"Bearer {token}"}).json()["session_id"]
    db.commit()

    response = client.post(
        "/api/diagnostic/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={"question_id": question.id, "user_answer": "A", "response_time_ms": 1200},
    )

    assert response.status_code == 200
    attempt = db.query(Attempt).filter(Attempt.question_id == question.id).first()
    assert attempt.diagnostic_session_id == session_id
    assert response.json()["session_id"] == session_id
    assert response.json()["diagnostic_completed"] is False


def test_diagnostic_completes_after_ten_submits(client, db):
    token = _signup_and_login(client, "diag-complete@example.com", "diagcomplete")
    questions = [_create_question(db, "HEADINGS", "READING", str(index)) for index in range(10)]
    session_id = client.post("/api/diagnostic/start", headers={"Authorization": f"Bearer {token}"}).json()["session_id"]
    db.commit()

    for question in questions:
        response = client.post(
            "/api/diagnostic/submit",
            headers={"Authorization": f"Bearer {token}"},
            json={"question_id": question.id, "user_answer": "A", "response_time_ms": 1000},
        )
        assert response.status_code == 200

    session = db.query(DiagnosticSession).filter(DiagnosticSession.id == session_id).first()
    assert session.status == "completed"
    assert session.completed_at is not None
    assert session.result_snapshot["completed"] is True
    assert session.result_snapshot["answered"] == 10


def test_completed_result_snapshot_does_not_change_after_regular_practice(client, db):
    token = _signup_and_login(client, "diag-stable@example.com", "diagstable")
    diagnostic_questions = [_create_question(db, "HEADINGS", "READING", f"diag-{index}") for index in range(10)]
    practice_question = _create_question(db, "SUMMARY", "READING", "practice")
    client.post("/api/diagnostic/start", headers={"Authorization": f"Bearer {token}"})
    db.commit()

    for question in diagnostic_questions:
        client.post(
            "/api/diagnostic/submit",
            headers={"Authorization": f"Bearer {token}"},
            json={"question_id": question.id, "user_answer": "B", "response_time_ms": 1000},
        )

    result_before = client.get("/api/diagnostic/result", headers={"Authorization": f"Bearer {token}"}).json()

    practice_response = client.post(
        "/api/questions/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={"question_id": practice_question.id, "user_answer": "A", "response_time_ms": 1000},
    )
    assert practice_response.status_code == 200
    result_after = client.get("/api/diagnostic/result", headers={"Authorization": f"Bearer {token}"}).json()

    assert result_after == result_before


def test_diagnostic_ignores_other_users_sessions(client, db):
    token = _signup_and_login(client, "diag-owner@example.com", "diagowner")
    other_token = _signup_and_login(client, "diag-other@example.com", "diagother")
    question = _create_question(db, "HEADINGS", "READING")
    other_session_id = client.post(
        "/api/diagnostic/start",
        headers={"Authorization": f"Bearer {other_token}"},
    ).json()["session_id"]
    client.post(
        "/api/diagnostic/submit",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"question_id": question.id, "user_answer": "A", "response_time_ms": 1000},
    )
    db.commit()

    status_response = client.get("/api/diagnostic/status", headers={"Authorization": f"Bearer {token}"})
    result_response = client.get("/api/diagnostic/result", headers={"Authorization": f"Bearer {token}"})

    assert status_response.status_code == 200
    assert status_response.json()["answered"] == 0
    assert status_response.json()["session_id"] is None
    assert result_response.status_code == 200
    assert result_response.json()["answered"] == 0
    assert db.query(DiagnosticSession).filter(DiagnosticSession.id == other_session_id).first().user.email == "diag-other@example.com"


def test_existing_practice_submit_still_works_without_diagnostic_session(client, db):
    token = _signup_and_login(client, "diag-practice@example.com", "diagpractice")
    question = _create_question(db, "SUMMARY", "READING")
    db.commit()

    response = client.post(
        "/api/questions/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={"question_id": question.id, "user_answer": "A", "response_time_ms": 1000},
    )

    assert response.status_code == 200
    attempt = db.query(Attempt).filter(Attempt.question_id == question.id).first()
    assert attempt.diagnostic_session_id is None
