"""
ema intent — canonical intent/project-state bootstrap commands.
"""
from .. import client
from ..client import DaemonError
from ..output import print_json, print_error, print_info, c, BOLD, CYAN, GREY, GOLD


def _daemon_unreachable(e: DaemonError):
    host = e.host
    print_error(f"Cannot reach EMA daemon at {host}")
    print_info("  → Try: cd ~/Projects/ema/daemon && mix phx.server")
    print_info("  → Or:  ema status")


def _print_intents(data):
    intents = data.get("intents", [])
    print()
    print(c(f"  Intents ({len(intents)})", BOLD + CYAN))
    print()
    for intent in intents:
        print(f"  • {intent.get('id')}  [{intent.get('status')}]  {intent.get('title')}")
        if intent.get("current_focus"):
            print(c(f"    focus: {intent.get('current_focus')}", GREY))
    print()


def _print_snapshot(data):
    print()
    print(c(f"  Intent Snapshot — {data.get('project', '?')}", BOLD + CYAN))
    print()
    print(f"  focus         {data.get('focus', '—')}")
    print(f"  active        {data.get('active', 0)}")
    print(f"  blocked       {data.get('blocked', 0)}")
    blockers = data.get("top_blockers", [])
    if blockers:
        print(c("\n  Blockers", GOLD))
        for item in blockers[:5]:
            print(f"    • {item}")
    next_actions = data.get("next_actions", [])
    if next_actions:
        print(c("\n  Next actions", GOLD))
        for item in next_actions[:5]:
            print(f"    • {item}")
    print()


def cmd_list(args, json_out=False):
    if len(args.pos) < 3 or args.pos[1] != "--project":
        print_error("Usage: ema intent list --project <project>")
        return 1

    project = args.pos[2]
    params = {}
    if args.get("status"):
        params["status"] = args.get("status")
    if args.get("kind"):
        params["kind"] = args.get("kind")

    try:
        code, data = client.get(f"/api/control-plane/projects/{project}/intents", params=params)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_intents(data)
    return 0


def cmd_snapshot(args, json_out=False):
    if len(args.pos) < 4 or args.pos[2] != "--project":
        print_error("Usage: ema intent snapshot --project <project>")
        return 1

    project = args.pos[3]
    try:
        code, data = client.get(f"/api/control-plane/projects/{project}/intent-snapshot")
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_snapshot(data)
    return 0


def cmd_bootstrap(args, json_out=False):
    if len(args.pos) < 4 or args.pos[2] != "--project":
        print_error("Usage: ema intent bootstrap --project <project>")
        return 1

    project = args.pos[3]
    body = {"title": project.upper()}

    try:
        code, data = client.post(f"/api/control-plane/projects/{project}/bootstrap", body=body)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    print_json(data) if (json_out or args.has("json") or args.has("j")) else _print_snapshot({
        "project": data.get("project", {}).get("project"),
        "focus": data.get("project", {}).get("current_focus_intent_id"),
        "active": len(data.get("created_intents", [])) + len(data.get("existing_intents", [])),
        "blocked": 0,
        "top_blockers": [],
        "next_actions": []
    })
    return 0


def cmd_update(args, json_out=False):
    if len(args.pos) < 3:
        print_error("Usage: ema intent update <intent-id> [--status <status>] [--focus <text>]")
        return 1

    intent_id = args.pos[2]
    patch = {}
    if args.get("status"):
        patch["status"] = args.get("status")
    if args.get("focus"):
        patch["current_focus"] = args.get("focus")
    if not patch:
        print_error("Need at least one patch field: --status or --focus")
        return 1

    try:
        code, data = client.post(f"/api/control-plane/intents/{intent_id}/update", body={"patch": patch})
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    print_json(data) if (json_out or args.has("json") or args.has("j")) else _print_intents({"intents": [data.get("intent", {})]})
    return 0


def run(args):
    pos = args.pos
    json_out = args.has("json") or args.has("j")

    if len(pos) < 2:
        _print_help()
        return 0

    sub = pos[1]
    dispatch = {
        "list": cmd_list,
        "snapshot": cmd_snapshot,
        "bootstrap": cmd_bootstrap,
        "update": cmd_update,
    }

    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown intent subcommand: {sub}")
        _print_help()
        return 1

    return handler(args, json_out=json_out)


def _print_help():
    print(c("\n  ema intent — Intent coordination", BOLD + CYAN))
    print()
    print(f"  {c('ema intent list --project <project>', CYAN)}")
    print(f"  {c('ema intent snapshot --project <project>', CYAN)}")
    print(f"  {c('ema intent bootstrap --project <project>', CYAN)}")
    print(f"  {c('ema intent update <intent-id> --status <status> [--focus <text>]', CYAN)}")
    print()
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
