---
type: knowledge
wiki_id: system/Intelligence_Notes/vault-ref-injection-with-per-ref-500-char-truncati
imported_from: >-
  vault/System/Intelligence
  Notes/vault-ref-injection-with-per-ref-500-char-truncati.md
imported_at: '2026-04-04T00:23:57.252Z'
tags: []
summary: ''
---
# Vault ref injection with per-ref 500-char truncation and 3KB total budget cap in prompt compiler — prevents runaway context consumption while still grounding prompts in vault content

- **Category:** technique
- **Source:** peer-pr-20260324-210438-556357.txt
- **Applied:** 2026-03-24T21:28:48Z
- **Impact:** 3/5
- **Project:** Auto Delegator Layer

## Details

Apply 500-char-per-ref and 3KB-total budget caps to any vault reference injection in SOUL.md prompt assembly or the proposal engine's context loader

## Source Context

Extracted from agent result: `peer-pr-20260324-210438-556357.txt`

---
Tags: #intelligence #technique #auto-applied
