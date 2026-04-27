# Glossary

Controlled vocabulary for the EMA / Hermes lineage. When you write a doc, use
these terms exactly. When you propose a new term, add it here first.

| Term | Definition | Where it lives in code/docs |
|---|---|---|
| **EMA** | The Elixir/Phoenix daemon that owns canonical truth (control plane, lineage, routing). System of record. | `codebase-ema/code/ema/daemon/lib/ema/` |
| **EMA daemon** | The OTP application that boots the control plane, sessions, babysitter, and surfaces supervisors. "If you run one thing, run this." | `codebase-ema/code/ema/daemon/lib/ema/application.ex` |
| **Hermes** | The execution substrate / API server. Runs sessions, tools, memory, skills, delegation. Strongest current candidate for the meta-harness router. | `codebase-ema/code/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md` |
| **Surface** | A user-facing shell (Discord / web / CLI / native desktop / editor). Mirrors and controls; **does not own state.** | `codebase-claudeforge`, `codebase-frontend-layer`, `docs-host-system-launchpad-hq` |
| **Workspace (shared)** | Repo-/space-owned durable artifacts (plans, handoffs, notes, exports, context bundles). Human-readable AND agent-readable. | `codebase-ema/code/ema/workspace/shared/` |
| **Collaboration object** | A live multi-user / multi-agent editable artifact: doc, wiki page, canvas, thread. Distinct from workspace artifacts and from control-plane records. | `graph/edges/collab.md` |
| **Control-plane record** | An append-only authoritative event in EMA: proposal, execution, dispatch_update, incident, host_transition, etc. | `codebase-ema/code/ema/daemon/lib/ema/control_plane/event_log.ex` |
| **Execution lineage** | The chain of control-plane records linking an intent to its runtime outcome. Must remain explicit and replayable. | `control_plane/replay.ex` |
| **Session** | Live runtime continuity for an actor (human or agent) talking to a runtime. Has a session_id distinct from execution_id and from provider_session_id. | `codebase-ema/code/ema/daemon/lib/ema/sessions/` |
| **Driver** | A typed adapter that takes an EMA dispatch and runs it on a specific harness/runtime. Sits **above** raw model providers. | `codebase-ema/code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md` |
| **Driver targets** | `hermes-native`, `claude-cli`, `codex-cli`, `peer-remote`, `simulated-tui`. | `graph/edges/execution.md` |
| **Provider** | A model API endpoint (Anthropic, OpenAI, local). Strictly below drivers. **Not interchangeable with "driver" or "runtime".** | `codebase-ema/code/ema/daemon/lib/ema/claude/provider_registry.ex` |
| **Harness** | The execution shell around a model invocation (CLI, in-process runtime, peer worker). A driver picks one. | `HERMES_HARNESS_DRIVER_REGISTRY.md` |
| **Babysitter** | Watchdog/scheduler tier that supervises long-running execution chains and takes over stalled work. OpenClaw doctrine, crystallized in Elixir. | `codebase-ema/code/ema/daemon/lib/ema/babysitter/` |
| **Capability locality** | The principle that tools/auth/resources differ across human shells, agent turns, daemons, surfaces, and machines. Orchestration must respect this. | `codebase-ema/code/ema/docs/AGENT-CONTRACT.md` |
| **Placement** | Explicit choice of where a dispatch runs: `local` / `daemon` / `peer` / host-affinity. Not a hidden implementation detail. | `graph/edges/transport.md` |
| **Organization (Org)** | Top-level administrative + security boundary. Owns members, projects, billing, policy bundles, peer-trust roots. | `graph/edges/identity.md` |
| **Project** | The unit each EMA instance binds to. Owns an event_log shard, a workspace root, sessions, harness policy, datasets. Belongs to one Org or one User (personal). | `05-fresh-context-project-app-model.md` |
| **Space** | Collaboration scope inside an Org, orthogonal to Projects. Owns membership-with-roles, channels/threads, collaboration objects. | `05-fresh-context-project-app-model.md` |
| **Dataset** | Versioned, addressable input bundle bound to a Project (or Org-shared). Distinct from workspace artifacts. | `05-fresh-context-project-app-model.md` |
| **Member** | Human or agent identity participating in an Org/Space, with role and permissions. Agent identities may be first-class — see Open Question Q1. | `OPEN_QUESTIONS.md` Q1 |
| **Personal AI** | A user-level agent identity with implicit access to all Projects/Spaces the user belongs to, gated by per-Org policy. | `05-fresh-context-project-app-model.md` |
| **vApp** | A virtual app inside the EMA shell (Wiki, Chat, Threads, Agent vEnv, Blueprint, Code, etc.). Rendered inside Launchpad / Virtual Desktop. | `docs-ema-next-steps/.../VAPP-FINAL-VISION-CHECKLIST.md` |
| **Launchpad** | Top-level launcher surface (Win8/Start-style) hosting vApps. | `docs-host-system-launchpad-hq` |
| **HQ** | Per-user, per-project dashboard surface. Personal HQ aggregates across all Projects/Orgs. | `docs-host-system-launchpad-hq` |
| **Virtual Desktop** | The main interface metaphor inherited from place.org — accessible as a native desktop app or as a website. | `codebase-place-org`, `05-fresh-context-project-app-model.md` |
| **Threads / Server** | EMA-native replacement for Discord channels/threads, mirrored back to Discord via webhook during transition. | `05-fresh-context-project-app-model.md` §3 |
| **Blueprint** | Knowledge-structuring artifact (Karpathy-style) that integrates with the Wiki and intent capture. | `05-fresh-context-project-app-model.md` §5 |
| **OpenClaw** | Earlier multi-agent / Discord-native operator system. Doctrine donor (roles, handoffs, watchdogs), not the final architecture. | `lineage-openclaw`, `lineage-openclaw-agent-workspaces` |
| **ClaudeForge** | Earlier TypeScript Discord/web operator surface. Donor of the surface↔Hermes interface contract. | `codebase-claudeforge` |
| **place.org / placeOS** | Earliest browser-native virtual-desktop / "place" lineage. Donor of UX metaphor (Launchpad, HQ, Desktop). | `codebase-place-org`, `codebase-place-companion` |
| **Mesh / P2P** | Strategic future direction — peer-aware execution and collaboration on a BEAM-family base. Deferred until local semantics pin down. | `graph/edges/transport.md` |
| **Doctrine** | Lessons/patterns extracted from a prior era; carried forward as design principles, not as code. | `03-architectural-evolution-and-major-decisions.md` §7 |

