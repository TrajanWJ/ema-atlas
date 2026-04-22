---
title: "Deer-Flow Implementation Patterns"
type: reference
created: 2026-03-24
confidence: 0.88
tags: [deer-flow, bytedance, multi-agent, orchestration, research, implementation, patterns]
summary: "Extractable patterns from DeerFlow 2.0 for OpenClaw/Claude Code: middleware chains, progressive skills, structured memory, concurrency limits, config versioning."
---

# DeerFlow Implementation Patterns

> **Source report:** [[Deer-Flow Research]] (2026-03-24)  
> **Source repo:** [bytedance/deer-flow](https://github.com/bytedance/deer-flow)  
> **Purpose:** Concrete implementation guide — steal these patterns for [[OpenClaw]] + [[Hermes Agent]] + Claude Code setup  
> **See also:** [[Multi-Agent Coordination Patterns]], [[DeerFlow Architecture Study]]

---

## Priority Matrix

| Pattern | Priority | Difficulty | Impact |
|---------|----------|-----------|--------|
| Progressive Skill Loading | **High** | Medium | Reduces context overhead by ~40% |
| Execution Mode Taxonomy | **High** | Easy | Better UX + dispatch clarity |
| Ordered Middleware Chain | **High** | Medium | Predictable agent behavior |
| Structured Memory Tiers | **Medium** | Medium | More queryable long-term memory |
| Concurrency Limits in System Prompt | **Medium** | Easy | Prevents subagent pile-up |
| Tool Filtering Per Agent | **Medium** | Easy | Reduced attack surface, cleaner tool space |
| Config Versioning | **Low** | Easy | Maintainability |
| Per-User Session Overrides | **Low** | Medium | VIP/power user differentiation |
| Dangling Tool Call Recovery | **Low** | Hard | Edge case robustness |

---

## Pattern 1: Progressive Skill Loading

### What It Does
DeerFlow starts each session with only skill names + one-line summaries in context. When the agent selects a skill for a task, the full SKILL.md content is injected for that turn only. Other skills stay out of context.

### Why It's Good
Our current `available_skills` block in the system prompt injects ALL skill descriptions at session startup. For a system with 10+ skills, this burns 2K-4K tokens on context that's irrelevant to 90% of requests. DeerFlow's approach keeps the hot path lean while preserving full capability reach.

### How to Implement in OpenClaw

**Step 1: Modify system prompt structure**

Current (wasteful):
```
<available_skills>
  <skill>
    <name>prose</name>
    <description>[full description paragraph]</description>
    <location>...</location>
  </skill>
  <skill>
    <name>coding-agent</name>
    <description>[full description paragraph]</description>
    ...
  </skill>
  ...
</available_skills>
```

Target (lean):
```
<available_skills>
  prose | OpenProse multi-agent writing workflows
  coding-agent | Delegate coding to Codex/Claude Code
  discord | Discord ops via message tool
  gh-issues | GitHub issue automation with PR spawning
  github | GitHub CLI operations
  weather | Current weather and forecasts
  [etc]
</available_skills>
<skill_loading>
  Select a skill by name. Full SKILL.md will be injected when selected.
</skill_loading>
```

**Step 2: Agent reads SKILL.md on selection (current behavior)**
The agent already does `Read` on the SKILL.md when it matches. The change is just removing the verbose descriptions from the initial context — keeping only name + one-liner.

**Step 3: Validate no skill regressions**
Test that 10 common task types still trigger the right skill with one-liner descriptions only.

### Difficulty: Medium
Requires modifying OpenClaw system prompt generation and testing skill trigger accuracy.

### Priority: High
This is our most actionable gap. Conservative estimate: saves 2K+ tokens per session on the common case.

---

## Pattern 2: Execution Mode Taxonomy

### What It Does
DeerFlow exposes four named execution modes that map to different orchestration depths:

| Mode | Behavior |
|------|----------|
| Flash | Single-pass, no planning, fast |
| Standard | Normal agent loop |
| Pro | Explicit plan-before-execute |
| Ultra | Full sub-agent orchestration, multi-hour capable |

### Why It's Good
Clean UX abstraction. Users don't need to understand agent internals — they pick a mode. Also enables cost optimization: Flash for simple queries, Ultra for complex research. Forces explicit thinking about orchestration depth.

### How to Implement in OpenClaw

Map to our dispatch system in [[Hermes Agent]] (Right Hand):

| DeerFlow Mode | OpenClaw Equivalent | When to Use |
|---------------|--------------------|-|
| Flash | Direct response, no subagents | Factual questions, simple commands |
| Standard | Single specialist subagent | Focused tasks (research, code review) |
| Pro | Right Hand with planning turn | Multi-step workflows needing coordination |
| Ultra | Full multi-agent orchestration | Complex research + implementation tasks |

**Implementation options:**

A) **Explicit trigger words** in user messages: "quick:", "plan:", "research+implement:"

