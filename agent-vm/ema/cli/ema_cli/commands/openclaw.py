"""
ema openclaw — OpenClaw-facing wrapper over EMA control-plane surfaces.

This command group intentionally follows docs/AGENT-CONTRACT.md so chat/runtime
integrations have one stable entry point instead of guessing among CLI groups.
"""
from .. import client
from ..client import DaemonError
from ..output import (
    print_json, print_error, print_info, print_success,
    c, BOLD, CYAN, GREY, GOLD,
)


def _daemon_unreachable(e: DaemonError):
    host = e.host
    print_error(f"Cannot reach EMA daemon at {host}")
    print_info("  → Try: cd ~/Projects/ema/daemon && mix phx.server")
    print_info("  → Or:  ema status")
    print_info("  → Or:  export EMA_HOST=<host:port>")


def _get(path, params=None):
    return client.get(path, params=params)


def _post(path, body=None):
    return client.post(path, body=body or {})


def _print_snapshot(data):
    print()
    print(c("  EMA ↔ OpenClaw Snapshot", BOLD + CYAN))
    print()
    print(f"  mode               {data.get('mode', 'unknown')}")
    available = data.get("available_endpoints", [])
    if available:
        print(f"  endpoints          {', '.join(available[:6])}")
    notes = data.get("notes", []) or data.get("compat_notes", [])
    if notes:
        print(f"  notes              {notes[0]}")
    print()

    cp = data.get("control_plane") or {}
    counts = cp.get("counts", data.get("counts", {}))
    if counts:
        print(c("  Control plane", GOLD))
        for key in ("proposals", "executions", "outcomes", "active_projects", "pending_tasks", "open_proposals", "running_agents"):
            if key in counts:
                print(f"    {key:<18} {counts.get(key)}")
        print()

    host = data.get("host_truth") or {}
    if host:
        print(c("  Host truth", GOLD))
        print(f"    status             {host.get('status', 'unknown')}")
        if host.get("headline"):
            print(f"    headline           {host.get('headline')}")
        elif host.get("summary"):
            print(f"    summary            {host.get('summary')}")
        counts = host.get("counts", {})
        for key in ("queue", "active", "failed", "done", "results"):
            if key in counts:
                print(f"    {key:<18} {counts.get(key)}")
        print()

    recent_sessions = data.get("recent_host_sessions") or []
    if recent_sessions:
        print(c("  Recent host sessions", GOLD))
        for session in recent_sessions[:8]:
            provider = session.get("provider", "?")
            status = session.get("status", "?")
            title = (session.get("title") or "(untitled)").replace("\n", " ")
            last_at = session.get("last_activity_at") or session.get("started_at") or "-"
            print(f"    • [{provider}/{status}] {title[:72]} — {last_at}")
        print()

    project_context = data.get("project_context") or {}
    if project_context:
        print(c("  Project context", GOLD))
        print(f"    project            {project_context.get('project', 'unknown')}")
        goals = project_context.get("active_goals") or []
        if goals:
            print(f"    active_goals       {', '.join(goals[:5])}")
        bws = project_context.get("bounded_working_set") or []
        if bws:
            print(f"    working_set_items  {len(bws)}")
        if project_context.get("recent_host_sessions"):
            print(f"    recent_sessions    {len(project_context.get('recent_host_sessions', []))}")
        print()


def cmd_status(args, json_out=False):
    data = client.control_plane_snapshot(project=args.get("project") or args.get("p"))
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_snapshot(data)
    return 0


def cmd_host_truth(args, json_out=False):
    try:
        code, data = _get("/api/surfaces/host-truth")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_snapshot({"mode": "host-truth", "host_truth": data})
    return 0


def cmd_context(args, json_out=False):
    project = args.get("project") or args.get("p")
    try:
        if project:
            code, data = _get("/api/control-plane/context_for", params={"project": project})
        else:
            code, data = _get("/api/context/operator/package")
            if code != 200:
                code, data = _get("/api/surfaces/operator-status")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    print_json(data) if (json_out or args.has("json") or args.has("j")) else print_json(data)
    return 0


