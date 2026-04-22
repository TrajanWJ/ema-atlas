# OpenClaw Capability Parity Map

**Goal:** Define how OpenClaw should relate to the canonical EMA + MCP capability surface.

---

## Principle

OpenClaw is a surface and operator bridge.
It should consume canonical EMA truth where shared state matters.
It should only use native OpenClaw capabilities where they are genuinely surface-specific or superior UX primitives.

---

## Capabilities that should route through EMA/MCP

### Shared truth capabilities
- project state
- intent state
- bounded context packages
- session normalization state
- task/proposal/execution summaries
- wiki/project-state sync

### Canonical routes
- `intent.*`
- `context.*`
- future canonical `sessions.*` summary endpoints

---

## Capabilities that remain natively OpenClaw

### Surface-native
- chat routing
- Discord/thread/session presence
- browser/tool bridge
- session orchestration UX
- message sending/reply mechanics
- subagent/spawn management

These remain OpenClaw-native, but should bind to EMA truth where they reference project/session state.

---

## Anti-patterns to avoid

- OpenClaw independently assembling canonical cross-surface context
- OpenClaw storing durable project or intent truth outside EMA
- OpenClaw becoming the primary memory system for active project state
- Discord thread state being treated as authority over EMA project state

---

## Readiness rule

OpenClaw is aligned when:
- recovery answers derive from EMA context packages first
- shared project/intents answers match Claude/Codex view
- OpenClaw-native features augment the surface without forking truth
