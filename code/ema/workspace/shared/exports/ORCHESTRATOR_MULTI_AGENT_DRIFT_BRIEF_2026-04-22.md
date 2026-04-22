# Orchestrator multi-agent drift brief

**Generated:** 2026-04-22  
**Machine:** `agent-vm`  
**Mode:** controller-level parallel recovery / anti-drift synthesis

## Boundary

This brief is grounded on:
- live checks on `agent-vm`
- VM-visible files under `/home/trajan`
- parallel audits across current repo truth, recovery indexes, lineage/reference roots, runtime state, git drift hotspots, and embedded ClaudeForge surface lineage

It does **not** claim:
- host-only completeness
- full Discord history recovery
- that every repo/doc visible on the VM is equally canonical

---

## Executive summary

The current situation is structurally split:

1. **Current repo truth** says the canonical EMA runtime is the Elixir/Phoenix `daemon/` tree.
2. **Live runtime truth on agent-vm** does **not** currently show that daemon running.
3. **Live services actually running** are Node/operator surfaces:
   - `ema-observer.service` on `3200`
   - `claudeforge.service` on `3001`
   - `openclaw-gateway.service` on `18789`
4. **Recovery/index material is strong** and already gives a coherent anti-drift storyline.
5. **Lineage/reference roots are useful**, but only under strict trust rules.
6. **The repo is very dirty**: many modified and untracked files, including files that look canonical.
7. **Embedded ClaudeForge is real and useful as a provider/surface seam**, especially for Hermes session continuity, but it is **not** current EMA authority.

---

## Highest-confidence storyline

### Era 1 — place.org / placeOS
Use for product/world-model intent:
- browser-native personal workspace
- local-first feel
- desktop/operating-environment metaphor

### Era 2 — EMA Elixir/Phoenix daemon
Use for canonical runtime/control-plane concepts:
- sessions, tasks, proposals, execution lineage
- surfaces over a control-plane core
- daemon-owned architecture language

### Era 3 — ClaudeForge / TS operator-surface era
Use for surface and provider-intent recovery:
- Discord/web/terminal mirrored surfaces
- provider abstraction
- operator UX and session continuity patterns

### Era 4 — current correction
Use as the strategic anti-drift direction:
- p2p-first
- BEAM-native
- preserve useful TS-surface intent without making TS the substrate

---

## Canonical-source recommendations

### A. Current architecture/spec
Primary:
- `/home/trajan/Projects/ema/README.md`
- `/home/trajan/Projects/ema/docs/EMA-MASTER-SPEC.md`

Secondary/supporting:
- `/home/trajan/Projects/ema/docs/EMA-FULL-CONTEXT.md`

### B. Current runtime behavior
Primary:
- `/home/trajan/Projects/ema/daemon/lib/ema/application.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema_web/router.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema/control_plane/store.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema/control_plane/persistence.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema/surfaces/host_truth.ex`

### C. Operator workflow / runbook
Primary:
- `/home/trajan/Projects/ema/docs/AGENT-CONTRACT.md`
- `/home/trajan/Projects/ema/docs/STREAM_OF_THOUGHT_OPERATOR_RUNBOOK.md`

### D. Shared workspace collaboration surface
Primary:
- `/home/trajan/Projects/ema/workspace/shared/START_HERE.md`
- `/home/trajan/Projects/ema/workspace/shared/README.md`
- `/home/trajan/Projects/ema/workspace/shared/WORKSPACE_CONTRACT.md`
- `/home/trajan/Projects/ema/docs/AGENT_SHARED_WORKSPACE_ARCHITECTURE.md`

Important rule:
- `workspace/shared/` is an operator collaboration surface, **not** canonical architecture truth.

---

## Best anchor docs for any new Alfred recovery session

Read in this order:
1. `/home/trajan/workspaces/ema-context-sync/indexes/REFERENCE_INVENTORY.md`
2. `/home/trajan/workspaces/ema-context-sync/indexes/DRIFT_AUDIT.md`
3. `/home/trajan/Projects/ema/workspace/shared/exports/ALFRED_FIRST_PROMPT_PREVENT_DRIFT_2026-04-22.md`
4. `/home/trajan/Projects/ema/workspace/shared/exports/FIRST_PASS_ALL_VISIBLE_EMA_FILES_SOURCE_MAP_2026-04-22.md`
5. `/home/trajan/Projects/ema/workspace/shared/exports/TASK_1495918781271244991_CONTEXT_AND_EMA_RECOVERY_BRIEF_2026-04-22.md`
6. `/home/trajan/workspaces/ema-context-sync/notes/06-capability-map-beam-native.md`
7. `/home/trajan/workspaces/ema-context-sync/notes/05-overarching-proposal-vision.md`
8. `/home/trajan/Projects/ema/workspace/shared/exports/HERMES_EMA_LINEAGE_META_HARNESS_AUDIT_2026-04-22.md`

---

## Live runtime truth on agent-vm

### Verified running
- `ema-observer.service` → port `3200`
- `claudeforge.service` → port `3001`
- `openclaw-gateway.service` → port `18789`

### Not verified running
- no live Phoenix EMA daemon on `4488`
- no visible `beam.smp`, `mix phx.server`, or `ema-daemon` user service backing current repo truth

