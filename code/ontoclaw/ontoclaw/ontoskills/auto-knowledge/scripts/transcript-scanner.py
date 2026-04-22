#!/usr/bin/env python3
"""
transcript-scanner.py — Extract knowledge suggestions from OpenClaw session transcripts.
Cron: every 3h (gated by usage). No pip deps, no LLM calls.

Scans JSONL session files for:
- Patterns: recurring approaches, workflows, commands
- Extractions: URLs, configs, env vars, facts discovered
- Decisions: architectural choices, tool selections

Output: /tmp/auto-knowledge-queue.json (sorted by score desc)
"""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

AGENTS_DIR = Path.home() / ".openclaw" / "agents"
STATE_FILE = Path.home() / ".openclaw" / "agents" / "main" / "workspace" / "memory" / "scanner-state.json"
QUEUE_FILE = Path("/tmp/auto-knowledge-queue.json")

# Patterns to extract knowledge from assistant messages
KNOWLEDGE_PATTERNS = [
    {
        "type": "decision",
        "patterns": [
            r"(?:decided|choosing|went with|selected|picked|using)\s+(.{10,120}?)(?:\.|$)",
            r"(?:better approach|the right way|best option)\s+(?:is|was)\s+(.{10,120}?)(?:\.|$)",
        ],
        "weight": 3,
    },
    {
        "type": "pattern",
        "patterns": [
            r"(?:pattern|workflow|approach|technique|method):\s*(.{10,150}?)(?:\.|$)",
            r"(?:always|never|should|must)\s+(.{10,100}?)(?:when|before|after|if)\s+(.{10,80}?)(?:\.|$)",
        ],
        "weight": 2,
    },
    {
        "type": "extraction",
        "patterns": [
            r"(https?://\S{10,200})",
            r"(?:config|setting|variable|env).*?[=:]\s*(.{5,100}?)(?:\s|$)",
            r"(?:installed|added|enabled)\s+(.{5,80}?)(?:\.|,|\s+(?:and|for|to))",
        ],
        "weight": 1,
    },
    {
        "type": "fix",
        "patterns": [
            r"(?:fix|fixed|resolved|solved|workaround)(?:ed)?\s+(?:by|with|using)\s+(.{10,150}?)(?:\.|$)",
            r"(?:the (?:issue|problem|bug) was)\s+(.{10,150}?)(?:\.|$)",
        ],
        "weight": 4,
    },
]

# Skip patterns (noise)
SKIP_PATTERNS = [
    r"^I'll\s",
    r"^Let me\s",
    r"^Sure\b",
    r"^OK\b",
    r"^Here's\s",
    r"test|dummy|example|placeholder",
]


def load_state():
    """Load scanner state (which sessions have been scanned)."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"scanned": {}}


def save_state(state):
    """Persist scanner state."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def find_sessions():
    """Find all active (non-deleted) JSONL session files."""
    sessions = []
    for agent_dir in AGENTS_DIR.iterdir():
        if not agent_dir.is_dir() or agent_dir.name.startswith("_"):
            continue
        sess_dir = agent_dir / "sessions"
        if not sess_dir.exists():
            continue
        for f in sess_dir.iterdir():
            if f.suffix == ".jsonl" and ".deleted." not in f.name:
                sessions.append(f)
    return sessions


def extract_assistant_text(session_file):
    """Extract assistant message text from a JSONL session file."""
    texts = []
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
                if msg.get("role") != "assistant":
                    continue
                content = msg.get("content", [])
                if isinstance(content, str):
                    texts.append(content)
                elif isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            texts.append(block.get("text", ""))
    except Exception as e:
        print(f"[scanner] Error reading {session_file}: {e}", file=sys.stderr)
    return texts


def scan_text(text, session_id):
    """Extract knowledge suggestions from text."""
    suggestions = []
    for skip in SKIP_PATTERNS:
        if re.match(skip, text, re.IGNORECASE):
            return []

    for category in KNOWLEDGE_PATTERNS:
        for pattern in category["patterns"]:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for m in matches:
                content = m.group(1).strip() if m.lastindex else m.group(0).strip()
                if len(content) < 10 or len(content) > 300:
                    continue
                # Skip if it's just a URL for extraction type
                if category["type"] == "extraction" and content.startswith("http"):
                    # Still capture URLs but with lower weight
                    pass

                title = content[:80].strip()
                if title.endswith(","):
                    title = title[:-1]

                suggestions.append({
                    "type": category["type"],
                    "title": title,
                    "content": content,
                    "session": session_id,
                    "score": category["weight"],
                    "tags": [category["type"]],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
    return suggestions


def deduplicate(suggestions):
    """Remove near-duplicate suggestions by title similarity."""
    seen_titles = set()
    unique = []
    for s in suggestions:
        # Normalize title for dedup
        norm = re.sub(r'\s+', ' ', s["title"].lower().strip())
        if norm not in seen_titles:
            seen_titles.add(norm)
            unique.append(s)
    return unique


def main():
    state = load_state()
    scanned = state.get("scanned", {})
    sessions = find_sessions()

    new_suggestions = []
    newly_scanned = 0

    for sess_file in sessions:
        sess_id = sess_file.stem
        file_mtime = str(sess_file.stat().st_mtime)

        # Skip if already scanned at this mtime
        if scanned.get(sess_id) == file_mtime:
            continue

        texts = extract_assistant_text(sess_file)
        for text in texts:
            suggestions = scan_text(text, sess_id)
            new_suggestions.extend(suggestions)

        scanned[sess_id] = file_mtime
        newly_scanned += 1

    # Merge with existing queue
    existing = []
    if QUEUE_FILE.exists():
        try:
            with open(QUEUE_FILE) as f:
                existing = json.load(f)
        except (json.JSONDecodeError, Exception):
            existing = []

    all_suggestions = existing + new_suggestions
    all_suggestions = deduplicate(all_suggestions)
    # Sort by score descending
    all_suggestions.sort(key=lambda x: x.get("score", 0), reverse=True)
    # Cap at 50 entries
    all_suggestions = all_suggestions[:50]

    with open(QUEUE_FILE, "w") as f:
        json.dump(all_suggestions, f, indent=2)

    # Save state
    state["scanned"] = scanned
    save_state(state)

    print(f"[scanner] Scanned {newly_scanned} new/modified sessions, "
          f"found {len(new_suggestions)} suggestions, "
          f"queue total: {len(all_suggestions)}")


if __name__ == "__main__":
    main()
