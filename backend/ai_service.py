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


def predict_impact(idea_text: str) -> dict:
    """
    Estimate the likely social/environmental impact of a pitched community idea.
    Returns: {"social_connectivity_pct": int, "environmental_impact": str}

    TODO (hackathon): replace this stub with a real LLM call. Keep the
    response contract the same so the Idea Incubator UI doesn't change.
    """
    text = (idea_text or "").lower()
    environmental_keywords = ["garden", "tree", "solar", "compost", "green", "plant", "recycl"]
    social_keywords = ["market", "event", "gather", "art", "meet", "festival", "class"]
    env_hits = sum(k in text for k in environmental_keywords)
    social_hits = sum(k in text for k in social_keywords)
    return {
        "social_connectivity_pct": min(10 + social_hits * 15, 90),
        "environmental_impact": "High Impact" if env_hits >= 1 else "Moderate Impact",
    }


def estimate_resources(idea_text: str) -> dict:
    """
    Give a rough budget/volunteer estimate for a pitched idea so the pitch
    form has something to render before any real planning happens.
    Returns: {"budget_min": int, "budget_max": int, "volunteers_min": int, "volunteers_max": int}

    TODO (hackathon): replace this heuristic with a real LLM call.
    """
    scale = 1 + len(idea_text or "") // 200
    return {
        "budget_min": 300 * scale,
        "budget_max": 800 * scale,
        "volunteers_min": 3 * scale,
        "volunteers_max": 6 * scale,
    }


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
