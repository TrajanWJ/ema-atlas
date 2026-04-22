---
title: AGENTS.md Audit — 2026-03-19
type: knowledge
domain: agent-architecture
tags:
  - audit
  - agents-md
  - cleanup
created: '2026-03-19'
confidence: 0.95
source: 'agent:coder'
summary: >-
  Audit of all agent AGENTS.md files — identifies boilerplate vs signal,
  recommends leaner versions.
wiki_id: system/architecture/agents-md-audit-2026-03-19
imported_from: vault/Architecture/agents-md-audit-2026-03-19.md
imported_at: '2026-04-04T00:23:56.782Z'
---

# AGENTS.md Audit — 2026-03-19

## Methodology

Read all `/home/trajan/.openclaw/agents/*/workspace/AGENTS.md` files.
Classified each section as:
- **BOILERPLATE** — identical or near-identical across agents, already in SOUL.md/TOOLS.md
- **SIGNAL** — tooling gotchas, non-obvious conventions, landmines, agent-specific routing

## Findings by Agent

### browser-automation (Scout)
- **Boilerplate:** Full roster table (12 lines), vault structure (8 lines), memory/red-lines sections, agent-to-agent identity bar instructions, self-evolution block
- **Signal:** `Antfly` tool note — non-obvious, needed
- **Verdict:** 85% boilerplate. Lean version below.

### coder
- **Boilerplate:** Startup sequence, roster table, vault structure, memory/red-lines, agent-to-agent format
- **Signal:** Tool list with specific paths (pr-review, commit-standards, visual-validation-loop, dispatch-guardrails.sh, eval-optimize-loop.sh) — these are non-obvious and needed
- **Verdict:** 70% boilerplate.

### concierge
- **Boilerplate:** Minimal — already lean
- **Signal:** All content is signal (channel routing, invisible delegation rule, vault startup read)
- **Verdict:** Already good. No change needed.

### devils-advocate
- **Boilerplate:** Minimal boilerplate
- **Signal:** Role description is signal; the epistemic checklist (obs/inf separation, premise-smuggling etc.) is in AGENTS.md for `main` — should be here
- **Verdict:** Too thin — missing the epistemic checklist that's only in main's AGENTS.md

### main (Right Hand)
- **Boilerplate:** Some roster table duplication, vault structure section
- **Signal:** EVERYTHING else — dispatch system, routing rules, feedback loop, concurrency limits, wave deliverables, vault write standards. This is the system's constitution.
- **Verdict:** Dense with signal. Keep as-is. The apparent verbosity is necessary.

### ops
- **Boilerplate:** Full roster table, vault structure block, memory/red-lines, agent-to-agent format, self-evolution block
- **Signal:** Tool list (dashboards, watchdogs, dispatch scripts, safe-gateway-restart.sh, context-budgeting)
- **Verdict:** 80% boilerplate. Tool list is the only signal.

### prompt-engineer
- **Boilerplate:** "spawned by Right Hand" framing is repeated boilerplate
- **Signal:** Vault path references (vault/Sourced-HQ-inspo, vault/Reference/Prompt Engineering), list of production systems to draw from
- **Verdict:** Lean enough. Could remove the 4-step "How You Work" generic block.

### researcher
- **Boilerplate:** Startup sequence (covered by SOUL.md), vault structure
- **Signal:** Tool table with the specific don't-use warnings ("don't use deep-research-pro DDG scripts — paths are wrong", "parallel-research CLI not installed"), fallback guidance
- **Verdict:** The don'ts are the most valuable content. Keep them. Remove generic vault structure.

### security
- **Boilerplate:** Full roster table, vault structure, memory/red-lines, agent-to-agent format, self-evolution block
- **Signal:** Tool mentions (dispatch-guardrails.sh with --profile code note)
- **Verdict:** 90% boilerplate. Worst offender.

### strategist
- **Boilerplate:** "spawned by Right Hand" framing
- **Signal:** Role description (Munger-style latticework, explicit tradeoff mapping, commit to recommendation)
- **Verdict:** Lean. Fine as-is.

### universal-orchestrator
- **Boilerplate:** Vault structure, memory
- **Signal:** Trigger conditions (3+ agents, heartbeat maintenance, system coordination), never-user-facing rule
- **Verdict:** Already lean.

