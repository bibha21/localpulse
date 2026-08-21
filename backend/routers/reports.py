from fastapi import APIRouter
from pydantic import BaseModel

from database import get_connection
from ai_service import classify_report

router = APIRouter()


class ReportIn(BaseModel):
    text_note: str | None = None
    latitude: float
    longitude: float
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

    return {"id": report_id, **classification}


@router.get("/")
def list_reports():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM reports ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]
