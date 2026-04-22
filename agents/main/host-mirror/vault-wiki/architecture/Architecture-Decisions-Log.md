---
title: "Architecture Decisions Log"
type: reference
created: 2026-04-06
tags: [architecture, decisions, adr]
summary: "All major architecture decisions for the agent OS and supporting systems"
---

# Architecture Decisions Log

## AD-001: Right Hand + Invisible Orchestrator Model

**Decision:** Two-tier agent model. Right Hand is the user-facing agent for direct interaction. Invisible Orchestrator activates only for workflows requiring 3+ agents.

**Rationale:** Single user-facing agent reduces cognitive load. Orchestrator handles complex multi-agent coordination without cluttering the primary interaction surface.

## AD-002: Vault is Truth, Agents are Disposable

**Decision:** The vault (file system, markdown, SQLite) is the single source of truth. Agents are stateless and can be killed, restarted, or replaced at any time without data loss.

**Rationale:** Agent processes crash, context windows compact, sessions end. Persisting state in the vault means no agent death causes information loss. Rebuild agent state from vault, never the reverse.

## AD-003: Discord is Just a Rendering Surface

**Decision:** Discord is treated as one possible rendering surface, not a core dependency. The system is surface-independent.

**Rationale:** Coupling to any single UI platform creates vendor lock-in. The underlying dispatch, vault, and agent systems must function regardless of whether Discord, a terminal, EMA, or any other surface is attached.

## AD-004: Components v2 Discord Format Mandatory

**Decision:** All Discord bot output uses Components v2 format with accent color #E8A838.

**Rationale:** Consistent visual identity across all bot messages. Components v2 provides richer interaction primitives than legacy embeds.

## AD-005: File-Based Dispatch

**Decision:** Task dispatch uses the filesystem (`~/dispatch/queue/`) rather than a database queue or message broker.

**Rationale:** Files are inspectable with standard Unix tools (`ls`, `cat`, `grep`). No daemon required. Atomic file operations provide sufficient concurrency guarantees for the expected throughput. Debuggable without specialized tooling.

## AD-006: Crons are Signal Generators, Not Executors

**Decision:** Cron jobs generate signals (dispatch tasks, trigger checks) but never execute business logic directly.

**Rationale:** Separating signal generation from execution keeps cron jobs simple and idempotent. The dispatch system handles execution, retry, and error handling. A cron that fails only fails to generate a signal, not to execute critical logic.

## AD-007: Canonical Cron Source

**Decision:** All cron definitions live in `~/config/crons.conf` as the single source of truth.

**Rationale:** Prevents cron drift between environments. One file to audit, version control, and deploy. No hidden crontab entries.

## AD-008: Two OAuth Accounts for 2x Capacity

**Decision:** Run two Discord bot accounts (traclaw1, claudecode_seedofarsonVM) to double rate limit capacity.

**Rationale:** Discord rate limits per-bot. Two bots on the same server doubles throughput for agent communication without violating ToS.

## AD-009: CONTINUE.md Protocol for Restart Continuity

**Decision:** Agents write a CONTINUE.md file before shutdown containing current state, next steps, and context needed for resumption.

**Rationale:** Context windows are finite. Sessions end. The CONTINUE.md protocol ensures any new agent instance can pick up where the previous one left off without re-deriving context.

## AD-010: EMA Multi-Window via Tauri 2 WebviewWindow

**Decision:** EMA uses Tauri 2's WebviewWindow API where each app component is a separate OS-level window.

**Rationale:** True multi-window enables multi-monitor workflows. Each window is independently positionable, resizable, and focusable. Tauri 2's WebviewWindow API provides native window management without Electron's overhead.

## AD-011: EMA Local-First SQLite, No Cloud

**Decision:** EMA stores all data locally in SQLite. No cloud sync, no remote database.

**Rationale:** Privacy-first. Zero latency for reads. No dependency on network availability. SQLite handles EMA's single-user write pattern well. Data stays on the machine.

## AD-012: Anti-Staleness 3-Layer System

**Decision:** Three-layer system to prevent stale data: (1) TTL-based cache invalidation, (2) active freshness checks, (3) staleness detection and re-fetch.

**Rationale:** Stale data is worse than missing data because it creates false confidence. Three layers provide defense in depth against serving outdated information.

## AD-013: Voice Model Selection

**Decision:** Sonnet for fast/cheap voice interactions. Opus for quality-critical voice tasks.

**Rationale:** Voice has different latency requirements than text. Sonnet's speed makes it suitable for conversational voice. Opus reserved for tasks where accuracy matters more than response time.

## AD-014: OpenClaw Running Directly on VM

**Decision:** OpenClaw runs directly on the VM, not in a container.

**Rationale:** Eliminates container overhead and networking complexity. Direct VM access simplifies debugging and resource management. Containerization adds value for multi-tenant or deployment portability scenarios that don't apply here.

## AD-015: Claude Agent SDK Deferred

**Decision:** Do not adopt Claude Agent SDK despite availability. Deferred indefinitely.

**Rationale:** The Agent SDK is Python. The rest of the stack is Node.js/TypeScript/Elixir. Introducing Python as a runtime dependency for agent orchestration creates a polyglot maintenance burden disproportionate to the SDK's benefits. Existing CLI-based integration works.
