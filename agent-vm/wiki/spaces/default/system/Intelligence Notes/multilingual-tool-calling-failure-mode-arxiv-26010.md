---
type: knowledge
wiki_id: system/Intelligence_Notes/multilingual-tool-calling-failure-mode-arxiv-26010
imported_from: >-
  vault/System/Intelligence
  Notes/multilingual-tool-calling-failure-mode-arxiv-26010.md
imported_at: '2026-04-04T00:23:57.248Z'
tags: []
summary: ''
---
# Multilingual tool calling failure mode (arXiv 2601.05366): parameter value language mismatch is the dominant failure cause — agent receives prompt in language X but outputs tool parameter values in language Y, causing silent downstream errors

- **Category:** best-practice
- **Source:** arxiv-second-pass-001.txt
- **Applied:** 2026-03-27T06:39:17Z
- **Impact:** 2/5
- **Project:** Auto Delegator Layer

## Details

Add explicit instruction to agent SOUL.md / prompt templates: 'All tool parameter values must be in English regardless of input language.' Low-effort guard against a documented failure mode.

## Source Context

Extracted from agent result: `arxiv-second-pass-001.txt`

---
Tags: #intelligence #best-practice #auto-applied
