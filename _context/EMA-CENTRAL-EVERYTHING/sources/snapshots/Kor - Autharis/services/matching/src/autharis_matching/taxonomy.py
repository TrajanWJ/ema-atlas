"""Canonical skill taxonomy and synonym map.

Mirrors the `SKILLS` + `CATEGORIES` exports in `autharis/lib/data.ts`, and
extends them with a synonym map so inbound free-text skill strings can be
normalized before scoring. Lane E4 (Node) and E6 (search) can consume the
same taxonomy via the `GET /taxonomy` endpoint.
"""
from __future__ import annotations

from typing import Final

# Canonical skills (must stay in sync with autharis/lib/data.ts SKILLS).
SKILLS: Final[tuple[str, ...]] = (
    "Email Triage", "Calendar Mgmt", "CRM Admin", "Data Entry",
    "Customer Support", "Chat Support", "Zendesk", "Intercom",
    "Project Coordination", "Notion", "Asana", "Linear",
    "Market Research", "Desk Research", "Outreach", "Copywriting",
    "Bookkeeping Assist", "Invoice Admin", "Travel Coordination",
    "QA Review", "LLM Output Review", "Annotation", "RAG Evals",
    "Care Coordination", "Intake", "Outbound Calls",
    "Lead Qualification", "SDR Support",
)

CATEGORIES: Final[tuple[dict[str, str], ...]] = (
    {"id": "admin", "label": "Administrative Support"},
    {"id": "cx",    "label": "Customer Support"},
    {"id": "ops",   "label": "Operations Support"},
    {"id": "care",  "label": "Care & Case Coordination"},
    {"id": "sales", "label": "Sales & Outreach"},
    {"id": "rsrch", "label": "Research & Project"},
    {"id": "ai",    "label": "AI Review & Ops"},
)

# Synonym map: lowercase alias -> canonical skill.
SYNONYMS: Final[dict[str, str]] = {
    # Tech / framework-ish aliases (for future-proofing even though the
    # prototype's skills are ops-heavy).
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "rn": "React Native",
    "react-native": "React Native",
    # Canonical-name aliases.
    "email": "Email Triage",
    "inbox triage": "Email Triage",
    "inbox": "Email Triage",
    "calendar": "Calendar Mgmt",
    "calendaring": "Calendar Mgmt",
    "scheduling": "Calendar Mgmt",
    "crm": "CRM Admin",
    "salesforce": "CRM Admin",
    "hubspot": "CRM Admin",
    "cs": "Customer Support",
    "support": "Customer Support",
    "chat": "Chat Support",
    "zd": "Zendesk",
    "zendesk": "Zendesk",
    "intercom": "Intercom",
    "pm": "Project Coordination",
    "project management": "Project Coordination",
    "notion": "Notion",
    "asana": "Asana",
    "linear": "Linear",
    "market research": "Market Research",
    "desk research": "Desk Research",
    "outreach": "Outreach",
    "cold email": "Outreach",
    "copy": "Copywriting",
    "copywriting": "Copywriting",
    "bookkeeping": "Bookkeeping Assist",
    "invoicing": "Invoice Admin",
    "invoices": "Invoice Admin",
    "travel": "Travel Coordination",
    "qa": "QA Review",
    "llm qa": "LLM Output Review",
    "llm review": "LLM Output Review",
    "annotation": "Annotation",
    "labeling": "Annotation",
    "rag": "RAG Evals",
    "rag evals": "RAG Evals",
    "care": "Care Coordination",
    "intake": "Intake",
    "outbound": "Outbound Calls",
    "calls": "Outbound Calls",
    "lead qual": "Lead Qualification",
    "qualification": "Lead Qualification",
    "sdr": "SDR Support",
}


def normalize_skill(raw: str) -> str:
    """Map a free-text skill string to its canonical form.

    Case-insensitive. Unknown strings are returned with whitespace collapsed
    so they still participate in TF-IDF overlap (even if not in the canonical
    set).
    """
    if not raw:
        return ""
    key = " ".join(raw.strip().lower().split())
    if key in SYNONYMS:
        return SYNONYMS[key]
    # Case-insensitive match against canonical skills.
    for canonical in SKILLS:
        if canonical.lower() == key:
            return canonical
    return raw.strip()


def normalize_skills(skills: list[str]) -> list[str]:
    """Normalize a list of skills, preserving order and deduping."""
    seen: set[str] = set()
    out: list[str] = []
    for s in skills:
        n = normalize_skill(s)
        if n and n not in seen:
            seen.add(n)
            out.append(n)
    return out


def taxonomy_payload() -> dict:
    """Serializable payload for the `GET /taxonomy` endpoint."""
    return {
        "skills": list(SKILLS),
        "categories": list(CATEGORIES),
        "synonyms": dict(SYNONYMS),
    }
