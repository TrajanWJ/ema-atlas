"""Scoring unit tests."""
from __future__ import annotations

from autharis_matching.models import JobRequest, Talent
from autharis_matching.ranking import rank
from autharis_matching.scoring import score


def test_identical_skills_produces_high_score(job_intake, talent_amara):
    result = score(job_intake, talent_amara)
    assert result.total >= 70, f"expected strong fit, got {result.total}"
    assert result.breakdown.skill_overlap > 0
    assert result.breakdown.availability > 0


def test_zero_overlap_produces_low_score(job_intake, talent_miguel):
    result = score(job_intake, talent_miguel)
    # No shared skills + wrong timezone -> total should be under the
    # good-fit threshold.
    assert result.total < 60, f"expected weak fit, got {result.total}"
    assert result.breakdown.skill_overlap == 0


def test_deterministic(job_intake, talent_amara):
    a = score(job_intake, talent_amara)
    b = score(job_intake, talent_amara)
    assert a.model_dump() == b.model_dump()


def test_empty_skills_returns_bounded_score():
    job = JobRequest(id="jr-x", title="x", category="admin", skills=[])
    talent = Talent(id="t-x", name="x", skills=[])
    r = score(job, talent)
    assert 0.0 <= r.total <= 100.0


def test_rank_orders_desc_and_assigns_ranks(job_intake, talent_amara, talent_miguel):
    resp = rank(job_intake, [talent_miguel, talent_amara], top_n=2)
    assert resp.top_n == 2
    assert len(resp.matches) == 2
    assert resp.matches[0].rank == 1
    assert resp.matches[1].rank == 2
    assert resp.matches[0].total >= resp.matches[1].total
    # Amara should outrank Miguel on this job.
    assert resp.matches[0].talent_id == "t-001"


def test_rank_top_n_caps_candidates(job_intake, talent_amara, talent_miguel):
    resp = rank(job_intake, [talent_amara, talent_miguel], top_n=1)
    assert len(resp.matches) == 1
    assert resp.matches[0].talent_id == "t-001"


def test_total_bounded_0_to_100(job_intake, talent_amara):
    r = score(job_intake, talent_amara)
    assert 0.0 <= r.total <= 100.0
