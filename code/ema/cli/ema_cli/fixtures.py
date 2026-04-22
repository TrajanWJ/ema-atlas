"""
Fixture / test data generators for all EMA data models.
"""
import random
import string
import uuid
from datetime import datetime, timezone, timedelta


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------

_PREFIXES = {
    "project":      "pro",
    "intent":       "int",
    "edge":         "edg",
    "gap":          "gap",
    "proposal":     "prp",
    "seed":         "sed",
    "task":         "tsk",
    "session":      "ais",
    "message":      "aim",
    "token_event":  "tok",
    "provider":     "pvd",
    "usage":        "usr",
    "dispatch":     "ocl",
    "kill":         "km",
}

def gen_id(kind: str) -> str:
    prefix = _PREFIXES.get(kind, "obj")
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}_{suffix}"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def past_iso(days_ago: float = 0, hours_ago: float = 0) -> str:
    delta = timedelta(days=days_ago, hours=hours_ago)
    return (datetime.now(timezone.utc) - delta).isoformat().replace("+00:00", "Z")


def future_iso(days: float = 7) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat().replace("+00:00", "Z")


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------

PROJECT_NAMES = [
    ("EMA Core", "Personal AI operating system"),
    ("Vault Graph", "Knowledge graph for Obsidian vault"),
    ("Superman Intel", "Code intelligence integration"),
    ("OpenClaw Bridge", "Agent dispatch bridge"),
]

def make_project(name: str = None, description: str = None) -> dict:
    if name is None:
        name, description = random.choice(PROJECT_NAMES)
    slug = name.lower().replace(" ", "-")
    return {
        "id": gen_id("project"),
        "slug": slug,
        "name": name,
        "description": description or f"Project: {name}",
        "status": random.choice(["incubating", "active", "paused", "active", "active"]),
        "icon": random.choice(["🧠", "⚡", "🔬", "🛠️", "🌱"]),
        "color": random.choice(["#E8A838", "#4A90D9", "#7B68EE", "#50C878"]),
        "linked_path": f"/home/trajan/Projects/{slug}",
        "context_hash": uuid.uuid4().hex[:12],
        "settings": {},
        "inserted_at": past_iso(random.uniform(1, 90)),
        "updated_at": past_iso(random.uniform(0, 5)),
    }


# ---------------------------------------------------------------------------
# Intent nodes
# ---------------------------------------------------------------------------

LEVEL_NAMES = {0: "product", 1: "flow", 2: "action", 3: "system", 4: "implementation"}

_INTENT_TITLES = {
    0: ["Personal AI operating system", "Vault intelligence platform", "Developer productivity suite"],
    1: ["Proposal generation pipeline", "Session continuity engine", "Workflow observatory", "Routing engine"],
    2: ["Generator → Refiner → Debater → Scorer", "Intent alignment check", "Token cost tracking", "Fork & resume sessions"],
    3: ["PubSub :generated event handler", "SmartRouter balancing strategy", "CircuitBreaker per provider", "QualityGate threshold"],
    4: ["Scorer.score/1 implementation", "TokenTracker.record/2", "AiSession.fork/2", "ProviderRegistry.update_health/2"],
}

def make_intent_node(project_id: str, level: int = None, parent_id: str = None, title: str = None) -> dict:
    if level is None:
        level = random.randint(0, 4)
    if title is None:
        title = random.choice(_INTENT_TITLES.get(level, [f"Intent level {level}"]))
    return {
        "id": gen_id("intent"),
        "title": title,
        "description": f"{LEVEL_NAMES[level].title()} level intent: {title}",
        "level": level,
        "level_name": LEVEL_NAMES[level],
        "status": random.choice(["planned", "partial", "complete"]),
        "linked_task_ids": [],
        "linked_wiki_path": f"projects/ema/{title.lower().replace(' ', '-')}.md",
        "parent_id": parent_id,
        "project_id": project_id,
        "inserted_at": past_iso(random.uniform(1, 30)),
        "updated_at": past_iso(random.uniform(0, 3)),
    }


def make_intent_tree(project_id: str) -> list:
    """Generate a full 5-level intent tree (one branch per level)."""
    nodes = []
    parent_id = None
    for level in range(5):
        node = make_intent_node(project_id, level=level, parent_id=parent_id)
        nodes.append(node)
        parent_id = node["id"]
    return nodes


