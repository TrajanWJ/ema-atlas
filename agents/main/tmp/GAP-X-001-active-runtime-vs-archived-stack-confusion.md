---
id: GAP-X-001
plane: gap
subtype: contradiction
status: open
severity: critical
created: 2026-04-13
updated: 2026-04-13
summary: "Some repo materials still imply the archived Elixir/Phoenix/Tauri stack is active while operating reality says the TypeScript/Electron monorepo is the live runtime"
resolution_target: reality
connections:
  - { target: "[[../../planning/schematic/PLAN-001-meta-ema-control-plane-reconciliation]]", relation: identifies_gap_in }
  - { target: "[[../../../docs/OPERATING-REALITY]]", relation: contradicted_by_reality }
  - { target: "[[../../../docs/GROUND-TRUTH]]", relation: contradicted_by_reality }
  - { target: "[[../../../docs/CONTRADICTIONS-AUDIT-2026-04-04]]", relation: evidence_for }
  - { target: "[[../../../docs/planning/launchpad-hq-consolidated]]", relation: contradicted_by_reality }
  - { target: "[[../../../ema-genesis/_meta/BLUEPRINT-REALITY-DISCREPANCIES]]", relation: contradicted_by_reality }
tags: [gap, contradiction, critical, runtime-authority]
---

# GAP-X-001 — Active Runtime vs Archived Stack Confusion

## Gap statement

The repo now explicitly says the active EMA runtime is the TypeScript/Electron monorepo, while some inherited docs and audit surfaces still push readers toward archived Elixir/Phoenix/Tauri assumptions or other stale topology claims.

## Why it matters

This is a control-plane failure, not just a documentation nit:
- agents assemble wrong context
- humans may debug the wrong runtime
- planning may accidentally target archaeological surfaces instead of live ones
- recovery instructions become unreliable

## Canon refs

- `ema-genesis/EMA-GENESIS-PROMPT.md`

## Planning refs

- `docs/planning/FIRST-META-EMA-SPACE.md`
- `ema-genesis/planning/schematic/PLAN-001-meta-ema-control-plane-reconciliation.md`

## Reality refs

- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`

## Evidence refs

- `docs/CONTRADICTIONS-AUDIT-2026-04-04.md`
- `docs/planning/launchpad-hq-consolidated.md`
- `ema-genesis/_meta/BLUEPRINT-REALITY-DISCREPANCIES.md`

## Proposed resolution

Do a targeted stale-surface correction pass:
- mark archaeological docs clearly as archival/reference
- stop using stale discrepancy docs as live operator orientation
- add one short control-plane index that points to the live runtime truth first

## Resolution path

1. create a compact operator control-plane index
2. relabel or supersede the worst stale docs
3. add promotion receipt links from corrected docs back to this gap
