from fastapi import APIRouter, Form, HTTPException

from database import get_connection, get_cached_summary, set_cached_summary
from topics.sentiment_service import classify_sentiment, generate_topic_insight

router = APIRouter()


def _topic_cache_key(topic_title: str, comments: list[dict]) -> str:
    ids = ",".join(str(c["id"]) for c in sorted(comments, key=lambda c: c["id"]))
    return f"topic:{topic_title}:{ids}"


def _topic_comments(conn, topic_id: int) -> list[dict]:
    return [
        dict(r)
        for r in conn.execute(
            "SELECT * FROM topic_comments WHERE topic_id = ? ORDER BY created_at DESC",
            (topic_id,),
        ).fetchall()
    ]


@router.get("/")
def list_topics():
    conn = get_connection()
    topics = [dict(r) for r in conn.execute("SELECT * FROM topics ORDER BY created_at DESC").fetchall()]

    result = []
    for topic in topics:
        comments = _topic_comments(conn, topic["id"])

        breakdown: dict[str, int] = {}
        for c in comments:
            breakdown[c["sentiment"]] = breakdown.get(c["sentiment"], 0) + 1

        # No automatic Gemini call here - insights are only generated when a planner
        # clicks "Generate AI insight" (POST /{topic_id}/insight), and persisted to the
        # database so this list endpoint stays free to load/reload.
        if len(comments) < 3:
            summary = "Not enough feedback yet to summarize."
            actionable_idea = None
        else:
            cached = get_cached_summary(_topic_cache_key(topic["title"], comments))
            summary = cached["summary"] if cached else None
            actionable_idea = cached["actionable_idea"] if cached else None

        result.append({
            "id": topic["id"],
            "title": topic["title"],
            "description": topic["description"],
            "area": topic["area"],
            "latitude": topic["latitude"],
            "longitude": topic["longitude"],
            "comment_count": len(comments),
            "sentiment_breakdown": breakdown,
            "summary": summary,
            "actionable_idea": actionable_idea,
            "comments": [
                {
                    "id": c["id"],
                    "comment_text": c["comment_text"],
                    "sentiment": c["sentiment"],
                    "sentiment_confidence": c["sentiment_confidence"],
                    "created_at": c["created_at"],
                }
                for c in comments
            ],
        })
    conn.close()
    return result


@router.post("/{topic_id}/insight")
def generate_insight(topic_id: int):
    conn = get_connection()
    topic = conn.execute("SELECT * FROM topics WHERE id = ?", (topic_id,)).fetchone()
    if topic is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Topic not found")

    comments = _topic_comments(conn, topic_id)
    conn.close()

    if len(comments) < 3:
        raise HTTPException(status_code=400, detail="Not enough feedback yet for an insight")

    cache_key = _topic_cache_key(topic["title"], comments)
    cached = get_cached_summary(cache_key)
    if cached:
        return {**cached, "source": "cache"}

    result = generate_topic_insight(topic["title"], comments)
    if result["source"] == "ai":
        set_cached_summary(cache_key, result["summary"], result["actionable_idea"])
    return result


@router.post("/{topic_id}/comments")
def submit_comment(topic_id: int, comment_text: str = Form(...)):
    conn = get_connection()
    topic = conn.execute("SELECT * FROM topics WHERE id = ?", (topic_id,)).fetchone()
    if topic is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Topic not found")

    classification = classify_sentiment(topic["title"], comment_text)

    cur = conn.execute(
        """
        INSERT INTO topic_comments (topic_id, comment_text, sentiment, sentiment_confidence)
        VALUES (?, ?, ?, ?)
        """,
        (topic_id, comment_text, classification["sentiment"], classification["confidence"]),
    )
    conn.commit()
    comment_id = cur.lastrowid
    conn.close()

    return {"id": comment_id, **classification}
