from fastapi import APIRouter

from database import get_connection
from ai_service import summarize_area_pattern

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

    return [
        {
            "area": key,
            "report_count": len(reports),
            "summary": summarize_area_pattern(reports),
        }
        for key, reports in areas.items()
    ]
