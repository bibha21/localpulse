"""
Adds a handful of high-urgency ("critical") resident reports on top of
whatever's already in the reports table (unlike seed_reports.py, which only
seeds into an empty table) - safety hazards that should visibly stand out
with needs_review flagged, fresh timestamps, and still-open statuses, so the
Report page / planner dashboard have something to demo the urgent-review
path with, not just routine maintenance requests.

Run with: python seed_critical_reports.py
Safe to re-run - each report is only inserted if a report with that exact
description doesn't already exist.
"""
from datetime import datetime, timedelta

from database import get_connection, init_db
from espoo_districts import DISTRICTS

CRITICAL_REPORTS = [
    {
        "district": "Tapiola",
        "offset": (0.0006, -0.0004),
        "category": "safety",
        "description": "Strong gas smell near the Tapiola metro entrance, seems to be getting stronger.",
        "confidence": 0.4,
        "needs_review": True,
        "status": "submitted",
        "hours_ago": 2,
    },
    {
        "district": "Leppävaara",
        "offset": (-0.0006, 0.0009),
        "category": "safety",
        "description": "Downed power line across the footpath on Kauniaistentie after last night's storm.",
        "confidence": 0.5,
        "needs_review": True,
        "status": "received",
        "hours_ago": 5,
    },
    {
        "district": "Matinkylä",
        "offset": (0.0007, -0.0005),
        "category": "infrastructure",
        "description": "Large section of sidewalk has collapsed near the school crossing on Koulupolku.",
        "confidence": 0.6,
        "needs_review": True,
        "status": "submitted",
        "hours_ago": 3,
    },
    {
        "district": "Espoon keskus",
        "offset": (-0.0005, -0.0009),
        "category": "safety",
        "description": "Guardrail is broken and hanging loose on the bridge over Gräsanoja - risk of falling.",
        "confidence": 0.55,
        "needs_review": True,
        "status": "received",
        "hours_ago": 20,
    },
    {
        "district": "Espoonlahti",
        "offset": (-0.0007, 0.0006),
        "category": "safety",
        "description": "Playground swing set chain snapped - sharp broken edge exposed at child height.",
        "confidence": 0.65,
        "needs_review": True,
        "status": "action_planned",
        "hours_ago": 40,
    },
    {
        "district": "Kauklahti",
        "offset": (0.0008, 0.0005),
        "category": "infrastructure",
        "description": "Manhole cover is missing on Kauklahdenväylä, leaving a deep hole exposed in the road.",
        "confidence": 0.7,
        "needs_review": True,
        "status": "submitted",
        "hours_ago": 1,
    },
]


def seed():
    init_db()
    conn = get_connection()
    now = datetime.now()
    added = 0

    for report in CRITICAL_REPORTS:
        existing = conn.execute(
            "SELECT id FROM reports WHERE description = ?", (report["description"],)
        ).fetchone()
        if existing:
            continue

        base_lat, base_lon = DISTRICTS[report["district"]]
        lat_offset, lon_offset = report["offset"]
        created_at = (now - timedelta(hours=report["hours_ago"])).strftime("%Y-%m-%d %H:%M:%S")
        conn.execute(
            """
            INSERT INTO reports (
                category, description, latitude, longitude, confidence,
                needs_review, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                report["category"],
                report["description"],
                base_lat + lat_offset,
                base_lon + lon_offset,
                report["confidence"],
                int(report["needs_review"]),
                report["status"],
                created_at,
            ),
        )
        added += 1

    conn.commit()
    conn.close()
    if added:
        print(f"Seeded {added} critical report(s).")
    else:
        print("All critical reports already present - nothing to add.")


if __name__ == "__main__":
    seed()
