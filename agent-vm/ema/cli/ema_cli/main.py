"""
EMA CLI — MVP entry point with real HTTP commands.

Command groups (HTTP-backed):
  ema task      — list, create, update, show
  ema project   — list, show
  ema proposal  — list, show
  ema status    — system health check
  ema openclaw  — OpenClaw-facing EMA wrapper

Additional commands (mock harness, for local development):
  ema mock <command>  — access the mock harness
  ema shell           — interactive REPL (mock harness)
  ema seed            — seed mock store
  ema scenario        — run test scenarios
"""
import sys
import os

from .cli_args import Args, parse_args
from .output import print_error, print_info, c, BOLD, CYAN, GREY, GREEN, GOLD


# ---------------------------------------------------------------------------
# Global flag handling
# ---------------------------------------------------------------------------

def _apply_global_flags(args):
    """Apply global flags (--host, --json, etc.) before routing."""
    host = args.get("host") or args.get("H")
    if host:
        os.environ["EMA_HOST"] = host
        from . import config
        config.load()


# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

HELP_TEXT = """
  EMA CLI — Personal AI Operating System

  Usage:  ema <command> [subcommand] [options]

  Commands:
    workspace   Shared workspace operations (open, handoff-inbox, agenda, block-create)
    work        Agent work coordination (start, sync, packet)
    control     Operator control-plane (status, live, incidents, command)
    surfaces    Native EMA surfaces (list, gateway, peers, host-truth)
    task        Task management (list, create, update, show)
    agent       Agent execution management (ps, list, show)
    agent-snapshot  Canonical EMA control-plane/operator snapshot
    metrics     System metrics dashboard
    project     Project management (list, show)
    proposal    Proposal lifecycle (list, show)
    context     Shared context packages (operator, project)
    status      System health check
    openclaw    OpenClaw-facing EMA wrapper

  Options:
    --host <url>    Override daemon URL (default: localhost:4488)
    --json, -j      Output raw JSON
    --help, -h      Show this help

  Examples:
    ema status
    ema work start "Implement host-truth reconciliation" --project ema-core --agent gamma-1
    ema work sync task_abc123 --status blocked --note "waiting on gateway auth"
    ema control status
    ema control live --limit 20
    ema surfaces host-truth
    ema metrics
    ema agent-snapshot --project ema
    ema agent ps
    ema agent list --status running
    ema task list
    ema task list --status pending --json
    ema task create "Fix login bug" --project proslync --priority 2
    ema task show task_abc123
    ema task update task_abc123 --status done
    ema project list
    ema project show studiokamel
    ema proposal list --status pending
    ema proposal show prop_abc123
    ema context operator
    ema context project ema
    ema openclaw status --project ema
    ema openclaw propose --project ema --intent host-truth --summary "Inspect dispatch drift"

  Config file:  ~/.config/ema/cli.json
  Env var:      EMA_HOST=localhost:4488

"""


# ---------------------------------------------------------------------------
# Main dispatch
# ---------------------------------------------------------------------------

def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]

    args = parse_args(argv)

    # Help
    if not args.pos or args.pos[0] in ("help", "--help", "-h") or args.has("help") or args.has("h"):
        print(HELP_TEXT)
        return 0

    # Apply global flags
    _apply_global_flags(args)

    cmd = args.pos[0]

    # Real HTTP-backed commands
    if cmd == "workspace":
        from .commands.workspace import run
        return run(args)

    if cmd == "work":
        from .commands.work import run
        return run(args)

    if cmd == "control":
        from .commands.control import run
        return run(args)

    if cmd == "surfaces":
        from .commands.surfaces import run
        return run(args)

    if cmd == "task":
        from .commands.task import run
        return run(args)

    if cmd == "agent":
        from .commands.agent import run
        return run(args)

    if cmd == "agent-snapshot":
        from .commands.agent_snapshot import run
        return run(args)

    if cmd == "metrics":
        from .commands.metrics import run
        return run(args)

    if cmd == "project":
        from .commands.project import run
        return run(args)

    if cmd == "proposal":
        from .commands.proposal import run
        return run(args)

    if cmd == "context":
        from .commands.context import run
        return run(args)

    if cmd == "intent":
        from .commands.intent import run
        return run(args)

    if cmd == "bootstrap":
        from .commands.bootstrap import run
        return run(args)

    if cmd == "status":
        from .commands.status import run
        return run(args)

    if cmd == "openclaw":
        from .commands.openclaw import run
        return run(args)

    if cmd == "version":
        from . import __version__
        print(f"ema {__version__}")
        return 0

    if cmd == "config":
        return _cmd_config(args)

    # Legacy mock harness commands
    if cmd in ("mock", "shell", "seed", "reset", "scenario", "engine", "superman",
                "executions", "execution", "providers", "routing",
                "seeds", "token-usage", "session", "projects", "gaps", "intent"):
        return _dispatch_legacy(args, argv)

    print_error(f"Unknown command: {cmd}")
    print()
    print(HELP_TEXT)
    return 1


def _cmd_config(args):
    """ema config — show or set config values."""
    from . import config
    pos = args.pos

    if len(pos) < 2:
        # Show current config
        import json
        cfg = {
            "host": config.host(),
            "timeout": config.timeout(),
            "config_file": str(config.CONFIG_PATH),
        }
        print(c("\n  EMA CLI Configuration", BOLD + CYAN))
        print()
        for k, v in cfg.items():
            print(f"  {k:<16} {v}")
        print()
        return 0

    sub = pos[1]
    if sub == "set" and len(pos) >= 4:
        key, val = pos[2], pos[3]
        config.set_val(key, val)
        path = config.save()
        print(c(f"  ✓ Set {key}={val} in {path}", GREEN))
        return 0

    if sub == "path":
        print(str(config.CONFIG_PATH))
        return 0

    print_error(f"Usage: ema config [set <key> <value> | path]")
    return 1


def _dispatch_legacy(args, argv):
    """Fall through to the old mock harness CLI."""
    from .cli import dispatch
    return dispatch(argv)


def entry():
    """Setuptools entry point."""
    rc = main(sys.argv[1:])
    sys.exit(rc or 0)


if __name__ == "__main__":
    entry()
