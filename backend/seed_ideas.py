"""
Seeds the Idea Incubator with a handful of example community-improvement
pitches so the UI has something to show during local testing/demos.

Run with: python seed_ideas.py
Safe to re-run - it only inserts if the ideas table is currently empty.
"""
from database import get_connection, init_db
from ai_service import predict_impact, estimate_resources

EXAMPLE_IDEAS = [
    {
        "title": "Solar Powered Street Lights on Elm Path",
        "description": "Installing smart, solar-powered lighting along the main pedestrian path connecting Elm Street to the central park, improving safety for evening walkers and cyclists.",
        "needs_volunteers": True,
        "needs_mentor": False,
        "needs_funding": True,
        "support_count": 128,
        "volunteer_count": 12,
    },
    {
        "title": "Weekend Pop-up Art Market",
        "description": "Utilizing the empty plaza space on weekends to host local artists and makers. Aims to boost the local economy and bring neighbors together around a shared community event.",
        "needs_volunteers": True,
        "needs_mentor": False,
        "needs_funding": False,
        "support_count": 342,
        "volunteer_count": 45,
    },
    {
        "title": "Community Garden on 4th Street",
        "description": "Turn the empty lot on 4th street into a community garden with raised beds and a composting area, giving residents a shared green space to grow food and meet neighbors.",
        "needs_volunteers": True,
        "needs_mentor": True,
        "needs_funding": True,
        "support_count": 76,
        "volunteer_count": 18,
    },
    {
        "title": "Neighborhood Tool Library",
        "description": "A small shed where residents can borrow gardening and home-repair tools instead of buying them. Needs starter funding for equipment and a volunteer to manage checkouts.",
        "needs_volunteers": True,
        "needs_mentor": False,
        "needs_funding": True,
        "support_count": 34,
        "volunteer_count": 5,
    },
    {
        "title": "Free Little Library Boxes",
        "description": "Build and install a handful of free little library boxes around the neighbourhood so residents can share books with each other on their daily walks.",
        "needs_volunteers": True,
        "needs_mentor": False,
        "needs_funding": False,
        "support_count": 19,
        "volunteer_count": 7,
    },
]


def seed():
    init_db()
    conn = get_connection()
    existing = conn.execute("SELECT COUNT(*) FROM ideas").fetchone()[0]
    if existing > 0:
        print(f"ideas table already has {existing} row(s) - skipping seed.")
        conn.close()
        return

    for idea in EXAMPLE_IDEAS:
        impact = predict_impact(idea["description"])
        resources = estimate_resources(idea["description"])
        conn.execute(
            """
            INSERT INTO ideas (
                title, description, needs_volunteers, needs_mentor, needs_funding,
                est_budget_min, est_budget_max, volunteers_needed_min, volunteers_needed_max,
                social_connectivity_score, environmental_impact,
                support_count, volunteer_count, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
            """,
            (
                idea["title"],
                idea["description"],
                int(idea["needs_volunteers"]),
                int(idea["needs_mentor"]),
                int(idea["needs_funding"]),
                resources["budget_min"],
                resources["budget_max"],
                resources["volunteers_min"],
                resources["volunteers_max"],
                f"+{impact['social_connectivity_pct']}%",
                impact["environmental_impact"],
                idea["support_count"],
                idea["volunteer_count"],
            ),
        )

    conn.commit()
    conn.close()
    print(f"Seeded {len(EXAMPLE_IDEAS)} example ideas.")


if __name__ == "__main__":
    seed()
