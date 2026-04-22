"""
ema task — Task management commands.
Makes real HTTP calls to EMA daemon.
"""
import json
import sys
from .. import client, config, compat
from ..client import DaemonError
from ..output import (
    print_json, print_table, print_success, print_error, print_info,
    print_created, print_warn, c, GREEN, CYAN, YELLOW, RED, BOLD, GREY, DIM,
)


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

PRIORITY_LABELS = {1: "critical", 2: "high", 3: "medium", 4: "low", 5: "trivial"}
PRIORITY_COLORS = {1: RED + BOLD, 2: RED, 3: YELLOW, 4: GREEN, 5: GREY}

STATUS_COLORS = {
    "pending": DIM, "todo": DIM, "in_progress": CYAN, "running": GREEN,
    "done": GREEN, "completed": GREEN, "failed": RED, "blocked": YELLOW,
    "dispatched": CYAN,
}


def _print_tasks_table(tasks):
    if not tasks:
        print(c("  (no tasks)", GREY))
        return
    print_table(tasks, [
        ("id",       "ID",        18),
        ("title",    "Title",     40),
        ("status",   "Status",    12),
        ("priority", "Priority",  10),
        ("due_date", "Due",       12),
        ("agent",    "Agent",     12),
    ], title=f"Tasks ({len(tasks)})")


def _print_task_detail(task, use_json=False):
    if use_json:
        print_json(task)
        return
    print()
    print(c(f"  Task: {task.get('title', 'Untitled')}", BOLD + CYAN))
    print(c(f"  ID:   {task.get('id', '?')}", GREY))
    print()
    fields = [
        ("Status",      "status"),
        ("Priority",    "priority"),
        ("Project",     "project_id"),
        ("Due",         "due_date"),
        ("Agent",       "agent"),
        ("Description", "description"),
        ("Created",     "inserted_at"),
        ("Updated",     "updated_at"),
    ]
    for label, key in fields:
        val = task.get(key)
        if val is not None:
            print(f"  {label:<14} {val}")
    # subtasks
    subtasks = task.get("subtasks", [])
    if subtasks:
        print(c(f"\n  Subtasks ({len(subtasks)}):", BOLD))
        for st in subtasks:
            icon = "✓" if st.get("status") in ("done", "completed") else "·"
            print(f"    {icon} {st.get('title', st.get('id'))}")
    print()


# ---------------------------------------------------------------------------
# Command implementations
# ---------------------------------------------------------------------------

def cmd_task_list(args, json_out=False):
    """ema task list [OPTIONS]"""
    params = {}
    if args.get("project"):
        params["project_id"] = args.get("project")
    if args.get("status"):
        params["status"] = args.get("status")
    if args.get("agent"):
        params["agent_id"] = args.get("agent")
    if args.get("priority"):
        params["priority"] = args.get("priority")
    if args.has("overdue"):
        params["overdue"] = "true"
    if args.has("today"):
        params["due_today"] = "true"
    if args.get("limit"):
        params["limit"] = args.get("limit")
    if args.get("sort"):
        params["sort"] = args.get("sort")

    try:
        code, tasks = compat.tasks_list(project=args.get("project"), status=args.get("status"), limit=args.get("limit"))
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(f"Error {code}")
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json({"tasks": tasks})
    else:
        _print_tasks_table(tasks)
    return 0


def cmd_task_create(args, json_out=False):
    """ema task create "<title>" [OPTIONS]"""
    pos = args.pos
    title = pos[2] if len(pos) >= 3 else args.get("title")
    if not title:
        print_error('Usage: ema task create "<title>" [--project <id>] [--priority <1-5>]')
        return 1

    body = {"title": title}
    if args.get("project"):
        body["project_id"] = args.get("project")
    if args.get("priority"):
        body["priority"] = int(args.get("priority"))
    if args.get("due"):
        body["due_date"] = args.get("due")
    if args.get("description"):
        body["description"] = args.get("description")
    if args.get("agent"):
        body["agent_id"] = args.get("agent")
    if args.get("subtasks"):
        body["subtasks"] = [{"title": t.strip()} for t in args.get("subtasks").split(";")]

    try:
        code, data = client.post("/api/tasks", body=body)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code not in (200, 201):
        print_warn("Daemon does not expose task CRUD yet; use 'ema openclaw propose' for tracked work on this build")
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    task = data.get("task", data.get("data", {}))
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        print_created(task.get("id", "?"), "task")
        _print_task_detail(task)
    return 0


def cmd_task_show(args, json_out=False):
    """ema task show <task_id>"""
    pos = args.pos
    if len(pos) < 3:
        print_error("Usage: ema task show <task_id>")
        return 1
    task_id = pos[2]

    try:
        code, task = compat.task_show(task_id)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code == 404:
        print_error(f"Task {task_id} not found")
        return 1
    if code != 200:
        print_error(f"Error {code}")
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json({"task": task})
    else:
        _print_task_detail(task)
    return 0


def cmd_task_update(args, json_out=False):
    """ema task update <task_id> [OPTIONS]"""
    pos = args.pos
    if len(pos) < 3:
        print_error("Usage: ema task update <task_id> [--status <s>] [--priority <n>] ...")
        return 1
    task_id = pos[2]

    body = {}
    for key in ("status", "priority", "due", "description", "agent", "title"):
        val = args.get(key)
        if val is not None:
            field = "due_date" if key == "due" else "agent_id" if key == "agent" else key
            body[field] = val

    if not body:
        print_error("No fields to update. Provide --status, --priority, --title, etc.")
        return 1

    try:
        code, data = client.put(f"/api/tasks/{task_id}", body=body)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code == 404:
        print_error(f"Task {task_id} not found")
        return 1
    if code != 200:
        print_warn("Daemon does not expose task CRUD yet; use 'ema openclaw dispatch-update/complete' for tracked execution outcomes on this build")
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    task = data.get("task", data.get("data", data))
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        print_success(f"Task {task_id} updated")
        _print_task_detail(task)
    return 0


def _daemon_unreachable(e: DaemonError):
    host = e.host
    print_error(f"Cannot reach EMA daemon at {host}")
    print_info(f"  → Try: cd ~/Projects/ema/daemon && mix phx.server")
    print_info(f"  → Or:  ema status")
    print_info(f"  → Or:  export EMA_HOST=<host:port>")


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

def run(args):
    """Entry point from main CLI: args.pos = ['task', <sub>, ...]"""
    pos = args.pos
    json_out = args.has("json") or args.has("j")

    if len(pos) < 2:
        _print_task_help()
        return 0

    sub = pos[1]
    dispatch = {
        "list":   cmd_task_list,
        "create": cmd_task_create,
        "show":   cmd_task_show,
        "get":    cmd_task_show,
        "update": cmd_task_update,
    }

    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown task subcommand: {sub}")
        _print_task_help()
        return 1

    return handler(args, json_out=json_out)


def _print_task_help():
    print(c("\n  ema task — Task management", BOLD + CYAN))
    print()
    cmds = [
        ("list",   "[--project <id>] [--status <s>] [--priority <n>] [--overdue] [--today]"),
        ("create", '"<title>" [--project <id>] [--priority <1-5>] [--due <date>] [--description <text>]'),
        ("show",   "<task_id>"),
        ("update", "<task_id> [--status <s>] [--priority <n>] [--title <t>]"),
    ]
    for sub, usage in cmds:
        print(f"  {c('ema task ' + sub, CYAN)}  {c(usage, GREY)}")
    print()
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
