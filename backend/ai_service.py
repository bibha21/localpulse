"""
AI service layer. Calls Gemini's vision-capable model for classification and
an LLM for pattern reasoning over aggregated report data.

Set GEMINI_API_KEY in a local .env file - never commit it.
"""
import json
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

_api_key = os.environ.get("GEMINI_API_KEY")
_client = genai.Client(api_key=_api_key) if _api_key else None

CATEGORIES = ["infrastructure", "safety", "cleanliness", "accessibility", "other"]

_CLASSIFY_PROMPT = f"""You are triaging a resident-submitted neighbourhood report for a local
civic issue tracker. Classify it into exactly one of these categories: {", ".join(CATEGORIES)}.

The resident's note may be written in Finnish, Swedish, or English - understand it in
whichever language it's written in. Regardless of the note's language, always output the
"category" value exactly as one of the English strings listed above, never translated.

Respond with ONLY a JSON object (no markdown fences) matching this shape:
{{"category": "<one of the categories above>", "confidence": <float 0-1>, "needs_review": <true/false>}}

Set needs_review to true if the photo and/or note is ambiguous, low quality, or you are not
reasonably confident in the category.
"""


def classify_report(photo_bytes: bytes | None, text_note: str | None) -> dict:
    """
    Classify a resident report into a category using Gemini's vision model.
    Returns: {"category": str, "confidence": float, "needs_review": bool}
    """
    if not _client:
        return _stub_classify(text_note)

    parts: list = [_CLASSIFY_PROMPT]
    if text_note:
        parts.append(f"Resident's note: {text_note}")
    if photo_bytes:
        parts.append(types.Part.from_bytes(data=photo_bytes, mime_type="image/jpeg"))

    try:
        response = _client.models.generate_content(model="gemini-3.6-flash", contents=parts)
        raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(raw)
        return {
            "category": result.get("category", "other"),
            "confidence": float(result.get("confidence", 0.4)),
            "needs_review": bool(result.get("needs_review", True)),
        }
    except Exception as exc:
        print(f"Gemini classification failed, falling back to stub: {exc}")
        return _stub_classify(text_note)


def _stub_classify(text_note: str | None) -> dict:
    """Fallback used when GEMINI_API_KEY is missing or the API call fails."""
    if text_note and "light" in text_note.lower():
        return {"category": "infrastructure", "confidence": 0.9, "needs_review": False}
    return {"category": "other", "confidence": 0.4, "needs_review": True}


def summarize_area_pattern(reports_in_area: list[dict]) -> str:
    """
    Given aggregated, anonymized reports for one map grid cell, ask an LLM
    to produce a short, plain-language, non-stigmatizing summary for the
    planner dashboard.

    TODO (hackathon): replace with a real LLM call. Keep the prompt framed
    around "may benefit from attention" - never "at risk" / "segregated".
    """
    if len(reports_in_area) < 3:
        return "Low report volume - not enough signal yet."
    categories = {}
    for r in reports_in_area:
        categories[r["category"]] = categories.get(r["category"], 0) + 1
    top = max(categories, key=categories.get)
    return f"{len(reports_in_area)} reports in this area, mostly about {top}. May benefit from attention."
