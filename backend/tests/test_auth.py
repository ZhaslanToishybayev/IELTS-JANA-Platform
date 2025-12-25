"""Tests for authentication API endpoints."""

import pytest


class TestSignup:
    """Test cases for user registration."""

    def test_signup_success(self, client, test_user_data):
        """Test successful user registration."""
        response = client.post("/api/auth/signup", json=test_user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["username"] == test_user_data["username"]
        assert "id" in data
        assert "password" not in data  # Password should not be returned

    def test_signup_duplicate_email(self, client, test_user_data):
        """Test registration with already used email."""
        # First registration
        client.post("/api/auth/signup", json=test_user_data)
        
        # Duplicate registration
        response = client.post("/api/auth/signup", json=test_user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_signup_weak_password(self, client, weak_password_data):
        """Test registration with weak password."""
        response = client.post("/api/auth/signup", json=weak_password_data)
        
        assert response.status_code == 400
        # Should return password validation error
        assert "password" in response.json()["detail"].lower()

    def test_signup_invalid_email(self, client):
        """Test registration with invalid email format."""
        response = client.post("/api/auth/signup", json={
            "email": "not-an-email",
            "username": "testuser",
            "password": "TestPass123"
        })
        
        assert response.status_code == 422  # Validation error


class TestLogin:
    """Test cases for user login."""

    def test_login_success(self, client, test_user_data):
        """Test successful login."""
        # Register first
        client.post("/api/auth/signup", json=test_user_data)
        
        # Login
        response = client.post("/api/auth/login/json", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, test_user_data):
        """Test login with incorrect password."""
        # Register first
        client.post("/api/auth/signup", json=test_user_data)
        
        # Login with wrong password
        response = client.post("/api/auth/login/json", json={
            "email": test_user_data["email"],
            "password": "WrongPass123"
        })
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user."""
        response = client.post("/api/auth/login/json", json={
            "email": "nobody@example.com",
            "password": "SomePass123"
        })
        
        assert response.status_code == 401


class TestGetMe:
    """Test cases for current user endpoint."""

    def test_get_me_authenticated(self, authenticated_client, test_user_data):
        """Test getting current user when authenticated."""
        response = authenticated_client.get("/api/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["username"] == test_user_data["username"]

    def test_get_me_unauthenticated(self, client):
        """Test getting current user without authentication."""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        """Test getting current user with invalid token."""
        client.headers["Authorization"] = "Bearer invalid_token"
        response = client.get("/api/auth/me")
        
        assert response.status_code == 401
