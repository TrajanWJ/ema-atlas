"""
Planning state machine for EMA Campaign Manager (W10).

Implements a minimal PLANNED→CRITIQUED→GATED→EXECUTED pipeline
adapted from the Megaplan plan/execute split architecture.

The gate is a hard block: execution cannot proceed unless critique
passes all structural checks. This prevents "plan drift" — agents
executing from vague or incomplete task descriptions.

State file lives at: ~/.config/ema/campaign-plans/<plan_id>.json

TODO(W10): Replace file-based state with EMA Campaign API endpoints
           when Campaign Manager is built.
TODO(W10): Add REVISED phase (plan updated in response to flags, loops
           back to CRITIQUED before re-gating).
TODO(W10): Wire EXECUTED phase into EMA dispatch API instead of
           printing the dispatch payload.
"""
from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import TypedDict


# ---------------------------------------------------------------------------
# State machine
# ---------------------------------------------------------------------------

class Phase(str, Enum):
    """MVP 4-phase pipeline. Full 9-phase per megaplan-plan-execute-split.md."""
    PLANNED   = "PLANNED"
    CRITIQUED = "CRITIQUED"
    GATED     = "GATED"      # hard gate — blocked if open flags exist
    EXECUTED  = "EXECUTED"

    # TODO(W10): add INIT, PREPPED, RESEARCHED, REVISED, FINALIZED, REVIEWED, DONE
    # to match full megaplan state machine when Campaign Manager ships


VALID_TRANSITIONS: dict[Phase, list[Phase]] = {
    Phase.PLANNED:   [Phase.CRITIQUED],
    Phase.CRITIQUED: [Phase.GATED, Phase.PLANNED],   # PLANNED = revision loop
    Phase.GATED:     [Phase.EXECUTED],
    Phase.EXECUTED:  [],
}


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

class Flag(TypedDict):
    id:       str          # FLAG-001, FLAG-002, ...
    category: str          # "must" | "should" | "info"
    check:    str          # check name
    message:  str
    resolved: bool


class PlanRecord(TypedDict):
    id:          str
    title:       str
    description: str       # freeform task description
    plan_text:   str       # markdown plan (H1, Overview, numbered steps)
    phase:       Phase
    flags:       list[Flag]
    gate_result: dict      # {"passed": bool, "open_must_count": int, ...}
    dispatch:    dict      # finalize.json equivalent — populated at EXECUTED
    created_at:  str
    updated_at:  str


# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------

def _plans_dir() -> Path:
    d = Path.home() / ".config" / "ema" / "campaign-plans"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _plan_path(plan_id: str) -> Path:
    return _plans_dir() / f"{plan_id}.json"


def load_plan(plan_id: str) -> PlanRecord | None:
    p = _plan_path(plan_id)
    if not p.exists():
        return None
    return json.loads(p.read_text())


def save_plan(record: PlanRecord) -> None:
    record["updated_at"] = _now()
    _plan_path(record["id"]).write_text(json.dumps(record, indent=2))


def list_plans() -> list[PlanRecord]:
    plans = []
    for p in _plans_dir().glob("*.json"):
        try:
            plans.append(json.loads(p.read_text()))
        except json.JSONDecodeError:
            pass
    return sorted(plans, key=lambda r: r.get("created_at", ""), reverse=True)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Phase transitions
# ---------------------------------------------------------------------------

class TransitionError(Exception):
    pass


def transition(record: PlanRecord, to: Phase) -> PlanRecord:
    """Advance the plan to the next phase. Raises TransitionError if blocked."""
    current = Phase(record["phase"])
    allowed = VALID_TRANSITIONS.get(current, [])

    if to not in allowed:
        raise TransitionError(
            f"Cannot transition {current.value} → {to.value}. "
            f"Allowed: {[p.value for p in allowed] or 'none (terminal)'}"
        )

    # Hard gate: block EXECUTED unless gate passed
    if to == Phase.EXECUTED:
        gate = record.get("gate_result", {})
        if not gate.get("passed", False):
            raise TransitionError(
                "Gate has not passed. Run 'ema campaign gate <id>' first, "
                "or resolve open FLAG-MUST items and re-run critique."
            )

    record["phase"] = to.value
    save_plan(record)
    return record


