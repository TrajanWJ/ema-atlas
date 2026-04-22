---
title: "Wiki Structure & Schema Design — Vault → Wiki Migration"
created: 2026-04-03
updated: 2026-04-03
type: research
status: active
confidence: 0.90
tags: [wiki, schema, vault, ema, superman, architecture, design, migration]
summary: "Complete wiki structure design: vault analysis, 16 page types, vault→wiki mapping, Superman intent integration, memory layer schema, structural decisions, and query patterns. Guides Coder's implementation."
author: researcher
project: EMA
---

# Wiki Structure & Schema Design
## Vault → Wiki Migration Guide

*Status: DONE | Date: 2026-04-03 | Author: researcher (subagent)*

---

## Part 1: Vault Analysis

### 1.1 Top-Level Folder Inventory

| Folder | Count | Category | Purpose | Quality |
|---|---|---|---|---|
| `LCM Summaries/` | 1,253 | Memory | Auto-generated LCM conversation summaries | Auto-gen, stale by design |
| `Research/` | 166 | Knowledge | Deep dives, analysis, AI landscape | High quality, active |
| `Session Summaries/` | 108 | Memory | Agent session outputs (UUID-named .md files) | Auto-gen, variable quality |
| `System/` | 93 | Operations | Architecture, specs, design docs | High quality, hub pages |
| `Architecture/` | 65 | Knowledge | ADRs, system design decisions | Medium-high |
| `Skills/` | 50 | Config | Agent skill documentation | Active |
| `Projects/` | 30 | Projects | Product/project tracking pages | Active, high value |
| `Reference/` | 28 | Knowledge | External resources, bookmarks | Variable |
| `Operations/` | 26 | Operations | Runbooks, ops logs, post-mortems | Active |
| `Daily Notes/` | 26 | Memory | Daily logs + briefings | Mixed auto/manual |
| `Trajan/` | 25 | Personal | User profile, preferences, decisions | High value |
| `Agents/` | 21 | Config | Agent roster, evolution, performance | Active |
| `Codebases/` | 17 | Codebase | Per-project codebase docs | Medium |
| `Templates/` | 14 | Meta | Reusable templates | Low count, high reuse |
| `Claude-Code-Sessions/` | 10 | Memory | Session transcripts/summaries | Auto-gen |
| `Security/` | 7 | Operations | Security audits, hardening | Sparse |
| `_hubs/` | 6 | Navigation | Topic hub pages (hand-curated) | High quality |
| `Resources/` | 4 | Knowledge | External resource catalogs | Sparse |
| `Agent-Learnings/` | 4 | Memory | Agent bug/pattern notes | Active |
| `Inbox/` | 5 | Workflow | Unprocessed captures | Workflow buffer |
| `Tools/` | 3 | Config | Tool documentation | Sparse |
| `Reports/` | 2 | Operations | Periodic reports | Sparse |
| `Decisions/` | 1 | Knowledge | Decision records | **Severely underpopulated** |
| `Courses/` | 1 | Knowledge | Course material | **Barely used** |
| `Ops/` | 1 | Operations | Duplicate of Operations | Merge candidate |
| `Learnings & Gotchas/` | 1 | Memory | Misc learnings | Merge candidate |
| `.archive/` | 12 | Archive | Deprecated content | Low priority |
| `_deprecated/` | — | Archive | Old content | Ignore |
| `Claude-Code-Memory/` | 5 | Memory | Claude Code working memory | Auto-gen |
| `ontology/` | 0 | Meta | Type ontology (empty) | **Needs content** |

**Root files of note:**
- `Wiki.md` — master navigation index with namespace counts and entity types
- `Welcome.md` — onboarding page
- `README.md` — vault readme
- `.activation-scores.json` + `.activations.jsonl` — graph activation data (used by Superman/EMA)

### 1.2 Existing Type Taxonomy (from frontmatter scan)

The vault already uses typed frontmatter. Key types found:

| Type | Count | Notes |
|---|---|---|
| `research` | 307 | Primary content type |
| `reference` | 109 | External resources |
| `agent` | 85 | Agent config/docs |
| `subagent task` | 70 | Auto-generated task records |
| `system` | 57 | System/ops docs |
| `skill` | 48 | Skill documentation |
| `personal` | 48 | User context |
| `project` | 36 | Project pages |
| `architecture` | 35 | Design decisions |
| `operations` | 18 | Runbooks/procedures |
| `codebase` | 17 | Codebase docs |
| `auto-captured` | 13 | Auto-indexed content |
| `moc` | 12 | Maps of content (navigation) |
| `evolution-log` | 10 | Agent evolution tracking |
| `session` | 8 | Session summaries |
| `synthesis` | 4 | Cross-topic synthesis |
| `daily` | 6 | Daily notes |
| `performance` | 6 | Agent performance logs |
| + 40 more rare types | — | Long-tail fragmentation |

**Key finding:** Type taxonomy is partially enforced but inconsistent. ~40 rare types exist (design, planning, hub, coordinator, etc.) that should collapse into the canonical 16 types below.

### 1.3 Naming Patterns

| Pattern | Example | Meaning |
|---|---|---|
| `YYYY-MM-DD-topic.md` | `2026-04-03-superman.md` | Date-anchored content |
| `Topic-YYYY-MM-DD.md` | `EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md` | Topic-first (EMA convention) |
| `UUID.md` | `01eddf6f-bc5b-4fa9-...md` | Auto-generated sessions |
| `briefing-YYYY-MM-DD.md` | `briefing-2026-03-16.md` | Daily briefings |
| `CamelCase Topic.md` | `Agent Memory Architectures.md` | Human-written notes |
| `kebab-case.md` | `auto-knowledge-gated-broken.md` | Agent-written learnings |
| `README.md / _index.md` | — | Folder index pages |

### 1.4 Hub Pages (High-Value Central Pages)

These pages are highly linked-to and function as navigation anchors:

