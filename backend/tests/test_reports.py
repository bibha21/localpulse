def test_submit_report_classifies_infrastructure(client):
    resp = client.post(
        "/api/reports/",
        data={"text_note": "broken street light", "latitude": 60.2, "longitude": 24.6},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["category"] == "infrastructure"
    assert body["needs_review"] is False
    assert "id" in body


def test_submit_report_defaults_to_other_and_flags_review(client):
    resp = client.post(
        "/api/reports/",
        data={"text_note": "trash everywhere", "latitude": 60.2, "longitude": 24.6},
    )
    body = resp.json()
    assert body["category"] == "other"
    assert body["needs_review"] is True


def test_submit_report_missing_coordinates_returns_422(client):
    resp = client.post("/api/reports/", data={"text_note": "no coords"})
    assert resp.status_code == 422


def test_submit_report_rejects_coordinates_outside_espoo_region(client):
    resp = client.post(
        "/api/reports/",
        data={"text_note": "not in Finland", "latitude": 40.7128, "longitude": -74.0060},
    )
    assert resp.status_code == 422


def test_submit_report_rejects_overlong_text_note(client):
    resp = client.post(
        "/api/reports/",
        data={"text_note": "x" * 1001, "latitude": 60.2, "longitude": 24.6},
    )
    assert resp.status_code == 422


def test_list_reports_returns_submitted_report(client):
    client.post(
        "/api/reports/",
        data={"text_note": "light broken", "latitude": 60.1, "longitude": 24.5},
    )
    resp = client.get("/api/reports/")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["category"] == "infrastructure"


def test_list_reports_empty_by_default(client):
    resp = client.get("/api/reports/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_submit_report_starts_in_submitted_status(client):
    resp = client.post(
        "/api/reports/",
        data={"text_note": "broken light", "latitude": 60.2, "longitude": 24.6},
    )
    assert resp.json()["status"] == "submitted"


def test_get_report_returns_status(client):
    report_id = client.post(
        "/api/reports/",
        data={"text_note": "broken light", "latitude": 60.2, "longitude": 24.6},
    ).json()["id"]

    resp = client.get(f"/api/reports/{report_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == report_id
    assert body["status"] == "submitted"


def test_get_report_not_found_returns_404(client):
    resp = client.get("/api/reports/9999")
    assert resp.status_code == 404


def test_advance_status_moves_through_pipeline(client):
    report_id = client.post(
        "/api/reports/",
        data={"text_note": "broken light", "latitude": 60.2, "longitude": 24.6},
    ).json()["id"]

    expected_sequence = ["received", "under_review", "assigned", "action_planned", "completed"]
    for expected_status in expected_sequence:
        resp = client.post(f"/api/reports/{report_id}/advance-status")
        assert resp.status_code == 200
        assert resp.json()["status"] == expected_status


def test_advance_status_rejects_once_completed(client):
    report_id = client.post(
        "/api/reports/",
        data={"text_note": "broken light", "latitude": 60.2, "longitude": 24.6},
    ).json()["id"]

    for _ in range(5):
        client.post(f"/api/reports/{report_id}/advance-status")

    resp = client.post(f"/api/reports/{report_id}/advance-status")
    assert resp.status_code == 400


def test_advance_status_not_found_returns_404(client):
    resp = client.post("/api/reports/9999/advance-status")
    assert resp.status_code == 404
