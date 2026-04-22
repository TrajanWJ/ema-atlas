---
title: "Agent Automation Workflows"
created: 2026-03-14
updated: 2026-04-14
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: reference
tags: [automation, daily-digest, patterns, workflows]
summary: "1. [[ai-daily-digest]] skill fetches RSS from 90+ tech sources"
---
# Agent Automation Workflows

> Reusable workflow patterns for [[OpenClaw]] agent automation.

## Daily Intelligence Digest
**Trigger:** Cron at 8:00 AM daily
**Flow:**
1. [[ai-daily-digest]] skill fetches RSS from 90+ tech sources
2. AI scores and filters articles by relevance
3. Generate Markdown digest
4. Save to `vault/Logs/daily-digest-YYYY-MM-DD.md`
5. Post summary to Discord #daily-digest channel
6. Post to Telegram

**Setup:**
```
cron add --schedule "0 8 * * *" --task "Run ai-daily-digest, save output to vault, post summary to Discord"
```

## Vault Health Check
**Trigger:** Heartbeat (every 30m, batched)
**Flow:**
1. Check for broken wikilinks
2. Verify ontology-sync graph freshness
3. Check for orphaned notes (no inbound links)
4. Alert if issues found

## Research Pipeline
**Trigger:** On-demand or cron
**Flow:**
1. [[deep-research-pro]] skill runs multi-source web research
2. Results formatted as Markdown
3. Saved to `vault/Research/` with proper frontmatter
4. [[Knowledge-graph]] updated with key facts
5. Ontology-sync extracts entities

## Content Monitoring
**Trigger:** Cron every 4 hours
**Flow:**
1. web-monitor-pro checks tracked pages for changes
2. On change: capture diff, summarize change
3. Save to `vault/Logs/web-changes/`
4. Alert via Discord if significant

## System Health Automation
**Trigger:** Heartbeat
**Flow:**
1. [[system-resource-monitor]] checks CPU/RAM/disk/swap
2. [[openclaw-guardian-ultra]] verifies gateway health
3. Auth token validity check
4. If issues: auto-repair or alert Trajan

## YouTube Knowledge Extraction
**Trigger:** On-demand
**Flow:**
1. [[video-transcript-downloader]] gets transcript
2. AI summarizes key points
3. Save to `vault/Research/` as structured note
4. Update [[knowledge-graph]] with facts

## Social Media Monitoring
**Trigger:** Cron every 6 hours
**Flow:**
1. x-twitter-scraper checks target profiles
2. Extract key posts/engagement metrics
3. Summarize trends
4. Save to vault or post to Discord

## Session Backup
**Trigger:** Cron daily at midnight
**Flow:**
1. obsidian-conversation-backup captures day's conversations
2. Format as Markdown with timestamps
3. Save to `vault/Logs/conversations/YYYY-MM-DD.md`

## Staleness Review (2026-04-14)

Verified during vault audit. These workflow patterns reference [[OpenClaw]] which remains in the vault ecosystem. The dispatch-utility workspace now handles task orchestration, which may supplement or replace some of these patterns (e.g., the cron-based triggers are now partially handled by dispatch-engine). Daily digest, vault health, and research pipelines are still valid patterns. Recommend verifying which cron jobs are currently active via `crontab -l`.

#workflows #automation #patterns

## Related

- [[Metaprompting Patterns]]
