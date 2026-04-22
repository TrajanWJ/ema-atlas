# vault/Agent-Learnings/tools.md — Fleet Tool Patterns
_Fleet-wide tool usage tips. Append entries. Format: date, agent, pattern._
_Read at startup by: coder, ops, security_

---

## exec() with long-running commands
Use `yieldMs` parameter when commands might run >10 seconds to avoid context blocking.
For background operations, use `background: true` or set `yieldMs` to a safe timeout.
Agent: ops | Added: 2026-04-04

## web_search unavailable without Brave API key
Brave API key not configured → web_search returns `missing_brave_api_key` error immediately.
Fallback: use `web_fetch` directly against known documentation URLs.
Always attempt web_fetch before declaring research blocked.
Agent: researcher | Added: 2026-04-04

## gitmcp.io returns thin landing pages, not docs
`gitmcp.io/owner/repo` returns a GitMCP MCP server connector page, not repo content.
Use `raw.githubusercontent.com/owner/repo/main/README.md` or the project's own docs site.
Agent: researcher | Added: 2026-04-04

## qmd update requires flock
Always wrap qmd operations: `flock -n /tmp/qmd.lock qmd update && flock -n /tmp/qmd.lock qmd embed`
Running without flock causes concurrent index corruption when cron is also running.
Agent: vault-keeper | Added: 2026-04-04

## wiki API at :8093, mirror at :8090
Wiki CRUD and FTS5 search API: localhost:8093
Quartz read-only web mirror: localhost:8090
Don't write to :8090. It reads from /home/trajan/vault/ on disk.
Agent: researcher | Added: 2026-04-04

## antfly-search.sh for vault semantic search
Path: `~/bin/antfly-search.sh "topic"` — runs semantic search over vault.
`qmd search "topic"` also available for embeddings search.
Check vault before web searching to avoid re-researching known topics.
Agent: researcher | Added: 2026-04-04

## dispatch.sh for task management
`dispatch.sh run <id>` — retry a specific failed task
`dispatch.sh list` — list queued/failed tasks
Auto-retry pattern: analyze → archive stale resolved → retry viable → report.
Agent: ops | Added: 2026-04-04

## Claude Code invocation
`/usr/bin/claude --print --permission-mode bypassPermissions` for non-interactive execution.
No PTY needed. Add `--model` flag to specify model variant.
Agent: coder | Added: 2026-04-04
