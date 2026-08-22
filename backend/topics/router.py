from fastapi import APIRouter, Form, HTTPException

from database import get_connection
from topics.sentiment_service import classify_sentiment, summarize_topic_feedback

router = APIRouter()


@router.get("/")
def list_topics():
    conn = get_connection()
    topics = [dict(r) for r in conn.execute("SELECT * FROM topics ORDER BY created_at DESC").fetchall()]

    result = []
    for topic in topics:
        comments = [
            dict(r)
            for r in conn.execute(
                "SELECT * FROM topic_comments WHERE topic_id = ? ORDER BY created_at DESC",
                (topic["id"],),
            ).fetchall()
        ]

        breakdown: dict[str, int] = {}
        for c in comments:
            breakdown[c["sentiment"]] = breakdown.get(c["sentiment"], 0) + 1

        pattern = summarize_topic_feedback(topic["title"], comments)

        result.append({
            "id": topic["id"],
            "title": topic["title"],
            "description": topic["description"],
            "area": topic["area"],
            "latitude": topic["latitude"],
            "longitude": topic["longitude"],
            "comment_count": len(comments),
            "sentiment_breakdown": breakdown,
            "summary": pattern["summary"],
            "actionable_idea": pattern["actionable_idea"],
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
