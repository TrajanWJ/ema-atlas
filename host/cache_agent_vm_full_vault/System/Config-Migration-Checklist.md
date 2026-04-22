---
title: Config Migration Checklist
type: reference
status: active
created: 2026-04-03
author: Right Hand
---

# Config Migration Checklist: Discord → EMA

## AUDIT: Where Does Config Live Today?

### 1. Agent Roster

**Current:**
- [ ] File: `vault/AGENTS.md` (static markdown)
  - Lines: Agent descriptions, triggers, capabilities
  - Format: Table + prose
  - Version control: Git
  - Sync: Manual (read once per AGENTS.md session startup)

**Should become:**
- EMA agents table (queryable, hot-reloadable)
- CLI: `ema agents list`
- UI: Agent Gallery view

---

### 2. Intent Classification Rules

**Current:**
- [ ] File: `vault/AGENTS.md` sections like "Routing Rules"
  - What: "if message contains 'build', route to Coder"
  - Format: Prose + examples
  - Update: Manually edit markdown
  - Testing: Run a task and see if it works

**Should become:**
- EMA routing_rules table
- CLI: `ema intents list`, `ema intents add`, `ema intents test`
- UI: System Panel (test rules, see matches)

---

### 3. SOUL.md (Right Hand Personality)

**Current:**
- [ ] File: `~/.openclaw/agents/main/workspace/SOUL.md`
- [ ] Format: Markdown (personality, voice, rules)
- [ ] Version control: Git
- [ ] Sync: Read at OpenClaw startup only
- [ ] Update: Edit file, restart OpenClaw to take effect

**Should become:**
- EMA prompts table, entry: `prompt_id = "system:soul"`
- CLI: `ema prompts view system:soul`, `ema prompts edit system:soul`
- Hot-reload: Every 30s daemon checks if it changed
- A/B test: Can run system:soul v1 vs. v2 against each other

---

### 4. Agent-Specific Prompts

**Current Locations:**

**a) Researcher CLAUDE.md**
- [ ] File: `~/.openclaw/agents/main/workspace/` (somewhere?)
  - What: Researcher's system prompt
  - Format: YAML key-value
  - Update: Edit file, respawn agent
  - Sync: Unclear

**b) Coder CLAUDE.md**
- [ ] File: `~/.openclaw/agents/main/workspace/` (somewhere?)
  - Similar to Researcher

**c) Host Machine Global CLAUDE.md**
- [ ] File: `~/Users/trajan/.claude/CLAUDE.md`
  - What: Global Claude Code settings
  - Format: YAML
  - Update: Edit file
  - Sync: File mtime only

**d) Per-Project CLAUDE.md**
- [ ] Files: `~/Projects/*/CLAUDE.md`
  - One per project
  - No global versioning

**Should become:**
- EMA prompts table, entries:
  - `prompt_id = "agent:researcher:system"`
  - `prompt_id = "agent:coder:system"`
  - `prompt_id = "project:ema:context"` (per-project)
- CLI: `ema prompts list --kind agent`, `ema prompts view agent:researcher:system`
- Hot-reload: Daemon refreshes every 30s
- Versioning: Every edit creates a new version

---

### 5. Discord Channel Routing

**Current:**
- [ ] File: `vault/discord-output-format.md`
  - What: "post agent output to #agent-os-frontend"
  - Format: Prose + examples
  - Update: Edit markdown
  - Test: Run a task, manually check output

**Should become:**
- EMA routing_rules table: `action = "post_to:bridge"` or `action = "post_to:tasks"`
- UI: Knowledge Hub (System Panel tab) shows where outputs go
- CLI: `ema routes test --intent=research` → shows where result posts

---

### 6. Outcome Tracking

**Current:**
- [ ] File: `memory/outcome-tracker.json`
  - What: Manual log of task outcomes
  - Format: JSON, append-only
  - Update: Right Hand manually adds entries
  - Analysis: grep + jq

**Should become:**
- EMA outcomes table (automatic)
- CLI: `ema outcomes list --agent=researcher --status=success`
- Dashboard: Metrics dashboard shows success rate by agent/intent
- Analysis: SQL queries directly

---

### 7. Workflow Patterns

**Current:**
- [ ] File: `memory/workflow-patterns.json`
  - What: "when user asks X, pattern Y works"
  - Format: JSON
  - Update: Manual
  - Learning: Reviewed manually every 10 interactions

**Should become:**
- EMA workflow_patterns table
- Automatic: System learns patterns from outcomes
- CLI: `ema patterns suggest --count=5` (top 5 patterns to crystallize)
- Crystallization: Suggest new skills/scripts based on patterns

