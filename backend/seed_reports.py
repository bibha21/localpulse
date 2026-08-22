"""
Seeds the Report page / planner dashboard with a spread of example resident
reports across Espoo's districts, so the map, Neighbourhood Pulse, and
Idea/Report activity feeds all have something to show during local
testing/demos.

Run with: python seed_reports.py
Safe to re-run - it only inserts if the reports table is currently empty.
"""
from datetime import datetime, timedelta

from database import get_connection, init_db
from espoo_districts import DISTRICTS

# (lat_offset, lon_offset) kept small (<=0.002) so every report in a district
# lands in the same 0.01-degree grid cell as routers/dashboard.py uses for
# /patterns - otherwise a district's reports would get split across cells
# and never reach the 3-report threshold needed to demo "Generate AI insight".
EXAMPLE_REPORTS = [
    # Leppävaara
    {
        "district": "Leppävaara",
        "offset": (0.0, 0.0),
        "category": "infrastructure",
        "description": "Streetlight has been out for two weeks on Lintuvaarantie.",
        "confidence": 0.9,
        "needs_review": False,
        "status": "completed",
        "days_ago": 14,
    },
    {
        "district": "Leppävaara",
        "offset": (0.001, -0.001),
        "category": "safety",
        "description": "Crosswalk near the train station feels unsafe at night - poor lighting.",
        "confidence": 0.55,
        "needs_review": True,
        "status": "under_review",
        "days_ago": 6,
    },
    {
        "district": "Leppävaara",
        "offset": (-0.001, 0.001),
        "category": "cleanliness",
        "description": "Overflowing trash cans by the Sello shopping centre bus stop.",
        "confidence": 0.8,
        "needs_review": False,
        "status": "received",
        "days_ago": 3,
    },
    {
        "district": "Leppävaara",
        "offset": (0.0015, 0.0008),
        "category": "infrastructure",
        "description": "Pothole growing bigger on Karhusuontie, already scraped a bike tire.",
        "confidence": 0.85,
        "needs_review": False,
        "status": "assigned",
        "days_ago": 5,
    },
    # Tapiola
    {
        "district": "Tapiola",
        "offset": (0.0, 0.0),
        "category": "accessibility",
        "description": "Wheelchair ramp at the library entrance is too steep to use safely.",
        "confidence": 0.6,
        "needs_review": True,
        "status": "submitted",
        "days_ago": 1,
    },
    {
        "district": "Tapiola",
        "offset": (-0.0012, 0.0009),
        "category": "cleanliness",
        "description": "Litter piling up along the Tapiolan puisto walking path.",
        "confidence": 0.75,
        "needs_review": False,
        "status": "action_planned",
        "days_ago": 8,
    },
    {
        "district": "Tapiola",
        "offset": (0.0009, -0.0014),
        "category": "safety",
        "description": "Bike lane merges dangerously with car traffic near Ahertajantie.",
        "confidence": 0.5,
        "needs_review": False,
        "status": "received",
        "days_ago": 4,
    },
    # Matinkylä
    {
        "district": "Matinkylä",
        "offset": (0.0, 0.0),
        "category": "infrastructure",
        "description": "Broken elevator at the metro station - been out for days.",
        "confidence": 0.9,
        "needs_review": True,
        "status": "under_review",
        "days_ago": 2,
    },
    {
        "district": "Matinkylä",
        "offset": (0.0011, 0.0006),
        "category": "other",
        "description": "Would be great to have more benches along the shoreline path.",
        "confidence": 0.3,
        "needs_review": False,
        "status": "submitted",
        "days_ago": 1,
    },
    {
        "district": "Matinkylä",
        "offset": (-0.0009, -0.0011),
        "category": "cleanliness",
        "description": "Graffiti on the underpass wall near the swimming hall.",
        "confidence": 0.7,
        "needs_review": False,
        "status": "completed",
        "days_ago": 11,
    },
    # Espoon keskus
    {
        "district": "Espoon keskus",
        "offset": (0.0, 0.0),
        "category": "safety",
        "description": "Poor lighting around the church park makes evening walks feel unsafe.",
        "confidence": 0.55,
        "needs_review": True,
        "status": "received",
        "days_ago": 3,
    },
    {
        "district": "Espoon keskus",
        "offset": (0.0013, -0.0007),
        "category": "infrastructure",
        "description": "Traffic light stuck on red at the main intersection during rush hour.",
        "confidence": 0.9,
        "needs_review": False,
        "status": "action_planned",
        "days_ago": 7,
    },
    {
        "district": "Espoon keskus",
        "offset": (-0.0008, 0.0012),
        "category": "accessibility",
        "description": "No tactile paving at the pedestrian crossing near the station.",
        "confidence": 0.65,
        "needs_review": False,
        "status": "submitted",
        "days_ago": 2,
    },
    # Espoonlahti
    {
        "district": "Espoonlahti",
        "offset": (0.0, 0.0),
        "category": "cleanliness",
        "description": "Dog waste bags not being restocked at the beach entrance.",
        "confidence": 0.7,
        "needs_review": False,
        "status": "received",
        "days_ago": 5,
    },
    {
        "district": "Espoonlahti",
        "offset": (0.001, 0.001),
        "category": "safety",
        "description": "Icy steps by the harbour aren't salted often enough in winter.",
        "confidence": 0.6,
        "needs_review": True,
        "status": "under_review",
        "days_ago": 4,
    },
    # Kauklahti
    {
        "district": "Kauklahti",
        "offset": (0.0, 0.0),
        "category": "infrastructure",
        "description": "Broken fence around the playground near the train station.",
        "confidence": 0.85,
        "needs_review": False,
        "status": "submitted",
        "days_ago": 1,
    },
    {
        "district": "Kauklahti",
        "offset": (-0.001, -0.0008),
        "category": "other",
        "description": "Would love a community noticeboard near the Kauklahti market square.",
        "confidence": 0.3,
        "needs_review": False,
        "status": "submitted",
        "days_ago": 0,
    },
]


def seed():
    init_db()
    conn = get_connection()
    existing = conn.execute("SELECT COUNT(*) FROM reports").fetchone()[0]
    if existing > 0:
        print(f"reports table already has {existing} row(s) - skipping seed.")
        conn.close()
        return

    now = datetime.now()
    for report in EXAMPLE_REPORTS:
        base_lat, base_lon = DISTRICTS[report["district"]]
        lat_offset, lon_offset = report["offset"]
        created_at = (now - timedelta(days=report["days_ago"])).strftime("%Y-%m-%d %H:%M:%S")
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

    conn.commit()
    conn.close()
    print(f"Seeded {len(EXAMPLE_REPORTS)} example reports across {len(DISTRICTS)} districts.")


if __name__ == "__main__":
    seed()
