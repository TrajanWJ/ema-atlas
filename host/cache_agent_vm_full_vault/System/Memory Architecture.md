---
title: "Memory Architecture — Unified Cognitive Model"
type: system-design
created: 2026-03-18
updated: 2026-03-18
tags:
  - memory-architecture
  - cognitive-model
  - agent-infrastructure
  - context-management
  - system-design
status: active
confidence: 0.60
confidence_updated: 2026-03-18
project: openclaw
summary: "Four-tier cognitive memory architecture with automatic promotion, pressure monitoring, staleness detection, and trust tiers for multi-agent memory writes. Synthesized from 5 research sources covering 15+ open-source memory systems."
key_topics:
  - working memory
  - episodic memory
  - semantic memory
  - procedural memory
  - memory promotion
  - memory pressure
  - staleness detection
  - trust hierarchy
  - context drift prevention
sources:
  - "[[Web Intel - Deep Sweep 2026-03-18]]"
  - "[[GitHub Intel - Deep Sweep 2026-03-18]]"
  - "[[Reddit Intel - Deep Sweep 2026-03-18]]"
  - "[[Three-Tier Memory Architecture]]"
  - "[[Mirror System - Comparison Review]]"
source: system
---

# Memory Architecture — Unified Cognitive Model

## 1. Design Principles

This architecture formalizes what we already have, fills the gaps identified through research, and avoids over-engineering. Every component either exists today (formalized) or addresses a concrete, documented failure mode.

**Core philosophy:** Files are memory. The vault is the brain. LCM is the subconscious. Scripts are reflexes.

**Key research influences:**
- **CoALA paper** (via `agentic-memory`) → 4-tier cognitive model
- **Aegis Memory** → Trust hierarchy, ACE loop (generate→reflect→curate)
- **Evo-Memory** → Search→Synthesize→Evolve loop, promotion through error/repetition
- **Entelgia** → Importance scoring, memory promotion through error and repetition
- **opencode-working-memory** → Memory pressure monitoring, auto-pruning
- **cortex-tms** → Staleness detection via git timestamps
- **Three-Tier Architecture** → Token-optimized retrieval, classification pipeline
- **Mirror System Review** → Security [[Hardening]], concrete bug fixes

---

## 2. The Four-Tier Cognitive Model

Based on the CoALA cognitive architecture, formalized against our existing infrastructure.

```
┌─────────────────────────────────────────────────────────┐
│                   PROCEDURAL MEMORY                      │
│  How to do things. Rarely changes. Highest trust.        │
│  Files: SOUL.md, AGENTS.md, TOOLS.md, skills/            │
├─────────────────────────────────────────────────────────┤
│                   SEMANTIC MEMORY                        │
│  What we know. Grows steadily. Medium trust.             │
│  Files: vault/**, QMD index, knowledge graph             │
├─────────────────────────────────────────────────────────┤
│                   EPISODIC MEMORY                        │
│  What happened. Daily churn. Variable trust.             │
│  Files: memory/YYYY-MM-DD.md, vault/Sessions/,           │
│         outcome-tracker.json, LCM conversation history   │
├─────────────────────────────────────────────────────────┤
│                   WORKING MEMORY                         │
│  What matters right now. High churn. Session-scoped.     │
│  Files: MEMORY.md (2500 char cap), active context window │
└─────────────────────────────────────────────────────────┘
```

### 2.1 Working Memory
**What:** Active scratchpad for the current session. High-churn, bounded.
**Files:** `MEMORY.md` (2500 char cap)
**Characteristics:**
- Read on every session startup
- Manually maintained by Right Hand
- Contains: active projects, key preferences, follow-up protocols, urgent items
- **Pressure-monitored:** char count tracked, auto-prune when near cap

**Improvements needed:**
- Formalize the pruning trigger (>2000 chars → review for staleness)
- Items that persist >14 days without update should be flagged for promotion to semantic memory or deletion

### 2.2 Episodic Memory
**What:** Record of events, outcomes, sessions. What happened and when.
**Files:**
- `memory/YYYY-MM-DD.md` — daily notes (created by agents)
- `vault/Sessions/` — structured session captures (debugging, troubleshooting)
- `memory/outcome-tracker.json` — task outcomes with timestamps
- `memory/agent-performance.md` — agent fitness scores
- `memory/workflow-patterns.json` — recurring tool/agent sequences
- LCM compacted conversation history (searchable via `lcm_grep`)

