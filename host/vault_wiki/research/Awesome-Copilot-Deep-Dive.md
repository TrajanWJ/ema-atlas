---
title: 'Awesome Copilot — Deep Dive: Skills, Hooks, Agents'
type: research
tags:
  - copilot
  - agent-architecture
  - hooks
  - skills
  - governance
  - prompt-engineering
source: 'https://github.com/github/awesome-copilot'
date: '2026-03-18'
created: '2026-03-18'
updated: '2026-03-18'
status: active
confidence: 0.8
relevance: high
summary: >-
  Curated patterns from github/awesome-copilot: hook architecture, governance
  patterns, HLBPA agent design, skill composition, and prompt engineering
  primitives directly applicable to OpenClaw.
wiki_id: research/Awesome-Copilot-Deep-Dive
imported_from: vault/Research/Awesome-Copilot-Deep-Dive.md
imported_at: '2026-04-04T00:23:57.003Z'
---

# Awesome Copilot — Deep Dive

**Source:** github/awesome-copilot + anchildress1/awesome-github-copilot
**Date:** 2026-03-18

## Structure Overview

| Resource | What It Is |
|---|---|
| **Agents** | Specialized personas with tool access + system prompts |
| **Instructions** | Coding standards applied by file pattern (always-on context injection) |
| **Skills** | Self-contained folders with instructions + bundled assets |
| **Plugins** | Bundles of agents + skills for workflows |
| **Hooks** | Automated actions on session events |
| **Workflows** | AI-powered GitHub Actions in markdown |

**Key insight:** The Copilot ecosystem decomposed what we call a "SOUL.md" into:
- Instructions = persistent context (always-on)
- Skills = conditional context (task-triggered)
- Agents = persona + tool policy + instructions combined
- Hooks = lifecycle automation

This is more modular than our current monolithic SOUL.md pattern.

---

## Hooks — The Key Pattern We're Missing

**Available hook events:**
- `sessionStart` — inject context, set up state
- `sessionEnd` — commit, log, summarize
- `userPromptSubmitted` — pre-process, scan, transform
- `preToolUse` — validate before tool execution
- `postToolUse` — log results, trigger follow-ups
- `errorOccurred` — handle failures

**What this maps to in OpenClaw:**
We have no equivalent of `preToolUse` / `postToolUse` hooks. The closest is AGENTS.md dispatch protocol. But hooks are **automatic and event-driven** — not manual protocol.

### Session Logger Hook Pattern
```json
{
  "events": ["sessionStart", "sessionEnd", "userPromptSubmitted"],
  "scripts": {
    "sessionStart": "log-session-start.sh",
    "sessionEnd": "log-session-end.sh", 
    "userPromptSubmitted": "log-prompt.sh"
  }
}
```
Our equivalent: daily memory files + CONTINUE.md. Missing: per-prompt logging.

### Governance Audit Hook Pattern
Scans every user prompt for threat signals BEFORE the agent processes it:
- `data_exfiltration` patterns → severity 0.7-0.95
- `privilege_escalation` (sudo, chmod 777) → severity 0.8-0.95
- `system_destruction` (rm -rf, drop database) → severity 0.9-0.95
- `prompt_injection` (ignore previous instructions) → severity 0.6-0.9
- `credential_exposure` (hardcoded keys) → severity 0.9-0.95

Four governance levels: open → standard → strict → locked

**Log format (append-only JSONL):**
```json
{"timestamp":"...","event":"threat_detected","threats":[{"category":"privilege_escalation","severity":0.8,"evidence":"sudo"}]}
```

Full prompts are NEVER logged — only matched patterns + metadata.

**OpenClaw adaptation:** Security agent should implement this as a session startup check. Every inbound message to sensitive agents scanned before routing.

### Session Auto-Commit Hook
Automatically commits and pushes at session end. We do this manually. Could be:
```bash
# .github/hooks/session-auto-commit/auto-commit.sh
git add -A && git commit -m "agent: session $(date +%Y%m%d-%H%M) auto-commit" && git push
```

---

## HLBPA Agent — High-Level Big Picture Architect

**Key design principles stolen from this agent:**

### The Materiality Test
> "If removing a detail would not change a consumer contract, integration boundary, reliability behavior, or security posture — omit it."

This is a brilliant filter for when agents produce too much output. Apply to all agents: "Would removing this change a decision or action? If no — cut it."

### Interface-First Documentation
Lead with public surface: APIs, events, queues, CLI entrypoints. Not internals.
For our vault: documents should lead with "what it does" (interface), then "how it works" (implementation). Most vault docs currently bury the interface.

