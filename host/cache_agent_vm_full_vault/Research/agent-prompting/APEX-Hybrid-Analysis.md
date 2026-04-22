---
title: "APEX Hybrid Meta-Prompt Analysis"
created: 2026-03-18
updated: 2026-03-18
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: "url:https://github.com/obviousworks/agentic-coding-meta-prompt"
tags: [prompts, agent-architecture, meta-prompt, research]
summary: "Analysis of APEX hybrid meta-prompt patterns (XML tags, cognitive blocks) for OpenClaw applicability."
---
# APEX Hybrid Meta-Prompt — Analysis & OpenClaw Applicability

**Source:** [obviousworks/agentic-coding-meta-prompt](https://github.com/obviousworks/agentic-coding-meta-prompt)
**Date:** 2026-03-18
**Method:** 1.5MB of leaked system prompts analyzed by Gemini + Claude → synthesized hybrid

## Key Structural Decisions

### XML Tags > Markdown Headers
APEX uses `<cognitive_thought>`, `<core_mandates>`, `<system_identity>` etc.
- Modern LLMs handle XML better than markdown headers: harder semantic boundaries, less instruction bleed
- THE ARCHITECT (Claude lineage) used markdown → weaker boundary enforcement
- **OpenClaw implication:** SOUL.md headers work but XML sections could tighten instruction following. Worth testing on high-stakes agents (Coder, Security).

### `<cognitive_thought>` Block Mandate
Before ANY code generation: output a cognitive thought block with:
1. Intent Decoupling — what is the user actually asking?
2. Context Analysis — what do existing files/dependencies say?
3. Strategy — atomic steps: Search → Plan → Edit → Verify
4. Risk Assessment — regressions, edge cases, unknowns

**OpenClaw applicability:** This is the "think before acting" pattern. Not in any SOUL.md currently. Worth adding to Coder.

### Phase Workflow
Phase 1: Understanding (read/map) → Phase 2: Planning (tasks/todo.md) → Phase 3: Implementation → Phase 4: Verification → Phase 5: Completion

### tasks/todo.md + tasks/lessons.md
- `tasks/todo.md` — checklist written before implementation; marked complete as you go
- `tasks/lessons.md` — after ANY user correction, log the pattern. Review at session start.
- **OpenClaw:** We have `vault/Agent-Learnings/` but it's fleet-wide. Per-project `tasks/lessons.md` is faster for Coder.

### Subagent Strategy (from APEX)
> "Use subagents liberally to keep the main context window clean. Offload research, exploration, and parallel analysis. One task per subagent — focused execution only."
— Aligns exactly with what we implemented in the Orchestrator last session.

### Response Mode Adaptation
- **Lightweight Mode:** greeting, trivial Q&A → 1-3 sentences, no planning
- **Full Engineering Mode:** multi-step → Think → Plan → Implement → Test → Report
- Escalation protocol: "This requires deeper changes — switching to full implementation mode."

## Claude Code System Prompt Patterns (from x1xhlol)
- Conciseness mandate: fewer than 4 lines unless asked for detail
- No comments in code unless asked
- TodoWrite used VERY frequently — mark complete immediately, never batch
- Follow conventions first: read file → understand patterns → mirror them
- Never assume library is available: check package.json/cargo.toml first

## Boris Cherny's CLAUDE.md vs APEX
Boris's setup is ~10x shorter (~250 words vs 2500) but beats APEX on:
- Subagent orchestration (explicit strategy)
- Persistent task tracking (tasks/todo.md)
- Self-improvement loop (tasks/lessons.md)
- Re-planning on failure (explicit STOP signal, not just 3 retries)
- Elegance check built into workflow

APEX beats Boris on: tool usage rules, security, naming conventions, response mode adaptation.

**Winner:** APEX Hybrid (merges both philosophies)

## GSD-2 Parallel Orchestration Patterns

### Architecture
- Coordinator tracks all workers via file-based IPC
- Each worker: isolated git worktree + own branch + own context window + own crash recovery
- `.gsd/parallel/<MID>.status.json` — workers write heartbeats
- `.gsd/parallel/<MID>.signal.json` — coordinator writes signals (pause/resume/stop)
- Atomic writes: write-to-temp + rename prevents partial reads

### Eligibility Rules Before Parallel Dispatch
1. Not already complete
2. All `dependsOn` satisfied
3. File overlap check (warning, not blocker — worktrees prevent conflicts)

**OpenClaw applicability:** Orchestrator should run a lightweight eligibility check before parallel dispatch. Our current pattern doesn't verify dependencies before spawning.

### Merge Reconciliation
Per-milestone or per-slice merge strategies. Conflicts detected at merge time, not at execution time (worktree isolation).

## GSD-2 Skills System

GSD skill = directory with `SKILL.md` that fires when task matches trigger.
- `skill_discovery: auto|suggest|off`
- `always_use_skills`, `prefer_skills`, `avoid_skills` in preferences
- Skill health dashboard: success rate, token usage, staleness detection
- Heal-skill: post-unit analysis detects if agent deviated from skill instructions → writes patch proposals

**OpenClaw:** This is exactly what our clawhub skill system does. GSD is converging on the same pattern independently. Skill staleness + health metrics is worth stealing.

## Recon (tmux agent dashboard)
- **[gavraz/recon](https://github.com/gavraz/recon)** — Rust + Ratatui
- Already installed at v0.1.0 on agent-vm
- Monitors multiple Claude Code sessions from tmux, Tamagotchi view per agent
- Run: `recon` in tmux

## Action Items (implemented this session)
- [x] Fetch and analyze GSD-2 parallel orchestration docs
- [x] Fetch and analyze GSD-2 skills docs
- [x] Fetch APEX Hybrid full prompt
- [x] Fetch Claude Code system prompt from x1xhlol
- [x] Verify recon installed (already at v0.1.0)
- [ ] Add cognitive_thought mandate to Coder SOUL.md
- [ ] Add tasks/lessons.md pattern to Coder SOUL.md
- [ ] Consider XML section headers for high-stakes agents

## Related
- [[GSD-2 Architecture]]
- [[Agent Learnings Patterns]]
- [[OpenClaw Skills System]]
