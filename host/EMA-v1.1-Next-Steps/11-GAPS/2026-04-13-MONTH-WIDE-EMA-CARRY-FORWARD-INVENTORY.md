---
id: GAP-MONTH-WIDE-EMA-CARRY-FORWARD-INVENTORY
type: recovery-ledger
layer: month-wide-recovery
title: "Month-wide EMA carry-forward inventory — April 2026 sessions, recovery canon, archive concepts"
status: draft
created: 2026-04-13
scope: "April 2026 EMA work across planning workspace, active repo, chronicle captures, and archived old-build concepts"
related:
  - "[[11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER.md]]"
  - "[[11-GAPS/2026-04-13-FORENSIC-AUDIT-GAP-LEDGER.md]]"
  - "[[08-IMPORTS/legacy-and-related-code/OLD-EMA-BORROW-ANALYSIS.md]]"
  - "[[/home/trajan/Projects/ema/ema-genesis/_meta/SELF-POLLINATION-FINDINGS.md]]"
  - "[[/home/trajan/Projects/ema/ema-genesis/intents/INT-RECOVERY-WAVE-1/README.md]]"
  - "[[/home/trajan/Projects/ema/ema-genesis/intents/INT-SESSION-RECOVERY-2026-04-13/README.md]]"
tags: [recovery, april-2026, carry-forward, migration, old-build, chronicle]
---

# Month-wide EMA Carry-Forward Inventory

> This is the broadest recovery ledger for the current pass.
>
> Goal: prevent loss of April 2026 EMA work by flattening four sources into one
> operational inventory:
>
> 1. `~/Desktop/EMA-v1.1-Next-Steps/`
> 2. `~/Projects/ema/`
> 3. `~/.local/share/ema/chronicle/` + recovered vault/wiki material
> 4. `IGNORE_OLD_TAURI_BUILD/`
>
> This is not a claim that every raw session line was manually read. It is a
> synthesis pass grounded in:
> - the April planning freeze deliverables
> - active/recovered intents and canon in the live EMA repo
> - recovered vault/wiki architecture docs
> - Chronicle-scale evidence that the month's work was overwhelmingly EMA-related
>
> Hard counts observed during this pass:
> - `ema-genesis/intents/` intents created in April 2026: **37**
> - recovered intents with `recovered_from:`: **11**
> - April canon specs: **14**
> - recovered canon specs: **11**
> - `EMA-v1.1-Next-Steps` April 13 planning docs: **15**
> - Chronicle normalized sessions under `~/.local/share/ema/chronicle/sessions/`: **10,237**
> - Chronicle sessions with `ema` in content: **7,517**
> - Chronicle sessions with `proposal` in content: **5,366**
> - Chronicle sessions with `agent` in content: **4,845**
> - Chronicle sessions with `chronicle` / `review` / `intent` terms: **6,821**

## Status legend

- `must-build-now` — should be treated as active carry-forward scope for v1.1 / current program
- `keep-as-canon` — concept survives and should shape design, but not necessarily be built immediately
- `defer-explicitly` — preserve as open intent / future wave, do not accidentally drop
- `archive-only` — useful as archaeology or inspiration, not something to port literally

## A. Month-wide verdict

The "lost work" risk is real, but it is not mainly that ideas disappeared.
The stronger pattern is:

- important old EMA concepts were recovered into canon/spec/intents
- important April implementation work landed in partial slices
- substantial product/runtime closure is still missing
- deprecated and archive-era concepts are still polluting the mental model

So the actual carry-forward job is:

1. preserve recovered concepts as explicit design targets
2. close the missing runtime/product seams in the TS build
3. explicitly mark what is archive-only so it stops competing for attention

## B. Must Build Now

These are the carry-forward items that appear repeatedly across:
- old-build archaeology
- April canon recovery
- current repo intents
- next-steps gap ledgers
- chronicle/review/session recovery notes

### 1. Independent daemon backbone

Status: `must-build-now`