**Characteristics:**
- Append-mostly, rarely edited
- Retention: daily notes 30 days, session captures 90 days active / then archived
- Episodic items that recur 3+ times → candidates for promotion to semantic memory
- Error-causing items → automatically flagged for promotion (Entelgia pattern)

**Improvements needed:**
- Automated promotion scanner (→ `memory-promote.sh`)
- Structured daily note format (not just narrative blobs)
- Archival policy: daily notes >30 days → `vault/Daily Notes/Archive/`

### 2.3 Semantic Memory
**What:** Accumulated knowledge. Facts, preferences, research, decisions.
**Files:**
- `vault/**` — Obsidian knowledge vault (indexed by QMD)
- `vault/Trajan/Preferences.md` — learned user preferences
- `vault/Trajan/Decisions.md` — decision log
- Knowledge graph entities (ontology-sync)

**Characteristics:**
- Grows steadily, rarely shrinks
- Searchable via `qmd search` (semantic) and `qmd-context.sh` (token-optimized)
- Auto-classified via `vault-classify.sh` (when hooked into cron)
- Weekly synthesis identifies cross-cutting patterns (`weekly-synthesis.sh`)

**Improvements needed:**
- Staleness detection for vault notes (→ integrate into `memory-pressure.sh`)
- Confidence scoring on auto-classified notes
- Hybrid search (FTS + semantic) for QMD — currently semantic-only

### 2.4 Procedural Memory
**What:** How to do things. Instructions, protocols, skills, workflows.
**Files:**
- `SOUL.md` — identity, voice, anti-patterns, protocols
- `AGENTS.md` — [[Agent Roster]], routing rules, dispatch protocol
- `TOOLS.md` — system environment, paths, services
- `skills/` — installed skills with SKILL.md files
- `~/bin/` — operational scripts (crystallized workflow patterns)

**Characteristics:**
- Changes infrequently, high trust required for modifications
- Self-evolution protocol allows agents to propose changes (with human approval for major ones)
- Workflow patterns that crystallize (5+ successes, 70%+ rate) become procedural memory (scripts or skills)

**Improvements needed:**
- Staleness detection for AGENTS.md and SOUL.md relative to actual behavior
- Version tracking for procedural changes (git log on workspace files)

---

## 3. Memory Promotion

Automatic promotion of information across tiers, inspired by Evo-Memory's Search→Synthesize→Evolve loop and Entelgia's importance scoring.

### 3.1 Promotion Triggers

| Trigger | From | To | Mechanism |
|---|---|---|---|
| **Repetition** (3+ occurrences) | Episodic → Semantic | Pattern mentioned in 3+ daily notes → vault note | `memory-promote.sh` scanner |
| **Error-driven** | Episodic → Semantic | Same error/fix pattern recurring → [[Session Capture]] | `memory-promote.sh` scanner |
| **Preference signal** | Episodic → Semantic | "From now on" or explicit preference → Preferences.md | [[self-learning]] protocol (SOUL.md) |
| **Crystallization** | Episodic → Procedural | Workflow pattern 5+ successes, 70%+ rate → script/skill | [[Evolution Signals]] + human approval |
| **Working→Semantic** | Working → Semantic | MEMORY.md item stable >14 days → vault note or daily note | `memory-promote.sh` staleness check |
| **Importance score** | Episodic → Semantic | High-impact items (revenue, security, system stability) → immediate vault note | Agent judgment during dispatch |

### 3.2 Promotion Pipeline

```
Daily Notes / Outcomes / Sessions
        │
        ▼
  memory-promote.sh (cron: daily)
        │
        ├── Scan daily notes for repeated themes (3+ mentions in 7 days)
        ├── Scan outcome-tracker for recurring failure patterns
        ├── Scan workflow-patterns for crystallization candidates
        ├── Check MEMORY.md for stale items (>14 days unchanged)
        │
        ▼
  Promotion Report (~/vault/System/memory/promotions/YYYY-MM-DD.md)
        │
        ├── Items ready for promotion (with evidence)
        ├── Items flagged as stale (with last-seen dates)
        ├── Crystallization candidates (with success rates)
        │
        ▼
  Right Hand reviews on next heartbeat, applies promotions
```

### 3.3 Demotion / Archival