def make_intent_edge(source_id: str, target_id: str, relationship: str = None) -> dict:
    rel = relationship or random.choice(["depends-on", "implements", "enables", "blocks"])
    return {
        "id": gen_id("edge"),
        "source_id": source_id,
        "target_id": target_id,
        "relationship": rel,
        "inserted_at": past_iso(random.uniform(0, 10)),
        "updated_at": past_iso(random.uniform(0, 2)),
    }


# ---------------------------------------------------------------------------
# Gaps
# ---------------------------------------------------------------------------

_GAP_DESCRIPTIONS = {
    "stale_task": "Task '{}' has not been updated in {} days",
    "orphan_note": "Note '{}' has no incoming or outgoing links",
    "incomplete_goal": "Goal '{}' has no associated tasks",
    "missing_doc": "Module '{}' has no documentation",
    "todo_code": "TODO comment in {} line {}",
    "unlinked_proposal": "Proposal '{}' is approved but no task exists",
    "idle_responsibility": "Responsibility '{}' has had no activity in {} days",
}

_GAP_SUBJECTS = ["Finish auth module", "Pipeline optimization", "vault/projects/ema.md",
                  "GoalTracker", "lib/ema/scorer.ex", "Streaming UI proposal",
                  "Weekly review", "API documentation"]

def make_gap(project_id: str, gap_type: str = None, severity: int = None) -> dict:
    gt = gap_type or random.choice(list(_GAP_DESCRIPTIONS.keys()))
    template = _GAP_DESCRIPTIONS[gt]
    subj = random.choice(_GAP_SUBJECTS)
    try:
        desc = template.format(subj, random.randint(7, 30))
    except Exception:
        desc = template.format(subj)
    return {
        "id": gen_id("gap"),
        "description": desc,
        "gap_type": gt,
        "severity": severity or random.randint(1, 5),
        "status": random.choice(["open", "open", "open", "resolved", "ignored"]),
        "source": f"{gt}_scanner",
        "project_id": project_id,
        "inserted_at": past_iso(random.uniform(0, 14)),
        "updated_at": past_iso(random.uniform(0, 2)),
    }


# ---------------------------------------------------------------------------
# Proposals
# ---------------------------------------------------------------------------

_PROPOSAL_TITLES = [
    "Add real-time token streaming to proposal UI",
    "Implement session fork & resume in AI sessions",
    "Integrate Superman code intelligence for gap detection",
    "Build 5-level intent tree visualization",
    "Add automatic cost forecasting to token tracker",
    "Improve SmartRouter with ML-based provider selection",
    "Create proposal genealogy DAG viewer",
    "Add WebSocket broadcasting to all pipeline stages",
    "Implement kill-memory deduplication for proposals",
    "Build vault graph auto-sync to intent nodes",
]

_PROPOSAL_STATUSES = ["draft", "refined", "debated", "scored", "queued", "approved", "redirected", "killed"]

def make_proposal(project_id: str, seed_id: str = None, parent_proposal_id: str = None,
                   status: str = None, title: str = None) -> dict:
    title = title or random.choice(_PROPOSAL_TITLES)
    st = status or random.choice(_PROPOSAL_STATUSES[:6])  # skip killed/redirected by default
    idea_score = random.randint(5, 10)
    pq_score = random.randint(4, 10)
    return {
        "id": gen_id("proposal"),
        "title": title,
        "summary": f"Proposal to {title.lower()}. This would improve system capabilities.",
        "body": f"## Problem\n\nCurrently, {title.lower()} is not implemented.\n\n## Proposed Solution\n\nImplement {title.lower()} by extending the existing pipeline with new stages.\n\n## Impact\n\nHigh impact on developer productivity and system reliability.",
        "status": st,
        "confidence": round(random.uniform(0.6, 0.95), 2),
        "idea_score": idea_score,
        "prompt_quality_score": pq_score,
        "score_breakdown": {
            "codebase_coverage": random.randint(5, 10),
            "architectural_coherence": random.randint(6, 10),
            "impact": random.randint(5, 10),
            "prompt_specificity": random.randint(4, 10),
        },
        "risks": [
            "Increases system complexity",
            random.choice(["May require schema migration", "Performance overhead possible", "Requires additional testing"]),
        ],
        "benefits": [
            "Improves developer experience",
            random.choice(["Reduces manual effort", "Better observability", "Faster feedback loop"]),
        ],
        "tags": random.sample(["ux", "streaming", "proposals", "pipeline", "routing", "quality", "sessions"], 3),
        "generation_log": {
            "generator_ms": random.randint(800, 2000),
            "refiner_ms": random.randint(500, 1500),
            "debater_ms": random.randint(600, 1800),
            "scorer_ms": random.randint(400, 1200),
            "tagger_ms": random.randint(200, 600),
            "total_ms": random.randint(3000, 7000),
        },
        "intent_aligned": random.choice([True, True, False]),
        "duplicate_of": None,
        "seed_id": seed_id,
        "parent_proposal_id": parent_proposal_id,
        "project_id": project_id,
        "inserted_at": past_iso(random.uniform(0, 30)),
        "updated_at": past_iso(random.uniform(0, 3)),
    }


