# Intelligence preprocess skip gate: skip expensive intent parsing if peer_review.status == 'approved' — idempotency guard preventing double-processing of already-reviewed tasks

- **Category:** best-practice
- **Source:** peer-pr-20260324-210438-556357.txt
- **Applied:** 2026-03-24T21:28:48Z
- **Impact:** 3/5
- **Project:** Auto Delegator Layer

## Details

Add status check guards at the top of any preprocessing blocks in dispatch-engine.sh to skip re-processing tasks that already have a terminal status (approved, completed, failed)

## Source Context

Extracted from agent result: `peer-pr-20260324-210438-556357.txt`

---
Tags: #intelligence #best-practice #auto-applied