### Implication
There is a major **repo-truth vs live-runtime** split:
- source/docs point at EMA daemon on `4488`
- actual live surfaces are Node services on `3200`, `3001`, `18789`

Do **not** assume documented daemon truth equals live host truth.

---

## Git drift state in `/home/trajan/Projects/ema`

### High-level
- tracked modified files: `59`
- untracked files: `214`
- branch: `codex/surface-governor-refactor`

### Biggest hotspots
- `workspace/shared/`
- `recovered/adil/`
- `daemon/`
- `docs/`
- `cli/`
- nested `claudeforge/`
- `wiki-engine/`

### Highest-risk misleading files/areas
- untracked root `README.md`
- untracked `docs/EMA-MASTER-SPEC.md`
- untracked `docs/EMA-FULL-CONTEXT.md`
- untracked `docs/AGENT-CONTRACT.md`
- untracked `workspace/shared/START_HERE.md`
- dirty runtime/config files under `daemon/`
- mutable state under `daemon/priv/*.json*` and `*.jsonl`
- nested dirty `claudeforge/`
- untracked `recovered/adil/` recovery material

### Hygiene rule
Before trusting any file in this repo:
1. confirm machine boundary
2. check live runtime if relevant
3. check whether file is tracked or untracked
4. check whether file is modified/generated/runtime residue
5. prefer daemon code over notes/spec exports for current behavior

---

## Per-root trust rules outside the main repo

### `/home/trajan/Desktop/EMA-v1.1`
- trust: **medium**
- use for: intent/governance lineage, Chronicle promotion rules
- do not use for: current implementation truth

### `/home/trajan/archive/openclaw`
- trust: **low-medium**
- use for: historical predecessor patterns, migration rationale
- do not use for: active EMA assumptions

### `/home/trajan/.openclaw`
- trust: **low**
- use for: runtime archaeology only
- do not use for: design truth, architecture, or current semantics

### `/home/trajan/vault`
- trust: **medium-low**
- use for: intent mining, terminology, concept discovery
- do not use for: asserting implementation status without repo verification

### `/home/trajan/wiki`
- trust: **low-medium**
- use for: summaries and orientation
- do not use for: current-state authority

### `/home/trajan/staging/host-vault`
- trust: **low**
- use for: process/workflow cautions only
- do not use for: EMA truth claims

---

## ClaudeForge classification

`/home/trajan/Projects/ema/claudeforge` should be treated as:
- an **embedded historical surface project**
- with a **real active Hermes provider recovery seam**
- but **not** as EMA runtime/control-plane authority

Safe uses:
- provider registry shape
- normalized event/session contracts
- Discord/web surface patterns
- provider session continuity handling (`providerSessionId`, `X-Hermes-Session-Id`)

Unsafe use:
- letting ClaudeForge SQLite/API/session model become EMA truth
- treating expanding web pages as architecture authority
- allowing TS surface ergonomics to redefine canonical EMA control-plane semantics

---

## Top drift traps

1. Treating Discord or channel history as canonical truth
2. Treating untracked docs as settled canon
3. Treating live Node surfaces as proof that EMA daemon truth has been reconciled
4. Treating `.openclaw` runtime residue as reusable architecture
5. Treating vault/wiki mirrors as proof of current implementation state
6. Letting ClaudeForge surface contracts silently become EMA architecture
7. Confusing workspace/shared exports with canonical repo truth
8. Mistaking recent `control_plane_state.json` timestamps for a currently running EMA daemon

---

## Recommended next orchestrator actions

### Immediate
1. **Freeze the boundary statement** at the top of every new Alfred session:
   - current machine = `agent-vm`
   - source grounded in VM-visible files and live checks
   - Discord is a surface, not source of truth

2. **Start each session with the 8 anchor docs** listed above.

3. **Add a mandatory live-runtime check** before any daemon/runtime claim:
   - verify whether `4488` is actually serving
   - verify whether Node surface services are the only live components

4. **Treat the repo as dirty until reconciled**:
   - file provenance matters
   - tracked vs untracked matters
   - generated/runtime state must not masquerade as source

### Next recovery pass
5. Produce a **canonical-source-by-domain matrix** with columns:
   - domain
   - canonical file/path
   - secondary references
   - forbidden drift sources
   - verification method

6. Produce a **repo cleanliness / provenance pass** for top canonical docs and daemon files:
   - tracked?
   - modified?
   - generated?
   - runtime residue?
   - should Alfred trust it by default?

7. Produce a **live-surface vs daemon gap memo**:
   - what Node services currently provide
   - what Phoenix daemon source claims to provide
   - where the authoritative control plane is actually supposed to live

### Strategic
8. Use ClaudeForge only as a **surface/provider seam donor**, not as architecture lead.
9. Keep the rebuild aligned to **BEAM-native p2p control-plane truth**.
10. Preserve historical intent, but require repo/runtime verification before promoting anything into active canon.

---

## Controller note

This was produced from parallel subagent passes, not a single-doc read. The main practical result is simple:

**EMA currently has a strong recovered story, a strong repo-side daemon story, and a mismatched live-runtime story. Any new implementation work that skips that split will reintroduce drift immediately.**
