---
title: Target Product Spec — Agent OS
type: knowledge
status: active
created: '2026-03-27'
updated: '2026-03-27'
tags:
  - agent-os
  - spec
  - gap-analysis
  - self-improvement
summary: >-
  Canonical intended state of the Agent OS. Diffed against reality by
  proposal-engine-v2.sh to generate gap proposals.
wiki_id: system/Target-Product-Spec
imported_from: vault/System/Target-Product-Spec.md
imported_at: '2026-04-04T00:23:57.268Z'
---

# Target Product Spec — Agent OS

This document describes the **intended state** of the Agent OS. It is the source of truth for what *should* exist. The proposal engine diffs this spec against actual system state and generates gap proposals for missing or broken components.

## Maintenance Protocol

- Update this file when a new capability is agreed upon (before or after implementation)
- Mark items as `[DONE]` once verified — the scanner uses `[FILE]`, `[CRON]`, `[SERVICE]`, `[ENDPOINT]` prefixes
- Items prefixed with `[TODO]` are aspirational and not yet expected to exist
- When you add a `[FILE]` or `[CRON]` entry, the scanner will alert if it's missing

---

## 1. Core Scripts (`~/bin/`)

Essential operational scripts. Each must exist and be executable.

- [FILE] ~/bin/dispatch.sh
- [FILE] ~/bin/dispatch-db.sh
- [FILE] ~/bin/dispatch-engine.sh
- [FILE] ~/bin/proposal-engine-v2.sh
- [FILE] ~/bin/proposal.sh
- [FILE] ~/bin/proposal-triage.sh
- [FILE] ~/bin/proposal-post.sh
- [FILE] ~/bin/evolution-loop.sh
- [FILE] ~/bin/evolution-cycle.sh
- [FILE] ~/bin/gateway-health-check.sh
- [FILE] ~/bin/overnight-digest.sh
- [FILE] ~/bin/vault-autocommit.sh
- [FILE] ~/bin/session-janitor.sh
- [FILE] ~/bin/vault-janitor.sh
- [FILE] ~/bin/morning-briefing.sh
- [FILE] ~/bin/auto-knowledge-gated.sh
- [FILE] ~/bin/message-harvester.sh
- [FILE] ~/bin/correction-tracker.sh
- [FILE] ~/bin/weekly-synthesis.sh
- [FILE] ~/bin/prompt-archaeologist.sh

---

## 2. Agent Definitions (`~/.openclaw/agents/`)

Each specialist agent must have a directory and IDENTITY.md.

- [FILE] ~/.openclaw/agents/main/workspace/IDENTITY.md
- [FILE] ~/.openclaw/agents/main/workspace/AGENTS.md
- [FILE] ~/.openclaw/agents/main/workspace/SOUL.md

---

## 3. Cron Jobs

Required recurring jobs. Scanner checks `crontab -l` for each script name.

- [CRON] gateway-watchdog.sh
- [CRON] system-watchdog.sh
- [CRON] session-health.sh
- [CRON] vault-autocommit.sh
- [CRON] message-harvester.sh
- [CRON] auto-knowledge-gated.sh
- [CRON] ontology-sync
- [CRON] evolution-loop
- [CRON] session-janitor.sh
- [CRON] vault-janitor.sh
- [CRON] overnight-digest.sh
- [CRON] morning-briefing.sh
- [CRON] weekly-synthesis.sh
- [CRON] proposal-engine-v2.sh

---

## 4. Dispatch Infrastructure

State files and directories required for the dispatch system to function.

- [FILE] ~/dispatch/dispatch.db
- [FILE] ~/dispatch/feed.jsonl
- [DIR] ~/dispatch/active
- [DIR] ~/dispatch/done
- [DIR] ~/dispatch/failed
- [DIR] ~/dispatch/approvals

---

## 5. Vault Structure

Required vault sections. Scanner checks for directory existence.

- [DIR] ~/vault/System
- [DIR] ~/vault/Research
- [DIR] ~/vault/Projects
- [DIR] ~/vault/Trajan
- [DIR] ~/vault/Architecture
- [DIR] ~/vault/Daily Notes

---

## 6. Services (systemd)

Required systemd services. Scanner checks `systemctl is-active`.

- [SERVICE] openclaw
- [SERVICE] oauth-guardian

---

## 7. Key Config Files

- [FILE] ~/.openclaw/config.json
- [FILE] ~/vault/System/System Overview.md
- [FILE] ~/vault/System/Target-Product-Spec.md

---

## 8. Aspirational / Planned

These are not yet required — the scanner ignores `[TODO]` prefixes.

- [TODO] ~/bin/proposal-engine-v3.sh — multi-task proposal engine per v2-spec
- [TODO] ~/dispatch/gap-registry.json — living gap registry
- [TODO] ~/dispatch/goal-progress.json — goal activity tracking
- [TODO] Bridge API /api/agents endpoint — live agent status
- [TODO] Bridge API /api/knowledge/query endpoint — vault query API

---

## Gap Tracking

When the proposal engine finds a gap between this spec and reality, it emits a proposal. Track remediated gaps here to prevent duplicate proposals.

| Item | Gap Found | Proposal ID | Remediated |
|------|-----------|-------------|------------|
| _(populated by scanner)_ | | | |
