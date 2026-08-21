# LocalPulse (Naapuri) — AI Community & Neighbourhood Engagement Assistant

*Naapuri is Finnish for "neighbour" — the name reflects our focus on Espoo's own neighbourhoods and residents.*

## Selected challenge
AI Community & Neighbourhood Engagement Assistant

## Team
- [Name 1]
- [Name 2]
- [Name 3]

## Problem
Residents' concerns and ideas about their neighbourhood often go unheard or get lost in slow, disconnected municipal channels. Meanwhile, city planners typically rely on infrequent surveys to understand where socio-spatial disparities and segregation risk are emerging — by the time a problem is visible in the data, it may already be a crisis. There is no fast, low-friction way for residents to report issues and pitch ideas, and no real-time way for planners to see where engagement is breaking down.

## Target user
- **Residents**, who want an easy way to report concerns and see that something happens as a result.
- **City planners** (e.g. City of Espoo), who need early, reliable signals about which neighbourhoods need attention — not just where complaints are loudest, but where engagement itself is silently low.

## What we built
A working prototype with two core flows:

1. **Report a concern** — a resident submits a photo and/or short voice/text note. AI classifies the issue type, geotags it, and checks for duplicate nearby reports.
2. **Planner dashboard** — aggregated, anonymized reports are plotted on a map. The AI engine analyses report density and category patterns per area and generates a short, human-readable summary flagging areas that may benefit from attention — combining volume of concerns with (low) community engagement as an early signal, not a stigmatizing label.

## How AI is used
- **Classification**: an LLM with vision capability classifies uploaded photos into issue categories (infrastructure, safety, cleanliness, accessibility) and extracts structured detail from voice/text reports.
- **Duplicate detection**: the LLM compares new reports against nearby existing ones to avoid redundant entries.
- **Pattern reasoning**: rather than a fixed rule-based threshold, an LLM reviews aggregated, anonymized report data per area and produces a plain-language summary of what's happening in that neighbourhood and why it may warrant attention — this is the meaningful AI contribution, not a bolted-on chatbot.

## Responsible AI considerations
- **Bias & fairness**: areas are framed as "may benefit from attention/investment," not labeled "at risk" or "segregated" — avoids stigmatizing language on a public-facing dashboard.
- **Privacy**: reports shown on the planner dashboard are aggregated and anonymized; no individual resident identity is exposed.
- **AI reliability**: classification confidence is shown; low-confidence classifications are flagged for human review rather than auto-routed.
- **Accessibility**: voice input is supported alongside photo/text to reduce literacy and language barriers.
- **Transparency**: the planner-facing summary explicitly states it is AI-generated and based on report volume/category patterns, not a definitive assessment.

## Tech stack
- Frontend: HTML + vanilla JS, Leaflet.js + OpenStreetMap
- Backend: FastAPI (Python)
- AI: Claude (Anthropic API) — vision + text
- Data: SQLite

## Running the prototype
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp ../.env.example ../.env   # then fill in your API key
uvicorn main:app --reload
# Backend runs at http://localhost:8000

# Frontend (in a separate terminal)
cd frontend
python -m http.server 5500
# Open http://localhost:5500/index.html (resident view)
# and http://localhost:5500/dashboard.html (planner view)
```

## Value & impact
- Residents get a fast, low-friction reporting channel with visible follow-through.
- Planners get a continuously updated, early-warning view of neighbourhood engagement instead of relying on infrequent surveys.
- Earlier detection of disengagement enables earlier, better-targeted urban renewal investment.

## What we'd build next
- "Pitch an idea" flow with AI-assisted proposal drafting.
- "Discover & join" personalized matching to local community initiatives.
- Real integration with Espoo's open data (socio-economic indicators, green space, building age) to strengthen the pattern-detection signal.
- Multi-language support (Finnish, Swedish, English) throughout.