Memory also flows downward:
- **Working → Archive:** Resolved projects removed from MEMORY.md
- **Episodic → Archive:** Daily notes >30 days moved to `vault/Daily Notes/Archive/`
- **Semantic → Stale flag:** Vault notes not accessed in 90 days flagged by staleness detector
- **Procedural → Review:** Skills/scripts not invoked in 60 days flagged for relevance review

---

## 4. Memory Pressure Monitoring

Inspired by `opencode-working-memory`'s pressure monitoring and Shannon's per-agent token budgets.

### 4.1 Pressure Dimensions

| Dimension | Metric | Healthy | Warning | Critical |
|---|---|---|---|---|
| **Working memory** | MEMORY.md char count | <1500 | 1500-2200 | >2200 (of 2500 cap) |
| **Daily note size** | Today's daily note bytes | <5KB | 5-15KB | >15KB |
| **Vault growth** | New notes per week | <20 | 20-50 | >50 (review needed) |
| **Episodic accumulation** | Daily notes without archival | <30 | 30-45 | >45 |
| **Staleness** | Vault notes not accessed 90d | <10% | 10-25% | >25% |
| **LCM depth** | Compacted conversation summaries | Informational | — | — |

### 4.2 Pressure Response Protocol

```
Green (all healthy):
  → Normal operation
  → No action needed

Yellow (any warning):
  → Flag in next heartbeat
  → "Memory pressure: [dimension] at [level]. Recommend: [action]."
  → Agent takes action within 2 heartbeats

Red (any critical):
  → Immediate action
  → Auto-prune if safe (daily note archival, MEMORY.md cleanup)
  → Alert Trajan if destructive action needed
  → Never auto-delete semantic or procedural memory
```

### 4.3 Monitoring Script

`~/bin/memory-pressure.sh` runs on demand or via heartbeat. Outputs a pressure dashboard:

```
MEMORY PRESSURE REPORT — 2026-03-18
────────────────────────────────────
Working Memory:  1280/2500 chars  [██████░░░░] 51%  ✅
Daily Note:      2.1KB            [██░░░░░░░░] 14%  ✅
Vault Growth:    8 new this week  [█░░░░░░░░░]      ✅
Episodic Backlog: 2 daily notes   [░░░░░░░░░░]      ✅
Stale Notes:     12/180 (6.7%)   [█░░░░░░░░░]      ✅

Overall: GREEN — no action needed
```

---

## 5. Staleness Detection

Inspired by `cortex-tms` git-based staleness detection and the Three-Tier Architecture's recency-weighted retrieval.

### 5.1 What Gets Checked

| File/Category | Stale After | Detection Method | Action |
|---|---|---|---|
| `MEMORY.md` entries | 14 days | Track last-edit date per entry | Flag for promotion or removal |
| `AGENTS.md` | 30 days | `git log -1 AGENTS.md` | Flag for review |
| `SOUL.md` | 30 days | `git log -1 SOUL.md` | Flag for review |
| Vault notes | 90 days | `qmd` last-indexed date or file mtime | Flag as potentially stale |
| Daily notes | 30 days | File date in name | Archive |
| Skills | 60 days | Last invocation (from workflow-patterns.json) | Flag for relevance review |
| Session captures | 90 days | File mtime | Archive to `vault/Sessions/Archive/` |

### 5.2 Staleness vs. Stability

