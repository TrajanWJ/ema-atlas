---
title: "2026-03-16_0830_\U0001F527 Cron Persistence —"
created: '2026-03-16'
updated: '2026-03-16'
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: session-capture
tags:
  - agents
  - code
  - discord
  - openclaw
  - ops
  - prompts
summary: 'Done. Here''s what was implemented:'
wiki_id: agents/Sessions/2026-03-16_0830____Cron_Persistence__
imported_from: "vault/Agents/Sessions/2026-03-16_0830_\U0001F527 Cron Persistence —.md"
imported_at: '2026-04-04T00:23:56.695Z'
---
# Claude Code Session — 2026-03-16_0830

**Channel:** #🔧 Cron Persistence — doctor --fix wipes runtime crons
**Prompt:** **Problem:** [[OpenClaw]] crons exist at runtime only. `openclaw doctor --fix` wipes the cron array — happened twice already during buildout.\n\n**Impact:** Every restart or doctor run risks losing all sc
**Duration:** 668s
**Tools used:** 65

## Tool calls
- Bash: {"command": "~/claude-code-bot/tools/discord-send.sh 1483016902044291186 \"\ud83d\udcd6 Investigatin
- Bash: {"command": "which [[OpenClaw]] && [[OpenClaw]] --version 2>/dev/null; echo \"---\"; cat ~/.openclaw/opencla
- Bash: {"command": "[[OpenClaw]] cron list 2>/dev/null", "description": "List current runtime crons"}
- Bash: {"command": "[[OpenClaw]] cron list 2>&1 | tail -30", "description": "Get cron list output including std
- Bash: {"command": "cat ~/.openclaw/openclaw.json | python3 -c \"import sys,json; d=json.load(sys.stdin); p
- Bash: {"command": "[[OpenClaw]] --help 2>&1 | grep -i cron", "description": "Find cron-related commands"}
- Bash: {"command": "[[OpenClaw]] cron --help 2>&1", "description": "Get cron subcommand help"}
- Bash: {"command": "[[OpenClaw]] gateway status 2>&1 | head -20", "description": "Check gateway status"}
- Bash: {"command": "[[OpenClaw]] gateway start 2>&1 | head -10 &\nsleep 3 && [[OpenClaw]] gateway status 2>&1 | hea
- Bash: {"command": "[[OpenClaw]] cron add --help 2>&1", "description": "Check cron add syntax"}
- Bash: {"command": "nohup [[OpenClaw]] gateway --port 18789 2>/tmp/[[OpenClaw]]-gw.log &\nsleep 4 && [[OpenClaw]] cron 
- Bash: {"command": "cat /tmp/openclaw-gw.log 2>/dev/null | tail -20", "description": "Check gateway log for
- Bash: {"command": "[[OpenClaw]] gateway start --help 2>&1 | grep -v \"Config warnings\" | grep -v \"plugin dis
- Bash: {"command": "ss -tlnp | grep 18789", "description": "Check if gateway port is listening"}
- Bash: {"command": "[[OpenClaw]] cron list --url ws://127.0.0.1:18789 2>&1 | tail -20", "description": "Try cro
- Bash: {"command": "cat ~/.openclaw/openclaw.json | python3 -c \"import sys,json; d=json.load(sys.stdin); g
- Bash: {"command": "[[OpenClaw]] cron list --token 6b23e14bf2c97a7e8494a1e5e6df61e841b663cb8bdd3c57 2>&1 | grep
- Bash: {"command": "cat ~/.openclaw/openclaw.json | python3 -c \"\nimport sys,json\nd=json.load(sys.stdin)\
- Bash: {"command": "cat ~/.openclaw/openclaw.json | python3 -c \"\nimport sys,json\nd=json.load(sys.stdin)\
- Bash: {"command": "[[OpenClaw]] cron list 2>&1 | grep -v \"Config warnings\" | grep -v \"plugin disabled\" | g
- ... and 45 more

## Result
Done. Here's what was implemented:

**Files created:**
- `~/.openclaw/cron-definitions.json` — canonical source of truth for 3 crons
- `~/bin/cron-restore.sh` — restores crons from definitions (supports `--force`, `--dry-run`)
- `~/bin/cron-backup.sh` — snapshots store + runtime before destructive ops
- `~/bin/openclaw-doctor-safe.sh` — safe doctor wrapper (backup → doctor → restore)
- `~/.config/systemd/user/openclaw-gateway.service.d/cron-restore.conf` — systemd drop-in

**Files patched:**
- `
