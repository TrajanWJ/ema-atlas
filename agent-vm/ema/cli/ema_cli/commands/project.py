"""
ema project — Project management commands.
Makes real HTTP calls to EMA daemon.
"""
import sys
from .. import client, config, compat
from ..client import DaemonError
from ..output import (
    print_json, print_table, print_success, print_error, print_info,
    print_created, c, GREEN, CYAN, YELLOW, RED, BOLD, GREY, DIM, GOLD,
)


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

STATUS_COLORS = {
    "active": GREEN, "paused": YELLOW, "archived": DIM,
    "incubating": CYAN, "completed": GREY,
}


def _print_projects_table(projects):
    if not projects:
        print(c("  (no projects)", GREY))
        return
    print_table(projects, [
        ("id",          "ID",          18),
        ("name",        "Name",        24),
        ("slug",        "Slug",        20),
        ("status",      "Status",      12),
        ("linked_path", "Path",        36),
    ], title=f"Projects ({len(projects)})")


def _print_project_detail(project, json_out=False):
    if json_out:
        print_json(project)
        return
    print()
    print(c(f"  Project: {project.get('name', 'Untitled')}", BOLD + CYAN))
    print(c(f"  ID:      {project.get('id', '?')}", GREY))
    print()
    fields = [
        ("Slug",        "slug"),
        ("Status",      "status"),
        ("Path",        "linked_path"),
        ("Repo",        "repo"),
        ("Deploy URL",  "deploy_url"),
        ("Client",      "client"),
        ("Description", "description"),
        ("Created",     "inserted_at"),
    ]
    for label, key in fields:
        val = project.get(key)
        if val:
            print(f"  {label:<14} {val}")

    # Task/proposal counts if available
    tasks = project.get("task_count", project.get("tasks"))
    proposals = project.get("proposal_count", project.get("proposals"))
    if tasks is not None:
        print(f"  {'Tasks':<14} {tasks}")
    if proposals is not None:
        print(f"  {'Proposals':<14} {proposals}")
    print()


# ---------------------------------------------------------------------------
# Command implementations
# ---------------------------------------------------------------------------

def cmd_project_list(args, json_out=False):
    """ema project list [OPTIONS]"""
    params = {}
    if args.get("status"):
        params["status"] = args.get("status")
    if args.get("limit"):
        params["limit"] = args.get("limit")
    if args.get("sort"):
        params["sort"] = args.get("sort")

    try:
        code, projects = compat.projects_list()
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(f"Error {code}")
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json({"projects": projects})
    else:
        _print_projects_table(projects)
    return 0


def cmd_project_show(args, json_out=False):
    """ema project show <id|slug>"""
    pos = args.pos
    if len(pos) < 3:
        print_error("Usage: ema project show <id|slug>")
        return 1
    project_id = pos[2]

    try:
        code, project = compat.project_show(project_id)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code == 404:
        print_error(f"Project {project_id} not found")
        return 1
    if code != 200:
        print_error(f"Error {code}")
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json({"project": project})
    else:
        _print_project_detail(project)
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
    """Entry point from main CLI: args.pos = ['project', <sub>, ...]"""
    pos = args.pos
    json_out = args.has("json") or args.has("j")

    if len(pos) < 2:
        _print_project_help()
        return 0

    sub = pos[1]
    dispatch = {
        "list": cmd_project_list,
        "show": cmd_project_show,
        "get":  cmd_project_show,
    }

    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown project subcommand: {sub}")
        _print_project_help()
        return 1

    return handler(args, json_out=json_out)


def _print_project_help():
    print(c("\n  ema project — Project management", BOLD + CYAN))
    print()
    cmds = [
        ("list", "[--status active|paused|archived] [--limit <n>] [--sort name|last_active]"),
        ("show", "<id|slug>"),
    ]
    for sub, usage in cmds:
        print(f"  {c('ema project ' + sub, CYAN)}  {c(usage, GREY)}")
    print()
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
