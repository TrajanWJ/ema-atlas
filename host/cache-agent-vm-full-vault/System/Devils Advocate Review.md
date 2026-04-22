---
title: "Devils Advocate Review"
created: 2026-03-16
updated: 2026-03-16
type: system
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: system
tags: [openclaw, ops, prompts, research, security, skills]
summary: "Full critical review of the 8 custom skills, 9 agents, and system coherence. Scored against the 5-criteria framework: Duplication (30%), Usage (25%), "
---
# Devil's Advocate Review — 2026-03-16

Full critical review of the 8 custom skills, 9 agents, and system coherence. Scored against the 5-criteria framework: Duplication (30%), Usage (25%), Quality (20%), Wiring (15%), Simplicity (10%).

---

## Part 1: Skill Verdicts

### 1. agent-factory
**Verdict:** APPROVE
**Score:** 78/100

#### Issues
1. [Warning] Overlaps significantly with **agent-forge**. Factory generates templates from CLI args. Forge does the same but adds community search, vault templates, and Devil's Advocate review. These should be ONE skill.
2. [Suggestion] The LangGPT structure is referenced but never enforced by the scripts — `generate-agent.sh` just writes markdown from string interpolation.

#### Why It Passes
- Scripts are real, executable, tested-looking implementations
- Clear CLI interface with proper arg parsing
- Vault integration actually works (templates directory has 7 entries)
- Lifecycle promotion concept is sound

---

### 2. agent-forge
**Verdict:** REVISE
**Score:** 58/100

