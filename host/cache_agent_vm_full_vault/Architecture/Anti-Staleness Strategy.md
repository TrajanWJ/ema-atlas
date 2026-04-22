---
title: "Anti-Staleness Strategy"
created: 2026-03-16
updated: 2026-03-19
type: architecture
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: system-generated
tags: [architecture, knowledge, openclaw, ops, research, skills]
summary: "Vault files go stale because:"
---
# Anti-Staleness Strategy

**Created:** 2026-03-16
**Status:** Active
**Owner:** Right Hand + Vault Keeper

## The Problem

Vault files go stale because:
1. Docs describe aspirational state, not reality
2. No mechanism detects when system state drifts from documentation
3. Agents create files but never revisit them
4. Manual updates don't scale with 559 files (as of 2026-03-19)

## Strategy: Three Layers

### Layer 1: Truth-From-Source (Automated Generation)

**Core idea:** Don't write docs manually — generate them from system state.

Files that should be **auto-generated** on every run:
| File | Source Command | Frequency |
|---|---|---|
| `Skills/README.md` | `ls ~/skills/`, parse SKILL.md files | Every heartbeat |
| `Agents/Agent Roster.md` | `cat ~/.openclaw/openclaw.json \| jq '.agents'` | Every heartbeat |
| `Architecture/System Overview.md` | System state queries (agents, services, crons) | Daily |

**Script:** `~/bin/vault-refresh.sh` — runs these generators, updates files only if content changed.

### Layer 2: Freshness Scoring (Cron-Driven Audit)

**Core idea:** Score every vault file by staleness risk. Surface worst offenders in heartbeats.

Staleness score formula:
- `days_since_modified` × `importance_weight`
- Importance weights: Architecture (3x), Trajan/ (2x), Research (1x), Skills (auto-managed, 0.5x)

**Script:** `~/bin/vault-freshness.sh` — outputs top 10 stalest high-importance files.

**Integration:** Right Hand checks this during heartbeats, picks ONE file to verify/update.

### Layer 3: Verify-On-Read (Agent Discipline)

**Core idea:** When any agent reads a vault file for reference, it spot-checks one claim against reality.

Rules:
- If a file says "8 agents configured" — check `openclaw.json`, fix if wrong
- If a file says "35 skills installed" — count `~/skills/`, fix if wrong
- If a file references a deleted channel/file — fix the reference
- Small fixes: edit in place. Big drift: flag in `loose-ends.md`

This is a habit, not a script. Bake into agent CLAUDE.md files.

## What Gets Auto-Managed vs Manual

| Category | Management | Why |
|---|---|---|
| Skills/ | Auto (skill-vault-sync.sh) | Already scripted |
| [[Agent Roster]] | Auto (vault-refresh.sh) | Derived from config |
| [[System Overview]] | Auto (vault-refresh.sh) | Derived from system state |
| Research/ | Manual | Human-driven analysis |
| Trajan/ | Manual + auto-harvest | Preferences auto-captured, rest manual |
| Projects/ | Manual | Project-specific |
| Architecture/ | Semi-auto | Strategy docs manual, state docs auto |

## Implementation

1. ✅ Write `~/bin/vault-refresh.sh` — generates truth-from-source files
2. ✅ Write `~/bin/vault-freshness.sh` — staleness scoring
3. ✅ Add vault-refresh to heartbeat rotation
4. ✅ Add freshness check to heartbeat rotation
5. ✅ Update HEARTBEAT.md with new checks
6. ✅ Document verify-on-read discipline in agent templates
