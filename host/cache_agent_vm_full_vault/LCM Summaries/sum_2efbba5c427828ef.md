# LCM Summary sum_2efbba5c427828ef

Created: 2026-03-24 16:09:13
Kind: leaf
Depth: 0
Conversation: 698
Tokens: 1215
Descendants: 0
Earliest: 2026-03-24T02:37:25.000Z
Latest: 2026-03-24T04:44:35.000Z

## Content

[2026-03-24 02:37 UTC]
Here's everything the vault has on Hermes agent:

---

## Hermes Agent — Full Intel Dump

**Source:** NousResearch/hermes-agent · MIT license · ~7k stars (was growing +4.8k/week at research time)
**Website:** hermes-agent.nousresearch.com

---

### What It Is

Nous Research's self-improving AI agent. Python-based, persistent server process, multi-platform messaging. Headline differentiator: **closed learning loop** — it creates skills from experience, improves them during use, nudges itself to persist knowledge, and builds a user model across sessions.

Positioning: "The only agent with a built-in learning loop." They also built a `hermes claw migrate` command specifically to import from OpenClaw (SOUL.md, skills, API keys, memories) — they explicitly see OpenClaw users as their target audience.

---

### Architecture

**Core loop** (`run_agent.py`, 6,211 lines):
```
while iterations < max:
    response = llm(messages, tools)
    if tool_calls: execute + append results
    else: return final response
```

**48+ built-in tools**, parallel execution (8 workers).

**Seven messaging platforms:** Telegram, Discord, Slack, WhatsApp, Signal, Email, Home Assistant — all from one gateway process.

**6 terminal backends:** Local, Docker, SSH, Daytona, Singularity, Modal (serverless).

---

### The Learning Loop (4 pillars)

**1. Memory nudges** — Every 10 user turns, system injects:
> "You've had several exchanges. Consider whether there's anything worth saving to memory."
Counter resets when memory tool is actually used.

**2. Skill creation nudges** — After 15+ consecutive tool iterations:
> "That was complex. Consider saving it as a skill."

**3. FTS5 session search** — SQLite-backed full-text search over all past conversations. On match: finds → groups by session → truncates around hits → summarizes with a cheap model (Gemini Flash). Returns focused summaries, not raw transcripts.

**4. Honcho dialectic user modeling** — External service (plastic-labs/honcho) that builds a deepening "peer card" about the user: name, preferences, communication style, patterns. Separate from agent memory — a clean architectural separation between *facts about the environment* and *facts about the user*.

---

### Memory System

Two bounded files, frozen at session start (preserves prefix cache):

| File | Purpose | Limit |
|---|---|---|
| `MEMORY.md` | Environment, tool quirks, project facts | 2,200 chars |
| `USER.md` | User preferences, style, patterns | 1,375 chars |

**Delimiter:** `§` (section sign) — unambiguous, easy substring matching.
**At 80% capacity:** must consolidate before adding.
**Security:** Injection scanning on all writes (prompt injection, role hijack, exfil patterns, hidden unicode).

System prompt shows: `[67% — 1,474/2,200 chars]` — agent knows capacity without counting.

---

### Skills System

**Progressive disclosure (3 levels):**
- L0: category list (~3k tokens total)
- L1: full SKILL.md for specific skill
- L2: specific file within skill dir

**Agent-managed:** Agent can autonomously `create`, `edit`, `patch`, `delete` skills from experience. `patch` preferred (surgical, token-efficient).

**When agent creates a skill:** after 5+ tool calls, after hitting errors and finding working path, after user corrections, after non-trivial workflows.

**Conditional activation** via frontmatter:
- `requires_toolsets` — only show when toolset available
- `fallback_for_toolsets` — only show when toolset missing (e.g., DDG appears when web search key absent)

**Compatible with:** agentskills.io open standard, ClawHub, LobeHub, GitHub.

---

### Subagent Delegation

- Max depth: 2, max concurrent: 3
- Fresh conversation, restricted toolset, isolated terminal
- **Shared iteration budget** — child tool calls count toward parent's limit (runaway prevention)
- Credential routing: children can use cheaper models
- Progress relay: child tool calls shown in parent's display

---

### Hermes Ouroboros (separate project)

A different thing — `Ridwannurudeen/hermes-ouroboros`, built on Hermes-3 model, not the agent. 5-adversarial-agent debate system:

| Agent | Role |
|---|---|
| Advocate | Steel-man the idea |
| Skeptic | Find the fatal flaw (Popperian) |
| Oracle | What does evidence actually show |
| Contrarian | Reject the framing entirely |
| Arbiter | Bayesian synthesis → verdict |

Debate generates DPO training pairs for model self-improvement. Very new at research time (0 stars). The patterns are worth stealing (especially Skeptic/Arbiter), but the DPO loop requires local fine-tuning so it doesn't apply to API-based setups.

---

### How It Compares to Your Stack

| Feature | Hermes | OpenClaw + Your Setup |
|---|---|---|
| Self-improvement | Built-in, autonomous | Modular (3 separate skills) |
| Memor
[LCM fallback summary; truncated for context management]
