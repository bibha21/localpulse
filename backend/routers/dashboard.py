from fastapi import APIRouter

from database import get_connection
from ai_service import summarize_area_pattern
from geocoding import reverse_geocode_label

router = APIRouter()

# Very simple fixed grid over Espoo for the hackathon demo.
# Replace with real geo-binning (e.g. geohash) if there's time.
GRID_SIZE_DEGREES = 0.01


def grid_key(lat: float, lon: float) -> str:
    return f"{round(lat / GRID_SIZE_DEGREES)}:{round(lon / GRID_SIZE_DEGREES)}"


@router.get("/patterns")
def get_area_patterns():
    conn = get_connection()
    rows = [dict(r) for r in conn.execute("SELECT * FROM reports").fetchall()]
    conn.close()

    areas: dict[str, list[dict]] = {}
    for r in rows:
        key = grid_key(r["latitude"], r["longitude"])
        areas.setdefault(key, []).append(r)

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

        result.append({
            "area": key,
            "location": reverse_geocode_label(avg_lat, avg_lon),
            "report_count": len(reports),
            "categories": categories,
            "needs_review_count": needs_review_count,
            "summary": summarize_area_pattern(reports),
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
