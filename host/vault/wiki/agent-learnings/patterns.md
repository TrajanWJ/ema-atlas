---
type: agent-learning
wiki_id: agent-learnings/patterns
imported_from: vault/Agent-Learnings/patterns.md
imported_at: '2026-04-04T00:23:56.594Z'
tags: []
summary: ''
---

## Auto-retry failed dispatch tasks (Ops)
When analyzing failed tasks, don't just report — act:
- Stale/resolved tasks (e.g. disk cleanup after disk is clear): archive them
- Tasks with valid data that failed on execution (exit 1, short runtime): auto-retry via dispatch.sh run <id>
- Only ask Trajan if the failure reason is ambiguous and retry could cause side effects
- Pattern: analyze → archive resolved → retry viable → report what was done
Added: 2026-03-26

## research-prompt-rotator.sh (Ops, 2026-03-26)
Installed at ~/bin/research-prompt-rotator.sh — generates varied research dispatch tasks.
- 13 focus areas covering Trajan's full interest range
- 10 source types (arXiv, HN essays, blogs, Lobste.rs, GitHub, Reddit deep, news, contrarian)
- Source-focus affinity system prevents mismatched combos
- Rotation state in ~/dispatch/research-prompt-rotator-state.json (avoids repeating last 4 focuses/sources)
- Cron: 3x daily at 08:00, 14:00, 20:00 UTC
- Manual: research-prompt-rotator.sh [--focus <key>] [--source <key>] [--dry-run] [--list]