Why:
- April 13 planning freeze treats this as the blocking architecture move
- Electron-owned daemon lifecycle is now a known failure seam
- required for multi-client CLI/GUI/tooling use

Sources:
- `10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md`
- `01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT.md`
- `11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER.md`

### 2. Proposal pipeline, full stage chain

Status: `must-build-now`

Carry-forward shape:
- Generator
- Refiner
- Debater
- Scorer
- Tagger
- Combiner
- KillMemory
- optional AutoDecomposer

Why:
- old EMA had a real differentiated pipeline
- active TS repo explicitly says current implementation is only a narrow slice
- appears across self-pollination, active intent, old build plan, and chronicle-heavy proposal activity

Sources:
- `/home/trajan/Projects/ema/ema-genesis/intents/INT-PROPOSAL-PIPELINE/README.md`
- `/home/trajan/Projects/ema/ema-genesis/_meta/SELF-POLLINATION-FINDINGS.md`
- `/home/trajan/Projects/ema/docs/BUILD_PLAN_SYSTEMS.md`
- `11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER.md`

### 3. Actor workspace + agent collaboration

Status: `must-build-now`

Carry-forward shape:
- humans and agents as first-class actors
- enforced `idle / plan / execute / review / retro`
- phase transition log
- EntityData / polymorphic tags
- worktree-per-agent isolation
- coordinator for cross-agent work
- trust/routing actually used

Why:
- recovered as one of the clearest EMA-native systems
- directly tied to agent collaboration, dispatch, and workspace truth
- old build had decorative scaffolding; new build should not repeat that mistake

Sources:
- `/home/trajan/Projects/ema/ema-genesis/canon/specs/ACTOR-WORKSPACE-SYSTEM.md`
- `/home/trajan/Projects/ema/ema-genesis/intents/INT-AGENT-COLLABORATION/README.md`
- `/home/trajan/Projects/ema/ema-genesis/_meta/SELF-POLLINATION-FINDINGS.md`

### 4. Babysitter-grade session supervision

Status: `must-build-now`

Carry-forward shape:
- stalled vs active vs completed classification
- last meaningful action
- import/resume/rebind visibility
- escalation when work stalls
- lane-based observability

Why:
- this is one of the most repeated "old EMA felt more developed" seams
- next-steps planning explicitly calls for babysitter-grade confidence
- current month handoffs flag stale sessions and recovery blind spots

Sources:
- `/home/trajan/Projects/ema/ema-genesis/canon/specs/BABYSITTER-SYSTEM.md`
- `20-CHRONICLE-REVIEW/SESSION-SUPERVISION-RECOVERY-NOTES.md`
- `03-OPS/HOST-TRUTH-DIAGNOSTIC-2026-04-13.md`

### 5. Chronicle -> Review -> Promotion seam

Status: `must-build-now`

Carry-forward shape:
- Chronicle as durable landing zone
- reviewable imported sessions/artifacts
- promotion receipts with provenance
- unified timeline and raw history browse surface

Why:
- imported history otherwise has nowhere durable to land
- multiple April docs treat this as the missing product seam
- session recovery intent explicitly depends on it

Sources:
- `/home/trajan/Projects/ema/ema-genesis/intents/INT-CHRONICLE-LANDING-ZONE/README.md`
- `/home/trajan/Projects/ema/docs/backend/GOLDEN-PATH-CHRONICLE-REVIEW.md`
- `20-CHRONICLE-REVIEW/RECENT-CHRONICLE-DIGEST-2026-04-13.md`

### 6. Pipes automation, fully wired

Status: `must-build-now`

Carry-forward shape:
- trigger / transform / action registry
- stock pipes
- scheduler wiring for system triggers
- history + CLI/MCP/UI visibility

Why:
- one of the cleanest old subsystems
- recovered into canon and partially ported already
- still appears as incompletely closed in v1.1 planning

