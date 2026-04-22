"""
Mock API layer — implements all 40+ EMA endpoints against the in-memory store.
Each function returns (status_code, response_body).
"""
import random
import re
from datetime import datetime, timezone, timedelta
from . import store, fixtures


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def _require(body: dict, *fields):
    """Return error response if any required field is missing."""
    missing = [f for f in fields if f not in body or body[f] is None]
    if missing:
        return 422, {"error": "validation_failed",
                     "details": {f: ["can't be blank"] for f in missing}}
    return None


def _not_found(kind: str, id: str):
    return 404, {"error": "not_found", "message": f"{kind} {id} not found"}


def _parse_iso(ts: str | None):
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None


def _normalize_answer_text(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _normalize_item_alias(label: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", (label or "").strip().lower()).strip("_")
    return normalized or (label or "").strip().lower()


def _response_option(id: str, label: str, aliases=None, patterns=None):
    return {
        "id": id,
        "label": label,
        "aliases": aliases or [],
        "patterns": patterns or [],
    }


def _default_user_input_manifest(proposal: dict) -> dict:
    proposal_id = proposal["id"]
    return {
        "proposal_id": proposal_id,
        "auto_generated": True,
        "gate_status": "inputs_complete",
        "approved_by": None,
        "approved_at": None,
        "items": [
            {
                "id": "approval_gate",
                "type": "approval_gate",
                "label": "Looks good to proceed?",
                "description": "Explicit sign-off is required before the proposal can be approved.",
                "required": True,
                "options": [
                    _response_option("approve", "Approve", ["approve", "approved", "yes", "y", "ship it", "looks good"], [r"(?i)^approve$", r"(?i)^approved$", r"(?i)^yes$", r"(?i)^ship it$", r"(?i)^looks good$"]),
                    _response_option("reject", "Reject", ["reject", "no", "n"], [r"(?i)^reject$", r"(?i)^no$"]),
                ],
                "freeform_patterns": [],
                "answer": None,
                "raw_answer": None,
                "normalized_answer": None,
                "matched_by": None,
                "matched_pattern": None,
                "answered_at": None,
            },
            {
                "id": "decision_backend",
                "type": "decision",
                "label": "Which implementation angle should EMA prioritize?",
                "description": "Choose the delivery angle for this proposal.",
                "required": True,
                "options": [
                    _response_option("backend_first", "Backend first", ["backend", "backend first", "server"], [r"(?i)^backend(?: first)?$", r"(?i)^server$"]),
                    _response_option("ux_first", "UX first", ["ux", "ux first", "frontend"], [r"(?i)^ux(?: first)?$", r"(?i)^front(?:end)?$"]),
                    _response_option("agent_decides", "Let agent decide", ["agent decides", "your call", "you decide", "pick for me"], [r"(?i)^your call$", r"(?i)^you decide$", r"(?i)^pick for me$"]),
                ],
                "freeform_patterns": [r"(?i)^other\s*:\s*(.+)$", r"(?i)^custom\s*:\s*(.+)$"],
                "answer": None,
                "raw_answer": None,
                "normalized_answer": None,
                "matched_by": None,
                "matched_pattern": None,
                "answered_at": None,
            },
            {
                "id": "required_info",
                "type": "required_info",
                "label": "Any missing info or constraints?",
                "description": "Answer directly, or mark n/a with a reason.",
                "required": True,
                "options": [
                    _response_option("na", "N/A", ["n/a", "na", "none", "no extra info"], [r"(?i)^n/?a$", r"(?i)^none$", r"(?i)^no extra info$"]),
                ],
                "freeform_patterns": [r"(?i)^n/?a\s*:\s*(.+)$", r"(?i)^info\s*:\s*(.+)$", r"(?i)^(.+)$"],
                "answer": None,
                "raw_answer": None,
                "normalized_answer": None,
                "matched_by": None,
                "matched_pattern": None,
                "answered_at": None,
            },
        ],
        "gate_blocked_by": ["approval_gate", "decision_backend", "required_info"],
        "last_updated": fixtures.now_iso(),
    }


def _ensure_proposal_gate_data(proposal: dict) -> dict:
    manifest = proposal.get("user_input")
    if not manifest:
        manifest = _default_user_input_manifest(proposal)
        proposal["user_input"] = manifest
    manifest.setdefault("proposal_id", proposal["id"])
    manifest.setdefault("auto_generated", False)
    manifest.setdefault("items", [])
    for item in manifest["items"]:
        item.setdefault("id", _normalize_item_alias(item.get("label", "item")))
        item.setdefault("required", True)
        item.setdefault("options", [])
        item.setdefault("freeform_patterns", [])
        item.setdefault("answer", item.get("normalized_answer"))
        item.setdefault("raw_answer", None)
        item.setdefault("normalized_answer", None)
        item.setdefault("matched_by", None)
        item.setdefault("matched_pattern", None)
        item.setdefault("answered_at", None)
        item.setdefault("type", "required_info")
        item.setdefault("label", item["id"])
        item.setdefault("description", "")
        for option in item.get("options", []):
            option.setdefault("aliases", [])
            option.setdefault("patterns", [])
    return _refresh_proposal_gate_status(proposal)


def _refresh_proposal_gate_status(proposal: dict) -> dict:
    manifest = proposal["user_input"]
    if manifest.get("auto_generated"):
        required_unanswered = []
    else:
        required_unanswered = [item["id"] for item in manifest.get("items", []) if item.get("required") and not item.get("answer")]
    manifest["gate_blocked_by"] = required_unanswered
    if proposal.get("status") == "approved":
        manifest["gate_status"] = "accepted"
    elif proposal.get("status") == "rejected":
        manifest["gate_status"] = "rejected"
    elif required_unanswered:
        manifest["gate_status"] = "input_required"
    else:
        manifest["gate_status"] = "inputs_complete"
    manifest["last_updated"] = fixtures.now_iso()
    proposal["gate_status"] = manifest["gate_status"]
    proposal["gate_blocked_by"] = list(required_unanswered)
    return manifest


def _proposal_waiting_hours(proposal: dict) -> float:
    inserted = _parse_iso(proposal.get("inserted_at")) or datetime.now(timezone.utc)
    return max(0.0, round((datetime.now(timezone.utc) - inserted).total_seconds() / 3600, 1))


def _proposal_to_desk_card(proposal: dict) -> dict:
    manifest = _ensure_proposal_gate_data(proposal)
    pending_counts = {}
    for item in manifest.get("items", []):
        if item.get("required") and not item.get("answer"):
            pending_counts[item.get("type", "required_info")] = pending_counts.get(item.get("type", "required_info"), 0) + 1
    return {
        "id": proposal["id"],
        "title": proposal.get("title"),
        "status": proposal.get("status"),
        "gate_status": manifest.get("gate_status"),
        "waiting_hours": _proposal_waiting_hours(proposal),
        "idea_score": proposal.get("idea_score"),
        "confidence": proposal.get("confidence"),
        "risk_level": "low" if proposal.get("idea_score", 0) >= 8 else "medium" if proposal.get("idea_score", 0) >= 5 else "high",
        "pending_counts": pending_counts,
        "gate_blocked_by": list(manifest.get("gate_blocked_by", [])),
        "user_input": manifest,
    }


def _resolve_item_identifier(proposal: dict, item_id: str):
    manifest = _ensure_proposal_gate_data(proposal)
    wanted = _normalize_item_alias(item_id)
    for item in manifest.get("items", []):
        aliases = {item.get("id"), _normalize_item_alias(item.get("id", "")), _normalize_item_alias(item.get("label", ""))}
        if wanted in aliases:
            return item
    return None


def _match_response_option(item: dict, raw_answer: str):
    raw = (raw_answer or "").strip()
    normalized = _normalize_answer_text(raw)
    for option in item.get("options", []):
        if raw == option.get("id"):
            return {
                "normalized_answer": option["id"],
                "matched_by": "option_id",
                "matched_pattern": option["id"],
            }
    for option in item.get("options", []):
        aliases = [_normalize_answer_text(option.get("id", "")), _normalize_answer_text(option.get("label", ""))]
        aliases.extend(_normalize_answer_text(alias) for alias in option.get("aliases", []))
        if normalized in aliases:
            return {
                "normalized_answer": option["id"],
                "matched_by": "alias",
                "matched_pattern": normalized,
            }
    for option in item.get("options", []):
        for pattern in option.get("patterns", []):
            if re.match(pattern, raw):
                return {
                    "normalized_answer": option["id"],
                    "matched_by": "pattern",
                    "matched_pattern": pattern,
                }
    for pattern in item.get("freeform_patterns", []):
        match = re.match(pattern, raw)
        if match:
            normalized_answer = match.group(1).strip() if match.groups() else raw.strip()
            return {
                "normalized_answer": normalized_answer,
                "matched_by": "freeform_pattern",
                "matched_pattern": pattern,
            }
    if not item.get("options"):
        return {
            "normalized_answer": raw.strip(),
            "matched_by": "raw_text",
            "matched_pattern": None,
        }
    return None


# ---------------------------------------------------------------------------
# F1: Intent Map
# ---------------------------------------------------------------------------

def intent_list(project_id=None, level=None, parent_id=None):
    nodes = store.all_items("intent_nodes")
    if project_id:
        nodes = [n for n in nodes if n.get("project_id") == project_id]
    if level is not None:
        nodes = [n for n in nodes if n.get("level") == int(level)]
    if parent_id:
        nodes = [n for n in nodes if n.get("parent_id") == parent_id]
    return 200, {"nodes": nodes}


def intent_tree(project_id=None):
    nodes = store.all_items("intent_nodes")
    if project_id:
        nodes = [n for n in nodes if n.get("project_id") == project_id]

    by_id = {n["id"]: dict(n, children=[]) for n in nodes}
    roots = []
    for n in nodes:
        pid = n.get("parent_id")
        if pid and pid in by_id:
            by_id[pid]["children"].append(by_id[n["id"]])
        else:
            roots.append(by_id[n["id"]])
    return 200, {"tree": roots}


def intent_create(body: dict):
    err = _require(body, "title", "project_id")
    if err:
        return err
    level = int(body.get("level", 0))
    if not 0 <= level <= 4:
        return 422, {"error": "validation_failed", "details": {"level": ["must be 0-4"]}}
    node = fixtures.make_intent_node(
        project_id=body["project_id"],
        level=level,
        parent_id=body.get("parent_id"),
        title=body["title"],
    )
    node["description"] = body.get("description", node["description"])
    store.put("intent_nodes", node)
    return 201, {"node": node}


def intent_update(id: str, body: dict):
    node = store.find("intent_nodes", id)
    if not node:
        return _not_found("IntentNode", id)
    allowed = ["title", "description", "status", "linked_task_ids", "linked_wiki_path"]
    for k in allowed:
        if k in body:
            node[k] = body[k]
    node["updated_at"] = fixtures.now_iso()
    store.put("intent_nodes", node)
    return 200, {"node": node}


def intent_delete(id: str):
    if not store.find("intent_nodes", id):
        return _not_found("IntentNode", id)
    # Cascade edges
    edges = [e for e in store.all_items("intent_edges")
             if e.get("source_id") == id or e.get("target_id") == id]
    for e in edges:
        store.delete("intent_edges", e["id"])
    store.delete("intent_nodes", id)
    return 200, {"deleted": id}


def intent_edge_create(body: dict):
    err = _require(body, "source_id", "target_id")
    if err:
        return err
    rel = body.get("relationship", "depends-on")
    valid_rels = ["depends-on", "implements", "enables", "blocks"]
    if rel not in valid_rels:
        return 422, {"error": "validation_failed",
                     "details": {"relationship": [f"must be one of {valid_rels}"]}}
    edge = fixtures.make_intent_edge(body["source_id"], body["target_id"], rel)
    store.put("intent_edges", edge)
    return 201, {"edge": edge}


# ---------------------------------------------------------------------------
# F1: Gaps
# ---------------------------------------------------------------------------

def gaps_list(source=None, severity=None, project_id=None, status=None):
    gaps = store.all_items("gaps")
    if source:
        gaps = [g for g in gaps if g.get("source") == source]
    if severity:
        gaps = [g for g in gaps if g.get("severity") == int(severity)]
    if project_id:
        gaps = [g for g in gaps if g.get("project_id") == project_id]
    if status:
        gaps = [g for g in gaps if g.get("status") == status]

    by_type: dict = {}
    for g in gaps:
        t = g.get("gap_type", "unknown")
        by_type[t] = by_type.get(t, 0) + 1

    return 200, {"gaps": gaps, "total": len(gaps), "by_type": by_type}


def gap_resolve(id: str):
    gap = store.find("gaps", id)
    if not gap:
        return _not_found("Gap", id)
    gap["status"] = "resolved"
    gap["updated_at"] = fixtures.now_iso()
    store.put("gaps", gap)
    return 200, {"gap": gap}


def gap_create_task(id: str):
    gap = store.find("gaps", id)
    if not gap:
        return _not_found("Gap", id)
    task = fixtures.make_task(
        project_id=gap.get("project_id", "pro_default0"),
        source_type="gap",
        source_id=id,
        title=f"Fix: {gap['description'][:80]}",
        status="todo",
    )
    store.put("tasks", task)
    return 201, {"task": task}


# ---------------------------------------------------------------------------
# F1: Token Usage
# ---------------------------------------------------------------------------

def token_usage(days=30, model=None, context=None, project_id=None):
    events = store.all_items("token_events")
    if project_id:
        events = [e for e in events if e.get("project_id") == project_id]
    summary = fixtures.make_token_usage_summary(events, int(days), model, context)
    return 200, summary


# ---------------------------------------------------------------------------
# F2: Proposals
# ---------------------------------------------------------------------------

def proposals_list(status=None, project_id=None, tag=None,
                    confidence_min=None, seed_id=None,
                    intent_aligned=None, idea_score_min=None):
    proposals = store.all_items("proposals")
    if status:
        proposals = [p for p in proposals if p.get("status") == status]
    if project_id:
        proposals = [p for p in proposals if p.get("project_id") == project_id]
    if tag:
        proposals = [p for p in proposals if tag in p.get("tags", [])]
    if confidence_min:
        proposals = [p for p in proposals if p.get("confidence", 0) >= float(confidence_min)]
    if seed_id:
        proposals = [p for p in proposals if p.get("seed_id") == seed_id]
    if intent_aligned is not None:
        aligned = intent_aligned in ("true", "1", True)
        proposals = [p for p in proposals if p.get("intent_aligned") == aligned]
    if idea_score_min:
        proposals = [p for p in proposals if p.get("idea_score", 0) >= int(idea_score_min)]
    proposals.sort(key=lambda p: p.get("inserted_at", ""), reverse=True)
    return 200, {"proposals": proposals, "total": len(proposals)}


def proposal_get(id: str):
    p = store.find("proposals", id)
    if not p:
        return _not_found("Proposal", id)
    _ensure_proposal_gate_data(p)
    store.put("proposals", p)
    return 200, {"proposal": p}


def proposal_approve(id: str, auto_dispatch: bool = True):
    """
    Approve a proposal → creates a task → auto-dispatches to agent via OpenClaw.

    Flow:
      1. Verify user-input gate is clear
      2. Set proposal.status = :approved
      3. Create task (source_type=proposal)
      4. Route task → recommended agent + model (SmartRouter logic)
      5. Create execution record (status=queued)
      6. Dispatch to OpenClaw (POST /api/openclaw/dispatch mock)
      7. Update task.status = dispatched, attach dispatch_id
      8. Return {proposal, task, execution, dispatch}

    Error handling: dispatch errors are logged but do NOT fail the approval.
    The task is created regardless; dispatch can be retried via POST /api/tasks/:id/dispatch.
    """
    p = store.find("proposals", id)
    if not p:
        return _not_found("Proposal", id)
    if p["status"] == "killed":
        return 422, {"error": "cannot_approve_killed", "message": "Proposal has been killed"}
    manifest = _ensure_proposal_gate_data(p)
    if manifest.get("gate_blocked_by"):
        return 422, {
            "error": "gate_blocked",
            "message": "Proposal gate blocked. Unanswered required inputs: " + ", ".join(manifest["gate_blocked_by"]),
            "gate_status": manifest.get("gate_status"),
            "blocked_items": list(manifest.get("gate_blocked_by", [])),
        }
    p["status"] = "approved"
    manifest["approved_at"] = fixtures.now_iso()
    _refresh_proposal_gate_status(p)
    p["updated_at"] = fixtures.now_iso()
    store.put("proposals", p)

    task = fixtures.make_task(
        project_id=p.get("project_id", "pro_default0"),
        source_type="proposal",
        source_id=id,
        title=p["title"],
        status="proposed",
    )
    store.put("tasks", task)

    dispatch_result = None
    execution = None
    dispatch_error = None

    if auto_dispatch:
        try:
            dispatch_result, execution, dispatch_error = _auto_dispatch_task(task, p)
        except Exception as exc:
            dispatch_error = str(exc)

    response = {"proposal": p, "task": task}
    if execution:
        response["execution"] = execution
    if dispatch_result:
        response["dispatch"] = dispatch_result
    if dispatch_error:
        response["dispatch_error"] = dispatch_error
        response["dispatch_note"] = "Task created but dispatch failed — retry via POST /api/tasks/:id/dispatch"

    return 200, response


def _auto_dispatch_task(task: dict, proposal: dict) -> tuple:
    """
    Route a task to an agent and dispatch via OpenClaw.

    Returns: (dispatch_result, execution_record, error_message | None)
    Raises: Exception on unexpected failure (caller logs it gracefully).

    Routing logic mirrors SmartRouter:
    - "implement/build/create/fix/refactor" → coder agent, sonnet
    - "research/analyze/compare" → researcher agent, opus
    - "test/validate" → coder agent, sonnet
    - default → main agent, haiku
    """
    import logging

    # Step 1: Route task to agent
    _code, route = task_route(task["id"])
    agent_id = route["recommended_agent"]
    model = route["recommended_model"]
    provider = route.get("recommended_provider", "claude-personal")

    # Step 2: Build dispatch prompt from proposal body + task title
    proposal_body = proposal.get("body", "")
    prompt_context = (
        f"Task: {task['title']}\n\n"
        f"Source proposal: {proposal.get('summary', '')}\n\n"
        f"Proposal detail:\n{proposal_body[:2000]}"
        if proposal_body
        else f"Task: {task['title']}\n\nSource proposal: {proposal.get('summary', '')}"
    )

    # Step 3: Create execution record (pre-dispatch)
    execution_id = fixtures.gen_id("exe")
    execution = {
        "id": execution_id,
        "task_id": task["id"],
        "proposal_id": proposal["id"],
        "project_id": task.get("project_id"),
        "agent_id": agent_id,
        "model": model,
        "provider": provider,
        "status": "queued",
        "prompt_preview": prompt_context[:500],
        "routing_reason": route.get("reasoning", ""),
        "dispatch_id": None,
        "result": None,
        "error": None,
        "inserted_at": fixtures.now_iso(),
        "updated_at": fixtures.now_iso(),
    }
    store.put("executions", execution)

    # Step 4: Dispatch to OpenClaw
    dispatch_body = {
        "agent_id": agent_id,
        "task": prompt_context,
        "context": {
            "project_id": task.get("project_id"),
            "task_id": task["id"],
            "proposal_id": proposal["id"],
            "execution_id": execution_id,
            "model": model,
            "provider": provider,
        },
    }
    code, dispatch_data = openclaw_dispatch(dispatch_body)

    if code not in (200, 201):
        # Dispatch failed — mark execution as failed, task stays proposed
        execution["status"] = "dispatch_failed"
        execution["error"] = dispatch_data.get("message", str(dispatch_data))
        execution["updated_at"] = fixtures.now_iso()
        store.put("executions", execution)
        return None, execution, execution["error"]

    # Step 5: Update execution + task with dispatch_id
    dispatch_id = dispatch_data["dispatch_id"]
    execution["dispatch_id"] = dispatch_id
    execution["status"] = "dispatched"
    execution["updated_at"] = fixtures.now_iso()
    store.put("executions", execution)

    # Step 6: Update task status → dispatched
    task["status"] = "dispatched"
    task["metadata"] = task.get("metadata") or {}
    task["metadata"]["dispatch_id"] = dispatch_id
    task["metadata"]["execution_id"] = execution_id
    task["metadata"]["assigned_agent"] = agent_id
    task["updated_at"] = fixtures.now_iso()
    store.put("tasks", task)

    # Step 7: Store full dispatch record for history/audit
    dispatch_record = {
        "id": dispatch_id,
        "execution_id": execution_id,
        "task_id": task["id"],
        "proposal_id": proposal["id"],
        "agent_id": agent_id,
        "model": model,
        "status": "queued",
        "dispatched_at": fixtures.now_iso(),
    }
    store.put("dispatch_history", dispatch_record)

    return dispatch_data, execution, None


def proposal_redirect(id: str, body: dict = None):
    p = store.find("proposals", id)
    if not p:
        return _not_found("Proposal", id)
    _ensure_proposal_gate_data(p)
    p["status"] = "redirected"
    if body and body.get("angle"):
        p["redirect_angle"] = body["angle"]
    p["updated_at"] = fixtures.now_iso()
    _refresh_proposal_gate_status(p)
    store.put("proposals", p)
    # Generate 3 new seeds
    new_seeds = []
    angles = [
        f"Backend focus: {p['title']}",
        f"Cost optimization angle: {p['title']}",
        f"UX simplification: {p['title']}",
    ]
    for angle in angles:
        seed = fixtures.make_seed(p.get("project_id", "pro_default0"))
        seed["name"] = angle[:80]
        store.put("seeds", seed)
        new_seeds.append(seed)
    return 200, {"proposal": p, "seeds": new_seeds}


def proposal_kill(id: str):
    p = store.find("proposals", id)
    if not p:
        return _not_found("Proposal", id)
    if p["status"] == "killed":
        return 422, {"error": "already_killed", "message": "Proposal already killed"}
    p["status"] = "killed"
    p["updated_at"] = fixtures.now_iso()
    store.put("proposals", p)
    kill_id = fixtures.gen_id("kill")
    return 200, {"proposal": p, "kill_pattern_id": kill_id}


def proposal_lineage(id: str):
    p = store.find("proposals", id)
    if not p:
        return _not_found("Proposal", id)

    lineage = []
    # Seed origin
    if p.get("seed_id"):
        seed = store.find("seeds", p["seed_id"])
        if seed:
            lineage.append({
                "id": seed["id"],
                "type": "seed",
                "name": seed["name"],
                "seed_type": seed.get("seed_type", "cron"),
            })
    # Walk parent chain
    chain = []
    current = p
    while current:
        chain.append(current)
        pid = current.get("parent_proposal_id")
        current = store.find("proposals", pid) if pid else None
    chain.reverse()
    for i, prop in enumerate(chain):
        lineage.append({
            "id": prop["id"],
            "type": "proposal",
            "title": prop["title"],
            "status": prop["status"],
            "generation": i + 1,
        })
    return 200, {"proposal_id": id, "lineage": lineage}


def proposal_validate(id: str):
    """Mock validation gate."""
    p = store.find("proposals", id)
    if not p:
        return _not_found("Proposal", id)
    score = p.get("idea_score", 5)
    confidence = p.get("confidence", 0.5)
    issues = []
    if score < 5:
        issues.append(f"Idea score {score} is below threshold (5)")
    if confidence < 0.5:
        issues.append(f"Confidence {confidence} is below threshold (0.5)")
    if not p.get("intent_aligned"):
        issues.append("Proposal is not aligned with any intent node")

    if issues:
        return 200, {
            "result": "reject",
            "proposal_id": id,
            "issues": issues,
            "gate_scores": {
                "idea_score": score,
                "confidence": confidence,
                "intent_aligned": p.get("intent_aligned"),
            }
        }
    return 200, {
        "result": "accept",
        "proposal_id": id,
        "issues": [],
        "gate_scores": {
            "idea_score": score,
            "confidence": confidence,
            "intent_aligned": p.get("intent_aligned"),
        }
    }


def proposal_reject(id: str, reason: str | None = None):
    p = store.find("proposals", id)
    if not p:
        return _not_found("Proposal", id)
    _ensure_proposal_gate_data(p)
    p["status"] = "rejected"
    if reason:
        p["rejection_reason"] = reason
    p["updated_at"] = fixtures.now_iso()
    _refresh_proposal_gate_status(p)
    store.put("proposals", p)
    return 200, {"proposal": p, "reason": reason}


def proposal_input_options(proposal_id: str, item_id: str):
    p = store.find("proposals", proposal_id)
    if not p:
        return _not_found("Proposal", proposal_id)
    item = _resolve_item_identifier(p, item_id)
    if not item:
        return _not_found("ProposalInput", item_id)
    return 200, {
        "proposal_id": proposal_id,
        "item": item,
        "accepted_strings": {
            "option_ids": [option.get("id") for option in item.get("options", [])],
            "aliases": [{"option_id": option.get("id"), "aliases": option.get("aliases", [])} for option in item.get("options", [])],
            "patterns": [{"option_id": option.get("id"), "patterns": option.get("patterns", [])} for option in item.get("options", [])],
            "freeform_patterns": item.get("freeform_patterns", []),
        },
    }


def proposal_input_respond(proposal_id: str, item_id: str, answer: str):
    p = store.find("proposals", proposal_id)
    if not p:
        return _not_found("Proposal", proposal_id)
    item = _resolve_item_identifier(p, item_id)
    if not item:
        return _not_found("ProposalInput", item_id)
    result = _match_response_option(item, answer)
    if not result:
        return 422, {
            "error": "invalid_answer",
            "message": f"Answer did not match declared response grammar for {item['id']}",
            "proposal_id": proposal_id,
            "item_id": item["id"],
        }
    item["raw_answer"] = answer
    item["normalized_answer"] = result["normalized_answer"]
    item["matched_by"] = result["matched_by"]
    item["matched_pattern"] = result.get("matched_pattern")
    item["answered_at"] = fixtures.now_iso()
    item["answer"] = result["normalized_answer"]
    manifest = _refresh_proposal_gate_status(p)
    p["updated_at"] = fixtures.now_iso()
    store.put("proposals", p)
    return 200, {
        "proposal_id": proposal_id,
        "item": item,
        "gate_status": manifest.get("gate_status"),
        "blocked_items": list(manifest.get("gate_blocked_by", [])),
    }


def desk_get():
    proposals = []
    for proposal in store.all_items("proposals"):
        _ensure_proposal_gate_data(proposal)
        store.put("proposals", proposal)
        proposals.append(proposal)

    waiting_input = []
    awaiting_approval = []
    new_proposals = []
    done_today = []

    now = datetime.now(timezone.utc)
    for proposal in proposals:
        card = _proposal_to_desk_card(proposal)
        inserted = _parse_iso(proposal.get("inserted_at"))
        updated = _parse_iso(proposal.get("updated_at"))
        if card["gate_status"] == "input_required":
            waiting_input.append(card)
        elif card["gate_status"] == "inputs_complete" and proposal.get("status") not in ("approved", "rejected", "redirected", "killed"):
            awaiting_approval.append(card)
        if proposal.get("status") in ("queued", "scored", "refined") and inserted and now - inserted <= timedelta(hours=1):
            new_proposals.append(card)
        if proposal.get("status") in ("approved", "rejected", "redirected") and updated and updated.date() == now.date():
            done_today.append(card)

    in_flight = []
    for task in store.all_items("tasks"):
        if task.get("status") not in ("dispatched", "in_progress", "in_review"):
            continue
        proposal = store.find("proposals", task.get("source_id")) if task.get("source_type") == "proposal" else None
        in_flight.append({
            "proposal_id": proposal.get("id") if proposal else task.get("source_id"),
            "task_id": task.get("id"),
            "title": proposal.get("title") if proposal else task.get("title"),
            "status": task.get("status"),
            "started_at": task.get("updated_at") or task.get("inserted_at"),
        })

    return 200, {
        "generated_at": fixtures.now_iso(),
        "waiting_input": sorted(waiting_input, key=lambda p: p["waiting_hours"], reverse=True),
        "awaiting_approval": sorted(awaiting_approval, key=lambda p: p["waiting_hours"], reverse=True),
        "new_proposals": sorted(new_proposals, key=lambda p: p["waiting_hours"]),
        "in_flight": in_flight,
        "done_today": done_today,
    }


# ---------------------------------------------------------------------------
# F2: Seeds
# ---------------------------------------------------------------------------

def seeds_list(project_id=None, active=None, seed_type=None):
    seeds = store.all_items("seeds")
    if project_id:
        seeds = [s for s in seeds if s.get("project_id") == project_id]
    if active is not None:
        is_active = active in ("true", "1", True)
        seeds = [s for s in seeds if s.get("active") == is_active]
    if seed_type:
        seeds = [s for s in seeds if s.get("seed_type") == seed_type]
    return 200, {"seeds": seeds}


def seed_create(body: dict):
    err = _require(body, "name", "prompt_template", "project_id")
    if err:
        return err
    seed = fixtures.make_seed(body["project_id"])
    seed.update({k: body[k] for k in body if k in
                  ["name", "prompt_template", "seed_type", "schedule",
                   "project_id", "context_injection", "metadata"]})
    store.put("seeds", seed)
    return 201, {"seed": seed}


def engine_pause():
    return 200, {"status": "paused"}


def engine_resume():
    return 200, {"status": "running"}


# ---------------------------------------------------------------------------
# F3: Sessions
# ---------------------------------------------------------------------------

def sessions_list_api(status=None, agent_id=None, project_path=None):
    sessions = store.all_items("ai_sessions")
    if status:
        sessions = [s for s in sessions if s.get("status") == status]
    if agent_id:
        sessions = [s for s in sessions if s.get("agent_id") == agent_id]
    if project_path:
        sessions = [s for s in sessions if s.get("project_path") == project_path]
    return 200, {"sessions": sessions}


def session_messages(id: str):
    s = store.find("ai_sessions", id)
    if not s:
        return _not_found("Session", id)
    msgs = [m for m in store.all_items("ai_session_messages") if m.get("session_id") == id]
    msgs.sort(key=lambda m: m.get("inserted_at", ""))
    return 200, {"session_id": id, "messages": msgs}


def session_fork(id: str, body: dict):
    s = store.find("ai_sessions", id)
    if not s:
        return _not_found("Session", id)
    message_id = body.get("message_id")
    if message_id:
        msg = store.find("ai_session_messages", message_id)
        if not msg:
            return _not_found("Message", message_id)
    new_session = fixtures.make_ai_session(
        project_path=s.get("project_path", ""),
        status="active",
        parent_id=id,
        fork_message_id=message_id,
    )
    # Copy messages up to fork point
    if message_id:
        all_msgs = [m for m in store.all_items("ai_session_messages") if m.get("session_id") == id]
        all_msgs.sort(key=lambda m: m.get("inserted_at", ""))
        for m in all_msgs:
            if m["id"] == message_id:
                break
            new_msg = dict(m, id=fixtures.gen_id("message"), session_id=new_session["id"])
            store.put("ai_session_messages", new_msg)
    store.put("ai_sessions", new_session)
    return 201, {"session": new_session}


def session_resume(id: str):
    s = store.find("ai_sessions", id)
    if not s:
        return _not_found("Session", id)
    s["status"] = "active"
    s["updated_at"] = fixtures.now_iso()
    store.put("ai_sessions", s)
    return 200, {"session": s}


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

def projects_list():
    projects = store.all_items("projects")
    return 200, {"projects": projects}


def project_get(id: str):
    p = store.find("projects", id)
    if not p:
        return _not_found("Project", id)
    return 200, {"project": p}


def project_health(id: str):
    p = store.find("projects", id)
    if not p:
        return _not_found("Project", id)

    proposals = [x for x in store.all_items("proposals") if x.get("project_id") == id]
    tasks = [x for x in store.all_items("tasks") if x.get("project_id") == id]
    gaps = [x for x in store.all_items("gaps") if x.get("project_id") == id and x.get("status") == "open"]
    sessions = [x for x in store.all_items("ai_sessions") if x.get("project_path", "").endswith(p.get("slug", ""))]

    total_tasks = len(tasks)
    done_tasks = sum(1 for t in tasks if t.get("status") == "done")
    gap_severity = sum(g.get("severity", 1) for g in gaps)
    # Score: start at 0.9, deduct for open gaps weighted by severity, floor at 0.1
    gap_penalty = min(0.7, gap_severity * 0.05)
    task_bonus = min(0.1, done_tasks * 0.02)
    health = max(0.1, 0.9 - gap_penalty + task_bonus) if (proposals or total_tasks) else 0.5

    stats = {
        "proposals": len(proposals),
        "tasks": total_tasks,
        "tasks_done": done_tasks,
        "gaps_open": len(gaps),
        "sessions": len(sessions),
        "health_score": round(health, 2),
    }
    return 200, {"project": p, "health": stats}


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

def tasks_list(status=None, project_id=None):
    tasks = store.all_items("tasks")
    if status:
        tasks = [t for t in tasks if t.get("status") == status]
    if project_id:
        tasks = [t for t in tasks if t.get("project_id") == project_id]
    return 200, {"tasks": tasks, "total": len(tasks)}


def task_get(id: str):
    t = store.find("tasks", id)
    if not t:
        return _not_found("Task", id)
    return 200, {"task": t}


def task_create(body: dict):
    err = _require(body, "title", "project_id")
    if err:
        return err
    task = fixtures.make_task(
        project_id=body["project_id"],
        source_type=body.get("source_type", "manual"),
        source_id=body.get("source_id"),
        title=body["title"],
        status=body.get("status", "todo"),
    )
    if "description" in body:
        task["description"] = body["description"]
    store.put("tasks", task)
    return 201, {"task": task}


def task_update(id: str, body: dict):
    t = store.find("tasks", id)
    if not t:
        return _not_found("Task", id)
    allowed = ["title", "description", "status", "priority", "effort", "due_date", "metadata"]
    for k in allowed:
        if k in body:
            t[k] = body[k]
    t["updated_at"] = fixtures.now_iso()
    store.put("tasks", t)
    return 200, {"task": t}


def task_route(id: str):
    t = store.find("tasks", id)
    if not t:
        return _not_found("Task", id)
    effort = t.get("effort", "m")
    title_lower = t.get("title", "").lower()
    # Simple mock routing logic
    if any(kw in title_lower for kw in ["implement", "build", "create", "fix", "refactor"]):
        agent = "coder"
        reason = "Task requires code implementation"
        model = "sonnet"
    elif any(kw in title_lower for kw in ["research", "analyze", "compare", "review"]):
        agent = "researcher"
        reason = "Task requires research and analysis"
        model = "opus"
    elif any(kw in title_lower for kw in ["test", "validate", "check"]):
        agent = "coder"
        reason = "Task involves testing and validation"
        model = "sonnet"
    else:
        agent = "main"
        reason = "General task handled by primary agent"
        model = "haiku"
    provider = "claude-personal"
    est = fixtures.make_routing_estimate(t.get("title", ""), task_type="code_generation")
    return 200, {
        "task_id": id,
        "recommended_agent": agent,
        "recommended_provider": provider,
        "recommended_model": model,
        "reasoning": reason,
        "routing_estimates": est["estimates"],
    }


def task_dispatch(id: str):
    """
    Manually dispatch a task to an agent (retry path).
    Used when auto-dispatch failed on approval, or for manual override.
    Looks up the source proposal for context, then calls _auto_dispatch_task.
    """
    t = store.find("tasks", id)
    if not t:
        return _not_found("Task", id)
    if t.get("status") == "dispatched":
        return 422, {"error": "already_dispatched", "message": f"Task {id} is already dispatched"}

    # Find source proposal for context
    proposal = None
    if t.get("source_type") == "proposal" and t.get("source_id"):
        proposal = store.find("proposals", t["source_id"])
    if not proposal:
        # Build a minimal proposal-like context from the task itself
        proposal = {
            "id": t.get("source_id", "manual"),
            "title": t["title"],
            "summary": t.get("description", t["title"]),
            "body": "",
            "project_id": t.get("project_id"),
        }

    try:
        dispatch_result, execution, dispatch_error = _auto_dispatch_task(t, proposal)
    except Exception as exc:
        return 500, {"error": "dispatch_failed", "message": str(exc)}

    if dispatch_error:
        return 503, {"error": "dispatch_failed", "message": dispatch_error, "execution": execution}

    return 200, {"task": store.find("tasks", id), "execution": execution, "dispatch": dispatch_result}


def task_assign(id: str, agent_id: str):
    t = store.find("tasks", id)
    if not t:
        return _not_found("Task", id)
    t["metadata"] = t.get("metadata") or {}
    t["metadata"]["assigned_agent"] = agent_id
    t["status"] = "in_progress"
    t["updated_at"] = fixtures.now_iso()
    store.put("tasks", t)
    return 200, {"task": t, "assigned_to": agent_id}


def task_link_intent(task_id: str, intent_id: str):
    t = store.find("tasks", task_id)
    if not t:
        return _not_found("Task", task_id)
    node = store.find("intent_nodes", intent_id)
    if not node:
        return _not_found("IntentNode", intent_id)
    linked = node.get("linked_task_ids", [])
    if task_id not in linked:
        linked.append(task_id)
        node["linked_task_ids"] = linked
        node["updated_at"] = fixtures.now_iso()
        store.put("intent_nodes", node)
    return 200, {"intent_node": node, "linked_task_id": task_id}


# ---------------------------------------------------------------------------
# F5: Providers & Routing
# ---------------------------------------------------------------------------

def providers_list():
    providers = store.all_items("providers")
    if not providers:
        # Return defaults if empty
        return 200, {"providers": fixtures.make_default_providers()}
    return 200, {"providers": providers}


def provider_health_check(id: str):
    providers = store.all_items("providers")
    defaults = fixtures.make_default_providers()
    all_provs = {p["id"]: p for p in defaults}
    all_provs.update({p["id"]: p for p in providers})
    if id not in all_provs:
        return _not_found("Provider", id)
    p = all_provs[id]
    latency = p.get("latency_ms", 500) + random.randint(-50, 50)
    return 200, {"healthy": p.get("healthy", True), "latency_ms": latency, "error": None}


def routing_estimate(body: dict):
    err = _require(body, "prompt")
    if err:
        return err
    result = fixtures.make_routing_estimate(
        body["prompt"],
        body.get("task_type", "creative"),
        body.get("strategy", "balanced"),
    )
    return 200, result


# ---------------------------------------------------------------------------
# Superman integration (mock)
# ---------------------------------------------------------------------------

def superman_status():
    return 200, {"status": "ok", "version": "1.2.0", "project": "ema"}


def superman_index(body: dict):
    return 200, {"indexed": True, "file_count": random.randint(1000, 5000)}


def superman_ask(body: dict):
    err = _require(body, "question")
    if err:
        return err
    return 200, {
        "answer": f"Based on the codebase analysis: {body['question']} — This is handled by the Phoenix.PubSub module configured in Ema.Application. The main entry points are in lib/ema/proposal_engine/.",
        "references": [
            {"file": "lib/ema/application.ex", "line": 42},
            {"file": "lib/ema/proposal_engine/generator.ex", "line": 88},
        ]
    }


def superman_apply(body: dict):
    err = _require(body, "instruction")
    if err:
        return err
    return 200, {
        "success": True,
        "files_changed": [
            "daemon/lib/ema/proposals/proposal.ex",
            "daemon/priv/repo/migrations/20260403001_migration.exs",
        ],
        "tool_calls": [
            {"name": "Edit", "file": "daemon/lib/ema/proposals/proposal.ex",
             "description": body["instruction"][:80]},
        ]
    }


def superman_gaps():
    return 200, {
        "gaps": [
            {"type": "missing_test", "file": "lib/ema/proposal_engine/scorer.ex",
             "description": "Scorer module has no corresponding test file"},
            {"type": "missing_test", "file": "lib/ema/routing/smart_router.ex",
             "description": "SmartRouter module has no corresponding test file"},
            {"type": "undocumented", "file": "lib/ema/sessions/session_watcher.ex",
             "description": "SessionWatcher has no @moduledoc"},
        ]
    }


def superman_intent_graph():
    return 200, {
        "nodes": [
            {"id": "scorer", "type": "module", "path": "lib/ema/proposal_engine/scorer.ex"},
            {"id": "quality_gate", "type": "module", "path": "lib/ema/quality/quality_gate.ex"},
            {"id": "proposal", "type": "schema", "path": "lib/ema/proposals/proposal.ex"},
        ],
        "edges": [
            {"from": "scorer", "to": "quality_gate", "type": "calls"},
            {"from": "scorer", "to": "proposal", "type": "updates"},
        ]
    }


# ---------------------------------------------------------------------------
# Executions — tracks proposal → task → agent dispatch lifecycle
# ---------------------------------------------------------------------------

def executions_list(project_id=None, status=None, agent_id=None):
    """List execution records with optional filters."""
    execs = store.all_items("executions")
    if project_id:
        execs = [e for e in execs if e.get("project_id") == project_id]
    if status:
        execs = [e for e in execs if e.get("status") == status]
    if agent_id:
        execs = [e for e in execs if e.get("agent_id") == agent_id]
    execs.sort(key=lambda e: e.get("inserted_at", ""), reverse=True)
    return 200, {"executions": execs, "total": len(execs)}


def execution_get(id: str):
    """Get a single execution with linked task + proposal."""
    e = store.find("executions", id)
    if not e:
        return _not_found("Execution", id)
    task = store.find("tasks", e.get("task_id")) if e.get("task_id") else None
    proposal = store.find("proposals", e.get("proposal_id")) if e.get("proposal_id") else None
    dispatch = None
    if e.get("dispatch_id"):
        dispatch = store.find("dispatch_history", e["dispatch_id"])
    return 200, {
        "execution": e,
        "task": task,
        "proposal": {"id": proposal["id"], "title": proposal["title"], "status": proposal["status"]}
                    if proposal else None,
        "dispatch": dispatch,
    }


def execution_complete(id: str, body: dict):
    """
    Mark an execution as completed. Called by the agent when done.
    Updates: execution.status, execution.result, task.status → done,
    fires PubSub event (mocked as a log entry in execution.result).
    """
    e = store.find("executions", id)
    if not e:
        return _not_found("Execution", id)

    success = body.get("success", True)
    e["status"] = "completed" if success else "failed"
    e["result"] = {
        "success": success,
        "summary": body.get("summary", ""),
        "files_created": body.get("files_created", []),
        "files_modified": body.get("files_modified", []),
        "quality_score": body.get("quality_score"),
        "completed_at": fixtures.now_iso(),
    }
    e["updated_at"] = fixtures.now_iso()
    store.put("executions", e)

    # Update linked task
    if e.get("task_id"):
        task = store.find("tasks", e["task_id"])
        if task:
            task["status"] = "done" if success else "failed"
            task["updated_at"] = fixtures.now_iso()
            store.put("tasks", task)

    # Record outcome for learning loop
    outcome = {
        "id": fixtures.gen_id("outcome"),
        "execution_id": id,
        "task_id": e.get("task_id"),
        "proposal_id": e.get("proposal_id"),
        "project_id": e.get("project_id"),
        "agent_id": e.get("agent_id"),
        "status": e["status"],
        "quality_score": body.get("quality_score"),
        "recorded_at": fixtures.now_iso(),
        # In the real Elixir system, this fires:
        # Phoenix.PubSub.broadcast(Ema.PubSub, "executions:all", {:execution_completed, execution})
        # Ema.Outcomes.LearningLoop.analyze(execution_id)
        "pubsub_event": f"executions:all → :execution_{'completed' if success else 'failed'}",
    }
    store.put("usage_records", outcome)

    return 200, {"execution": e, "outcome": outcome}


# ---------------------------------------------------------------------------
# OpenClaw dispatch (mock)
# ---------------------------------------------------------------------------

def openclaw_dispatch(body: dict):
    err = _require(body, "agent_id", "task")
    if err:
        return err
    dispatch_id = fixtures.gen_id("dispatch")
    # Store dispatch in metadata
    dispatch = {
        "id": dispatch_id,
        "dispatch_id": dispatch_id,
        "status": "queued",
        "agent_id": body["agent_id"],
        "task": body["task"],
        "context": body.get("context", {}),
        "inserted_at": fixtures.now_iso(),
    }
    store.put("usage_records", dispatch)
    return 201, {"dispatch_id": dispatch_id, "status": "queued", "agent_id": body["agent_id"]}


def openclaw_dispatch_status(id: str):
    dispatch = store.find("usage_records", id)
    if not dispatch:
        # Return a completed mock
        return 200, {
            "dispatch_id": id,
            "status": "completed",
            "result": {
                "files_created": ["daemon/lib/ema/intelligence/superman_continuity_hook.ex"],
                "summary": "Task completed successfully by agent",
            }
        }
    return 200, {
        "dispatch_id": id,
        "status": dispatch.get("status", "completed"),
        "result": dispatch.get("result"),
    }

# End of mock API handlers