# ---------------------------------------------------------------------------
# Seeds
# ---------------------------------------------------------------------------

_SEED_TEMPLATES = [
    ("Weekly architecture review", "Review the {{project_name}} codebase. What architectural improvements would most increase maintainability?", "cron", "0 9 * * 1"),
    ("Daily gap scan", "Analyze {{project_name}} for stale tasks, missing docs, and orphan notes.", "cron", "0 8 * * *"),
    ("Git commit analysis", "Analyze recent commits to {{project_name}}. What patterns or improvements do you see?", "git", None),
    ("Vault knowledge gaps", "Review the vault for {{project_name}}. Where are the knowledge gaps?", "vault", None),
    ("Session retrospective", "Review recent AI sessions for {{project_name}}. What worked well?", "session", None),
    ("Cost optimization", "Analyze token usage for {{project_name}}. How can we reduce costs?", "usage", None),
]

def make_seed(project_id: str) -> dict:
    name, template, stype, sched = random.choice(_SEED_TEMPLATES)
    return {
        "id": gen_id("seed"),
        "name": name,
        "prompt_template": template,
        "seed_type": stype,
        "schedule": sched,
        "active": random.choice([True, True, True, False]),
        "last_run_at": past_iso(random.uniform(0, 7)) if random.random() > 0.3 else None,
        "run_count": random.randint(0, 50),
        "context_injection": {
            "include_project_context": True,
            "include_recent_proposals": random.randint(5, 15),
            "include_active_tasks": random.randint(3, 10),
        },
        "metadata": {},
        "project_id": project_id,
        "inserted_at": past_iso(random.uniform(7, 90)),
        "updated_at": past_iso(random.uniform(0, 7)),
    }


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

_TASK_TITLES = [
    "Implement Scorer quality gate",
    "Write tests for SessionWatcher",
    "Refactor SmartRouter routing logic",
    "Add WebSocket support to Observatory",
    "Document API contracts",
    "Fix token cost calculation for opus model",
    "Build intent tree UI component",
    "Integrate Superman gap scanner",
    "Set up proposal pipeline cron seeds",
    "Review and merge auth module PR",
]

_TASK_STATUSES = ["proposed", "todo", "in_progress", "in_review", "done"]

def make_task(project_id: str, source_type: str = "manual", source_id: str = None,
               title: str = None, status: str = None) -> dict:
    title = title or random.choice(_TASK_TITLES)
    st = status or random.choice(_TASK_STATUSES)
    return {
        "id": gen_id("task"),
        "title": title,
        "description": f"Implement: {title}. See related docs for context.",
        "status": st,
        "priority": random.randint(1, 5),
        "source_type": source_type,
        "source_id": source_id,
        "effort": random.choice(["xs", "s", "m", "l", "xl"]),
        "due_date": future_iso(random.uniform(1, 30))[:10],
        "recurrence": None,
        "completed_at": past_iso(random.uniform(0, 3)) if st == "done" else None,
        "metadata": {},
        "project_id": project_id,
        "inserted_at": past_iso(random.uniform(0, 30)),
        "updated_at": past_iso(random.uniform(0, 5)),
    }


# ---------------------------------------------------------------------------
# AI Sessions
# ---------------------------------------------------------------------------

