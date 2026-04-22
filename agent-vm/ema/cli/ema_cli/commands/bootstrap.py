"""
ema bootstrap — jumpstarter and readiness-oriented bootstrap commands.
"""
from .. import client
from ..client import DaemonError
from ..output import print_json, print_error, print_info, c, BOLD, CYAN, GREY


def _daemon_unreachable(e: DaemonError):
    host = e.host
    print_error(f"Cannot reach EMA daemon at {host}")
    print_info("  → Try: cd ~/Projects/ema/daemon && mix phx.server")
    print_info("  → Or:  ema status")


def cmd_readiness(args, json_out=False):
    project = args.get("project", "ema")
    results = {}
    paths = {
        "project_state": f"/api/control-plane/projects/{project}/state",
        "intents": f"/api/control-plane/projects/{project}/intents",
        "intent_snapshot": f"/api/control-plane/projects/{project}/intent-snapshot",
        "project_package": f"/api/context/project/{project}/package",
    }

    try:
        for key, path in paths.items():
            code, data = client.get(path)
            results[key] = {"status": code, "ok": code == 200, "body": data}
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if json_out or args.has("json") or args.has("j"):
        print_json(results)
    else:
        print()
        print(c(f"  EMA Bootstrap Readiness — {project}", BOLD + CYAN))
        print()
        for key, item in results.items():
            mark = "✓" if item.get("ok") else "✗"
            print(f"  {mark} {key:<16} HTTP {item.get('status')}")
        print()
    return 0


def cmd_project(args, json_out=False):
    if len(args.pos) < 3:
        print_error("Usage: ema bootstrap project <project>")
        return 1

    project = args.pos[2]
    try:
        code, data = client.post(f"/api/control-plane/projects/{project}/bootstrap", body={"title": project.upper()})
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2

    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1

    print_json(data) if (json_out or args.has("json") or args.has("j")) else print_json({
        "project": data.get("project"),
        "created_intents": data.get("created_intents", []),
        "existing_intents": data.get("existing_intents", []),
    })
    return 0


def run(args):
    pos = args.pos
    json_out = args.has("json") or args.has("j")

    if len(pos) < 2:
        _print_help()
        return 0

    sub = pos[1]
    dispatch = {
        "readiness": cmd_readiness,
        "project": cmd_project,
    }

    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown bootstrap subcommand: {sub}")
        _print_help()
        return 1

    return handler(args, json_out=json_out)


def _print_help():
    print(c("\n  ema bootstrap — Bootstrap jumpstarter", BOLD + CYAN))
    print()
    print(f"  {c('ema bootstrap readiness [--project ema]', CYAN)}")
    print(f"  {c('ema bootstrap project <project>', CYAN)}")
    print()
    print(c("  Global flags: --json (-j)  --host <url>", GREY))
    print()
