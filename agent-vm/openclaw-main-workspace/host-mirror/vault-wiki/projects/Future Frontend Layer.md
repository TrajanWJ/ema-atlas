---
title: Future Frontend Layer
created: '2026-03-18'
updated: '2026-03-18'
type: project
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: project
tags:
  - architecture
  - frontend
  - system-design
  - vision
summary: >-
  Every power user of AI agents hits the same wall. You start with ChatGPT in a
  browser tab. Then you want persistence, so you bolt on Obsidian. Then yo
wiki_id: projects/Future_Frontend_Layer
imported_from: vault/Projects/Future Frontend Layer.md
imported_at: '2026-04-04T00:23:56.886Z'
---
# Future Frontend Layer

> The operating surface for a life run with AI agents. Not a chat app. Not a dashboard. Not a note-taking tool. The single place where human intent becomes agent work becomes persistent knowledge — with nothing lost in translation.

**Status:** 💡 VISION — design north star that shapes every current decision
**Created:** 2026-03-18
**Tags:** #vision #frontend #architecture #system-design

---

## Why This Is Inevitable

Every power user of AI agents hits the same wall. You start with ChatGPT in a browser tab. Then you want persistence, so you bolt on Obsidian. Then you want agents running autonomously, so you add Discord as a command channel. Then you want to watch them work, so you add dashboards. Then you want the knowledge layer to inform the agents, so you build bridges between the vault and the chat.

At some point you realize: **you've built a Frankenstein operating system out of five apps that don't know about each other.**

This isn't a nice-to-have. It's the same trajectory that took us from "I'll just use Notepad and email" to IDEs, from "I'll just SSH in" to Kubernetes dashboards. When the complexity of the system exceeds the bandwidth of the glue holding the tools together, you build the integrated thing.

We're at that point. The evidence:

1. **50%+ of Right Hand's token budget goes to format translation** — converting between Discord's component model, markdown for the vault, structured data for agents, and human-readable summaries. In a native frontend, the output format *is* the display format.

2. **Agent work is invisible until it's done.** Trajan says "research X" and gets silence for 3 minutes, then a wall of text. The actual research — the searches, the dead ends, the pivots — is lost. A native surface streams it live.

3. **Context switching is the real cost.** Discord for conversation → Obsidian for knowledge → terminal for system health → browser for agent output. Each switch costs 15-30 seconds of reorientation. Across a day, that's hours of fragmented attention.

4. **The vault and the conversation don't talk.** Right Hand has to explicitly `qmd search` to find relevant knowledge. In a native frontend, the vault content surfaces automatically based on conversation context — like how an IDE shows relevant docs when you hover a function.

5. **Discord rate limits and format constraints actively degrade output quality.** Components v2 is good but we're still constrained to text blocks, buttons, and selects. We can't show a live agent workspace, a knowledge graph, or streaming code output.

## The Competitive Landscape (Why Nobody's Built This Yet)

| Product | What It Does | Why It's Not This |
|---|---|---|
| **ChatGPT / Claude.ai** | LLM chat interface | No agents, no knowledge layer, no system awareness |
| **Cursor / Windsurf** | AI-augmented IDE | Code-only, no knowledge management, no orchestration |
| **Obsidian** | Knowledge management | No agent integration, no real-time collaboration with AI |
| **Notion AI** | Docs + AI assistant | Single-model, no multi-agent, no system orchestration |
| **Langflow / Flowise** | Visual agent builder | Builder, not operator interface — you design flows, not use them |
| **Open WebUI** | Self-hosted LLM frontend | Chat-focused, no vault integration, no multi-agent |
| **Rivet / AgentStudio** | Agent development environments | Dev tools, not daily-driver operating surfaces |
| **Discord + Bots** | Chat + automation | What we have now — the ceiling we're hitting |

The gap: **nobody has built the daily-driver operating surface for someone who lives with AI agents.** Everyone's building either chat interfaces (too simple), agent development tools (too technical), or knowledge apps (too passive). The intersection — where you *converse* with agents, *watch* them work, *steer* knowledge, and *run* your system from one surface — doesn't exist.

This is the gap. And we're uniquely positioned to fill it because we've been *living* in the prototype (Discord + Obsidian + [[OpenClaw]]) for months. We know exactly where it breaks.

## The Problem (Current Stack)

| What We Use | What It's For | What We Actually Need It For |
|---|---|---|
| **Discord** | Gaming chat | Agent orchestration, task dispatch, real-time work visibility, command interface |
| **Obsidian** | Personal notes | Structured knowledge OS, agent memory, project tracking, truth-from-source |
| **Markdown files** | Text documents | Agent state, config, memory, continuity, preferences |
| **Terminal/SSH** | Server admin | System monitoring, agent spawning, debugging |

