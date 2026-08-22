"""
Seeds the Community Exchange board with a couple of example posts per
category so The Pulse dashboard has something to show during local
testing/demos.

Run with: python seed_exchange.py
Safe to re-run - it only inserts if the exchange_posts table is currently empty.
"""
from database import get_connection, init_db

EXAMPLE_POSTS = [
    {
        "category": "garden_share",
        "title": "Free tomato & basil seedlings",
        "description": "Balcony garden overflowing again this year - happy to give away extra tomato and basil seedlings while they last.",
        "contact": "Leave a note in the Elm Path mailbox #12",
    },
    {
        "category": "garden_share",
        "title": "Looking for compost bin advice",
        "description": "First time setting up a compost bin on a small balcony - would love tips from anyone who's done it in an apartment.",
        "contact": None,
    },
    {
        "category": "skill_swap",
        "title": "Offering: beginner guitar lessons",
        "description": "Been playing for 15 years and would love to teach a neighbour the basics in exchange for help with my Finnish.",
        "contact": "matti.k@example.com",
    },
    {
        "category": "skill_swap",
        "title": "Need help setting up a website for my hobby project",
        "description": "Looking for someone who knows basic web design to help set up a simple site - happy to trade baking lessons.",
        "contact": None,
    },
    {
        "category": "tool_library",
        "title": "Pressure washer available to borrow",
        "description": "Have a pressure washer that mostly sits in storage - happy to lend it out for a weekend at a time.",
        "contact": "Text 040-555-0102",
    },
    {
        "category": "tool_library",
        "title": "Does anyone have a ladder I could borrow?",
        "description": "Need a tall ladder to clean out the gutters this weekend - will return it in the same condition.",
        "contact": None,
    },
    {
        "category": "neighborly_help",
        "title": "Can help with grocery runs on Tuesdays",
        "description": "I drive past the Prisma every Tuesday afternoon and have room in the car if anyone needs groceries picked up.",
        "contact": None,
    },
    {
        "category": "neighborly_help",
        "title": "Looking for someone to walk my dog next week",
        "description": "Traveling for work Mon-Wed next week and need someone to walk Nunu (friendly labrador) twice a day.",
        "contact": "hanna.l@example.com",
    },
]


def seed():
    """
    Inserts example posts only into categories that don't have any posts yet,
    so this never buries or duplicates real posts residents have already
    submitted through the UI in a category that's already populated.
    """
    init_db()
    conn = get_connection()
    populated_categories = {
        row["category"] for row in conn.execute("SELECT DISTINCT category FROM exchange_posts")
    }

    to_insert = [post for post in EXAMPLE_POSTS if post["category"] not in populated_categories]
    if not to_insert:
        print("Every category already has at least one post - skipping seed.")
        conn.close()
        return

    for post in to_insert:
        conn.execute(
            "INSERT INTO exchange_posts (category, title, description, contact) VALUES (?, ?, ?, ?)",
            (post["category"], post["title"], post["description"], post["contact"]),
        )

    conn.commit()
    conn.close()
    print(f"Seeded {len(to_insert)} example exchange post(s) into previously-empty categories.")


if __name__ == "__main__":
    seed()
