"""Tests for Today's Plan API."""

from app.models import Attempt, DiagnosticSession, MistakeReview, Question, Skill, User, UserSkillMastery
from app.services.module_skills import skill_belongs_to_module


def _complete_reading_diagnostic(db, user_id: int) -> DiagnosticSession:
    session = DiagnosticSession(
        user_id=user_id,
        module="READING",
        status="completed",
        target_questions=10,
        accuracy=0.6,
        estimated_band=6.0,
        result_snapshot={
            "completed": True,
            "answered": 10,
            "accuracy": 0.6,
            "estimated_reading_band": 6.0,
            "weak_skills": [],
            "recommendation": "Start with Reading practice.",
        },
    )
    db.add(session)
    db.flush()
    return session


class TestTodayPlan:
    def test_today_plan_requires_authentication(self, client):
        response = client.get("/api/plan/today")

        assert response.status_code == 401

    def test_today_plan_returns_diagnostic_for_new_user(self, authenticated_client):
        response = authenticated_client.get("/api/plan/today")

        assert response.status_code == 200
        data = response.json()

        assert data["title"] == "Start with your Reading Diagnostic"
        assert data["focus_skill"] is None
        assert data["tasks"][0]["type"] == "diagnostic"
        assert data["tasks"][0]["label"] == "Complete your 10-question Reading Diagnostic"
        assert data["tasks"][0]["href"] == "/diagnostic"
        assert "diagnostic first" in data["reason"].lower()

    def test_today_plan_uses_weakest_skill_mastery(self, client, db, test_user_data):
        client.post("/api/auth/signup", json=test_user_data)
        login = client.post("/api/auth/login/json", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        token = login.json()["access_token"]
        user = db.query(User).filter(User.email == test_user_data["email"]).first()
        _complete_reading_diagnostic(db, user.id)

        headings = Skill(name="Matching Headings", category="HEADINGS")
        summary = Skill(name="Summary Completion", category="SUMMARY")
        db.add_all([headings, summary])
        db.flush()

        question = Question(
            skill_id=headings.id,
            passage="Test passage",
            question_text="Choose the best heading.",
            question_type="HEADINGS",
            correct_answer="A",
        )
        db.add(question)
        db.flush()

        db.add_all([
            UserSkillMastery(
                user_id=user.id,
                skill_id=headings.id,
                mastery_probability=0.42,
                attempts_count=3,
                correct_count=1,
            ),
            UserSkillMastery(
                user_id=user.id,
                skill_id=summary.id,
                mastery_probability=0.75,
                attempts_count=3,
                correct_count=2,
            ),
            Attempt(
                user_id=user.id,
                question_id=question.id,
                user_answer="B",
                is_correct=False,
                response_time_ms=20000,
            ),
        ])
        db.commit()

        response = client.get(
            "/api/plan/today",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["focus_skill"]["skill_id"] == headings.id
        assert data["focus_skill"]["skill_name"] == "Matching Headings"
        assert data["focus_skill"]["mastery_probability"] == 0.42
        assert data["tasks"][0]["type"] == "reading_practice"
        assert data["tasks"][0]["module"] == "READING"

    def test_today_plan_prefers_reading_weakest_for_reading_tasks(self, client, db, test_user_data):
        client.post("/api/auth/signup", json=test_user_data)
        login = client.post("/api/auth/login/json", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        token = login.json()["access_token"]
        user = db.query(User).filter(User.email == test_user_data["email"]).first()
        _complete_reading_diagnostic(db, user.id)

        headings = Skill(name="Matching Headings", category="HEADINGS")
        listening = Skill(name="Listening Forms", category="LISTENING_FORM")
        db.add_all([headings, listening])
        db.flush()

        reading_question = Question(
            skill_id=headings.id,
            module="READING",
            passage="Reading passage",
            question_text="Choose the best heading.",
            question_type="HEADINGS",
            correct_answer="A",
            is_active=True,
            approved=True,
        )
        listening_question = Question(
            skill_id=listening.id,
            module="LISTENING",
            passage="Listening transcript",
            question_text="Complete the form.",
            question_type="LISTENING_FORM",
            correct_answer="library",
            is_active=True,
            approved=True,
        )
        db.add_all([reading_question, listening_question])
        db.flush()

        db.add_all([
            UserSkillMastery(
                user_id=user.id,
                skill_id=headings.id,
                mastery_probability=0.55,
                attempts_count=3,
                correct_count=2,
            ),
            UserSkillMastery(
                user_id=user.id,
                skill_id=listening.id,
                mastery_probability=0.10,
                attempts_count=3,
                correct_count=0,
            ),
            Attempt(
                user_id=user.id,
                question_id=reading_question.id,
                user_answer="B",
                is_correct=False,
                response_time_ms=20000,
            ),
            Attempt(
                user_id=user.id,
                question_id=listening_question.id,
                user_answer="bookstore",
                is_correct=False,
                response_time_ms=20000,
            ),
        ])
        db.commit()

        response = client.get(
            "/api/plan/today",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["tasks"][0]["module"] == "READING"
        assert data["focus_skill"]["skill_id"] == headings.id
        assert skill_belongs_to_module(data["focus_skill"]["category"], data["tasks"][0]["module"])

    def test_today_plan_uses_reading_diagnostic_without_reading_masteries(self, client, db, test_user_data):
        client.post("/api/auth/signup", json=test_user_data)
        login = client.post("/api/auth/login/json", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        token = login.json()["access_token"]
        user = db.query(User).filter(User.email == test_user_data["email"]).first()

        listening = Skill(name="Listening Forms", category="LISTENING_FORM")
        db.add(listening)
        db.flush()
        listening_question = Question(
            skill_id=listening.id,
            module="LISTENING",
            passage="Listening transcript",
            question_text="Complete the form.",
            question_type="LISTENING_FORM",
            correct_answer="library",
            is_active=True,
            approved=True,
        )
        db.add(listening_question)
        db.flush()
        db.add_all([
            UserSkillMastery(
                user_id=user.id,
                skill_id=listening.id,
                mastery_probability=0.10,
                attempts_count=3,
                correct_count=0,
            ),
            Attempt(
                user_id=user.id,
                question_id=listening_question.id,
                user_answer="bookstore",
                is_correct=False,
                response_time_ms=20000,
            ),
        ])
        db.commit()

        response = client.get(
            "/api/plan/today",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["focus_skill"] is None
        assert data["tasks"][0]["module"] == "READING"
        assert data["tasks"][0]["label"] == "Complete your 10-question Reading Diagnostic"

    def test_today_plan_includes_unresolved_reading_mistake_review(self, client, db, test_user_data):
        client.post("/api/auth/signup", json=test_user_data)
        login = client.post("/api/auth/login/json", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        token = login.json()["access_token"]
        user = db.query(User).filter(User.email == test_user_data["email"]).first()
        _complete_reading_diagnostic(db, user.id)

        headings = Skill(name="Matching Headings", category="HEADINGS")
        db.add(headings)
        db.flush()
        question = Question(
            skill_id=headings.id,
            module="READING",
            passage="Reading passage",
            question_text="Choose the best heading.",
            question_type="HEADINGS",
            correct_answer="A",
            is_active=True,
            approved=True,
        )
        db.add(question)
        db.flush()
        attempt = Attempt(
            user_id=user.id,
            question_id=question.id,
            user_answer="B",
            is_correct=False,
            response_time_ms=20000,
        )
        db.add(attempt)
        db.flush()
        db.add_all([
            UserSkillMastery(
                user_id=user.id,
                skill_id=headings.id,
                mastery_probability=0.42,
                attempts_count=3,
                correct_count=1,
            ),
            MistakeReview(
                user_id=user.id,
                question_id=question.id,
                attempt_id=attempt.id,
                module="READING",
                question_type="HEADINGS",
                user_answer="B",
                correct_answer="A",
                is_resolved=False,
            ),
        ])
        db.commit()

        response = client.get(
            "/api/plan/today",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        mistake_tasks = [task for task in data["tasks"] if task["type"] == "mistake_review"]
        assert mistake_tasks
        assert mistake_tasks[0]["module"] == "READING"
