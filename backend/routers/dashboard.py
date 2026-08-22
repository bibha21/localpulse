from fastapi import APIRouter

from database import get_connection
from ai_service import summarize_area_pattern
from espoo_districts import nearest_district

router = APIRouter()

# Very simple fixed grid over Espoo for the hackathon demo.
# Replace with real geo-binning (e.g. geohash) if there's time.
GRID_SIZE_DEGREES = 0.01

PULSE_LOW_THRESHOLD = 3
PULSE_HIGH_THRESHOLD = 10

CATEGORY_LABELS = {
    "infrastructure": "Infrastructure",
    "safety": "Safety",
    "cleanliness": "Cleanliness",
    "accessibility": "Accessibility",
    "other": "Other",
}


def grid_key(lat: float, lon: float) -> str:
    return f"{round(lat / GRID_SIZE_DEGREES)}:{round(lon / GRID_SIZE_DEGREES)}"


def activity_level(report_count: int) -> str:
    if report_count < PULSE_LOW_THRESHOLD:
        return "Low"
    if report_count < PULSE_HIGH_THRESHOLD:
        return "Moderate"
    return "High"


@router.get("/patterns")
def get_area_patterns():
    conn = get_connection()
    rows = [dict(r) for r in conn.execute("SELECT * FROM reports").fetchall()]
    conn.close()

    areas: dict[str, list[dict]] = {}
    for r in rows:
        key = grid_key(r["latitude"], r["longitude"])
        areas.setdefault(key, []).append(r)

    # Only ever return grid-cell aggregates to the planner dashboard - never
    # individual report coordinates or free-text descriptions. The centroid
    # is rounded to the grid cell, not the raw resident-submitted point, so
    # no single report can be pinpointed from the response.
    return [
        {
            "area": key,
            "report_count": len(reports),
            "summary": summarize_area_pattern(reports),
            "center": {
                "lat": round(sum(r["latitude"] for r in reports) / len(reports), 3),
                "lon": round(sum(r["longitude"] for r in reports) / len(reports), 3),
            },
            "needs_review_count": sum(1 for r in reports if r["needs_review"]),
        }
        for key, reports in areas.items()
    ]


@router.get("/pulse")
def get_neighbourhood_pulse():
    """
    Higher-level view than /patterns: buckets reports into named Espoo
    districts (not raw grid cells) so planners get a fast overview before
    drilling into the finer-grained /patterns data. Same privacy rule
    applies - only counts and category breakdowns leave this endpoint,
    never an individual report's coordinates or text.
    """
    conn = get_connection()
    rows = [dict(r) for r in conn.execute("SELECT * FROM reports").fetchall()]
    conn.close()

    districts: dict[str, list[dict]] = {}
    for r in rows:
        name = nearest_district(r["latitude"], r["longitude"])
        districts.setdefault(name, []).append(r)

    pulses = []
    for name, reports in districts.items():
        category_counts: dict[str, int] = {}
        for r in reports:
            category_counts[r["category"]] = category_counts.get(r["category"], 0) + 1
        ranked_categories = sorted(category_counts.items(), key=lambda kv: kv[1], reverse=True)

        pulses.append(
            {
                "district": name,
                "report_count": len(reports),
                "activity_level": activity_level(len(reports)),
                "needs_review_count": sum(1 for r in reports if r["needs_review"]),
                "top_priorities": [CATEGORY_LABELS.get(cat, cat.title()) for cat, _ in ranked_categories[:3]],
                "summary": summarize_area_pattern(reports),
            }
        )

    pulses.sort(key=lambda p: p["report_count"], reverse=True)
    return pulses
