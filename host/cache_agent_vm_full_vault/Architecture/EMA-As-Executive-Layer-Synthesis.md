---
title: "EMA as Executive Layer — Implementation Synthesis"
created: 2026-04-01
updated: 2026-04-01
type: architecture
status: active
confidence: 0.85
tags: [ema, executive-ai, mcp, architecture, implementation-plan, openClaw]
summary: Concrete plan to evolve EMA/OpenClaw into a best-in-class Executive Management Assistant, drawing patterns from Motion, Tana, Fibery, Mem, and Height.
related: "[[EMA Claude Bridge Design]], [[Executive System]], [[ExecAI-Management-2026-03-31]], [[Architecture Synthesis 2026-03-25]]"
---

# EMA as Executive Layer — Implementation Synthesis

*Written: 2026-04-01 | Confidence: 0.85 | Author: Researcher (subagent)*

**Bottom line up front:** EMA already has the data — 15 tools, JSON state in ~/data/, Elixir/OTP backbone, Claude Code bridge. What's missing is a **query layer** and a **context injection layer**. MCP is the nervous system that connects them. That's the single most important thing to build first.

---

## 1. Gap Analysis

What best-in-class executive AI tools do that EMA doesn't yet. Each gap is concrete and closeable.

### Gap 1: No cross-entity query layer (Fibery Smart Agent pattern)

**What they do:** Fibery's Smart Agent generates JavaScript query pipelines against the workspace schema at query time. "How many in-progress initiatives with deadlines this month?" answers 6/6 correctly vs Notion's 3/6, because it writes code to access relational data, not free-form text.

**What EMA has:** 15 CLI tools that each know their own domain. `goal-manager` knows goals. `deadline-tracker` knows deadlines. They don't talk to each other.

**The gap:** You can't ask EMA "What goals am I most at risk on given my energy this week?" and get a real answer. The data exists in ~/data/*.json — nobody is joining it.

---

### Gap 2: No live context injection during Claude sessions (Mem MCP pattern)

**What they do:** Mem's MCP connector (March 2026) makes notes live context during a Claude session. Claude searches, reads, and writes to Mem without copy-paste. The human stops being the bridge.

**What EMA has:** Context is injected manually or via a SYSTEM_PROMPT hack. The Claude bridge exists but EMA state isn't auto-surfaced when Claude starts a session.

**The gap:** When you open a Claude Code session to work on a project, Claude has no idea you rated your energy 4/10 this morning, your deadline for Initiative X is in 3 days, and you last brain-dumped about it 48 hours ago. That data exists. Claude just can't see it.

---

### Gap 3: No automatic scheduling loop (Motion AI Scheduler pattern)

**What they do:** Motion's AI Calendar Assistant does three things that matter:
1. **Do Date ≠ Due Date** — it schedules *when* you'll work on a task, not just when it's due
2. **Automatic re-planning** — when anything changes (meeting added, task slips), the whole day reschedules
3. **Personalized for your work patterns** — learns your rhythm over time

**What EMA has:** `scheduler` and `daily-planning` CLI tools that are manual. You tell them your day. They don't tell you.

**The gap:** EMA is reactive. You run `daily-planning` when you remember to. Motion runs it *for* you every morning (and mid-day when things change). The scheduler doesn't schedule — you do.

---

### Gap 4: No typed knowledge graph (Tana/SiYuan pattern)

**What they do:** Tana's supertags give every node explicit schema (Meeting has: Participants, Decisions, Actions). AI can query and fill fields because the structure is declared, not inferred. SiYuan exposes block-level SQL. Fibery's entity model treats every object as a typed entity with fields, relations, and views.

**What EMA has:** Obsidian vault with markdown. QMD embeddings on top. Unstructured prose is hard to query reliably.

**The gap:** "Show me all meetings where Initiative X was discussed, with their decisions" is not answerable from the vault. The data might be there but the structure isn't declared in a way AI can exploit.

---

### Gap 5: No proactive AI feed (Height AI-as-teammate pattern)

**What they do:** Height's AI generates proactive updates in a feed — surfacing blockers, suggesting next actions, writing summaries of what changed. It acts *like a teammate* rather than waiting to be asked. It shows up in the activity timeline with observations: "This task has been blocked for 5 days — want me to reassign or reschedule?"

**What EMA has:** `executive-dashboard-v3` which you run manually. Passive read-only.

