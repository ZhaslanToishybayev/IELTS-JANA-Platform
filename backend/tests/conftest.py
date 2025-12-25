"""Pytest configuration and fixtures for API tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db


# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency with test database."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database override."""
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    
    with TestClient(app) as c:
        yield c
    
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Standard test user data."""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "TestPass123"
    }


@pytest.fixture
def weak_password_data():
    """User data with weak password for testing validation."""
    return {
        "email": "weak@example.com",
        "username": "weakuser",
        "password": "weak"
    }


@pytest.fixture
def authenticated_client(client, test_user_data):
    """Create client with authenticated user."""
    # Register user
    client.post("/api/auth/signup", json=test_user_data)
    
    # Login and get token
    response = client.post("/api/auth/login/json", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    })
    token = response.json()["access_token"]
    
    # Add authorization header
    client.headers["Authorization"] = f"Bearer {token}"
    return client
