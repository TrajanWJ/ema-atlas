# Disk cleanup recovered 4GB (89%→85%) but 14GB free remains critically low — trash alone was 2.4GB indicating no regular emptying schedule, and growth trajectory from prior extractions (124GB in 3 weeks) means this buys only days

- **Category:** best-practice
- **Source:** task-92bc2f74.txt
- **Applied:** 2026-04-16T21:05:13Z
- **Impact:** 3/5
- **Project:** general

## Details

Add weekly cron job to empty trash and prune docker: `trash-empty 7 && docker system prune -f && journalctl --vacuum-size=50M` — prevents 2.4GB trash accumulation recurring

## Source Context

Extracted from agent result: `task-92bc2f74.txt`

---
Tags: #intelligence #best-practice #auto-applied
