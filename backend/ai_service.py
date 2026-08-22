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
# Gemini's free tier occasionally returns transient 503s under high demand. The SDK's
# default retry policy (5 attempts, up to 60s backoff each) can take minutes to give up -
# too slow for a live demo. Fail over to the stub classifier quickly instead.
_http_options = types.HttpOptions(
    timeout=10_000,  # ms per request
    retry_options=types.HttpRetryOptions(attempts=2, initial_delay=1, max_delay=3),
)
_client = genai.Client(api_key=_api_key, http_options=_http_options) if _api_key else None

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
        response = _client.models.generate_content(model="gemini-flash-latest", contents=parts)
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


_PATTERN_PROMPT = """You are helping a city planner spot patterns in resident reports for one
neighbourhood area, and turn them into a concrete next step - not just a description.

Area: {location}
Report count: {count}
Category breakdown: {categories}

Resident-submitted descriptions in this area:
{descriptions}

Produce a JSON object (no markdown fences) with this shape:
{{"summary": "<one plain-language sentence describing the pattern>", "actionable_idea": "<one concrete, specific, low-cost intervention a planner could act on>"}}

Rules:
- Frame the area as "may benefit from attention/investment" - never "at risk" or "segregated"
  (avoid stigmatizing language on a public-facing dashboard).
- The actionable_idea must be grounded in what residents actually described (e.g. a specific
  fix, a community event type, a signage/lighting/maintenance change) - not generic advice
  like "increase community engagement".
- Descriptions may be in Finnish, Swedish, or English - understand them in their original
  language, but respond in English.
"""


def generate_area_insight(area_location: str, reports_in_area: list[dict]) -> dict:
    """
    Given aggregated reports for one area, produce a short, non-stigmatizing summary
    plus a concrete actionable idea a planner could act on.
    Returns: {"summary": str, "actionable_idea": str | None, "source": "ai" | "fallback"}

    This is only called on demand (a planner clicking "Generate AI insight"), not on
    every dashboard load - the caller (routers/dashboard.py) is responsible for
    persisting successful ("ai") results via database.set_cached_summary, so the same
    report set never re-spends quota once generated.
    """
    if len(reports_in_area) < 3:
        return {"summary": "Low report volume - not enough signal yet.", "actionable_idea": None, "source": "fallback"}

    if not _client:
        return {**_stub_summarize(reports_in_area), "source": "fallback"}

    categories: dict[str, int] = {}
    for r in reports_in_area:
        categories[r["category"]] = categories.get(r["category"], 0) + 1

    descriptions = [r["description"] for r in reports_in_area if r.get("description")]
    descriptions_block = "\n".join(f"- {d}" for d in descriptions[:15]) or "(no descriptions)"

    prompt = _PATTERN_PROMPT.format(
        location=area_location,
        count=len(reports_in_area),
        categories=categories,
        descriptions=descriptions_block,
    )

    try:
        response = _client.models.generate_content(model="gemini-flash-latest", contents=[prompt])
        raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(raw)
        stub = _stub_summarize(reports_in_area)
        return {
            "summary": result.get("summary", stub["summary"]),
            "actionable_idea": result.get("actionable_idea"),
            "source": "ai",
        }
    except Exception as exc:
        print(f"Gemini pattern summary failed, falling back to stub: {exc}")
        return {**_stub_summarize(reports_in_area), "source": "fallback"}


def _stub_summarize(reports_in_area: list[dict]) -> dict:
    """Fallback used when GEMINI_API_KEY is missing or the API call fails."""
    categories: dict[str, int] = {}
    for r in reports_in_area:
        categories[r["category"]] = categories.get(r["category"], 0) + 1
    top = max(categories, key=categories.get)
    return {
        "summary": f"{len(reports_in_area)} reports in this area, mostly about {top}. May benefit from attention.",
        "actionable_idea": None,
    }
