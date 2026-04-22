"""
ema proposal — Proposal lifecycle commands.
Makes real HTTP calls to EMA daemon.
"""
import sys
from .. import client, config, compat
from ..client import DaemonError
from ..output import (
    print_json, print_table, print_success, print_error, print_info,
    print_created, c, GREEN, CYAN, YELLOW, RED, BOLD, GREY, DIM, GOLD, MAGENTA,
)


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

STATUS_COLORS = {
    "generating": CYAN, "queued": CYAN, "pending": YELLOW,
    "approved": GREEN, "rejected": RED, "killed": RED + BOLD,
    "draft": DIM, "scored": CYAN,
}


def _print_proposals_table(proposals):
    if not proposals:
        print(c("  (no proposals)", GREY))
        return
    print_table(proposals, [
        ("id",          "ID",          18),
        ("title",       "Title",       42),
        ("status",      "Status",      12),
        ("confidence",  "Confidence",  12),
        ("project_id",  "Project",     18),
        ("inserted_at", "Created",     22),
    ], title=f"Proposals ({len(proposals)})")


def _print_proposal_detail(proposal, json_out=False):
    if json_out:
        print_json(proposal)
        return
    print()
    print(c(f"  Proposal: {proposal.get('title', 'Untitled')}", BOLD + CYAN))
    print(c(f"  ID:       {proposal.get('id', '?')}", GREY))
    print()
    fields = [
        ("Status",      "status"),
        ("Project",     "project_id"),
        ("Confidence",  "confidence"),
        ("Score",       "idea_score"),
        ("Description", "description"),
        ("Summary",     "summary"),
        ("Created",     "inserted_at"),
    ]
    for label, key in fields:
        val = proposal.get(key)
        if val is not None:
            print(f"  {label:<14} {val}")

    tags = proposal.get("tags", [])
    if tags:
        print(f"  {'Tags':<14} {', '.join(tags)}")

    risks = proposal.get("risks", [])
    if risks:
        print(c(f"\n  Risks:", BOLD))
        for r in risks:
            print(f"    · {r}")

    benefits = proposal.get("benefits", [])
    if benefits:
        print(c(f"\n  Benefits:", BOLD))
        for b in benefits:
            print(f"    · {b}")
    print()


# ---------------------------------------------------------------------------
# Command implementations
# ---------------------------------------------------------------------------

def cmd_proposal_list(args, json_out=False):
    """ema proposal list [OPTIONS]"""
    params = {}
    if args.get("project"):
        params["project_id"] = args.get("project")
    if args.get("status"):
        params["status"] = args.get("status")
    if args.get("limit"):
        params["limit"] = args.get("limit")

    try:
        code, proposals = compat.proposals_list(project=args.get("project"))
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(f"Error {code}")
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json({"proposals": proposals})
    else:
        _print_proposals_table(proposals)
    return 0


def cmd_proposal_show(args, json_out=False):
    """ema proposal show <proposal_id>"""
    pos = args.pos
    if len(pos) < 3:
        print_error("Usage: ema proposal show <proposal_id>")
        return 1
    proposal_id = pos[2]

    try:
        code, proposal = compat.proposal_show(proposal_id)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code == 404:
        print_error(f"Proposal {proposal_id} not found")
        return 1
    if code != 200:
        print_error(f"Error {code}")
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json({"proposal": proposal})
    else:
        _print_proposal_detail(proposal)
    return 0


def _daemon_unreachable(e: DaemonError):
    host = e.host
    print_error(f"Cannot reach EMA daemon at {host}")
    print_info(f"  → Try: cd ~/Projects/ema/daemon && mix phx.server")
    print_info(f"  → Or:  ema status")


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

def run(args):
    """Entry point from main CLI."""
    pos = args.pos
    json_out = args.has("json") or args.has("j")

    if len(pos) < 2:
        _print_proposal_help()
        return 0

    sub = pos[1]
    dispatch = {
        "list": cmd_proposal_list,
        "show": cmd_proposal_show,
        "get":  cmd_proposal_show,
    }

    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown proposal subcommand: {sub}")
        _print_proposal_help()
        return 1

    return handler(args, json_out=json_out)


def _print_proposal_help():
    print(c("\n  ema proposal — Proposal lifecycle", BOLD + CYAN))
    print()
    cmds = [
        ("list", "[--project <id>] [--status <s>] [--limit <n>]"),
        ("show", "<proposal_id>"),
    ]
    for sub, usage in cmds:
        print(f"  {c('ema proposal ' + sub, CYAN)}  {c(usage, GREY)}")
    print()
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
