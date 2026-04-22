---
title: "Three-Tier Memory Architecture Analysis"
type: research
created: "2026-03-18"
updated: "2026-03-18"
tags: [memory-architecture, knowledge-management, agent-infrastructure, context-drift]
summary: "Study of two repos by Shawn Daniel (willynikes2) that implement a persistent knowledge layer for AI agents with Obsidian integration."
project: openclaw
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
---

# Three-Tier Memory Architecture Analysis

Study of two repos by Shawn Daniel (willynikes2) that implement a persistent knowledge layer for AI agents with Obsidian integration.

**Repos studied:**
- [knowledge-base-server](https://github.com/willynikes2/knowledge-base-server) — SQLite FTS5 knowledge base with MCP + REST interface
- [agent-orchestrator](https://github.com/willynikes2/agent-orchestrator) — Multi-agent CLI wrapper with failover (Claude → Codex → Gemini)

---

## 1. The Three-Tier Storage Model

The three tiers are **conceptual categories enforced through retrieval ranking**, not separate storage backends. Everything lives in a single SQLite database with FTS5 and embeddings tables. The tiering happens through document types, recency, and the retrieval pipeline.

### Hot Tier — Active Context
- **What:** Current project decisions, recent session findings, active bug fixes, in-progress architecture changes
- **How it works:** Retrieved FIRST in every query. Documents classified as `decision`, `fix`, `session` with recent `indexed_at` timestamps. The `kb_context` tool returns summaries (not full content) to save tokens — agent reads full doc only when summary looks relevant.
- **Decay:** Moves to warm after 7-14 days of inactivity (conceptual — no automated decay mechanism in the code)
- **Key insight:** Hot tier is really just "recent + high-value doc types get boosted in BM25 ranking"

### Warm Tier — Accumulated Knowledge
- **What:** Proven patterns, validated lessons, stable workflows, research summaries, synthesized insights
- **How it works:** Documents that have been **promoted** from raw captures into structured knowledge (`research`, `lesson`, `workflow`, `idea` types). Retrieved when relevant to the query via FTS5 + semantic hybrid search.
- **Key insight:** The promotion pipeline (classify → synthesize → promote) is what creates warm-tier content. It's not time-based — it's quality-based.

### Cold Tier — Raw Archives
- **What:** Original captures, raw terminal logs, unprocessed clippings, old source material
- **How it works:** Documents in `inbox`, `sources`, raw `capture` types. Retrieved only when deep-diving. Lower BM25 rank because they lack the structured frontmatter (summary, key_topics, tags) that boosted warm/hot docs.
- **Key insight:** Cold tier is never deleted — "raw data has long-tail value." The tier distinction is that cold docs don't have AI-generated summaries, so `kb_context` returns less useful previews for them, naturally deprioritizing them.

### How Tiering Actually Works in Code

There's **no explicit tier field** in the schema. The tiering emerges from:

1. **Document type** — `decision`, `fix`, `session` (hot) vs `research`, `lesson`, `workflow` (warm) vs `capture`, `source` (cold)
2. **Frontmatter richness** — Classified docs have `summary`, `key_topics`, `confidence`, `project` fields. These make `kb_context` results more useful, so agents naturally prefer them.
3. **BM25 ranking weights** — Title is boosted 10x, tags 5x, content 1x. Promoted docs have richer titles/tags, so they rank higher.
4. **Recency** — `indexed_at` timestamp determines what `kb_synthesize` considers "recent"

**Honest assessment:** The three-tier model is more of a design philosophy than a technical implementation. The actual code doesn't enforce tiers — it creates conditions where tiered behavior emerges naturally from the classification + promotion pipeline.

---

## 2. The Intelligence Pipeline (The Real Innovation)

The three-tier model gets the attention, but the **intelligence pipeline** is the actual valuable part:

```
Capture → Classify → Synthesize → Promote → Retrieve → Apply → Capture Again
```

### Capture Layer
Multiple ingest sources, all routing to the same SQLite DB:
- Obsidian vault (bidirectional sync via `indexVault()`)
- YouTube transcripts (via yt-dlp)
- X/Twitter bookmarks
- Web clippings
- Terminal sessions (`kb_capture_session` — records what worked, what failed, root causes)
- Bug fixes (`kb_capture_fix` — symptom, cause, resolution)

### Classification Layer
Uses Claude Haiku to auto-classify unprocessed content:
- Assigns type, tags, project, summary, key_topics, confidence
- Writes structured frontmatter back into the vault note
- This is the key step that transforms cold → warm tier

### Promotion Pipeline
Raw captures get refined into higher-value knowledge:
- `inbox` notes → classified into `research`, `idea`, `workflow`, `lesson`, `decision`
- Uses LLM to extract structured knowledge from raw material
- Promoted notes get richer metadata → rank higher in retrieval

### Synthesis Layer
Weekly cross-cutting analysis:
- Reads recent notes across all types/projects
- Generates prompt for LLM to find recurring themes, contradictions, opportunities
- This is where patterns emerge that no single capture contains

### Token-Optimized Retrieval
**This is the anti-context-drift mechanism:**
- `kb_context` returns summaries + metadata WITHOUT full content → 90%+ token savings
- Agent reviews summaries, then calls `kb_read` only for relevant docs
- `kb_search_smart` combines FTS5 keyword + semantic cosine similarity
- Hybrid search: items found by BOTH methods rank highest

---

## 3. Comparison to Our Current Setup

| Dimension | Their System | Our System | Verdict |
|---|---|---|---|
| **Storage** | Single SQLite DB with FTS5 + embeddings | QMD SQLite + Obsidian vault + MEMORY.md + LCM | We have more layers but less cohesion |
| **Search** | FTS5 BM25 + semantic hybrid search | [[QMD Semantic Search]] (embeddings) | Similar capability, different implementation |
| **Working memory** | `kb_context` summaries (token-optimized) | MEMORY.md (2500 char cap) | They're smarter — summaries vs flat text |
| **Long-term memory** | Promoted knowledge in SQLite + Obsidian | Vault notes + daily notes | Similar, but they have the promotion pipeline |
| **Context drift prevention** | Tiered retrieval + token-optimized summaries | LCM compaction + bounded MEMORY.md | They prevent it at retrieval; we manage it at storage |
| **Knowledge refinement** | Classify → Promote → Synthesize pipeline | Manual vault curation + Vault Keeper agent | They automate what we do manually |
| **Multi-agent sharing** | Single KB server, all agents read/write | Per-agent sessions, shared vault | They have a cleaner shared-brain model |
| **Obsidian integration** | Bidirectional sync, vault is source of truth | Obsidian is storage, QMD indexes it | Very similar |
| **MCP interface** | Full MCP server with 15+ tools | QMD MCP for search only | They have richer MCP tooling |
| **[[Session Capture]]** | Structured capture tools (session, fix, web, youtube) | Daily notes (unstructured) | They capture more structure |

### Where They're Better
1. **Token-optimized retrieval** — `kb_context` returning summaries before full reads is brilliant. We dump full context.
2. **Automated classification** — They use Haiku to classify/tag/summarize every note. We rely on manual tagging.
3. **Structured [[Session Capture]]** — `kb_capture_session` and `kb_capture_fix` create structured, searchable knowledge. Our daily notes are narrative blobs.
4. **The promotion pipeline** — Automated refinement from raw capture → structured knowledge. We don't have this.
5. **Synthesis** — Weekly cross-cutting analysis that finds patterns across sources.

### Where We're Better
1. **LCM compaction** — We have lossless context management that compresses conversation history while preserving retrievability. They don't.
2. **Agent specialization** — Our [[Agent Roster]] (researcher, coder, ops, security, etc.) is more sophisticated than their flat multi-agent model.
3. **Self-evolution** — Our [[Evolution Signals]] → prompt rewriting pipeline is more advanced.
4. **Real-time context** — MEMORY.md gives instant session context without a DB query. Their approach requires searching.
5. **Vault structure** — Our vault with wikilinks, ontology sync, and knowledge graph is richer.

### Where We're Equal
- Obsidian as source of truth
- Semantic search via embeddings
- SQLite as the backing store

---

## 4. Context Drift Prevention — What We Can Steal

Context drift = agent loses track of what matters as conversation grows. Their approach attacks this at multiple levels:

### 4a. Token-Optimized Retrieval (HIGH VALUE — STEAL THIS)
**Their approach:** `kb_context` returns summaries + metadata, not full content. Agent decides what to read in full. 90%+ token savings.

**Our gap:** When we search QMD or read vault notes, we get full content dumped into context. This crowds out working memory.

**Proposal:** Add a `qmd context` command that returns note title + summary + tags + key_topics WITHOUT body text. Agent reviews the list, then `qmd read <id>` for specific notes. This alone would dramatically reduce context pollution.

### 4b. Automated Classification (MEDIUM VALUE — STEAL THIS)
**Their approach:** Every new note gets auto-classified with type, tags, summary, key_topics, confidence via Claude Haiku.

**Our gap:** Our vault notes have inconsistent frontmatter. Many lack summaries. Tags are manual and spotty.

**Proposal:** Add a classification step to our ontology-sync cron. When a new/changed note is detected, run Haiku classification to generate summary + key_topics + tags. Store in frontmatter. This makes `qmd context` useful.

### 4c. Structured Session Capture (MEDIUM VALUE — ADAPT THIS)
**Their approach:** `kb_capture_session` records goal, commands_worked, commands_failed, root_causes, fixes, lessons in structured format.

**Our gap:** Daily notes are narrative. Good for human reading, bad for machine retrieval.

**Proposal:** Add a structured capture section to daily notes or create a separate `sessions/` folder in the vault. When Right Hand finishes a significant task, write a structured capture note with the same fields. This makes past debugging sessions searchable.

### 4d. The Promotion Pipeline (LOWER VALUE — CONSIDER LATER)
**Their approach:** Raw captures get LLM-promoted into structured knowledge notes.

**Our assessment:** We already do this manually via Vault Keeper. Automating it fully risks creating noise. Better to start with classification (4b) and see if manual promotion + Vault Keeper is sufficient.

### 4e. Weekly Synthesis (MEDIUM VALUE — EASY WIN)
**Their approach:** `kb_synthesize` reads recent notes, generates cross-cutting analysis.

**Our gap:** We don't do periodic synthesis. Knowledge accumulates but patterns go unnoticed.

**Proposal:** Add a weekly cron or heartbeat task: read the last 7 days of daily notes + new vault notes, generate a synthesis note at `vault/Research/Weekly/YYYY-WW-synthesis.md`. Low effort, high value.

---

## 5. Multi-Agent Failover (agent-orchestrator)

### How It Works
Single Python file (~1100 lines) wrapping Claude, Codex, and Gemini CLIs:
- **Role-based routing:** `orchestrator` (Claude → Codex → Gemini), `implementation` (Codex → Claude → Gemini), `uidocs` (Gemini → Codex → Claude), `review` (Claude → Codex → Gemini)
- **Next-man-up failover:** If agent 1 fails/is down, try agent 2, then agent 3
- **Auto-downtime detection:** Rate limits, quota exhaustion, auth failures trigger automatic cooldowns
- **CLI wrapping:** Uses subscription CLIs, not per-token API billing
- **KB integration:** Searches knowledge-base-server before each response for context injection

### Assessment

**Strengths:**
- Dead simple — single file, easy to understand and modify
- Cost-effective — $60/month for three premium agents
- Auto-recovery — detects rate limits and auto-disables with timed cooldowns
- Role specialization — routes implementation tasks to Codex, UI tasks to Gemini

**Weaknesses:**
- Naive failover — just tries the next agent, no context about WHY the previous one failed
- No quality routing — doesn't learn which agent is better at what over time
- Single-file architecture — will become unwieldy as features grow
- No persistent conversation — each message is stateless within the orchestrator
- Terminal-only — no API surface for integration with other systems

**Comparison to our setup:**
Our [[Agent Roster]] dispatch protocol is significantly more sophisticated:
- We have intelligent delegation with performance tracking
- We have task scoring (complexity, criticality, reversibility)
- We have bounded retries with different approaches
- We have timeout/fallback chains with learned timeouts
- We track agent performance and route based on history

**Verdict:** Their failover is simpler but less capable. The one useful idea is **auto-downtime detection** — automatically disabling an agent when it hits rate limits and re-enabling after a cooldown. We don't currently handle rate limit failover gracefully.

---

## 6. What We Should Adopt

### Priority 1: Token-Optimized Retrieval (High Impact, Medium Effort)
**What:** Add `qmd context <query>` that returns title + summary + key_topics + tags without body text.
**Why:** Single biggest anti-context-drift measure. Agents review summaries before committing to full reads. Saves 90%+ tokens on knowledge retrieval.
**How:** Modify QMD to support a `--brief` or `context` subcommand. Return structured metadata from the existing SQLite store. If summaries don't exist, fall back to first 200 chars.
**Effort:** ~2-3 hours of QMD modification.

### Priority 2: Auto-Classification on Vault Changes (High Impact, Medium Effort)
**What:** When ontology-sync or QMD detects new/changed vault notes, auto-generate `summary` and `key_topics` frontmatter using Haiku.
**Why:** Makes Priority 1 useful. Without summaries, `qmd context` has nothing to show. Also improves search ranking.
**How:** Add a post-indexing hook to QMD or ontology-sync. For each note without a `summary` field, run Claude Haiku classification. Write results back to frontmatter.
**Effort:** ~3-4 hours. Could batch-process existing notes as a one-time migration.

### Priority 3: Structured Session Capture (Medium Impact, Low Effort)
**What:** After significant tasks, Right Hand writes a structured capture note to `vault/Sessions/` with: goal, what_worked, what_failed, root_cause, fix, lessons.
**Why:** Makes past debugging sessions searchable. Currently buried in narrative daily notes.
**How:** Add a protocol to AGENTS.md: after any task involving debugging, troubleshooting, or significant implementation, write a structured session note. Template in vault.
**Effort:** ~30 minutes to create template + update AGENTS.md.

### Priority 4: Weekly Synthesis (Medium Impact, Low Effort)
**What:** Weekly heartbeat task generates a synthesis note from the past 7 days.
**Why:** Surfaces patterns and connections that accumulate unnoticed.
**How:** Read recent daily notes + new vault notes → prompt Claude to find themes, contradictions, opportunities → write to `vault/Research/Weekly/`.
**Effort:** ~1 hour to create the synthesis prompt + add to heartbeat rotation.

### Priority 5: Rate Limit Failover (Low Impact, Easy)
**What:** When a subagent hits a rate limit, automatically retry with a different model or after a cooldown.
**Why:** Currently if an agent hits Claude's rate limit, it just fails. Should auto-retry.
**How:** Add rate limit detection to the dispatch protocol retry logic. If error contains rate limit patterns, add a cooldown before retry.
**Effort:** ~1 hour.

### Not Adopting
- **Their MCP server architecture** — We already have QMD MCP. Adding another MCP server creates integration complexity without clear benefit.
- **Their promotion pipeline** — Too automated for our vault size. Manual curation + Vault Keeper is sufficient for now.
- **Their multi-agent orchestrator** — Our dispatch protocol is already more sophisticated. Their failover model would be a downgrade.
- **Their SQLite storage layer** — QMD already handles this. No need to replace.

---

## 7. Key Takeaway

The three-tier model is a useful mental framework but their actual code implementation is less sophisticated than the marketing suggests. The tiers emerge naturally from document type + recency + metadata richness rather than being explicitly enforced.

**The real value is in three specific patterns:**
1. **Summary-first retrieval** — Don't dump full documents into context. Show summaries, let the agent choose what to read.
2. **Automated classification** — Every note should have a machine-generated summary and key_topics, regardless of whether the human added them.
3. **Structured capture** — Session logs with structured fields (goal, commands, root_cause, fix) are dramatically more useful than narrative notes.

These three changes would meaningfully reduce our context drift problem without requiring a major architecture overhaul.

---

*Studied from source code analysis of both repos on 2026-03-18. Code is JavaScript (Node.js) for KB server, Python for orchestrator. Both MIT licensed.*

## Related

- [[Memory Architecture]]
- [[Mirror System - Comparison Review]]
- [[Evolution Signals]]
- [[Agent Roster]]
- [[QMD Semantic Search]]
- [[OpenViking Evaluation]]