def make_ai_session(project_path: str = "/home/trajan/Projects/ema",
                     status: str = None, parent_id: str = None,
                     fork_message_id: str = None) -> dict:
    st = status or random.choice(["active", "completed", "completed", "completed", "error"])
    input_toks = random.randint(500, 10000)
    output_toks = random.randint(200, 3000)
    model = random.choice(["sonnet", "haiku", "opus"])
    rates = {"sonnet": (3.0, 15.0), "haiku": (0.25, 1.25), "opus": (15.0, 75.0)}
    in_r, out_r = rates[model]
    cost = round((input_toks * in_r + output_toks * out_r) / 1_000_000, 4)
    return {
        "id": gen_id("session"),
        "status": st,
        "model": model,
        "provider_id": random.choice(["claude-personal", "claude-work", "ollama-local"]),
        "input_tokens": input_toks,
        "output_tokens": output_toks,
        "cost_usd": cost,
        "parent_id": parent_id,
        "fork_message_id": fork_message_id,
        "project_path": project_path,
        "context_summary": "Working on EMA pipeline improvements. Focus on quality gate.",
        "metadata": {},
        "inserted_at": past_iso(random.uniform(0, 14)),
        "updated_at": past_iso(random.uniform(0, 1)),
    }


def make_session_messages(session_id: str, count: int = 4) -> list:
    msgs = []
    base_time = datetime.now(timezone.utc) - timedelta(minutes=count * 2)
    conversation_pairs = [
        ("Review the Scorer implementation and suggest improvements.",
         "The Scorer currently uses a simple average of 4 dimensions. I recommend adding weighted scoring based on project context, and introducing a confidence floor at 0.4 to prevent low-quality proposals from passing."),
        ("How should we handle the WebSocket broadcasting?",
         "Phoenix.PubSub is already configured in `Ema.Application`. Subscribe topic handlers should use `Phoenix.PubSub.subscribe/2` and broadcast via `Phoenix.PubSub.broadcast/3`. Create a dedicated `ObservatoryChannel` in the LiveView layer."),
        ("What's the migration order for the new intent_edges table?",
         "Intent edges depend on intent_nodes, which in turn depend on projects. The migration order should be: projects → intent_nodes → intent_edges. The edge table needs FK constraints on both source_id and target_id pointing to intent_nodes.id."),
        ("Implement the fork session endpoint.",
         "The fork endpoint should: 1) Load the source session and verify the fork_message_id exists. 2) Create a new AiSession with parent_id set to the source session. 3) Copy all messages up to and including fork_message_id. 4) Return the new session in status 'active'."),
    ]
    for i in range(min(count, len(conversation_pairs) * 2)):
        pair_idx = i // 2
        is_user = (i % 2 == 0)
        user_msg, asst_msg = conversation_pairs[pair_idx % len(conversation_pairs)]
        ts = (base_time + timedelta(minutes=i * 2)).isoformat().replace("+00:00", "Z")
        msg = {
            "id": gen_id("message"),
            "session_id": session_id,
            "role": "user" if is_user else "assistant",
            "content": user_msg if is_user else asst_msg,
            "metadata": {} if is_user else {
                "input_tokens": random.randint(100, 500),
                "output_tokens": random.randint(200, 800),
            },
            "inserted_at": ts,
        }
        msgs.append(msg)
    return msgs


# ---------------------------------------------------------------------------
# Token events
# ---------------------------------------------------------------------------

def make_token_event(project_id: str, model: str = None, context: str = None) -> dict:
    m = model or random.choice(["sonnet", "sonnet", "haiku", "haiku", "haiku", "opus"])
    ctx = context or random.choice(["proposal", "agent", "pipe", "session", "analysis"])
    rates = {"sonnet": (3.0, 15.0), "haiku": (0.25, 1.25), "opus": (15.0, 75.0)}
    in_r, out_r = rates.get(m, (3.0, 15.0))
    input_toks = random.randint(200, 5000)
    output_toks = random.randint(100, 2000)
    cost = round((input_toks * in_r + output_toks * out_r) / 1_000_000, 5)
    return {
        "id": gen_id("token_event"),
        "model": m,
        "input_tokens": input_toks,
        "output_tokens": output_toks,
        "cost_usd": cost,
        "context": ctx,
        "project_id": project_id,
        "inserted_at": past_iso(random.uniform(0, 30)),
    }


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------

