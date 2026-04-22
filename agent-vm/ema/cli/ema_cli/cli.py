"""
EMA CLI — main entry point and command dispatcher.

Usage:
  ema <command> [subcommand] [args...] [--flags]
  ema shell                      # interactive REPL
  ema scenario <name>            # run pre-built test scenario
  ema seed                       # seed store with test data
  ema reset                      # clear all state
"""
import sys
import os
import json
import shlex
from datetime import datetime, timezone

# Support running as: python3 ema_cli/cli.py [args]
if __name__ == "__main__" and __package__ is None:
    _cli_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if _cli_dir not in sys.path:
        sys.path.insert(0, _cli_dir)
    __package__ = "ema_cli"

from . import store, fixtures, mock_api
from .output import (
    print_json, print_table, print_tree, print_proposal_genealogy,
    print_token_summary, print_project_health,
    print_success, print_error, print_warn, print_info, print_created, print_header,
    c, GOLD, BOLD, CYAN, GREEN, RED, YELLOW, GREY, DIM, MAGENTA,
)


# ---------------------------------------------------------------------------
# Argument parser (stdlib only, no argparse needed)
# ---------------------------------------------------------------------------

class Args:
    def __init__(self, positional, flags):
        self.pos = positional
        self.flags = flags

    def get(self, key, default=None):
        return self.flags.get(key, default)

    def has(self, key):
        return key in self.flags

    def format(self):
        return self.flags.get("format", "json")


def parse_args(argv):
    pos = []
    flags = {}
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg.startswith("--"):
            arg = arg[2:]
            if "=" in arg:
                k, v = arg.split("=", 1)
                flags[k] = v
            elif i + 1 < len(argv) and not argv[i + 1].startswith("--"):
                flags[arg] = argv[i + 1]
                i += 1
            else:
                flags[arg] = True
        else:
            pos.append(arg)
        i += 1
    return Args(pos, flags)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _default_project_id():
    """Return the first project in store, or create one."""
    projects = store.all_items("projects")
    if projects:
        return projects[0]["id"]
    p = fixtures.make_project("EMA Core", "Personal AI operating system")
    p["id"] = "pro_ema0001"
    store.put("projects", p)
    return p["id"]


def _find_or_create_seed(source, project_id):
    seeds = store.all_items("seeds")
    for s in seeds:
        if s.get("name", "").lower().find(source.lower()) >= 0:
            return s
    seed = fixtures.make_seed(project_id)
    seed["name"] = "Seed from " + source
    store.put("seeds", seed)
    return seed


def _flatten_tree(tree_list, depth=0):
    """Flatten nested tree format into flat list with parent_id."""
    flat = []
    for node in tree_list:
        children = node.pop("children", [])
        flat.append(node)
        flat.extend(_flatten_tree(children, depth + 1))
    return flat


def _format_waiting(hours):
    if hours is None:
        return "unknown"
    if hours < 1:
        return "just arrived"
    whole = int(hours)
    return f"waiting {whole}h"


def _print_desk_summary(data):
    generated_at = data.get("generated_at") or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    timestamp = generated_at.replace("T", " ").replace("Z", " UTC")
    print_header("YOUR DESK — " + timestamp)

    def show_cards(title, cards, detail_fn=None):
        print_info(title + " (" + str(len(cards)) + ")")
        if not cards:
            print("    (none)")
            print()
            return
        for card in cards:
            print("    • " + card["id"] + " | " + card.get("title", "Untitled"))
            if detail_fn:
                print("      " + detail_fn(card))
        print()

    def pending_detail(card):
        counts = card.get("pending_counts", {})
        pieces = []
        for key in ("approval_gate", "decision", "required_info", "risk_ack", "open_question"):
            count = counts.get(key)
            if count:
                pieces.append(f"{key}={count}")
        pieces.append(_format_waiting(card.get("waiting_hours", 0)))
        if card.get("idea_score") is not None:
            pieces.append("score " + str(card["idea_score"]))
        return " • ".join(pieces)

    show_cards("📋 waiting_input", data.get("waiting_input", []), pending_detail)
    show_cards("✅ awaiting_approval", data.get("awaiting_approval", []), pending_detail)
    show_cards("🆕 new_proposals", data.get("new_proposals", []), pending_detail)

    in_flight = data.get("in_flight", [])
    print_info("🔨 in_flight (" + str(len(in_flight)) + ")")
    if in_flight:
        for item in in_flight:
            print("    • " + str(item.get("proposal_id") or item.get("task_id")) + " | " + str(item.get("title", "Untitled")))
            print("      " + str(item.get("status", "unknown")) + " • started " + str(item.get("started_at", "?")))
    else:
        print("    (none)")
    print()

    show_cards("🏁 done_today", data.get("done_today", []), lambda card: str(card.get("status", "done")))


def output(data, fmt, table_fn=None, tree_fn=None, summary_fn=None):
    if fmt == "json":
        print_json(data)
    elif fmt == "table" and table_fn:
        table_fn(data)
    elif fmt == "tree" and tree_fn:
        tree_fn(data)
    elif fmt == "summary" and summary_fn:
        summary_fn(data)
    else:
        print_json(data)


# ---------------------------------------------------------------------------
# Table formatters for each entity type
# ---------------------------------------------------------------------------

def _print_proposals_table(data):
    proposals = data.get("proposals", [])
    if not proposals and "proposal" in data:
        proposals = [data["proposal"]]
    print_table(proposals, [
        ("id",            "ID",         14),
        ("title",         "Title",      42),
        ("status",        "Status",     12),
        ("idea_score",    "Score",       6),
        ("confidence",    "Conf",        8),
        ("intent_aligned","Aligned",     8),
    ], title="Proposals (" + str(len(proposals)) + ")")


def _print_tasks_table(data):
    tasks = data.get("tasks", [])
    if not tasks and "task" in data:
        tasks = [data["task"]]
    print_table(tasks, [
        ("id",          "ID",          14),
        ("title",       "Title",       40),
        ("status",      "Status",      12),
        ("priority",    "Pri",          4),
        ("effort",      "Effort",       7),
        ("source_type", "Source",      10),
        ("due_date",    "Due",         12),
    ], title="Tasks (" + str(len(tasks)) + ")")


def _print_intent_table(data):
    nodes = data.get("nodes", [])
    if not nodes and "node" in data:
        nodes = [data["node"]]
    print_table(nodes, [
        ("id",         "ID",         14),
        ("title",      "Title",      40),
        ("level",      "L",           3),
        ("level_name", "Level",      15),
        ("status",     "Status",     10),
        ("project_id", "Project",    14),
    ], title="Intent Nodes (" + str(len(nodes)) + ")")


