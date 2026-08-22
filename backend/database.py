"""
Minimal SQLite setup. No ORM to keep things fast to hack on -
swap for SQLAlchemy later if the team wants more structure.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "localpulse.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


REPORT_STATUSES = [
    "submitted",
    "received",
    "under_review",
    "assigned",
    "action_planned",
    "completed",
]


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            description TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            confidence REAL,
            needs_review INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'submitted',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Backfill for databases created before the status column existed.
    existing_columns = {row[1] for row in conn.execute("PRAGMA table_info(reports)")}
    if "status" not in existing_columns:
        conn.execute("ALTER TABLE reports ADD COLUMN status TEXT NOT NULL DEFAULT 'submitted'")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            needs_volunteers INTEGER DEFAULT 0,
            needs_mentor INTEGER DEFAULT 0,
            needs_funding INTEGER DEFAULT 0,
            est_budget_min REAL,
            est_budget_max REAL,
            volunteers_needed_min INTEGER,
            volunteers_needed_max INTEGER,
            social_connectivity_score TEXT,
            environmental_impact TEXT,
            support_count INTEGER DEFAULT 0,
            volunteer_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'published',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Shared cache for on-demand AI insights (area patterns, topic feedback, ...) so a
    # generated insight survives server restarts and isn't re-requested from Gemini for
    # the same underlying data - the free-tier quota is small and insights are only
    # generated when a planner explicitly clicks "Generate AI insight".
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ai_summary_cache (
            cache_key TEXT PRIMARY KEY,
            summary TEXT NOT NULL,
            actionable_idea TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS exchange_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            contact TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def get_cached_summary(cache_key: str) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT summary, actionable_idea FROM ai_summary_cache WHERE cache_key = ?",
        (cache_key,),
    ).fetchone()
    conn.close()
    if row is None:
        return None
    return {"summary": row["summary"], "actionable_idea": row["actionable_idea"]}


def set_cached_summary(cache_key: str, summary: str, actionable_idea: str | None) -> None:
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO ai_summary_cache (cache_key, summary, actionable_idea)
        VALUES (?, ?, ?)
        ON CONFLICT(cache_key) DO UPDATE SET
            summary = excluded.summary,
            actionable_idea = excluded.actionable_idea
        """,
        (cache_key, summary, actionable_idea),
    )
    conn.commit()
    conn.close()
