from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database import REPORT_STATUSES, get_connection
from ai_service import classify_report

router = APIRouter()

# Rough bounding box around the Espoo / Helsinki capital region - rejects
# obviously bogus coordinates (e.g. 0,0) without being so tight that it
# breaks a demo just outside the city line.
ESPOO_LAT_RANGE = (59.5, 61.0)
ESPOO_LON_RANGE = (23.5, 26.0)


class ReportIn(BaseModel):
    text_note: str | None = Field(default=None, max_length=1000)
    latitude: float = Field(ge=ESPOO_LAT_RANGE[0], le=ESPOO_LAT_RANGE[1])
    longitude: float = Field(ge=ESPOO_LON_RANGE[0], le=ESPOO_LON_RANGE[1])
    # photo upload handled separately in a real build (multipart/form-data);
    # kept out of this stub to keep the skeleton simple to run immediately


@router.post("/")
def submit_report(report: ReportIn):
    classification = classify_report(photo_bytes=None, text_note=report.text_note)

    conn = get_connection()
    cur = conn.execute(
        """
        INSERT INTO reports (category, description, latitude, longitude, confidence, needs_review)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            classification["category"],
            report.text_note,
            report.latitude,
            report.longitude,
            classification["confidence"],
            int(classification["needs_review"]),
        ),
    )
    conn.commit()
    report_id = cur.lastrowid
    conn.close()

    return {"id": report_id, "status": REPORT_STATUSES[0], **classification}


@router.get("/")
def list_reports():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM reports ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@router.get("/{report_id}")
def get_report(report_id: int):
    """
    Lets a resident check on the status of a report they submitted, using the
    id they were given at submission time (there's no login system in this
    prototype, so the frontend keeps that id in the browser's local storage).
    """
    conn = get_connection()
    row = conn.execute(
        "SELECT id, category, status, needs_review, created_at FROM reports WHERE id = ?",
        (report_id,),
    ).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return dict(row)


@router.post("/{report_id}/advance-status")
def advance_status(report_id: int):
    """
    Moves a report to the next stage of the review pipeline.

    TODO (hackathon): in a real deployment this would be triggered by city
    staff from an internal case management tool, not called by the public
    frontend. Exposed here so the "what happened to my report?" flow can be
    demoed end-to-end without a staff backend.
    """
    conn = get_connection()
    row = conn.execute("SELECT status FROM reports WHERE id = ?", (report_id,)).fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")

    current_index = REPORT_STATUSES.index(row["status"])
    if current_index == len(REPORT_STATUSES) - 1:
        conn.close()
        raise HTTPException(status_code=400, detail="Report is already completed")

    next_status = REPORT_STATUSES[current_index + 1]
    conn.execute("UPDATE reports SET status = ? WHERE id = ?", (next_status, report_id))
    conn.commit()
    conn.close()
    return {"id": report_id, "status": next_status}
