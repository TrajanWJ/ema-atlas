---
title: "Discord-as-IDE / Chat-as-Session-Manager: Landscape Report"
created: 2026-03-19
updated: 2026-03-19
type: research
confidence: 0.75
source: web-research
tags: [discord, claude-code, IDE, session-management, multi-agent, ACP]
summary: "Landscape of projects using Discord/chat platforms as remote IDEs or session managers for AI coding agents. Short answer: almost nothing public does what Trajan already has. The gaps are session multiplexing by channel, spatial filesystem mapping, and ACP session resumption."
---
# Discord-as-IDE / Chat-as-Session-Manager: Landscape Report

*Sources: ~18 total (4 primary/T1, 8 institutional/T2, 6 secondary/T3)*  
*Confidence: Medium | Date: 2026-03-19*

---

## Summary

Almost nothing in the open-source ecosystem implements "Discord channels = project/session namespaces" as a formal concept. What exists falls into two clusters: (1) **multi-agent orchestrators** that use Discord as a status dashboard (unidirectional), and (2) **session managers** (Electron apps, iOS apps) that wrap Claude Code's `--resume` flag locally. Trajan's own `claude-code-bot` + OpenClaw channel-routing setup is more sophisticated than most publicly available tools on the "Discord as IDE" axis. The closest public comparables are OpenSwarm and Oh-My-OpenClaw, but neither maps Discord channels to filesystem paths — they use Discord as a command interface to a single shared context.

---

## Findings

### 1. Discord-as-IDE Projects (Channel = Filesystem/Session Mapping)

**Verdict: Essentially does not exist publicly.**

No project was found that formally maps Discord channels or categories to filesystem paths, project directories, or isolated coding sessions. This is the most novel part of what Trajan is building.