1. `Wiki.md` — master index (most linked root page)
2. `System/EMA-HQ-MASTER-SYNTHESIS-2026-04-03.md` — EMA ground truth
3. `Projects/Trajan's Projects.md` — project index
4. `Agents/Agent Roster.md` — agent directory
5. `Architecture/System Overview.md` — system architecture
6. `_hubs/` pages — topic hubs for Agent System, Research, Operations
7. `System/EMA-Unified-Spec-With-Integrations.md` — EMA spec
8. `Research/Agent-Architecture-Synthesis-2026-03.md` — synthesis

### 1.5 Orphaned / Stale Content

- `LCM Summaries/` (1,253 pages): Raw auto-generated. Not human-browsable. Need selective promotion to wiki, not bulk import.
- `Session Summaries/UUID.md` files: UUID-named, barely linked. Should be indexed by agent+date, not UUID.
- `Decisions/` (1 page): Severely underpopulated. Decision capture isn't happening.
- `Courses/` (1 index.md): Structure exists but no actual course pages beyond course server output.
- `Ops/` (1 page): Duplicate of `Operations/` — merge.
- `Learnings & Gotchas/` (1 page): Should merge into `Agent-Learnings/`.
- `Claude-Code-Memory/` (5 pages): Ephemeral working memory, not wiki content.

### 1.6 Frontmatter Convention (What Exists)

The best pages follow this pattern:
```yaml
---
title: "Page Title"
created: YYYY-MM-DD
updated: YYYY-MM-DD[THH:MM:SSZ]
type: research|project|agent|...
status: active|draft|archived|deprecated
confidence: 0.00–1.00
confidence_updated: YYYY-MM-DD
source: manual|agent:researcher|agent:right-hand|...
tags: [tag1, tag2]
summary: "150-char summary"
author: Trajan|researcher|right-hand|...
project: EMA|Superman|HQ|... (optional)
agent: researcher|coder|... (optional)
---
```

Many pages (especially auto-generated) are missing `summary`, `author`, and `project`.

---

## Part 2: Wiki Schema Design

### 2.1 Canonical Page Types (16 types)

#### TYPE: `project`
**Purpose:** Tracks an active initiative from inception to completion.
```yaml
# Required
title: "Project Name"
type: project
status: active|paused|complete|archived
created: YYYY-MM-DD
updated: YYYY-MM-DD
# Optional
summary: "150-char description"
tags: [ema, frontend, backend]
priority: high|medium|low
owner: Trajan|agent:coder
project_id: proj_ema  # machine-readable
phase: 1|2|3
```
**Sections:** Overview, Status, Goals, Current Sprint, Tasks, Decisions, Related Research, Codebase Links, Agent Executions, Backlog
**Query patterns:**
- `GET /api/wiki/pages?type=project&status=active`
- `GET /api/wiki/pages?type=project&tags[]=ema`
**Storage:** `Projects/{name}.md`

---

#### TYPE: `research`
**Purpose:** Deep-dive findings, analysis, competitive intel, papers.
```yaml
title: "Topic: Research Report"
type: research
status: active|draft|archived
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: 0.00–1.00
source: manual|web|agent:researcher
tags: [ai, elixir, knowledge-graph]
summary: "Core finding in 150 chars"
project: EMA  # optional
```
**Sections:** Summary, Findings (by theme), Key Takeaways, Contested/Uncertain, Open Questions, Sources
**Query patterns:**
- `GET /api/wiki/pages?type=research&tags[]=superman`
- `GET /api/wiki/pages?type=research&project=EMA&updated_after=2026-01-01`
**Storage:** `Research/{Topic}-{YYYY-MM-DD}.md`

---

#### TYPE: `intent`
**Purpose:** A single Superman intent — a goal/constraint/context for a project.
```yaml
title: "Intent: {description}"
type: intent
status: open|in-progress|complete|superseded
created: YYYY-MM-DD
updated: YYYY-MM-DD
project: EMA
intent_type: INTENT|CONTEXT|CONSTRAINT|RELATIONSHIP|PRIORITY|NOTE
priority: 1–5
agent: researcher|coder  # who should execute
```
**Sections:** Intent Statement, Context, Constraints, Relationships, Progress, Resolution
**Query patterns:**
- `GET /api/wiki/pages?type=intent&project=EMA&status=open`
- `GET /api/wiki/pages?type=intent&intent_type=CONSTRAINT`
**Storage:** `Projects/{project}/.superman/intents/{slug}.md`

---

#### TYPE: `intent-bundle`
**Purpose:** Aggregated Superman context file for a project (one per project).
```yaml
title: "Superman Context — {Project}"
type: intent-bundle
status: active
project: EMA
last_ingested: YYYY-MM-DDTHH:MM:SSZ
intent_count: 12
```
**Sections:** Project Context Overview, Active Intents, Constraints, Relationships, Notes, Changelog
**Query patterns:**
- `GET /api/wiki/projects/EMA/intents` → returns this page + all linked `type:intent` pages
- `Superman.context_for("proj_ema")` → parses this page + related intents
**Storage:** `Projects/{project}/.superman/context.md`

---

#### TYPE: `task`
**Purpose:** A discrete unit of work — actionable, assignable, completable.
```yaml
title: "Task: {description}"
type: task
status: open|in-progress|done|cancelled
created: YYYY-MM-DD
updated: YYYY-MM-DD
project: EMA
assigned_to: Trajan|agent:coder
priority: high|medium|low
due: YYYY-MM-DD  # optional
execution_id: exec_abc123  # if dispatched to agent
```
**Sections:** Description, Acceptance Criteria, Notes, Execution Log
**Query patterns:**
- `GET /api/wiki/pages?type=task&status=open&project=EMA`
- `GET /api/wiki/pages?type=task&assigned_to=agent:coder`
**Storage:** `Projects/{project}/tasks/{slug}.md` or `Tasks/{slug}.md`

---

#### TYPE: `decision`
**Purpose:** Records a decision made — why, what alternatives were considered, what was chosen.
```yaml
title: "Decision: {short description}"
type: decision
status: active|superseded|reversed
created: YYYY-MM-DD
author: Trajan
project: EMA  # optional
tags: [architecture, frontend]
```
**Sections:** Context, Decision, Alternatives Considered, Rationale, Consequences, Related Decisions
**Query patterns:**
- `GET /api/wiki/pages?type=decision&project=EMA`
- `GET /api/wiki/pages?type=decision&status=active&tags[]=architecture`
**Storage:** `Decisions/{YYYY-MM-DD}-{slug}.md`

