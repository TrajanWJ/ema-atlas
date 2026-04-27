# Timeline

Chronological skeleton of the lineage. Dates are approximate where the repo
evidence is thin — mark inferences with `~`. The timeline is a *reading aid*,
not a versioning source; authoritative provenance lives in
`lineage-index/inventory/` and in each branch's `SOURCE_CONTEXT.md`.

## Pre-2026 — place.org era

- **~2024-2025** — place.org / placeOS built as a browser-native
  workspace / virtual desktop / "place" metaphor (Next.js app).
  → branches: `codebase-place-org`, `codebase-place-companion`,
  `docs-place-org-era-research`

## ~early 2026 — OpenClaw era

- Multi-agent / Discord-native operator system layered on top of the
  place.org surface.
- Introduces named-role/handoff/watchdog patterns, operator-loop discipline.
- Merges with place.org into a hybrid era:
  → branches: `lineage-openclaw`, `lineage-openclaw-agent-workspaces`,
  `lineage-openclaw-archive-subprojects`, `codebase-place-org-openclaw`
- **2026-03-17** — OpenClaw Gateway port-conflict fix
  (`docs-vault-wiki/vault/.archive/openclaw-notes/2026-03-17 OpenClaw Gateway Port Conflict Fix.md`)
- **2026-03-20** — place.org v0.1 → v0.5 build session
  (`docs-vault-wiki/vault/.archive/host-sessions/2026-03-20 - place.org v0.1 through v0.5 Build Session.md`)

## ~mid-2026 — ClaudeForge era

- TypeScript Discord/web operator shell with provider abstraction, session
  manager, normalized events.
- First working surface↔Hermes seam (`hermes-provider.ts`, `X-Hermes-Session-Id`).
  → branches: `codebase-claudeforge`, `codebase-frontend-layer`,
  `codebase-mission-control-claude`
- Surrounding experiments: `codebase-executive`,
  `codebase-multi-agent-expirements`, `codebase-execudeck`,
  `codebase-agentgpt`, `codebase-superman`, `codebase-t3code-fork`,
  `codebase-agent-os-demo` and v8/bridge/demo-pages iterations.

## 2026-03 → 2026-04 — EMA daemon consolidation

- Elixir/Phoenix daemon established as the canonical control plane.
- OpenClaw doctrine crystallized into `babysitter/`; session discipline into
  `sessions/`; authority into `control_plane/`.
- ClaudeForge kept as the surface contract (snapshot inside
  `codebase-ema/code/ema/claudeforge/`).
  → branches: `lineage-original-elixir-ema`, `codebase-ema`
- **2026-04-03** — EMA ↔ OpenClaw node integration spec
  (`docs-vault-wiki/vault/.archive/openclaw-notes/EMA-OpenClaw-Node-Integration-Spec-2026-04-03.md`)
- **2026-04-13** — Daemon extraction impl notes, frontend buildout plan,
  subproject-A daemon backbone spec draft, TS runtime gap map, host-truth
  diagnostic
  (all under `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/01-PLANS/`
  and `04-CANON/`)
- **2026-04-14** — Ultimate Wiki inbox capture
- **2026-04-20** — Hermes↔EMA context integration
  (`codebase-ema/code/ema/docs/HERMES-EMA-CONTEXT-INTEGRATION-2026-04-20.md`)
- **2026-04-22** — Hermes/EMA lineage meta-harness audit published
  (`code/ema/workspace/shared/exports/HERMES_EMA_LINEAGE_META_HARNESS_AUDIT_2026-04-22.md`)

## 2026-04-22 — Transfer pack window (this repo)

- `ema-transfer-pack-20260422-060938` created as a public handoff snapshot
  so a machine-local agent on a different machine can clone, fetch all
  branches, and join cold.
- Branches added in two waves: original set (`BRANCH_MAP.md`), then expanded
  set after deeper host/agent-vm scans (`BRANCH_MAP_EXPANDED.md`).
- Same-day additions (2026-04-22): this graph layer —
  `SYSTEM_GRAPH.md`, `graph/nodes/*`, `graph/edges/*`, `AGENT_TRAVERSAL.md`,
  `AGENT_BOOTSTRAP.md`, `GLOSSARY.md`, `OPEN_QUESTIONS.md`, `TIMELINE.md`,
  `CONTRIBUTING_TO_GRAPH.md`, `SYSTEM_MANIFEST.json`, `scripts/*`.

## Strategic future (not yet in code)

- Mesh / P2P on BEAM-family base — `graph/edges/transport.md`
- Org / Space / Project schema inside `control_plane/schema.ex` —
  `graph/edges/identity.md`, `OPEN_QUESTIONS.md` Q1–Q4
- Collaboration-plane subsystem (CRDT or hybrid) for docs/wiki/canvas —
  `graph/edges/collab.md`, `OPEN_QUESTIONS.md` Q2, Q8
- Typed harness/driver registry — `graph/edges/execution.md`,
  `OPEN_QUESTIONS.md` Q5

---

## Reading the timeline

- **Eras overlap.** ClaudeForge and OpenClaw coexisted; place.org survived
  into the hybrid era.
- **Doctrine flows forward.** Each era contributes patterns upstream even
  after its code stops being canonical.
- **Code flows selectively.** Only `codebase-ema` carries code forward into
  v1.1; everything else is doctrine, UX metaphor, or interface contract.
