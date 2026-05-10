# Bootstrap Orchestrator Prompt Patch - Post Sprint 2.5

Date: 2026-05-10
Status: prompt delta captured for the next bootstrap orchestrator rerun

Triggered by halt recorded in `docs/bootstrap/ORCHESTRATOR-LOG.md`
(2026-05-10). Read the log first.

This patch is the corrective for the halt recorded in
`docs/bootstrap/ORCHESTRATOR-LOG.md` (2026-05-10). Read that log first
to understand what failed and why; this patch is the conditional
resumption plan once Sprint 2.5 closes.

The original bootstrap orchestrator prompt is not stored as a repo file. This
artifact is the durable patch to apply to that prompt when the orchestrator is
rerun after sprint 2.5.

## 1. Recursive Frame Patch

In the "The recursive frame" section, after the paragraph ending:

```text
If the canon write of BOOTSTRAP-INT-001 fails, you halt: the substrate cannot
carry the orchestrator's own work, which means it cannot carry anything, which
is the finding that ends this run.
```

Add:

```text
Until sprint 3 lands canon writers, the orchestrator's "canon writes" are intent
records. Phase progress is tracked through intent.updated events on
BOOTSTRAP-INT-001 (status transitions: open -> proposed -> accepted ->
executing -> satisfied). Each phase's canon node referenced below becomes a
child intent linked to BOOTSTRAP-INT-001 by edge, not a canon node. When sprint 3
ships canon, this orchestrator gets a successor that promotes those intent
records to canon nodes; for now, intents-as-canon is the operational substitute.
```

## 2. Phases Preamble Replacement

Replace the "Phases" section preamble with:

```text
Post-sprint-2.5, the orchestrator runs Phase 0 (truth audit) and Phase 4
(Proslync setup) only. Phases 1, 2, 3, 5, 6, 7, 8 require sprint 3 (Codex
adapter, restart survival, canon writer) and sprint 4 (artifact promotion).
When sprint 3 lands, a successor orchestrator runs phases 1-8.
```

## 3. Canon Written Interpretation

In every phase definition, interpret "Canon written:" as "Intent recorded:"
until sprint 3 lands canon writers.

Specific substitutions:

- Phase 0: file `BOOTSTRAP-CANON-001-truth-audit` as
  `BOOTSTRAP-INT-002-truth-audit`, `kind=bootstrap`, parent
  `BOOTSTRAP-INT-001`.
- Phase 1: skip. Codex adapter is sprint 3 and beyond.
- Phase 2: skip. Canonical state population is sprint 3 and beyond.
- Phase 3: skip. Self-knowledge canon nodes require sprint 3 canon writers.
- Phase 4: file `PROSLYNC-INT-001` with the Brand HQ activation-field UI proof
  scope from `docs/bootstrap/ORCHESTRATOR-LOG.md`; generate
  `PROSLYNC-PROP-001`; halt for human approval. This is the natural sprint 2.5
  terminating phase.
- Phase 5: skip until sprint 3.
- Phase 6: skip until sprint 3/sprint 4.
- Phase 7: skip until sprint 3.
- Phase 8: skip until successor orchestrator closeout.

## 4. Resumption Protocol Patch

In "Resumption protocol", replace step 3 with:

```text
Determine the last completed phase by querying intent records:
`ema intent list --kind bootstrap --json` returns the orchestrator's progress
markers. The last bootstrap intent with status "satisfied" is the last
completed phase.
```

## 5. Drift Guard 10 Replacement

Replace Drift Guard 10 with:

```text
The recursive-self framing is load-bearing. If at any point the orchestrator's
own work cannot be filed as an EMA intent because the substrate fails, that is
the run's terminating finding - document and stop. (Sprint 2.5 was the
corrective for the original instance of this finding; if it recurs, sprint 2.5
did not land cleanly.)
```

## 6. Post-Sprint-2.5 Rerun Gate

The rerun should begin only after these commands exist and return JSON:

```bash
ema intent create --json --id BOOTSTRAP-INT-001 --kind bootstrap
ema intent list --kind bootstrap --json
ema intent update BOOTSTRAP-INT-001 --status proposed --json
ema proposal create --json --id BOOTSTRAP-PROP-001 --intent BOOTSTRAP-INT-001
ema proposal approve BOOTSTRAP-PROP-001 --actor HUMAN-001 --rationale "approve bootstrap orchestrator rerun" --json
```

The rerun should not require `ema canon ...` yet. If it does, the old prompt was
not patched correctly.
