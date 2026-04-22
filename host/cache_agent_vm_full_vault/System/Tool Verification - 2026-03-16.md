---
title: "Tool Verification - 2026-03-16"
created: 2026-03-16
updated: 2026-03-16
type: system
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: system
tags: [claude, github, knowledge, mcp, ops, skills]
summary: "All configured MCPs:"
---
# Tool Verification — 2026-03-16

## Summary

| Tool | Status | Notes |
|---|---|---|
| Lightpanda (binary) | ✅ | `/usr/local/bin/lightpanda` — supports `fetch`, `serve`, `mcp` modes |
| Lightpanda (service) | ✅ | Enabled + running on `127.0.0.1:9223`, CDP responding |
| Lightpanda MCP | ✅ | `lightpanda mcp` available, configured in `~/.claude/mcp.json` |
| GitNexus CLI | ✅ | Index up-to-date (commit `9af314d`, indexed 2026-03-16 19:48) |
| GitNexus MCP | ❌ | **Not configured** in `~/.claude/mcp.json` — `npx gitnexus mcp` works but no entry exists. Needs adding. |
| Perplexity MCP | ✅ | Configured via `npx -y perplexity-web-api-mcp` — `npx` available at `/usr/bin/npx` v10.9.4 |
| GitGuardian MCP | ✅ | Configured via `uvx` from git — `uvx` available at `~/.local/bin/uvx` v0.10.10 |

## Details

### Lightpanda
- **Binary:** `/usr/local/bin/lightpanda` — modes: `fetch`, `serve`, `mcp`, `help`, `version`
- **Service:** `/etc/systemd/system/lightpanda.service` — enabled on boot, runs as `trajan`
- **CDP:** `curl http://127.0.0.1:9223/json/version` → `{"webSocketDebuggerUrl": "ws://127.0.0.1:9223/"}`
- **MCP:** Also configured in `~/.claude/mcp.json` as `"lightpanda"` entry

### Claude Code MCP Servers (from `~/.claude/mcp.json`)
All configured MCPs:
1. **CodeGraphContext** — `/home/trajan/.local/bin/cgc mcp start` (FalkorDB backend)
2. **qmd** — vault search MCP
3. **taskmaster-ai** — `npx -y task-master-ai@latest`
4. **serena** — `uvx` from git (project-from-cwd)
5. **[[Engram]]** — `engram mcp` (v1.10.0, update to 1.10.1 available)
6. **lightpanda** — `lightpanda mcp`
7. **chrome-devtools** — `npx chrome-devtools-mcp@latest --headless`
8. **[[MarkItDown]]** — `markitdown-mcp`
9. **GitGuardianDeveloper** — `uvx` from git (`ENABLE_LOCAL_OAUTH=false`)
10. **perplexity** — `npx -y perplexity-web-api-mcp`
11. **nmap-mcp** — `node /usr/lib/node_modules/@ebowwa/mcp-nmap/dist/index.js`

### GitNexus Index
- **Repo:** `/home/trajan/skills`
- **Status:** ✅ up-to-date (indexed commit matches current)
- **Query test:** `npx gitnexus query "dispatch"` → returned results from `agent-team-orchestration/`
- **Context test:** `npx gitnexus context "agent spawn"` → symbol not found (expected — `context` needs exact symbol names, not search phrases)

## Action Items
- [ ] Add GitNexus MCP to `~/.claude/mcp.json` — entry: `"gitnexus": { "command": "npx", "args": ["gitnexus", "mcp"] }`
- [ ] Update [[Engram]]: `go install github.com/Gentleman-Programming/engram/cmd/engram@latest` (1.10.0 → 1.10.1)
