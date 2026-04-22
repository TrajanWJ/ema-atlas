"""
ema context — Shared context package commands.
Makes real HTTP calls to EMA daemon shared-context endpoints.
"""
from .. import client
from ..client import DaemonError
from ..output import (
    print_json, print_error, print_info,
    c, BOLD, CYAN, GREY, GOLD, GREEN, YELLOW, DIM,
)


def _daemon_unreachable(e: DaemonError):
    host = e.host
    print_error(f"Cannot reach EMA daemon at {host}")
    print_info(f"  → Try: cd ~/Projects/ema/daemon && mix phx.server")
    print_info(f"  → Or:  ema status")


def _resolve_project_id(project_ref):
    """Resolve project slug/name/id to canonical project id."""
    code, data = client.get("/api/projects")
    if code != 200:
        return None

    projects = data.get("projects", data.get("data", []))
    for p in projects:
        if project_ref in (p.get("id"), p.get("slug"), p.get("name")):
            return p.get("id")
    return None


def _print_summary(pkg):
    summary = pkg.get("summary", {})
    host_truth = pkg.get("host_truth", {})
    counts = host_truth.get("counts", {})
    subject = pkg.get("subject", {})

    print()
    print(c(f"  {subject.get('title', 'Context Package')}", BOLD + CYAN))
    print(c(f"  kind={subject.get('kind', '?')}  id={subject.get('id', '?')}", GREY))
    print()
    print(c(f"  Summary", GOLD))
    print(f"    {summary.get('one_line', '(none)')}")
    if summary.get("top_actionable_issue"):
        print(f"    Top issue: {summary.get('top_actionable_issue')}")
    if summary.get("recommended_next_step"):
        print(f"    Next:     {summary.get('recommended_next_step')}")

    if counts:
        print()
        print(c("  Host truth", GOLD))
        print(f"    Status:           {host_truth.get('status', 'unknown')}")
        print(f"    Active projects:  {counts.get('active_projects', '—')}")
        print(f"    Pending tasks:    {counts.get('pending_tasks', '—')}")
        print(f"    Open proposals:   {counts.get('open_proposals', '—')}")
        print(f"    Running agents:   {counts.get('running_agents', '—')}")
        print(f"    Failed executions:{counts.get('failed_executions', '—')}")

    tasks = pkg.get("tasks", {})
    priority_items = tasks.get("priority_items") or tasks.get("recent") or []
    if priority_items:
        print()
        print(c("  Tasks", GOLD))
        for t in priority_items[:5]:
            title = t.get("title", "Untitled")
            tid = t.get("id", "?")
            pri = t.get("priority", "—")
            status = t.get("status", "—")
            print(f"    • [{pri}] {title} ({status}) — {tid}")

    proposals = pkg.get("proposals", {})
    active = proposals.get("active", [])
    if active:
        print()
        print(c("  Proposals", GOLD))
        for p in active[:5]:
            title = p.get("title", "Untitled")
            pid = p.get("id", "?")
            status = p.get("status", "—")
            print(f"    • {title} ({status}) — {pid}")

    recent_sessions = pkg.get("recent_host_sessions") or []
    if recent_sessions:
        print()
        print(c("  Recent host sessions", GOLD))
        for s in recent_sessions[:5]:
            provider = s.get("provider", "?")
            status = s.get("status", "?")
            title = (s.get("title") or "(untitled)").replace("\n", " ")
            last_at = s.get("last_activity_at") or s.get("started_at") or "-"
            print(f"    • [{provider}/{status}] {title[:68]} — {last_at}")

    print()


def cmd_context_operator(args, json_out=False):
    try:
        code, data = client.get("/api/context/operator/package")
        if code != 200:
            code, data = client.get("/api/surfaces/operator-status")
            if code == 200:
                data = {
                    "subject": {"kind": "operator", "id": "operator", "title": "Operator Context"},
                    "summary": {
                        "one_line": data.get("summary") or data.get("status") or "operator status available",
                        "recommended_next_step": data.get("recommended_next_step") or data.get("next_step"),
                    },
                    "host_truth": data,
                    "compat": True,
                }
            else:
                code, data = client.get("/api/control-plane")
                if code == 200:
                    data = {
                        "subject": {"kind": "operator", "id": "operator", "title": "Operator Context"},
                        "summary": {
                            "one_line": "control-plane status available",
                            "recommended_next_step": None,
                        },
                        "host_truth": data,
                        "compat": True,
                    }
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_summary(data)
    return 0


def cmd_context_project(args, json_out=False):
    pos = args.pos
    if len(pos) < 3:
        print_error("Usage: ema context project <project-id|slug>")
        return 1

    project_ref = pos[2]
    try:
        project_id = _resolve_project_id(project_ref)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if not project_id:
        print_error(f"Project not found: {project_ref}")
        return 1

    try:
        code, data = client.get(f"/api/context/project/{project_id}/package")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_summary(data)
    return 0


def run(args):
    pos = args.pos
    json_out = args.has("json") or args.has("j")

    if len(pos) < 2:
        _print_context_help()
        return 0

    sub = pos[1]
    dispatch = {
        "operator": cmd_context_operator,
        "project": cmd_context_project,
    }

    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown context subcommand: {sub}")
        _print_context_help()
        return 1

    return handler(args, json_out=json_out)


def _print_context_help():
    print(c("\n  ema context — Shared context packages", BOLD + CYAN))
    print()
    cmds = [
        ("operator", "— operator package from host truth + tasks/proposals/executions"),
        ("project", "<id|slug> — project package backed by host EMA context"),
    ]
    for sub, usage in cmds:
        print(f"  {c('ema context ' + sub, CYAN)}  {c(usage, GREY)}")
    print()
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
