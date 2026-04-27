"""Rank N candidates against a single job request."""
from __future__ import annotations

from .models import JobRequest, RankedMatch, RankResponse, Talent
from .scoring import score


def rank(job: JobRequest, candidates: list[Talent], top_n: int = 5) -> RankResponse:
    """Score every candidate, return the top `top_n` by total descending.

    Ties broken by talent.id (stable, alphabetical) so the output is
    deterministic.
    """
    scored = [score(job, t) for t in candidates]
    scored.sort(key=lambda s: (-s.total, s.talent_id))
    top = scored[: max(1, top_n)]
    matches = [
        RankedMatch(
            rank=i + 1,
            talent_id=s.talent_id,
            name=next((c.name for c in candidates if c.id == s.talent_id), ""),
            total=s.total,
            breakdown=s.breakdown,
        )
        for i, s in enumerate(top)
    ]
    return RankResponse(job_id=job.id, top_n=top_n, matches=matches)
