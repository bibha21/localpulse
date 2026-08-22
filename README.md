# LocalPulse (Naapuri) — AI Community & Neighbourhood Engagement Assistant

*Naapuri is Finnish for "neighbour" — the name reflects our focus on Espoo's own neighbourhoods and residents.*

## Selected challenge
AI Community & Neighbourhood Engagement Assistant

## Problem
Residents' concerns and ideas about their neighbourhood often go unheard or get lost in slow, disconnected municipal channels. Meanwhile, city planners typically rely on infrequent surveys to understand where socio-spatial disparities and segregation risk are emerging — by the time a problem is visible in the data, it may already be a crisis. There is no fast, low-friction way for residents to report issues and pitch ideas, and no real-time way for planners to see where engagement is breaking down.

## Target user
- **Residents**, who want an easy way to report concerns and see that something happens as a result.
- **City planners** (e.g. City of Espoo), who need early, reliable signals about which neighbourhoods need attention — not just where complaints are loudest, but where engagement itself is silently low.

## What we built
A working prototype with two core flows:

1. **Report a concern** — a resident submits a photo and/or short voice/text note, in Finnish, Swedish, or English. AI classifies the issue type and geotags it.
2. **Planner dashboard** — reports are plotted on a map and grouped by area (with the area's actual street name, via reverse geocoding). Each area shows a category breakdown, a count of low-confidence classifications flagged for human review, the individual reports (expandable per area), and an AI-generated summary flagging areas that may benefit from attention — combining volume of concerns with category patterns as an early signal, not a stigmatizing label.

## How AI is used
- **Classification**: Gemini's vision-capable model classifies uploaded photos, together with the resident's note, into issue categories (infrastructure, safety, cleanliness, accessibility, other) — understanding the note in whichever of the three supported languages it's written in.
- **Pattern reasoning**: rather than a fixed rule-based threshold, an LLM reviews aggregated report data per area and produces a plain-language summary of what's happening in that neighbourhood and why it may warrant attention — this is the meaningful AI contribution, not a bolted-on chatbot.

## Responsible AI considerations
- **Bias & fairness**: areas are framed as "may benefit from attention/investment," not labeled "at risk" or "segregated" — avoids stigmatizing language on a public-facing dashboard.
- **Privacy**: no submitter identity is ever collected or shown — reports are geotagged, not tied to a person. The dashboard groups reports by area and shows category-level aggregates; individual report text can be expanded per area, but nothing links it back to who filed it.
- **AI reliability**: classification confidence is shown; low-confidence classifications are flagged for human review rather than auto-routed.
- **Accessibility**: voice input and full Finnish/Swedish/English support are available alongside photo/text, to reduce literacy and language barriers.
- **Transparency**: the planner-facing summary explicitly states it is AI-generated and based on report volume/category patterns, not a definitive assessment.

## Tech stack
- Frontend: HTML + vanilla JS, Leaflet.js + OpenStreetMap
- Backend: FastAPI (Python)
- AI: Gemini (Google AI API) — vision + text
- Geocoding: OpenStreetMap Nominatim (area → street name)
- Data: SQLite

## Running the prototype
```bash
# Backend
cd backend
python3 -m venv venv && source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp ../.env.example ../.env   # then fill in your API key
uvicorn main:app --reload
# Backend runs at http://localhost:8000

# Frontend (in a separate terminal)
cd frontend
python3 -m http.server 5500
# Open http://localhost:5500/index.html (resident view)
# and http://localhost:5500/dashboard.html (planner view)
```

## Value & impact
- Residents get a fast, low-friction reporting channel with visible follow-through.
- Planners get a continuously updated, early-warning view of neighbourhood engagement instead of relying on infrequent surveys.
- Earlier detection of disengagement enables earlier, better-targeted urban renewal investment.

## What we'd build next
- "Pitch an idea" flow with AI-assisted proposal drafting — the challenge asks residents to pitch improvement ideas, not just report concerns; this isn't built yet.
- "Discover & join" personalized matching to local community initiatives — also part of the challenge brief and not yet built.
- Duplicate-report detection, so repeat reports of the same issue are merged rather than counted separately.
- Real integration with Espoo's open data (socio-economic indicators, green space, building age) to strengthen the pattern-detection signal.
