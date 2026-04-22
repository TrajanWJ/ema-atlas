"""
ema control — operator-facing control-plane commands.

These commands map directly to the daemon's native control-plane surfaces and are
meant to be the real operator lane while task/execution CRUD catches up.
"""
from .. import client
from ..client import DaemonError
from ..output import (
    print_json, print_error, print_info, print_success, print_warn,
    print_table, c, BOLD, CYAN, GREY, GOLD, GREEN, YELLOW, RED, DIM,
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


def _print_status(data):
    print()
    print(c("  EMA Control Plane", BOLD + CYAN))
    print()
    counts = data.get("counts", data.get("stats", {}))
    print(c("  Summary", GOLD))
    print(f"    Status:            {data.get('status', 'unknown')}")
    print(f"    Active projects:   {counts.get('active_projects', '—')}")
    print(f"    Pending tasks:     {counts.get('pending_tasks', '—')}")
    print(f"    Open proposals:    {counts.get('open_proposals', '—')}")
    print(f"    Running agents:    {counts.get('running_agents', '—')}")
    print(f"    Failed executions: {counts.get('failed_executions', '—')}")

    sweeper = data.get("sweeper", {})
    if sweeper:
        print()
        print(c("  Sweeper", GOLD))
        for key in ("status", "interval_ms", "last_run_at", "last_sweep_at", "stale_threshold_ms"):
            val = sweeper.get(key)
            if val is not None:
                print(f"    {key}: {val}")

    incidents = (data.get("incidents") or {}).get("active", [])
    if incidents:
        print()
        print(c(f"  Active incidents ({len(incidents)})", GOLD))
        for inc in incidents[:5]:
            print(f"    • {inc.get('id', '?')} | {inc.get('status', 'unknown')} | {inc.get('title') or inc.get('summary') or 'incident'}")
    print()


def _print_live(events, incidents):
    if incidents:
        print_table(incidents, [
            ("id", "Incident", 20),
            ("status", "Status", 14),
            ("kind", "Kind", 18),
            ("summary", "Summary", 44),
        ], title=f"Recent Incident Events ({len(incidents)})")
    if events:
        print_table(events, [
            ("ts", "Time", 24),
            ("kind", "Kind", 18),
            ("execution_id", "Execution", 20),
            ("proposal_id", "Proposal", 20),
            ("summary", "Summary", 42),
        ], title=f"Live Events ({len(events)})")
    if not events and not incidents:
        print(c("  (no live events)", GREY))


def _print_incidents(incidents):
    if not incidents:
        print(c("  (no incidents)", GREY))
        return
    print_table(incidents, [
        ("id", "ID", 20),
        ("status", "Status", 14),
        ("kind", "Kind", 18),
        ("summary", "Summary", 44),
        ("opened_at", "Opened", 22),
    ], title=f"Incidents ({len(incidents)})")


def _print_host_transitions(events):
    if not events:
        print(c("  (no host transitions)", GREY))
        return
    print_table(events, [
        ("ts", "Time", 24),
        ("domain", "Domain", 18),
        ("from", "From", 16),
        ("to", "To", 16),
        ("reason", "Reason", 34),
    ], title=f"Host Transitions ({len(events)})")


def cmd_control_status(args, json_out=False):
    try:
        code, data = _get("/api/control-plane")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_status(data)
    return 0


def cmd_control_live(args, json_out=False):
    params = {"limit": args.get("limit") or 25}
    try:
        code, data = _get("/api/control-plane/live", params=params)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    events = data.get("events", [])
    incidents = data.get("incidents", [])
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_live(events, incidents)
    return 0


def cmd_control_incidents(args, json_out=False):
    params = {}
    if args.has("all"):
        params["active"] = "false"
    try:
        code, data = _get("/api/control-plane/incidents", params=params or None)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    incidents = data.get("incidents", data.get("data", []))
    if json_out or args.has("json") or args.has("j"):
        print_json({"incidents": incidents})
    else:
        _print_incidents(incidents)
    return 0


def cmd_control_incident_action(args, json_out=False):
    pos = args.pos
    if len(pos) < 4:
        print_error("Usage: ema control incident-action <incident_id> <action> [--actor <name>] [--duration-ms <n>]")
        return 1
    incident_id = pos[2]
    action = pos[3]
    body = {}
    if args.get("actor"):
        body["actor"] = args.get("actor")
    if args.get("duration-ms"):
        body["duration_ms"] = int(args.get("duration-ms"))

    try:
        code, data = _post(f"/api/control-plane/incidents/{incident_id}/actions/{action}", body=body)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        incident = data.get("incident", {})
        print_success(f"Incident {incident.get('id', incident_id)} updated via action {action}")
        print_info(f"Status: {incident.get('status', 'unknown')}")
    return 0


def cmd_control_host_transitions(args, json_out=False):
    params = {"limit": args.get("limit") or 25}
    try:
        code, data = _get("/api/control-plane/host-transitions", params=params)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    events = data.get("events", data.get("data", []))
    if json_out or args.has("json") or args.has("j"):
        print_json({"events": events})
    else:
        _print_host_transitions(events)
    return 0


def cmd_control_context(args, json_out=False):
    project = args.get("project") or args.get("p")
    if not project:
        print_error("Usage: ema control context --project <project>")
        return 1
    try:
        code, data = _get("/api/control-plane/context_for", params={"project": project})
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        print_json(data)
    return 0


def cmd_control_command(args, json_out=False):
    pos = args.pos
    command = pos[2] if len(pos) >= 3 else args.get("command")
    if not command:
        print_error('Usage: ema control command "<command>"')
        return 1
    try:
        code, data = _post("/api/control-plane/command", body={"command": command})
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        print_success(f"Command executed: {command}")
        print_json(data)
    return 0


def run(args):
    pos = args.pos
    json_out = args.has("json") or args.has("j")

    if len(pos) < 2:
        _print_control_help()
        return 0

    sub = pos[1]
    dispatch = {
        "status": cmd_control_status,
        "live": cmd_control_live,
        "incidents": cmd_control_incidents,
        "incident-action": cmd_control_incident_action,
        "host-transitions": cmd_control_host_transitions,
        "context": cmd_control_context,
        "command": cmd_control_command,
    }
    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown control subcommand: {sub}")
        _print_control_help()
        return 1
    return handler(args, json_out=json_out)


def _print_control_help():
    print(c("\n  ema control — Operator control-plane", BOLD + CYAN))
    print()
    cmds = [
        ("status", "show control-plane summary + sweeper state"),
        ("live", "[--limit <n>]  show recent event + incident activity"),
        ("incidents", "[--all]  list active incidents by default"),
        ("incident-action", "<incident_id> <action> [--actor <name>] [--duration-ms <n>]"),
        ("host-transitions", "[--limit <n>]  show recent host-truth transitions"),
        ("context", "--project <project>  raw control-plane context payload"),
        ("command", '"<command>"  execute daemon control-plane command'),
    ]
    for sub, usage in cmds:
        print(f"  {c('ema control ' + sub, CYAN)}  {c(usage, GREY)}")
    print()
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