B) **Complexity classifier** in Right Hand — short message → Flash, keywords like "research", "implement", "compare" → appropriate mode

C) **Discord slash command** `/mode flash|standard|pro|ultra` that sticks for session

Option B is most seamless. Right Hand already classifies tasks — add a complexity dimension alongside the existing agent-selection logic.

### Difficulty: Easy
Just naming/formalizing what Right Hand already does implicitly.

### Priority: High
UX and efficiency win. Prevents over-orchestration for simple tasks.

---

## Pattern 3: Ordered Middleware Chain

### What It Does
DeerFlow's lead agent runs through 11 middlewares in strict, load-bearing order before each LLM invocation. Each handles one cross-cutting concern. The order matters: summarization must run before memory queuing; clarification interception must be last.

### Why It's Good
Our agent behavior is currently encoded as prose in AGENTS.md / SOUL.md — unordered, hard to reason about, easy to accidentally conflict. A formal middleware chain makes behavior:
- **Predictable** — same order every invocation
- **Testable** — each middleware is independently testable
- **Composable** — add/remove/reorder without touching other concerns
- **Debuggable** — can log which middleware fired on each turn

### How to Implement in OpenClaw

We can't implement LangGraph middleware directly, but we CAN adopt the conceptual model in our system prompts and AGENTS.md:

**Formalize the implicit processing order in Right Hand:**

```markdown
## Processing Order (mandatory, in sequence)

1. **Context Check** — Is this a continuation or new task? Load relevant session state.
2. **Upload Detection** — Any files in message? Note and prepare for injection.
3. **Token Budget** — Near limit? Summarize older context before proceeding.
4. **Task Classification** — Flash/Standard/Pro/Ultra? Single or multi-agent?
5. **Memory Recall** — Check relevant vault context, previous related tasks.
6. **Tool Planning** — What tools will be needed? Any tool denials apply?
7. **Subagent Limit Check** — Count planned subagents. If >3: batch.
8. **Clarification Gate** — Sufficient info to proceed? If not: ask (MUST BE LAST).
```

This is declarative middleware in AGENTS.md prose, but it establishes the correct ordering guarantees.

**Critically: implement #5 (Token Budget) and #7 (Subagent Limit Check)** — these are the two we currently skip.

### Difficulty: Medium
Refactoring AGENTS.md to explicit ordered processing + testing that the agent follows it.

### Priority: High
Particularly valuable for the token budget and subagent limit steps.

---

## Pattern 4: Structured Memory Tiers

### What It Does
DeerFlow's memory is structured JSON with semantic sections:
```json
{
  "user": {
    "workContext": "Current projects, technical stack, working patterns",
    "personalContext": "Name, preferences, communication style",
    "topOfMind": "Active concerns, recent problems, current focus"
  },
  "history": {
    "recentMonths": "Last 1-3 months of notable interactions",
    "earlierContext": "3-12 months back",
    "longTermBackground": "Foundational context, stable facts"
  },
  "facts": ["fact1", "fact2"]
}
```

Memory is updated asynchronously by a separate LLM call after each session, using a prompt that extracts durable facts and updates each section.

### Why It's Good
Our current memory is flat Markdown (MEMORY.md + daily notes). Queryable sections mean:
- `topOfMind` can be injected selectively for relevant tasks
- `workContext` can be injected for coding tasks only
- `facts` array can be fast-scanned without loading full memory
- Time-bucketed history prevents old context polluting the current session

### How to Implement in OpenClaw

**Option A: Migrate MEMORY.md to structured YAML sections**
```yaml
# memory.yaml
user:
  workContext: "OpenClaw agent stack on agent-vm (192.168.122.10). Claude Max via Claude Code. Vault at ~/vault."
  personalContext: "Trajan. UTC. Prefers direct, fast communication. No filler."
  topOfMind: ""  # Updated each session
history:
  recentMonths: ""
  earlierContext: ""
  longTermBackground: ""
facts:
  - "Vault is Obsidian at /home/trajan/vault/"
  - "Discord is primary channel"
  - "Researcher agent runs on agent-vm"
```

