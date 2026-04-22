---
title: "Hermes Agent Architecture Study"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: agent-research
tags: [obsidian, openclaw, prompts, research, security, skills]
summary: "[[Hermes Agent]] is Nous Research's self-improving AI agent — a Python-based system with a CLI TUI, multi-platform messaging gateway (Telegram, Disc"
---
# Hermes Agent Architecture Study

**Date:** 2026-03-16
**Source:** [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)
**Status:** Deep analysis complete

---

## 1. Project Overview

[[Hermes Agent]] is Nous Research's self-improving AI agent — a Python-based system with a CLI TUI, multi-platform messaging gateway (Telegram, Discord, Slack, WhatsApp, Signal), and a closed learning loop. It's the most direct competitor/inspiration for our [[OpenClaw]] setup.

Key tagline: *"The only agent with a built-in learning loop — it creates skills from experience, improves them during use, nudges itself to persist knowledge, searches its own past conversations, and builds a deepening model of who you are across sessions."*

### Core Tech Stack
- **Language:** Python (sync agent loop, async for summarization)
- **LLM Interface:** OpenAI-compatible API (`chat.completions.create`)
- **State Store:** SQLite with WAL mode + FTS5 full-text search
- **User Modeling:** Honcho (external AI-native memory service)
- **Skills Standard:** [agentskills.io](https://agentskills.io) open format
- **Terminal Backends:** Local, Docker, SSH, Daytona, Singularity, Modal

---

## 2. Architecture Deep Dive

### 2.1 Core Agent Loop (`run_agent.py`)

The heart is `AIAgent.run_conversation()` — a synchronous while loop:

```python
while api_call_count < self.max_iterations and self.iteration_budget.remaining > 0:
    response = client.chat.completions.create(model, messages, tools)
    if response.tool_calls:
        for tool_call in response.tool_calls:
            result = handle_function_call(tool_call.name, tool_call.args, task_id)
            messages.append(tool_result_message(result))
        api_call_count += 1
    else:
        return response.content
```

Key [[design decisions]]:
- **Iteration budget** shared between parent and child agents — subagent tool calls count toward the session-wide limit
- **Nudge system** — periodic injections into user messages to remind the agent to save memories and create skills
- **Prompt caching** — system prompt is frozen at session start; mid-session memory writes don't alter it (preserves Anthropic prefix cache)

### 2.2 Memory System (`tools/memory_tool.py`)

Two bounded, file-backed stores:
- **MEMORY.md** — agent's personal notes (environment facts, project conventions, tool quirks). 2,200 char limit.
- **USER.md** — user profile (preferences, communication style, workflow habits). 1,375 char limit.

**Key design choices:**
- **Entry delimiter:** `§` (section sign) — entries can be multiline
- **Frozen snapshot pattern:** Memory is loaded into system prompt once at session start. Mid-session writes update files on disk immediately but do NOT change the system prompt. This preserves the prefix cache for the entire session. The snapshot refreshes on next session start.
- **Substring matching for edits:** `replace` and `remove` use short unique substring matching (not full text or IDs)
- **Injection scanning:** Memory content is scanned for prompt injection patterns before being accepted (invisible unicode, exfil patterns, role hijack attempts)
- **Atomic writes:** Uses temp-file + `os.replace()` for crash-safe persistence

**Memory nudge system:** Every N user turns (configurable, default 10), the agent appends to the user message:
```
[System: You've had several exchanges in this session. Consider whether there's anything worth saving to your memories.]
```
Counter resets whenever the memory tool is actually used.

### 2.3 Skills System (`tools/skills_tool.py`, `tools/skill_manager_tool.py`)

Skills are **procedural memory** — they capture *how to do a specific type of task* based on proven experience. Stored as directory-based SKILL.md files in `~/.hermes/skills/`.

**Progressive disclosure architecture:**
1. **Tier 0:** `skills_categories()` — category names + descriptions
2. **Tier 1:** `skills_list()` — name + description per skill (minimal tokens)
3. **Tier 2:** `skill_view(name)` — full SKILL.md content + linked files list
4. **Tier 3:** `skill_view(name, file_path)` — specific reference/template/script

**Skill creation nudge:** After 15+ consecutive tool-calling iterations (configurable), on the next user message:
```
[System: The previous task involved many steps. If you discovered a reusable workflow, consider saving it as a skill.]
```

**Skill management actions:** create, edit, patch, delete, write_file, remove_file
- Security scanning on every write (injection detection)
- YAML frontmatter validation (name, description required)
- Platform filtering (macos/linux/windows)
- Environment variable requirements with interactive setup

**Compatible with agentskills.io open standard** — hub install, bundled skills, community sharing.

### 2.4 FTS5 Session Search (`hermes_state.py`, `tools/session_search_tool.py`)

SQLite-backed session storage with full-text search across all past conversations.

**Database schema:**
- `sessions` table: id, source, user_id, model, system_prompt, parent_session_id, token counts, title
- `messages` table: session_id, role, content, tool metadata, timestamps
- `messages_fts` virtual table: FTS5 index on message content with triggers for insert/update/delete

**Search flow:**
1. FTS5 query finds matching messages ranked by relevance
2. Groups by session, takes top N unique sessions (default 3)
3. Resolves child sessions to parent (delegation chains)
4. Loads each session's conversation, truncates to ~100k chars centered on matches
5. Sends to auxiliary LLM (Gemini Flash) with focused summarization prompt
6. Returns per-session summaries with metadata

**FTS5 query sanitization:** Strips special characters (`+{}()"^`), collapses `*`, removes dangling boolean operators — prevents `sqlite3.OperationalError` on user input.

**Session titles:** Sessions can be named (unique, max 100 chars) with lineage support (`"my session" → "my session #2" → "my session #3"`).

### 2.5 Honcho Dialectic User Modeling

[Honcho](https://github.com/plastic-labs/honcho) is an external AI-native memory service that builds a deepening model of who the user is across sessions.

**Integration architecture:**
- `honcho_integration/client.py` — config resolution from `~/.honcho/config.json` or env vars
- `honcho_integration/session.py` — `HonchoSessionManager` with async write queue, peer management
- `tools/honcho_tools.py` — three complementary tools:
  - `honcho_context` — dialectic Q&A (LLM-powered, direct answers about the user)
  - `honcho_search` — semantic search (fast, no LLM, raw excerpts)
  - `honcho_profile` — peer card (structured facts about the user)

**Dialectic user modeling** means Honcho maintains a "peer card" — a curated list of facts about the user (name, role, preferences, communication style, patterns). This card is built dialectically through conversation analysis, not just raw storage.

**Recall modes:**
- `hybrid` — auto-injected context + Honcho tools available (model decides)
- `context` — auto-injected context only, Honcho tools removed
- `tools` — Honcho tools only, no auto-injected context

**Memory modes:**
- `hybrid` — both Hermes MEMORY.md and Honcho active
- `honcho` — Honcho handles all memory, Hermes memory disabled

**Write frequency:** async (background thread), turn (sync per turn), session (flush on end), or integer (every N turns).

**Key insight:** Honcho separates *user modeling* from *agent memory*. The agent's MEMORY.md stores environment/tool knowledge; Honcho stores *who the user is*. This is a cleaner separation than having one monolithic memory.

### 2.6 Subagent Delegation (`tools/delegate_tool.py`)

Spawns child `AIAgent` instances with isolated context:

**Design:**
- Fresh conversation (no parent history)
- Own task_id (own terminal session, file ops cache)
- Restricted toolset (configurable, blocked tools always stripped: `delegate_task`, `clarify`, `memory`, `send_message`, `execute_code`)
- Focused system prompt built from goal + context
- **Max depth: 2** (parent → child → grandchild rejected)
- **Max concurrent: 3** children via `ThreadPoolExecutor`
- **Shared iteration budget** — subagent tool calls count toward session-wide limit

**Batch mode:** Up to 3 tasks run in parallel. Each gets isolated context and terminal session. Results returned together, sorted by task_index.

**Progress relay:** Child tool calls are relayed to parent's display (CLI spinner or gateway callback).

**Credential routing:** Children can run on different provider:model pairs (e.g., cheap/fast model on OpenRouter while parent runs on Nous Portal).

### 2.7 Context Compression (`agent/context_compressor.py`)

Auto-compresses context when approaching model limits. Triggers session splitting via `parent_session_id` chains — compressed sessions link to their predecessors.

### 2.8 Prompt Builder (`agent/prompt_builder.py`)

Assembles system prompt from:
1. Agent identity (default or SOUL.md)
2. Platform hints (WhatsApp, Telegram, Discord, etc.)
3. Skills index (compact listing of available skills)
4. Context files (AGENTS.md, .cursorrules, SOUL.md)
5. Memory guidance
6. Session search guidance
7. Skills guidance

**Security:** Context files are scanned for prompt injection before loading (threat patterns, invisible unicode, HTML injection, exfiltration attempts).

---

## 3. The Learning Loop — How Self-Improvement Happens

This is [[Hermes Agent]]'s key differentiator. The learning loop has four pillars:

### 3.1 Memory Nudges → Persistent Facts
Every 10 user turns, the system injects a reminder to save memories. This creates a steady drip of preference/environment knowledge into MEMORY.md and USER.md, without requiring the user to explicitly ask.

### 3.2 Skill Nudges → Procedural Memory
After 15+ consecutive tool iterations, the system reminds the agent to consider saving the workflow as a skill. This turns complex multi-step solutions into reusable procedures.

### 3.3 Session Search → Cross-Session Recall
FTS5 search + LLM summarization allows the agent to recall past conversations. The agent is instructed to proactively search when users reference past work ("we did this before", "remember when", "last time").

### 3.4 Honcho → Deepening User Model
Every conversation contributes to Honcho's dialectic user model. Over time, the agent builds an increasingly accurate understanding of who the user is — not just what they've said, but their patterns, preferences, and working style.

**The loop is closed:** Experience → Memory/Skills → Better future performance → More experience. Each component feeds the others.

---

## 4. Comparison: Hermes Agent vs Our System

### 4.1 Memory Architecture

| Aspect | [[Hermes Agent]] | Our System ([[OpenClaw]] + Vault) |
|--------|-------------|-------------------------------|
| **Short-term** | Frozen MEMORY.md snapshot in system prompt (2,200 chars) | `MEMORY.md` loaded at startup, manually curated |
| **Long-term** | FTS5 session search + LLM summarization | Obsidian vault + `qmd search` semantic search |
| **User model** | Honcho dialectic modeling (external service) | `vault/Trajan/Preferences.md` + `USER.md` (manual) |
| **Procedural** | Skills system (agentskills.io standard) | ClawHub skills + workspace SKILL.md files |
| **Daily context** | Session DB with titles and lineage | `memory/YYYY-MM-DD.md` daily notes |
| **Nudges** | Automatic memory/skill creation reminders | None — relies on SOUL.md instructions |
| **Char limits** | Hard limits (2,200/1,375 chars) with usage tracking | No hard limits, grows unbounded |

**Their advantages:**
- **Nudge system is brilliant.** Automatic reminders to persist knowledge mean the agent actually follows through on [[self-learning]] without explicit user prompts.
- **Hard memory limits force curation.** Our MEMORY.md can grow without bound, accumulating stale entries. Their bounded approach forces the agent to replace/consolidate.
- **FTS5 session search with summarization** is more structured than our LCM grep. They search → find → summarize, keeping the main context clean.
- **Separation of user modeling (Honcho) from agent memory** is architecturally cleaner than our single-file approach.

**Our advantages:**
- **Obsidian vault is far richer.** We have a full knowledge graph with semantic search, wikilinks, ontology sync, and QMD embeddings. Their MEMORY.md is 2,200 chars.
- **Daily notes give temporal context.** We can reconstruct what happened on any day. They rely on session search.
- **Our vault persists research, decisions, and analysis.** Their system only stores compact memory entries and skills. We store full research documents.
- **Semantic search (QMD) vs keyword search (FTS5).** Our embedding-based search understands meaning; theirs requires exact keywords.

### 4.2 Agent Architecture

| Aspect | [[Hermes Agent]] | Our System |
|--------|-------------|------------|
| **Core** | Single Python process, sync loop | [[OpenClaw]] gateway + Claude Code processes |
| **Sub-agents** | In-process `ThreadPoolExecutor`, shared memory | `sessions_spawn` → separate Claude Code processes |
| **Max depth** | 2 (parent → child) | Unlimited (but practical ~2-3) |
| **Max parallel** | 3 concurrent children | Unlimited (system resources permitting) |
| **Context isolation** | Fresh conversation, stripped tools | Full Claude Code session, own workspace |
| **Progress** | Spinner + tool call relay | Discord messages with delegation notation |
| **Budget** | Shared iteration budget across parent+children | Independent per-agent |

**Their advantages:**
- **Shared iteration budget** prevents runaway subagents — total work is bounded.
- **In-process delegation** is faster (no process spawn overhead) and allows direct progress relay.
- **Credential routing** lets subagents use cheaper models automatically.

**Our advantages:**
- **Full Claude Code sessions** give subagents complete tool access, not a restricted subset.
- **Persistent workspaces** — our agents can leave artifacts that survive the session.
- **Richer communication** — Discord-native updates with identity bars, not just spinner text.
- **No depth limit for complex orchestration** — Orchestrator can coordinate arbitrary agent graphs.

### 4.3 Skills System

| Aspect | [[Hermes Agent]] | Our System |
|--------|-------------|------------|
| **Format** | agentskills.io standard (YAML frontmatter + SKILL.md) | ClawHub format (similar SKILL.md) |
| **Discovery** | Progressive disclosure (categories → list → view) | Available skills in system prompt |
| **Creation** | Agent can autonomously create skills via `skill_manage` tool | Agent can't create skills autonomously |
| **Nudges** | Automatic after 15+ tool iterations | None |
| **Security** | Injection scanning on all writes | Relies on ClawHub review |
| **Hub** | agentskills.io + built-in hub browser | ClawHub |

**Their advantage:** Agent-autonomous skill creation with nudges is a genuine self-improvement mechanism. Our agent can use skills but can't create them from experience.

---

## 5. Specific Ideas to Implement

### Idea 1: Memory & Skill Nudge System
**What:** Inject periodic system reminders into user messages to prompt the agent to persist knowledge and create reusable procedures.
**Implementation:**
- Track turns since last memory write, tool iterations since last skill creation
- Every N user turns, append: `[System: Consider whether there's anything worth saving to memory.]`
- After M+ consecutive tool calls, append: `[System: That was a complex workflow. Consider saving it as a reusable procedure.]`
**Why:** Our SOUL.md says "track preferences" and "update prompts" but relies on the agent remembering to do it. Nudges make it automatic. This is the single highest-impact change.

### Idea 2: Bounded Memory with Usage Tracking
**What:** Add hard character limits to MEMORY.md with usage percentage display, forcing curation over accumulation.
**Implementation:**
- Set a cap (e.g., 3,000 chars for MEMORY.md, 2,000 for preferences)
- Show usage in system prompt: `[78% — 2,340/3,000 chars]`
- When near limit, agent must replace or consolidate rather than append
**Why:** Unbounded memory accumulates stale entries. Bounded memory forces the agent to decide what's actually important, resulting in higher-quality persistent knowledge.

### Idea 3: FTS5 Session Search with LLM Summarization
**What:** Index all session transcripts in SQLite FTS5 and provide a `session_search` tool that returns focused summaries rather than raw transcripts.
**Implementation:**
- Store all conversation messages in SQLite with FTS5 virtual table
- On search: FTS5 finds matches → group by session → truncate around matches → summarize with cheap model
- Agent uses this proactively when user references past work
**Why:** Our LCM grep is powerful but returns raw context. Their approach keeps the main model's context clean by summarizing past sessions rather than dumping raw transcripts. This complements [[QMD semantic search]].

### Idea 4: Autonomous Skill Creation from Experience
**What:** Give the agent a `skill_manage` tool that can create, edit, and maintain skills from successful workflows.
**Implementation:**
- After complex tasks, agent can write a SKILL.md capturing the approach
- Skills stored in workspace/skills/ with proper frontmatter
- Security scanning on all writes (injection detection)
- Agent can also patch/improve existing skills during use
**Why:** Currently only we can create skills. Letting the agent create them from experience closes the learning loop — complex solutions become reusable procedures automatically.

### Idea 5: Separated User Modeling
**What:** Create a dedicated, structured user model separate from general agent memory.
**Implementation:**
- `vault/Trajan/User Model.md` with structured sections: preferences, communication style, workflow patterns, tools/environment, decision patterns
- Distinguish between *facts about the user* (stable, curated) and *agent notes* (environment, tool quirks)
- Update proactively after interactions that reveal preferences
**Why:** Hermes's Honcho separation is architecturally clean. We already have `Preferences.md` but it's unstructured. A structured user model with explicit categories would be more useful for context injection.

---

## 6. Architecture Diagram

```
Hermes Agent Architecture
═══════════════════════════

┌─────────────────────────────────────────┐
│              Entry Points               │
│  CLI (TUI) │ Telegram │ Discord │ ...   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│           AIAgent (run_agent.py)         │
│                                         │
│  ┌──────────┐  ┌────────────────────┐   │
│  │ System   │  │  Conversation      │   │
│  │ Prompt   │  │  Loop (sync)       │   │
│  │ Builder  │  │  ┌──────────────┐  │   │
│  │          │  │  │ Tool Calls   │  │   │
│  │ Identity │  │  │ ─────────►   │  │   │
│  │ Memory   │  │  │ Results      │  │   │
│  │ Skills   │  │  │ ◄─────────   │  │   │
│  │ Context  │  │  │ Nudges ↻     │  │   │
│  │ Honcho   │  │  └──────────────┘  │   │
│  └──────────┘  └────────────────────┘   │
└──────┬──────────┬───────────┬───────────┘
       │          │           │
       ▼          ▼           ▼
┌──────────┐ ┌─────────┐ ┌──────────────┐
│ Memory   │ │ Skills  │ │ Session DB   │
│ Store    │ │ System  │ │ (SQLite+FTS5)│
│          │ │         │ │              │
│ MEMORY.md│ │ ~/.hermes│ │ sessions     │
│ USER.md  │ │ /skills/│ │ messages     │
│ (bounded)│ │         │ │ messages_fts │
└──────────┘ └─────────┘ └──────────────┘
                              │
                    ┌─────────┘
                    ▼
              ┌──────────┐     ┌──────────┐
              │ Session  │     │ Honcho   │
              │ Search   │     │ (ext.)   │
              │ (FTS5 +  │     │          │
              │  LLM     │     │ Dialectic│
              │  Summary)│     │ User     │
              └──────────┘     │ Modeling │
                               └──────────┘
```

---

## 7. Notable Implementation Details

### Prompt Caching Discipline
Hermes is extremely careful about prefix cache stability. Memory is loaded once at session start as a "frozen snapshot." Mid-session writes update files on disk but never alter the system prompt. This is documented as a hard policy: *"Do NOT implement changes that would alter past context mid-conversation."*

### Security Scanning
Both memory content and skill content are scanned for injection before acceptance. Patterns include: prompt injection (`ignore previous instructions`), role hijack (`you are now`), exfiltration (`curl ... $API_KEY`), SSH backdoors, and hidden HTML. This is applied to context files (AGENTS.md, SOUL.md) before system prompt injection too.

### Migration from OpenClaw
Hermes includes a dedicated `hermes claw migrate` command that imports SOUL.md, memories, skills, API keys, messaging settings, and command allowlists from [[OpenClaw]]. This suggests they see [[OpenClaw]] users as a target audience.

### Skin/Theme Engine
A data-driven CLI theming system with built-in skins (default, ares, mono, slate) and user-created YAML skins. Pure data — no code changes needed. This is a nice UX touch.

---

## 8. Key Takeaways

1. **The nudge system is the most important pattern to adopt.** It's simple, low-cost, and directly addresses the gap between "the agent should learn" and "the agent actually learns."

2. **Bounded memory with usage tracking** forces quality over quantity. Our unbounded approach lets stale entries accumulate.

3. **Their session search (FTS5 + summarization) is complementary to our QMD.** FTS5 for keyword/exact match, QMD for semantic. We should have both.

4. **Agent-autonomous skill creation** is the missing piece in our self-improvement loop. We have skills but the agent can't create them.

5. **Honcho's user modeling separation** is architecturally sound. We should formalize our user model structure even if we don't use Honcho.

6. **Their subagent model is simpler but more constrained** than ours. In-process threading with shared budgets vs our full Claude Code processes. Ours is more powerful; theirs is more controlled.

---

*Filed by 🔬 Researcher subagent. Source: `/tmp/hermes-agent/` (cloned repo).*

## Related

- [[Agent-Architecture-Synthesis-2026-03]]
- [[LangChain-Deep-Agents]]
- [[Nudge System Implementation]]
