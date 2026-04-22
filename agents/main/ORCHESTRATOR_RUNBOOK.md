# Orchestrator Runbook

**Status:** Active
**Scope:** EMA, Wiki Engine, Claude, Codex, OpenClaw, ClaudeForge, MCP baseline, intent bootstrap
**Mode:** Preparatory + consolidatory, followed by staged execution

---

## 1. Mission

Prepare and execute the normalization of the host CLI integration stack so that:
- EMA becomes the canonical host control plane
- Wiki Engine becomes the canonical semantic memory substrate
- Intent state becomes explicit, queryable, and bootstrappable via MCP
- Claude and Codex operate as host-native session providers
- OpenClaw and ClaudeForge operate as surfaces over shared truth
- Vault is demoted from primary operational memory to import/archive role

---

## 2. North star

> EMA is the canonical host control plane and context assembler. Wiki Engine is the canonical semantic memory substrate. Claude and Codex are host-native session providers whose durable session artifacts are imported and normalized by EMA. OpenClaw and ClaudeForge are operator/session surfaces bound to EMA state, not independent authorities.

---

## 3. Rules

1. Recover before inventing.
2. Normalize before extending.
3. One source of truth per domain.
4. Thin plugins, thick canonical contracts.
5. No new parallel state silos.
6. Exact vs inferred recovery must stay separate.
7. Do not rely on vault as primary operational memory for new work.

---

## 4. Canonical ownership

### EMA
Owns:
- session registry
- task / proposal / execution / outcome authority
- context assembly
- surface bindings
- runtime/control truth

### Wiki Engine
Owns:
- durable semantic memory
- architecture docs
- decisions
- project state summaries
- linked semantic knowledge

### Intent layer
Owns:
- current focus
- objectives
- blockers
- next actions
- alignment across projects, sessions, and executions

### Claude / Codex native stores
Own:
- provider-native durable session history
- provider session ids
- provider event/transcript evidence

### OpenClaw / ClaudeForge / Discord
Act as:
- surfaces
- rendering layers
- operator bridges
- messaging/runtime UX

---

## 5. Immediate deliverables

1. `CANONICAL_ARCHITECTURE.md`
2. `INTENT_SCHEMA.md`
3. `CONTEXT_PACKAGE_SPEC.md`
4. readiness checklist for live intent bootstrap via MCP
5. initial wiki/intents buildout plan

---

## 6. Execution order

### Phase 1 — Freeze canonical truth
- write architecture doc
- write intent schema
- write context package spec
- define readiness checklist

### Phase 2 — Wiki + intent bootstrap scaffolding
- define canonical wiki pages
- define seed intents
- define project-state objects

### Phase 3 — MCP live bootstrap prep
- define `intent.*` MCP surface
- define `context.*` MCP surface
- define wiki sync MCP surface
- define OpenClaw capability parity expectations

### Phase 4 — Runtime implementation prep
- identify EMA files/modules to extend
- define commit sequence
- stage session normalization and Codex parity work

---

## 7. Readiness gate

The system is ready for live bootstrap when:
- canonical docs exist
- intent schema exists
- context package spec exists
- seed intents are defined
- MCP tool surface for intent/context exists on paper
- wiki pages to receive durable truth are defined
- OpenClaw/Claude/Codex can be pointed at the same shared-context model

---

## 8. Current active execution

Current runbook execution is focused on:
- creating canonical architecture/docs artifacts
- making the live bootstrap target explicit
- preparing wiki/intents-first operation
- preparing MCP-driven intent engine bootstrap

---

## 9. Stop conditions

Pause and reassess if:
- a new source of truth is proposed outside EMA/Wiki/Intent model
- Codex parity is skipped in favor of Claude-only integration
- vault is reintroduced as mandatory operational memory
- surfaces begin storing durable orchestration truth independently