---

#### TYPE: `codebase`
**Purpose:** Documentation for a software codebase — stack, status, architecture, entry points.
```yaml
title: "Codebase: {name}"
type: codebase
status: active|deprecated|archived
created: YYYY-MM-DD
updated: YYYY-MM-DD
project: EMA
stack: ["Elixir", "Phoenix", "React 19", "Tauri 2"]
repo: https://github.com/...
path: /home/trajan/projects/ema
```
**Sections:** Overview, Stack, Architecture, Entry Points, Key Files, Known Issues, Changelog
**Query patterns:**
- `GET /api/wiki/pages?type=codebase&project=EMA`
- `GET /api/wiki/pages?type=codebase&status=active`
**Storage:** `Codebases/{name}.md`

---

#### TYPE: `config`
**Purpose:** Configuration documentation — agent configs, system settings, env vars.
```yaml
title: "Config: {name}"
type: config
status: active|deprecated
created: YYYY-MM-DD
updated: YYYY-MM-DD
agent: researcher  # optional
system: openclaw|ema|vault  # optional
```
**Sections:** Overview, Parameters, Example Values, Change History
**Query patterns:**
- `GET /api/wiki/pages?type=config&agent=researcher`
**Storage:** `System/Configs/{name}.md` or `Agents/{agent}/config.md`

---

#### TYPE: `agent-profile`
**Purpose:** Full agent definition — identity, soul, capabilities, performance baseline.
```yaml
title: "Agent: {name}"
type: agent-profile
status: active|deprecated
created: YYYY-MM-DD
updated: YYYY-MM-DD
agent: researcher
model: claude-sonnet-4-6
channel: discord
```
**Sections:** Identity, Role, Capabilities, Soul/Persona, Performance Baseline, Evolution History, Known Limitations
**Query patterns:**
- `GET /api/wiki/pages?type=agent-profile`
- `GET /api/wiki/pages?type=agent-profile&agent=researcher`
**Storage:** `Agents/{name}.md`

---

#### TYPE: `agent-learning`
**Purpose:** A specific learning captured from agent behavior — bug fixes, pattern discoveries, corrections.
```yaml
title: "Learning: {slug}"
type: agent-learning
created: YYYY-MM-DD
agent: researcher
source: failure|correction|observation|experiment
recurrence: 1  # how many times this pattern appeared
tags: [dispatch, auth, vault]
```
**Sections:** Learning, Context, Pattern, Fix Applied, Prevention
**Query patterns:**
- `GET /api/wiki/pages?type=agent-learning&agent=researcher`
- `GET /api/wiki/pages?type=agent-learning&tags[]=auth&created_after=2026-01-01`
**Storage:** `Agents/{agent}/learnings/{slug}.md` or `Agent-Learnings/{slug}.md`

---

#### TYPE: `session-summary`
**Purpose:** Output of a completed agent session — what happened, what worked, what failed.
```yaml
title: "Session: {YYYY-MM-DD} — {topic}"
type: session-summary
created: YYYY-MM-DD
session_id: uuid
agent: researcher
channel: discord
topic: "superman runtime architecture"
outcome: success|partial|failed
duration_min: 15
```
**Sections:** Goal, Approach, What Worked, What Failed, Root Cause, Fix Applied, Lessons Learned, Files Created/Modified
**Query patterns:**
- `GET /api/wiki/pages?type=session-summary&agent=researcher&outcome=failed`
- `GET /api/wiki/pages?type=session-summary&created_after=2026-04-01`
**Storage:** `Session Summaries/{YYYY-MM-DD}-{agent}-{topic}.md`

---

#### TYPE: `daily-note`
**Purpose:** Daily log — events, decisions, tasks completed, sessions run.
```yaml
title: "Daily Note — YYYY-MM-DD"
type: daily-note
created: YYYY-MM-DD
date: YYYY-MM-DD
tags: [daily]
```
**Sections:** Heartbeat/Status, Work Done, Decisions Made, Sessions Run, Agent Activity, Open Items, Notes
**Query patterns:**
- `GET /api/wiki/pages?type=daily-note&date=2026-04-03`
- `GET /api/wiki/pages?type=daily-note&created_after=2026-03-01&tags[]=ema`
**Storage:** `Daily Notes/{YYYY-MM-DD}.md`

---

#### TYPE: `playbook`
**Purpose:** Repeatable procedure — SOP, runbook, how-to.
```yaml
title: "Playbook: {procedure name}"
type: playbook
status: active|draft|deprecated
created: YYYY-MM-DD
updated: YYYY-MM-DD
domain: ops|agents|security|deployment
```
**Sections:** Overview, When to Use, Prerequisites, Steps, Troubleshooting, Related Playbooks
**Query patterns:**
- `GET /api/wiki/pages?type=playbook&domain=ops`
**Storage:** `Operations/{name}.md`

---

#### TYPE: `integration`
**Purpose:** Documents a system integration — OAuth flows, API connections, webhook configs.
```yaml
title: "Integration: {name}"
type: integration
status: connected|disconnected|pending|deprecated
created: YYYY-MM-DD
updated: YYYY-MM-DD
system: github|google-drive|discord|slack
project: EMA
```
**Sections:** Overview, Auth Method, Config, Events/Webhooks, Error Patterns, Changelog
**Query patterns:**
- `GET /api/wiki/pages?type=integration&status=connected`
- `GET /api/wiki/pages?type=integration&project=EMA`
**Storage:** `System/Integrations/{name}.md`

---

#### TYPE: `synthesis`
**Purpose:** Cross-topic synthesis — patterns emerging across multiple research/project threads.
```yaml
title: "Synthesis: {topic}"
type: synthesis
created: YYYY-MM-DD
author: researcher|Trajan
confidence: 0.00–1.00
tags: [agent-architecture, memory]
```
**Sections:** Thesis, Supporting Evidence, Contested Points, Implications, Open Questions
**Query patterns:**
- `GET /api/wiki/pages?type=synthesis`
**Storage:** `Research/Synthesis/{slug}.md`

