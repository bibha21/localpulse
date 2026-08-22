import sqlite3

import database


def test_init_db_creates_tables(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "DB_PATH", tmp_path / "unit.db")
    database.init_db()

    conn = sqlite3.connect(tmp_path / "unit.db")
    tables = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    conn.close()

    assert {"reports", "ideas"} <= tables