**The gap:** EMA never reaches out. It doesn't observe state changes and surface implications. It answers when spoken to. A real EMA would notice "you haven't checked in on Initiative Y in 6 days and its deadline is in 2" and proactively surface that.

---

### Gap 6: No session memory between Claude conversations

**What they do:** Mem's persistent memory + MCP means every Claude conversation can pick up where the last one left off — because Claude can query the memory store at session start.

**What EMA has:** Per-session context in ~/data/ but no automated injection. Sessions start cold.

**The gap:** Every Claude Code session is amnesiac by default. You repeat context every time.

---

### Gap 7: No unified record anatomy (Salesforce-style)

**What they do:** Salesforce-style tools treat every entity (initiative, goal, project) as a first-class record with: title, status, owner, created, modified, notes, related records, activity log, next action. The record is the single source of truth — you don't have a goal in one place, a deadline for it somewhere else, and notes about it in a third.

**What EMA has:** JSON state split across separate tool files. `goal-manager` data and `deadline-tracker` data are separate. No unified record model.

**The gap:** An initiative exists as scattered state across 4+ JSON files. AI sees fragments, not the full record.

---

## 2. Implementation Plan (Ranked by Impact)

### #1 — MCP Tool Layer: Expose all EMA state to Claude (HIGHEST IMPACT)

**What it is:** Wire EMA's 15 CLI tools as MCP tools so Claude can query any EMA state during any conversation.

**Inspired by:** Mem MCP connector, Tana MCP endpoint, SiYuan block SQL

**How to implement:**
- Implement `mcp_server.ex` (already planned in the Claude Bridge Design) as the first priority
- Register tools: `get_goals`, `get_schedule`, `get_energy_history`, `get_brain_dumps`, `get_active_initiatives`, `get_deadlines`, `get_context` — each reads from ~/data/ and returns structured JSON
- Add an MCP config file (`ema-tools.json`) that `claude --mcp-config` can load on session start
- Auto-inject this MCP config into every Claude Code invocation from EMA

**Effort: Medium** (bridge exists, MCP server is planned, data is already in JSON)

**Why it matters:** This is the single action that makes EMA a real executive layer rather than a collection of CLI tools. Once Claude can query EMA state during any session, everything else becomes possible. Without it, EMA and Claude are two separate tools that happen to live on the same machine.

---

### #2 — Executive Context Bundle: Auto-inject state on session start

**What it is:** At the start of every Claude Code session (or morning check-in), compose a rich context bundle from current EMA state and inject it as Claude's SYSTEM context.

**Inspired by:** Motion's AI Calendar "always knows your work", Mem's live context pattern

**How to implement:**
- Create `~/bin/ema-context-bundle.sh` — runs `goal-manager list`, `energy-tracker today`, `deadline-tracker upcoming --days 7`, `brain-dump recent --limit 3`, outputs structured YAML/JSON
- Modify `checkin-engine` to call this before composing Claude's morning brief
- Add to `context-switch` command so switching focus areas reloads relevant state
- Target: 500-800 tokens of dense, current executive state, not prose narration

**Effort: Low** (shell script + existing CLI tools)

**Why it matters:** This addresses Gap 2 immediately, no MCP server required. Gives Claude the "what's happening right now" context that Motion always surfaces. High ROI relative to effort.

---

### #3 — Cross-Tool Query Engine: Join EMA state for BI-style questions

**What it is:** A query layer that can join data across multiple ~/data/ JSON files to answer cross-domain questions — the Fibery Smart Agent pattern applied to EMA's local data.

**Inspired by:** Fibery Smart Agent JavaScript query pipelines

