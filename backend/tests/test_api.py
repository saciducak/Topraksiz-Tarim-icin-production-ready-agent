"""
Backend Tests - API Tests
"""
import pytest
from fastapi.testclient import TestClient
from backend.src.main import app

client = TestClient(app)


def test_root():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Topraksız Tarım AI Agent"
    assert "version" in data


def test_health():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data


def test_analyze_without_file():
    """Test analyze endpoint without file."""
    response = client.post("/api/v1/analyze")
    assert response.status_code == 422  # Validation error


def test_analyze_with_invalid_file():
    """Test analyze endpoint with non-image file."""
    response = client.post(
        "/api/v1/analyze",
        files={"file": ("test.txt", b"hello world", "text/plain")}
    )
    assert response.status_code == 400
