---
title: Slash Commands Design
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
tags:
  - openclaw
  - ops
  - prompts
  - research
  - security
  - skills
summary: >-
  Impeccable turns complex multi-step processes into invokable commands. Each
  command is a self-contained skill with:
wiki_id: research/Slash_Commands_Design
imported_from: vault/Research/Slash Commands Design.md
imported_at: '2026-04-04T00:23:57.113Z'
---
# Slash Commands Design for Right Hand

> Reusable cognitive routines inspired by [Impeccable](https://github.com/pbakaus/impeccable)'s slash command pattern.

## Concept

Impeccable turns complex multi-step processes into invokable commands. Each command is a self-contained "skill" with:
- A clear trigger (`/audit`, `/polish`)
- Mandatory preparation steps (context gathering)
- A structured execution plan
- Explicit anti-patterns (what NOT to do)
- A verification step

We adapt this for Right Hand's operational domain — not frontend design, but agent workspace management, content quality, and decision support.

## Command Inventory

### /audit — Workspace Health Check

**Purpose:** Systematic quality check of the agent workspace, vault, and system health.

**Preparation:**
- Read today's memory file + yesterday's
- Check TASKS.md for stale/stuck tasks
- Check [[agent-performance]].md for recent failures

**Execution checklist:**

1. **Workspace hygiene**
   - SOUL.md, AGENTS.md, USER.md all present and current?
   - MEMORY.md not bloated? (target: <500 lines)
   - CONTINUE.md leftover from a previous session? (stale = bug)
   - TASKS.md — any tasks older than 24h without updates?
   - memory/ folder — today's note exists?

2. **Vault health**
   - `qmd status` — embeddings current?
   - Orphaned notes (no backlinks)?
   - Preferences.md — last updated when?
   - Daily notes gap — any missing days?

3. **System health**
   - [[OpenClaw]] gateway running? (`systemctl status openclaw-gateway`)
   - OAuth guardian healthy? (`tail -5 /var/log/oauth-guardian.log`)
   - Bridge sync active? (`systemctl status bridge-sync.timer`)
   - Disk usage (`df -h /`)
   - Memory pressure (`free -h`)

4. **Agent performance**
   - Recent agent failures in [[agent-performance]].md?
   - Any agent type consistently slow or failing?
   - Timeout patterns?

5. **Anti-pattern self-check**
   - Review last 5 responses — any slop tells?
   - Am I asking too many permission questions?
   - Am I going dark during long tasks?

**Output:** Severity-rated report (critical/warn/ok) with specific actions for each finding.

**Anti-patterns:**
- ❌ Don't report "all clear" without actually checking everything
- ❌ Don't list issues without severity or recommended action
- ❌ Don't skip the self-check (it's the most important part)

---

### /critique — Multi-Angle Design/Proposal Review

**Purpose:** Evaluate a proposal, design, plan, or idea from multiple stakeholder perspectives before committing.

**Preparation:**
- Identify what's being critiqued (read the file/proposal/message)
- Identify the goal and constraints
- Determine which perspectives are most relevant

**Execution — 5 Perspective Protocol:**

1. **User/Consumer perspective**
   - Does this solve a real problem?
   - Is it intuitive? Would someone understand it without explanation?
   - What's the learning curve?
   - What would frustrate someone using this daily?

2. **Builder/Developer perspective**
   - Is this feasible with current tools/skills?
   - What's the maintenance burden?
   - Where are the complexity hotspots?
   - What would you dread changing 6 months from now?

3. **Operator/Ops perspective**
   - What can go wrong at runtime?
   - How do you monitor/debug this?
   - What's the blast radius of a failure?
   - Does this create operational toil?

4. **Adversarial/Attacker perspective**
   - How could this be misused or exploited?
   - What assumptions could be violated?
   - Where are the trust boundaries?
   - What happens with malicious input?

5. **Strategic/Business perspective**
   - Does this align with stated goals?
   - What's the opportunity cost?
   - Is this the right thing to build right now?
   - What would make this 10x more valuable?

**Output:** Structured critique with each perspective's verdict (👍 approve / ⚠️ concerns / 🚫 block), top 3 risks, top 3 strengths, and a final recommendation.

**Optional modes:**
- `/critique --quick` — Single-pass, 2-3 perspectives only
- `/critique --adversarial` — Focus on attack vectors and failure modes
- `/critique --strategic` — Focus on alignment and opportunity cost
- `/critique --spawn` — Dispatch to Devil's Advocate agent for independent review

**Anti-patterns:**
- ❌ Don't just list positives — the whole point is to find problems before they ship
- ❌ Don't critique without offering alternatives ("this is bad" → "this is bad, try X instead")
- ❌ Don't give every perspective equal weight — some matter more for specific proposals
- ❌ Don't be contrarian for its own sake — genuine issues only

---

### /polish — Refine and Improve Content

**Purpose:** Final quality pass on text, code, configs, or vault notes. The difference between "done" and "shipped."

**Preparation:**
- Read the target content fully
- Understand the audience and purpose
- Check for existing style guides or conventions (SOUL.md voice, vault format)

**Execution by content type:**

