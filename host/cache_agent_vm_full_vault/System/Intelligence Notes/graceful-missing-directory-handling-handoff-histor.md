# Graceful missing-directory handling: handoff history skips silently if dispatch/handoff/ doesn't exist, preventing 500s during bootstrap

- **Category:** best-practice
- **Source:** task-a146cfa7.txt
- **Applied:** 2026-03-20T18:43:30Z
- **Impact:** 2/5
- **Project:** Auto Delegator Layer

## Details

Audit all dispatch/ directory reads in server.js and proposal-engine-v2.sh for missing try/catch on fs.readdirSync; add graceful skip pattern

## Source Context

Extracted from agent result: `task-a146cfa7.txt`

---
Tags: #intelligence #best-practice #auto-applied
