"""
ema workspace — shared agent workspace commands.
"""
import os
from pathlib import Path
from datetime import datetime, timezone

from .. import client
from ..client import DaemonError
from ..output import (
    print_json, print_error, print_info,
    c, BOLD, CYAN, GREY, GOLD, GREEN,
)


def _daemon_unreachable(e: DaemonError):
    host = e.host
    print_error(f"Cannot reach EMA daemon at {host}")
    print_info("  → Try: cd ~/Projects/ema/daemon && mix phx.server")
    print_info("  → Or:  ema status")
    print_info("  → Or:  export EMA_HOST=<host:port>")


def _get_packet(actor_id, project=None):
    params = {"project": project} if project else None
    return client.get(f"/api/workspace/actors/{actor_id}/packet", params=params)


def _workspace_root():
    return os.environ.get("EMA_WORKSPACE_ROOT", "/home/trajan/Projects/ema/workspace/shared")


def _slugify(text):
    return "-".join("".join(ch.lower() if ch.isalnum() else " " for ch in text).split()) or "block"


def _print_packet(packet):
    actor = packet.get("actor", {})
    focus = packet.get("current_focus", {})
    inbox = packet.get("handoffs", {}).get("inbox", [])
    agenda = packet.get("agenda", {}).get("items", [])
    crumbs = packet.get("sessions", {}).get("breadcrumbs", [])
    refs = packet.get("workspace_refs", {})

    print()
    print(c("  EMA Workspace Packet", BOLD + CYAN))
    print()
    print(f"  Actor           {actor.get('actor_id', '—')}")
    print(f"  Harness         {actor.get('harness', '—')}")
    print(f"  Assignment      {focus.get('assignment', '—')}")
    print(f"  Workspace Root  {refs.get('root', '—')}")

    if inbox:
        print()
        print(c(f"  Handoffs ({len(inbox)})", GOLD))
        for item in inbox[:5]:
            print(f"    • {item.get('subject', '(no subject)')}")

    if agenda:
        print()
        print(c(f"  Agenda ({len(agenda)})", GOLD))
        for item in agenda[:5]:
            print(f"    • {item.get('title', '(untitled)')} [{item.get('status', 'unknown')}]")

    if crumbs:
        print()
        print(c(f"  Sessions ({len(crumbs)})", GOLD))
        for item in crumbs[:5]:
            sid = item.get('session_binding_id') or item.get('session_id') or '?'
            print(f"    • {sid} [{item.get('status', 'unknown')}]")
    print()


def cmd_workspace_open(args, json_out=False):
    actor = args.get("actor")
    project = args.get("project")
    if not actor:
        print_error("Usage: ema workspace open --actor <actor-id> [--project <project>]")
        return 1
    try:
        code, data = _get_packet(actor, project=project)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    if json_out or args.has("json") or args.has("j"):
        print_json(data)
    else:
        _print_packet(data)
    return 0


def cmd_workspace_handoff_inbox(args, json_out=False):
    actor = args.get("actor")
    if not actor:
        print_error("Usage: ema workspace handoff-inbox --actor <actor-id>")
        return 1
    try:
        code, data = _get_packet(actor)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    payload = {"handoffs": data.get("handoffs", {"inbox": []})}
    if json_out or args.has("json") or args.has("j"):
        print_json(payload)
    else:
        print()
        print(c("  Handoff Inbox", BOLD + CYAN))
        print()
        inbox = payload["handoffs"].get("inbox", [])
        if not inbox:
            print(c("  (no handoffs)", GREY))
        else:
            for item in inbox:
                print(f"  • {item.get('subject', '(no subject)')}")
        print()
    return 0


def cmd_workspace_agenda(args, json_out=False):
    actor = args.get("actor")
    if not actor:
        print_error("Usage: ema workspace agenda --actor <actor-id>")
        return 1
    try:
        code, data = _get_packet(actor)
    except DaemonError as e:
        _daemon_unreachable(e)
        return 2
    if code != 200:
        print_error(data.get("error", data.get("message", f"Error {code}")))
        return 1
    payload = {"agenda": data.get("agenda", {"items": []})}
    if json_out or args.has("json") or args.has("j"):
        print_json(payload)
    else:
        print()
        print(c("  Agenda", BOLD + CYAN))
        print()
        items = payload["agenda"].get("items", [])
        if not items:
            print(c("  (no agenda items)", GREY))
        else:
            for item in items:
                print(f"  • {item.get('title', '(untitled)')} [{item.get('status', 'unknown')}]")
        print()
    return 0


def cmd_workspace_block_create(args, json_out=False):
    pos = args.pos
    title = pos[2] if len(pos) >= 3 else args.get("title")
    actor = args.get("actor")
    start = args.get("start")
    end = args.get("end")
    if not title or not actor or not start or not end:
        print_error("Usage: ema workspace block-create <title> --actor <actor-id> --start <ISO> --end <ISO>")
        return 1

    root = Path(_workspace_root())
    schedules = root / "schedules"
    schedules.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    path = schedules / f"{stamp}--{_slugify(title)}.md"
    content = f"""# {stamp} {title}\n\n- id: block-{_slugify(title)}\n- actor: {actor}\n- title: {title}\n- status: queued\n- scheduled_window:\n    start: {start}\n    end: {end}\n- phase: queued\n- created_at: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}\n- updated_at: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}\n\n## Goal\n\n## Inputs\n\n## Expected output\n"""
    path.write_text(content)
    payload = {"ok": True, "path": str(path)}
    if json_out or args.has("json") or args.has("j"):
        print_json(payload)
    else:
        print()
        print(c("  Block created", BOLD + GREEN))
        print(f"  {path}")
        print()
    return 0


def run(args):
    pos = args.pos
    json_out = args.has("json") or args.has("j")
    if len(pos) < 2:
        _print_workspace_help()
        return 0

    sub = pos[1]
    dispatch = {
        "open": cmd_workspace_open,
        "handoff-inbox": cmd_workspace_handoff_inbox,
        "agenda": cmd_workspace_agenda,
        "block-create": cmd_workspace_block_create,
    }
    handler = dispatch.get(sub)
    if not handler:
        print_error(f"Unknown workspace subcommand: {sub}")
        _print_workspace_help()
        return 1
    return handler(args, json_out=json_out)


def _print_workspace_help():
    print(c("\n  ema workspace — Shared workspace commands", BOLD + CYAN))
    print()
    print(f"  {c('ema workspace open --actor <id>', CYAN)}  {c('open actor workspace packet', GREY)}")
    print(f"  {c('ema workspace handoff-inbox --actor <id>', CYAN)}  {c('show inbox handoffs', GREY)}")
    print(f"  {c('ema workspace agenda --actor <id>', CYAN)}  {c('show actor agenda', GREY)}")
    print(f"  {c('ema workspace block-create <title> --actor <id> --start <ISO> --end <ISO>', CYAN)}  {c('write a schedule block', GREY)}")
    print()