Sources:
- `/home/trajan/Projects/ema/ema-genesis/canon/specs/PIPES-SYSTEM.md`
- `/home/trajan/Projects/ema/ema-genesis/intents/INT-RECOVERY-WAVE-1/README.md`
- `11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER.md`

### 7. Human Ops / Desk daily surface

Status: `must-build-now`

Carry-forward shape:
- one truthful daily surface
- day object
- brief / review / commitments / check-ins
- bridge to tasks, goals, calendar, user state

Why:
- this is one of the few slices that already became concretely usable in April
- gives EMA a real operator entry point instead of pure architecture churn

Sources:
- `/home/trajan/Projects/ema/ema-genesis/intents/INT-HUMAN-OPS-BOOTSTRAP/README.md`
- `/home/trajan/Projects/ema/docs/HUMAN-OPS-SESSION-MANIFEST-2026-04-13.md`

### 8. Intentions Schematic / Blueprint mutation surface

Status: `must-build-now`

Carry-forward shape:
- natural-language mutation of intent tree
- contradictions / clarifications / hard answers / aspirations
- scope locks
- update log

Why:
- verified operational in recovered architecture docs
- strongly aligned with EMA-native planning rather than generic CRUD
- likely collapses a lot of manual planning friction if rebuilt on the new spine

Sources:
- `~/.local/share/ema/vault/wiki/Architecture/intentions-schematic-engine.md`
- `/home/trajan/Projects/ema/ema-genesis/canon/specs/BLUEPRINT-PLANNER.md`

### 9. CLI/GUI parity and route triage

Status: `must-build-now`

Carry-forward shape:
- stop silent `"unknown"` failures
- quarantine ghost routes
- one daemon-visible contract
- CLI that is not dependent on Electron spawn

Why:
- this was the whole reason the April 13 planning workspace was created
- multiple handoffs say the user-felt product breakage is immediate and severe

Sources:
- `13-CLI-GUI-PARITY/CLI-ROT-DIAGNOSTIC-2026-04-13.md`
- `13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13.md`
- `11-GAPS/GUI-ROT-DIAGNOSTIC-2026-04-13.md`
- `00-INBOX/2026-04-13-SESSION-0-HANDOFF.md`

## C. Keep As Canon

These concepts clearly survive the month and should continue to shape EMA,
even if they are not all first-wave implementation targets.

### 10. Maximalist Genesis scope

Status: `keep-as-canon`

Meaning:
- 35-vApp ambition
- daemon-centered local system
- shared graph + workspaces + research + machine surfaces

Why:
- canon ruling on 2026-04-12 explicitly says Genesis wins
- `EMA-V1-SPEC` is only Phase 1 inside Genesis, not a replacement

Sources:
- `/home/trajan/Projects/ema/ema-genesis/_meta/CANON-STATUS.md`
- `/home/trajan/Projects/ema/ema-genesis/canon/specs/EMA-V1-SPEC.md`

### 11. EMA-native object model / two-layer truth

Status: `keep-as-canon`

Meaning:
- filesystem/source-of-truth + indexed runtime mirror
- intents as durable graph objects
- provenance-rich link model

Why:
- repeatedly named as one of EMA's unique contributions
- should survive regardless of transport/runtime changes

Sources:
- `/home/trajan/Projects/ema/ema-genesis/_meta/SELF-POLLINATION-FINDINGS.md`
- `04-CANON/SOURCE-OF-TRUTH.md`

### 12. Proposal quality gate / scoring discipline

Status: `keep-as-canon`

Meaning:
- approval quality bar
- multi-dimensional scoring
- anti-slop proposal generation

Why:
- one of the strongest distinctive concepts from old EMA
- aligns with review-driven execution rather than speculative agent thrash

Sources:
- `/home/trajan/Projects/ema/ema-genesis/canon/specs/PROPOSAL-QUALITY-GATE.md`
- `/home/trajan/Projects/ema/ema-genesis/intents/INT-PROPOSAL-PIPELINE/README.md`

