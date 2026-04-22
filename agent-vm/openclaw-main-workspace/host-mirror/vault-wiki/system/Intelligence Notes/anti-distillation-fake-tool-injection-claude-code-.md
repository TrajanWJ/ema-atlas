---
type: knowledge
wiki_id: system/Intelligence_Notes/anti-distillation-fake-tool-injection-claude-code-
imported_from: >-
  vault/System/Intelligence
  Notes/anti-distillation-fake-tool-injection-claude-code-.md
imported_at: '2026-04-04T00:23:57.240Z'
tags: []
summary: ''
---
# Anti-distillation fake tool injection: Claude Code source injects synthetic tool call/response pairs into context to poison any training pipeline attempting to distill the model's behavior — security-relevant awareness for any pipeline that ingests raw agent session transcripts

- **Category:** best-practice
- **Source:** 1c922b73.txt
- **Applied:** 2026-04-02T00:40:31Z
- **Impact:** 2/5
- **Project:** OpenClaw Agent Setup

## Details

Add a sanity filter when ingesting agent session transcripts into vault or engram: strip or flag tool call blocks that have no corresponding real-world side-effect (no file changed, no process spawned, no API hit) — these are likely synthetic noise injections, not real actions to learn from.

## Source Context

Extracted from agent result: `1c922b73.txt`

---
Tags: #intelligence #best-practice #auto-applied