def make_default_providers() -> list:
    return [
        {
            "id": "claude-personal",
            "adapter": "ClaudeCLI",
            "healthy": True,
            "capabilities": ["streaming", "tools", "sessions"],
            "latency_ms": 450,
            "quality_score": 0.8,
            "rate_limit": {"requests_per_min": 60, "tokens_per_day": 1000000},
            "last_check": past_iso(hours_ago=0.5),
        },
        {
            "id": "claude-work",
            "adapter": "ClaudeCLI",
            "healthy": True,
            "capabilities": ["streaming", "tools", "sessions"],
            "latency_ms": 520,
            "quality_score": 0.8,
            "rate_limit": {"requests_per_min": 40, "tokens_per_day": 500000},
            "last_check": past_iso(hours_ago=1),
        },
        {
            "id": "ollama-local",
            "adapter": "Ollama",
            "healthy": True,
            "capabilities": ["streaming"],
            "latency_ms": 80,
            "quality_score": 0.5,
            "rate_limit": None,
            "last_check": past_iso(hours_ago=0.25),
        },
    ]


# ---------------------------------------------------------------------------
# Token usage summary
# ---------------------------------------------------------------------------

def make_token_usage_summary(token_events: list, days: int = 30,
                              model_filter: str = None, context_filter: str = None) -> dict:
    from datetime import date
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    filtered = []
    for e in token_events:
        ts = datetime.fromisoformat(e["inserted_at"].replace("Z", "+00:00"))
        if ts < cutoff:
            continue
        if model_filter and e["model"] != model_filter:
            continue
        if context_filter and e["context"] != context_filter:
            continue
        filtered.append(e)

    total_cost = sum(e["cost_usd"] for e in filtered)
    total_input = sum(e["input_tokens"] for e in filtered)
    total_output = sum(e["output_tokens"] for e in filtered)

    by_model: dict = {}
    for e in filtered:
        m = e["model"]
        if m not in by_model:
            by_model[m] = {"cost_usd": 0.0, "calls": 0}
        by_model[m]["cost_usd"] = round(by_model[m]["cost_usd"] + e["cost_usd"], 4)
        by_model[m]["calls"] += 1

    # Daily spend (last N days)
    daily: dict = {}
    for e in filtered:
        d = e["inserted_at"][:10]
        daily[d] = round(daily.get(d, 0.0) + e["cost_usd"], 4)
    daily_spend = [{"date": d, "cost_usd": c} for d, c in sorted(daily.items())]

    # Simple forecast
    recent_7 = [e for e in filtered if
                datetime.fromisoformat(e["inserted_at"].replace("Z", "+00:00")) >=
                datetime.now(timezone.utc) - timedelta(days=7)]
    forecast_7d = round(sum(e["cost_usd"] for e in recent_7) * (7/7), 2)
    avg_daily = total_cost / max(days, 1)
    spike = avg_daily > 2.0

    return {
        "total_cost_usd": round(total_cost, 4),
        "total_input_tokens": total_input,
        "total_output_tokens": total_output,
        "by_model": by_model,
        "daily_spend": daily_spend,
        "forecast_7d_usd": forecast_7d,
        "spike_detected": spike,
    }


# ---------------------------------------------------------------------------
# Routing estimate
# ---------------------------------------------------------------------------

def make_routing_estimate(prompt: str, task_type: str = "creative",
                           strategy: str = "balanced") -> dict:
    estimates = []
    providers = [
        ("claude-personal", "sonnet", 0.018, 2400, 0.8),
        ("claude-personal", "haiku", 0.003, 1200, 0.6),
        ("ollama-local", "llama3.3", 0.0, 800, 0.5),
    ]
    for pid, model, cost, latency, quality in providers:
        balanced = round(quality * 0.5 + (1 - cost / 0.02) * 0.3 + (1 - latency / 3000) * 0.2, 2)
        estimates.append({
            "provider_id": pid,
            "model": model,
            "estimated_cost_usd": cost,
            "estimated_latency_ms": latency,
            "quality_score": quality,
            "balanced_score": balanced,
        })
    estimates.sort(key=lambda x: x["balanced_score"], reverse=True)
    return {
        "estimates": estimates,
        "recommended": f"{estimates[0]['provider_id']}/{estimates[0]['model']}",
    }
