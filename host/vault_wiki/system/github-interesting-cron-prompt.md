---
title: github-interesting cron prompt
updated: '2026-03-20'
type: config
wiki_id: system/github-interesting-cron-prompt
imported_from: vault/System/github-interesting-cron-prompt.md
imported_at: '2026-04-04T00:23:57.274Z'
tags: []
summary: ''
---
# github-interesting Cron Prompt

Cron ID: 45107626-7fdf-4092-9b31-ba2647f96e8b
Schedule: every 30m
Updated: 2026-03-20

## Prompt

See openclaw cron list for current value. Key changes vs original:
- Multi-source: GitHub + HN + Reddit + blogs + papers
- Hard quality bar: >200 stars OR >100 upvotes OR expert blog
- Dedup against github-interesting-state.json posted array
- Explicit "post HEARTBEAT_OK if nothing good" escape hatch
- Structured post format with source type label