---

### 8. Preferences

**Current:**
- [ ] File: `vault/Trajan/Preferences.md`
  - What: "Trajan likes short replies", "always check the file"
  - Format: Markdown prose
  - Update: Manual
  - Application: Right Hand reads at session startup

**Should become:**
- EMA preferences table
- UI: Settings panel to edit (no file editing)
- Hot-reload: Immediately reflected in agent behavior
- Learning: System suggests new preferences based on your corrections

---

## MIGRATION PLAN

### Phase 0: Inventory (This Week)

**Action:** For each config item above, answer:
- [ ] 1. Where exactly is it? (file path, lines, or table name)
- [ ] 2. What format? (markdown, YAML, JSON, SQL)
- [ ] 3. Who edits it? (you, Right Hand, automatic)
- [ ] 4. How often? (once, weekly, continuously)
- [ ] 5. How is it version-controlled? (Git, file mtime, none)

**Deliverable:** Filled-in checklist above (comment after each file location)

---

### Phase 1: Schema (Week 7)

**Action:** Propose EMA schema additions:

```elixir
# agent_roster table
# intents table
# prompts table (with versions, A/B test groups, metrics)
# outcomes table (logs every task result)
# routing_rules table
# workflow_patterns table
# preferences table
```

**Decision:** Approve or adjust schema

**Deliverable:** Database migrations for EMA

---

### Phase 2: Import (Week 7)

**Action:** Write importers:

```bash
ema config import vault/AGENTS.md → agents + intents tables
ema config import vault/SOUL.md → prompts table (system:soul)
ema config import vault/discord-output-format.md → routing_rules
ema config import memory/outcome-tracker.json → outcomes table
ema config import vault/Trajan/Preferences.md → preferences table
```

**Test:** Run importer, verify data is there, spot-check accuracy

**Deliverable:** All config in EMA, verified against source

---

### Phase 3: Hot-Reload (Week 7-8)

**Action:** Enable hot-reload for key configs:

```elixir
# PromptsServer: watch prompts table, reload every 30s
# RouterServer: watch intents + routing_rules, recompile routes
# PreferencesServer: watch preferences, hot-update Right Hand
```

**Test:** Edit prompt in EMA CLI, next agent spawn uses new version

**Deliverable:** Hot-reload working for prompts + rules + preferences

---

### Phase 4: Retirement (Week 8-9)

**Action:** Safely retire old config files:

- [ ] Archive AGENTS.md section routing rules
- [ ] Move SOUL.md content to vault/System/SOUL-Archive.md (keep for history)
- [ ] Delete per-agent CLAUDE.md files from OpenClaw
- [ ] Stop reading memory/outcome-tracker.json (use EMA instead)

**Caution:** Keep Git history, don't delete old docs, just mark as archived

**Deliverable:** Config files marked deprecated in comments

---

## VALIDATION

After each phase, verify:

- [ ] **Phase 1:** All config is in EMA tables
- [ ] **Phase 2:** CLI commands work (`ema agents list`, `ema prompts view`, etc.)
- [ ] **Phase 3:** Hot-reload works (edit in EMA, next spawn sees change)
- [ ] **Phase 4:** Agents still work using EMA config (no reading old files)

---

## QUICK REFERENCE

**Where Config Lives (Today):**

| What | File | Format | Version Control |
|---|---|---|---|
| Agent roster | AGENTS.md | Markdown | Git |
| Right Hand soul | SOUL.md | Markdown | Git |
| Intents/routing | AGENTS.md | Markdown | Git |
| Outcome history | outcome-tracker.json | JSON | Git |
| Workflow patterns | workflow-patterns.json | JSON | Git |
| Preferences | vault/Preferences.md | Markdown | Git |
| Discord routing | discord-output-format.md | Markdown | Git |

**Where Config Should Live (After Bootstrap):**

| What | Table | Version Control | Hot-Reload |
|---|---|---|---|
| Agent roster | agents | EMA DB | Yes |
| Right Hand soul | prompts (system:soul) | EMA DB | Yes |
| Intents/routing | intents + routing_rules | EMA DB | Yes |
| Outcome history | outcomes | EMA DB | Continuous |
| Workflow patterns | workflow_patterns | EMA DB | Auto-learn |
| Preferences | preferences | EMA DB | Yes |
| Bridge routing | routing_rules | EMA DB | Yes |

---

## APPROVAL NEEDED

- [ ] Approve EMA schema
- [ ] Approve import strategy
- [ ] Approve hot-reload approach
- [ ] Approve retirement timeline

Once approved, ready to implement Phase 0 → 4 over Weeks 7-9.
