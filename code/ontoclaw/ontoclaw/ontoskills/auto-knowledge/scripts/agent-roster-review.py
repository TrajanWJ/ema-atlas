#!/usr/bin/env python3
"""
agent-roster-review.py — Weekly agent roster health report.
Cron: Sunday midnight. No pip deps, no LLM calls.

Checks:
- Which agents have active sessions
- Which agents are idle (no sessions in 7 days)
- Session counts per agent
- Archived agents that could be cleaned up

Output: vault/Agents/Roster Health Report.md
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

AGENTS_DIR = Path.home() / ".openclaw" / "agents"
CONFIG_FILE = Path.home() / ".openclaw" / "openclaw.json"
VAULT_OUTPUT = Path.home() / "vault" / "Agents" / "Roster Health Report.md"


def get_configured_agents():
    """Read agent list from openclaw.json."""
    agents = []
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE) as f:
                config = json.load(f)
            agent_list = config.get("agents", {}).get("list", [])
            for a in agent_list:
                agents.append({
                    "id": a.get("id", "unknown"),
                    "model": a.get("model", "default"),
                })
        except (json.JSONDecodeError, Exception) as e:
            print(f"[roster-review] Error reading config: {e}", file=sys.stderr)
    return agents


def get_agent_session_stats():
    """Get session stats for each agent directory."""
    stats = {}
    now = datetime.now(timezone.utc).timestamp()
    week_ago = now - 604800  # 7 days

    for agent_dir in AGENTS_DIR.iterdir():
        if not agent_dir.is_dir():
            continue

        agent_id = agent_dir.name
        sess_dir = agent_dir / "sessions"
        is_archived = agent_id.startswith("_")

        if not sess_dir.exists():
            stats[agent_id] = {
                "total": 0,
                "recent": 0,
                "last_activity": None,
                "archived": is_archived,
            }
            continue

        total = 0
        recent = 0
        latest_mtime = 0

        for f in sess_dir.iterdir():
            if f.suffix == ".jsonl" and ".deleted." not in f.name:
                total += 1
                mtime = f.stat().st_mtime
                if mtime > latest_mtime:
                    latest_mtime = mtime
                if mtime > week_ago:
                    recent += 1

        stats[agent_id] = {
            "total": total,
            "recent": recent,
            "last_activity": datetime.fromtimestamp(latest_mtime, tz=timezone.utc).isoformat() if latest_mtime > 0 else None,
            "archived": is_archived,
        }

    return stats


def generate_report(configured, stats):
    """Generate the roster health report."""
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d")

    lines = [
        f"# Agent Roster Health Report",
        f"",
        f"**Generated:** {now.isoformat()}",
        f"**Period:** Last 7 days",
        f"",
        f"## Active Agents",
        f"",
        f"| Agent | Model | Sessions (7d) | Total Sessions | Last Activity |",
        f"|-------|-------|---------------|----------------|---------------|",
    ]

    configured_ids = {a["id"] for a in configured}
    active = []
    idle = []

    for agent in configured:
        aid = agent["id"]
        s = stats.get(aid, {"total": 0, "recent": 0, "last_activity": None, "archived": False})
        last = s["last_activity"][:10] if s["last_activity"] else "never"
        lines.append(f"| {aid} | {agent['model']} | {s['recent']} | {s['total']} | {last} |")
        if s["recent"] > 0:
            active.append(aid)
        else:
            idle.append(aid)

    lines.extend([
        f"",
        f"## Summary",
        f"",
        f"- **Active (7d):** {len(active)} agents ({', '.join(active) if active else 'none'})",
        f"- **Idle (7d):** {len(idle)} agents ({', '.join(idle) if idle else 'none'})",
        f"- **Configured:** {len(configured)}",
        f"",
    ])

    # Check for unconfigured agent dirs
    unconfigured = [aid for aid in stats if aid not in configured_ids
                    and not stats[aid]["archived"] and aid != "default"]
    if unconfigured:
        lines.extend([
            f"## Unconfigured Agent Directories",
            f"",
            f"These directories exist but have no config entry:",
            f"",
        ])
        for aid in unconfigured:
            s = stats[aid]
            lines.append(f"- `{aid}` — {s['total']} sessions, last: {s['last_activity'][:10] if s['last_activity'] else 'never'}")
        lines.append("")

    # Check archived
    archived = [aid for aid in stats if stats[aid]["archived"]]
    if archived:
        lines.extend([
            f"## Archived Agents",
            f"",
            f"| Agent | Total Sessions | Last Activity |",
            f"|-------|----------------|---------------|",
        ])
        for aid in archived:
            s = stats[aid]
            last = s["last_activity"][:10] if s["last_activity"] else "never"
            lines.append(f"| {aid} | {s['total']} | {last} |")
        lines.append("")

    # Recommendations
    lines.extend([
        f"## Recommendations",
        f"",
    ])
    if idle:
        lines.append(f"- Consider reviewing idle agents: {', '.join(idle)}")
    if unconfigured:
        lines.append(f"- Unconfigured directories may need cleanup or config entries")
    if not idle and not unconfigured:
        lines.append(f"- Roster is healthy. All configured agents had activity this week.")
    lines.append("")
    lines.append(f"---")
    lines.append(f"*Auto-generated by agent-roster-review.py*")

    return "\n".join(lines)


def main():
    configured = get_configured_agents()
    stats = get_agent_session_stats()
    report = generate_report(configured, stats)

    VAULT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(VAULT_OUTPUT, "w") as f:
        f.write(report)

    active_count = sum(1 for a in configured
                       if stats.get(a["id"], {}).get("recent", 0) > 0)
    print(f"[roster-review] Report written. {len(configured)} configured, "
          f"{active_count} active this week")


if __name__ == "__main__":
    main()
