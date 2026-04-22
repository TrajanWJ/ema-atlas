---
id: "08f24e5f-5ebb-479d-aea9-2e18e87a2f29"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Agent Skills Ecosystem
tags: [research, skills, cross-pollination, critical]
source: session-2026-04-07
---

# Agent Skills Ecosystem — Convergent Pattern

All major projects (VoltAgent, muratcankoylan, NeoLabHQ, k-kolomeitsev, promethos, OpenHands microagents) converged on:
**Frontmatter-routed, directory-per-skill, zero-runtime markdown files Claude auto-loads.**

EMA's wiki/Intents/ system is 80% there. Remaining 20%:
1. Adopt SKILL.md frontmatter/headings contract
2. Add trigger-based conditional loading
3. Port existing public skill libraries wholesale

## Promethos SKILL.md Contract (steal verbatim)
- Frontmatter: name + description (combined ≤250 chars)
- Required headings: Goal, Inputs, Non-Goals, Workflow, Output Contract, Escalation, Common Failure Modes
- Validation script enforces structure

## Skills to Port to wiki/Skills/
### Context Engineering (muratcankoylan)
- context-fundamentals — anatomy of context
- context-degradation — lost-in-middle, poisoning, distraction, clash
- context-compression — long-session strategies
- context-optimization — compaction, masking, caching
- multi-agent-patterns — orchestrator, P2P, hierarchical
- memory-systems — short/long-term/graph
- tool-design — effective agent tools
- evaluation — frameworks for agent systems

### Other High-Value
- k-kolomeitsev/data-structure-protocol — graph long-term memory (matches EMA SecondBrain)
- NeoLabHQ/write-concisely — Strunk & White for proposal Refiner
- NeoLabHQ/prompt-engineering — Anthropic best practices
- promethos/16 meta-skills — design-agent-memory, design-agent-context, etc.

## OpenHands Microagent Loading Pattern
- Without frontmatter = always loaded
- With `triggers:` list = loaded only on keyword match
- EMA ContextManager should auto-load wiki/Skills/*.md by trigger

## Top 10 Steal Actions Ranked
1. Adopt promethos SKILL.md contract
2. Port muratcankoylan context-engineering skills
3. Port k-kolomeitsev graph memory pattern
4. Rewrite AgentMemory using OpenHands Memory Condenser (oldest-first chunk summarization between user msg boundaries)
5. Adopt microagent trigger-loading in ContextManager
6. Upgrade Journal to obra's typed-sections + dual-scope (feelings/project_notes/user_context/technical_insights/world_knowledge)
7. Action/Observation ADT in AgentWorker (OpenHands pattern, enables replay)
8. ContextProvider behaviour (continue.dev pattern, replaces ad-hoc context building)
9. Tmux wrap Claude Runner subprocess for survival across daemon restart
10. mix skill.validate task in precommit
