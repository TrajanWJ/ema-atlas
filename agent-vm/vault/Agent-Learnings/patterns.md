
## Codex MCP Stack Patterns (Coding Agents, 2026-04-04)

**Verified via official OpenAI Codex docs + MCP catalog scrape:**

- Codex config lives in `~/.codex/config.toml` (STDIO and HTTP transports supported)
- `codex mcp add <name> -- <command>` is the CLI add pattern; `/mcp` in TUI shows active servers
- **Highest-impact MCPs for coding agents (ranked):**
  1. Context7 (`npx -y @upstash/context7-mcp`) — live library docs, eliminates API hallucinations
  2. Git MCP (`uvx mcp-server-git`) — repo operations beyond filesystem
  3. Sequential Thinking (`npx -y @modelcontextprotocol/server-sequentialthinking`) — structured problem decomposition, zero cost
  4. Fetch MCP (`uvx mcp-server-fetch`) — clean doc fetching
  5. Exa MCP — semantic web search optimized for coding context (needs API key)
  6. Playwright MCP (`npx -y @playwright/mcp`) — browser + test automation
- **Academic backing:** SWE-agent paper (arXiv:2405.15793) proves ACI design drives coding agent perf more than model size
- **ClawHub is empty** (as of 2026-04-04) — no published community skills yet
- **Tool bloat risk:** If adding many MCPs, monitor context window usage; gateway tools (ViperJuice/mcp-gateway) can reduce overhead
- **Pattern:** Context7 works best as both a skill AND an MCP server configured together

Added: 2026-04-04

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
