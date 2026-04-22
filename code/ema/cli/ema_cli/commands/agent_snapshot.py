"""
ema agent-snapshot — Canonical EMA operator/agent snapshot.
"""

from .. import client, config
from ..output import print_json, print_header, print_info, print_warn


def run(args):
    json_out = args.has("json") or args.has("j")
    project = args.get("project") or args.get("p")

    data = client.control_plane_snapshot(project=project)

    if json_out:
        print_json(data)
        return 0

    print_header("EMA AGENT SNAPSHOT")
    print_info(f"host: {config.host()}")
    print_info(f"mode: {data.get('mode', 'unknown')}")

    available = data.get("available_endpoints", [])
    if available:
        print_info("endpoints: " + ", ".join(available))

    notes = data.get("notes", []) or data.get("compat_notes", [])
    if notes:
        print_warn("notes:")
        for note in notes[:5]:
            print(f"  - {note}")

    print_json(data)
    return 0
