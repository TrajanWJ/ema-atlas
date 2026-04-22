---
title: Design Decisions
created: '2026-03-14'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.6
confidence_updated: 2026-03-18T00:00:00.000Z
source: architecture-doc
tags:
  - agent-vm
  - architecture
  - boardroom
  - decisions
  - desk
  - field-reports
  - general
  - meetings
  - overview
  - projects
summary: 'Architectural decisions for the agent-vm agent fleet, with rationale.'
wiki_id: system/architecture/Design_Decisions
imported_from: vault/Architecture/Design Decisions.md
imported_at: '2026-04-04T00:23:56.739Z'
---
# Design Decisions

Architectural decisions for the agent-vm agent fleet, with rationale.

---

## DD-001: Single VM over Split VMs

**Decision:** Run all containers in a single KVM VM.

**Rationale:** Simpler management — one VM to start, stop, snapshot, and SSH into. Inter-container communication stays on a systemd bridge network instead of crossing VM boundaries. Can split later if isolation requirements change.

**Trade-off:** Additional services would share the VM network. Mitigated by systemd network segmentation and read-only filesystems.

---

## DD-002: OpenClaw over IronClaw

**Decision:** Use [[OpenClaw]] as the AI gateway platform.

**Rationale:** Largest community, most integrations across messaging platforms (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Matrix, Teams, LINE, IRC). More active plugin/skill ecosystem. The VM boundary mitigates supply chain risk — even if [[OpenClaw]] is compromised, the blast radius is contained to the VM.

**Risk:** [[OpenClaw]] has a history of supply chain attacks (ClawHavoc incident, CVE-2026-25253). See [[Security/Hardening|Hardening]] for mitigations.

---

## DD-003: systemd Socket Proxy (Tecnativa)

**Decision:** Use tecnativa/docker-socket-proxy instead of mounting the systemd socket directly into [[OpenClaw]].

**Rationale:** Prevents privilege escalation. A compromised [[OpenClaw]] container cannot use the systemd socket to escape to the host. The proxy filters API calls — only CONTAINERS, NETWORKS, and IMAGES operations are allowed, with POST enabled for container lifecycle management.

**Alternative rejected:** Direct socket mount with read-only flag — still allows container creation with host mounts.

---

## DD-004: XFCE over GNOME

**Decision:** Use XFCE as the VM desktop environment.

**Rationale:** ~200MB RAM overhead vs ~1GB for GNOME. In a 14GB VM running systemd containers, every GB matters. XFCE provides the GUI needed for virt-viewer access without wasting resources.

---

## DD-005: virbr0 NAT Only

**Decision:** Use a single NAT network (virbr0, 192.168.122.0/24) for the VM.

**Rationale:** Provides both internet access (for pulling images, updates) and host access (for SSH). No need for a separate bridge network. The VM gets a predictable static IP (192.168.122.10) via netplan.

**Trade-off:** VM is not directly accessible from other LAN devices. This is a feature, not a bug — limits attack surface.

---

## DD-006: Cloud-init Provisioning

**Decision:** Provision the VM using cloud-init (user-data, meta-data, network-config) rather than manual installation.

**Rationale:** Reproducible builds. The VM can be destroyed and recreated from the cloud image + cloud-init ISO in minutes. Configuration is version-controlled in `~/Desktop/agent-vm/cloud-init/`.

---

## DD-007: Autologin

**Decision:** Configure lightdm for passwordless autologin to the XFCE session.

**Rationale:** The VM is a tool, not a user workstation. Requiring a password on every boot adds friction without security value — the VM boundary itself is the security layer. The workstation user already authenticated to start the VM.

---

## DD-008: ~~Mission Control Bound to VM IP Only,~~ OpenClaw No Published Ports

> [!info] Superseded (2026-03-13)
> Mission Control was removed from the stack. [[OpenClaw]] is used directly. The "no published ports" decision for [[OpenClaw]] still applies.

