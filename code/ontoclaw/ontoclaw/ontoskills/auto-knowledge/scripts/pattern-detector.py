#!/usr/bin/env python3
"""
pattern-detector.py — Detect repeated task patterns across sessions.
Cron: every 6h. No pip deps, no LLM calls.

Tracks patterns from session transcripts and proposes new agents
when a pattern hits threshold (5+ occurrences across 2+ days).
Output: vault/Agents/Skill Proposals.md (appends new proposals)
"""

import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

AGENTS_DIR = Path.home() / ".openclaw" / "agents"
PATTERN_LOG = Path.home() / ".openclaw" / "agents" / "main" / "workspace" / "memory" / "pattern-log.json"
PROPOSALS_FILE = Path.home() / "vault" / "Agents" / "Skill Proposals.md"

# Pattern categories to detect
PATTERN_CATEGORIES = {
    "agent-architecture": [
        r"agent.*(?:create|spawn|config|roster|orchestrat)",
        r"(?:multi.agent|sub.?agent|bureau|delegation)",
        r"AGENTS\.md|SOUL\.md|agent.*workspace",
    ],
    "troubleshooting": [
        r"(?:error|fail|crash|broke|broken).*(?:fix|resolv|debug|diagnos)",
        r"(?:systemctl|journal|log).*(?:error|fail|restart)",
        r"(?:not (?:working|responding|running))",
    ],
    "browser-automation": [
        r"(?:browser|chromium|puppeteer|playwright|screenshot)",
        r"(?:headless|page\.goto|page\.click)",
    ],
    "security-audit": [
        r"(?:security|vulnerab|hardening|CVE|injection)",
        r"(?:firewall|ufw|iptables|oauth|token.*leak)",
    ],
    "discord-setup": [
        r"(?:discord|channel.*create|guild|webhook|embed)",
        r"(?:forum.*thread|category.*create|permission.*set)",
    ],
    "config-change": [
        r"(?:openclaw\.json|systemctl.*restart|config.*(?:change|update|edit))",
        r"(?:crontab|\.env|\.json).*(?:edit|modify|update)",
    ],
    "vault-management": [
        r"(?:vault.*note|qmd.*(?:update|search)|obsidian)",
        r"(?:wikilink|frontmatter|knowledge.*graph)",
    ],
    "cron-automation": [
        r"(?:cron|heartbeat|schedule|timer|periodic)",
        r"(?:watchdog|health.*check|auto.*(?:run|resume))",
    ],
    "research-tool": [
        r"(?:research|evaluat|compar).*(?:tool|library|framework)",
        r"(?:npm.*install|pip.*install|clawhub.*search)",
    ],
    "coding-delegation": [
        r"(?:claude.*--print|codex|spawn.*claude)",
        r"(?:host-claude|claude-code-bot|bypass.*permission)",
    ],
}


def load_pattern_log():
    """Load existing pattern tracking data."""
    if PATTERN_LOG.exists():
        try:
            with open(PATTERN_LOG) as f:
                return json.load(f)
        except (json.JSONDecodeError, Exception):
            pass
    return {"patterns": [], "last_scan": None}


def save_pattern_log(data):
    """Save pattern tracking data."""
    PATTERN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(PATTERN_LOG, "w") as f:
        json.dump(data, f, indent=2)


def find_recent_sessions():
    """Find session files modified in the last 24h."""
    sessions = []
    now = datetime.now(timezone.utc).timestamp()
    cutoff = now - 86400  # 24 hours

    for agent_dir in AGENTS_DIR.iterdir():
        if not agent_dir.is_dir() or agent_dir.name.startswith("_"):
            continue
        sess_dir = agent_dir / "sessions"
        if not sess_dir.exists():
            continue
        for f in sess_dir.iterdir():
            if f.suffix == ".jsonl" and ".deleted." not in f.name:
                if f.stat().st_mtime > cutoff:
                    sessions.append(f)
    return sessions


def extract_tool_calls(session_file):
    """Extract tool usage text from a JSONL session file."""
    tool_texts = []
    try:
        with open(session_file) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                if entry.get("type") != "message":
                    continue
                msg = entry.get("message", {})
                content = msg.get("content", [])
                if isinstance(content, str):
                    tool_texts.append(content)
                elif isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict):
                            if block.get("type") == "text":
                                tool_texts.append(block.get("text", ""))
                            elif block.get("type") == "tool_use":
                                tool_texts.append(json.dumps(block.get("input", {})))
                            elif block.get("type") == "tool_result":
                                tool_texts.append(str(block.get("content", "")))
    except Exception as e:
        print(f"[pattern-detector] Error reading {session_file}: {e}", file=sys.stderr)
    return tool_texts


