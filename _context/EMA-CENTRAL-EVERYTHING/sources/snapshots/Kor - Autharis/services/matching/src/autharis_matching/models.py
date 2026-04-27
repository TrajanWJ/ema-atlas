"""Pydantic v2 models mirroring `autharis/lib/data.ts` shapes.

These models are the wire contract for Lane F7. They intentionally overlap
with Lane E4's TypeScript `ScoreBreakdown`/`ScoreResponse` so both services
produce compatible payloads.
"""
from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class JobRequest(BaseModel):
    """Mirrors `JobRequest` in autharis/lib/data.ts."""
    model_config = ConfigDict(extra="ignore")

    id: str
    title: str
    category: str
    client: str = ""
    description: str = ""
    hoursPerWeek: int = 0
    duration: str = ""
    timezone: str = "Any"
    budget: tuple[float, float] = (0.0, 0.0)
    skills: list[str] = Field(default_factory=list)
    industry: str = ""
    status: str = ""
    posted: str = ""
    matches: int = 0


class Talent(BaseModel):
    """Mirrors `Talent` in autharis/lib/data.ts."""
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    initials: str = ""
    title: str = ""
    city: str = ""
    timezone: str = ""
    rate: float = 0.0
    availability: str = ""
    categories: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    status: str = "Active"
    bio: str = ""
    score: float = 0.0
    breakdown: dict[str, float] = Field(default_factory=dict)
    yearsExp: int = 0


class ScoreBreakdown(BaseModel):
    """Per-dimension match contribution, 0..<weight>."""
    skill_overlap: Annotated[float, Field(ge=0)]
    availability: Annotated[float, Field(ge=0)]
    rate_fit: Annotated[float, Field(ge=0)]
    timezone: Annotated[float, Field(ge=0)]
    rating: Annotated[float, Field(ge=0)]


class ScoreRequest(BaseModel):
    job: JobRequest
    talent: Talent


class ScoreResponse(BaseModel):
    talent_id: str
    job_id: str
    total: Annotated[float, Field(ge=0, le=100)]
    breakdown: ScoreBreakdown
    reasons: list[str] = Field(default_factory=list)


class RankRequest(BaseModel):
    job: JobRequest
    candidates: list[Talent]
    top_n: Annotated[int, Field(ge=1, le=100)] = 5


class RankedMatch(BaseModel):
    rank: int
    talent_id: str
    name: str
    total: float
    breakdown: ScoreBreakdown


class RankResponse(BaseModel):
    job_id: str
    top_n: int
    matches: list[RankedMatch]