Every piece does 70% of what we need and forces workarounds for the rest. Discord's components v2 are nice but we're fighting the format constantly. Obsidian can't show agent activity. The vault is invisible to the chat layer without explicit `qmd` queries.

## What This Actually Replaces

**Not just a UI.** This replaces the entire *interaction paradigm*:

### 1. Chat → Conversation Spaces
Discord channels are flat text streams. What we actually want:
- Conversations that understand context (who's working on what, what vault notes are relevant)
- Agent work that's *visible inside the conversation* — not "I spawned 4 agents, wait for results" but watching them work in real-time
- Threads that are workspaces, not afterthoughts
- Mixed media — code, charts, vault note previews, system status — inline, not as embeds or attachments

### 2. Vault Viewer → Living Knowledge Surface
Obsidian shows markdown files. What we actually want:
- Knowledge that surfaces itself based on what you're doing (not manual search)
- Agent-written notes that are visually distinct from human-written ones
- Ontology/graph visible alongside content, not in a separate pane
- Edit-in-place that agents can also do simultaneously
- Version history that shows *who* (human or which agent) changed what and *why*

### 3. Dashboard → Ambient System Awareness
Currently scattered across `openclaw status`, `systemctl`, `htop`, agent-feed channel. What we actually want:
- Agent activity as a first-class UI element — always visible, like a sidebar
- System health that you *see*, not query
- Dispatch queue visible and interactive (drag to reprioritize, click to see progress)
- Usage/pace/cost always present, not behind a command

### 4. Command Interface → Intent Surface
Currently: type in Discord, Right Hand parses it. What we actually want:
- Natural language *and* structured input (slash commands, drag-and-drop, quick actions)
- Context-aware suggestions ("you're looking at the LetMeScale project — want to deploy?")
- Multi-modal: text, voice, file drop, screenshot annotation
- Command palette (⌘K style) for power users

## Design Principles

1. **Agent-native.** Agents aren't plugins bolted on — they're citizens. Their work, state, and output are first-class UI elements.

2. **Knowledge-ambient.** Relevant vault content surfaces automatically based on conversation context. No manual search required for the 80% case.

3. **Single-surface.** One app replaces Discord + Obsidian + terminal dashboards. Not three panels bolted together — one coherent experience.

4. **Real-time.** Agent work streams live. No "I dispatched 4 agents, will post results." You watch them think, write, fail, retry.

5. **Progressive disclosure.** Casual conversation feels like iMessage. Deep work feels like an IDE. The surface adapts to the interaction.

6. **Offline-capable.** Vault is local. Conversations sync but work offline. Agents are remote but the knowledge layer doesn't depend on connectivity.

7. **Self-documenting.** Every agent action, every dispatch, every decision is automatically captured in context. No separate logging — the UI *is* the log.

## Architecture Implications

### For OpenClaw
- The frontend is a first-class [[OpenClaw]] client, not a Discord bot
- WebSocket connection to the gateway (already exists: `ws://127.0.0.1:18789`)
- Session management moves from Discord channel mapping to native session objects
- Agent output streams directly to the UI, not through Discord's message API

### For the Vault
- Vault becomes a shared data layer with real-time sync (like Obsidian Sync but agent-aware)
- File-based storage stays (markdown is the truth) but the viewer is richer than rendered markdown
- `qmd` becomes an internal API, not a CLI tool
- Ontology graph is queryable from the UI

### For Agents
- Agents can render rich output natively (not constrained to Discord components v2)
- Streaming output — partial results, progress bars, live code execution
- Agents can request UI elements: forms, confirmations, file pickers
- Agent "workspaces" become visual — you can watch an agent's file operations in real-time

### For the Human
- One place to be. Not switching between Discord, Obsidian, terminal, browser.
- Mobile-friendly (Discord is the current mobile story; this should be too)
- Notification system that's context-aware, not channel-based

## The Killer Features (Things That Don't Exist Anywhere)

### 1. Agent Theatre
You dispatch 4 agents. Instead of silence → results, you get a **live split view**: each agent's workspace is visible. Researcher is browsing, you see the pages. Coder is editing, you see the diffs. Security is scanning, you see the findings accumulate. You can intervene mid-stream — steer, cancel, redirect — not just wait for the final output.

*Nothing on the market does this.* Agent orchestration tools show logs. This shows *work*.

### 2. Knowledge Gravity
As you have a conversation, relevant vault notes gently appear in a side panel — not because you searched, but because the system understands the topic. Mention "LetMeScale" and the project note, recent decisions, and open tasks appear. Mention "auth" and the OAuth Guardian notes, recent session logs, and security audit surface.

This is the Google Docs "Explore" panel done right — not generic web results, but *your* knowledge, weighted by relevance to *this* conversation.

### 3. Conversation-as-Workspace
A conversation isn't just chat history. It's a **workspace** that accumulates artifacts. Ask an agent to research something → the research note appears *inside the conversation* as an editable card. Ask for code → the code block is live, runnable, deployable from the conversation. Ask for a plan → the plan is a Kanban board inside the thread.

The conversation *is* the project. Not a pointer to a project elsewhere.

### 4. Time Travel
Every conversation, every agent action, every vault edit has a timeline. Scrub backward and see what the system looked like at any point. "What was the vault state when I made that decision last Tuesday?" — answerable instantly. Git for your entire operating surface, with agent attribution.

### 5. Ambient Pulse
A persistent, minimal status bar that shows system health, agent activity, usage pace, and pending tasks — without opening anything. Like a car dashboard. You glance and know: 3 agents running, vault healthy, 60% usage remaining, 2 tasks in queue. No clicks, no commands, always there.

### 6. Intent Routing with Memory
Type "check on LetMeScale" and the system knows: you probably mean the deployment status, because last time you said that it was about a Vercel issue. It doesn't ask "what aspect?" — it shows deployment status, recent commits, and open tasks, with a "more..." expansion for everything else. The interface *learns your patterns* the way Right Hand already does, but visually.

## User Journeys (Day In The Life)

### Morning Startup
Open the app. The **Pulse** bar shows: 2 overnight agents completed, 1 vault note updated, system healthy. Click the overnight summary card — it expands into a digest of what happened while you slept, with links to the actual work products. No Discord scrollback. No "what did I miss?" anxiety.

### Deep Work Session
You're building LetMeScale. The workspace shows: conversation with Right Hand on the left, LetMeScale project context on the right (auto-surfaced), agent activity feed at the bottom. You say "fix the hero animation." Coder agent starts working — you watch the file diffs stream in the right panel. You spot something wrong, type "actually, use spring physics not easing" — the agent pivots mid-task. The correction and the reason are captured in the conversation history *and* the project notes automatically.

### Quick Check-In (Mobile)
Pull out your phone. Pulse bar: all green, 2 tasks completed since lunch. Tap a completed task — see the summary, the artifacts, the conversation that spawned it. Reply with a voice note: "looks good, deploy it." The system dispatches.

### Evening Review
End of day. Open the **Timeline** view. See everything that happened — conversations, agent dispatches, vault changes, system events — on a horizontal timeline. Drag to zoom into the 2pm-4pm window where the LetMeScale sprint happened. Every decision, every agent action, every file change, all connected. Write a reflection note — it auto-links to everything it references.

## What This Is NOT

- **Not a SaaS product** (yet) — this is a personal ops surface first. But the architecture should assume other people will want it.
- **Not an Obsidian plugin** — Obsidian is the thing being replaced, not extended.
- **Not a Discord bot upgrade** — Discord is the thing being replaced.
- **Not a web dashboard** — dashboards are read-only; this is read-write-converse-command.
- **Not a chat app with features** — it's an agent-native operating surface that happens to include chat.
- **Not a coding IDE** — it orchestrates agents that code, but it's not where you write code yourself. Cursor/Windsurf handle that.

## Technology Strategy

### Why Next.js + Tauri (Recommended Path)

| Layer | Tech | Why |
|---|---|---|
| **UI Framework** | Next.js 15 + React | Trajan's primary stack. Fastest iteration. Huge ecosystem. |
| **Styling** | Tailwind CSS v4 | Already using it. Component-level utility classes. |
| **Desktop Wrapper** | Tauri v2 | Rust backend = tiny binary, native filesystem access, IPC for vault ops. Way lighter than Electron. |
| **Real-time** | WebSocket to [[OpenClaw]] Gateway | Already exists (`ws://127.0.0.1:18789`). Just needs a richer protocol. |
| **State** | TanStack Query + Zustand | Real-time server state + local UI state. |
| **Vault Layer** | Local filesystem via Tauri + SQLite (FTS5) | Markdown files stay the truth. SQLite index for fast search. |
| **Mobile** | PWA first, then React Native if needed | PWA gives 80% of mobile with 10% of the effort. |

### The Migration Path (Gradual, Not Big Bang)

**Phase 0: Shadow Mode** — The frontend connects as a read-only observer to the [[OpenClaw]] gateway. Shows conversations, agent activity, vault contents. Discord still primary.

**Phase 1: Dual Mode** — The frontend can send messages and dispatch agents. Both Discord and the frontend work. Trajan uses whichever is convenient.

**Phase 2: Frontend Primary** — Rich features (Agent Theatre, Knowledge Gravity, Timeline) only available in the frontend. Discord becomes the mobile fallback and notification channel.

**Phase 3: Discord Optional** — Discord bot stays alive for notifications and quick mobile replies, but the frontend is the daily driver. Could be turned off without losing functionality.

### What OpenClaw Needs (Gateway Protocol Extensions)

The current gateway supports chat channels. For the frontend, it needs:
1. **Agent stream events** — real-time output from running agents (stdout, file changes, tool calls)
2. **Vault watch** — filesystem watcher events for vault changes (agents or human editing)
3. **Session state** — richer session metadata (active agents, pending tasks, queue state)
4. **Rich output protocol** — agents output structured UI components, not just text + Discord components

These extensions benefit *all* clients, not just the frontend. They make the gateway more capable regardless.

## The Business Case (Why Build This, Not Just Use Discord Better)

1. **Ceiling, not floor.** We're optimizing Discord output format. We've maxed out components v2. The improvements from here are incremental. The frontend unlocks a fundamentally different capability tier.

2. **Productizable.** Every person running [[OpenClaw]], Claude Code, or any multi-agent setup hits the same wall. This could be the "Cursor for agent orchestration" — the tool that makes the whole paradigm accessible. (Not the goal, but the option should stay open.)

3. **Moat.** The knowledge is in the vault. The agents are in [[OpenClaw]]. The frontend ties them together with an experience nobody else has. The longer we run with it, the more the knowledge compounds, and the harder it is for any other tool to replicate the value.

4. **Learning asset.** Building this exercises the full stack Trajan works in (Next.js, TypeScript, Tailwind, real-time systems). Every hour spent building it is also skill development for LetMeScale and other projects.

5. **It already wants to exist.** Every time we fight Discord's format constraints, every time we switch between Obsidian and Discord, every time we wish we could watch an agent work — we're experiencing the absence of this tool. Building it isn't adding a new thing; it's removing friction that's already costing time daily.

## Relationship to Current System

This is a **north star**, not a rewrite trigger. Every design decision made now should be forward-compatible:

| Current Decision | Future-Frontend Compatible? |
|---|---|
| Vault stays file-based (markdown) | ✅ Frontend reads the same files |
| [[OpenClaw]] WebSocket API | ✅ Becomes the frontend's backbone |
| Agent output as structured components | ✅ Maps to richer native UI components |
| Dispatch queue as files | ✅ Frontend reads the same queue |
| `qmd` for vault search | ✅ Becomes an internal API call |
| Ontology graph in SQLite | ✅ Frontend renders it natively |
| Discord components v2 patterns | ✅ Design patterns translate directly |

Nothing we're building now becomes throwaway. The frontend is additive.

## Open Questions

1. **Auth model** — local-only? Or accessible remotely (Tailscale, phone away from home)?
2. **Multi-user** — single-user first, but design the data model for future collaborators?
3. **Plugin system** — should third-party widgets/views be possible? (Obsidian's plugin ecosystem is its killer feature.)
4. **Voice** — native voice conversation, replacing Discord voice?
5. **When to start v0** — the trigger should be a concrete Discord limitation that costs significant time (we may already be there).
6. **Name** — "Future Frontend Layer" is a working title. What's the product name?

## What's Next

1. **Start a design language.** Sketch the core layouts: conversation workspace, pulse bar, knowledge panel, agent theatre. Even as static mockups, this makes the vision concrete.
2. **Identify the gateway protocol extensions needed.** File issues or spec docs for agent streaming, vault watch, rich output protocol.
3. **Build Phase 0 as a weekend project.** A read-only Next.js app that connects to the gateway WebSocket and shows live conversations + agent activity. If that's useful on day one, the rest follows naturally.
4. **Log friction points.** Every time Discord or Obsidian limits what we can do, note it here. When the list is long enough, that's the build trigger.

### Friction Log (append as encountered)

| Date | Friction | Impact | Frontend Would... |
|---|---|---|---|
| 2026-03-18 | Agent work invisible during dispatch | Can't steer agents mid-task | Show Agent Theatre live view |
| 2026-03-18 | Discord rate limits on rapid updates | Progress updates throttled | Stream natively via WebSocket |
| 2026-03-18 | Vault search requires explicit `qmd` call | Knowledge doesn't surface automatically | Knowledge Gravity panel auto-surfaces relevant notes |
| 2026-03-18 | Components v2 format constraints | Can't show code diffs, graphs, or interactive elements | Render arbitrary React components |
| 2026-03-18 | Context switching between Discord/Obsidian/terminal | Attention fragmentation across 3+ apps | Single surface, zero switching cost |

---

*This document is the north star. Reference it in architecture decisions. When designing new features, ask: "How would this work in the future frontend?" When hitting Discord/Obsidian limits, log it in the Friction Log.*