def detect_patterns(texts, session_id, today):
    """Match text against pattern categories."""
    hits = defaultdict(int)
    for text in texts:
        for category, regexes in PATTERN_CATEGORIES.items():
            for regex in regexes:
                if re.search(regex, text, re.IGNORECASE):
                    hits[category] += 1
                    break  # One hit per category per text block
    return hits


def update_pattern_log(pattern_log, hits, session_id, today):
    """Update pattern log with new hits."""
    patterns = {p["type"]: p for p in pattern_log.get("patterns", [])}

    for category, count in hits.items():
        if category in patterns:
            p = patterns[category]
            p["count"] = p.get("count", 0) + count
            if today not in p.get("days", []):
                p["days"].append(today)
            if session_id not in p.get("sessions", []):
                p["sessions"].append(session_id)
        else:
            patterns[category] = {
                "type": category,
                "count": count,
                "days": [today],
                "first_seen": datetime.now(timezone.utc).isoformat(),
                "sessions": [session_id],
            }

    pattern_log["patterns"] = list(patterns.values())
    return pattern_log


def check_proposals(pattern_log):
    """Check if any patterns hit the threshold for proposal."""
    proposals = []
    for p in pattern_log.get("patterns", []):
        if p["count"] >= 5 and len(p.get("days", [])) >= 2:
            proposals.append(p)
    return proposals


def read_existing_proposals():
    """Read already-proposed patterns from the proposals file."""
    existing = set()
    if PROPOSALS_FILE.exists():
        with open(PROPOSALS_FILE) as f:
            for line in f:
                m = re.match(r"## Proposal:\s+(.+?)(?:\s+Specialist)?$", line.strip())
                if m:
                    existing.add(m.group(1).lower().replace(" ", "-"))
                # Also match pattern field
                m2 = re.match(r"\*\*Pattern:\*\*\s+`(.+?)`", line.strip())
                if m2:
                    existing.add(m2.group(1).lower())
    return existing


def append_proposal(pattern):
    """Append a new proposal to the Skill Proposals file."""
    ptype = pattern["type"]
    count = pattern["count"]
    days = ", ".join(pattern.get("days", [])[:5])
    triggers = PATTERN_CATEGORIES.get(ptype, [])
    trigger_str = ", ".join(t.replace("(?:", "").replace(")", "").split("|")[0][:30]
                           for t in triggers[:3])

    title = ptype.replace("-", " ").title()
    proposal = f"""

## Proposal: {title} Specialist

**Pattern:** `{ptype}` detected {count} times across {len(pattern.get('days', []))} days
**Days active:** {days}
**Status:** \u23f3 Pending

### Evidence

### Proposed Triggers
`{trigger_str}`

### Notes
Review whether this warrants a dedicated agent or just a skill enhancement.
Consider: Is there a Discord channel that would route to this specialist?

---
"""
    with open(PROPOSALS_FILE, "a") as f:
        f.write(proposal)

    print(f"[pattern-detector] New proposal: {title} Specialist "
          f"({count} hits across {len(pattern.get('days', []))} days)")


def main():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    pattern_log = load_pattern_log()
    sessions = find_recent_sessions()

    total_hits = 0
    for sess_file in sessions:
        sess_id = sess_file.stem
        texts = extract_tool_calls(sess_file)
        hits = detect_patterns(texts, sess_id, today)
        if hits:
            pattern_log = update_pattern_log(pattern_log, hits, sess_id, today)
            total_hits += sum(hits.values())

    pattern_log["last_scan"] = datetime.now(timezone.utc).isoformat()
    save_pattern_log(pattern_log)

    # Check for new proposals
    proposals = check_proposals(pattern_log)
    existing = read_existing_proposals()
    new_proposals = [p for p in proposals if p["type"] not in existing]

    for p in new_proposals:
        append_proposal(p)

    print(f"[pattern-detector] Scanned {len(sessions)} recent sessions, "
          f"{total_hits} pattern hits, {len(new_proposals)} new proposals")


if __name__ == "__main__":
    main()
