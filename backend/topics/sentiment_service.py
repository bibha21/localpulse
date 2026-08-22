"""
AI sentiment analysis for resident feedback on city-announced project topics
(e.g. a new tram track). Mirrors the pattern in ../ai_service.py: same model,
same free-tier-friendly timeout/retry config, same safe stub fallback.
"""
import json
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

_api_key = os.environ.get("GEMINI_API_KEY")
_http_options = types.HttpOptions(
    timeout=10_000,  # ms per request
    retry_options=types.HttpRetryOptions(attempts=2, initial_delay=1, max_delay=3),
)
_client = genai.Client(api_key=_api_key, http_options=_http_options) if _api_key else None

_SENTIMENT_PROMPT = """You are classifying a resident's feedback comment on a city-announced
project topic. The comment may be written in Finnish, Swedish, or English - understand it in
whichever language it's written in.

Topic: {topic_title}
Comment: {comment_text}

Respond with ONLY a JSON object (no markdown fences) matching this shape:
{{"sentiment": "<positive|negative|neutral|mixed>", "confidence": <float 0-1>}}

"positive" = supports the project, "negative" = opposes it or raises a serious concern,
"neutral" = a factual question or comment with no clear stance, "mixed" = raises both
support and concern.
"""


def classify_sentiment(topic_title: str, comment_text: str) -> dict:
    """
    Classify a resident's feedback comment as positive/negative/neutral/mixed.
    Returns: {"sentiment": str, "confidence": float}
    """
    if not _client:
        return _stub_sentiment(comment_text)

    prompt = _SENTIMENT_PROMPT.format(topic_title=topic_title, comment_text=comment_text)
    try:
        response = _client.models.generate_content(model="gemini-flash-latest", contents=[prompt])
        raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(raw)
        return {
            "sentiment": result.get("sentiment", "neutral"),
            "confidence": float(result.get("confidence", 0.4)),
        }
    except Exception as exc:
        print(f"Gemini sentiment classification failed, falling back to stub: {exc}")
        return _stub_sentiment(comment_text)


_NEGATIVE_WORDS = [
    "against", "bad", "noise", "worried", "concern", "traffic", "expensive", "oppose",
    "huono", "vastustan", "meluisa", "huolestunut", "kallis",
    "dålig", "emot", "bullrig", "orolig", "dyr",
]
_POSITIVE_WORDS = [
    "great", "good", "support", "love", "excited", "improve",
    "hyvä", "kannatan", "loistava", "parantaa",
    "bra", "stöder", "utmärkt", "förbättra",
]


def _stub_sentiment(comment_text: str | None) -> dict:
    """Fallback keyword heuristic used when GEMINI_API_KEY is missing or the API call fails."""
    text = (comment_text or "").lower()
    neg_hits = sum(1 for w in _NEGATIVE_WORDS if w in text)
    pos_hits = sum(1 for w in _POSITIVE_WORDS if w in text)
    if pos_hits > neg_hits:
        return {"sentiment": "positive", "confidence": 0.4}
    if neg_hits > pos_hits:
        return {"sentiment": "negative", "confidence": 0.4}
    return {"sentiment": "neutral", "confidence": 0.3}


_TOPIC_SUMMARY_PROMPT = """You are helping a city planner understand resident feedback on a
proposed project, and turn it into a concrete next step - not just a description.

Topic: {topic_title}
Total comments: {count}
Sentiment breakdown: {breakdown}

Resident comments:
{comments_block}

Produce a JSON object (no markdown fences) with this shape:
{{"summary": "<one plain-language sentence describing the overall feedback pattern>", "actionable_idea": "<one concrete next step the city could take in response>"}}

Rules:
- Be balanced - reflect both support and concern if both are present, don't overstate consensus.
- The actionable_idea should be a concrete next step (e.g. a specific mitigation, a public
  info session on a named concern, a design adjustment) grounded in what residents actually
  said, not generic advice like "increase community engagement".
- Comments may be in Finnish, Swedish, or English - understand them in their original
  language, but respond in English.
"""

def generate_topic_insight(topic_title: str, comments: list[dict]) -> dict:
    """
    Given all feedback comments on one topic, produce a balanced summary plus a concrete
    next step for the city. Returns: {"summary": str, "actionable_idea": str | None, "source": "ai" | "fallback"}

    Only called on demand (a planner clicking "Generate AI insight") - the caller
    (topics/router.py) persists successful ("ai") results via database.set_cached_summary,
    so the same comment set never re-spends quota once generated.
    """
    if len(comments) < 3:
        return {"summary": "Not enough feedback yet to summarize.", "actionable_idea": None, "source": "fallback"}

    breakdown: dict[str, int] = {}
    for c in comments:
        breakdown[c["sentiment"]] = breakdown.get(c["sentiment"], 0) + 1

    if not _client:
        return {**_stub_topic_summary(breakdown, len(comments)), "source": "fallback"}

    comments_block = "\n".join(f"- ({c['sentiment']}) {c['comment_text']}" for c in comments[:20])
    prompt = _TOPIC_SUMMARY_PROMPT.format(
        topic_title=topic_title,
        count=len(comments),
        breakdown=breakdown,
        comments_block=comments_block,
    )

    try:
        response = _client.models.generate_content(model="gemini-flash-latest", contents=[prompt])
        raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(raw)
        stub = _stub_topic_summary(breakdown, len(comments))
        return {
            "summary": result.get("summary", stub["summary"]),
            "actionable_idea": result.get("actionable_idea"),
            "source": "ai",
        }
    except Exception as exc:
        print(f"Gemini topic summary failed, falling back to stub: {exc}")
        return {**_stub_topic_summary(breakdown, len(comments)), "source": "fallback"}


def _stub_topic_summary(breakdown: dict, count: int) -> dict:
    """Fallback used when GEMINI_API_KEY is missing or the API call fails."""
    top = max(breakdown, key=breakdown.get)
    return {
        "summary": f"{count} comments received, mostly {top}.",
        "actionable_idea": None,
    }
