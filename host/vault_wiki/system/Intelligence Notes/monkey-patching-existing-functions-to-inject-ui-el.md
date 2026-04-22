---
type: knowledge
wiki_id: system/Intelligence_Notes/monkey-patching-existing-functions-to-inject-ui-el
imported_from: >-
  vault/System/Intelligence
  Notes/monkey-patching-existing-functions-to-inject-ui-el.md
imported_at: '2026-04-04T00:23:57.248Z'
tags: []
summary: ''
---
# Monkey-patching existing functions to inject UI elements without modifying original function signatures — used to add a detail button to stream items by wrapping `makeStreamItem`

- **Category:** technique
- **Source:** task-1467181f.txt
- **Applied:** 2026-03-20T18:30:51Z
- **Impact:** 3/5
- **Project:** Agent-OS-Frontend

## Details

In any frontend where you can't modify the original function, wrap it: `const orig = makeStreamItem; makeStreamItem = (...args) => { const el = orig(...args); el.querySelector('.actions').append(btn); return el; }`

## Source Context

Extracted from agent result: `task-1467181f.txt`

---
Tags: #intelligence #technique #auto-applied