**How to implement:**
- Create a `~/bin/ema-query.sh` script that loads all ~/data/*.json into a jq/sqlite context
- Expose as MCP tool `query_executive_state(question: str)` — Claude generates the jq/SQL, the tool executes it
- Key queries to support: "What goals are at risk?", "What's overdue?", "Energy-adjusted workload this week?", "What hasn't been touched in 7+ days?"
- Later: Claude Code subagent that writes and runs data pipelines against ~/data/

**Effort: Medium** (jq is already available; sqlite import from JSON is trivial; MCP wrapper needed)

**Why it matters:** This is what makes EMA actually useful for executive decisions rather than just task tracking. Answers "what should I focus on?" with data rather than vibes.

---

### #4 — Proactive Daily Brief with Anomaly Detection

**What it is:** Automated morning routine that surfaces not just today's plan but *deviations* — what's drifted, what's at risk, what needs attention.

**Inspired by:** Height AI-as-teammate feed, Motion auto-replan

**How to implement:**
- Extend `daily-planning` to run a comparison: planned vs actual from yesterday, flag stale initiatives (not touched in N days), compute urgency × energy-adjusted priority
- Add anomaly triggers: `deadline_approaching_with_no_recent_activity`, `goal_stalled`, `energy_crash_on_high_priority_day`
- Post anomaly summary to Discord `#daily-brief` via existing thread-response-wrapper
- Schedule via cron: 06:30 UTC daily, re-run at midday if energy rating was ≤5

**Effort: Medium** (logic is new; infrastructure is all there)

**Why it matters:** This is the "EMA that reaches out" vs "EMA that waits to be asked." Closes Gap 5. High visibility, tangible daily value.

---

### #5 — Initiative Record: Unified entity model

**What it is:** Refactor initiatives from scattered JSON state into a unified record model where one JSON file is the source of truth for goal + deadline + energy budget + notes + recent brain dumps.

**Inspired by:** Salesforce record anatomy, Fibery entity model (entities as typed objects with fields + relations)

**How to implement:**
- New schema: `~/data/initiatives/<slug>.json` with fields: `id`, `title`, `status`, `goal_refs`, `deadline`, `energy_budget_hrs`, `priority`, `last_touched`, `notes_path`, `related_brain_dumps[]`, `activity_log[]`
- Migration script to pull together existing goal-manager + deadline-tracker + initiative data
- Update `executive-dashboard-v3` to render from unified records
- MCP tool `get_initiative(id)` returns the full record, not fragments

**Effort: Medium-High** (schema design + migration + updating multiple CLI tools)

**Why it matters:** Right now Claude sees fragments. With unified records, Claude can reason about an initiative holistically. Required foundation for query engine (#3) and proactive feed (#4).

---

### #6 — Vault Structured Sync: Tag vault notes with initiative refs

**What it is:** Auto-tag vault notes with machine-readable frontmatter linking them to EMA initiative records, making the vault queryable by initiative.

**Inspired by:** Tana supertag model, SiYuan MCP block access

**How to implement:**
- Add `initiative_refs: [slug1, slug2]` frontmatter to vault templates for meeting notes, brain dumps, project notes
- Script: `~/bin/vault-link-initiatives.sh` — parses existing notes, fuzzy-matches initiative slugs from title/tags, proposes frontmatter additions
- QMD embed run after sync so semantic search respects the new structure
- MCP tool `get_vault_notes_for_initiative(slug)` queries by frontmatter field

**Effort: Low-Medium** (frontmatter + vault-wide script + QMD re-index)

**Why it matters:** Bridges the gap between prose thinking (vault) and structured tracking (EMA). An initiative record can reference all related vault notes; Claude can pull them in context.

---

### #7 — Energy-Aware Auto-Scheduling

**What it is:** Use the energy-tracker history to inform daily-planning recommendations — specifically, stop scheduling deep work on mornings after low-energy patterns.

**Inspired by:** Motion's AI Calendar (Do Date ≠ Due Date, learns your rhythm)

**How to implement:**
- `energy-tracker` already has historical data; build a 7-day rolling pattern summary
- Integrate into `daily-planning`: if today's predicted energy is low (based on yesterday's actual + historical patterns), surface only low-friction tasks as first block
- Add `estimated_energy_cost` field to initiative records (# 5) so planning can match task cost to predicted capacity
- Long-term: proactive reschedule trigger when morning check-in energy < 5

**Effort: Medium** (data exists; logic + integration work needed)

**Why it matters:** This is the Motion differentiator applied to EMA. Right now scheduling ignores energy. A real EMA knows you can't do deep architecture review the morning after a 4/10 energy day.

---

## 3. The "MCP as Nervous System" Pattern

This is the single architectural decision that changes EMA from a CLI toolkit to an executive layer. The design is specific and buildable this month.

### What to expose as MCP tools

```
Tool: get_executive_state
  Returns: current energy, top 3 active goals, next 3 deadlines, last brain dump excerpt
  Source: ~/data/energy.json, ~/data/goals.json, ~/data/deadlines.json, ~/data/brain-dumps/
  
Tool: get_goals(status?: "active"|"stalled"|"complete")
  Returns: array of {id, title, status, priority, last_touched, completion_pct}
  Source: ~/data/goals.json

Tool: get_schedule(date?: ISO8601)
  Returns: today's scheduled blocks, planned focus areas, meeting count
  Source: ~/data/schedule.json + ~/data/meetings/

Tool: get_energy_context
  Returns: today's rating (if set), 7-day average, pattern note ("typically low on Mondays")
  Source: ~/data/energy-log.json

Tool: get_brain_dumps(limit?: int, query?: string)
  Returns: recent brain dump content, searchable by keyword
  Source: ~/data/brain-dumps/*.md

Tool: get_deadlines(horizon_days?: int)
  Returns: upcoming deadlines with priority, days remaining, initiative title
  Source: ~/data/deadlines.json

Tool: get_initiative(id: string)
  Returns: full initiative record (once #5 is built); today returns fragments joined at query time
  Source: ~/data/initiatives/ (or composed from existing files)

Tool: create_brain_dump(content: string, initiative_ref?: string)
  Returns: {id, path, created_at}
  Side effect: writes to ~/data/brain-dumps/, updates QMD index

Tool: update_goal_status(id: string, status: string, note?: string)
  Returns: {success, updated_goal}
  Side effect: writes to ~/data/goals.json, appends to activity log
```

### Implementation path

**Step 1 (Week 1):** Implement read-only tools as shell scripts: `~/bin/mcp-tools/*.sh`. Each takes JSON args from stdin, returns JSON to stdout. No MCP server yet — just validate the interface.

**Step 2 (Week 2):** Implement `mcp_server.ex` using EMA's existing HTTP layer (or stdio transport). Register the read tools first. Test with `claude --mcp-config ema-tools.json --print "What are my active goals?"`.

**Step 3 (Week 2-3):** Add write tools (`create_brain_dump`, `update_goal_status`). Add the governance layer: all write calls log to `~/data/mcp-audit.log` with timestamp + caller session.

**Step 4 (Week 3-4):** Auto-inject `--mcp-config ema-tools.json` into every Claude Code invocation from the EMA bridge. Claude always has EMA context available, even in ambient coding sessions.

### How the bridge wires it

From `EMA Claude Bridge Design.md`, `mcp_server.ex` is already in the module plan. The MCP config for Claude Code is:

```json
{
  "mcpServers": {
    "ema": {
      "command": "/usr/bin/ema-mcp-server",
      "args": ["--data-dir", "/home/trajan/data"],
      "env": {}
    }
  }
}
```

This gets passed as `--mcp-config ~/.config/claude/ema-mcp.json` to every Claude invocation from the bridge.

---

## 4. Vault as Structured Knowledge Graph

The vision: make the Obsidian vault queryable with SQL-level precision by AI agents. Today it's semantic soup. The goal is typed nodes with declared relationships.

### Current state

QMD (Quartz Metadata) provides embeddings-based semantic search. Good for "find notes about X." Bad for "find all meetings where Initiative Y was decided, sorted by date, with their action items." That requires structure.

### The Tana/SiYuan gap

Tana: every node has a declared supertag. Meeting nodes have Participants, Decisions, Actions fields. SQL-level queries work because the schema is explicit.

SiYuan: block-level SQL access via MCP. You can `SELECT content FROM blocks WHERE type='heading' AND content LIKE '%Initiative Y%'`.

Obsidian: folders + tags + backlinks + YAML frontmatter. The AI plugins work on prose. Querying relationships requires plugins, not native structure.

### Proposed architecture: QMD Enhanced

**Layer 1: Frontmatter typing (minimal effort, big payoff)**

Standardize frontmatter templates across note types:
```yaml
# Meeting note
type: meeting
date: 2026-04-01
participants: [trajan, user2]
initiative_refs: [initiative-x, initiative-y]
decisions: []     # populated by AI after meeting
actions: []       # populated by AI after meeting
```

```yaml
# Brain dump
type: brain-dump
date: 2026-04-01
energy_at_time: 7
initiative_refs: [initiative-x]
themes: [architecture, planning]
```

**Layer 2: SQLite index over vault frontmatter**

Build `~/bin/vault-index.sh`:
- Parses all vault .md files, extracts YAML frontmatter
- Upserts into `~/data/vault-index.sqlite` with tables: `notes`, `note_initiative_refs`, `note_participants`, `note_decisions`, `note_actions`
- Run on vault change (inotify hook) or every 15 minutes via cron

**Layer 3: MCP tool `query_vault(sql: string)`**

Exposes the SQLite index via MCP:
```
query_vault("SELECT n.path, n.date, d.content 
             FROM notes n 
             JOIN note_decisions d ON n.id = d.note_id
             WHERE n.initiative_refs LIKE '%initiative-x%'
             ORDER BY n.date DESC LIMIT 10")
```

This is the SiYuan pattern applied to Obsidian, self-hosted.

**Layer 4: QMD upgrade**

Current QMD uses vector embeddings. Add hybrid retrieval:
- Structured query (SQLite) for precise field-based lookups
- Semantic query (embeddings) for fuzzy concept search
- Merge results with reranking

The `qmd search` command should accept both modes: `qmd search "architecture decision" --type meeting --initiative initiative-x --after 2026-03-01`

### Migration path

1. Create frontmatter templates for the 5 most common note types (meeting, brain-dump, project, goal, reference)
2. Write `vault-backfill-frontmatter.sh` — uses Claude Code to infer and add frontmatter to existing notes (run once, review output)
3. Build SQLite index builder (200 lines of bash/Python)
4. Add `query_vault` as MCP tool alongside other EMA tools
5. Run QMD re-embed after backfill

**Effort: Medium** (1-2 weeks including backfill)

**Value:** This makes the vault an actual knowledge graph that AI can reason over with precision. Combined with the MCP layer, Claude can answer "What decisions have we made about Initiative X in the last 30 days?" with citations.

---

## 5. Quick Wins (This Week)

These are the three things that deliver visible EMA improvement with under a day of work each.

### Quick Win 1: `ema-context-bundle.sh` — Rich morning context injection

**What:** Shell script that composes a YAML context bundle from existing CLI tools and injects it into Claude's context at session start.

**How:**
```bash
#!/bin/bash
# ~/bin/ema-context-bundle.sh
echo "---"
echo "ema_context:"
echo "  generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "  energy_today: $(goal-manager energy-today 2>/dev/null || echo 'not-set')"
echo "  active_goals:"
goal-manager list --status active --format yaml | sed 's/^/    /'
echo "  upcoming_deadlines:"
deadline-tracker upcoming --days 7 --format yaml | sed 's/^/    /'
echo "  recent_brain_dump: |"
ls -t ~/data/brain-dumps/*.md 2>/dev/null | head -1 | xargs head -20 | sed 's/^/    /'
echo "---"
```

Call it from `checkin-engine` and prepend output to Claude's SYSTEM context. Zero new infrastructure.

**Time: 2 hours**

---

### Quick Win 2: Stale initiative detector (cron + Discord alert)

**What:** Cron job that identifies initiatives not touched in 5+ days and posts a Discord alert.

**How:**
```bash
#!/bin/bash
# ~/bin/check-stale-initiatives.sh  
# Runs: 0 9 * * 1-5 (weekday mornings)
STALE_THRESHOLD=5  # days
# Read initiatives, check last_touched date vs now
# If stale: post to Discord #daily-brief
thread-response-wrapper.sh ema "[EMA] Stale initiative alert: X hasn't been touched in N days" "Details..."
```

Uses existing data, existing Discord integration, existing thread wrapper. **This is EMA reaching out unprompted** — a small version of the Height AI-as-teammate pattern.

**Time: 3 hours**

---

### Quick Win 3: `ema status` one-liner — executive state in 10 seconds

**What:** A single command that prints a dense executive state summary: energy, top 3 goals, next 3 deadlines, last brain dump headline.

**How:**
```bash
#!/bin/bash
# ~/bin/ema-status.sh
echo "=== EMA Status $(date +%Y-%m-%d) ==="
echo ""
echo "⚡ Energy: $(cat ~/data/energy-log.json | jq -r '.[-1].rating // "not set"')/10"
echo ""
echo "🎯 Active Goals:"
goal-manager list --status active --limit 3 | awk '{print "  • "$0}'
echo ""
echo "⏰ Upcoming Deadlines:"
deadline-tracker upcoming --days 7 --limit 3 | awk '{print "  • "$0}'
echo ""
echo "🧠 Last Brain Dump:"
ls -t ~/data/brain-dumps/*.md | head -1 | xargs head -3
```

Alias: `ems` or `status`. Instant orientation, no Claude needed.

**Time: 1 hour**

---

## What to Build First

**Unambiguous recommendation: Build `mcp_server.ex` and register EMA's read tools. This is #1.**

Here's why it beats the other options:

1. The infrastructure is already planned (in `EMA Claude Bridge Design.md`)
2. The data already exists (~/data/*.json)
3. It unlocks *everything else* — context injection, proactive feed, cross-tool queries, vault integration all become better once Claude can pull EMA state on demand
4. It's the architectural decision that separates "15 CLI tools on a machine that also runs Claude" from "an AI-native executive layer"

The quick wins (section 5) are genuinely quick and worth doing in parallel. But the MCP server is the strategic bet. Once it's running, EMA's value compounds every time Claude has a session.

Motion built their moat on "AI that knows all your work." That's the sentence that should describe EMA.

---

## Architecture Diagram (Target State)

```
                    EMA Executive Layer (Target)
                    ┌──────────────────────────────────────────────────┐
                    │                                                  │
                    │  ┌─── MCP Server ─────────────────────────────┐ │
                    │  │  get_executive_state   get_goals            │ │
                    │  │  get_schedule          get_energy_context   │ │
                    │  │  get_brain_dumps       get_deadlines        │ │
                    │  │  get_initiative        query_vault          │ │
                    │  │  create_brain_dump     update_goal_status   │ │
                    │  └────────────────────┬───────────────────────┘ │
                    │                       │ stdio / HTTP            │
                    │  ┌─── Claude Code ────┴───────────────────────┐ │
                    │  │  --mcp-config ema-tools.json               │ │
                    │  │  Every session gets EMA context on demand  │ │
                    │  └────────────────────────────────────────────┘ │
                    │                                                  │
                    │  ┌─── ~/data/ JSON Store ─────────────────────┐ │
                    │  │  goals.json   schedule.json   energy.json  │ │
                    │  │  deadlines.json   brain-dumps/*.md          │ │
                    │  │  initiatives/*.json (new unified records)   │ │
                    │  └────────────────────────────────────────────┘ │
                    │                                                  │
                    │  ┌─── Vault SQLite Index ─────────────────────┐ │
                    │  │  notes table + joins                       │ │
                    │  │  query_vault MCP tool                      │ │
                    │  │  Hybrid: SQL (precision) + QMD (semantic)  │ │
                    │  └────────────────────────────────────────────┘ │
                    │                                                  │
                    │  ┌─── Proactive Feed ─────────────────────────┐ │
                    │  │  daily-brief cron (anomaly detection)      │ │
                    │  │  stale-initiative alerts                   │ │
                    │  │  energy-adjusted re-scheduling triggers    │ │
                    │  └────────────────────────────────────────────┘ │
                    └──────────────────────────────────────────────────┘
                                          ▲
                                          │ Discord + Telegram
                                          ▼
                                  Trajan's interfaces
```

---

## Sources Used

1. [T1] [Mem MCP connector announcement](https://get.mem.ai/blog/your-favorite-llms-can-now-use-your-second-brain-as-context) — MCP-as-nervous-system pattern
2. [T1] [Tana AI docs](https://outliner.tana.inc/docs/tana-ai) — typed knowledge graph + MCP endpoint
3. [T2] [Motion usemotion.com](https://www.usemotion.com) — AI Calendar, Do Date ≠ Due Date pattern, auto-replan
4. [T2] [Fibery vs Notion AI Agent benchmark](https://fibery.com/blog/fibery-vs-x/fibery-vs-notion-ai-agent/) — query layer vs text layer
5. [T2] [Fibery 2024 Year Review](https://fibery.com/blog/startup-diary/fibery-2024/) — entity model, company OS framing
6. [T2] [Capacities AI philosophy](https://capacities.io/blog/ai-for-meaningful-work) — intentional AI, depth over noise
7. Vault: `EMA Claude Bridge Design.md` — existing architecture, MCP server module plan
8. Vault: `Executive System.md` — 15 CLI tools, ~/data/ state
9. Vault: `Architecture Synthesis 2026-03-25.md` — Agent OS framing, executive functioning pain point
10. Vault: `ExecAI-Management-2026-03-31.md` — full survey of exec AI tools
