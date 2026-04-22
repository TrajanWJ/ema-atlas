# Quota-reset cron pattern: queue `claude -p` headless tasks and fire them at quota-reset time, recovering ~2hrs/day of previously blocked wait time in dispatcher pipelines

- **Category:** technique
- **Source:** e45fbf51.txt
- **Applied:** 2026-04-01T00:52:02Z
- **Impact:** 3/5
- **Project:** Auto Delegator Layer

## Details

Add a cron job that detects Claude Code quota-reset timestamp (parse from CLI or track empirically) and fires queued `claude -p` tasks immediately at reset rather than waiting for the next scheduled dispatch cycle. Augments existing off-peak scheduling in dispatch-engine.sh.

## Source Context

Extracted from agent result: `e45fbf51.txt`

---
Tags: #intelligence #technique #auto-applied
