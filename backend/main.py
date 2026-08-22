"""
LocalPulse backend entrypoint.
Run with: uvicorn main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import reports, dashboard, ideas
from topics.database import init_topics_db
from topics.router import router as topics_router

app = FastAPI(title="LocalPulse API")

# Allow the frontend (served separately) to call this API during the hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(topics_router, prefix="/api/topics", tags=["topics"])
app.include_router(ideas.router, prefix="/api/ideas", tags=["ideas"])


@app.on_event("startup")
def on_startup():
    init_db()
    init_topics_db()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
