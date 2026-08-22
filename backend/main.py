"""
LocalPulse backend entrypoint.
Run with: uvicorn main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import reports, dashboard, ideas, exchange
from topics.database import init_topics_db
from topics.router import router as topics_router

app = FastAPI(title="LocalPulse API - Espoo")

# Allow only the known local dev origins that serve the frontend - avoids
# leaving the API open to any origin (CORS wildcard would let any website
# read resident report data via a victim's browser).
FRONTEND_ORIGINS = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(topics_router, prefix="/api/topics", tags=["topics"])
app.include_router(ideas.router, prefix="/api/ideas", tags=["ideas"])
app.include_router(exchange.router, prefix="/api/exchange", tags=["exchange"])


@app.on_event("startup")
def on_startup():
    init_db()
    init_topics_db()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
