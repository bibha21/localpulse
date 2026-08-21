from fastapi import APIRouter, Form, UploadFile

from database import get_connection
from ai_service import classify_report

router = APIRouter()


@router.post("/")
async def submit_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    text_note: str | None = Form(None),
    photo: UploadFile | None = None,
):
    photo_bytes = await photo.read() if photo is not None else None
    classification = classify_report(photo_bytes=photo_bytes, text_note=text_note)

    conn = get_connection()
    cur = conn.execute(
        """
        INSERT INTO reports (category, description, latitude, longitude, confidence, needs_review)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            classification["category"],
            text_note,
            latitude,
            longitude,
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