---

#### TYPE: `knowledge`
**Purpose:** General reference knowledge — facts, concepts, external documentation summaries.
```yaml
title: "{Topic}"
type: knowledge
created: YYYY-MM-DD
source: manual|web|paper
confidence: 0.00–1.00
tags: [elixir, libgraph, knowledge-graph]
```
**Sections:** Summary, Details, Key Facts, Links/Sources
**Query patterns:**
- `GET /api/wiki/pages?type=knowledge&tags[]=elixir`
**Storage:** `Reference/{name}.md`

---

#### TYPE: `sprint`
**Purpose:** A time-boxed development sprint — goals, tasks, outcomes.
```yaml
title: "Sprint {N} — {YYYY-MM-DD}"
type: sprint
status: active|complete|planned
project: EMA
sprint_number: 7
start: YYYY-MM-DD
end: YYYY-MM-DD
```
**Sections:** Goals, Tasks, Progress, Blockers, Retro Notes
**Query patterns:**
- `GET /api/wiki/pages?type=sprint&project=EMA&status=active`
**Storage:** `Projects/{project}/sprints/sprint-{N}.md`

---

### 2.2 Type → Folder Hierarchy

```
wiki/
├── Projects/                    # type: project, sprint, task, intent-bundle, intent
│   ├── EMA/
│   │   ├── index.md            # type: project
│   │   ├── sprints/
│   │   ├── tasks/
│   │   └── .superman/
│   │       ├── context.md      # type: intent-bundle
│   │       └── intents/        # type: intent
│   ├── Superman/
│   └── HQ/
├── Research/                    # type: research, synthesis
│   ├── AI-Agents/
│   ├── Superman/
│   └── Synthesis/
├── Agents/                      # type: agent-profile, agent-learning, session-summary
│   ├── researcher/
│   │   ├── index.md            # type: agent-profile
│   │   └── learnings/          # type: agent-learning
│   └── coder/
├── Daily Notes/                 # type: daily-note
├── Decisions/                   # type: decision
├── System/                      # type: config, integration, synthesis, knowledge
│   ├── Architecture/
│   ├── Configs/
│   └── Integrations/
├── Operations/                  # type: playbook, operations
├── Codebases/                   # type: codebase
├── Reference/                   # type: knowledge, reference
├── Sessions/                    # type: session-summary (renamed from Session Summaries)
├── Skills/                      # type: skill (existing)
├── Templates/                   # meta
└── Archive/                     # deprecated content
```

---

## Part 3: Vault → Wiki Mapping

### 3.1 Full Folder Mapping

| Vault Folder | Wiki Location | Type(s) | Notes |
|---|---|---|---|
| `Projects/*.md` | `Projects/{name}/index.md` | `project` | Direct 1:1 |
| `Projects/EMA/` | `Projects/EMA/` | `project`, `sprint` | Subdirectory preserved |
| `Projects/Business/` | `Projects/` | `project` | Flatten into Projects |
| `Research/*.md` | `Research/{name}.md` | `research` | Direct 1:1 |
| `Research/AI-Agents/` | `Research/AI-Agents/` | `research` | Subdirectory preserved |
| `Research/AI-Knowledge/` | `Research/AI-Knowledge/` | `research` | Subdirectory preserved |
| `Research/ArXiv/` | `Research/ArXiv/` | `research` | Keep as-is |
| `System/*.md` | `System/{name}.md` | `system`, `config`, `integration` | Re-type on import |
| `Architecture/*.md` | `System/Architecture/{name}.md` | `architecture` | Merge into System |
| `Operations/*.md` | `Operations/{name}.md` | `playbook`, `operations` | Direct |
| `Ops/*.md` | `Operations/{name}.md` | `playbook` | Merge into Operations |
| `Daily Notes/YYYY-MM-DD.md` | `Daily Notes/YYYY-MM-DD.md` | `daily-note` | Direct 1:1 |
| `Daily Notes/briefing-*.md` | `Daily Notes/briefings/briefing-*.md` | `daily-note` | Subfolder for briefings |
| `Session Summaries/UUID.md` | `Sessions/{YYYY-MM-DD}-{agent}-{topic}.md` | `session-summary` | **Rename required**: parse UUID file to extract date+agent+topic |
| `Agents/Agent Roster.md` | `Agents/index.md` | `agent-profile` (hub) | Hub page |
| `Agents/Evolution/*.md` | `Agents/{agent}/evolution.md` | `evolution-log` | Merge per-agent |
| `Agents/Performance/*.md` | `Agents/{agent}/performance.md` | `performance-log` | Merge per-agent |
| `Agent-Learnings/*.md` | `Agents/{agent}/learnings/{slug}.md` | `agent-learning` | Route by agent from content |
| `Agent Knowledge/researcher/` | `Agents/researcher/learnings/` | `agent-learning` | Direct |
| `Decisions/*.md` | `Decisions/{slug}.md` | `decision` | Direct |
| `Codebases/*.md` | `Codebases/{name}.md` | `codebase` | Direct |
| `Security/*.md` | `Operations/Security/{name}.md` | `security`, `playbook` | Subfolder |
| `Reference/*.md` | `Reference/{name}.md` | `knowledge`, `reference` | Direct |
| `Resources/*.md` | `Reference/Resources/{name}.md` | `reference` | Merge into Reference |
| `Skills/*.md` | `Skills/{name}.md` | `skill` | Direct |
| `Trajan/*.md` | `System/User/{name}.md` or `Reference/User/` | `personal` | Direct |
| `_hubs/*.md` | Top-level hub pages or `System/Hubs/` | `moc` | Preserve as navigation anchors |
| `Courses/` | `Reference/Courses/{project}/` | `course` | Course server content |
| `LCM Summaries/` | **NOT IMPORTED** | — | Raw auto-gen, too noisy |
| `Claude-Code-Sessions/` | `Sessions/claude-code/` | `session-summary` | Selective import |
| `Claude-Code-Memory/` | **NOT IMPORTED** | — | Ephemeral, discard |
| `Inbox/` | Inbox queue, not wiki pages | — | Route via BrainDump |
| `Templates/` | `Templates/` | `template` | Direct |
| `_deprecated/` | `Archive/` | — | Move to Archive |
| `.archive/` | `Archive/` | — | Move to Archive |
| `ontology/` | `System/Ontology/` | `system` | Populate with type definitions |

