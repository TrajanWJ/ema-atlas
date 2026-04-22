# Active large-proposal cap (max 3 concurrent) prevents queue overload by blocking new large proposals when cap is reached, regardless of source engine

- **Category:** best-practice
- **Source:** task-11b91882.txt
- **Applied:** 2026-03-20T18:38:11Z
- **Impact:** 3/5
- **Project:** Auto Delegator Layer

## Details

In proposal-engine-v2.sh gate logic: count active large proposals in proposal-state.json where status=dispatched and size=large; skip generation if count >= 3

## Source Context

Extracted from agent result: `task-11b91882.txt`

---
Tags: #intelligence #best-practice #auto-applied
