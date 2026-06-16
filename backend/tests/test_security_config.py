"""Security and production configuration tests."""

import socket

import pytest
import requests

from app.config import Settings, get_settings, is_postgres_url, parse_csv_setting
from app.models import User
from app.services.content_generator import generator
from app.services.url_safety import validate_public_http_url


@pytest.fixture(autouse=True)
def clear_settings_cache():
    yield
    get_settings.cache_clear()


def _signup_and_login(client, email: str, username: str, password: str = "TestPass123") -> str:
    client.post("/api/auth/signup", json={"email": email, "username": username, "password": password})
    response = client.post("/api/auth/login/json", json={"email": email, "password": password})
    return response.json()["access_token"]


def test_admin_denies_normal_user(client, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAILS", "")
    get_settings.cache_clear()
    token = _signup_and_login(client, "normal@example.com", "normaluser")

    response = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403


def test_admin_denies_high_level_user(client, db, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAILS", "")
    get_settings.cache_clear()
    token = _signup_and_login(client, "level50@example.com", "leveluser")
    user = db.query(User).filter(User.email == "level50@example.com").one()
    user.level = 99
    db.commit()

    response = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403


def test_admin_allows_configured_email(client, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com")
    get_settings.cache_clear()
    token = _signup_and_login(client, "admin@example.com", "adminuser")

    response = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200


def test_admin_email_matching_trims_whitespace_and_ignores_case(client, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAILS", " owner@example.com , Admin@Example.com ")
    get_settings.cache_clear()
    token = _signup_and_login(client, "admin@example.com", "caseadmin")

    response = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200


def test_csv_config_parsing_trims_empty_values():
    assert parse_csv_setting(" http://a.test, ,http://b.test ") == ["http://a.test", "http://b.test"]
    assert Settings(backend_cors_origins=" http://localhost:3000, https://example.com ").cors_origins == [
        "http://localhost:3000",
        "https://example.com",
    ]


def test_database_url_postgres_classification():
    assert is_postgres_url("postgresql+psycopg://postgres:postgres@localhost:5432/jana_test") is True
    assert is_postgres_url("postgresql://postgres:postgres@localhost:5432/jana_test") is True
    assert is_postgres_url("sqlite:///./jana.db") is False


def test_production_secret_validation():
    Settings(environment="development").validate_production_safety()

    with pytest.raises(RuntimeError, match="SECRET_KEY must be set"):
        Settings(
            environment="production",
            secret_key="unsafe-development-secret-key-change-me",
        ).validate_production_safety()

    Settings(environment="production", secret_key="a-strong-production-secret-value").validate_production_safety()


def test_auto_create_tables_disabled_in_production():
    assert Settings(environment="development").auto_create_tables is True
    assert Settings(
        environment="production",
        secret_key="a-strong-production-secret-value",
    ).auto_create_tables is False


@pytest.mark.parametrize("url", [
    "http://localhost/admin",
    "http://127.0.0.1/admin",
    "http://10.0.0.5/admin",
    "file:///etc/passwd",
    "",
])
def test_url_safety_blocks_internal_or_invalid_urls(url):
    with pytest.raises(ValueError):
        validate_public_http_url(url)


def test_url_safety_allows_public_https_url(monkeypatch):
    monkeypatch.setattr(socket, "getaddrinfo", lambda *args, **kwargs: [
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443)),
    ])

    assert validate_public_http_url("https://example.com/article") == "https://example.com/article"


def _mock_response(status_code: int = 200, location: str | None = None, body: bytes = b"ok") -> requests.Response:
    response = requests.Response()
    response.status_code = status_code
    response._content = body
    response.url = location or "https://example.com/article"
    if location:
        response.headers["Location"] = location
    return response


def _public_dns(monkeypatch):
    monkeypatch.setattr(socket, "getaddrinfo", lambda *args, **kwargs: [
        (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443)),
    ])


def test_safe_get_public_url_does_not_follow_redirects_automatically(monkeypatch):
    _public_dns(monkeypatch)
    calls = []

    def fake_get(url, **kwargs):
        calls.append((url, kwargs))
        return _mock_response()

    monkeypatch.setattr(requests, "get", fake_get)

    generator.safe_get_public_url("https://example.com/article")

    assert calls[0][1]["allow_redirects"] is False


def test_safe_get_public_url_blocks_redirect_to_localhost(monkeypatch):
    _public_dns(monkeypatch)
    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: _mock_response(
        status_code=302,
        location="http://127.0.0.1/admin",
    ))

    with pytest.raises(ValueError, match="private or internal"):
        generator.safe_get_public_url("https://example.com/article")


def test_safe_get_public_url_blocks_redirect_to_metadata_ip(monkeypatch):
    _public_dns(monkeypatch)
    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: _mock_response(
        status_code=302,
        location="http://169.254.169.254/latest/meta-data",
    ))

    with pytest.raises(ValueError, match="private or internal"):
        generator.safe_get_public_url("https://example.com/article")


def test_safe_get_public_url_allows_redirect_to_public_url(monkeypatch):
    _public_dns(monkeypatch)
    responses = [
        _mock_response(status_code=302, location="https://example.org/final"),
        _mock_response(status_code=200, body=b"<html>final</html>"),
    ]
    calls = []

    def fake_get(url, **kwargs):
        calls.append(url)
        return responses.pop(0)

    monkeypatch.setattr(requests, "get", fake_get)

    response = generator.safe_get_public_url("https://example.com/article")

    assert response.status_code == 200
    assert calls == ["https://example.com/article", "https://example.org/final"]


def test_safe_get_public_url_redirect_loop_returns_clear_error(monkeypatch):
    _public_dns(monkeypatch)
    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: _mock_response(
        status_code=302,
        location="/loop",
    ))

    with pytest.raises(ValueError, match="Too many redirects."):
        generator.safe_get_public_url("https://example.com/article", max_redirects=1)


def test_generator_endpoint_returns_400_for_blocked_url(client):
    token = _signup_and_login(client, "generator-owner@example.com", "generatorowner")

    response = client.post(
        "/api/generator/reading",
        headers={"Authorization": f"Bearer {token}"},
        json={"url": "http://127.0.0.1/admin", "difficulty": 5},
    )

    assert response.status_code == 400
    assert "private or internal" in response.json()["detail"]


def test_generator_endpoint_returns_400_for_redirect_to_localhost(client, monkeypatch):
    _public_dns(monkeypatch)
    token = _signup_and_login(client, "redirect-owner@example.com", "redirectowner")
    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: _mock_response(
        status_code=302,
        location="http://127.0.0.1/admin",
    ))

    response = client.post(
        "/api/generator/reading",
        headers={"Authorization": f"Bearer {token}"},
        json={"url": "https://example.com/article", "difficulty": 5},
    )

    assert response.status_code == 400
    assert "private or internal" in response.json()["detail"]