def _print_gaps_table(data):
    gaps = data.get("gaps", [])
    if not gaps and "gap" in data:
        gaps = [data["gap"]]
    print_table(gaps, [
        ("id",          "ID",          14),
        ("description", "Description", 50),
        ("gap_type",    "Type",        20),
        ("severity",    "Sev",          4),
        ("status",      "Status",      10),
    ], title="Gaps (" + str(len(gaps)) + ")")


def _print_sessions_table(data):
    sessions = data.get("sessions", [])
    if not sessions and "session" in data:
        sessions = [data["session"]]
    print_table(sessions, [
        ("id",           "ID",        14),
        ("status",       "Status",    12),
        ("model",        "Model",      8),
        ("input_tokens", "In Tok",     8),
        ("output_tokens","Out Tok",    8),
        ("cost_usd",     "Cost",      10),
    ], title="Sessions (" + str(len(sessions)) + ")")


def _print_providers_table(data):
    providers = data.get("providers", [])
    print_table(providers, [
        ("id",           "Provider ID",  18),
        ("adapter",      "Adapter",      12),
        ("healthy",      "Healthy",       8),
        ("latency_ms",   "Latency(ms)",  12),
        ("quality_score","Quality",       8),
    ], title="Providers (" + str(len(providers)) + ")")


# ---------------------------------------------------------------------------
# Command: proposal
# ---------------------------------------------------------------------------