**Decision:** ~~Mission Control publishes port 3000 only on 192.168.122.10 (the VM's IP).~~ [[OpenClaw]] has no published ports at all.

**Rationale:** [[OpenClaw]] communicates with messaging platforms via outbound connections. No inbound port exposure minimizes attack surface.

---

## DD-009: Kill the system Category

**Date:** 2026-03-16

**Decision:** Delete "the system" Discord category. Merge #boardroom → #meetings (in Command Center). Archive #field-reports. Agent coordination happens in-thread, not in a separate category.

**Rationale:** the system was branding theater. Two categories for a one-person operation created artificial separation between "you → agents" and "agents → agents." In practice, Trajan sees and directs everything. One Command Center is enough. Field reports were a dump channel — deliverables should go to the thread that spawned the work.

**Trade-off:** Loses the visible "agents talking to each other" space. Mitigated by identity headers in #meetings threads — you still see who's talking.

---

## DD-010: Trajan's Office Category

**Date:** 2026-03-16

**Decision:** Create a personal "Trajan's Office" category with #desk (text) and #decisions (forum). This is where Trajan talks to Right Hand directly.

**Rationale:** #general was impersonal. Trajan's primary interface should feel like his space, not a shared lobby. #desk replaces #general as the main text channel. #decisions creates a searchable, threaded log of significant decisions with context.

---

## DD-011: Project Promotion Lifecycle

**Date:** 2026-03-16

**Decision:** Projects start as forum posts in #projects. When they outgrow a single thread (3+ threads, multi-domain, or explicit promotion), they get their own Discord category with channels, mapped to `vault/Projects/[name]/`.

**Rationale:** Avoids premature channel creation. Most projects live and die as forum threads. Only significant, multi-session work earns a category. This keeps the active channel surface small.

**Lifecycle:** idea → active (forum thread) → promoted (own category) → complete (archived) → abandoned (archived with reason).

---

## DD-012: Agent Consolidation 16 → 8

**Date:** 2026-03-16

**Decision:** Consolidate from 16 agents to 8. Archive 5 (Interviewer, Architect, DevOps, Lab Tech, Debugger). Merge 3 pairs (Security+Auditor, VaultKeeper+Archivist, Foreman+Scheduler→TaskMaster).

**Rationale:** Per Round 3 audit — overlapping specialists waste context and cost. Architect/DevOps/Lab Tech/Debugger capabilities are subsets of existing core agents (Right Hand, Ops, Researcher). Merges consolidate genuinely overlapping scopes. 8 agents with clear boundaries > 16 with fuzzy overlap.

**Trade-off:** Less granular specialization. Mitigated by the fact that sub-agents can be recreated on demand if a specific specialty is needed again.

---

## DD-013: System Rebrand → Right Hand + Orchestrator

**Date:** 2026-03-16

**Decision:** Retire all System/Right Hand/🤝 branding. Main agent becomes "Right Hand" (visible voice). Routing layer becomes "Orchestrator" (invisible infrastructure). Agent identity headers stay but lose System theming.

**Rationale:** Trajan's preference: less formality, more cool. "System" was a roleplay metaphor that added complexity without value. Right Hand is what the main agent actually does — it's Trajan's right hand. Orchestrator describes the routing function without personifying it.

---

## DD-014: Forums as Default, Channels as Exception

**Date:** 2026-03-16

**Decision:** Every workspace channel is a forum by default. Text channels only for #desk (personal chat) and promoted project #overview channels. No text channels for work.

**Rationale:** Forum threads have lifecycles (open → working → shipped). Text channels are infinite scrolls with no structure. A forum post IS a task. A text message is noise. The server is a project management system, not a chat room.

---

## Related Notes

- [[System Overview]] — architecture diagram showing these decisions in context
- [[Discord Server Architecture v3]] — current server architecture
- [[Security/Threat Model|Threat Model]] — risk analysis that informed these decisions

#agent-vm #architecture #decisions

- [[Claude Code Bot]]
- [[README]]
- [[research]]
- README
- [[3]]
- [[-]]
- [[Deprecation]]
- [[and]]
- [[Advancement]]
- [[Analysis]]
- [[project_obsidian_vault]]
## DD-015: Working State ⇄ Persistent Truth (2026-03-16)

**Core architectural principle:** Forums are the working state, vault is persistent truth. They mirror each other bidirectionally.

- Forum threads = live workspaces where agents collaborate in real time
- Vault = durable knowledge that outlives any session or surface
- Agent does work in forum → findings committed to vault
- Vault has knowledge → agents reference it in forums
- Forum thread closes → vault retains the result
- New session starts → reads vault, spawns new forum thread if needed

**Surface independence:** Discord is the current rendering surface. The actual system is:
```
Working State (any surface) ⇄ Persistent Truth (vault)
         ↕                              ↕
    Agent Sessions                 Knowledge Graph (QMD)
```

Discord could be swapped for Slack, web UI, CLI, or any channel. The vault + agent protocol is the real system. The surface just makes it visible and interactive.

**Implication:** All agent protocols should reference "working state" and "vault" — never "Discord" or "forum" specifically, unless describing surface-specific rendering.

## DD-016: Dynamic Agent Ecosystem (2026-03-16)

**Decision:** Agents are not static roles with rigid chains. They're a dynamic ecosystem where:

1. **Dynamic Generation** — New specialist agents spawned on demand from templates in vault. [[Usage patterns]] drive what agents exist.
2. **Multiple Collaboration Modes:**
   - Linear sequential (A→B→C, each output feeds next)
   - Sub-agents (parent delegates, collects results)
   - Synchronous dispatch (parallel, synthesize after)
   - Open-ended collaboration (agents discuss freely, reach consensus)
   - Direct messaging (agent-to-agent mid-task)
3. **Agent Autonomy:**
   - Self-exit: agent recognizes it's not needed, leaves the collaboration
   - Kick: agent can remove another agent that's not contributing
   - Spawn: agent can create new specialized agents for subtasks
   - Skill creation: agent can author new skills when a gap is identified
4. **Template Library:** `vault/Agents/Templates/` stores agent blueprints (SOUL.md + IDENTITY.md + capabilities). Spawned dynamically, not pre-configured in [[OpenClaw]].json.
5. **QA Pipeline:** Agent prompts and templates are reviewed for quality, tested against scenarios, iterated.

**Rationale:** Static agent rosters don't scale. A system that generates its own specialists based on actual needs is self-organizing and adaptive.

**Replaces:** Fixed 8-[[agent roster]] as the only option. Core agents remain, but can be augmented dynamically.

## DD-017: Self-Learning Is The Core Product (2026-03-16)

**Decision:** The [[self-learning]] loop is not a feature — it's the primary value proposition of the entire system.

**The loop:**
```
Failure/Correction → Observation → Signal (logged) → Adaptation → Evolution (prompt modified) → Propagation (all agents)
```

**What makes it work:**
1. Signals captured in real-time, not after the fact
2. Confidence scoring determines speed of evolution (>95% = immediate, <80% = wait for 3 signals)
3. Evolution is concrete: actual .md files get modified, not just "noted for later"
4. Propagation is universal: all agents get updated protocols
5. Evolution is logged: audit trail in vault/System/[[Evolution Log]].md

**Implication:** Every feature, every protocol, every agent interaction should feed the [[self-learning]] loop. If something happens and the system doesn't learn from it, that's a bug.
