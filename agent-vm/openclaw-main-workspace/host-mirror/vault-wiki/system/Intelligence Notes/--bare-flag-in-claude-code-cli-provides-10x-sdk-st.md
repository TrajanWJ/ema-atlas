---
type: knowledge
wiki_id: system/Intelligence_Notes/--bare-flag-in-claude-code-cli-provides-10x-sdk-st
imported_from: >-
  vault/System/Intelligence
  Notes/--bare-flag-in-claude-code-cli-provides-10x-sdk-st.md
imported_at: '2026-04-04T00:23:57.239Z'
tags: []
summary: ''
---
# `--bare` flag in Claude Code CLI provides 10x SDK startup speedup — documented by Boris Cherny (CC creator) as a hidden feature alongside /loop, /batch, /branch, /btw, custom agents, git worktrees, teleport sessions, voice input

- **Category:** technique
- **Source:** 51f63b17.txt
- **Applied:** 2026-03-30T12:39:05Z
- **Impact:** 4/5
- **Project:** OpenClaw Agent Setup

## Details

Add `--bare` flag to claude CLI invocations in dispatch-engine.sh and OpenClaw agent launcher scripts where startup latency matters. Audit /loop and /batch slash commands for applicability to the dispatch loop pattern.

## Source Context

Extracted from agent result: `51f63b17.txt`

---
Tags: #intelligence #technique #auto-applied
