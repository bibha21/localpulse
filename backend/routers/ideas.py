from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_connection
from ai_service import predict_impact, estimate_resources

router = APIRouter()

SORT_COLUMNS = {
    "recent": "created_at DESC",
    "most_supported": "support_count DESC",
    "urgent": "needs_funding DESC, needs_volunteers DESC, created_at DESC",
}


class IdeaIn(BaseModel):
    title: str
    description: str
    needs_volunteers: bool = False
    needs_mentor: bool = False
    needs_funding: bool = False
    status: str = "published"  # "draft" or "published"


class IdeaPreviewIn(BaseModel):
    description: str


@router.post("/preview")
def preview_idea(payload: IdeaPreviewIn):
    """Live AI predictions shown on the pitch form as the resident types."""
    return {
        "impact_prediction": predict_impact(payload.description),
        "resource_estimation": estimate_resources(payload.description),
    }


@router.post("/")
def submit_idea(idea: IdeaIn):
    impact = predict_impact(idea.description)
    resources = estimate_resources(idea.description)

    conn = get_connection()
    cur = conn.execute(
        """
        INSERT INTO ideas (
            title, description, needs_volunteers, needs_mentor, needs_funding,
            est_budget_min, est_budget_max, volunteers_needed_min, volunteers_needed_max,
            social_connectivity_score, environmental_impact, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            idea.title,
            idea.description,
            int(idea.needs_volunteers),
            int(idea.needs_mentor),
            int(idea.needs_funding),
            resources["budget_min"],
            resources["budget_max"],
            resources["volunteers_min"],
            resources["volunteers_max"],
            f"+{impact['social_connectivity_pct']}%",
            impact["environmental_impact"],
            idea.status,
        ),
    )
    conn.commit()
    idea_id = cur.lastrowid
    conn.close()

    return {
        "id": idea_id,
        "impact_prediction": impact,
        "resource_estimation": resources,
    }


@router.get("/")
def list_ideas(sort: str = "recent"):
    order = SORT_COLUMNS.get(sort, SORT_COLUMNS["recent"])
    conn = get_connection()
    rows = conn.execute(
        f"SELECT * FROM ideas WHERE status = 'published' ORDER BY {order}"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@router.post("/{idea_id}/support")
def support_idea(idea_id: int):
    conn = get_connection()
    conn.execute("UPDATE ideas SET support_count = support_count + 1 WHERE id = ?", (idea_id,))
    conn.commit()
    row = conn.execute("SELECT support_count FROM ideas WHERE id = ?", (idea_id,)).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Idea not found")
    return {"id": idea_id, "support_count": row["support_count"]}


@router.post("/{idea_id}/volunteer")
def volunteer_for_idea(idea_id: int):
    conn = get_connection()
    conn.execute("UPDATE ideas SET volunteer_count = volunteer_count + 1 WHERE id = ?", (idea_id,))
    conn.commit()
    row = conn.execute("SELECT volunteer_count FROM ideas WHERE id = ?", (idea_id,)).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Idea not found")
    return {"id": idea_id, "volunteer_count": row["volunteer_count"]}