### 13. EMA voice, naming, and semantic discipline

Status: `keep-as-canon`

Meaning:
- names/slugs/voice consistency
- canon-level doc discipline
- typed edges and explicit object relations

Why:
- a lot of April work was canon repair and semantic cleanup
- this is overhead only if ignored; otherwise it prevents drift

Sources:
- `/home/trajan/Projects/ema/ema-genesis/intents/INT-CANON-REPAIR-CANON-STATUS-INDEX/README.md`
- `/home/trajan/Projects/ema/ema-genesis/_meta/CANON-STATUS.md`

### 14. Recovery-wave visual/design system work

Status: `keep-as-canon`

Meaning:
- `@ema/tokens`
- `@ema/glass`
- shared shell primitives

Why:
- the old build had a strong visual identity
- April recovery work explicitly marked tokens/glass as a stream
- even if implementation status drifted over time, the direction is correct

Sources:
- `/home/trajan/Projects/ema/ema-genesis/intents/INT-RECOVERY-WAVE-1/README.md`

## D. Defer Explicitly

These should stay visible as valid scope so they do not disappear, but they
should not be allowed to parasitize current closure work.

### 15. Channel integrations

Status: `defer-explicitly`

Meaning:
- claude.ai
- ChatGPT
- Discord
- iMessage
- external history imports

Why:
- important, but intentionally blocked on Chronicle landing zone

Sources:
- `/home/trajan/Projects/ema/ema-genesis/intents/INT-CHANNEL-INTEGRATIONS/README.md`
- `/home/trajan/Projects/ema/ema-genesis/intents/INT-SESSION-RECOVERY-2026-04-13/README.md`

### 16. Cross-machine / distributed mesh / CRDT sync

Status: `defer-explicitly`

Meaning:
- P2P mesh
- Syncthing/Loro/Automerge style split
- multi-machine dispatch as first-class product behavior

Why:
- still part of Genesis
- explicitly not phase-1 critical

Sources:
- `/home/trajan/Projects/ema/ema-genesis/_meta/SELF-POLLINATION-FINDINGS.md`
- `/home/trajan/Projects/ema/ema-genesis/_meta/CANON-STATUS.md`

### 17. Multi-provider agent session discovery at full scope

Status: `defer-explicitly`

Meaning:
- beyond Claude/Codex
- broader CLI/session ecology

Why:
- strategically right
- not the first bottleneck versus getting current session supervision working

Sources:
- `/home/trajan/Projects/ema/ema-genesis/_meta/SELF-POLLINATION-FINDINGS.md`

### 18. Full vApp catalog realization

Status: `defer-explicitly`

Meaning:
- all 35 vApps
- window isolation for all
- full launchpad completion

Why:
- keep the target
- do not confuse it with the immediate current work of reconciling and closing the few live routes

Sources:
- `/home/trajan/Projects/ema/ema-genesis/vapps/CATALOG.md`
- `04-CANON/VAPP-RECONCILIATION-TABLE.md`

### 19. Evolution / autonomy / self-improvement loops

Status: `defer-explicitly`

Meaning:
- autonomous reasoning
- evolution rules
- auto-approve and self-improvement systems

Why:
- these appeared in early April backlog and system audits
- they are valid future scope, but they depend on better closure in execution, review, and supervision

Sources:
- `~/.local/share/ema/vault/wiki/Archive/2026-04-06-pre-cleanup-harvest.md`
- `/home/trajan/Projects/ema/docs/BUILD_PLAN_SYSTEMS.md`

## E. Archive Only

These should stay mined for patterns, field names, tests, and examples, but
they should not be revived as first-class runtime targets.

### 20. Old Elixir / Phoenix / Tauri runtime substrate

Status: `archive-only`

Do not port literally:
- Phoenix channels
- OTP supervision tree implementation
- Tauri shell/window/capabilities machinery
- old daemon commands as current operator instructions