### vault-keeper
- **Boilerplate:** Full roster table, vault structure, memory/red-lines, agent-to-agent format, self-evolution block
- **Signal:** Three specific scripts (antfly-ingest-vault.sh, vault-refresh.sh, vault-freshness.sh)
- **Verdict:** 85% boilerplate.

## Recommended Rewrites

### Pattern: Agents with boilerplate-heavy AGENTS.md
Agents: browser-automation, coder, ops, security, vault-keeper

All share the same 4 blocks that add nothing beyond SOUL.md:
1. Session Startup (just "read SOUL.md" — SOUL.md already says this)
2. Discord Output (covered by discord-output-format.md)
3. Agent Roster table (covered by main AGENTS.md)
4. Vault Structure (covered by SOUL.md)
5. Memory/Red Lines (covered by SOUL.md)
6. Self-Evolution (covered by protocols/self-evolution.md)
7. Agent-to-Agent (covered by discord-output-format.md)

**Recommendation:** Strip all 7 blocks from specialist agents. Keep only:
- Agent-specific tool landmines
- Non-obvious path gotchas
- Routing rules specific to that agent
- Any "don't do X" warnings that aren't obvious

### Lean Templates Written

See rewrites section below — these are the recommended replacement contents.

## Lean Rewrite: browser-automation (Scout)
```markdown
# AGENTS.md — Scout

## Available Tools
- **Antfly** — semantic + BM25 search via MCP at localhost:8080. CLI: `~/bin/antfly-search.sh "query"`
- **ApiTap** — website API capture, 74% token savings. `~/.bun/bin/apitap`
- **skillscan** — `~/.local/bin/skillscan` + gate: `~/bin/skillscan-gate.sh`
- **touchpoint-mcp** — `~/.local/bin/touchpoint-mcp` for native desktop app automation
```

## Lean Rewrite: coder
```markdown
# AGENTS.md — Coder

## Available Tools
- **pr-review** — `~/skills/pr-review/`
- **commit-standards** — `~/skills/commit-standards/`
- **visual-validation-loop** — `~/skills/visual-validation-loop/`
- **dispatch-guardrails.sh** — `--profile code` for syntax/linter checks
- **eval-optimize-loop.sh** — iterative refinement (`~/bin/eval-criteria/code-quality.md`)
```

## Lean Rewrite: ops
```markdown
# AGENTS.md — Ops

## Available Tools
- **system-dashboard.sh** / **agent-dashboard.sh** / **executive-dashboard-v2.sh**
- **dispatch.sh** — `~/bin/dispatch.sh`
- **task-watchdog.sh** / **gateway-watchdog.sh** / **system-watchdog.sh**
- **session-guardian.sh**, **safe-gateway-restart.sh**
- **context-budgeting** — `~/skills/context-budgeting/`
- **dispatch-failure-analyzer.sh**, **dispatch-optimizer.sh**
```

## Lean Rewrite: security
```markdown
# AGENTS.md — Security

## Available Tools
- **Antfly** — `~/bin/antfly-search.sh "query"` (semantic + BM25)
- **dispatch-guardrails.sh** — `--profile code` runs security checks on output
- **security-audit-toolkit** skill — `~/skills/security-audit-toolkit/`
- **clawdefender** skill — active monitoring
```

## Lean Rewrite: vault-keeper
```markdown
# AGENTS.md — Vault Keeper

## Available Tools
- **Antfly** — `~/bin/antfly-search.sh "query"`
- **antfly-ingest-vault.sh** — re-index vault after major changes
- **vault-refresh.sh** — regenerate truth-from-source files
- **vault-freshness.sh** — find stalest high-importance files
```

## Action Items

- [ ] Apply lean rewrites to: browser-automation, coder, ops, security, vault-keeper
- [ ] Add epistemic checklist to devils-advocate AGENTS.md (currently only in main)
- [ ] Researcher AGENTS.md is good — keep the "don't use X" warnings, remove vault structure block

## Related
- [[SOUL.md Protocol]]
- [[Agent Roster]]
- [[Self-Evolution Protocol]]
