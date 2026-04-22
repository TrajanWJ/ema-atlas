# Failed task cleanup protocol established: archive to failed/archive/cleared-YYYYMMDD/, update DB rows from 'failed' to 'cancelled', generate analysis report — reusable maintenance pattern for dispatch hygiene

- **Category:** technique
- **Source:** task-eedb596f.txt
- **Applied:** 2026-04-17T00:04:41Z
- **Impact:** 2/5
- **Project:** EMA Phase 2 Implementation Guide

## Details

Document this cleanup protocol in dispatch SOUL.md or ops runbook: (1) analyze failed/ directory patterns, (2) archive cleared files to failed/archive/cleared-YYYYMMDD/, (3) update dispatch.db rows to 'cancelled', (4) write analysis report to utility/workspace/. Could be automated as a weekly cron.

## Source Context

Extracted from agent result: `task-eedb596f.txt`

---
Tags: #intelligence #technique #auto-applied
