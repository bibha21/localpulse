"""
SQLite setup for city-announced topics and resident feedback comments.

This is a separate feature area (community initiatives / city consultations)
from concern reporting, so it's kept in its own module - but shares the same
database file via the existing get_connection().
"""
from database import get_connection


def init_topics_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            area TEXT,
            latitude REAL,
            longitude REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS topic_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER NOT NULL,
            comment_text TEXT NOT NULL,
            sentiment TEXT,
            sentiment_confidence REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (topic_id) REFERENCES topics (id)
        )
    """)
    conn.commit()

    _seed_demo_topic(conn)
    conn.close()


def _seed_demo_topic(conn):
    """Seeds the Espoo tram-track announcement used for the hackathon demo, once."""
    existing = conn.execute(
        "SELECT id FROM topics WHERE title = ?", ("New tram track - Suurpelto",)
    ).fetchone()
    if existing:
        return

    conn.execute(
        """
        INSERT INTO topics (title, description, area, latitude, longitude)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            "New tram track - Suurpelto",
            "The City of Espoo has announced plans to build a new tram track through "
            "Suurpelto. Share your feedback, concerns, or support for this project.",
            "Suurpelto",
            60.1858,
            24.7460,
        ),
    )
    conn.commit()