def cmd_propose(args, json_out=False):
    project = args.get("project") or args.get("p")
    intent = args.get("intent")
    summary = args.get("summary")

    if not (project and intent and summary):
        print_error("Usage: ema openclaw propose --project <project> --intent <intent> --summary <summary>")
        return 1

    body = {
        "project": project,
        "intent": intent,
        "summary": summary,
        "context": {
            "source": "openclaw",
            "channel": args.get("channel"),
            "surface": args.get("surface"),
        },
        "metadata": {"source": "openclaw"},
    }

    try:
        code, data = _post("/api/control-plane/proposals", body=body)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code not in (200, 201):
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        proposal = data.get("proposal", {})
        print_success(f"Created proposal {proposal.get('id', '?')}")
        print_json(proposal)
    return 0


def cmd_run(args, json_out=False):
    proposal_id = args.get("proposal-id") or args.get("id")
    if not proposal_id and len(args.pos) >= 3:
        proposal_id = args.pos[2]
    if not proposal_id:
        print_error("Usage: ema openclaw run <proposal_id> [--adapter local] [--operator openclaw]")
        return 1

    body = {
        "adapter": args.get("adapter", "local"),
        "operator": args.get("operator", "openclaw"),
        "operator_constraints": [],
        "metadata": {"source": "openclaw"},
    }

    try:
        code, data = _post(f"/api/control-plane/proposals/{proposal_id}/run", body=body)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    print_json(data) if (json_out or args.has("json") or args.has("j")) else print_json(data)
    return 0


def cmd_complete(args, json_out=False):
    execution_id = args.get("execution-id") or args.get("id")
    if not execution_id and len(args.pos) >= 3:
        execution_id = args.pos[2]
    if not execution_id:
        print_error("Usage: ema openclaw complete <execution_id> [--status succeeded] [--summary ...]")
        return 1

    body = {
        "status": args.get("status", "succeeded"),
        "summary": args.get("summary"),
        "details": {"source": "openclaw"},
        "metadata": {"source": "openclaw"},
    }

    try:
        code, data = _post(f"/api/control-plane/executions/{execution_id}/complete", body=body)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    print_json(data) if (json_out or args.has("json") or args.has("j")) else print_json(data)
    return 0


def cmd_dispatch_update(args, json_out=False):
    execution_id = args.get("execution-id") or args.get("id")
    if not execution_id and len(args.pos) >= 3:
        execution_id = args.pos[2]
    if not execution_id:
        print_error("Usage: ema openclaw dispatch-update <execution_id> --status <status> [--summary ...] [--dispatch-id ...]")
        return 1

    body = {
        "status": args.get("status", "failed"),
        "summary": args.get("summary", "dispatch update from openclaw"),
        "dispatch_id": args.get("dispatch-id"),
        "adapter_status": args.get("adapter-status"),
        "result": {"source": "openclaw"},
    }

    try:
        code, data = _post(f"/api/control-plane/executions/{execution_id}/dispatch-update", body=body)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    print_json(data) if (json_out or args.has("json") or args.has("j")) else print_json(data)
    return 0


def run(args):
    pos = args.pos
    json_out = args.has("json") or args.has("j")

    if len(pos) < 2:
        _print_help()
        return 0

    sub = pos[1]
    dispatch = {
        "status": cmd_status,
        "snapshot": cmd_status,
        "host-truth": cmd_host_truth,
        "context": cmd_context,
        "propose": cmd_propose,
        "run": cmd_run,
        "complete": cmd_complete,
        "dispatch-update": cmd_dispatch_update,
    }
    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown openclaw subcommand: {sub}")
        _print_help()
        return 1

    try:
        return handler(args, json_out=json_out)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2


def _print_help():
    print(c("\n  ema openclaw — OpenClaw-facing EMA wrapper", BOLD + CYAN))
    print()
    cmds = [
        ("status", "snapshot of control-plane + host truth"),
        ("context", "[--project <project>] raw operator/project context"),
        ("host-truth", "show machine/dispatch reality"),
        ("propose", "--project <project> --intent <intent> --summary <summary>"),
        ("run <proposal_id>", "run a proposal through the control plane"),
        ("complete <execution_id>", "record execution completion"),
        ("dispatch-update <execution_id>", "record dispatch/runtime update"),
    ]
    for sub, usage in cmds:
        print(f"  {c('ema openclaw ' + sub, CYAN)}  {c(usage, GREY)}")
    print()
    print(c("  This command group follows docs/AGENT-CONTRACT.md.", GOLD))
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
