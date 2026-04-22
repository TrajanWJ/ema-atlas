---
title: "patterns"
created: 2026-03-16
updated: 2026-03-16
type: agent
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: manual
tags: [agents, knowledge, ops, prompts, security, skills]
summary: "Reusable patterns discovered by any agent. Read on startup, append after tasks."
---
# Patterns — Cross-Agent Shared Memory

Reusable patterns discovered by any agent. Read on startup, append after tasks.

---

## 2026-03-16 | System | Initial Setup

Cross-agent memory system initialized. Agents should append patterns they discover during task execution — things that worked well and should be repeated.

## 2026-03-16 | Main | Consolidate Before Building More

When the system feels bloated (20 agents, 15 crons), stop adding and consolidate first. Tonight's 20→8 agent consolidation cut workspace from 67KB→18KB and made everything easier to reason about. Build less, maintain what exists.

## 2026-03-16 | Devils-Advocate | Review Gate Before Shipping

Running a Devil's Advocate review on the full system caught overlapping skills, redundant agents, and doc-reality drift that no individual agent noticed. Always run an adversarial review before declaring a buildout "done."

## 2026-03-16 | Community-Scout | Search Before You Build

Tonight we built custom skills before checking ClawHub — then found 4 existing skills ([[soulcraft]], [[self-improving-agent]], [[memory-hygiene]], [[elite-longterm-memory]]) that already solved the problem. Always search the ecosystem first.

## 2026-03-16 | Delegation-Test | Parallel Dispatch With Clear Scoping

When spawning multiple agents for a delegation test, give each a 3-5 word role name and a specific deliverable — not a vague domain. "Review Security SOUL.md and add severity framework" beats "do security stuff." Scoped tasks complete faster and merge cleaner.

## 2026-03-16 | Vault-Keeper | Seed Shared Memory Early

Empty shared memory files (patterns/mistakes/tools) get ignored by agents. Seed each file with 2-3 real entries from the first session so subsequent agents see value immediately and are more likely to contribute back.

## Related

- [[mistakes]]
