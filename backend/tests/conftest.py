import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient

import ai_service
import database
import main


@pytest.fixture(autouse=True)
def no_real_gemini_calls(monkeypatch):
    """
    Tests must never depend on a real Gemini call - it costs real (small,
    daily) quota and makes results nondeterministic. This forces every test
    onto the deterministic stub fallback in ai_service, regardless of whether
    GEMINI_API_KEY is set in the environment running the suite.
    """
    monkeypatch.setattr(ai_service, "_client", None)


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DB_PATH", tmp_path / "test.db")
    with TestClient(main.app) as test_client:
        yield test_client