def cmd_proposal(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2:
        print_error("Usage: ema proposal <create|list|<id> <action>>")
        return 1

    sub = pos[1]

    if sub == "create":
        project_id = args.get("project-id") or args.get("project_id") or _default_project_id()
        title = args.get("title") or fixtures._PROPOSAL_TITLES[0]
        seed_id = None
        if args.has("seed-source"):
            seed = _find_or_create_seed(args.get("seed-source"), project_id)
            seed_id = seed["id"]
        parent_id = args.get("parent-id")
        status = args.get("status")

        p = fixtures.make_proposal(project_id, seed_id=seed_id,
                                    parent_proposal_id=parent_id,
                                    status=status, title=title)
        store.put("proposals", p)
        print_created(p["id"], "proposal")
        output({"proposal": p}, fmt, table_fn=_print_proposals_table)
        return 0

    elif sub == "list":
        code, data = mock_api.proposals_list(
            status=args.get("status"),
            project_id=args.get("project-id") or args.get("project_id"),
            tag=args.get("tag"),
            confidence_min=args.get("confidence-min"),
            intent_aligned=args.get("intent-aligned"),
            idea_score_min=args.get("idea-score-min"),
        )
        output(data, fmt, table_fn=_print_proposals_table)
        return 0

    elif len(pos) >= 3:
        pid = pos[1]
        action = pos[2]

        if action == "genealogy":
            code, data = mock_api.proposal_lineage(pid)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            if fmt == "tree":
                print_proposal_genealogy(data["lineage"], title="Genealogy: " + pid)
            else:
                output(data, fmt)
            return 0

        elif action == "approve":
            no_dispatch = args.has("no-dispatch")
            code, data = mock_api.proposal_approve(pid, auto_dispatch=not no_dispatch)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            task_id = data["task"]["id"]
            if data.get("execution"):
                exe = data["execution"]
                dispatch = data.get("dispatch", {})
                dispatch_id = dispatch.get("dispatch_id", "?")
                print_success(
                    "Proposal " + pid + " approved → task " + task_id +
                    " → dispatched to " + c(exe["agent_id"], GREEN) +
                    " [" + c(exe["model"], CYAN) + "]" +
                    " (dispatch_id=" + dispatch_id + ")"
                )
            elif data.get("dispatch_error"):
                print_success("Proposal " + pid + " approved → task " + task_id + " created")
                print_warn("Auto-dispatch failed: " + data["dispatch_error"])
                print_warn("Retry: ema tasks " + task_id + " dispatch")
            else:
                print_success("Proposal " + pid + " approved → task " + task_id + " created (dispatch skipped)")
            output(data, fmt, table_fn=_print_proposals_table)
            return 0

        elif action == "kill":
            code, data = mock_api.proposal_kill(pid)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            print_success("Proposal " + pid + " killed → kill pattern " + data["kill_pattern_id"])
            output(data, fmt)
            return 0

        elif action == "redirect":
            body = {}
            if args.has("angle"):
                body["angle"] = args.get("angle")
            code, data = mock_api.proposal_redirect(pid, body)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            print_success("Proposal " + pid + " redirected → " + str(len(data["seeds"])) + " new seeds")
            output(data, fmt)
            return 0

        elif action == "validate":
            code, data = mock_api.proposal_validate(pid)
            result = data.get("result", "unknown")
            if result == "accept":
                print_success("Validation passed for " + pid)
            else:
                issues = ", ".join(data.get("issues", []))
                print_warn("Validation rejected " + pid + ": " + issues)
            output(data, fmt)
            return 0

        elif action in ("get", "show"):
            code, data = mock_api.proposal_get(pid)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            output(data, fmt, table_fn=_print_proposals_table)
            return 0

        else:
            print_error("Unknown proposal action: " + action)
            return 1

    else:
        pid = pos[1]
        code, data = mock_api.proposal_get(pid)
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        output(data, fmt, table_fn=_print_proposals_table)
        return 0


# ---------------------------------------------------------------------------
# Command: desk
# ---------------------------------------------------------------------------

def cmd_desk(args):
    pos = args.pos
    fmt = "json" if args.has("json") else args.format()

    if len(pos) == 1:
        code, data = mock_api.desk_get()
        if fmt == "json":
            print_json(data)
        else:
            _print_desk_summary(data)
        return 0

    sub = pos[1]

    if sub == "options":
        if len(pos) < 4:
            print_error("Usage: ema desk options <proposal_id> <item_id>")
            return 1
        code, data = mock_api.proposal_input_options(pos[2], pos[3])
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        if fmt == "json":
            print_json(data)
        else:
            item = data["item"]
            print_header("Desk options for " + pos[2] + "/" + item["id"])
            print_info(item.get("label", item["id"]))
            if item.get("description"):
                print_info(item["description"])
            print()
            for option in item.get("options", []):
                print("  - " + option["id"] + " — " + option.get("label", option["id"]))
                if option.get("aliases"):
                    print("      aliases: " + ", ".join(option["aliases"]))
                if option.get("patterns"):
                    print("      patterns: " + ", ".join(option["patterns"]))
            if item.get("freeform_patterns"):
                print("  - freeform")
                print("      patterns: " + ", ".join(item["freeform_patterns"]))
        return 0

    if sub == "respond":
        if len(pos) < 5:
            print_error("Usage: ema desk respond <proposal_id> <item_id> <answer>")
            return 1
        answer = " ".join(pos[4:])
        code, data = mock_api.proposal_input_respond(pos[2], pos[3], answer)
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        if fmt == "json":
            print_json(data)
        else:
            item = data["item"]
            print_success(
                "Recorded " + item["id"] + " = " + str(item.get("normalized_answer")) +
                " (matched_by=" + str(item.get("matched_by")) + ")"
            )
            print_info("Gate status: " + data.get("gate_status", "unknown"))
            if data.get("blocked_items"):
                print_info("Still blocked by: " + ", ".join(data["blocked_items"]))
        return 0

    if sub == "approve":
        if len(pos) < 3:
            print_error("Usage: ema desk approve <proposal_id>")
            return 1
        code, data = mock_api.proposal_approve(pos[2])
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        print_success("Proposal " + pos[2] + " approved from desk")
        output(data, fmt, table_fn=_print_proposals_table)
        return 0

    if sub == "reject":
        if len(pos) < 3:
            print_error("Usage: ema desk reject <proposal_id> [--reason=...]")
            return 1
        code, data = mock_api.proposal_reject(pos[2], reason=args.get("reason"))
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        print_success("Proposal " + pos[2] + " rejected from desk")
        output(data, fmt, table_fn=_print_proposals_table)
        return 0

    if sub == "redirect":
        if len(pos) < 3:
            print_error("Usage: ema desk redirect <proposal_id> [--angle=...]")
            return 1
        body = {}
        if args.has("angle"):
            body["angle"] = args.get("angle")
        code, data = mock_api.proposal_redirect(pos[2], body)
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        print_success("Proposal " + pos[2] + " redirected from desk")
        output(data, fmt)
        return 0

    print_error("Unknown desk action: " + sub)
    return 1


# ---------------------------------------------------------------------------
# Command: task
# ---------------------------------------------------------------------------

def cmd_task(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2:
        print_error("Usage: ema task <create|list|<id> <action>>")
        return 1

    sub = pos[1]

    if sub == "create":
        if len(pos) < 3 and not args.has("title"):
            print_error("Usage: ema task create <title> [--description=...] [--intent=...]")
            return 1
        title = pos[2] if len(pos) >= 3 else args.get("title", "New task")
        body = {
            "title": title,
            "project_id": args.get("project-id") or _default_project_id(),
        }
        if args.has("description"):
            body["description"] = args.get("description")
        if args.has("status"):
            body["status"] = args.get("status")
        code, data = mock_api.task_create(body)
        if code not in (200, 201):
            print_error(data.get("message", str(data)))
            return 1
        print_created(data["task"]["id"], "task")
        if args.has("intent"):
            mock_api.task_link_intent(data["task"]["id"], args.get("intent"))
            print_info("Linked to intent " + args.get("intent"))
        output(data, fmt, table_fn=_print_tasks_table)
        return 0

    elif sub == "list":
        code, data = mock_api.tasks_list(
            status=args.get("status"),
            project_id=args.get("project-id") or args.get("project_id"),
        )
        output(data, fmt, table_fn=_print_tasks_table)
        return 0

    elif len(pos) >= 3:
        tid = pos[1]
        action = pos[2]

        if action == "route":
            code, data = mock_api.task_route(tid)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            if fmt == "table":
                print_header("Routing for task " + tid)
                print_info("Recommended agent:    " + c(data["recommended_agent"], GREEN + BOLD))
                print_info("Recommended provider: " + c(data["recommended_provider"], CYAN))
                print_info("Model:                " + c(data["recommended_model"], CYAN))
                print_info("Reasoning:            " + data["reasoning"])
                print()
                print_table(data.get("routing_estimates", []), [
                    ("provider_id",        "Provider",    18),
                    ("model",              "Model",       10),
                    ("estimated_cost_usd", "Est. Cost",   12, "right"),
                    ("estimated_latency_ms","Latency ms", 12, "right"),
                    ("quality_score",      "Quality",     10),
                    ("balanced_score",     "Balanced",    10),
                ], title="Routing Estimates")
            else:
                output(data, fmt)
            return 0

        elif action == "assign":
            if len(pos) < 4:
                print_error("Usage: ema task <id> assign <agent-id>")
                return 1
            agent_id = pos[3]
            code, data = mock_api.task_assign(tid, agent_id)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            print_success("Task " + tid + " assigned to agent " + agent_id)
            output(data, fmt, table_fn=_print_tasks_table)
            return 0

        elif action in ("get", "show"):
            code, data = mock_api.task_get(tid)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            output(data, fmt, table_fn=_print_tasks_table)
            return 0

        elif action == "dispatch":
            code, data = mock_api.task_dispatch(tid)
            if code == 422:
                print_warn(data.get("message", str(data)))
                return 0
            if code not in (200, 201):
                print_error(data.get("message", str(data)))
                return 1
            exe = data.get("execution", {})
            dispatch = data.get("dispatch", {})
            print_success(
                "Task " + tid + " dispatched → agent " + c(exe.get("agent_id", "?"), GREEN) +
                " [" + c(exe.get("model", "?"), CYAN) + "]" +
                " (dispatch_id=" + str(dispatch.get("dispatch_id", "?")) + ")"
            )
            output(data, fmt)
            return 0

        else:
            print_error("Unknown task action: " + action)
            return 1

    else:
        tid = pos[1]
        code, data = mock_api.task_get(tid)
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        output(data, fmt, table_fn=_print_tasks_table)
        return 0


# ---------------------------------------------------------------------------
# Command: intent
# ---------------------------------------------------------------------------

def cmd_intent(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2:
        print_error("Usage: ema intent <create|list|tree|edges|<id> <action>>")
        return 1

    sub = pos[1]

    if sub == "create":
        if len(pos) < 3 and not args.has("title"):
            print_error("Usage: ema intent create <title> [--level=0-4] [--parent-id=...]")
            return 1
        title = pos[2] if len(pos) >= 3 else args.get("title", "New intent node")
        level = int(args.get("level", 0))
        body = {
            "title": title,
            "level": level,
            "project_id": args.get("project-id") or _default_project_id(),
        }
        if args.has("parent-id"):
            body["parent_id"] = args.get("parent-id")
        if args.has("description"):
            body["description"] = args.get("description")
        code, data = mock_api.intent_create(body)
        if code not in (200, 201):
            print_error(data.get("message", str(data)))
            return 1
        print_created(data["node"]["id"], "intent node")
        output(data, fmt, table_fn=_print_intent_table)
        return 0

    elif sub == "list":
        code, data = mock_api.intent_list(
            project_id=args.get("project-id") or args.get("project_id"),
            level=args.get("level"),
            parent_id=args.get("parent-id"),
        )
        output(data, fmt, table_fn=_print_intent_table)
        return 0

    elif sub == "tree":
        code, data = mock_api.intent_tree(
            project_id=args.get("project-id") or args.get("project_id"),
        )
        if fmt in ("tree", "table"):
            flat = _flatten_tree(data.get("tree", []))
            print_tree(flat, title="Intent Tree")
        else:
            output(data, fmt)
        return 0

    elif sub == "edges":
        if len(pos) >= 3 and pos[2] == "create":
            if len(pos) < 5:
                print_error("Usage: ema intent edges create <source-id> <target-id> [--relationship=...]")
                return 1
            body = {
                "source_id": pos[3],
                "target_id": pos[4],
                "relationship": args.get("relationship", "depends-on"),
            }
            code, data = mock_api.intent_edge_create(body)
            if code not in (200, 201):
                print_error(data.get("message", str(data)))
                return 1
            print_created(data["edge"]["id"], "intent edge")
            output(data, fmt)
            return 0
        else:
            print_error("Usage: ema intent edges create <source-id> <target-id>")
            return 1

    elif len(pos) >= 3:
        node_id = pos[1]
        action = pos[2]

        if action == "link-task":
            if len(pos) < 4:
                print_error("Usage: ema intent <id> link-task <task-id>")
                return 1
            task_id = pos[3]
            code, data = mock_api.task_link_intent(task_id, node_id)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            print_success("Task " + task_id + " linked to intent " + node_id)
            output(data, fmt)
            return 0

        elif action in ("get", "show"):
            node = store.find("intent_nodes", node_id)
            if not node:
                print_error("IntentNode " + node_id + " not found")
                return 1
            output({"node": node}, fmt, table_fn=_print_intent_table)
            return 0

        elif action == "update":
            body = {k.replace("-", "_"): v for k, v in args.flags.items()
                    if k not in ("format",)}
            code, data = mock_api.intent_update(node_id, body)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            print_success("Intent node " + node_id + " updated")
            output(data, fmt)
            return 0

        elif action == "delete":
            code, data = mock_api.intent_delete(node_id)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            print_success("Intent node " + node_id + " deleted (edges cascaded)")
            return 0

        else:
            print_error("Unknown intent action: " + action)
            return 1

    else:
        node_id = pos[1]
        node = store.find("intent_nodes", node_id)
        if not node:
            print_error("IntentNode " + node_id + " not found")
            return 1
        output({"node": node}, fmt, table_fn=_print_intent_table)
        return 0


# ---------------------------------------------------------------------------
# Command: gaps
# ---------------------------------------------------------------------------

def cmd_gaps(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2 or pos[1] == "list":
        code, data = mock_api.gaps_list(
            severity=args.get("severity"),
            status=args.get("status"),
            project_id=args.get("project-id") or args.get("project_id"),
        )
        output(data, fmt, table_fn=_print_gaps_table)
        return 0

    elif len(pos) >= 3:
        gap_id = pos[1]
        action = pos[2]

        if action == "resolve":
            code, data = mock_api.gap_resolve(gap_id)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            print_success("Gap " + gap_id + " resolved")
            output(data, fmt)
            return 0

        elif action == "create-task":
            code, data = mock_api.gap_create_task(gap_id)
            if code not in (200, 201):
                print_error(data.get("message", str(data)))
                return 1
            print_created(data["task"]["id"], "task from gap")
            output(data, fmt, table_fn=_print_tasks_table)
            return 0

        else:
            print_error("Unknown gaps action: " + action)
            return 1

    else:
        print_error("Usage: ema gaps [list|<id> <resolve|create-task>]")
        return 1


# ---------------------------------------------------------------------------
# Command: token-usage
# ---------------------------------------------------------------------------

def cmd_token_usage(args):
    fmt = args.format()
    code, data = mock_api.token_usage(
        days=args.get("days", 30),
        model=args.get("model"),
        context=args.get("context"),
        project_id=args.get("project-id"),
    )
    output(data, fmt, summary_fn=print_token_summary)
    return 0


# ---------------------------------------------------------------------------
# Command: projects
# ---------------------------------------------------------------------------

def cmd_projects(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2 or pos[1] == "list":
        code, data = mock_api.projects_list()
        if fmt == "table":
            print_table(data.get("projects", []), [
                ("id",     "ID",          14),
                ("name",   "Name",        24),
                ("status", "Status",      12),
                ("slug",   "Slug",        20),
                ("linked_path", "Path",   36),
            ], title="Projects (" + str(len(data.get("projects", []))) + ")")
        else:
            output(data, fmt)
        return 0

    elif len(pos) >= 3:
        pid = pos[1]
        action = pos[2]
        if action == "health":
            code, data = mock_api.project_health(pid)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            if fmt == "summary":
                print_project_health(data["project"], data["health"])
            else:
                output(data, fmt)
            return 0
        else:
            print_error("Unknown project action: " + action)
            return 1

    else:
        pid = pos[1]
        code, data = mock_api.project_get(pid)
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        output(data, fmt)
        return 0


# ---------------------------------------------------------------------------
# Command: session
# ---------------------------------------------------------------------------

def cmd_session(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2 or pos[1] == "list":
        code, data = mock_api.sessions_list_api(
            status=args.get("status"),
            project_path=args.get("project-path"),
        )
        output(data, fmt, table_fn=_print_sessions_table)
        return 0

    elif len(pos) >= 3:
        sid = pos[1]
        action = pos[2]

        if action == "messages":
            code, data = mock_api.session_messages(sid)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            if fmt == "table":
                print_table(data.get("messages", []), [
                    ("id",         "ID",      14),
                    ("role",       "Role",     9),
                    ("content",    "Content", 60),
                    ("inserted_at","Time",    22),
                ], title="Messages in session " + sid)
            else:
                output(data, fmt)
            return 0

        elif action == "fork":
            body = {}
            if args.has("to-message"):
                body["message_id"] = args.get("to-message")
            else:
                msgs_code, msgs_data = mock_api.session_messages(sid)
                msgs = msgs_data.get("messages", [])
                if msgs:
                    body["message_id"] = msgs[-1]["id"]
            code, data = mock_api.session_fork(sid, body)
            if code not in (200, 201):
                print_error(data.get("message", str(data)))
                return 1
            print_created(data["session"]["id"], "forked session")
            output(data, fmt, table_fn=_print_sessions_table)
            return 0

        elif action == "resume":
            code, data = mock_api.session_resume(sid)
            if code != 200:
                print_error(data.get("message", str(data)))
                return 1
            print_success("Session " + sid + " marked active")
            output(data, fmt)
            return 0

        else:
            print_error("Unknown session action: " + action)
            return 1

    else:
        sid = pos[1]
        s = store.find("ai_sessions", sid)
        if not s:
            print_error("Session " + sid + " not found")
            return 1
        output({"session": s}, fmt, table_fn=_print_sessions_table)
        return 0


# ---------------------------------------------------------------------------
# Command: providers
# ---------------------------------------------------------------------------

def cmd_providers(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2 or pos[1] == "list":
        code, data = mock_api.providers_list()
        output(data, fmt, table_fn=_print_providers_table)
        return 0

    elif len(pos) >= 3 and pos[2] == "health-check":
        code, data = mock_api.provider_health_check(pos[1])
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        healthy = data.get("healthy", False)
        color = GREEN if healthy else RED
        label = "healthy" if healthy else "unhealthy"
        latency = str(data.get("latency_ms", "?"))
        print_info("Provider " + pos[1] + ": " + c(label, color) + " (" + latency + "ms)")
        output(data, fmt)
        return 0

    return 0


# ---------------------------------------------------------------------------
# Command: routing
# ---------------------------------------------------------------------------

def cmd_routing(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) >= 2 and pos[1] == "estimate":
        prompt = args.get("prompt", "Test prompt for routing estimation")
        code, data = mock_api.routing_estimate({
            "prompt": prompt,
            "task_type": args.get("task-type", "creative"),
            "strategy": args.get("strategy", "balanced"),
        })
        if fmt == "table":
            print_header("Routing Estimate")
            print_info("Recommended: " + c(data.get("recommended", "N/A"), GREEN + BOLD))
            print_table(data.get("estimates", []), [
                ("provider_id",         "Provider",     18),
                ("model",               "Model",        10),
                ("estimated_cost_usd",  "Est. Cost",    12),
                ("estimated_latency_ms","Latency ms",   12),
                ("quality_score",       "Quality",      10),
                ("balanced_score",      "Balanced",     10),
            ], title="All Estimates")
        else:
            output(data, fmt)
        return 0

    print_error("Usage: ema routing estimate [--prompt=...] [--task-type=...] [--strategy=...]")
    return 1


# ---------------------------------------------------------------------------
# Command: seeds
# ---------------------------------------------------------------------------

def cmd_seeds(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2 or pos[1] == "list":
        code, data = mock_api.seeds_list(
            project_id=args.get("project-id"),
            active=args.get("active"),
            seed_type=args.get("seed-type"),
        )
        if fmt == "table":
            print_table(data.get("seeds", []), [
                ("id",        "ID",           14),
                ("name",      "Name",         36),
                ("seed_type", "Type",         10),
                ("schedule",  "Schedule",     18),
                ("active",    "Active",        7),
                ("run_count", "Runs",          6),
            ], title="Seeds (" + str(len(data.get("seeds", []))) + ")")
        else:
            output(data, fmt)
        return 0

    elif pos[1] == "create":
        if len(pos) < 3 and not args.has("name"):
            print_error("Usage: ema seeds create <name> [--prompt=...] [--project-id=...]")
            return 1
        name = pos[2] if len(pos) >= 3 else args.get("name")
        body = {
            "name": name,
            "prompt_template": args.get("prompt", "Analyze {{project_name}} for " + name),
            "project_id": args.get("project-id") or _default_project_id(),
            "seed_type": args.get("type", "cron"),
        }
        code, data = mock_api.seed_create(body)
        if code not in (200, 201):
            print_error(data.get("message", str(data)))
            return 1
        print_created(data["seed"]["id"], "seed")
        output(data, fmt)
        return 0

    return 0


# ---------------------------------------------------------------------------
# Command: engine
# ---------------------------------------------------------------------------

def cmd_engine(args):
    pos = args.pos
    if len(pos) < 2:
        print_error("Usage: ema engine <pause|resume>")
        return 1
    if pos[1] == "pause":
        mock_api.engine_pause()
        print_success("Proposal engine paused")
        return 0
    elif pos[1] == "resume":
        mock_api.engine_resume()
        print_success("Proposal engine resumed")
        return 0
    return 1


# ---------------------------------------------------------------------------
# Command: superman
# ---------------------------------------------------------------------------

def cmd_superman(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2:
        print_error("Usage: ema superman <status|index|ask|gaps|intent-graph>")
        return 1

    sub = pos[1]
    if sub == "status":
        code, data = mock_api.superman_status()
        output(data, fmt)
        return 0
    elif sub == "index":
        path = args.get("path", "/home/trajan/Projects/ema")
        code, data = mock_api.superman_index({"path": path})
        print_success("Indexed " + str(data["file_count"]) + " files")
        output(data, fmt)
        return 0
    elif sub == "ask":
        if len(pos) < 3 and not args.has("question"):
            print_error("Usage: ema superman ask <question>")
            return 1
        question = " ".join(pos[2:]) if len(pos) >= 3 else args.get("question")
        code, data = mock_api.superman_ask({"question": question})
        if fmt == "table":
            print_header("Superman Answer")
            print("\n  " + data["answer"] + "\n")
            print_table(data.get("references", []), [
                ("file", "File", 60),
                ("line", "Line", 6),
            ], title="References")
        else:
            output(data, fmt)
        return 0
    elif sub == "gaps":
        code, data = mock_api.superman_gaps()
        if fmt == "table":
            print_table(data.get("gaps", []), [
                ("type",        "Type",        16),
                ("file",        "File",        50),
                ("description", "Description", 60),
            ], title="Code Intelligence Gaps")
        else:
            output(data, fmt)
        return 0
    elif sub in ("intent-graph", "intent_graph"):
        code, data = mock_api.superman_intent_graph()
        output(data, fmt)
        return 0
    else:
        print_error("Unknown superman subcommand: " + sub)
        return 1


# ---------------------------------------------------------------------------
# Command: executions — view dispatch lifecycle records
# ---------------------------------------------------------------------------

def cmd_executions(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2 or pos[1] == "list":
        code, data = mock_api.executions_list(
            project_id=args.get("project-id"),
            status=args.get("status"),
            agent_id=args.get("agent"),
        )
        if fmt == "table":
            execs = data.get("executions", [])
            print_table(execs, [
                ("id",          "ID",           22),
                ("agent_id",    "Agent",        12),
                ("model",       "Model",        10),
                ("status",      "Status",       16),
                ("proposal_id", "Proposal",     22),
                ("task_id",     "Task",         22),
                ("inserted_at", "Dispatched",   22),
            ], title="Executions (" + str(len(execs)) + ")")
        else:
            output(data, fmt)
        return 0

    exe_id = pos[1]
    action = pos[2] if len(pos) >= 3 else "get"

    if action in ("get", "show") or len(pos) == 2:
        code, data = mock_api.execution_get(exe_id)
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        output(data, fmt)
        return 0

    elif action == "complete":
        body = {
            "success": not args.has("failed"),
            "summary": args.get("summary", "Agent completed task"),
            "files_created": [],
            "files_modified": [],
            "quality_score": int(args.get("quality", 8)),
        }
        code, data = mock_api.execution_complete(exe_id, body)
        if code != 200:
            print_error(data.get("message", str(data)))
            return 1
        status = data["execution"]["status"]
        print_success("Execution " + exe_id + " marked as " + status)
        output(data, fmt)
        return 0

    else:
        print_error("Unknown executions action: " + action)
        return 1


# ---------------------------------------------------------------------------
# Command: openclaw dispatch
# ---------------------------------------------------------------------------

def cmd_openclaw(args):
    pos = args.pos
    fmt = args.format()

    if len(pos) < 2:
        print_error("Usage: ema openclaw <dispatch|dispatch-status>")
        return 1

    if pos[1] == "dispatch":
        if not args.has("agent-id") or not args.has("task"):
            print_error("Usage: ema openclaw dispatch --agent-id=... --task=...")
            return 1
        body = {
            "agent_id": args.get("agent-id"),
            "task": args.get("task"),
        }
        code, data = mock_api.openclaw_dispatch(body)
        print_created(data["dispatch_id"], "dispatch")
        output(data, fmt)
        return 0

    elif pos[1] == "dispatch-status":
        if len(pos) < 3:
            print_error("Usage: ema openclaw dispatch-status <id>")
            return 1
        code, data = mock_api.openclaw_dispatch_status(pos[2])
        output(data, fmt)
        return 0

    return 0


# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------

def cmd_scenario(args):
    pos = args.pos
    if len(pos) < 2:
        print_header("Available Scenarios")
        scenarios = [
            ("full-proposal-lifecycle", "create → validate → approve → execute"),
            ("intent-mapping",          "create 5-level tree, create tasks, link"),
            ("session-continuity",      "create session, fork, resume"),
            ("token-spike",             "generate token events, show usage trends"),
            ("provider-failover",       "simulate provider health changes"),
        ]
        for name, desc in scenarios:
            print_info(c(name, BOLD) + " — " + desc)
        return 0

    scenario = pos[1]
    runners = {
        "full-proposal-lifecycle": _scenario_proposal_lifecycle,
        "intent-mapping":          _scenario_intent_mapping,
        "session-continuity":      _scenario_session_continuity,
        "token-spike":             _scenario_token_spike,
        "provider-failover":       _scenario_provider_failover,
    }
    runner = runners.get(scenario)
    if not runner:
        print_error("Unknown scenario: " + scenario)
        return 1
    return runner()


def _scenario_proposal_lifecycle():
    """
    End-to-end scenario: seed → proposal pipeline → approve → auto-dispatch → agent receives task → result tracked.

    Tests:
    - Proposal approval triggers auto-dispatch (no manual steps)
    - Task gets status=dispatched after approval
    - Execution record created with agent, model, dispatch_id
    - Agent can signal completion via execution_complete
    - Outcome is tracked in usage_records (learning loop placeholder)
    """
    print_header("Scenario: Full Proposal Lifecycle (with Auto-Dispatch)")
    project_id = _default_project_id()

    print_info("Step 1: Create a seed source")
    seed = fixtures.make_seed(project_id)
    store.put("seeds", seed)
    print_created(seed["id"], "seed")

    print_info("Step 2: Create proposal from seed")
    prop = fixtures.make_proposal(project_id, seed_id=seed["id"], status="draft")
    prop["title"] = "Implement auto-dispatch wiring for EMA execution loop"
    prop["summary"] = "Wire proposal approval to automatically route and dispatch tasks to agents via OpenClaw"
    store.put("proposals", prop)
    print_created(prop["id"], "proposal")

    stages = ["refined", "debated", "scored", "queued"]
    for i, stage in enumerate(stages, 1):
        print_info("Step 3." + str(i) + ": Pipeline stage → " + stage)
        prop["status"] = stage
        prop["updated_at"] = fixtures.now_iso()
        store.put("proposals", prop)

    print_info("Step 4: Validate proposal (quality gate)")
    code, data = mock_api.proposal_validate(prop["id"])
    result = data.get("result", "unknown")
    color = GREEN if result == "accept" else YELLOW
    print_info("  Validation result: " + c(result, color))
    if result != "accept":
        for issue in data.get("issues", []):
            print_warn("  Issue: " + issue)

    print_info("Step 5: Approve proposal → AUTO-DISPATCH to agent (no manual steps)")
    code, data = mock_api.proposal_approve(prop["id"], auto_dispatch=True)
    if code != 200:
        print_error("Approval failed: " + str(data))
        return 1

    task_id = data["task"]["id"]
    print_created(task_id, "task")

    if data.get("execution"):
        exe = data["execution"]
        dispatch = data.get("dispatch", {})
        print_info("  ↳ Auto-routed to agent: " + c(exe["agent_id"], GREEN + BOLD))
        print_info("  ↳ Model: " + c(exe["model"], CYAN))
        print_info("  ↳ Provider: " + exe.get("provider", "?"))
        print_info("  ↳ Dispatch ID: " + c(dispatch.get("dispatch_id", "?"), GOLD))
        print_info("  ↳ Execution ID: " + c(exe["id"], MAGENTA))
        print_info("  ↳ Routing reason: " + exe.get("routing_reason", ""))
        execution_id = exe["id"]
    elif data.get("dispatch_error"):
        print_warn("  Auto-dispatch failed: " + data["dispatch_error"])
        print_warn("  Task was created but needs manual dispatch: ema task " + task_id + " dispatch")
        execution_id = None
    else:
        print_warn("  Dispatch was skipped.")
        execution_id = None

    print_info("Step 6: Verify task status is 'dispatched'")
    _, task_data = mock_api.task_get(task_id)
    task_status = task_data["task"]["status"]
    if task_status == "dispatched":
        print_info("  ✓ Task status: " + c(task_status, GREEN))
    else:
        print_warn("  Task status: " + c(task_status, YELLOW) + " (expected 'dispatched')")

    if execution_id:
        print_info("Step 7: List executions (dispatch board)")
        _, exec_data = mock_api.executions_list(project_id=project_id)
        print_info("  Total executions: " + str(exec_data["total"]))
        for e in exec_data["executions"][:3]:
            print_info("  [" + e["status"] + "] " + e["id"] + " → " + e["agent_id"] + "/" + e["model"])

        print_info("Step 8: Simulate agent completion (execution_complete)")
        _, complete_data = mock_api.execution_complete(execution_id, {
            "success": True,
            "summary": "Auto-dispatch wiring implemented in mock_api.py",
            "files_created": ["cli/ema_cli/mock_api.py"],
            "quality_score": 9,
        })
        print_info("  ✓ Execution status: " + c(complete_data["execution"]["status"], GREEN))
        print_info("  ✓ Task status: " + c(
            store.find("tasks", task_id).get("status", "?"), GREEN
        ))
        print_info("  ✓ Outcome recorded: " + complete_data.get("outcome", {}).get("id", "?"))
        print_info("  ✓ PubSub event (in real Elixir): " +
                   complete_data.get("outcome", {}).get("pubsub_event", "?"))

    print_info("Step 9: Show proposal genealogy")
    code, gen_data = mock_api.proposal_lineage(prop["id"])
    print_proposal_genealogy(gen_data["lineage"], title="Proposal Genealogy")

    print_success(
        "Full lifecycle complete: seed → proposal → approve → AUTO-DISPATCH → agent receives task → result tracked"
    )
    print_info("")
    print_info("Flow diagram:")
    print_info("  proposal.status=queued")
    print_info("  → POST /api/proposals/:id/approve")
    print_info("  → proposal.status=approved")
    print_info("  → task created (status=proposed)")
    print_info("  → SmartRouter.route(task) → agent_id, model")
    print_info("  → execution record created (status=queued)")
    print_info("  → POST /api/openclaw/dispatch → dispatch_id")
    print_info("  → task.status=dispatched, execution.status=dispatched")
    print_info("  → agent receives task, works, POSTs /api/executions/:id/complete")
    print_info("  → execution.status=completed, task.status=done")
    print_info("  → Outcome tracked → PubSub executions:all broadcast")
    print_info("  → LearningLoop.analyze(execution_id)  [Elixir: not mocked]")
    return 0


def _scenario_intent_mapping():
    print_header("Scenario: Intent Mapping (5-Level Tree)")
    project_id = _default_project_id()

    print_info("Step 1: Create 5-level intent hierarchy")
    tree = fixtures.make_intent_tree(project_id)
    # Add extra sibling nodes for breadth
    for level in range(1, 5):
        extra = fixtures.make_intent_node(project_id, level=level,
                                           parent_id=tree[level - 1]["id"])
        tree.append(extra)
    for node in tree:
        store.put("intent_nodes", node)
        print_info("  L" + str(node["level"]) + " [" + node["level_name"] + "]: " + node["title"][:50])

    print_info("Step 2: Create typed edges")
    rels = ["depends-on", "implements", "enables", "blocks"]
    for i in range(len(tree) - 1):
        if i < 5:  # main chain edges
            edge = fixtures.make_intent_edge(tree[i]["id"], tree[i + 1]["id"], rels[i % len(rels)])
            store.put("intent_edges", edge)
            print_info("  " + tree[i]["id"] + " --[" + edge["relationship"] + "]--> " + tree[i + 1]["id"])

    print_info("Step 3: Create tasks and link to intent nodes")
    for node in tree[2:5]:
        task = fixtures.make_task(project_id, title="Implement: " + node["title"][:50])
        store.put("tasks", task)
        mock_api.task_link_intent(task["id"], node["id"])
        print_info("  Task " + task["id"] + " → intent " + node["id"])

    print_info("Step 4: Render intent tree")
    nodes = [n for n in store.all_items("intent_nodes") if n.get("project_id") == project_id]
    print_tree(nodes, title="Intent Tree for " + project_id)

    print_success("Intent mapping complete: " + str(len(tree)) + " nodes")
    return 0


def _scenario_session_continuity():
    print_header("Scenario: Session Continuity (Fork & Resume)")

    print_info("Step 1: Create AI session")
    session = fixtures.make_ai_session(status="active")
    store.put("ai_sessions", session)
    print_created(session["id"], "session")

    print_info("Step 2: Add conversation messages")
    msgs = fixtures.make_session_messages(session["id"], count=6)
    for m in msgs:
        store.put("ai_session_messages", m)
        role_color = CYAN if m["role"] == "user" else GREEN
        content_preview = m["content"][:60] + "..." if len(m["content"]) > 60 else m["content"]
        print_info("  " + c(m["role"], role_color) + ": " + content_preview)

    print_info("Step 3: Fork session at message 3")
    fork_msg = msgs[2] if len(msgs) > 2 else msgs[-1]
    code, data = mock_api.session_fork(session["id"], {"message_id": fork_msg["id"]})
    forked = data["session"]
    print_created(forked["id"], "forked session (parent=" + session["id"] + ")")

    print_info("Step 4: Resume forked session")
    mock_api.session_resume(forked["id"])
    print_success("Session " + forked["id"] + " resumed")

    print_info("Step 5: Session list showing lineage")
    code, data = mock_api.sessions_list_api()
    _print_sessions_table(data)

    print_success("Session continuity scenario complete")
    return 0


def _scenario_token_spike():
    print_header("Scenario: Token Usage Spike Detection")
    project_id = _default_project_id()

    print_info("Step 1: Generate normal token usage (20 events)")
    for _ in range(20):
        te = fixtures.make_token_event(project_id)
        store.put("token_events", te)

    print_info("Step 2: Generate spike events (high-cost opus calls)")
    import random
    for _ in range(5):
        te = fixtures.make_token_event(project_id, model="opus", context="proposal")
        te["input_tokens"] = random.randint(10000, 50000)
        te["output_tokens"] = random.randint(5000, 20000)
        te["cost_usd"] = round((te["input_tokens"] * 15.0 + te["output_tokens"] * 75.0) / 1_000_000, 4)
        te["inserted_at"] = fixtures.past_iso(random.uniform(0, 2))
        store.put("token_events", te)

    print_info("Step 3: Show usage summary")
    code, data = mock_api.token_usage(days=7, project_id=project_id)
    print_token_summary(data)

    print_success("Token spike scenario complete")
    return 0


def _scenario_provider_failover():
    print_header("Scenario: Provider Failover")

    print_info("Step 1: Register providers")
    providers = fixtures.make_default_providers()
    for p in providers:
        store.put("providers", p)
        healthy = c("healthy", GREEN) if p["healthy"] else c("unhealthy", RED)
        print_info("  " + p["id"] + ": " + healthy)

    print_info("Step 2: Health check all providers")
    for p in providers:
        code, data = mock_api.provider_health_check(p["id"])
        healthy = c("✓", GREEN) if data["healthy"] else c("✗", RED)
        print_info("  " + p["id"] + " " + healthy + " " + str(data["latency_ms"]) + "ms")

    print_info("Step 3: Simulate provider failure")
    bad = store.find("providers", "claude-work")
    if bad:
        bad["healthy"] = False
        bad["latency_ms"] = 9999
        store.put("providers", bad)
    print_warn("Provider claude-work marked unhealthy")

    print_info("Step 4: Get routing estimate (should avoid failed provider)")
    code, data = mock_api.routing_estimate({"prompt": "Generate a proposal for improving the vault"})
    print_info("Recommended: " + c(data["recommended"], GREEN + BOLD))
    print_table(data["estimates"], [
        ("provider_id",         "Provider",     18),
        ("model",               "Model",        10),
        ("estimated_cost_usd",  "Est. Cost",    12),
        ("quality_score",       "Quality",      10),
        ("balanced_score",      "Balanced",     10),
    ], title="Routing with failover")

    print_success("Provider failover scenario complete")
    return 0


# ---------------------------------------------------------------------------
# Interactive shell
# ---------------------------------------------------------------------------

def cmd_shell(args):
    print_header("EMA Interactive Shell")
    print_info("Type commands without 'ema' prefix. Type 'help' or 'exit'.")
    print()

    import readline
    try:
        readline.read_history_file(os.path.expanduser("~/.ema_history"))
    except Exception:
        pass

    while True:
        try:
            line = input(c("ema> ", GOLD + BOLD))
        except (EOFError, KeyboardInterrupt):
            print()
            break

        line = line.strip()
        if not line:
            continue
        if line in ("exit", "quit", "q"):
            break
        if line == "help":
            _print_help()
            continue

        try:
            tokens = shlex.split(line)
        except ValueError:
            tokens = line.split()

        rc = dispatch(tokens)

    try:
        readline.write_history_file(os.path.expanduser("~/.ema_history"))
    except Exception:
        pass
    return 0


# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

def _print_help():
    print_header("EMA CLI — Commands")
    cmds = [
        ("proposal create [--title=...] [--seed-source=...]", "Create a new proposal"),
        ("proposal list [--status=...] [--format=table]",     "List proposals"),
        ("proposal <id> genealogy [--format=tree]",           "Show proposal lineage"),
        ("proposal <id> approve",                              "Approve → create task"),
        ("proposal <id> kill",                                 "Kill proposal"),
        ("proposal <id> redirect [--angle=...]",               "Redirect → 3 new seeds"),
        ("proposal <id> validate",                             "Run validation gate"),
        ("", ""),
        ("desk [--json]",                                       "Show unified proposal desk"),
        ("desk options <proposal_id> <item_id>",                "Show accepted response grammar"),
        ("desk respond <proposal_id> <item_id> <answer>",       "Answer a desk item naturally"),
        ("desk approve|reject|redirect <proposal_id>",          "Act on proposal gate state"),
        ("", ""),
        ("task create <title> [--description=...] [--intent=...]", "Create task"),
        ("task list [--status=...] [--format=table]",              "List tasks"),
        ("task <id> route",                                         "Get routing recommendation"),
        ("task <id> assign <agent-id>",                             "Assign task to agent"),
        ("", ""),
        ("intent create <title> [--level=0-4] [--parent-id=...]", "Create intent node"),
        ("intent list [--project-id=...] [--level=...]",           "List intent nodes"),
        ("intent tree [--project-id=...]",                          "Show full intent tree"),
        ("intent <id> link-task <task-id>",                         "Link task to intent"),
        ("intent edges create <src> <tgt> [--relationship=...]",    "Create typed edge"),
        ("", ""),
        ("gaps list [--severity=1-5] [--status=...]",   "List gaps"),
        ("gaps <id> resolve",                            "Resolve a gap"),
        ("gaps <id> create-task",                        "Create task from gap"),
        ("", ""),
        ("token-usage [--days=30] [--model=...] [--format=summary]", "Token usage report"),
        ("", ""),
        ("projects list [--format=table]",       "List projects"),
        ("projects <id> health [--format=summary]", "Show project health"),
        ("", ""),
        ("session list [--status=...]",           "List AI sessions"),
        ("session <id> messages [--format=table]", "Show session messages"),
        ("session <id> fork [--to-message=...]",   "Fork session"),
        ("session <id> resume",                    "Resume session"),
        ("", ""),
        ("providers list [--format=table]",        "List providers"),
        ("providers <id> health-check",            "Health check provider"),
        ("routing estimate [--prompt=...]",        "Get routing estimate"),
        ("", ""),
        ("seeds list [--format=table]",            "List seeds"),
        ("seeds create <name> [--prompt=...]",     "Create seed"),
        ("engine pause | resume",                  "Pause/resume proposal engine"),
        ("", ""),
        ("superman status|index|ask|gaps|intent-graph", "Superman integration"),
        ("openclaw dispatch --agent-id=... --task=...", "OpenClaw dispatch"),
        ("", ""),
        ("scenario <name>",                "Run pre-built test scenario"),
        ("seed",                            "Seed store with realistic data"),
        ("reset",                           "Clear all state"),
        ("shell",                           "Interactive REPL"),
    ]
    for cmd, desc in cmds:
        if not cmd:
            print()
        else:
            print("  " + c(cmd, CYAN) + "  " + c(desc, GREY))
    print()


# ---------------------------------------------------------------------------
# Main dispatch
# ---------------------------------------------------------------------------

COMMANDS = {
    "proposal":    cmd_proposal,
    "desk":        cmd_desk,
    "task":        cmd_task,
    "intent":      cmd_intent,
    "gaps":        cmd_gaps,
    "token-usage": cmd_token_usage,
    "projects":    cmd_projects,
    "session":     cmd_session,
    "providers":   cmd_providers,
    "routing":     cmd_routing,
    "seeds":       cmd_seeds,
    "engine":      cmd_engine,
    "superman":    cmd_superman,
    "executions":  cmd_executions,
    "execution":   cmd_executions,
    "openclaw":    cmd_openclaw,
    "scenario":    cmd_scenario,
    "shell":       cmd_shell,
}


def dispatch(argv):
    """Dispatch a command from argv tokens."""
    if not argv:
        _print_help()
        return 0

    args = parse_args(argv)
    if not args.pos:
        _print_help()
        return 0

    cmd = args.pos[0]

    # Special commands
    if cmd == "help" or args.has("help"):
        _print_help()
        return 0

    if cmd == "seed":
        from .commands.seed_data import seed_all
        print_header("Seeding store with test data...")
        counts = seed_all()
        for coll, count in counts.items():
            print_info(coll + ": " + str(count))
        print_success("Store seeded")
        return 0

    if cmd == "reset":
        store.clear_all()
        print_success("All state cleared")
        return 0

    if cmd == "version":
        from . import __version__
        print("ema " + __version__)
        return 0

    handler = COMMANDS.get(cmd)
    if not handler:
        print_error("Unknown command: " + cmd)
        print_info("Run 'ema help' for available commands")
        return 1

    return handler(args)


def main():
    rc = dispatch(sys.argv[1:])
    sys.exit(rc or 0)


if __name__ == "__main__":
    # Support running as: python3 ema_cli/cli.py [args]
    import importlib
    import ema_cli  # ensure package context
    main()
