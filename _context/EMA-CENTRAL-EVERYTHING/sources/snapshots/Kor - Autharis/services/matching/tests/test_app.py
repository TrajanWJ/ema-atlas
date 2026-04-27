"""FastAPI smoke tests."""
from __future__ import annotations

from fastapi.testclient import TestClient

from autharis_matching.app import app

client = TestClient(app)


def test_healthz():
    r = client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["service"] == "autharis-matching"


def test_taxonomy():
    r = client.get("/taxonomy")
    assert r.status_code == 200
    body = r.json()
    assert "skills" in body and "categories" in body and "synonyms" in body
    assert "Care Coordination" in body["skills"]


def test_score_happy_path():
    payload = {
        "job": {
            "id": "jr-001",
            "title": "Patient intake coordinator",
            "category": "care",
            "hoursPerWeek": 20,
            "timezone": "GMT",
            "budget": [40, 55],
            "skills": ["Care Coordination", "Intake"],
        },
        "talent": {
            "id": "t-001",
            "name": "Amara",
            "timezone": "GMT",
            "rate": 42,
            "availability": "20 hrs / week",
            "skills": ["Care Coordination", "Intake", "Notion"],
            "yearsExp": 8,
        },
    }
    r = client.post("/score", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["talent_id"] == "t-001"
    assert body["job_id"] == "jr-001"
    assert 0 <= body["total"] <= 100
    assert "skill_overlap" in body["breakdown"]


def test_score_missing_fields_422():
    # Missing required `id` on both job and talent.
    r = client.post("/score", json={"job": {"title": "x"}, "talent": {"name": "y"}})
    assert r.status_code == 422


def test_rank_happy_path():
    payload = {
        "job": {
            "id": "jr-001",
            "title": "Patient intake",
            "category": "care",
            "hoursPerWeek": 20,
            "timezone": "GMT",
            "budget": [40, 55],
            "skills": ["Care Coordination", "Intake"],
        },
        "candidates": [
            {"id": "t-001", "name": "Amara", "timezone": "GMT", "rate": 42,
             "availability": "20 hrs / week",
             "skills": ["Care Coordination", "Intake"], "yearsExp": 8},
            {"id": "t-006", "name": "Miguel", "timezone": "ART", "rate": 36,
             "availability": "20 hrs / week",
             "skills": ["Outreach", "SDR Support"], "yearsExp": 4},
        ],
        "top_n": 2,
    }
    r = client.post("/rank", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["job_id"] == "jr-001"
    assert len(body["matches"]) == 2
    assert body["matches"][0]["talent_id"] == "t-001"
