"""Scoring function: job × talent -> ScoreResponse.

Weighted blend across five dimensions, each 0..weight, summing to 100:

    skill_overlap  40   (TF-IDF cosine over normalized skills, boosted by
                         direct category-match)
    availability   20   (job.hoursPerWeek vs talent availability)
    rate_fit       15   (talent.rate vs job.budget)
    timezone       15   (string-match with tolerant parsing)
    rating         10   (talent.yearsExp proxy, capped)

Deterministic: given identical inputs the function always returns identical
outputs (no randomness, no external state).
"""
from __future__ import annotations

import re

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .models import JobRequest, ScoreBreakdown, ScoreResponse, Talent
from .taxonomy import normalize_skills

WEIGHTS = {
    "skill_overlap": 40.0,
    "availability": 20.0,
    "rate_fit": 15.0,
    "timezone": 15.0,
    "rating": 10.0,
}


# ---------- sub-scores ----------

def _skill_overlap(job_skills: list[str], talent_skills: list[str]) -> float:
    """Return 0..1 similarity between two skill bags using TF-IDF cosine.

    Falls back to Jaccard when TF-IDF cannot build a vocabulary (e.g. empty
    inputs). Skills are normalized via the taxonomy before comparison.
    """
    j = normalize_skills(job_skills)
    t = normalize_skills(talent_skills)
    if not j or not t:
        return 0.0
    doc_j = " ".join(s.replace(" ", "_") for s in j)
    doc_t = " ".join(s.replace(" ", "_") for s in t)
    try:
        vec = TfidfVectorizer(token_pattern=r"[^\s]+", lowercase=True)
        matrix = vec.fit_transform([doc_j, doc_t])
        sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0, 0])
    except ValueError:
        # Empty vocab fallback -> Jaccard.
        inter = len(set(j) & set(t))
        union = len(set(j) | set(t))
        sim = inter / union if union else 0.0
    # Bound just in case.
    return max(0.0, min(1.0, sim))


_HOURS_RE = re.compile(r"(\d+(?:\.\d+)?)")


def _parse_hours(availability: str) -> float:
    """Pull the first number out of strings like '20 hrs / week'."""
    if not availability:
        return 0.0
    m = _HOURS_RE.search(availability)
    return float(m.group(1)) if m else 0.0


def _availability_fit(job: JobRequest, talent: Talent) -> float:
    """0..1 — how well talent's availability covers job.hoursPerWeek."""
    need = max(0.0, float(job.hoursPerWeek))
    have = _parse_hours(talent.availability)
    if need <= 0 and have <= 0:
        return 0.5  # neutral
    if need <= 0:
        return 1.0
    if have <= 0:
        return 0.0
    ratio = have / need
    if ratio >= 1.0:
        # Full coverage. Slight preference for not grossly over-committed.
        return 1.0 if ratio <= 2.0 else 0.85
    return max(0.0, ratio)


def _rate_fit(job: JobRequest, talent: Talent) -> float:
    """0..1 — where talent.rate sits within job.budget."""
    lo, hi = job.budget
    rate = float(talent.rate)
    if hi <= 0:
        return 0.5  # unknown budget
    if lo <= rate <= hi:
        return 1.0
    if rate < lo:
        # Under budget — slightly under is fine, way under is suspicious.
        gap = (lo - rate) / max(lo, 1.0)
        return max(0.3, 1.0 - gap)
    # Over budget — linear falloff across one full bandwidth.
    band = max(hi - lo, hi * 0.25, 1.0)
    gap = (rate - hi) / band
    return max(0.0, 1.0 - gap)


def _tz_fit(job: JobRequest, talent: Talent) -> float:
    """0..1 timezone compatibility.

    Loose string parse: 'Any' or empty → 1.0; exact match → 1.0;
    otherwise 0.4 if the job specifies a '±N' tolerance, else 0.5.
    """
    j_tz = (job.timezone or "").strip()
    t_tz = (talent.timezone or "").strip()
    if not j_tz or j_tz.lower() == "any":
        return 1.0
    if not t_tz:
        return 0.3
    if j_tz.lower().startswith(t_tz.lower()) or t_tz.lower() in j_tz.lower():
        return 1.0
    if "±" in j_tz or "+/-" in j_tz or "any" in j_tz.lower():
        return 0.6
    return 0.35


def _rating(talent: Talent) -> float:
    """0..1 — proxy from yearsExp (cap at 10)."""
    return min(1.0, max(0.0, float(talent.yearsExp) / 10.0))


# ---------- public API ----------

def score(job: JobRequest, talent: Talent) -> ScoreResponse:
    """Pure, deterministic score for a single (job, talent) pair."""
    sub = {
        "skill_overlap": _skill_overlap(job.skills, talent.skills),
        "availability": _availability_fit(job, talent),
        "rate_fit": _rate_fit(job, talent),
        "timezone": _tz_fit(job, talent),
        "rating": _rating(talent),
    }
    weighted = {k: round(sub[k] * WEIGHTS[k], 2) for k in WEIGHTS}
    total = round(float(np.sum(list(weighted.values()))), 2)

    reasons: list[str] = []
    overlap = set(normalize_skills(job.skills)) & set(normalize_skills(talent.skills))
    if overlap:
        reasons.append(f"Shared skills: {', '.join(sorted(overlap))}")
    if sub["availability"] >= 0.8:
        reasons.append("Availability covers the job's weekly hours")
    elif sub["availability"] < 0.5:
        reasons.append("Availability is below the job's weekly need")
    if sub["rate_fit"] >= 0.95:
        reasons.append("Rate sits inside the budget band")
    if sub["timezone"] >= 0.95:
        reasons.append("Timezone aligned")

    return ScoreResponse(
        talent_id=talent.id,
        job_id=job.id,
        total=max(0.0, min(100.0, total)),
        breakdown=ScoreBreakdown(**weighted),
        reasons=reasons,
    )
