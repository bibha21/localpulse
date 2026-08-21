"""
AI service layer. Calls a vision-capable LLM for classification and
an LLM for pattern reasoning over aggregated report data.

Set ANTHROPIC_API_KEY (or OPENAI_API_KEY) in a local .env file - never commit it.
"""
import base64
import os

# import anthropic  # uncomment once the SDK is installed

CATEGORIES = ["infrastructure", "safety", "cleanliness", "accessibility", "other"]


def classify_report(photo_bytes: bytes | None, text_note: str | None) -> dict:
    """
    Classify a resident report into a category using a vision-capable LLM.
    Returns: {"category": str, "confidence": float, "needs_review": bool}

    TODO (hackathon): replace this stub with a real Claude/GPT vision call.
    Keep the response contract the same so the rest of the app doesn't change.
    """
    # --- stub logic for early development before the AI call is wired up ---
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