### 3.2 Naming Convention for Renamed Pages

**Session Summaries (UUID → Human-readable):**
```
UUID.md → {YYYY-MM-DD}-{agent}-{topic-slug}.md
Example: 01eddf6f-bc5b-4fa9-...md → 2026-03-20-main-vault-functional-role.md
Strategy: Parse UUID file, extract date from content, derive agent from source field or content, slug from topic.
```

**Agent-Learning files (kebab-case, preserved as-is):**
```
openclaw-env-stale-apikey-auth-conflict.md → stays kebab-case
Frontmatter updated to add: type: agent-learning, agent: coder
```

**Projects with complex folders:**
```
Projects/EMA/ becomes Projects/EMA/index.md + subfolders
Projects/EMA Master Knowledge Base.md → Projects/EMA/knowledge-base.md
Projects/EMA Sprint Status.md → Projects/EMA/sprints/current.md
```

### 3.3 Frontmatter Additions on Import

Every imported page gets these added if missing:
```yaml
imported_from: vault/{original_path}
imported_at: YYYY-MM-DDTHH:MM:SSZ
wiki_id: wiki_{uuid}  # stable internal ID
```

---

## Part 4: Superman Intent Layer

### 4.1 Recommended Structure: Hybrid Model

**Decision: One intent-bundle per project + individual intent pages**

Rationale:
- One page per intent → fine-grained queries, individual tracking, proper lifecycle (open→done)
- One bundle page → context overview, what `Superman.context_for(project)` returns as a summary
- Bundle page is auto-generated/maintained from the individual intents

```
Projects/EMA/.superman/
├── context.md              # type: intent-bundle — auto-generated overview
└── intents/
    ├── ema-frontend-must-use-tauri.md     # type: intent, intent_type: CONSTRAINT
    ├── ema-honcho-week7.md               # type: intent, intent_type: INTENT
    ├── ema-openai-not-allowed.md         # type: intent, intent_type: CONSTRAINT
    └── ema-trajan-is-the-user.md         # type: intent, intent_type: CONTEXT
```

### 4.2 Superman Intent Page Format

**Individual intent page (type: intent):**
```markdown
---
title: "Intent: EMA must use Tauri 2 for desktop shell"
type: intent
intent_type: CONSTRAINT
status: open
project: EMA
priority: 1
created: 2026-04-03
author: Trajan
tags: [ema, frontend, tauri, constraint]
---

# CONSTRAINT: EMA must use Tauri 2 for desktop shell

## Statement
EMA's frontend must be wrapped in Tauri 2. No Electron alternatives.

## Context
Decision made 2026-03-15. Stack already committed. React 19 + Tauri 2 is the locked choice.

## Constraints
- No migration to Electron
- Tauri 2 API only (no Tauri 1 patterns)

## Related
- [[Projects/EMA/index]]
- [[Codebases/EMA]]
- [[Decisions/2026-03-15-tauri-over-electron]]
```

**Intent bundle page (type: intent-bundle) — auto-generated:**
```markdown
---
title: "Superman Context — EMA"
type: intent-bundle
project: EMA
last_ingested: 2026-04-03T22:00:00Z
intent_count: 12
open_intents: 5
complete_intents: 7
auto_generated: true
---

# Superman Context — EMA

*Auto-generated from .superman/intents/. Edit individual intent pages.*

## Active Intents
- [ ] [[intents/ema-honcho-week7]] — INTENT (priority 1) — open
- [ ] [[intents/ema-dispatch-board]] — INTENT (priority 1) — open
...

## Constraints (always active)
- [[intents/ema-frontend-must-use-tauri]] — Tauri 2, no alternatives
...

## Context (always inject)
- [[intents/ema-trajan-is-the-user]] — Trajan is the sole user of EMA
...

## Last Updated
2026-04-03T22:00:00Z — 5 open intents
```

### 4.3 API Query Design

```
# Get all intents for a project
GET /api/wiki/projects/EMA/intents
→ Returns: intent-bundle page + list of intent pages

# Get open intents only
GET /api/wiki/pages?type=intent&project=EMA&status=open

# Get constraints for a project (for agent spawn injection)
GET /api/wiki/pages?type=intent&project=EMA&intent_type=CONSTRAINT&status=open

# Superman context assembly (for agent spawn)
Superman.context_for("EMA")
→ Queries /api/wiki/pages?type=intent&project=EMA&status=open
→ Groups by intent_type (INTENT, CONTEXT, CONSTRAINT, RELATIONSHIP, PRIORITY, NOTE)
→ Returns compact markdown block injected into agent prompt
```

### 4.4 Superman Context Block Format (Agent Spawn)

```
=== SUPERMAN CONTEXT: EMA ===
INTENT: Build dispatch board (Ema.Campaigns.Flow + React step UI) [priority:1]
INTENT: Wire /api/projects/:id/context endpoint [priority:1]
CONSTRAINT: Frontend = Tauri 2 + React 19. No Electron.
CONSTRAINT: Elixir/Phoenix backend only. No Node.js backend.
CONTEXT: Trajan is sole user. No multi-user features needed yet.
CONTEXT: EMA Phase 1 complete. Execution loop running.
RELATIONSHIP: EMA → OpenClaw (dispatch via REST bridge, not direct agent call)
PRIORITY: Week 7 Track A = Dispatch Board. Track B = Honcho. These are parallel.
NOTE: /api/projects/:id/context is blocker for HQ. Do this first.
=== END SUPERMAN CONTEXT ===
```

### 4.5 .superman File → Wiki Migration

Existing `.superman` files in vault/filesystem:
```
# Migration pipeline:
1. Find all *.superman files: find /home/trajan -name "*.superman"
2. Parse each file with Superman.IntentParser (6-keyword format)
3. Create one wiki intent page per parsed block
4. Create/update intent-bundle page for the project
5. Original .superman file preserved as source-of-truth for backward compat
6. Wiki pages become queryable layer on top
```

