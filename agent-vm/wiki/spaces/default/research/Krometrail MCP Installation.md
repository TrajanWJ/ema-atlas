---
title: Krometrail MCP Installation
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - claude
  - code
  - evolution
  - github
  - mcp
  - research
summary: >-
  Browser observation and runtime debugging MCP for AI coding agents. Records
  browser activity (network, console, DOM mutations, framework state, screen
wiki_id: research/Krometrail_MCP_Installation
imported_from: vault/Research/Krometrail MCP Installation.md
imported_at: '2026-04-04T00:23:57.091Z'
---
# Krometrail MCP Installation

**Date:** 2026-03-16
**Version:** 0.2.8
**Repo:** https://github.com/nklisch/krometrail
**Binary:** `/home/trajan/.local/bin/krometrail`

## What It Does

Browser observation and runtime debugging MCP for AI coding agents. Records browser activity (network, console, DOM mutations, framework state, screenshots) via CDP, then lets agents search/inspect/diff recorded sessions. Also bridges DAP for breakpoint-level debugging across 9 languages.

## Installation

```bash
curl -fsSL https://krometrail.dev/install.sh | sh
```

Installed v0.2.8 to `~/.local/bin/krometrail`.

## MCP Configuration

Added to `~/.claude/mcp.json`:

```json
"krometrail": {
  "command": "/home/trajan/.local/bin/krometrail",
  "args": ["--mcp"],
  "disabled": false
}
```

## MCP Tools Provided

### Browser Tools
| Tool | Description |
|------|-------------|
| `chrome_start` | Launch Chrome and start recording |
| `chrome_status` | Current recording status |
| `chrome_mark` | Place a named marker in timeline |
| `chrome_stop` | Stop recording and persist to DB |
| `session_list` | List recorded sessions |
| `session_overview` | Structured overview of a session |
| `session_search` | Search across recorded events |
| `session_inspect` | Deep-dive into specific event |
| `session_diff` | Compare two moments |
| `session_replay_context` | Generate Playwright/Cypress test scaffolds |

### Debug Tools (DAP)
`debug_launch`, `debug_attach`, `debug_stop`, `debug_step`, `debug_evaluate`, `debug_variables`, `debug_set_breakpoints`, etc.

### Supported Debug Adapters
- **Node.js** — ✅ ready (v22.22.1 detected)
- Python, Go, Rust, Java, C/C++, Ruby, C#, Swift, Kotlin — not installed (optional)

## Lightpanda Compatibility

⚠️ **Krometrail does NOT work with Lightpanda (port 9223).** Lightpanda's CDP implementation is too minimal — it doesn't expose `/json/list` endpoint that Krometrail needs for tab discovery.

**Krometrail requires real Chrome/Chromium with full CDP support.**

## Verified Working Setup

Tested successfully with headless Chromium:

```bash
# Launch headless Chromium with CDP
nohup chromium-browser --headless=new --no-sandbox --disable-gpu \
  --remote-debugging-address=0.0.0.0 --remote-debugging-port=9224 \
  --disable-dev-shm-usage about:blank > /tmp/chrome-debug.log 2>&1 &

# Attach Krometrail
krometrail chrome start --attach --port 9224

# Navigate and record
krometrail chrome run-steps --steps '[{"action":"navigate","url":"https://example.com"}]'

# View session
krometrail chrome stop
krometrail chrome sessions
krometrail chrome overview <session-id>
```

### Test Results
- ✅ Attached to Chromium on port 9224
- ✅ Navigated to example.com, captured 6 events + 2 markers
- ✅ Session overview shows navigation timeline, network requests, errors
- ✅ Screenshot captured during navigation

## Notes

- `krometrail doctor` checks adapter availability
- Sessions stored in SQLite under `~/.krometrail/`
- Framework state observation available for React and Vue (`--framework-state`)
- `--tools browser` or `--tools debug` flags limit which MCP tool groups are exposed
- Can also expose as project-level `.mcp.json` for per-project use

## Related

- [[mcp-tool-search-installation]]
- [[briefing-2026-03-16]]
- [[github-intel-favorites]]
