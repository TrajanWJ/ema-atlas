"""
ema surfaces — native EMA surfaces / host-truth / gateway views.
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


def _print_surfaces(surfaces, sessions, discovered_at=None):
    rows = []
    session_store_rows = []
    if isinstance(surfaces, dict):
        for key, info in surfaces.items():
            rows.append({
                "surface": key,
                "type": info.get("type"),
                "status": info.get("status"),
                "auth": info.get("auth"),
                "version": info.get("version"),
            })

            details = info.get("details", {}) if isinstance(info.get("details"), dict) else {}
            if details.get("session_store_root"):
                session_store_rows.append({
                    "surface": key,
                    "root": details.get("session_store_root"),
                    "present": "yes" if details.get("session_store_present") else "no",
                    "sessions": details.get("discoverable_sessions", 0),
                    "projects": details.get("session_projects", "-"),
                    "last_seen": details.get("last_session_at") or "-",
                })
    if rows:
        print_table(rows, [
            ("surface", "Surface", 18),
            ("type", "Type", 16),
            ("status", "Status", 14),
            ("auth", "Auth", 14),
            ("version", "Version", 14),
        ], title=f"Discovered Surfaces ({len(rows)})")
    else:
        print(c("  (no surfaces)", GREY))

    if session_store_rows:
        print_table(session_store_rows, [
            ("surface", "Surface", 12),
            ("present", "Store", 8),
            ("sessions", "Sessions", 10, "right"),
            ("projects", "Projects", 10, "right"),
            ("last_seen", "Last Seen", 22),
            ("root", "Root", 40),
        ], title=f"Host Session Stores ({len(session_store_rows)})")

    if sessions:
        print_table(sessions, [
            ("id", "Session", 20),
            ("type", "Type", 12),
            ("status", "Status", 14),
            ("model", "Model", 16),
        ], title=f"Active Sessions ({len(sessions)})")
    if discovered_at:
        print_info(f"discovered_at: {discovered_at}")


def _print_gateway(data):
    print()
    print(c("  Gateway Status", BOLD + CYAN))
    print()
    if isinstance(data, dict):
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                continue
            print(f"  {k:<18} {v}")
    print()


def _print_host_truth(data, title="Host Truth"):
    print()
    print(c(f"  {title}", BOLD + CYAN))
    print()
    counts = data.get("counts", {})
    if data.get("status") is not None:
        print(f"  {'status':<18} {data.get('status')}")
    for key in ("summary", "top_actionable_issue", "recommended_next_step"):
        if data.get(key):
            print(f"  {key:<18} {data.get(key)}")
    if counts:
        print()
        for key in ("active_projects", "pending_tasks", "open_proposals", "running_agents", "failed_executions"):
            if key in counts:
                print(f"  {key:<18} {counts.get(key)}")
    print()


def _print_peers(data):
    peers = data.get("peers", []) if isinstance(data, dict) else []
    if not peers:
        print(c("  (no peers)", GREY))
        return
    print_table(peers, [
        ("id", "Peer", 20),
        ("name", "Name", 20),
        ("status", "Status", 14),
        ("platform", "Platform", 14),
        ("transport", "Transport", 14),
    ], title=f"Peers ({len(peers)})")


def cmd_surfaces_list(args, json_out=False):
    try:
        code, data = _get("/api/surfaces")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_surfaces(data.get("surfaces", {}), data.get("sessions", []), data.get("discovered_at"))
    return 0


def cmd_surfaces_discover(args, json_out=False):
    try:
        code, data = _post("/api/surfaces/discover")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        print_success("Surface discovery refreshed")
        _print_surfaces(data.get("surfaces", {}), [], None)
    return 0


def cmd_surfaces_gateway(args, json_out=False):
    try:
        code, data = _get("/api/surfaces/gateway")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_gateway(data)
    return 0


def cmd_surfaces_peers(args, json_out=False):
    try:
        code, data = _get("/api/surfaces/peers")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_peers(data)
    return 0


def cmd_surfaces_host_truth(args, json_out=False):
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
        _print_host_truth(data, title="Host Truth")
    return 0


def cmd_surfaces_operator_status(args, json_out=False):
    try:
        code, data = _get("/api/surfaces/operator-status")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_host_truth(data, title="Operator Status")
    return 0


def cmd_host_sessions_list(args, json_out=False):
    provider = args.get("provider") if hasattr(args, "get") else None
    try:
        code, data = _get("/api/surfaces/host-sessions", params={"provider": provider})
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        rows = data.get("sessions", [])
        print_table(rows, [
            ("id", "Host Session", 28),
            ("provider", "Provider", 10),
            ("status", "Status", 12),
            ("source", "Source", 18),
            ("last_activity_at", "Last Activity", 22),
            ("title", "Title", 40),
        ], title=f"Host Sessions ({len(rows)})")
    return 0


def cmd_host_sessions_show(args, json_out=False):
    if len(args.pos) < 3:
        print_error("Usage: ema surfaces host-sessions-show <host_session_id>")
        return 1
    session_id = args.pos[2]
    try:
        code, data = _get(f"/api/surfaces/host-sessions/{session_id}")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        session = data.get("session", {})
        print_json(session)
        bindings = data.get("bindings", [])
        if bindings:
            print_table(bindings, [
                ("surface_type", "Surface", 14),
                ("surface_id", "Surface ID", 24),
                ("binding_kind", "Kind", 14),
            ], title=f"Bindings ({len(bindings)})")
    return 0


def cmd_host_sessions_messages(args, json_out=False):
    if len(args.pos) < 3:
        print_error("Usage: ema surfaces host-sessions-messages <host_session_id>")
        return 1
    session_id = args.pos[2]
    try:
        code, data = _get(f"/api/surfaces/host-sessions/{session_id}/messages")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        rows = data.get("messages", [])
        print_table(rows, [
            ("occurred_at", "Occurred", 22),
            ("role", "Role", 12),
            ("content", "Content", 80),
        ], title=f"Messages ({len(rows)})")
    return 0


def cmd_host_sessions_events(args, json_out=False):
    if len(args.pos) < 3:
        print_error("Usage: ema surfaces host-sessions-events <host_session_id>")
        return 1
    session_id = args.pos[2]
    try:
        code, data = _get(f"/api/surfaces/host-sessions/{session_id}/events")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        rows = data.get("events", [])
        print_table(rows, [
            ("occurred_at", "Occurred", 22),
            ("event_kind", "Event", 16),
            ("provider_event_kind", "Provider Kind", 22),
            ("sequence", "Seq", 6, "right"),
        ], title=f"Events ({len(rows)})")
    return 0


def cmd_host_sessions_bind(args, json_out=False):
    if len(args.pos) < 3:
        print_error("Usage: ema surfaces host-sessions-bind <host_session_id> [--execution-id X] [--surface-type discord] [--surface-id Y]")
        return 1
    session_id = args.pos[2]
    body = {
        "execution_id": args.get("execution-id"),
        "surface_type": args.get("surface-type", "ema"),
        "surface_id": args.get("surface-id") or args.get("execution-id") or "manual",
        "binding_kind": args.get("binding-kind", "manual"),
        "metadata": {},
    }
    try:
        code, data = _post(f"/api/surfaces/host-sessions/{session_id}/bind", body=body)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        print_success(f"Bound host session {session_id}")
        print_json(data)
    return 0


def run(args):
    pos = args.pos
    json_out = args.has("json") or args.has("j")
    if len(pos) < 2:
        _print_help()
        return 0
    sub = pos[1]
    dispatch = {
        "list": cmd_surfaces_list,
        "discover": cmd_surfaces_discover,
        "gateway": cmd_surfaces_gateway,
        "peers": cmd_surfaces_peers,
        "host-truth": cmd_surfaces_host_truth,
        "operator-status": cmd_surfaces_operator_status,
        "host-sessions": cmd_host_sessions_list,
        "host-sessions-show": cmd_host_sessions_show,
        "host-sessions-messages": cmd_host_sessions_messages,
        "host-sessions-events": cmd_host_sessions_events,
        "host-sessions-bind": cmd_host_sessions_bind,
    }
    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown surfaces subcommand: {sub}")
        _print_help()
        return 1
    return handler(args, json_out=json_out)


def _print_help():
    print(c("\n  ema surfaces — Native EMA surfaces", BOLD + CYAN))
    print()
    cmds = [
        ("list", "show discovered surfaces + active sessions"),
        ("discover", "re-run surface discovery"),
        ("gateway", "show gateway status"),
        ("peers", "show connected peers"),
        ("host-truth", "show host-observed loop state"),
        ("operator-status", "show operator-focused host projection"),
        ("host-sessions", "list persistence-backed imported host sessions"),
        ("host-sessions-show <id>", "show one imported host session + bindings"),
        ("host-sessions-messages <id>", "show normalized messages for a host session"),
        ("host-sessions-events <id>", "show normalized events for a host session"),
        ("host-sessions-bind <id>", "bind imported host session to EMA/runtime surface ids"),
    ]
    for sub, usage in cmds:
        print(f"  {c('ema surfaces ' + sub, CYAN)}  {c(usage, GREY)}")
    print()
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
