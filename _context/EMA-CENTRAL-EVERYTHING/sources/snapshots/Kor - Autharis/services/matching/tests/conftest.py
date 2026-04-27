"""Shared fixtures. Samples mirror autharis/lib/data.ts entries."""
from __future__ import annotations

import pytest

from autharis_matching.models import JobRequest, Talent


@pytest.fixture
def job_intake() -> JobRequest:
    return JobRequest(
        id="jr-001",
        title="Patient intake coordinator — evenings",
        category="care",
        hoursPerWeek=20,
        duration="3 months",
        timezone="GMT ± 3",
        budget=(40.0, 55.0),
        skills=["Care Coordination", "Intake", "Project Coordination"],
        industry="Healthcare",
    )


@pytest.fixture
def talent_amara() -> Talent:
    # Strong fit: matching skills, GMT tz, 42/hr in budget, 20hrs available.
    return Talent(
        id="t-001",
        name="Amara Okafor",
        timezone="GMT",
        rate=42.0,
        availability="20 hrs / week",
        categories=["ops", "care"],
        skills=["Project Coordination", "Care Coordination", "Notion", "Intake", "QA Review"],
        yearsExp=8,
    )


@pytest.fixture
def talent_miguel() -> Talent:
    # Weak fit: sales-oriented, wrong tz, zero skill overlap.
    return Talent(
        id="t-006",
        name="Miguel Alvarez",
        timezone="ART",
        rate=36.0,
        availability="20 hrs / week",
        categories=["sales"],
        skills=["Outreach", "Lead Qualification", "SDR Support"],
        yearsExp=4,
    )
