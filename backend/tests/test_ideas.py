def test_submit_idea_returns_predictions(client):
    resp = client.post(
        "/api/ideas/",
        json={"title": "Community Garden", "description": "Plant a garden with trees and compost"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "id" in body
    assert body["impact_prediction"]["environmental_impact"] == "High Impact"
    assert "resource_estimation" in body


def test_preview_idea(client):
    resp = client.post("/api/ideas/preview", json={"description": "A street market and art festival"})
    assert resp.status_code == 200
    body = resp.json()
    assert "impact_prediction" in body
    assert "resource_estimation" in body


def test_list_ideas_only_returns_published(client):
    client.post("/api/ideas/", json={"title": "Draft idea", "description": "test", "status": "draft"})
    client.post("/api/ideas/", json={"title": "Published idea", "description": "test"})
    resp = client.get("/api/ideas/")
    titles = [i["title"] for i in resp.json()]
    assert "Published idea" in titles
    assert "Draft idea" not in titles


def test_support_idea_increments_count(client):
    created = client.post("/api/ideas/", json={"title": "Idea", "description": "test"}).json()
    resp = client.post(f"/api/ideas/{created['id']}/support")
    assert resp.status_code == 200
    assert resp.json()["support_count"] == 1


def test_support_idea_not_found_returns_404(client):
    resp = client.post("/api/ideas/9999/support")
    assert resp.status_code == 404


def test_volunteer_for_idea_increments_count(client):
    created = client.post("/api/ideas/", json={"title": "Idea", "description": "test"}).json()
    resp = client.post(f"/api/ideas/{created['id']}/volunteer")
    assert resp.status_code == 200
    assert resp.json()["volunteer_count"] == 1


def test_volunteer_for_idea_not_found_returns_404(client):
    resp = client.post("/api/ideas/9999/volunteer")
    assert resp.status_code == 404


def test_list_ideas_sort_most_supported(client):
    a = client.post("/api/ideas/", json={"title": "A", "description": "test"}).json()["id"]
    b = client.post("/api/ideas/", json={"title": "B", "description": "test"}).json()["id"]
    client.post(f"/api/ideas/{b}/support")
    resp = client.get("/api/ideas/?sort=most_supported")
    titles = [i["title"] for i in resp.json()]
    assert titles[0] == "B"
