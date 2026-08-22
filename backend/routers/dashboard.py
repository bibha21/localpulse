from fastapi import APIRouter, HTTPException

from database import get_connection, get_cached_summary, set_cached_summary
from ai_service import generate_area_insight, summarize_area_pattern
from geocoding import reverse_geocode_label
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


def _area_cache_key(location: str, reports: list[dict]) -> str:
    ids = ",".join(str(r["id"]) for r in sorted(reports, key=lambda r: r["id"]))
    return f"area:{location}:{ids}"


def activity_level(report_count: int) -> str:
    if report_count < PULSE_LOW_THRESHOLD:
        return "Low"
    if report_count < PULSE_HIGH_THRESHOLD:
        return "Moderate"
    return "High"


def _parse_connectivity_pct(value) -> int:
    try:
        return int(str(value).strip().strip("%").lstrip("+"))
    except (TypeError, ValueError):
        return 0


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

    # Only ever return grid-cell aggregates to the planner dashboard - never
    # individual report coordinates or free-text descriptions. The centroid
    # is rounded to the grid cell, not the raw resident-submitted point, so
    # no single report can be pinpointed from the response.
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
            "center": {"lat": round(avg_lat, 3), "lon": round(avg_lon, 3)},
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
                    "status": r["status"],
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


@router.get("/overview")
def get_resident_overview():
    """
    Three-metric, city-wide snapshot for the resident-facing "Pulse" home
    dashboard - lighter weight than /pulse (which is per-district) or
    /patterns (which is per-grid-cell). Only aggregate counts leave this
    endpoint, same privacy rule as the rest of this router.
    """
    conn = get_connection()
    reports = [dict(r) for r in conn.execute("SELECT * FROM reports").fetchall()]
    ideas = [dict(r) for r in conn.execute("SELECT * FROM ideas WHERE status = 'published'").fetchall()]
    conn.close()

    safety_reports = [r for r in reports if r["category"] == "safety"]
    safety_needing_review = sum(1 for r in safety_reports if r["needs_review"])
    if not safety_reports:
        safety = {"status": "No reports yet", "detail": "No safety reports filed yet."}
    elif safety_needing_review / len(safety_reports) >= 0.5:
        safety = {
            "status": "Needs Attention",
            "detail": f"{safety_needing_review} of {len(safety_reports)} safety reports flagged for review.",
        }
    else:
        safety = {
            "status": "Improving",
            "detail": f"{len(safety_reports)} safety report(s) filed, mostly resolved.",
        }

    green_ideas = [i for i in ideas if i["environmental_impact"] == "High Impact"]
    greenspace = {
        "status": "High Interest" if green_ideas else "Getting Started",
        "detail": f"{len(green_ideas)} active green pitch(es)." if green_ideas
        else "No green-space ideas pitched yet.",
    }

    if ideas:
        avg_connectivity = sum(_parse_connectivity_pct(i["social_connectivity_score"]) for i in ideas) / len(ideas)
        connectivity = {
            "status": "Trending Up" if avg_connectivity >= 30 else "Building Momentum",
            "detail": f"+{round(avg_connectivity)}% average social connectivity across {len(ideas)} idea(s).",
        }
    else:
        connectivity = {"status": "No Activity Yet", "detail": "Pitch an idea to get started."}

    return {"safety": safety, "greenspace": greenspace, "connectivity": connectivity}
