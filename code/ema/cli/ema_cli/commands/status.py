"""
ema status — System health check.
Pings daemon and shows subsystem status.
"""
import sys
import time
from .. import client, config
from ..client import DaemonError
from ..output import (
    print_json, print_success, print_error, print_info, print_warn,
    c, GREEN, RED, YELLOW, CYAN, BOLD, GREY, DIM, GOLD,
    terminal_width,
)


# ---------------------------------------------------------------------------
# Status display
# ---------------------------------------------------------------------------

def _status_icon(ok, unknown=False):
    if unknown:
        return c("—", GREY)
    return c("✓", GREEN) if ok else c("✗", RED)


def _print_status_box(daemon_ok, daemon_host, latency, data, json_out=False):
    if json_out:
        print_json({
            "daemon": {"reachable": daemon_ok, "host": daemon_host, "latency_ms": latency},
            "data": data,
        })
        return

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    w = 45

    print()
    print(c(f"  ╔{'═' * (w - 2)}╗", GOLD))
    print(c(f"  ║  EMA Status — {now:<{w - 18}}║", GOLD))
    print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))

    # Daemon line
    if daemon_ok:
        latency_str = f" ({latency}ms)" if latency else ""
        daemon_line = f"✓ {daemon_host}{latency_str}"
        print(c(f"  ║  Daemon         {daemon_line:<{w - 19}}║", GOLD))
    else:
        daemon_line = f"✗ {daemon_host} — unreachable"
        print(c(f"  ║  Daemon         ", GOLD) + c(f"{daemon_line:<{w - 19}}", RED) + c("║", GOLD))

    if not daemon_ok:
        print(c(f"  ╚{'═' * (w - 2)}╝", GOLD))
        print()
        print_error(f"Cannot reach EMA daemon at {daemon_host}")
        print_info(f"  → Try: cd ~/Projects/ema/daemon && mix phx.server")
        print_info(f"  → Or:  export EMA_HOST=<host:port>")
        print()
        return

    # Extract subsystem info from data if available
    subsystems = data.get("subsystems", {})
    openclaw = subsystems.get("openclaw", subsystems.get("gateway"))
    superman = subsystems.get("superman", subsystems.get("indexer"))
    honcho = subsystems.get("honcho")

    def _subsys_line(label, info):
        if info is None:
            icon = c("—", GREY)
            desc = "not configured"
        elif isinstance(info, bool):
            icon = c("✓", GREEN) if info else c("✗", RED)
            desc = "connected" if info else "offline"
        elif isinstance(info, dict):
            ok = info.get("ok", info.get("healthy", info.get("connected", True)))
            icon = c("✓", GREEN) if ok else c("✗", RED)
            desc = info.get("message", info.get("status", "connected" if ok else "offline"))
        else:
            icon = c("·", GREY)
            desc = str(info)
        line = f"{icon} {desc}"
        print(c(f"  ║  {label:<16}", GOLD) + f"{line:<{w - 20}}" + c("║", GOLD))

    _subsys_line("OpenClaw", openclaw)
    _subsys_line("Superman", superman)
    _subsys_line("Honcho", honcho)

    compat_notes = data.get("compat_notes", [])
    mode = data.get("mode")
    if mode or compat_notes:
        print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))
        mode_text = mode or "native"
        print(c(f"  ║  {'Mode:':<16}{mode_text:<{w - 18}}║", GOLD))
        if compat_notes:
            note = compat_notes[0][: w - 18]
            print(c(f"  ║  {'Note:':<16}{note:<{w - 18}}║", GOLD))

    print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))

    # Counts
    counts = data.get("counts", data.get("stats", {}))
    running_agents = counts.get("running_agents", data.get("running_agents", "—"))
    pending_tasks = counts.get("pending_tasks", data.get("pending_tasks", "—"))
    open_proposals = counts.get("open_proposals", data.get("open_proposals", "—"))
    active_projects = counts.get("active_projects", data.get("active_projects", "—"))

    def _count_line(label, val):
        line = str(val)
        print(c(f"  ║  {label:<16}{line:<{w - 18}}║", GOLD))

    _count_line("Running agents:", running_agents)
    _count_line("Pending tasks:", pending_tasks)
    _count_line("Open proposals:", open_proposals)
    _count_line("Active projects:", active_projects)

    # Last activity
    last = data.get("last_dispatch", data.get("recent", {}))
    if last:
        print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))
        if isinstance(last, dict):
            agent = last.get("agent", "?")
            when = last.get("when", last.get("elapsed", "?"))
            line = f"{when} ago ({agent})"
            print(c(f"  ║  {'Last dispatch:':<16}", GOLD) + f"{line:<{w - 18}}" + c("║", GOLD))
        else:
            line = str(last)
            print(c(f"  ║  {'Last activity:':<16}{line:<{w - 18}}║", GOLD))

    available = data.get("available_endpoints", [])
    if available:
        print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))
        endpoints = ", ".join(available[:2])
        if len(available) > 2:
            endpoints += f" +{len(available) - 2} more"
        print(c(f"  ║  {'Endpoints:':<16}{endpoints[: w - 18]:<{w - 18}}║", GOLD))

    print(c(f"  ╚{'═' * (w - 2)}╝", GOLD))
    print()


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

def cmd_status(args, json_out=False):
    """ema status"""
    daemon_host = config.host()
    reachable, latency, data = client.ping()

    if json_out or args.has("json") or args.has("j"):
        print_json({
            "daemon": {"reachable": reachable, "host": daemon_host, "latency_ms": latency},
            "data": data,
        })
        return 0 if reachable else 2

    _print_status_box(reachable, daemon_host, latency, data, json_out=json_out)
    return 0 if reachable else 2


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

def run(args):
    """Entry point from main CLI."""
    json_out = args.has("json") or args.has("j")

    # Override host from flag
    if args.get("host") or args.get("H"):
        import os
        os.environ["EMA_HOST"] = args.get("host") or args.get("H")
        config.load()

    return cmd_status(args, json_out=json_out)