# ---------------------------------------------------------------------------
# Critique: structural checks
# ---------------------------------------------------------------------------

# Each check returns (passed: bool, message: str).
# Category "must" = gate-blocking. "should" = warning. "info" = advisory.

def _check_has_title(plan_text: str, title: str) -> tuple[bool, str]:
    """Plan must have an H1 title matching the task title (or any H1)."""
    if re.search(r"^#\s+\S", plan_text, re.MULTILINE):
        return True, "H1 title present"
    return False, f"Missing H1 title. Add '# {title}' as first line."


def _check_has_overview(plan_text: str) -> tuple[bool, str]:
    """Plan should have an Overview or Summary section."""
    if re.search(r"^#{1,3}\s+(overview|summary|objective|goal)", plan_text, re.IGNORECASE | re.MULTILINE):
        return True, "Overview section present"
    return False, "Missing Overview/Summary section. Add '## Overview' after the title."


def _check_has_steps(plan_text: str) -> tuple[bool, str]:
    """Plan must have at least 2 numbered steps."""
    steps = re.findall(r"^\s*\d+\.", plan_text, re.MULTILINE)
    if len(steps) >= 2:
        return True, f"{len(steps)} numbered steps found"
    return False, f"Only {len(steps)} numbered step(s). Plans need ≥2 steps to be actionable."


def _check_has_success_criteria(plan_text: str) -> tuple[bool, str]:
    """Plan should have success criteria (must/should/info tiers or equivalent)."""
    patterns = [
        r"success criteria", r"acceptance criteria", r"definition of done",
        r"\bmust\b.+\bshould\b",   # "must / should" tier language
        r"^-\s+\[[ x]\]",          # markdown task list
    ]
    for pat in patterns:
        if re.search(pat, plan_text, re.IGNORECASE | re.MULTILINE):
            return True, "Success criteria found"
    return False, "No success criteria detected. Add a 'must/should' criteria section."


def _check_no_placeholders(plan_text: str) -> tuple[bool, str]:
    """Plan must not contain TBD/TODO/FIXME placeholders."""
    matches = re.findall(r"\b(TBD|TODO|FIXME|PLACEHOLDER|XXX)\b", plan_text, re.IGNORECASE)
    if not matches:
        return True, "No unresolved placeholders"
    unique = list(set(m.upper() for m in matches))
    return False, f"Unresolved placeholders: {', '.join(unique)}. Resolve before gating."


def _check_proportional_scope(plan_text: str, description: str) -> tuple[bool, str]:
    """Warn if plan length seems disproportionate to task description length."""
    plan_words  = len(plan_text.split())
    desc_words  = len(description.split())
    # A 10-word task with a 2000-word plan is likely over-planned
    ratio = plan_words / max(desc_words, 1)
    if ratio > 50:
        return False, (
            f"Plan ({plan_words}w) may be over-engineered for description ({desc_words}w). "
            f"Ratio {ratio:.0f}x — consider trimming."
        )
    if plan_words < 20:
        return False, f"Plan is very short ({plan_words} words). Add more detail."
    return True, f"Scope looks proportional ({plan_words} words)"


# ---------------------------------------------------------------------------
# Run critique
# ---------------------------------------------------------------------------

CHECKS = [
    # (category, check_name, fn)
    ("must",   "has_title",            lambda pt, t, d: _check_has_title(pt, t)),
    ("must",   "has_steps",            lambda pt, t, d: _check_has_steps(pt)),
    ("must",   "no_placeholders",      lambda pt, t, d: _check_no_placeholders(pt)),
    ("should", "has_overview",         lambda pt, t, d: _check_has_overview(pt)),
    ("should", "has_success_criteria", lambda pt, t, d: _check_has_success_criteria(pt)),
    ("info",   "proportional_scope",   lambda pt, t, d: _check_proportional_scope(pt, d)),
]


