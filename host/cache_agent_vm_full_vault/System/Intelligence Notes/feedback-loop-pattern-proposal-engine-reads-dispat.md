# Feedback loop pattern: proposal engine reads dispatch/done/ on each run to update proposal-state.json outcomes, enabling self-improvement engine to track which proposal types succeed or fail

- **Category:** technique
- **Source:** task-11b91882.txt
- **Applied:** 2026-03-20T18:38:11Z
- **Impact:** 4/5
- **Project:** Auto Delegator Layer

## Details

Add check_completed_outcomes() function to proposal-engine-v2.sh that scans dispatch/done/*.json, matches task IDs to proposal-state entries, and updates status+outcome fields; run as first step of each engine invocation

## Source Context

Extracted from agent result: `task-11b91882.txt`

---
Tags: #intelligence #technique #auto-applied
