"""FastAPI app for the Autharis matching microservice (Lane F7)."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .models import (
    RankRequest,
    RankResponse,
    ScoreRequest,
    ScoreResponse,
)
from .ranking import rank as rank_candidates
from .scoring import score as score_pair
from .taxonomy import taxonomy_payload

app = FastAPI(
    title="Autharis Matching",
    version=__version__,
    description="Lane F7 — Python scoring and ranking microservice.",
)

# Autharis surfaces that may call this service during local dev.
_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:4321",
    "http://localhost:4000",
    "http://localhost:4010",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "autharis-matching", "version": __version__}


@app.get("/taxonomy")
def taxonomy() -> dict:
    return taxonomy_payload()


@app.post("/score", response_model=ScoreResponse)
def post_score(payload: ScoreRequest) -> ScoreResponse:
    return score_pair(payload.job, payload.talent)


@app.post("/rank", response_model=RankResponse)
def post_rank(payload: RankRequest) -> RankResponse:
    return rank_candidates(payload.job, payload.candidates, top_n=payload.top_n)
