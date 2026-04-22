---
type: knowledge
date: 2026-03-20T00:00:00.000Z
tags:
  - MCP
  - browser-automation
  - UI
  - annotations
  - debugging
domain: browser-tools
status: installed
version: 0.1.1
aliases:
  - ui-annotator
  - mcpware-ui-annotator
wiki_id: reference/tools/ui-annotator-mcp
imported_from: vault/Tools/ui-annotator-mcp.md
imported_at: '2026-04-04T00:23:57.281Z'
summary: ''
---

# @mcpware/ui-annotator v0.1.1 — MCP UI Element Annotation

## Core Concept

A reverse-proxy that annotates any web page with element metadata. Point it at any localhost port and it serves an annotated version at `localhost:7077`. Hover over any element to see its name, CSS selector, and dimensions — no browser extension required.

## How It Works

```
Your app (localhost:3000) -> ui-annotator proxy (localhost:7077/localhost:3000) -> Annotated view
```

- Reverse-proxies the target page
- Injects hover annotations showing:
  - Element name (tag, class, id)
  - CSS selector (copy-pasteable)
  - Dimensions (width x height)
- **Inspect mode:** Click any element to copy its name/selector

## MCP Configuration

```json
{
  "mcpServers": {
    "ui-annotator": {
      "command": "npx",
      "args": ["@mcpware/ui-annotator"]
    }
  }
}
```

## Integration with Our Browser Automation

Pairs with our chrome-devtools MCP and krometrail for element naming:

1. Start ui-annotator pointing at the app under test
2. Use annotated view to identify element selectors
3. Feed selectors into chrome-devtools MCP `click`/`fill` commands
4. No more guessing at CSS selectors during automation

**Workflow:**
```bash
# Terminal 1: app
npm run dev  # localhost:3000

# Terminal 2: annotator
npx @mcpware/ui-annotator
# Browse localhost:7077/localhost:3000 for annotated view
```

## Install Status

Installed v0.1.1 on 2026-03-20.

## Related Notes

- [[MCP Ecosystem]]