**Option B: Add async memory update step to Right Hand**
After each substantive session, Right Hand spawns a quick `memory-updater` subagent that:
1. Reads the session transcript
2. Extracts any new `topOfMind` items, facts, or context updates
3. Writes to structured memory file

### Difficulty: Medium
Memory migration is straightforward. The async update step requires Right Hand changes.

### Priority: Medium
Our current memory is functional. This is an improvement, not a fix.

---

## Pattern 5: Concurrency Limits in System Prompt

### What It Does
DeerFlow's lead agent system prompt explicitly encodes a "count-then-batch" algorithm:
1. Before spawning subagents, count total subtasks in thinking
2. If count > N (typically 3): batch into groups of N
3. Execute each batch in parallel; wait for batch before starting next
4. Synthesize at end

This is encoded in the **system prompt**, not the framework — making it portable.

### Why It's Good
Without explicit concurrency limits, agents can spiral into spawning 8+ subagents simultaneously, causing:
- Token budget explosions
- Rate limit hits
- Hard-to-debug parallel failures
- Resource exhaustion on small VMs

### How to Implement in OpenClaw

Add to Right Hand's AGENTS.md (or equivalent):
```markdown
## Subagent Concurrency Protocol

Before spawning any subagents:
1. Count the total subtasks needed
2. If count ≤ 3: spawn all in parallel
3. If count > 3: batch into groups of 3, execute groups sequentially
4. Never spawn more than 3 subagents simultaneously
5. Wait for all agents in a batch to complete before starting the next batch
6. Synthesize all results in a final pass
```

This is a system prompt change, takes 5 minutes, and prevents a class of failure we've seen empirically.

### Difficulty: Easy
Just adding to system prompt.

### Priority: Medium
We've hit this issue before. Implement during next AGENTS.md update.

---

## Pattern 6: Tool Filtering Per Agent

### What It Does
Each DeerFlow sub-agent gets a filtered tool set. `general-purpose` gets web + file read/write. `bash` gets execution tools only. Neither gets access to tools irrelevant to its role.

DeerFlow config:
```yaml
tool_groups:
  - name: web          # web_search, web_fetch
  - name: file:read    # ls, read_file
  - name: file:write   # write_file, str_replace
  - name: bash         # bash command execution
```

Sub-agents are assigned tool groups, not individual tools.

### Why It's Good
Our specialists currently get full tool access. Vault Keeper doesn't need browser tools. Researcher doesn't need bash execution. Giving each specialist only what it needs:
- Reduces LLM confusion about which tools to use
- Limits blast radius of mistakes
- Makes tool selection cleaner (fewer options = clearer choice)

### How to Implement in OpenClaw

Define tool groups per agent in each AGENTS.md/SOUL.md:

**Researcher:**
```
Tools: web_search, web_fetch, Read, Write, exec (read-only commands)
Deny: browser automation, message sending, sessions_spawn
```

**Vault Keeper:**
```
Tools: Read, Write, Edit, exec (vault operations), sessions_spawn (limited)
Deny: web_search, web_fetch, browser
```

**Right Hand:**
```
Tools: All (orchestrator needs full access)
```

This is documentation today but could be enforced via system prompt injections.

### Difficulty: Easy
System prompt changes per agent.

### Priority: Medium
Low urgency but reduces errors on fuzzy tool selection.

---

## Pattern 7: Config Versioning with Migration

### What It Does
DeerFlow's `config.yaml` includes a `config_version` integer field. On startup, if the running config version is lower than the current schema version, the app emits a warning:
```
WARNING - Your config.yaml (version 0) is outdated — the latest version is 1.
Run `make config-upgrade` to merge new fields into your config.
```

`make config-upgrade` auto-merges new fields from `config.example.yaml` into the user's `config.yaml`, preserving existing values and creating a `.bak` backup.

### Why It's Good
Config drift is a silent failure mode. Our agent configs (AGENTS.md, SOUL.md, config files) evolve over time with no version tracking. If a critical field is added and the operator doesn't notice, behavior breaks silently.

