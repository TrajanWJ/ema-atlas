# QMD concurrency kills the system: flock lockfile is mandatory for any CPU-heavy cron job to prevent parallel execution

- **Category:** best-practice
- **Source:** proposal-prop-1774031326-1698a6fd.txt
- **Applied:** 2026-03-20T18:43:47Z
- **Impact:** 4/5
- **Project:** Auto Delegator Layer

## Details

Audit all cron scripts in ~/.openclaw/crons/ for QMD calls; wrap with flock /tmp/<script-name>.lock to prevent concurrent execution

## Source Context

Extracted from agent result: `proposal-prop-1774031326-1698a6fd.txt`

---
Tags: #intelligence #best-practice #auto-applied