The closest analogs:
- **OpenClaw itself** (Trajan's own setup) — session keys ARE channel-scoped: `agent:main:discord:channel:<id>`, `agent:main:discord:channel:<id>:thread:<threadId>`. Each channel already has an isolated session. This is the foundational primitive.
- **Session Architecture Proposal** (vault/Architecture) — documents a 4-tier channel strategy (persistent, write-only, project threads, ephemeral) that maps session lifecycle to Discord channel function. Closest thing to "Discord as IDE" in the vault.

**Gap:** No routing layer exists that says "when you post in #project-foo-channel, auto-`cd ~/projects/foo` and resume session X." That's buildable on top of OpenClaw's existing session key routing.

---

### 2. Remote Claude Code / AI Agent Management via Discord

#### OpenSwarm
- **URL:** https://github.com/Intrect-io/OpenSwarm  
- **What it does:** Orchestrates multiple Claude Code CLI instances as autonomous agents against Linear issues. Discord bot provides full control: status, task dispatch, scheduling, pair session management, `!stuck` detection. Worker/Reviewer/Tester/Documenter pipeline. LanceDB memory.  
- **Maturity:** Early (Show HN Feb 2026, 34 points, 17 comments). Actively maintained. Node.js ≥22.  
- **Discord use:** Status reporting + command interface. Single shared Discord channel ID configured globally — not per-session routing.  
- **What we could reuse:** Worker/Reviewer pair pipeline pattern. `!stuck` detection logic. LanceDB vector memory architecture. Decision engine with scope guard + rate limiting.

#### Oh-My-OpenClaw (OmOC)
- **URL:** https://github.com/happycastle114/oh-my-openclaw  
- **What it does:** OpenClaw plugin that adds 11 specialized agents (Prometheus planner, Atlas orchestrator, Sisyphus-Junior implementer, Momus reviewer, etc.) auto-orchestrated from Discord/Telegram. Integrates with Oh-My-OpenCode (OmO) + tmux. Automatic model routing by task type. Checkpoint/crash recovery.  
- **Maturity:** Show HN Feb 2026 (2 points, 0 comments). Very early. TypeScript.  
- **Discord use:** Entry point — `/omoc omoc_prometheus` in Discord kicks off the full pipeline. Routes internally, not channel-scoped.  
- **What we could reuse:** Session-scoped in-memory todo tools pattern. Comment-checker (11 regex patterns for AI slop). Auto-routing from keyword detection. Checkpoint save/load for crash recovery.

#### Trajan's claude-code-bot (local)
- **URL:** `~/claude-code-bot/bot.py` (systemd service)  
- **What it does:** Discord bot running Claude Code with `bypassPermissions`, streaming tool calls (📖 Read, ✏️ Edit, ⚡ Bash, ✅ Done) live to Discord. Auto-threads for long tasks. `!stop`/`!cancel` kill switch. Channel context injection (last 10 messages). Dispatched by Right Hand via @mention whitelist.  
- **Maturity:** Active production use. Well-documented in vault.  
- **Gap:** Single working dir per session (overridable via `cd ~/path &&` prefix), but no automatic channel→directory mapping.

---

### 3. Session Multiplexing Over Chat

**Verdict: OpenClaw is the only system with production-quality channel-scoped session routing.**

The fundamental OpenClaw session key pattern (`agent:main:discord:channel:<id>:thread:<threadId>`) is the state of the art for this. No other open-source project implements true session multiplexing by chat channel.

OpenSwarm uses a single channel ID globally. Oh-My-OpenClaw routes by slash command prefix, not channel. No other project was found.

**The gap Trajan is solving:** A routing layer that uses the channel→session binding to also drive `--cwd` (working directory) for Claude Code. Currently session key ≠ filesystem path. They're independent.

---

### 4. Claude Code Session Persistence & Resumption

**(T1 — directly verified from `claude --help` on this machine)**

Claude Code's native session model:

| Flag | Behavior |
|------|----------|
| `claude --resume <session-id>` | Resume specific session by UUID |
| `claude --resume` | Interactive picker (last ~50 sessions) |
| `claude --continue` | Resume most recent in current directory |
| `claude --session-id <uuid>` | Force a specific session UUID (for new sessions) |
| `claude --fork-session` | Clone session to new ID on resume |
| `--no-session-persistence` | One-shot mode, not saved |
| `-n, --name <name>` | Set display name for session |

Sessions stored as `.jsonl` at: `~/.claude/projects/<escaped-path>/<uuid>.jsonl`

**Key constraint:** `--resume` resumes from any working directory but is scoped to the *session ID*, not the path. The session carries its own context. You CAN resume a session with a different `--cwd`, but it will have the old path in its context.

**Ecosystem tools:**

#### ccsearch
- **URL:** https://github.com/madzarm/ccsearch  
- **What it does:** Rust TUI CLI for searching Claude Code history. Hybrid BM25 (SQLite FTS5) + semantic embedding search (all-MiniLM-L6-v2, local 80MB). Hit Enter → launches `claude --resume <id>`.  
- **Maturity:** Recently released (Feb 2026, active). MIT. Works on macOS/Linux/Windows.  
- **What we could reuse:** The `~/.claude/projects/<path>/<uuid>.jsonl` indexing approach. Shows exact session storage format.

#### ClaudeTerminal
- **URL:** https://github.com/Mr8BitHK/claude-terminal  
- **What it does:** Electron app (Windows primary, macOS/Linux experimental). Tabbed Claude Code sessions with status icons. Session persistence (saves tabs, restores on restart). Git worktree integration (Ctrl+W = new worktree + scoped session). Auto-naming via Haiku. Desktop notifications. Remote access via Cloudflare tunnel.  
- **Maturity:** March 2026 Show HN (3 points). Early but functional. MIT.  
- **What we could reuse:** Cloudflare tunnel for remote access (without needing a VPS). Auto-naming pattern. Worktree→session scoping model is conceptually close to channel→session mapping.

#### PUNK
- **URL:** https://punkcode.rocks (iOS, closed source)  
- **What it does:** iOS app for remote Claude Code session management on your own machine. Multiple parallel sessions, permission approval from lock screen (Live Activities), session resume, Docker container support. ~50 users currently.  
- **Maturity:** Pre-public TestFlight (March 2026). Closed source, iOS only.  
- **What we could reuse:** Nothing directly (closed). But confirms: phone→Claude Code remote management is a solved problem for mobile, and the main value is permission approval interrupts + parallel session visibility.

---

### 5. ACP (Agent Communication Protocol)

**Verdict: No public open-source projects using ACP for multi-session management found.**

- The Anthropic docs URL for ACP (`/en/docs/agents-and-tools/agent-sdk-acp`) 404'd.
- Claude Code `plugins/agent-sdk-dev` plugin exists in the official repo for building Agent SDK apps, but it's a development kit, not a session manager.
- OpenClaw uses ACP internally as its harness to spawn Claude Code/Codex sessions (the `sessions_spawn` API), but this isn't publicly documented as a standalone protocol.
- HN search for "ACP agent communication protocol anthropic multi session" returned zero results.

**What ACP actually is (inferred from OpenClaw internals):** A session lifecycle protocol where the harness starts a coding agent process, feeds it messages via stdin/pipe, and receives responses. Sessions have UUIDs and can be resumed (`resumeSessionId` field in `sessions_spawn`). The agent replays conversation history via `session/load` on resume.

**Gap:** No community-built tools are integrating with ACP. It's an OpenClaw-internal concept that hasn't (yet) produced community projects.

---

### 6. Terminal-in-Discord

**Verdict: Exists but extremely primitive; no serious adoption.**

Found two small projects from GitHub topic search:
- **just-rich/Discord-Eval** — Lightweight JS bot for running "safe" terminal commands on Linux. 1 star. Command blacklist. No PTY, no streaming.
- **NoobBotlies/Discord-Pi-Eval** — Same concept for Raspberry Pi. 0 stars.

Neither supports streaming output, PTY allocation, or session persistence. These are weekend toys, not production tools.

**Notable adjacent:** **shelldone** (github.com/nareshnavinash/shelldone) — Pure bash CLI notification system for AI coding tools. Sends completion alerts from Claude Code/Codex/Gemini to Discord/Slack/Telegram when long-running tasks finish. Not interactive, but good for async "task done" notifications. Actively maintained, 438 tests, MIT. Reusable hook system.

---

### 7. Similar Concepts on Other Platforms

#### Syllabi
- **URL:** https://github.com/Achu-shankar/Syllabi  
- **What it does:** Open-source platform for deploying AI agents across multiple channels (Slack, Discord, web widget, Teams). Channel-agnostic core with adapter pattern. Not coding-focused — more knowledge base + tool use.  
- **Maturity:** ~6 months old (mid-2025). Self-hosted Docker. MIT.  
- **What we could reuse:** Adapter pattern design for channel-agnostic agent deployment.

#### OpenClaw multi-channel routing (Trajan's setup)
- Discord + Telegram with different routing rules (casual → Discord, urgent → Telegram).
- This is already implemented per vault docs (Session Management Deep Dive).
- Confirms: multi-channel routing is a real production pattern.

---

## Key Takeaways

1. **You're ahead of the public ecosystem.** The combination of `claude-code-bot` + OpenClaw channel-scoped sessions + `--resume` by UUID is more sophisticated than anything publicly available for "Discord as coding IDE."

2. **The missing primitive is channel→cwd binding.** Claude Code sessions don't auto-scope to a filesystem path when you're in a specific Discord channel. The gap: a routing table `{channel_id → working_dir, default_session_id}` that `claude-code-bot` uses to auto-prefix `cd ~/path &&` (or pass `--cwd`) when dispatching.

3. **Session resumption is robust natively.** `claude --resume <uuid>` + `--session-id <uuid>` + `--fork-session` give enough primitives to build persistent per-channel sessions. The `~/.claude/projects/<path>/<uuid>.jsonl` storage is local and scriptable.

4. **ACP is an internal OpenClaw feature, not a community protocol.** No community tooling exists yet. If you want multi-session ACP management, you're building it.

5. **For "terminal in Discord," start from scratch.** The existing projects are toys. The `claude-code-bot` approach (streaming tool calls via Discord edits) is the right model. PTY-over-Discord isn't worth attempting; structured tool-call streaming is.

6. **ClaudeTerminal's worktree → session binding** is the closest public analog to "context = project." Worth studying their approach: each git worktree gets its own Claude session scoped to that path. Discord channel = worktree is a reasonable mental model.

---

## Contested / Uncertain

- **Oh-My-OpenClaw** (happycastle114) — The README was 404. Only HN post description available. Can't verify current state of the code.
- **PUNK** — Closed source. The claims about "50 users" and "lock screen approvals" are from a single HN post by the developer. Not independently verified.
- **ACP spec** — The docs URL 404'd. It's unclear whether ACP is a stable protocol or an internal implementation detail of OpenClaw that could change.

---

## Open Questions

1. Can OpenClaw's ACP harness be configured to pass `--cwd` to Claude Code sessions based on which Discord channel the spawn is triggered from? (Needs OpenClaw config docs.)
2. Does `claude --session-id <uuid>` actually allow pre-assigning a UUID before the first message, enabling pre-registered "project sessions"?
3. Is there a community Discord/Slack for OpenClaw where session multiplexing patterns are discussed?
4. Has anyone implemented "channel-to-git-worktree" mapping on top of OpenClaw?

---

## Sources

1. [T1] `claude --help` output (this machine) — Session flags, storage format, resume/continue/session-id behavior
2. [T1] `vault/Architecture/Claude Code Bot Architecture.md` — Trajan's own bot architecture
3. [T1] `vault/Architecture/Session Management Deep Dive.md` — OpenClaw session key pattern
4. [T1] `~/.claude/projects/-home-trajan/*.jsonl` — Direct session file inspection
5. [T2] [OpenSwarm README](https://github.com/Intrect-io/OpenSwarm) — Multi-agent Claude Code + Discord control
6. [T2] [ccsearch GitHub](https://github.com/madzarm/ccsearch) — Session search/resume tool, Rust, local hybrid search
7. [T2] [ClaudeTerminal GitHub](https://github.com/Mr8BitHK/claude-terminal) — Electron tabbed session manager
8. [T2] [Claude Code official README](https://github.com/anthropics/claude-code) — Official flags and storage
9. [T2] [Claude Code plugins README](https://github.com/anthropics/claude-code/blob/main/plugins/README.md) — Agent SDK, official plugin list
10. [T2] [Claude Code Settings docs](https://code.claude.com/docs/en/settings) — Config scopes, storage paths
11. [T2] [shelldone README](https://github.com/nareshnavinash/shelldone) — AI CLI notification hooks
12. [T2] HN: OpenSwarm Show HN (47160980) — Discord control for multi-agent orchestrator
13. [T2] HN: ClaudeTerminal Show HN (47203452) — Tabbed session manager + session persistence
14. [T2] HN: ccsearch Show HN (47104602, 47110768) — Session search CLI
15. [T3] HN: Oh-My-OpenClaw Show HN (47161721) — Discord/Telegram orchestration plugin
16. [T3] HN: PUNK Show HN (47414328) — iOS remote Claude Code management
17. [T3] HN: Syllabi Show HN (45795186) — Multi-channel agent deployment framework
18. [T3] HN: OpenClaw usage discussion (47261911) — Real-world multi-channel routing patterns
