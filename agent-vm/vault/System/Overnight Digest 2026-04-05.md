---
title: "Overnight Digest 2026-04-05"
type: reference
created: 2026-04-05
confidence: 0.90
tags: [digest, system, vault-activity, ops, dispatch]
summary: "Overnight vault digest for 2026-04-05: 9 auto-commits, dispatch failure cascade from API key invalidation, Babysitter docs added."
---

# Overnight Digest — 2026-04-05

*Generated: 2026-04-04 14:00:09 UTC by morning-briefing-v2.sh*

---

## Vault Activity (last 18h)

Nine auto-commits landed between ~18:00 on 2026-04-04 and ~10:00 on 2026-04-05, representing substantial vault growth:

| Commit | Files | Insertions | Deletions | Notable |
|--------|-------|------------|-----------|---------|
| `44c7b1a` | 10 | 2,854 | 8 | Agent Roster, System Overview, ontology graph, Dispatch Failure Analysis |
| `3af2480` | 3 | 2,694 | — | ontology/graph.jsonl bulk update |
| `72cfeb8` | 2 | 24 | — | EMA surfaces architecture note |
| `ba44a61` | 3 | 2,695 | — | ontology/graph.jsonl |
| `90965f7` | 2 | 2,628 | — | ontology/graph.jsonl |
| `87b1556` | 1 | 0 | 0 | No-op / metadata |
| `2c0e60a` | 2 | 2,628 | — | ontology/graph.jsonl |
| `ab52d8e` | 5 | 2,735 | 32 | GitHub Interesting, Projects backlog, Trajan Preferences |
| `3673462` | 7 | 1,072 | — | Babysitter Operator docs (3 files, 1,030 lines), GitHub Interesting |

**Total: ~21,330 insertions across 9 commits.** The bulk of insertions are `ontology/graph.jsonl` updates (multiple large commits), reflecting automated knowledge graph maintenance rather than manual content.

---

## Key Additions This Period

### Babysitter Operations Docs (3673462)
Three substantial files were added to the Babysitter agent documentation:
- **Babysitter Operator Cheat Sheet** (52 lines) — quick-reference commands
- **Babysitter Stream Master Guide** (455 lines) — comprehensive streaming operations
- **Babysitter Surface Governor Execution Plan** (523 lines) — surface governance architecture

These represent a significant documentation push for the [[Babysitter]] system, likely preceding or following an ops review.

### Dispatch Failure Analysis (44c7b1a)
A new file `System/Dispatch-Failure-Analysis-20260405.md` was added analyzing **42 failed dispatch tasks**. Root cause: **Invalid API key** affecting 35 of 42 tasks (83%). The failures hit researcher (29) and coder (7) agents primarily. Cross-referenced with `cross-poll-auth-migration-b345273e` suggesting Anthropic's ban of OAuth-based Claude subscriptions on 2026-04-04 as the likely trigger.

See [[Dispatch-Failure-Analysis-20260405]] for full breakdown.

### EMA Surfaces Architecture (72cfeb8)
A note on `project_ema_surfaces_architecture.md` was committed — 24 lines covering EMA (Execution Management Agent) surface architecture planning. Part of the ongoing [[EMA]] buildout.

### Agent Roster & System Overview Updates (44c7b1a)
Both `Agents/Agent Roster.md` and `Architecture/System Overview.md` received minor updates (+4 and +10 lines respectively), keeping the meta-documentation current with recent agent additions.

### Research Feed Registry (44c7b1a)
`System/research-feed-registry.json` grew by 60 lines — new entries tracking which URLs have been posted to #research-feed, supporting dedup logic.

---

## System Health

| Metric | Value | Status |
|--------|-------|--------|
| Disk usage | 85% | ⚠️ Elevated |
| Load average | 0.05 / 0.32 / 0.33 | ✅ Normal |
| Gateway | active | ✅ |
| Auth | inactive | ⚠️ |

**Disk at 85%** is worth monitoring — ontology graph growth is the primary driver given the insertion volume this period. Auth service inactive may be related to the API key failure cascade documented in the dispatch analysis.

---

## Cron Results

**morning-briefing** ran successfully (112 lines output).

Weather for next day: ↑67°F ↓42°F — Cloudy.

---

## Skills

Total skills installed: **63**

---

## Overnight Incidents

### API Key Failure Cascade
The dominant overnight event was a dispatch authentication failure affecting 42 queued tasks. The failure appears systemic — Anthropic API key invalidation following OAuth subscription changes on 2026-04-04. This is the likely cause of the `Auth: inactive` health signal above and explains the cluster of `❌ FAILED` entries in task logs for this date.

**Impact:** Research and coding tasks queued overnight did not execute. Vault improvement backlog tasks were not completed. Recovery requires API key rotation/update.

---

## Open Questions

- Is the Auth service inactive because of the API key cascade, or a separate issue?
- Disk at 85%: is ontology/graph.jsonl growth the primary driver? Would compaction reduce it?
- Were the 42 failed dispatch tasks re-queued, or dropped?

---

## Related Notes

- [[Dispatch-Failure-Analysis-20260405]]
- [[System Overview]]
- [[Agent Roster]]
