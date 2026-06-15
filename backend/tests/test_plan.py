"""Tests for Today's Plan API."""

from app.models import Attempt, Question, Skill, User, UserSkillMastery


class TestTodayPlan:
    def test_today_plan_requires_authentication(self, client):
        response = client.get("/api/plan/today")

        assert response.status_code == 401

    def test_today_plan_returns_diagnostic_for_new_user(self, authenticated_client):
        response = authenticated_client.get("/api/plan/today")

        assert response.status_code == 200
        data = response.json()

        assert data["title"] == "Today's IELTS Plan"
        assert data["focus_skill"] is None
        assert data["tasks"][0]["label"] == "Complete your first 10 Reading questions"
        assert "initial" in data["reason"].lower() or "personalize" in data["reason"].lower()

    def test_today_plan_uses_weakest_skill_mastery(self, client, db, test_user_data):
        client.post("/api/auth/signup", json=test_user_data)
        login = client.post("/api/auth/login/json", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        token = login.json()["access_token"]
        user = db.query(User).filter(User.email == test_user_data["email"]).first()

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
