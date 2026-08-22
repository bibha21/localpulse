from fastapi import APIRouter
from pydantic import BaseModel, Field

from database import get_connection

router = APIRouter()

# The Pulse's Community Exchange section only ever shows these four fixed
# categories - anything else submitted gets bucketed into "other" rather
# than rejected, since this is just a lightweight resident-to-resident
# board, not a moderated marketplace.
CATEGORIES = {"garden_share", "skill_swap", "tool_library", "neighborly_help"}


class ExchangePostIn(BaseModel):
    category: str
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=500)
    contact: str | None = Field(default=None, max_length=200)


@router.post("/")
def submit_exchange_post(post: ExchangePostIn):
    category = post.category if post.category in CATEGORIES else "other"
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO exchange_posts (category, title, description, contact) VALUES (?, ?, ?, ?)",
        (category, post.title, post.description, post.contact),
    )
    conn.commit()
    post_id = cur.lastrowid
    conn.close()
    return {"id": post_id, "category": category}


@router.get("/")
def list_exchange_posts(category: str | None = None):
    conn = get_connection()
    if category:
        rows = conn.execute(
            "SELECT * FROM exchange_posts WHERE category = ? ORDER BY created_at DESC",
            (category,),
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM exchange_posts ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@router.get("/counts")
def get_exchange_counts():
    conn = get_connection()
    rows = conn.execute("SELECT category, COUNT(*) AS count FROM exchange_posts GROUP BY category").fetchall()
    conn.close()
    return {row["category"]: row["count"] for row in rows}
