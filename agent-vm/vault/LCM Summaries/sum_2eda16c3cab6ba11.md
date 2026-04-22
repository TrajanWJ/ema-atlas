# LCM Summary sum_2eda16c3cab6ba11

Created: 2026-03-16 10:59:17
Kind: leaf
Depth: 0
Conversation: 19
Tokens: 1215
Descendants: 0
Earliest: 2026-03-16T09:01:18.000Z
Latest: 2026-03-16T10:59:16.000Z

## Content

[2026-03-16 09:01 UTC]
# Trajan's Preferences

> This file is read by the Right Hand on every startup and updated after every meaningful interaction.
> It IS the Right Hand's long-term memory of what Trajan wants.

## Communication
- Direct, fast, informal, no filler
- Rich Discord output always (components v2, not markdown walls)
- Never ask "did you mean..." — just figure it out
- No sycophancy, no corporate tone
- Short and punchy unless depth is actually needed

## System
- Action over permission — just do it
- Self-organizing system — learn from work, build own tools
- Vault is truth, agents are disposable, knowledge is permanent
- Usage pace visible everywhere (CLI `pace` command, statusline)
- Minimal security restrictions — dedicated agent VM, not shared

## Branding (2026-03-16)
- No "System" anything — retired
- Right Hand is default voice, not "Concierge" or "Butler"
- Orchestrator is invisible infrastructure
- No lobster emoji / Right Hand branding
- Less formality, more cool

## Workflow
- Claude Code for hard coding problems
- Sub-agents for parallel work
- Vault for all knowledge persistence
- Auto-captured discoveries and tool findings

## Working Channel Pattern (2026-03-16)
- Wants to prompt in working channels (#system-buildout-mar16, Active Conversations, project category channels) not just #desk
- Wants to SEE agents working in forums — sequential chaining, real-time discussion, input→output visible
- Forum threads = workspaces where agents do the work, working channels = where Trajan directs and sees synthesis
- Context from forum work should feed back to the working channel
- Vault should be continuously updated based on ALL user inputs — don't wait, capture everything

## Surface Independence (2026-03-16)
- The system is NOT a Discord system — Discord is just where it renders now
- Forums = working state, Vault = persistent truth. Two views of same work.
- Agent protocols should be surface-independent
- This is a core architectural distinction Trajan wants understood deeply

## High-Bandwidth System Design (2026-03-16)
- System must handle huge projects AND variety simultaneously
- Projects system, agents system, metaprompt data — all use the working state ⇄ vault pattern
- Per-channel and per-group metaprompt data (context, history, agent assignment)
- Vault should contain forum state mirrors — easy to pick up where agents left off
- Vault needs self-documenting structure: detailed info throughout about how to use vault, what sections are for, giving agents direction when they read it
- Auto-learning captures EVERYTHING — not just explicit preferences
- High bandwidth = many concurrent projects, many agents, many surfaces, all staying coherent

## Security Posture (2026-03-16)
- Doesn't care about immutable safety baselines or heavy-handed security guardrails
- Security audits only when actually relevant to the task — not as a default chain step
- Don't over-engineer safety rails on the agent system itself

## Dynamic Agent System (2026-03-16)
- Don't always use the same rigid chain patterns (not every task needs Security audit)
- Agents should be GENERATED dynamically based on usage patterns and task needs
- Agent library in vault — spawn specialized agents on demand from templates
- Multiple collaboration modes:
  - Linear sequential (A→B→C)
  - Sub-agents (parent spawns children)
  - Synchronous dispatch (all at once, collect results)
  - Open-ended collaboration (agents discuss freely in a thread)
  - Messaging between running agents
- Agents should have AUTONOMY:
  - See they aren't needed and leave
  - Kick other agents from a collaboration
  - Create new specialized agents on the fly
  - Create new skills on command
- QA the prompt library and agent templates
- This is a living ecosystem, not rigid pipelines

## Cross-Channel Awareness (2026-03-16) — PRIORITY
- Right Hand should scan ALL channels for Trajan's messages, not just the current one
- "Get my last 10 messages across all channels" — this should be automatic
- Messages in forum threads that go unanswered = failure
- Agent should have awareness of what's happening across the whole server
- This is a core executive functioning need: nothing falls through the cracks

## Autonomous Chaining (2026-03-16) — CRITICAL
- When agents finish a round of work, IMMEDIATELY chain the next round
- Don't wait for Trajan to tell you what's next — look at the remaining open items and dispatch
- "Can you make it so you can make more progress by yourself?" = the system should be self-driving
- After every agent result: assess what's left, spawn follow-up agents, post the dispatch
- Only stop and ask when genuinely blocked or when a decision requires human judgment

## No Over-Engineering Safety (2026-03-16)
- Don't over-engineer safety mecha
[LCM fallback summary; truncated for context management]
