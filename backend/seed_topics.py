"""
Seeds the City Topics page with a couple more city-announced project topics
(init_topics_db already seeds one - the Suurpelto tram track - every startup)
plus example resident feedback comments, so the page has enough comments to
demo the "Generate AI insight" summary (needs >=3 comments per topic).

Run with: python seed_topics.py
Safe to re-run - it only adds a topic/comment set if that topic doesn't
already exist by title, and only adds comments to a topic that has none yet.
"""
from database import get_connection, init_db
from topics.database import init_topics_db

NEW_TOPICS = [
    {
        "title": "Extended cycling network - Leppävaara to Otaniemi",
        "description": "The City of Espoo is planning a protected cycling route connecting "
        "Leppävaara to Otaniemi, aiming to make the daily commute safer and car-free. "
        "Share your feedback, concerns, or support for this project.",
        "area": "Leppävaara",
        "latitude": 60.211,
        "longitude": 24.771,
    },
    {
        "title": "New multi-purpose sports hall - Matinkylä",
        "description": "A new sports hall is proposed for Matinkylä, offering space for "
        "badminton, futsal, and community events. Share your feedback, concerns, or "
        "support for this project.",
        "area": "Matinkylä",
        "latitude": 60.161,
        "longitude": 24.739,
    },
]

# comment_text, sentiment, confidence
COMMENTS_BY_TITLE = {
    "New tram track - Suurpelto": [
        ("This will finally make it easy to get downtown without a car - long overdue!", "positive", 0.85),
        ("Worried about construction noise for the next two years right outside our building.", "negative", 0.7),
        ("Will the tram stop be accessible for wheelchair users from day one?", "neutral", 0.5),
        ("Kannatan tätä hanketta, mutta rakennusaikaiset liikennejärjestelyt huolestuttavat.", "mixed", 0.55),
        ("Property values near the new stops should go up - good long-term investment for the area.", "positive", 0.6),
    ],
    "Extended cycling network - Leppävaara to Otaniemi": [
        ("Great news - I bike to Otaniemi daily and the current route feels unsafe in winter.", "positive", 0.8),
        ("Will this remove any car parking on Karhusuontie? That would be a problem for local shops.", "negative", 0.55),
        ("Bra initiativ, men jag hoppas att belysningen blir tillräcklig på vintern.", "mixed", 0.5),
        ("What's the expected completion date for the Leppävaara section?", "neutral", 0.4),
        ("Excited about this - fewer cars on the road is good for everyone nearby.", "positive", 0.75),
    ],
    "New multi-purpose sports hall - Matinkylä": [
        ("My kids play futsal and there's nowhere nearby to practice in winter - this is needed.", "positive", 0.8),
        ("Concerned about extra traffic and parking pressure on match nights.", "negative", 0.6),
        ("Huolestuttaa vähän melu, mutta harrastusmahdollisuudet ovat tärkeitä lapsille.", "mixed", 0.5),
        ("Will the hall be available for community events outside of sports hours?", "neutral", 0.45),
        ("This could be a great gathering spot for the whole neighbourhood.", "positive", 0.65),
    ],
}


def seed():
    init_db()
    init_topics_db()  # ensures the tram-track demo topic exists first
    conn = get_connection()

    for topic in NEW_TOPICS:
        existing = conn.execute("SELECT id FROM topics WHERE title = ?", (topic["title"],)).fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO topics (title, description, area, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
                (topic["title"], topic["description"], topic["area"], topic["latitude"], topic["longitude"]),
            )
    conn.commit()

    topics = conn.execute("SELECT id, title FROM topics").fetchall()
    added_comments = 0
    for topic in topics:
        comments = COMMENTS_BY_TITLE.get(topic["title"])
        if not comments:
            continue
        existing_count = conn.execute(
            "SELECT COUNT(*) FROM topic_comments WHERE topic_id = ?", (topic["id"],)
        ).fetchone()[0]
        if existing_count > 0:
            continue
        for comment_text, sentiment, confidence in comments:
            conn.execute(
                "INSERT INTO topic_comments (topic_id, comment_text, sentiment, sentiment_confidence) VALUES (?, ?, ?, ?)",
                (topic["id"], comment_text, sentiment, confidence),
            )
            added_comments += 1

    conn.commit()
    conn.close()
    print(f"Seeded {len(NEW_TOPICS)} new topic(s) and {added_comments} example comment(s).")


if __name__ == "__main__":
    seed()
