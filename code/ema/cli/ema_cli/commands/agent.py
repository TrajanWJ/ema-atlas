"""
ema agent — Agent execution management commands.
Makes real HTTP calls to EMA daemon at /api/executions.
"""
import sys
from .. import client, config, compat
from ..client import DaemonError
from ..output import (
    print_json, print_table, print_success, print_error, print_info,
    c, GREEN, CYAN, YELLOW, RED, BOLD, GREY, DIM,
)


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

STATUS_COLORS = {
    "running":   GREEN + BOLD,
    "queued":    CYAN,
    "completed": GREY,
    "failed":    RED,
    "dispatched": CYAN,
    "pending":   DIM,
}


def _print_executions_table(execs, title=None):
    if not execs:
        print(c("  (no agent executions)", GREY))
        return
    print_table(execs, [
        ("id",          "ID",         20),
        ("agent_id",    "Agent",      14),
        ("status",      "Status",     12),
        ("task_id",     "Task ID",    20),
        ("model",       "Model",      16),
        ("inserted_at", "Started",    22),
    ], title=title or f"Executions ({len(execs)})")


def _daemon_unreachable(e: DaemonError):
    host = e.host
    print_error(f"Cannot reach EMA daemon at {host}")
    print_info(f"  → Try: cd ~/Projects/ema/daemon && mix phx.server")
    print_info(f"  → Or:  export EMA_HOST=<host:port>")
    print_info(f"  → Or:  ema status")


# ---------------------------------------------------------------------------
# Subcommands
# ---------------------------------------------------------------------------

def cmd_agent_ps(args, json_out=False):
    """ema agent ps — show running agent executions"""
    params = {"status": "running"}
    if args.get("agent"):
        params["agent_id"] = args.get("agent")

    try:
        code, execs = compat.executions_list(status="running")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(f"Error {code}")
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json({"executions": execs})
    else:
        _print_executions_table(execs, title=f"Running Agents ({len(execs)})")
    return 0


def cmd_agent_list(args, json_out=False):
    """ema agent list — list all executions (recent)"""
    params = {}
    if args.get("status"):
        params["status"] = args.get("status")
    if args.get("agent"):
        params["agent_id"] = args.get("agent")
    if args.get("limit"):
        params["limit"] = args.get("limit")

    try:
        code, execs = compat.executions_list(status=args.get("status"), limit=args.get("limit"))
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(f"Error {code}")
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json({"executions": execs})
    else:
        _print_executions_table(execs)
    return 0


def cmd_agent_show(args, json_out=False):
    """ema agent show <execution_id>"""
    pos = args.pos
    if len(pos) < 3:
        print_error("Usage: ema agent show <execution_id>")
        return 1
    exec_id = pos[2]

    try:
        code, exe = compat.execution_show(exec_id)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code == 404:
        print_error(f"Execution {exec_id} not found")
        return 1
    if code != 200:
        print_error(f"Error {code}")
        return 1

    if json_out or args.has("json") or args.has("j"):
        print_json({"execution": exe})
    else:
        print()
        print(c(f"  Execution: {exe.get('id', '?')}", BOLD + CYAN))
        print()
        fields = [
            ("Agent",    "agent_id"),
            ("Status",   "status"),
            ("Task",     "task_id"),
            ("Model",    "model"),
            ("Started",  "inserted_at"),
            ("Updated",  "updated_at"),
        ]
        for label, key in fields:
            val = exe.get(key)
            if val is not None:
                print(f"  {label:<12} {val}")
        print()
    return 0


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

def run(args):
    """Entry point from main CLI: args.pos = ['agent', <sub>, ...]"""
    pos = args.pos
    json_out = args.has("json") or args.has("j")

    if len(pos) < 2:
        _print_agent_help()
        return 0

    sub = pos[1]
    dispatch = {
        "ps":   cmd_agent_ps,
        "list": cmd_agent_list,
        "show": cmd_agent_show,
        "get":  cmd_agent_show,
    }

    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown agent subcommand: {sub}")
        _print_agent_help()
        return 1

    return handler(args, json_out=json_out)


def _print_agent_help():
    print(c("\n  ema agent — Agent execution management", BOLD + CYAN))
    print()
    cmds = [
        ("ps",   "[--agent <id>]   — show running agents"),
        ("list", "[--status <s>] [--agent <id>] [--limit <n>]   — list all executions"),
        ("show", "<execution_id>   — show single execution detail"),
    ]
    for sub, usage in cmds:
        print(f"  {c('ema agent ' + sub, CYAN)}  {c(usage, GREY)}")
    print()
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