## Vault candidate terms (added 2026-04-22)

These terms exist in the user's host Obsidian vault (under
`docs-host-obsidian-vault`) and are surfaced here as **candidate** glossary
entries. They are not yet canonical for EMA — promoting them requires the
same workflow as resolving an open question. Source-cited for verification.

| Term | Definition | Source |
|---|---|---|
| **Space (typed taxonomy)** | Personal / Organization / Shared / Ghost / Public — fundamental isolation unit owning files, tasks, agents, vault, channels, keys, and sync policy. Disambiguates the bare "Space" entry above. | `docs-host-obsidian-vault:host/cache_agent_vm_full_vault/Architecture/EMA Mesh Architecture.md` |
| **Ghost Space** | Ephemeral collaboration space with TTL, ephemeral keys, and self-destruct semantics for temporary multi-party work. Distinct from durable Workspace and Collaboration object. | `docs-host-obsidian-vault:.../EMA Mesh Architecture.md` |
| **Brain Dump** | Per-Space inbox for raw thoughts that gets auto-classified into tasks, notes, proposals, or journal entries. The capture-before-classify intake surface. | `docs-host-obsidian-vault:.../EMA Mesh Architecture.md` |
| **Auto-Resolve Gate** | Pre-queue check (vault precedent + preferences + corrections + confidence ≥ 0.85) that lets agents resolve silently instead of escalating to human review. | `docs-host-obsidian-vault:.../Agent-Queue-System.md` |
| **Handoff Envelope** | Required metadata header on every agent-to-agent handoff carrying status, confidence, completeness, and provenance alongside the payload. Distinct from execution lineage — a per-edge reliability contract. | `docs-host-obsidian-vault:.../agent-handoff-envelope.md` |
| **Background Results Contract** | XML `<background-results>` wrapper that injects async agent outcomes back into a live session in a uniform format. Inter-agent async result-injection format above raw provider streaming. | `docs-host-obsidian-vault:.../background-results-contract.md` |
| **Bridge / Bridge Server** | Express/WebSocket server that mediates between a surface (Agent OS WebUI) and back-end engines (OpenClaw, Discord, Vault, Dispatch). Concrete prior art for the surface↔runtime mediator distinct from Driver and Harness. | `docs-host-obsidian-vault:.../Agent-OS-Overview.md` |
| **Cognitive Cockpit** | Surface-design stance treating the operator UI as an ambient awareness layer (calm-technology) rather than a chat app with bots. UX doctrine behind Launchpad/HQ/Threads. | `docs-host-obsidian-vault:.../Discord UX Philosophy.md` |
| **Intelligence Layer** | Always-on pre-routing reasoning tier that does intent parsing, metaprompting, and prompt consulting on every inbound request before any dispatch. Upstream of Driver/Harness. | `docs-host-obsidian-vault:.../Intelligence Layer - System Vision.md` |
| **Vault Cognitive Layer** | Three-subsystem layer (metabolism = activation decay, graph = typed edges, cognition = injection/contradiction/gap detection) that turns the vault into an active participant. | `docs-host-obsidian-vault:.../Vault-Cognitive-Layer.md` |
| **Superman (Semantic Layer)** | Embedding/index/query infrastructure that gives every EMA item a semantic fingerprint and powers the `context_for/2` injection function. | `docs-host-obsidian-vault:.../Intelligence-Integrations/superman-architecture.md` |
| **Honcho** | External user-modeling/peer-representation service (Plastic Labs) used for pre-dispatch scope advice and post-execution reflexion injection. | `docs-host-obsidian-vault:.../Intelligence-Integrations/HONCHO-DECISION.md` |
| **Scope Advisor** | Pre-dispatch component that queries Honcho/user-model context to advise on scope and approach before an agent is spawned. Distinct from router/driver selection. | `docs-host-obsidian-vault:.../Intelligence-Integrations/honcho-scope-advisor.md` |
| **MCP Gateway** | HTTP/stdio server inside the EMA daemon that exposes EMA's tools (vault search, task CRUD, proposals, project context, executions) to Claude agents via MCP. Outbound tool-exposure boundary (complement to inbound Driver/Provider). | `docs-host-obsidian-vault:.../Intelligence-Integrations/MCP-GATEWAY-ARCH.md` |
| **Distributed AI Delegation** | Mesh capability where a rate-limited EMA node routes Claude/inference calls through a peer node's credentials, sharing capacity without exposing keys. Sharpens Placement semantics. | `docs-host-obsidian-vault:.../EMA P2P Organization Mesh.md` |

> **Status:** these are **vault candidates**, not yet canonical. To promote
> a term to the main glossary, follow [`howto/resolve-an-open-question.md`](howto/resolve-an-open-question.md)
> shape (decision doc + back-references) and move the row up.

## Reserved tag vocabulary (used in `graph/nodes/*.qmd`)

`authority` · `execution` · `surface` · `workspace` · `collab` · `identity` · `placement` · `memory` · `orchestration` · `doctrine` · `ux-metaphor` · `transport` · `driver` · `recovery`

(See `graph/SCHEMA.md` for definitions.)