---

## Part 5: Memory Layer Schema

### 5.1 Daily Notes

**Format:**
```markdown
---
title: "Daily Note — 2026-04-03"
type: daily-note
date: 2026-04-03
created: 2026-04-03
auto_generated: false
tags: [daily]
---

# 2026-04-03

## Heartbeat (auto-injected by cron)
- Auth: ...
- Gateway: ...
- Disk: ...

## Work Done
- [[Projects/EMA]] — fixed Tauri auto-start issue
- [[Research/Superman-Runtime]] — architecture research completed

## Sessions
- [[Sessions/2026-04-03-researcher-superman-runtime]]
- [[Sessions/2026-04-03-coder-dispatch-board]]

## Decisions Made
- [[Decisions/2026-04-03-honcho-docker-first]]

## Agent Activity
| Agent | Task | Outcome |
|---|---|---|
| researcher | Superman runtime architecture | success |
| coder | Dispatch board impl | partial |

## Learnings Captured
- [[Agents/coder/learnings/dispatch-routing-pattern]]

## Open Items
- [ ] Restart oauth-guardian on VPS
```

**Auto-generation rule:** Create from heartbeat cron output + session summaries written that day. Human edits allowed within the day. Static after midnight.

### 5.2 Session Summaries

**Current state:** 108+ UUID-named files, barely queryable.

**Target format:**
```markdown
---
title: "Session: 2026-04-03 — researcher — Superman Runtime Architecture"
type: session-summary
session_id: 01eddf6f-bc5b-4fa9-...
date: 2026-04-03
created: 2026-04-03T22:30:00Z
agent: researcher
channel: discord
topic: "Superman runtime architecture"
outcome: success
confidence: 0.90
duration_min: 25
files_created:
  - vault/Research/Superman-Runtime-Architecture.md
files_modified: []
project: EMA
tags: [superman, runtime, research]
---

# Session: Superman Runtime Architecture

## Goal
Design the .superman file runtime pipeline for EMA.

## Approach
Analyzed EMA codebase patterns, VaultWatcher, and Honcho/libgraph research.

## What Worked
- Architectural inference from existing code patterns
- Four-stage pipeline design (trigger → parse → store → inject)

## What Failed
- No external validation sources found (architecture novel, not documented)

## Root Cause / Lesson
Architectural design from first principles is valid when codebase context is available.

## Output
[[Research/Superman-Runtime-Architecture.md]] — full pipeline spec with Elixir code examples.

## Confidence
0.75 (medium-high) — derived from system design, no external validation.
```

**Rename pipeline:**
```bash
# For each Session Summaries/UUID.md:
# 1. Extract date from session content or file created date
# 2. Extract agent from source: field
# 3. Extract topic from ## Topic section
# 4. Rename to: {date}-{agent}-{topic-slug}.md
```

### 5.3 Agent Learnings

**Linked to:** `type: agent-profile` (parent page)

```markdown
---
title: "Learning: OpenClaw env stale API key auth conflict"
type: agent-learning
created: 2026-03-18
agent: coder
source: failure
recurrence: 1
tags: [openclaw, auth, api-key, env]
impact: high  # blocked production dispatch
resolved: true
---

# Learning: Stale API Key Auth Conflict

## Pattern
When OPENCLAW_API_KEY env var is stale/rotated, auth fails silently.
The error message doesn't indicate key staleness.

## Context
Occurred during: coder dispatch session 2026-03-18

## Fix Applied
Refresh API key from .env, restart openclaw gateway.

## Prevention
- Before each dispatch session, check `openclaw gateway status` includes auth valid
- Add auth validity check to heartbeat cron

## Links
- [[Operations/OpenClaw Config]]
- [[Agents/coder/performance]]
```

**Agent profile page evolution section:**
```markdown
# researcher Evolution Log

## Performance Baseline (as of 2026-03-18)
- Avg task duration: 8–25 min
- Typical outcome: partial → success (needs iteration)
- Known timeout risk: > 15-source research tasks

## Learnings (chronological)
| Date | Learning | Impact | Recurrence |
|---|---|---|---|
| 2026-03-19 | Rate limit on external APIs | medium | 3 |
| 2026-03-26 | Failed dispatch → auto-retry pattern | high | 1 |

## Capability Trend
- 2026-03-16: Could execute basic web research
- 2026-03-19: Added vault integration + qmd search
- 2026-04-03: Can execute multi-phase research with source tiering
```

### 5.4 Evolution Feedback

**Page impact scoring:**
```yaml
# Added to any page frontmatter when agent reports using it
agent_impact:
  - agent: researcher
    session: 2026-04-03-researcher-superman-runtime
    outcome: helped_succeed
    date: 2026-04-03
  - agent: coder
    session: 2026-04-02-coder-dispatch-board
    outcome: wasted_time  # contradictory info
    date: 2026-04-02
impact_score: 0.75  # computed: (helped - wasted) / total
```

**Query for useful pages:**
```
GET /api/wiki/pages?impact_score_gte=0.7&type=research
→ Returns pages agents found most useful
GET /api/wiki/pages?impact_score_lte=0.2
→ Returns pages that wasted agent time (review/delete candidates)
```

---

## Part 6: Structural Decisions

### 6.1 Hierarchy Decision

**Recommendation: Hybrid (spaces for org/client boundary, type+tag for everything else)**

| Option | Pro | Con | Verdict |
|---|---|---|---|
| Mirror vault exactly | Easy migration | Too granular, duplicates folder fragmentation | ❌ |
| Flat (all in one space) | Simple, search-driven | No org/client isolation, no access control | ❌ |
| **Hybrid (spaces + type)** | **Clean boundaries, discovery via type/tag** | **Some migration complexity** | **✅** |

**Space design:**
```
Space: default (Trajan's personal workspace — everything not client-specific)
Space: ema (EMA product — if team grows)
Space: client-X (future: client work isolation)
```

**Within default space:** All pages are flat, discovered via `type + tags + search`. No enforced sub-hierarchies beyond folder suggestions.