#### Text/Prose
- **Clarity:** Every sentence says one thing clearly
- **Concision:** Cut filler words (just, really, very, actually, basically)
- **Voice consistency:** Matches SOUL.md voice (casual, sharp, no sycophancy)
- **Structure:** Headings and formatting only where they help
- **Links:** All references point somewhere useful
- **Wikilinks:** Vault notes use `[[wikilinks]]` to related notes

#### Code
- **Naming:** Variables/functions describe what they do
- **Comments:** Explain why, not what
- **Dead code:** Remove commented-out blocks
- **Error handling:** Failures produce useful messages
- **Consistency:** Follows existing patterns in the codebase

#### Config/YAML/JSON
- **Comments:** Document non-obvious settings
- **Defaults:** Sensible defaults, overrides clearly marked
- **Secrets:** No hardcoded secrets (use env vars)
- **Validation:** Invalid configs fail fast with clear errors

#### Agent Prompts
- **Anti-pattern check:** Run against the 15 anti-patterns in [[Anti-Pattern Prompting]]
- **Specificity:** Replace vague instructions with concrete examples
- **Slop test:** Would this produce generic AI output? Tighten it.
- **Completeness:** Does it cover the happy path AND failure modes?

**Output:** The polished content (inline edit or new file), plus a changelog of what was improved and why.

**Anti-patterns:**
- ❌ Don't polish before it's functionally complete (polish is the last step)
- ❌ Don't change meaning while polishing (preserve intent, improve expression)
- ❌ Don't over-format (adding markdown structure to prose that reads fine without it)
- ❌ Don't polish one section to perfection while leaving others rough

---

### /distill — Compress to Essentials

**Purpose:** Take verbose content and extract only what matters. Strip padding, redundancy, and filler while preserving all signal.

**Preparation:**
- Read the full source content
- Identify the core purpose (what question does this answer? what action does it enable?)
- Determine the target length (default: 30% of original)

**Execution:**

1. **Identify signal vs noise**
   - What information is essential (removing it changes the meaning)?
   - What information is supporting (helpful but not critical)?
   - What information is filler (adds words without adding value)?

2. **Extract the skeleton**
   - Core claim/purpose in one sentence
   - Key supporting points (max 5)
   - Critical caveats or exceptions
   - Required next actions

3. **Compress**
   - Replace paragraphs with sentences
   - Replace sentences with phrases
   - Remove all hedging language
   - Remove all repetition (say it once)
   - Remove meta-commentary ("In this document we will discuss...")
   - Remove obvious context the reader already has

4. **Verify completeness**
   - Could someone act on the distilled version without the original?
   - Is any critical nuance lost?
   - Does it still read naturally (not just a keyword list)?

**Output formats:**
- **Default:** Compressed prose (30% of original)
- `/distill --tldr` — 1-3 sentence summary
- `/distill --bullets` — Key points as bullet list
- `/distill --action` — Only actionable items, nothing else
- `/distill --diff` — Show what was removed and why

**Anti-patterns:**
- ❌ Don't lose critical nuance in pursuit of brevity
- ❌ Don't just bold the important parts of the original (that's highlighting, not distilling)
- ❌ Don't create a bulleted summary of every section (that's an outline, not a distillation)
- ❌ Don't add your own analysis — distill what's there, don't editorialize

---

## Implementation Plan

### Phase 1: Embed in SOUL.md
Add a "Slash Commands" section to SOUL.md listing all four commands with one-line descriptions. The full specs live here in the vault; SOUL.md just needs to know they exist.

### Phase 2: Create as Skill
Package as an [[OpenClaw]] skill (`~/skills/slash-commands/`) with:
```
slash-commands/
├── SKILL.md          # Skill entry point, routes to sub-commands
├── commands/
│   ├── audit.md      # Full /audit spec
│   ├── critique.md   # Full /critique spec
│   ├── polish.md     # Full /polish spec
│   └── distill.md    # Full /distill spec
└── references/
    └── anti-patterns.md  # Link to vault anti-patterns doc
```

### Phase 3: Integration
- `/audit` runs on first heartbeat each day (automated)
- `/critique` invoked before any major system change
- `/polish` applied to all vault notes before archiving
- `/distill` used when context windows are getting large (compress old content)

### Future Commands (Candidates)
| Command | Purpose |
|---|---|
| `/diverge` | Generate 3+ perspectives on a problem before converging |
| `/retro` | Post-mortem on a completed task — what worked, what didn't |
| `/estimate` | Time/complexity estimate with confidence intervals |
| `/explain` | Explain a system/codebase to someone unfamiliar |
| `/secure` | Security-focused review of a change or config |

---

## Key Design Principles (from Impeccable)

1. **Mandatory preparation** — every command reads context before acting. No blind execution.
2. **Explicit anti-patterns** — each command lists what NOT to do. This is where most of the value lives.
3. **Structured output** — each command defines its output format. No ad-hoc responses.
4. **Composability** — commands can chain: `/audit` finds problems → `/critique` evaluates fixes → `/polish` before shipping.
5. **Scope control** — commands accept an optional target argument to focus on a specific area.
6. **Quality gate** — every command ends with a verification step.

---

*Created 2026-03-16 by 🎯 Prompt Engineer, studying [pbakaus/impeccable](https://github.com/pbakaus/impeccable)*