def run_critique(record: PlanRecord) -> list[Flag]:
    """
    Run all structural checks against plan_text.
    Returns list of Flag dicts for any failing checks.
    Only failing checks become flags — passing checks are silent.
    """
    flags: list[Flag] = []
    counter = 1

    pt = record["plan_text"]
    t  = record["title"]
    d  = record["description"]

    for category, check_name, fn in CHECKS:
        passed, message = fn(pt, t, d)
        if not passed:
            flags.append({
                "id":       f"FLAG-{counter:03d}",
                "category": category,
                "check":    check_name,
                "message":  message,
                "resolved": False,
            })
            counter += 1

    return flags


# ---------------------------------------------------------------------------
# Gate evaluation
# ---------------------------------------------------------------------------

def evaluate_gate(record: PlanRecord) -> dict:
    """
    Evaluate whether the plan is ready for execution.
    Gate passes iff zero open 'must' flags remain.
    """
    open_flags = [f for f in record.get("flags", []) if not f["resolved"]]
    open_must  = [f for f in open_flags if f["category"] == "must"]
    open_should = [f for f in open_flags if f["category"] == "should"]

    passed = len(open_must) == 0

    return {
        "passed":           passed,
        "open_must_count":  len(open_must),
        "open_should_count": len(open_should),
        "open_must_ids":    [f["id"] for f in open_must],
        "open_should_ids":  [f["id"] for f in open_should],
        "verdict":          "PASS" if passed else "BLOCK",
        # TODO(W10): add gate_reviewed_by (human or agent id) for audit trail
    }


# ---------------------------------------------------------------------------
# Build dispatch payload (finalize.json equivalent)
# ---------------------------------------------------------------------------

def build_dispatch(record: PlanRecord) -> dict:
    """
    Extract structured task spec from the approved plan.
    This is the finalize.json equivalent — what gets handed to the executor.
    Executor reads ONLY this payload, never the full plan history.

    TODO(W10): Replace with EMA campaign dispatch API call.
    TODO(W10): Add dependency graph (T1→T2, T2→T3) once Campaign Manager
               supports multi-step topology.
    """
    # Extract numbered steps from plan_text as task items
    step_pattern = re.compile(r"^\s*(\d+)\.\s+(.+?)$", re.MULTILINE)
    steps = step_pattern.findall(record["plan_text"])

    tasks = [
        {
            "id":          f"T{num}",
            "description": desc.strip(),
            "status":      "pending",
            "depends_on":  [],   # TODO(W10): parse dependency hints from plan
        }
        for num, desc in steps
    ]

    # Extract watch items — lines matching "⚠ " or "watch:" or "risk:"
    watch_pattern = re.compile(r"(?:⚠|watch:|risk:)\s*(.+)", re.IGNORECASE)
    watch_items = [m.group(1).strip() for m in watch_pattern.finditer(record["plan_text"])]

    return {
        "plan_id":    record["id"],
        "title":      record["title"],
        "tasks":      tasks,
        "watch_items": watch_items,
        "meta": {
            "plan_phase":   "GATED",
            "gate_verdict": record.get("gate_result", {}).get("verdict", "?"),
            "generated_at": _now(),
        },
        # sense_checks and coverage_map: TODO(W10) — require richer plan annotation
    }


# ---------------------------------------------------------------------------
# High-level plan factory
# ---------------------------------------------------------------------------

def create_plan(title: str, description: str, plan_text: str) -> PlanRecord:
    """Create a new plan record in PLANNED state."""
    now = _now()
    record: PlanRecord = {
        "id":          f"plan_{uuid.uuid4().hex[:10]}",
        "title":       title,
        "description": description,
        "plan_text":   plan_text,
        "phase":       Phase.PLANNED.value,
        "flags":       [],
        "gate_result": {},
        "dispatch":    {},
        "created_at":  now,
        "updated_at":  now,
    }
    save_plan(record)
    return record