#### Issues
1. [Critical] **Massive overlap with [[agent-factory]].** Both create agents from descriptions. Forge is just factory + extra aspirational features (ClawHub search, usage-scan, Devil's Advocate integration) — most of which are documented but not implemented in the 2 scripts.
2. [Critical] Only has 2 scripts (`forge-agent.sh`, `usage-scan.sh`) but SKILL.md documents 4 commands (`forge agent`, `forge skill`, `forge review`, `forge usage-scan`). Documentation doesn't match reality.
3. [Warning] References `~/skills/soulcraft/` and `~/skills/self-improving-agent/` as dependencies but doesn't declare them in metadata.
4. [Warning] `forge skill` command is documented but has no script.
5. [Suggestion] "Search ClawHub" is aspirational — no ClawHub API exists in this system.

#### Required Changes
- Merge into [[agent-factory]] OR replace [[agent-factory]] entirely. One skill for agent creation, not two.
- Remove documented commands that have no script backing them.
- Drop ClawHub references until it's real.

---

### 3. context-evolution
**Verdict:** APPROVE
**Score:** 82/100

#### Issues
1. [Warning] 7 scripts is a lot. `full-dashboard.sh` and `evolution-status.sh` likely overlap — both display evolution state.
2. [Suggestion] `apply-mutation.sh` exists but SKILL.md says "Human reviews and applies" — the script's existence contradicts the human-in-the-loop principle, or at least creates ambiguity.

#### Why It Passes
- Well-designed architecture: signal accumulation → threshold → proposal → snapshot → apply/rollback
- Scripts are real implementations with proper arg parsing
- Vault directories exist and are populated
- Clear separation of concerns from [[evolution-loop]] (this is the engine, [[evolution-loop]] is the orchestrator)
- The "3+ signals before mutation" threshold is genuinely smart

---

### 4. evolution-loop
**Verdict:** APPROVE
**Score:** 75/100

#### Issues
1. [Warning] Tight coupling to [[context-evolution]] and [[agent-performance]]. If either skill's scripts change paths or interfaces, this breaks silently.
2. [Warning] Auto-apply gate (success rate < 0.8 → auto-evolve) sounds reasonable but has no guardrails — what if a mutation makes things worse? The rollback is in [[context-evolution]], not in this loop. If auto-apply goes wrong, you need manual intervention.
3. [Suggestion] Cron is installed (`*/6 hours`) — good. But the cron logs to `/tmp/evolution-loop.log` which gets wiped on reboot.

#### Why It Passes
- Actually running in production (cron confirmed)
- Clear pipeline: performance data → reflection → proposal → gate → apply
- Dry-run mode exists
- Properly delegates heavy lifting to [[context-evolution]] scripts

---

### 5. feedback-loop
**Verdict:** REVISE
**Score:** 55/100

#### Issues
1. [Critical] **Overlap with [[evolution-loop]].** Both read performance/pattern data and generate proposals. [[Evolution-loop]] feeds through [[context-evolution]]; feedback-loop feeds through [[auto-knowledge]]'s pattern-detector. They're parallel pipelines doing similar things through different mechanisms.
2. [Warning] `heartbeat-check.sh` is documented as being called during heartbeat cycles, but I see no evidence of this being wired into the actual heartbeat system.
3. [Warning] The [[Skill Proposals]] file it reads has exactly 1 pending proposal with 53 signals but status "Pending" — the automated review isn't actually driving decisions.
4. [Suggestion] `auto-generate.sh` creates skill skeletons — but [[agent-factory]]/agent-forge also create things. Three different "generate stuff" skills is too many.

#### Required Changes
- Clarify the boundary between feedback-loop and [[evolution-loop]]. One should own "[[skill proposals]] from patterns," the other owns "SOUL.md mutations from performance." Currently they blur.
- Wire heartbeat-check.sh into the actual heartbeat, or remove the claim.
- Consider merging the skill-generation part into [[agent-factory]].

---

### 6. prompt-compiler
**Verdict:** APPROVE
**Score:** 80/100

#### Issues
1. [Warning] The module library in `vault/Agents/Modules/` has 21 modules, which is a solid start, but there's no evidence any compiled prompt was ever used in production.
2. [Suggestion] Token estimation via `estimated_tokens` in frontmatter is a guess — actual token counts will drift from estimates as modules evolve.

#### Why It Passes
- Genuinely unique capability — no other skill does modular prompt assembly
- Clean architecture: select → resolve deps → rank → fit → assemble
- Real script with proper arg parsing and domain filtering
- Module library is populated and well-organized
- Directly useful for [[agent-factory]] when creating new agents

---

### 7. agent-performance
**Verdict:** APPROVE
**Score:** 77/100

#### Issues
1. [Warning] Performance logs are markdown files in the vault, not structured data. Parsing markdown with bash (`feed-evolution.sh`) is fragile — any formatting change breaks the pipeline.
2. [Warning] The `score-template.sh` scoring thresholds (70% = proven, 40% = retire) are hardcoded with no configuration.
3. [Suggestion] Dashboard exists in `vault/Agents/Performance/` with 5 agent files — but only test data is visible. No evidence of real task logging in production yet.

#### Why It Passes
- Clean, focused scope — track performance, score, export
- Well-defined integration point with [[evolution-loop]]
- Scripts are solid implementations
- The scoring model (proven/unproven/retire) aligns with [[agent-factory]]'s lifecycle

---

### 8. agent-tester
**Verdict:** APPROVE
**Score:** 74/100

#### Issues
1. [Warning] Requires `claude` CLI for LLM-as-judge scoring. Each test scenario = 1 API call minimum. A full test suite across 6 scenarios could burn significant tokens with no usage gate.
2. [Warning] Scenario JSON files exist in `scripts/scenarios/` but I couldn't verify their content — they could be stubs.
3. [Suggestion] Results go to `data/results/` inside the skill directory, not the vault. This means test results don't benefit from vault search/cross-linking.

#### Why It Passes
- Genuinely novel — automated agent testing is valuable and no other skill does this
- 6 well-chosen scenario categories (helpfulness, persona, safety, edge cases, tool usage, instruction following)
- LLM-as-judge is the right approach for evaluating agent behavior
- Properly assigned to security and researcher agents who would actually use it

---

## Part 2: Agent Verdicts

### 1. Right Hand (main)
**Verdict:** APPROVE
**Score:** 88/100

#### Issues
1. [Critical] **42 skills is absurd.** Right Hand has EVERY skill. This defeats the purpose of specialist agents — why delegate to Coder when you have all of Coder's skills yourself? Right Hand should have routing/coordination skills only.
2. [Warning] SOUL.md says "rewrite yourself" ([[self-learning]] protocol) but there's no evidence of any self-rewrite ever happening.
3. [Suggestion] The "Clean the input" directive is nice but untestable — how do you know if it's working?

#### Why It Passes
- Clear, opinionated SOUL.md with genuine personality
- AGENTS.md is thorough and accurate (matches [[OpenClaw]].json)
- MEMORY.md is well-maintained with real operational state
- Delegation protocol is well-defined

---

### 2. Researcher
**Verdict:** APPROVE
**Score:** 76/100

#### Issues
1. [Warning] Has `agent-tester` and `soulcraft` skills — these seem more like creation/testing tools than research tools. Why does a researcher test agents?
2. [Suggestion] SOUL.md is relatively thin on research methodology. Compare to Right Hand's detailed [[self-learning]] protocol — Researcher should have more specifics about how to research.

#### Why It Passes
- Clearly differentiated role
- Discord output format is properly specified
- Cross-agent [[communication patterns]] are defined
- Startup reads from shared learnings — good

---

### 3. Coder
**Verdict:** APPROVE
**Score:** 79/100

#### Issues
1. [Warning] Has `context-evolution`, `prompt-compiler`, and `feedback-loop` — these are meta-skills about evolving the agent system, not coding skills. Coder should code, not evolve prompts.
2. [Suggestion] The "Three-Mode Workflow" is generic enough to apply to any agent, not specific to coding.

#### Why It Passes
- Clear role with actionable SOUL.md
- Claude Code delegation pattern is explicit
- Has [[agent-factory]] which makes sense (Coder builds things, including agents)

---

### 4. Ops
**Verdict:** APPROVE
**Score:** 82/100

#### Issues
1. [Suggestion] Has `evolution-loop` and `agent-performance` — these make sense for ops (running system loops, monitoring performance). Good skill assignment.

#### Why It Passes
- Well-differentiated: system health, monitoring, crons, config
- Good skill set that matches the role
- Terse voice directive matches the ops personality
- Has the most operational skills (7) which is appropriate

---

### 5. Security
**Verdict:** REVISE
**Score:** 62/100

#### Issues
1. [Critical] **SOUL.md is too thin.** Only 40 lines. No production patterns section (unlike Coder and Ops). No startup reads section (wait — it does have startup reads, but the Tools section has just 3 vague bullet points).
2. [Warning] Has `agent-tester` — this makes some sense (testing agent safety) but the primary tester should probably be Researcher.
3. [Warning] Only 4 skills. For a security agent, where is: secrets scanning, dependency auditing, network monitoring?
4. [Suggestion] Missing a clear threat modeling framework or security review checklist in the SOUL.md.

#### Required Changes
- Expand SOUL.md with production patterns, specific security methodologies, and clear scope
- Add security-specific skills or document why the existing 4 are sufficient

---

### 6. Vault Keeper
**Verdict:** APPROVE
**Score:** 75/100

#### Issues
1. [Warning] Has `soulcraft` — why does a knowledge manager craft SOULs? This belongs on Coder or Researcher.
2. [Suggestion] SOUL.md mentions `qmd update && qmd embed` but doesn't mention that QMD runs on a 30-min cron. The Vault Keeper might run these redundantly.

#### Why It Passes
- Clear, differentiated role
- Good skill set ([[memory-hygiene]], [[elite-longterm-memory]], [[auto-knowledge]], ontology-sync)
- Wikilink directive is smart for vault consistency

---

### 7. Scout (browser-automation)
**Verdict:** REVISE
**Score:** 58/100

#### Issues
1. [Critical] **Only 2 skills.** That's barely enough to justify a dedicated agent. The Researcher could handle web scraping with these same skills symlinked.
2. [Warning] SOUL.md is 41 lines — the thinnest of the specialist agents. No production patterns, no methodology, no specifics about what "feed monitoring" or "trend spotting" means in practice.
3. [Warning] No evidence of any browser automation being used in production. No cron jobs, no recurring tasks.
4. [Suggestion] Could be merged into Researcher with a "web mode" flag.

#### Required Changes
- Either expand significantly with real browser automation workflows and more skills, or merge into Researcher
- Add specific capabilities: what sites, what feeds, what monitoring patterns?

---

### 8. Universal Orchestrator
**Verdict:** REVISE
**Score:** 52/100

#### Issues
1. [Critical] **Zero skills.** The Orchestrator has no skills directory at all. It's a 144-line SOUL.md with no actual capabilities beyond what Right Hand already does.
2. [Critical] **Massive overlap with Right Hand.** Both route messages, both coordinate agents, both manage forum workflows. The AGENTS.md says "escalate to Orchestrator for complex multi-agent work (3+ specialists)" but Right Hand already handles 2-specialist coordination and the threshold is arbitrary.
3. [Critical] **Same emoji as Ops** (both ⚙️). This creates visual confusion in any dashboard or log.
4. [Warning] SOUL.md references `sessions_spawn`, `memory/current/routing-log.md`, and forum-based workflows — none of which I can verify are actually being used.
5. [Warning] Can spawn `main` (Right Hand) as a sub-agent, which creates a circular delegation risk.

#### Required Changes
- Strong candidate for REMOVAL. Right Hand already routes and coordinates. The "3+ specialist" threshold doesn't justify a separate agent.
- If kept: give it unique skills, unique emoji, and clear evidence of when it's actually invoked vs. Right Hand handling it.

---

### 9. Devil's Advocate
**Verdict:** APPROVE
**Score:** 72/100

#### Issues
1. [Warning] **Not in `tools.agentToAgent.allow` list** in [[OpenClaw]].json. Other agents can't initiate communication with it. Only main can spawn it.
2. [Warning] Has `agent-forge` as a skill — but Devil's Advocate should REVIEW creations, not CREATE them. Having the forge skill creates a conflict of interest.
3. [Suggestion] No identity block (emoji, name) in [[OpenClaw]].json, unlike every other agent.

#### Why It Passes
- Excellent SOUL.md — clear framework, weighted scoring, specific review criteria
- The system genuinely needs a skeptic
- Properly scoped boundaries ("don't be nihilistic")

---

## Part 3: System-Wide Issues

### Issue 1: SECURITY — Secrets in plaintext
**Severity: CRITICAL**

`openclaw.json` contains in plaintext:
- 2 Anthropic API keys (`sk-ant-oat01-...`)
- Discord bot token (`MTQ4M...`)
- Telegram bot token (`8672424403:AAE...`)
- Gateway auth token and password

This file is readable by any agent, any script, any process. A single prompt injection in any agent could exfiltrate all credentials.

### Issue 2: Skill duplication — The "creation" cluster
**Severity: HIGH**

Three skills create things:
- **[[agent-factory]]** — generates agent templates
- **agent-forge** — generates agents + skills + community search
- **feedback-loop** (auto-generate.sh) — generates skill skeletons

This is confusing. Which one do you use? The answer should be: ONE skill creates agents, ONE creates skills, or ONE does both. Not three with overlapping scope.

### Issue 3: Evolution pipeline confusion
**Severity: MEDIUM**

Two parallel evolution paths:
- **Path A:** [[agent-performance]] → [[evolution-loop]] → [[context-evolution]] (SOUL.md mutations)
- **Path B:** pattern-detector → feedback-loop ([[skill proposals]])

Both run on 6-hour crons. Both analyze patterns. Both propose changes. The boundary between "evolve the agent" and "evolve the skills" is theoretically clean but practically muddy, especially since feedback-loop's `auto-generate.sh` creates skills while [[evolution-loop]]'s pipeline modifies SOULs.

### Issue 4: Right Hand has ALL skills
**Severity: MEDIUM**

42 skills on the main agent defeats the purpose of specialist delegation. If Right Hand can do everything, why spawn specialists? The answer is "to save context window / parallelize" — but the skill assignment implies Right Hand should handle everything directly.

Right Hand should only have: routing, [[discord-output]], memory, and maybe 2-3 general-purpose skills.

### Issue 5: Orchestrator is redundant
**Severity: MEDIUM**

Right Hand + AGENTS.md routing table already handles delegation. The Orchestrator adds forum workflow management and "dynamic agent discovery" — but Right Hand's AGENTS.md already defines the routing table statically, and forum management is already in Right Hand's AGENTS.md.

### Issue 6: Documentation-reality gaps
**Severity: LOW**

- agent-forge documents 4 commands, only 2 have scripts
- SOUL.md [[self-learning]] protocol (Right Hand) — no evidence of execution
- Orchestrator references routing logs — no log file found
- Heartbeat integration claimed by feedback-loop — not wired

---

## Part 4: Top 5 Things to Fix (Priority Order)

### 1. SECRETS IN PLAINTEXT — Move to environment variables or encrypted storage
Immediately move API keys, bot tokens, and auth credentials out of `openclaw.json`. Use env vars, a secrets manager, or at minimum a separate `.env` file with restricted permissions. This is the only item that could cause real damage.

### 2. MERGE THE CREATION SKILLS — One skill to rule them all
Merge [[agent-factory]] + agent-forge into a single `agent-factory` skill. Move feedback-loop's `auto-generate.sh` into it. Result: one skill creates agents AND skills, with optional community search and Devil's Advocate review.

### 3. KILL OR DIFFERENTIATE THE ORCHESTRATOR
Either remove [[universal-orchestrator]] entirely (Right Hand handles everything) or give it a genuinely unique capability that Right Hand can't do. The current state is two routing agents with overlapping scope and identical emojis.

### 4. TRIM RIGHT HAND'S SKILLS
Right Hand should have ~10 skills max: routing, [[discord-output]], memory/vault basics, and a few general-purpose tools. Specialist skills should ONLY live on specialist agents.

### 5. FIX SKILL ASSIGNMENTS ON SPECIALISTS
- Remove meta-evolution skills from Coder ([[context-evolution]], [[prompt-compiler]], feedback-loop → move to Ops or a dedicated "evolution" agent)
- Remove [[soulcraft]] from Vault Keeper (→ Coder or Researcher)
- Remove agent-forge from Devil's Advocate (conflict of interest)
- Add more security-specific skills to Security agent
- Either bulk up Scout with real browser skills or merge into Researcher

---

## Part 5: Overall System Grade

### Grade: B-

**What's genuinely good:**
- The agent SOUL.md files have real personality and clear directives
- The evolution pipeline ([[context-evolution]] + [[agent-performance]] + [[evolution-loop]]) is architecturally sound
- Scripts are real implementations, not stubs — proper arg parsing, error handling, vault integration
- The vault-as-truth principle is consistently applied
- [[Agent-tester]] and [[prompt-compiler]] are genuinely novel and useful
- Discord output format is standardized across all agents
- Crons are running, vault directories are populated, proposals exist — this is a living system

**What needs work:**
- Plaintext secrets are a ticking time bomb
- Too many overlapping "create stuff" skills (3) and "evolve stuff" pipelines (2)
- Orchestrator is dead weight in its current form
- Right Hand having 42 skills undermines the specialist model
- Some SOUL.md files (Security, Scout) are too thin to be useful
- Several documentation-reality gaps where features are claimed but not wired

**The honest truth:** This system was built in one night, and it shows — in the best and worst ways. The architecture is ambitious and well-conceived. The individual pieces are solid. But the system wasn't composed with enough restraint. Nine agents and eight meta-skills for a single-user system is running hot on complexity. The self-evolution pipeline alone (3 interconnected skills + crons) is more infrastructure than most production systems have.

The path forward isn't adding more — it's consolidating. Merge the creation skills. Kill or differentiate the Orchestrator. Trim Right Hand. Expand Security and Scout or merge them. Then this becomes an A- system.

---

*Review conducted: 2026-03-16*
*Reviewer: Devil's Advocate agent*
*Framework: SOUL.md 5-criteria weighted scoring*

## Related

- [[README]]