### Iteration Loop Pattern
```
1. High-level pass → generate artifacts
2. Mark unknowns TBD
3. Emit Information Requested list (ONCE, consolidated)
4. Stop. Wait.
5. Repeat until no TBDs
```
We do step 1-2 but skip 3-4. Agents often try to fill unknowns by guessing rather than asking. HLBPA makes asking explicit.

### Input Schema for Agent Tasks
HLBPA defines a formal input schema for every task request:
```
| targets | scope | #codebase | Any path |
| artifactType | output type | doc | doc/diagram/testcases/gapscan |
| depth | analysis level | overview | overview/subsystem/interface-only |
```
**OpenClaw adaptation:** Spawning agents with a schema (not freeform text) would dramatically improve output quality. Consider adding a structured header to sub-agent spawns.

---

## Custom Instructions Pattern (anchildress1)

### CSO (Claude Search Optimization)
Copilot agent descriptions must ONLY contain trigger conditions. Never process summaries.

Bad:
> "Manages changelog by analyzing git history, formatting entries, and applying style guide rules"

Good:
> "Use when: modifying CHANGELOG.md, reviewing release notes, documenting version history"

The "bad" version makes Claude think it already knows what to do. The "good" version triggers the skill load.

**This is the same issue we've seen with OpenClaw skill descriptions.**

### Global User Instructions Pattern
The `my-global-user.instructions.md` pattern: a single instruction file that applies to ALL copilot sessions and modifies core agent behavior. This is what our main SOUL.md is trying to be, but:
- Copilot instructions use `applyTo: '**/*'` for universal scope
- They're YAML-frontmatted markdown files (not plain text)
- They're modular — one file per concern, not one giant file

**OpenClaw adaptation:** Split SOUL.md into:
- `soul-core.md` — identity, voice, core rules
- `soul-routing.md` — how to route and delegate  
- `soul-memory.md` — how/when to write to vault
- `soul-evolution.md` — self-improvement rules

---

## Agent Governance Reviewer Agent
From awesome-copilot agents list — reviews code for safety issues, missing governance controls, trust scoring, and audit trails in agent systems.

**Key capabilities it checks for:**
1. Missing rate limiting / circuit breakers
2. Unvalidated tool inputs (SQL injection in tool args)
3. Missing human-in-the-loop gates for destructive actions
4. No audit logging for privileged operations
5. Trust scoring missing from inter-agent calls

**OpenClaw adaptation:** Add a governance checklist to Security agent:
- [ ] Does this skill/agent have a SUBAGENT-STOP guard?
- [ ] Are destructive operations explicitly gated?
- [ ] Are trust boundaries between agents documented?

---

## Agentic Workflows (AI GitHub Actions)

The `workflows/` section contains markdown-described GitHub Actions that Copilot agents execute:
- PR review automation
- Issue triage
- Release note generation
- Dependency update analysis

**Pattern:** Write the workflow as a markdown spec, Copilot executes it as code.
This is the same as our dispatch.sh + AGENTS.md approach, but using GitHub Actions as the execution layer.

**OpenClaw opportunity:** We could write `.github/workflows/` files that trigger our agents via webhooks — creating a GitHub-native agent entry point.

---

## Key Stolen Patterns (Implementation Priority)

| Priority | Pattern | Source | Implementation |
|---|---|---|---|
| 🔴 HIGH | Session Logger | hooks/session-logger | Write per-session prompt log to vault/Operations/session-logs/ |
| 🔴 HIGH | Materiality Test | HLBPA | Add to all agent SOUL.md: "Would removing this change a decision?" |
| 🟡 MED | Governance Audit | hooks/governance-audit | Security agent: scan inbound messages for threat patterns |
| 🟡 MED | CSO descriptions | anchildress1 | Audit all skill descriptions for trigger-only format |
| 🟡 MED | Formal input schema | HLBPA | Add structured headers to sub-agent spawn tasks |
| 🟢 LOW | Auto-commit hook | hooks/session-auto-commit | End-of-session git commit in vault workspace |
| 🟢 LOW | Modular SOUL | instructions pattern | Split SOUL.md into concern-specific files |

---

## Connections
- [[Superpowers Architecture - Stolen Patterns]] — same philosophy: discipline over capability
- [[Self-Organizing Agent Architectures]] — governance patterns complement distributed systems approach
- [[Metaprompting and Dynamic Agent Architecture]] — input schemas = better metaprompt targets

## Related

- [[Agent-Architecture-Synthesis-2026-03]]
- [[LangChain-Deep-Agents]]
