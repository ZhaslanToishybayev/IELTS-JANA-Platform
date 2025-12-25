"""Tests for questions API endpoints."""

import pytest


class TestGetNextQuestion:
    """Test cases for adaptive question selection."""

    def test_get_next_question_authenticated(self, authenticated_client):
        """Test getting next question when authenticated."""
        response = authenticated_client.get("/api/questions/next")
        
        # Might be 200 (question found) or 404 (no questions in test DB)
        assert response.status_code in [200, 404]

    def test_get_next_question_unauthenticated(self, client):
        """Test getting next question without authentication."""
        response = client.get("/api/questions/next")
        
        assert response.status_code == 401

    def test_get_next_question_with_category(self, authenticated_client):
        """Test getting next question with category filter."""
        response = authenticated_client.get("/api/questions/next?category=TF_NG")
        
        # Might be 200 or 404 depending on seeded data
        assert response.status_code in [200, 404]


class TestSubmitAnswer:
    """Test cases for answer submission."""

    def test_submit_answer_unauthenticated(self, client):
        """Test submitting answer without authentication."""
        response = client.post("/api/questions/submit", json={
            "question_id": 1,
            "user_answer": "True",
            "response_time_ms": 5000
        })
        
        assert response.status_code == 401

    def test_submit_answer_invalid_question(self, authenticated_client):
        """Test submitting answer for non-existent question."""
        response = authenticated_client.post("/api/questions/submit", json={
            "question_id": 99999,
            "user_answer": "True",
            "response_time_ms": 5000
        })
        
        assert response.status_code == 404

    def test_submit_answer_missing_fields(self, authenticated_client):
        """Test submitting answer with missing required fields."""
        response = authenticated_client.post("/api/questions/submit", json={
            "question_id": 1
            # Missing user_answer and response_time_ms
        })
        
        assert response.status_code == 422  # Validation error


class TestGetCategories:
    """Test cases for categories endpoint."""

    def test_get_categories_authenticated(self, authenticated_client):
        """Test getting question categories."""
        response = authenticated_client.get("/api/questions/categories")
        
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)

    def test_get_categories_unauthenticated(self, client):
        """Test getting categories without authentication."""
        response = client.get("/api/questions/categories")
        
        assert response.status_code == 401
