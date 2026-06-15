"""Tests for IELTS v1 scoring and unified practice behavior."""

from app.models import Question, Skill, MockTestSession
from app.services.scoring import answer_matches, raw_to_band
from app.services.mock_service import mock_service


def test_answer_matching_accepts_case_articles_and_variants():
    assert answer_matches("The Data", "data")
    assert answer_matches("green path", '["blue card", "green path"]')
    assert answer_matches("return ticket", "single ticket|return ticket")


def test_raw_to_band_is_deterministic():
    assert raw_to_band(30, "READING", 40) == 7.0
    assert raw_to_band(30, "LISTENING", 40) == 7.0
    assert raw_to_band(15, "READING", 20) == 7.0


def test_mock_reading_score_uses_submitted_answers(db):
    skill = Skill(name="Reading MCQ", category="READING_MCQ")
    db.add(skill)
    db.flush()
    q1 = Question(
        skill_id=skill.id,
        module="READING",
        passage="A passage about libraries.",
        question_text="What helps readers?",
        question_type="MCQ",
        options=["libraries", "noise"],
        correct_answer="libraries",
    )
    q2 = Question(
        skill_id=skill.id,
        module="READING",
        passage="A passage about libraries.",
        question_text="What causes difficulty?",
        question_type="MCQ",
        options=["noise", "sunlight"],
        correct_answer="noise",
    )
    db.add_all([q1, q2])
    db.flush()
    session = MockTestSession(
        id="mock-test",
        user_id=1,
        answers={"question_ids": {"READING": [q1.id, q2.id]}},
        scores={},
    )
    db.add(session)
    db.commit()

    result = mock_service.submit_reading(db, session, {f"q_{q1.id}": "libraries", f"q_{q2.id}": "wrong"})

    assert result.scores["reading_raw"] == {"correct": 1, "total": 2}
    assert result.scores["reading"] == raw_to_band(1, "READING", 2)


def test_mock_unanswered_questions_count_as_wrong(db):
    skill = Skill(name="Listening Forms", category="LISTENING_FORM")
    db.add(skill)
    db.flush()
    q1 = Question(
        skill_id=skill.id,
        module="LISTENING",
        passage="A library booking conversation.",
        question_text="What day is the booking?",
        question_type="FILL_BLANK",
        correct_answer="Tuesday",
    )
    q2 = Question(
        skill_id=skill.id,
        module="LISTENING",
        passage="A library booking conversation.",
        question_text="What room is booked?",
        question_type="FILL_BLANK",
        correct_answer="Room 4",
    )
    db.add_all([q1, q2])
    db.flush()
    session = MockTestSession(
        id="mock-unanswered",
        user_id=1,
        answers={"question_ids": {"LISTENING": [q1.id, q2.id]}},
        scores={},
    )
    db.add(session)
    db.commit()

    result = mock_service.submit_listening(db, session, {f"q_{q1.id}": "Tuesday"})

    assert result.scores["listening_raw"] == {"correct": 1, "total": 2}
    assert result.scores["listening"] == raw_to_band(1, "LISTENING", 2)


def test_writing_fallback_and_history(authenticated_client):
    response = authenticated_client.post("/api/writing/evaluate", json={
        "task_type": "Task 2",
        "prompt_text": "Do you agree or disagree?",
        "essay_text": "I agree because online learning is flexible. Students can review lessons and manage their time. However, classroom learning still helps discussion and discipline. A balanced approach is therefore useful for most learners.",
        "time_spent_sec": 1200,
    })
    assert response.status_code == 200
    assert response.json()["band_score"] > 0

    history = authenticated_client.get("/api/writing/history")
    assert history.status_code == 200
    assert len(history.json()["attempts"]) == 1
    assert history.json()["attempts"][0]["word_count"] > 0


def test_speaking_fallback_and_history(authenticated_client):
    response = authenticated_client.post(
        "/api/speaking/analyze",
        data={"prompt_text": "Describe a useful skill."},
        files={"file": ("speaking.webm", b"0" * 120000, "audio/webm")},
    )
    assert response.status_code == 200
    assert response.json()["band_score"] > 0

    history = authenticated_client.get("/api/speaking/history")
    assert history.status_code == 200
    assert len(history.json()["attempts"]) == 1
    assert history.json()["attempts"][0]["band_score"] > 0
