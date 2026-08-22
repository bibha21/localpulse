def test_area_patterns_groups_reports_by_grid_cell(client):
    client.post("/api/reports/", json={"text_note": "light 1", "latitude": 60.20, "longitude": 24.60})
    client.post("/api/reports/", json={"text_note": "light 2", "latitude": 60.201, "longitude": 24.601})
    client.post("/api/reports/", json={"text_note": "light 3", "latitude": 60.202, "longitude": 24.602})

    resp = client.get("/api/dashboard/patterns")
    assert resp.status_code == 200
    areas = resp.json()
    assert len(areas) == 1
    assert areas[0]["report_count"] == 3
    assert "infrastructure" in areas[0]["summary"]


def test_area_patterns_separates_distant_reports(client):
    client.post("/api/reports/", json={"text_note": "light", "latitude": 60.20, "longitude": 24.60})
    client.post("/api/reports/", json={"text_note": "light", "latitude": 60.35, "longitude": 24.90})

    resp = client.get("/api/dashboard/patterns")
    assert len(resp.json()) == 2


def test_area_patterns_include_rounded_centroid_not_raw_coordinates(client):
    client.post("/api/reports/", json={"text_note": "light 1", "latitude": 60.20, "longitude": 24.60})
    client.post("/api/reports/", json={"text_note": "light 2", "latitude": 60.201, "longitude": 24.601})

    area = client.get("/api/dashboard/patterns").json()[0]
    assert area["center"]["lat"] == round((60.20 + 60.201) / 2, 3)
    assert area["center"]["lon"] == round((24.60 + 24.601) / 2, 3)


def test_area_patterns_empty_when_no_reports(client):
    resp = client.get("/api/dashboard/patterns")
    assert resp.status_code == 200
    assert resp.json() == []


def test_pulse_groups_reports_by_named_district(client):
    # Coordinates close to the Leppävaara district centre.
    for _ in range(4):
        client.post("/api/reports/", json={"text_note": "light", "latitude": 60.219, "longitude": 24.813})

    resp = client.get("/api/dashboard/pulse")
    assert resp.status_code == 200
    pulses = resp.json()
    assert len(pulses) == 1
    assert pulses[0]["district"] == "Leppävaara"
    assert pulses[0]["report_count"] == 4
    assert pulses[0]["activity_level"] == "Moderate"
    assert "Infrastructure" in pulses[0]["top_priorities"]


def test_pulse_never_exposes_raw_coordinates_or_text(client):
    client.post("/api/reports/", json={"text_note": "secret detail", "latitude": 60.219, "longitude": 24.813})

    body = client.get("/api/dashboard/pulse").text
    assert "secret detail" not in body
    assert "60.219" not in body


def test_pulse_empty_when_no_reports(client):
    resp = client.get("/api/dashboard/pulse")
    assert resp.status_code == 200
    assert resp.json() == []
