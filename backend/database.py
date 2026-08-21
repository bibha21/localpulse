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
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
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
    conn.commit()
    conn.close()