### How to Implement in OpenClaw

**Lightweight version:** Add `# config_version: N` comment to AGENTS.md/SOUL.md files. Check on agent startup if version matches expected.

**Full version:** Add `agent_config_version` field to agent configs. Right Hand checks version on spawn and warns if outdated.

Not worth full implementation today, but add a comment header to key config files.

### Difficulty: Easy
Low-value but quick win for maintainability.

### Priority: Low
Nice to have. Not urgent.

---

## Pattern 8: Per-User Session Overrides

### What It Does
DeerFlow's channel config supports per-user overrides:
```yaml
channels:
  telegram:
    enabled: true
    bot_token: $TELEGRAM_BOT_TOKEN
    allowed_users: []  # empty = allow all
    session:
      assistant_id: mobile_agent
      context:
        thinking_enabled: false
    users:
      "123456789":  # specific user ID
        assistant_id: vip_agent
        config:
          recursion_limit: 150
        context:
          thinking_enabled: true
          subagent_enabled: true
```

VIP users get a different agent configuration, higher recursion limits, and thinking mode enabled.

### Why It's Good
Single-user systems don't need this, but multi-user OpenClaw deployments (team Discord servers) could use per-user agent configuration to give power users more capability without exposing it to everyone.

### How to Implement in OpenClaw

Relevant if/when OpenClaw is used in a shared Discord server context. For now, Trajan is the only user, so this doesn't apply.

**Future implementation:** OpenClaw config could support:
```yaml
discord:
  users:
    "TRAJAN_USER_ID":
      model: claude-opus-4-5
      thinking: true
      subagent_limit: 10
    default:
      model: claude-sonnet-4-6
      thinking: false
      subagent_limit: 3
```

### Difficulty: Medium
Requires OpenClaw config changes and Discord user ID mapping.

### Priority: Low
Not needed for single-user setup.

---

## Pattern 9: Dangling Tool Call Recovery

### What It Does
DeerFlow's `DanglingToolCallMiddleware` (middleware #4) handles tool calls that were interrupted in a prior turn — e.g., if a session was killed mid-tool-execution. On the next invocation, it detects incomplete tool calls in state and either:
- Completes them if safe to retry
- Injects synthetic "tool was interrupted" results to let the agent continue

### Why It's Good
Without this, interrupted sessions leave the agent in an inconsistent state — the LLM sees a tool call with no response, which can cause it to loop, error, or hallucinate a result.

### How to Implement in OpenClaw

This is hard to implement cleanly without a state machine (LangGraph). However, a simpler version:

**In Claude Code sessions:** Add to system prompt:
```markdown
If you see a tool call in conversation history with no response (i.e., the message sequence shows a tool use but no tool result), assume the tool was interrupted. Proceed as if the tool returned an error and decide whether to retry.
```

This handles the common case without framework changes.

### Difficulty: Hard (full implementation), Easy (prompt mitigation)
The prompt mitigation is the right starting point.

### Priority: Low
Edge case. Implement the prompt mitigation version.

---

## Summary: What to Implement Next

### Immediate (do this sprint)

1. **Execution Mode Taxonomy** — Add Flash/Standard/Pro/Ultra naming to Right Hand dispatch logic. One AGENTS.md update.

2. **Concurrency Limits in System Prompt** — Add the count-then-batch protocol to Right Hand. 5-minute change, high reliability impact.

3. **Tool Filtering per Agent** — Add tool deny lists to each specialist's AGENTS.md. Low effort, reduces errors.

### Next Sprint

4. **Progressive Skill Loading** — Reduce `available_skills` to name + one-liner. Test 10 task types to ensure skill triggers still work. Medium effort, significant context savings.

5. **Ordered Processing in Right Hand** — Formalize the processing order in AGENTS.md as numbered steps. Document the clarification-gate-must-be-last rule explicitly.

### Backlog

6. **Structured Memory Tiers** — Migrate MEMORY.md to structured YAML. Add async memory updater step.

7. **Config Versioning** — Add `config_version` headers to key files.

8. **Dangling Tool Call Recovery** — Add prompt mitigation to Claude Code sessions.

---

*Related: [[OpenClaw]], [[Hermes Agent]], [[Multi-Agent Coordination Patterns]], [[Deer-Flow Research]], [[DeerFlow Architecture Study]], [[DeerFlow 2.0 Evaluation]]*
