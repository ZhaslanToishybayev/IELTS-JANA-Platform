"""Tests for dashboard API endpoints."""

import pytest


class TestDashboardProgress:
    """Test cases for dashboard progress endpoint."""

    def test_get_progress_authenticated(self, authenticated_client):
        """Test getting dashboard progress when authenticated."""
        response = authenticated_client.get("/api/dashboard/progress")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check expected fields exist
        assert "username" in data
        assert "level" in data
        assert "xp" in data
        assert "current_streak" in data

    def test_get_progress_unauthenticated(self, client):
        """Test getting dashboard progress without authentication."""
        response = client.get("/api/dashboard/progress")
        
        assert response.status_code == 401

    def test_progress_has_gamification_stats(self, authenticated_client):
        """Test dashboard includes gamification data."""
        response = authenticated_client.get("/api/dashboard/progress")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check gamification fields
        assert "xp_to_next_level" in data
        assert "estimated_band" in data


class TestHealthEndpoint:
    """Test cases for health check endpoint."""

    def test_health_check(self, client):
        """Test health check returns healthy status."""
        response = client.get("/health")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestRootEndpoint:
    """Test cases for root API endpoint."""

    def test_root_returns_api_info(self, client):
        """Test root endpoint returns API information."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "IELTS JANA" in data["name"]
