"""
ema metrics — System metrics and dashboard.
Makes real HTTP calls to EMA daemon.

Aggregates stats from:
  GET /api/status          — system health + counts
  GET /api/token-usage     — token consumption
  GET /api/executions      — running agent count
  GET /api/tasks           — pending task count
  GET /api/proposals       — open proposal count
"""
import sys
from .. import client, config, compat
from ..client import DaemonError
from ..output import (
    print_json, print_success, print_error, print_info, print_warn,
    c, GREEN, RED, YELLOW, CYAN, BOLD, GREY, DIM, GOLD,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_get(path, params=None):
    """Make HTTP GET, return (code, data). Never raises."""
    try:
        return client.get(path, params=params)
    except DaemonError:
        return None, {}


def _daemon_unreachable(host):
    print_error(f"Cannot reach EMA daemon at {host}")
    print_info(f"  → Try: cd ~/Projects/ema/daemon && mix phx.server")
    print_info(f"  → Or:  export EMA_HOST=<host:port>")


def _bar(val, max_val, width=20, color=GREEN):
    """Render a simple ASCII bar."""
    if max_val == 0:
        filled = 0
    else:
        filled = int(round(val / max_val * width))
    filled = max(0, min(width, filled))
    bar = "█" * filled + "░" * (width - filled)
    return c(bar, color)


# ---------------------------------------------------------------------------
# Dashboard rendering
# ---------------------------------------------------------------------------

def _print_metrics_dashboard(status_data, token_data, execs_data, tasks_data, proposals_data):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    w = 54

    print()
    print(c(f"  ╔{'═' * (w - 2)}╗", GOLD))
    print(c(f"  ║  EMA Metrics Dashboard — {now:<{w - 28}}║", GOLD))
    print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))

    # -- Counts section --
    counts = status_data.get("counts", status_data.get("stats", {}))

    running_agents  = execs_data.get("total", counts.get("running_agents", "—"))
    pending_tasks   = counts.get("pending_tasks", "—")
    open_proposals  = counts.get("open_proposals", "—")
    active_projects = counts.get("active_projects", "—")

    # Try to derive pending tasks from the tasks list
    task_list = tasks_data.get("tasks", tasks_data.get("data", []))
    if task_list and pending_tasks == "—":
        pending_tasks = sum(1 for t in task_list if t.get("status") in ("todo", "pending", "in_progress"))

    proposal_list = proposals_data.get("proposals", [])
    if proposal_list and open_proposals == "—":
        open_proposals = sum(1 for p in proposal_list if p.get("status") not in ("approved", "killed", "done", "completed"))

    def row(label, val, color=None):
        val_str = str(val)
        if color:
            val_str = c(val_str, color)
        print(c(f"  ║  {label:<20}", GOLD) + f"{val_str:<{w - 22}}" + c("║", GOLD))

    row("Running agents:", running_agents, GREEN if str(running_agents) not in ("0", "—") else DIM)
    row("Pending tasks:", pending_tasks)
    row("Open proposals:", open_proposals)
    row("Active projects:", active_projects)

    # -- Token usage section --
    token_summary = token_data.get("summary", token_data)
    total_tokens  = token_summary.get("total_tokens", token_data.get("total_tokens"))
    total_cost    = token_summary.get("total_cost_usd", token_data.get("total_cost_usd"))
    daily_tokens  = token_summary.get("today_tokens",  token_data.get("today_tokens"))
    daily_cost    = token_summary.get("today_cost_usd", token_data.get("today_cost_usd"))

    if total_tokens is not None or total_cost is not None:
        print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))
        print(c(f"  ║  {'Token Usage':<{w - 4}}║", GOLD))
        print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))

        if total_tokens is not None:
            row("Total tokens:", f"{total_tokens:,}" if isinstance(total_tokens, int) else total_tokens)
        if total_cost is not None:
            row("Total cost:", f"${total_cost:.4f}" if isinstance(total_cost, float) else total_cost)
        if daily_tokens is not None:
            row("Today tokens:", f"{daily_tokens:,}" if isinstance(daily_tokens, int) else daily_tokens)
        if daily_cost is not None:
            row("Today cost:", f"${daily_cost:.4f}" if isinstance(daily_cost, float) else daily_cost)

        # Model breakdown
        by_model = token_summary.get("by_model", token_data.get("by_model", {}))
        if by_model:
            print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))
            print(c(f"  ║  {'By Model':<{w - 4}}║", GOLD))
            max_t = max((v if isinstance(v, int) else v.get("tokens", 0) for v in by_model.values()), default=1)
            for model, val in list(by_model.items())[:5]:
                if isinstance(val, dict):
                    tokens = val.get("tokens", 0)
                    cost   = val.get("cost_usd", 0)
                    bar    = _bar(tokens, max_t, width=16)
                    line   = f"{bar}  {tokens:,} tokens  ${cost:.4f}"
                else:
                    bar  = _bar(val, max_t, width=16)
                    line = f"{bar}  {val:,} tokens"
                print(c(f"  ║  {model:<18}", GOLD) + f"{line:<{w - 20}}" + c("║", GOLD))

    # -- Recent executions --
    exec_list = execs_data.get("executions", [])
    if exec_list:
        print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))
        print(c(f"  ║  {'Recent Executions':<{w - 4}}║", GOLD))
        print(c(f"  ╠{'═' * (w - 2)}╣", GOLD))
        for e in exec_list[:4]:
            agent  = e.get("agent_id", "?")
            status = e.get("status", "?")
            eid    = e.get("id", "?")[:16]
            scolor = GREEN if status == "running" else (RED if status == "failed" else DIM)
            line   = f"{eid}  {c(agent, CYAN)}  {c(status, scolor)}"
            print(c(f"  ║  ", GOLD) + f"{line:<{w - 4}}" + c("║", GOLD))

    print(c(f"  ╚{'═' * (w - 2)}╝", GOLD))
    print()


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

def cmd_metrics(args, json_out=False):
    """ema metrics — show system dashboard"""
    host = config.host()

    reachable, _latency, status_data = client.ping()
    if not reachable:
        _daemon_unreachable(host)
        return 2

    # Parallel pulls (best-effort — non-fatal if endpoints 404)
    _, token_data      = _safe_get("/api/token-usage")
    try:
        _code, exec_list = compat.executions_list(status="running")
        execs_running = {"executions": exec_list, "total": len(exec_list)}
    except DaemonError:
        execs_running = {}
    _, tasks_data      = _safe_get("/api/tasks")
    if not tasks_data:
        tasks_data = {}
    try:
        _code, proposal_list = compat.proposals_list()
        proposals_data = {"proposals": proposal_list, "total": len(proposal_list)}
    except DaemonError:
        proposals_data = {}

    if json_out or args.has("json") or args.has("j"):
        print_json({
            "status":    status_data,
            "tokens":    token_data,
            "executions": execs_running,
        })
        return 0

    _print_metrics_dashboard(status_data, token_data, execs_running, tasks_data, proposals_data)
    return 0


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

def run(args):
    """Entry point from main CLI."""
    json_out = args.has("json") or args.has("j")
    return cmd_metrics(args, json_out=json_out)