**Folder suggestions (not hard requirements):**
Folders exist for human browsing but don't restrict page relationships. A `type:research` page in `/Projects/EMA/` is still findable via `GET /api/wiki/pages?type=research&project=EMA`.

### 6.2 Ownership Matrix

| Page Type | Primary Author | Secondary | Auto-Update? |
|---|---|---|---|
| `project` | Trajan | agents (append task status) | No |
| `research` | researcher agent | Trajan | No |
| `intent` | Trajan | agents (update status on completion) | Suggested only |
| `intent-bundle` | System (auto-generated) | — | Yes |
| `task` | Trajan + agents | — | Status only |
| `decision` | Trajan | — | No |
| `codebase` | coder agent | Trajan | On major changes |
| `config` | System | Trajan | No |
| `agent-profile` | System (bootstrap) | agents (self-update learnings) | Learnings section: Yes |
| `agent-learning` | agents (self-write) | Trajan | Recurrence count: Yes |
| `session-summary` | agents (auto-write) | — | No (append-only) |
| `daily-note` | System (auto-gen) | Trajan | Within that day only |
| `playbook` | Trajan | ops agent | No |
| `integration` | System | Trajan | Status field: Yes |
| `synthesis` | researcher agent | Trajan | No |
| `sprint` | Trajan | — | Status only |

### 6.3 Freshness Policy

| Category | Update Policy | Staleness Threshold |
|---|---|---|
| Intent pages | Manually updated; agents suggest updates | 30 days without touch = suggest review |
| Agent learnings | Auto-update recurrence count; new entries appended | Never stale (audit trail) |
| Session summaries | Immutable after write | N/A — historical record |
| Daily notes | Editable within day; static after midnight | N/A — historical record |
| Project pages | Manual; agents append execution results | 14 days = suggest update |
| Research pages | Static; researcher can supersede with new page | 60 days = flag for review |
| Codebase pages | Update on major changes; coder agent updates | 30 days = flag for review |
| Config pages | Update on change | N/A — must be current or flagged broken |

### 6.4 Linking Strategy

| Link Type | Mechanism | Use Case |
|---|---|---|
| Forward wikilinks | `[[Page Name]]` in content | Human-readable cross-refs; preserved in storage |
| Backlinks | Auto-generated by wiki engine | Show "linked from" on page view |
| Tag clusters | `tags: [agent-testing]` in frontmatter | Loose coupling without explicit links |
| Project membership | `project: EMA` in frontmatter | Type-based project queries |
| Agent membership | `agent: researcher` in frontmatter | Agent-specific page queries |
| API queries | `GET /api/wiki/pages?type=X&project=Y` | Smart relationship discovery |
| Semantic links | `qmd search` / embedding similarity | "Related pages" widget |

---

## Part 7: Markdown Format Guide

### 7.1 Agent-Readable Page Structure

Every wiki page should be parseable by an agent reading top-to-bottom. Key principles:

1. **Frontmatter first** — All structured data in YAML frontmatter. Agents parse this before reading content.
2. **Summary mandatory** — The `summary` field (≤150 chars) is what agents get when they list pages without fetching full content.
3. **Sections are predictable** — Use H2 sections that match the page type spec. Agents regex-search H2s.
4. **Dense wikilinks** — Link every proper noun (project name, agent name, tool name) on first mention per page.
5. **Status is in frontmatter** — Not buried in prose. `status: active|draft|archived|deprecated`.
6. **Dates are ISO 8601** — `2026-04-03` or `2026-04-03T22:00:00Z`. Not "April 3rd" or "last week."

### 7.2 Template: Research Page

```markdown
---
title: "Topic: Research Report"
created: 2026-04-03
updated: 2026-04-03
type: research
status: active
confidence: 0.85
source: agent:researcher
tags: [topic, subtopic]
summary: "Core finding in ≤150 chars. Lead with the answer, not the question."
project: EMA  # if applicable
---

# Topic: Research Report

*Sources: N total (T1 count primary, T2 count institutional, T3 count secondary)*
*Confidence: High/Medium/Low (0.XX) | Date: YYYY-MM-DD*

## Summary

[3-5 sentences. Core finding. Opinionated. Dense. Don't repeat the title.]

## Findings

### [Theme 1]
[Finding + source inline. "According to [source, T1], X because Y."]

### [Theme 2]
...

## Key Takeaways

- Actionable bullet 1
- Actionable bullet 2

## Contested / Uncertain

[Where sources disagree. Be specific.]

## Open Questions

[What couldn't be answered. What would resolve it.]

## Sources

1. [T1] [Title](url) — relevance note
2. [T2] [Title](url) — relevance note
...

## Related

- [[Related Research Page]]
- [[Projects/EMA]]
```

### 7.3 Template: Agent Learning

```markdown
---
title: "Learning: {short description}"
type: agent-learning
created: YYYY-MM-DD
agent: {agent-name}
source: failure|correction|observation|experiment
recurrence: 1
tags: [tag1, tag2]
impact: high|medium|low
resolved: true|false
---

# Learning: {Short Description}

## Pattern
[One paragraph: what pattern/bug/behavior was observed]

## Context
[When/where it occurred. Session link if available.]

## Fix Applied
[What was done to resolve it. Be specific.]

## Prevention
[How to avoid this in future. Concrete steps.]

## Related
- [[relevant page]]
```

### 7.4 Search Optimization Rules

For every page:
1. Put the **key noun** in the `title` field (agents search titles first)
2. Put the **core answer** in `summary` (used in list views and context injection)
3. Put **domain keywords** in `tags` (tag-based filtering)
4. Use **consistent terminology** — if a concept is called "dispatch board" everywhere, don't call it "task dispatcher" in one page
5. H2 sections should use **imperative or descriptive** headings, not questions ("What Is X" → "X Definition")
6. **Wikilink on first mention** in content — this builds the backlink graph automatically

---

## Part 8: Query Patterns

### 8.1 Standard API Queries

