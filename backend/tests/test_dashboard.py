def test_area_patterns_groups_reports_by_grid_cell(client):
    client.post("/api/reports/", data={"text_note": "light 1", "latitude": 60.20, "longitude": 24.60})
    client.post("/api/reports/", data={"text_note": "light 2", "latitude": 60.201, "longitude": 24.601})
    client.post("/api/reports/", data={"text_note": "light 3", "latitude": 60.202, "longitude": 24.602})

    resp = client.get("/api/dashboard/patterns")
    assert resp.status_code == 200
    areas = resp.json()
    assert len(areas) == 1
    assert areas[0]["report_count"] == 3
    assert areas[0]["categories"]["infrastructure"] == 3


def test_area_patterns_separates_distant_reports(client):
    client.post("/api/reports/", data={"text_note": "light", "latitude": 60.20, "longitude": 24.60})
    client.post("/api/reports/", data={"text_note": "light", "latitude": 60.35, "longitude": 24.90})

    resp = client.get("/api/dashboard/patterns")
    assert len(resp.json()) == 2


def test_area_patterns_include_rounded_centroid_not_raw_coordinates(client):
    client.post("/api/reports/", data={"text_note": "light 1", "latitude": 60.20, "longitude": 24.60})
    client.post("/api/reports/", data={"text_note": "light 2", "latitude": 60.201, "longitude": 24.601})

    area = client.get("/api/dashboard/patterns").json()[0]
    assert area["center"]["lat"] == round((60.20 + 60.201) / 2, 3)
    assert area["center"]["lon"] == round((24.60 + 24.601) / 2, 3)


def test_area_patterns_empty_when_no_reports(client):
    resp = client.get("/api/dashboard/patterns")
    assert resp.status_code == 200
    assert resp.json() == []


def test_area_patterns_summary_is_none_until_insight_generated(client):
    # AI insights are only computed on demand (POST /patterns/{area}/insight),
    # never automatically on list load - conserves quota on every dashboard refresh.
    for i in range(3):
        client.post("/api/reports/", data={"text_note": f"light {i}", "latitude": 60.20, "longitude": 24.60})

    area = client.get("/api/dashboard/patterns").json()[0]
    assert area["summary"] is None
    assert area["actionable_idea"] is None


def test_generate_insight_returns_fallback_summary(client):
    for i in range(3):
        client.post("/api/reports/", data={"text_note": f"light {i}", "latitude": 60.20, "longitude": 24.60})
    area_key = client.get("/api/dashboard/patterns").json()[0]["area"]

    resp = client.post(f"/api/dashboard/patterns/{area_key}/insight")
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "fallback"
    assert "infrastructure" in body["summary"]


def test_generate_insight_not_enough_reports_returns_400(client):
    client.post("/api/reports/", data={"text_note": "light", "latitude": 60.20, "longitude": 24.60})
    area_key = client.get("/api/dashboard/patterns").json()[0]["area"]

    resp = client.post(f"/api/dashboard/patterns/{area_key}/insight")
    assert resp.status_code == 400


def test_generate_insight_area_not_found_returns_404(client):
    resp = client.post("/api/dashboard/patterns/999:999/insight")
    assert resp.status_code == 404


def test_pulse_groups_reports_by_named_district(client):
    # Coordinates close to the Leppävaara district centre.
    for _ in range(4):
        client.post("/api/reports/", data={"text_note": "light", "latitude": 60.219, "longitude": 24.813})

    resp = client.get("/api/dashboard/pulse")
    assert resp.status_code == 200
    pulses = resp.json()
    assert len(pulses) == 1
    assert pulses[0]["district"] == "Leppävaara"
    assert pulses[0]["report_count"] == 4
    assert pulses[0]["activity_level"] == "Moderate"
    assert "Infrastructure" in pulses[0]["top_priorities"]


def test_pulse_never_exposes_raw_coordinates_or_text(client):
    client.post("/api/reports/", data={"text_note": "secret detail", "latitude": 60.219, "longitude": 24.813})

    body = client.get("/api/dashboard/pulse").text
    assert "secret detail" not in body
    assert "60.219" not in body


def test_pulse_empty_when_no_reports(client):
    resp = client.get("/api/dashboard/pulse")
    assert resp.status_code == 200
    assert resp.json() == []