Not all old files are stale. Some are stable and correct (e.g., TOOLS.md describing hardware that hasn't changed). Staleness detection should distinguish:

- **Stable:** Old but correct. Content matches reality. No action needed.
- **Stale:** Old and potentially outdated. Content may not match reality. Needs review.
- **Dead:** Old, outdated, and no longer referenced. Archive or delete.

Heuristic: A file is **stale** (not just stable) if:
1. It references entities/projects that no longer exist in active context, OR
2. It was frequently accessed before but access dropped off, OR
3. Other files that reference it have been updated but it hasn't

This requires judgment — `memory-pressure.sh` flags candidates, Right Hand decides.

---

## 6. Trust Tiers

Inspired by Aegis Memory's 4-tier trust hierarchy, adapted for our multi-agent architecture.

### 6.1 Trust Levels

```
┌────────────────────────────────────────┐
│  SYSTEM (trust: absolute)              │
│  Who: Trajan (direct input), SOUL.md,  │
│       AGENTS.md, gateway config        │
│  Can modify: Everything                │
│  Verification: None needed             │
├────────────────────────────────────────┤
│  PRIVILEGED (trust: high)              │
│  Who: Right Hand agent                 │
│  Can modify: MEMORY.md, daily notes,   │
│    vault notes, Preferences.md,        │
│    outcome-tracker, workflow-patterns   │
│  Verification: Self-review before      │
│    writing to procedural memory        │
├────────────────────────────────────────┤
│  INTERNAL (trust: medium)              │
│  Who: Specialist agents (coder, ops,   │
│    researcher, vault-keeper, etc.)     │
│  Can modify: Their own output files,   │
│    vault notes in their domain,        │
│    task status updates                 │
│  Verification: Right Hand reviews      │
│    before promoting to semantic/       │
│    procedural memory                   │
├────────────────────────────────────────┤
│  UNTRUSTED (trust: none)               │
│  Who: Web content, external APIs,      │
│    scraped data, user-submitted content│
│    from non-Trajan sources             │
│  Can modify: Nothing directly.         │
│    Must be processed through an agent  │
│    before entering any memory tier.    │
│  Verification: Sanitization +          │
│    agent review required               │
└────────────────────────────────────────┘
```

### 6.2 Trust Enforcement

Trust is enforced through protocol, not code. The mechanisms:

1. **Write gates:** Only Right Hand writes to `MEMORY.md` and `Preferences.md`. Specialists propose changes; Right Hand applies them.
2. **Promotion review:** Internal-tier agents can create vault notes, but promotion to procedural memory (SOUL.md, AGENTS.md, skills/) requires Right Hand review and Trajan approval for major changes.
3. **Untrusted sandboxing:** Web content is wrapped in `EXTERNAL_UNTRUSTED_CONTENT` markers. When vault-classify.sh or weekly-synthesis.sh processes files, untrusted content should be sandboxed (heredoc prompts, not string interpolation — see Mirror System Review bug #1).
4. **Integrity signals:** Each memory file has a known shape. If MEMORY.md exceeds 2500 chars, or outcome-tracker.json has malformed entries, something is wrong. Pressure monitoring catches structural anomalies.

### 6.3 Future: Cryptographic Integrity (Optional)

Aegis Memory uses HMAC-SHA256 signing for tamper detection. We could add lightweight integrity checking:

```bash
# Generate: sha256sum MEMORY.md > MEMORY.md.sig
# Verify:   sha256sum -c MEMORY.md.sig
```

This catches accidental corruption but not deliberate tampering (since the signing key is on the same system). Worth implementing only if we see memory corruption issues. Not a priority now.

---

## 7. Anti-Context-Drift Measures

Context drift = the agent's context window fills with stale/irrelevant information, degrading response quality. Our multi-layered defense:

### 7.1 Retrieval Layer (Existing)
- `qmd-context.sh` — summary-first retrieval, 90% token savings
- LCM compaction — conversation history compressed while remaining searchable
- `MEMORY.md` cap — bounded working memory prevents unbounded growth

### 7.2 Classification Layer (Existing)
- `vault-classify.sh` — auto-generates summaries and key_topics for vault notes
- Ontology-sync — entity extraction and knowledge graph maintenance
- QMD embeddings — semantic indexing for relevance-ranked retrieval

### 7.3 Synthesis Layer (Existing)
- `weekly-synthesis.sh` — cross-cutting pattern detection
- Workflow-patterns.json — recurring sequence tracking
- [[Evolution Signals]] — behavioral drift detection

### 7.4 Pressure Layer (New)
- `memory-pressure.sh` — proactive monitoring of all memory dimensions
- Staleness detection — flag outdated information before it causes errors
- Archival automation — move old episodic memory out of active paths

### 7.5 Promotion Layer (New)
- `memory-promote.sh` — scan for items that should move between tiers
- Error-driven promotion — items that cause repeated errors get elevated
- Crystallization — recurring patterns harden into procedural memory

---

## 8. ACE Loop Integration

Inspired by Aegis Memory's ACE loop (generate → reflect → curate), adapted for our [[self-learning]] protocol.

### 8.1 Generate
Every interaction produces potential memory artifacts:
- Preferences expressed → candidate for `Preferences.md`
- Decisions made → candidate for `Decisions.md`
- Errors encountered → candidate for [[Session Capture]]
- Patterns observed → candidate for workflow-patterns.json

### 8.2 Reflect
Periodic review of generated artifacts:
- Self-check nudges (SOUL.md: every ~10-20 interactions)
- Heartbeat checks (rotating through HEARTBEAT.md)
- Weekly synthesis (cross-cutting analysis)
- Memory pressure monitoring (proactive flagging)

### 8.3 Curate
Active maintenance of memory quality:
- Promotion of important items to higher tiers
- Archival of stale/resolved items
- Staleness flagging for review
- Trust-gated writes (only privileged agents modify core memory)

---

## 9. Implementation Roadmap

### Phase 1: Monitoring (Immediate)
- [x] `qmd-context.sh` — token-optimized retrieval (exists)
- [x] `vault-classify.sh` — auto-classification (exists, needs [[Hardening]])
- [x] `weekly-synthesis.sh` — weekly synthesis (exists, needs [[Hardening]])
- [ ] `memory-pressure.sh` — pressure dashboard (**new, create now**)
- [ ] `memory-promote.sh` — promotion scanner (**new, create now**)

### Phase 2: Hardening (This Week)
- [ ] Fix vault-classify.sh security bugs (heredoc for prompts, backup before write)
- [ ] Fix weekly-synthesis.sh injection risk (don't let synthesis write to Preferences.md directly)
- [ ] Add crontab entries for vault-classify and weekly-synthesis
- [ ] Create `~/memory/` directory with proper structure

### Phase 3: Integration (Next Sprint)
- [ ] Update AGENTS.md dispatch protocol to reference promotion triggers
- [ ] Add staleness checks to heartbeat rotation
- [ ] Hook memory-pressure.sh into heartbeat
- [ ] Update SOUL.md self-check nudges to reference pressure dashboard

### Phase 4: Enhancement (Future)
- [ ] Hybrid search for QMD (FTS5 + semantic)
- [ ] Confidence scoring on auto-classified notes
- [ ] BM25 field weighting (title 10x, tags 5x, content 1x)
- [ ] Auto-decay: deprioritize notes not accessed in 90 days
- [ ] Explore mem0 or Memori plugin for persistent cross-session memory

---

## 10. File Map

Complete map of the memory system's files and their roles:

```
~/.openclaw/agents/main/workspace/
├── MEMORY.md              ← Working memory (2500 char cap)
├── SOUL.md                ← Procedural: identity, voice, protocols
├── AGENTS.md              ← Procedural: agent roster, dispatch rules
├── TOOLS.md               ← Procedural: system environment
├── memory/                ← Episodic memory (to be created)
│   ├── YYYY-MM-DD.md      ← Daily notes
│   ├── outcome-tracker.json ← Task outcomes
│   ├── agent-performance.md ← Agent fitness scores
│   └── workflow-patterns.json ← Recurring patterns
└── skills/                ← Procedural: installed skills

~/vault/                   ← Semantic memory
├── Trajan/
│   ├── Preferences.md     ← Learned preferences
│   ├── Decisions.md       ← Decision log
│   └── weekly-synthesis/  ← Weekly synthesis reports
├── Sessions/              ← Episodic: structured session captures
├── System/
│   ├── Memory Architecture.md  ← This file
│   ├── Evolution Signals.md    ← Behavioral drift signals
│   └── memory/
│       └── promotions/    ← Promotion reports (to be created)
├── Daily Notes/           ← Episodic: daily notes
│   └── Archive/           ← Archived daily notes (>30 days)
├── Research/              ← Semantic: research notes
└── Templates/
    └── Session Capture.md ← Template for structured captures

~/bin/                     ← Operational scripts (procedural)
├── qmd-context.sh         ← Token-optimized retrieval
├── vault-classify.sh      ← Auto-classification
├── weekly-synthesis.sh    ← Weekly synthesis
├── memory-promote.sh      ← Promotion scanner (NEW)
└── memory-pressure.sh     ← Pressure monitoring (NEW)
```

---

*Architecture synthesized 2026-03-18 from 5 research sources covering 15+ open-source memory systems. Designed for incremental adoption — each component delivers value independently.*

## Related

- [[Syne Agent Framework]]
- [[Web Intel - Deep Sweep 2026-03-18]]
- [[GitHub Intel - Deep Sweep 2026-03-18]]
- [[Reddit Intel - Deep Sweep 2026-03-18]]
- [[Three-Tier Memory Architecture]]
- [[Mirror System - Comparison Review]]
- [[Evolution Signals]]