```bash
# Find all open intents for a project
GET /api/wiki/pages?type=intent&project=EMA&status=open

# Find research on a topic (semantic)
GET /api/wiki/search?q=superman+runtime+architecture&type=research

# Find research on a topic (tag-based)
GET /api/wiki/pages?type=research&tags[]=superman

# Agent learnings for a specific agent since a date
GET /api/wiki/pages?type=agent-learning&agent=researcher&created_after=2026-01-01

# All sessions where researcher failed
GET /api/wiki/pages?type=session-summary&agent=researcher&outcome=failed

# All active projects
GET /api/wiki/pages?type=project&status=active

# All decisions in the last 30 days
GET /api/wiki/pages?type=decision&created_after=2026-03-03

# All codebase pages for EMA
GET /api/wiki/pages?type=codebase&project=EMA

# Pages tagged with a topic
GET /api/wiki/pages?tags[]=dispatch-board

# Recent agent activity (all sessions in last 7 days)
GET /api/wiki/pages?type=session-summary&created_after=2026-03-27&sort=created_desc

# Find useful research (high impact score)
GET /api/wiki/pages?type=research&impact_score_gte=0.7&sort=impact_score_desc

# Stale project pages (not updated in 14 days)
GET /api/wiki/pages?type=project&status=active&updated_before=2026-03-20

# Orphaned pages (no backlinks, not updated in 60 days)
GET /api/wiki/pages?backlink_count=0&updated_before=2026-02-01
```

### 8.2 Superman Agent Spawn Pattern

```elixir
# In Superman.context_for/2:
def context_for(project_id, opts \\ []) do
  # 1. Get intent-bundle page
  bundle = Wiki.get_pages(type: :intent_bundle, project: project_id)
  
  # 2. Get individual intents (open only)
  intents = Wiki.get_pages(
    type: :intent,
    project: project_id,
    status: :open,
    sort: [{:priority, :asc}]
  )
  
  # 3. Group by intent_type
  grouped = Enum.group_by(intents, & &1.intent_type)
  
  # 4. Assemble context block
  format_context_block(project_id, grouped, opts)
end
```

### 8.3 Graph Traversal Queries

```bash
# All pages linked to EMA project
GET /api/wiki/graph/backlinks?page=Projects/EMA/index

# All pages in EMA cluster (2 hops)
GET /api/wiki/graph/cluster?page=Projects/EMA/index&depth=2

# Tag cluster: all pages tagged "agent-testing"
GET /api/wiki/graph/tag-cluster?tag=agent-testing

# Related pages (semantic similarity)
GET /api/wiki/pages/Research/Superman-Runtime-Architecture/related?limit=10

# Cross-project relationships
GET /api/wiki/graph/cross-project?project1=EMA&project2=Superman
```

### 8.4 Agent Context Assembly Patterns

```
# Researcher getting context before research task
1. GET /api/wiki/search?q={task_topic}&limit=5   → check existing research
2. GET /api/wiki/pages?type=project&project={project}&status=active  → project context
3. Superman.context_for(project)  → constraints + intents

# Coder getting context before implementation
1. GET /api/wiki/pages?type=codebase&project={project}  → stack context
2. GET /api/wiki/pages?type=decision&project={project}&status=active  → decisions
3. Superman.context_for(project)  → constraints
4. GET /api/wiki/pages?type=task&project={project}&status=open  → open tasks

# Agent writing output after completion
1. POST /api/wiki/pages  → create session-summary
2. PATCH /api/wiki/pages/{task_id}  → update task status
3. POST /api/wiki/pages/{agent}/learnings  → write learning if applicable
4. PATCH /api/wiki/pages/{daily_note_id}  → append to today's daily note
```

---

## Implementation Notes for Coder

### Migration Priority Order

1. **Phase 1 (now):** Set up wiki storage + basic CRUD API + frontmatter parsing
2. **Phase 2:** Import high-value content: Projects, Research, System, Agents, Decisions
3. **Phase 3:** Import memory layer: Session Summaries (renamed), Daily Notes, Agent-Learnings
4. **Phase 4:** Superman intent layer: Create intent pages from .superman files
5. **Phase 5:** Graph layer: Backlinks, tag clusters, wikilink parsing
6. **Phase 6:** Skip LCM Summaries and Claude-Code-Memory (noise)

### What NOT to Import

- `LCM Summaries/` — 1,253 auto-generated, low signal-to-noise
- `Claude-Code-Memory/` — ephemeral working memory
- `_deprecated/` and `.archive/` — archive to separate namespace

### Schema Enforcement

All pages should be validated against their type spec on write. Missing required fields → 400 error with field list. Optional fields can be absent. Type-specific section headers should be suggested but not enforced (agents sometimes write differently).

### Wikilink Parsing

```
Format: [[Page Name]] or [[Folder/Page Name]] or [[Page Name|Display Text]]
On write: resolve wikilinks to wiki_id, store both wikilink text and resolved ID
On read: wikilinks render as clickable links to resolved page
On page rename: update all wikilinks pointing to old name
Unresolved wikilinks: render as red links (page doesn't exist yet)
```

---

## Summary of Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Space model | Hybrid (space=org, type+tag=discovery) | Clean isolation without folder tyranny |
| Intent model | Per-intent pages + per-project bundle | Queryable + context-injectable |
| Superman format | YAML frontmatter + structured markdown | Both human-readable and machine-parseable |
| Session summaries | Rename UUID → date-agent-topic | Queryable without opening file |
| Memory tier | Don't import LCM Summaries | Signal-to-noise too low |
| Linking | wikilinks + backlinks + tags + API queries | Multi-modal discovery |
| Freshness | Most pages static; learnings/intents auto-update | Audit trail preserved |
| Type taxonomy | 16 canonical types, collapse long tail | Consistent querying |
| Daily notes | Auto-gen from cron + sessions | Reduces agent overhead |
| Page format | Frontmatter-first, summary mandatory | Agents parse summary without fetching full content |

---

*Status: **DONE***
*Files created: `vault/Research/Wiki-Structure-Schema-Design-2026-04-03.md`*
*Sources: Vault analysis (direct inspection), EMA synthesis docs, Superman runtime research, existing type taxonomy scan*
*Confidence: 0.90 — high confidence on schema design; migration pipeline details should be validated against actual wiki storage engine choice*