Why:
- every current truth doc says this is archived runtime, not active runtime

Sources:
- `/home/trajan/Projects/ema/README.md`
- `/home/trajan/Projects/ema/docs/OPERATING-REALITY.md`
- `08-IMPORTS/legacy-and-related-code/OLD-EMA-BORROW-ANALYSIS.md`

### 21. Archive-era frontend/store sprawl

Status: `archive-only`

Meaning:
- 50+ stores
- route proliferation
- old shell surfaces with no active backend truth

Why:
- mine for inventory and UI ideas
- do not treat as authoritative implementation

Sources:
- `IGNORE_OLD_TAURI_BUILD/app/src/stores/*`
- `13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13.md`

### 22. OpenClaw-era compatibility ghosts

Status: `archive-only`

Meaning:
- old wrappers
- Python shim / mixed CLI layers
- legacy sync/adapters with no current contract

Why:
- repeatedly appears in early-April harvest and live-repo docs as drag or compatibility burden

Sources:
- `~/.local/share/ema/vault/wiki/Archive/2026-04-06-pre-cleanup-harvest.md`
- `/home/trajan/Projects/ema/docs/cli/BUILD_PLAN.md`

### 23. Stale decorative domains with no present closure path

Status: `archive-only` unless re-promoted by a fresh intent

Examples:
- half-real campaigns layer
- decorative agent fleet rows
- shells that only exist as mock routes

Why:
- these are not wrong concepts, but they should not stay in the active mental model without a current owner, intent, and delivery path

## F. Deprecated But Still Important

These are exactly the things that can get lost if "deprecated" is treated as
"irrelevant." They are deprecated as implementation, but still important as
semantic carry-forward.

### 24. Old build domain inventory

Status: `keep-as-canon` conceptually, `archive-only` as code

Important domains named repeatedly:
- BrainDump
- Tasks
- Projects
- Proposals
- Habits
- Journal
- Agents
- Pipes
- SecondBrain
- Responsibilities
- Canvas
- ClaudeSessions
- Actors
- Intents

Why:
- this is still the best compact map of EMA's intended product breadth

Source:
- `08-IMPORTS/legacy-and-related-code/OLD-EMA-BORROW-ANALYSIS.md`

### 25. Old backlog and stale work should not be deleted mentally

Status: `defer-explicitly`

Examples from April 6 pre-cleanup harvest:
- Intent Engine bootstrap/population
- dead WebSocket topic fixes
- project context contract
- workspace proof / context loader
- outcome linker
- auto-approve rules
- domain agents
- campaign manager
- pattern crystallizer
- autonomous reasoning loop

Why:
- even when these are not current P0s, they are evidence of real previously-shaped work and should stay queryable as backlog seeds

Source:
- `~/.local/share/ema/vault/wiki/Archive/2026-04-06-pre-cleanup-harvest.md`

## G. Consolidated carry-forward stack

If everything above is compressed to the irreducible "do not lose this"
stack, it is:

1. daemon independence + new orchestration spine
2. intent -> proposal -> execution -> chronicle/review closure
3. proposal pipeline in full, not seed stubs
4. actor workspace and agent collaboration
5. babysitter-grade supervision and session truth
6. pipes automation
7. human ops / desk daily entry surface
8. intentions schematic / blueprint mutation workflow
9. CLI/GUI parity and route truth
10. Genesis maximalist target as canon, with archive/runtime substrate kept separate

## H. Operational conclusion

The month's EMA work should not be thought of as "a bunch of disconnected
sessions."

It is better described as four overlapping strands:

1. **Reality correction** — discovering what in the TS repo is real versus fake
2. **Recovery** — porting or re-canonicalizing what was strong in the old build
3. **Program planning** — freezing the v1.1 build order and daemon direction
4. **Operator usability** — trying to get to one truthful, daily-usable EMA surface

The loss risk is therefore:

- not losing old code
- not losing old and April-discovered *meaning*

This ledger is the flattened answer to that.
