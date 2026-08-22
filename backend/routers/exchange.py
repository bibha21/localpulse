from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database import get_connection

router = APIRouter()

# The Pulse's Community Exchange section only ever shows these four fixed
# categories - anything else submitted gets bucketed into "other" rather
# than rejected, since this is just a lightweight resident-to-resident
# board, not a moderated marketplace.
CATEGORIES = {"garden_share", "skill_swap", "tool_library", "neighborly_help"}

# There's no login system in this prototype (see routers/reports.py), so
# "only the creator can mark their post complete" is enforced the same way
# the report-status flow already does it: the frontend remembers post ids it
# created in the browser's local storage and only shows the button for
# those. This endpoint stays open, same trust model as the rest of the API.
POINTS_PER_COMPLETED_DEED = 10

REWARD_TIERS = [
    {"threshold": 50, "name": "Bronze Neighbour Badge"},
    {"threshold": 150, "name": "Silver Neighbour Badge"},
    {"threshold": 300, "name": "Gold Neighbour Badge"},
]

CITY_YEARLY_REWARD_THRESHOLD = 300
CITY_YEARLY_REWARD = "City of Espoo Community Grant - funding for a shared neighbourhood improvement"


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


@router.post("/{post_id}/complete")
def complete_exchange_post(post_id: int):
    conn = get_connection()
    row = conn.execute("SELECT status FROM exchange_posts WHERE id = ?", (post_id,)).fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    if row["status"] == "completed":
        conn.close()
        raise HTTPException(status_code=400, detail="Post is already marked complete")

    conn.execute(
        "UPDATE exchange_posts SET status = 'completed', completed_at = ? WHERE id = ?",
        (datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"), post_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM exchange_posts WHERE id = ?", (post_id,)).fetchone()
    conn.close()
    return dict(row)


@router.get("/rewards")
def get_rewards_summary():
    """
    Neighbourhood-wide (not per-post-author) points tally: every completed
    exchange deed earns the whole neighbourhood points toward badge tiers,
    and the City of Espoo grants a real reward once the yearly threshold is
    reached. There's no per-resident location on exchange posts (unlike
    reports), so this is scoped city-wide rather than per-district.
    """
    current_year = str(datetime.now(timezone.utc).year)
    conn = get_connection()
    total_completed = conn.execute(
        "SELECT COUNT(*) FROM exchange_posts WHERE status = 'completed'"
    ).fetchone()[0]
    year_completed = conn.execute(
        "SELECT COUNT(*) FROM exchange_posts WHERE status = 'completed' AND strftime('%Y', completed_at) = ?",
        (current_year,),
    ).fetchone()[0]
    conn.close()

    total_points = total_completed * POINTS_PER_COMPLETED_DEED
    year_points = year_completed * POINTS_PER_COMPLETED_DEED

    tiers_reached = [t["name"] for t in REWARD_TIERS if total_points >= t["threshold"]]
    next_tier = next((t for t in REWARD_TIERS if total_points < t["threshold"]), None)

    return {
        "year": current_year,
        "points_per_deed": POINTS_PER_COMPLETED_DEED,
        "total_completed_deeds": total_completed,
        "total_points": total_points,
        "year_completed_deeds": year_completed,
        "year_points": year_points,
        "tiers_reached": tiers_reached,
        "next_tier": next_tier,
        "city_yearly_reward_threshold": CITY_YEARLY_REWARD_THRESHOLD,
        "city_yearly_reward": CITY_YEARLY_REWARD,
        "city_reward_unlocked": year_points >= CITY_YEARLY_REWARD_THRESHOLD,
    }
