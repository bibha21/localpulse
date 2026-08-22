from fastapi import APIRouter, HTTPException

from database import get_connection, get_cached_summary, set_cached_summary
from ai_service import generate_area_insight
from geocoding import reverse_geocode_label

router = APIRouter()

# Very simple fixed grid over Espoo for the hackathon demo.
# Replace with real geo-binning (e.g. geohash) if there's time.
GRID_SIZE_DEGREES = 0.01


def grid_key(lat: float, lon: float) -> str:
    return f"{round(lat / GRID_SIZE_DEGREES)}:{round(lon / GRID_SIZE_DEGREES)}"


def _area_cache_key(location: str, reports: list[dict]) -> str:
    ids = ",".join(str(r["id"]) for r in sorted(reports, key=lambda r: r["id"]))
    return f"area:{location}:{ids}"


def _reports_by_area() -> dict[str, list[dict]]:
    conn = get_connection()
    rows = [dict(r) for r in conn.execute("SELECT * FROM reports").fetchall()]
    conn.close()

    areas: dict[str, list[dict]] = {}
    for r in rows:
        key = grid_key(r["latitude"], r["longitude"])
        areas.setdefault(key, []).append(r)
    return areas


@router.get("/patterns")
def get_area_patterns():
    areas = _reports_by_area()

    result = []
    for key, reports in areas.items():
        categories: dict[str, int] = {}
        needs_review_count = 0
        for r in reports:
            categories[r["category"]] = categories.get(r["category"], 0) + 1
            if r["needs_review"]:
                needs_review_count += 1

        avg_lat = sum(r["latitude"] for r in reports) / len(reports)
        avg_lon = sum(r["longitude"] for r in reports) / len(reports)
        location = reverse_geocode_label(avg_lat, avg_lon)

        # No automatic Gemini call here - insights are only generated when a planner
        # clicks "Generate AI insight" (POST /patterns/{area}/insight), and persisted
        # to the database so this list endpoint stays free to load/reload.
        if len(reports) < 3:
            summary = "Low report volume - not enough signal yet."
            actionable_idea = None
        else:
            cached = get_cached_summary(_area_cache_key(location, reports))
            summary = cached["summary"] if cached else None
            actionable_idea = cached["actionable_idea"] if cached else None

        result.append({
            "area": key,
            "location": location,
            "report_count": len(reports),
            "categories": categories,
            "needs_review_count": needs_review_count,
            "summary": summary,
            "actionable_idea": actionable_idea,
            "reports": [
                {
                    "id": r["id"],
                    "category": r["category"],
                    "description": r["description"],
                    "confidence": r["confidence"],
                    "needs_review": bool(r["needs_review"]),
                    "created_at": r["created_at"],
                }
                for r in reports
            ],
        })
    return result


@router.post("/patterns/{area_key}/insight")
def generate_insight(area_key: str):
    areas = _reports_by_area()
    reports = areas.get(area_key)
    if not reports:
        raise HTTPException(status_code=404, detail="Area not found")
    if len(reports) < 3:
        raise HTTPException(status_code=400, detail="Not enough reports yet for an insight")

    avg_lat = sum(r["latitude"] for r in reports) / len(reports)
    avg_lon = sum(r["longitude"] for r in reports) / len(reports)
    location = reverse_geocode_label(avg_lat, avg_lon)
    cache_key = _area_cache_key(location, reports)

    cached = get_cached_summary(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    result = generate_area_insight(location, reports)
    if result["source"] == "ai":
        set_cached_summary(cache_key, result["summary"], result["actionable_idea"])
    return result
