# EMA Doc Plane Classification — 2026-04-13

Status: initial classification pass
Date: 2026-04-13

## Purpose

This document classifies major EMA docs into the four planes:
- canon
- planning
- reality
- gap

The goal is not perfection. The goal is to reduce ambiguity for agents and operators.

## Canon

- `ema-genesis/canon/specs/*`
- `ema-genesis/canon/decisions/*`
- `ema-genesis/_meta/CANON-STATUS.md`
- other explicit canon rulings under `ema-genesis/_meta/*` when functioning as governance/rulings

## Planning

- `docs/BLUEPRINT.md`
- `docs/planning/*`
- `ema-genesis/intents/*`
- `ema-genesis/SCHEMATIC-v0.md`
- `ema-genesis/EMA-GENESIS-PROMPT.md` (canonical target, but operationally should often be used as strategic planning target)
- `docs/INTENTION-BUILDING-SYSTEM.md`
- `docs/OPENCLAW-EMA-DECISIONS-2026-04-13-HOST-RECONCILED.md`
- future planning and schematic docs

## Reality

- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`
- `docs/backend/*`
- `README.md` (for current repo-use orientation)
- `AGENTS.md`
- `CLAUDE.md`
- `docs/MEMORY-SYNC.md`

## Gap

- `docs/CANON-PLANNING-BOUNDARY.md`
- `docs/GAP-LEDGER-SYSTEM.md`
- contradiction audits
- reconciliation reports
- implementation drift docs
- `ema-genesis/_meta/DOC-TRUST-HIERARCHY.md`
- `ema-genesis/_meta/BLUEPRINT-REALITY-DISCREPANCIES.md` (historical but gap-oriented)

## Mixed / needs care

These docs should be read with explicit plane awareness because they span multiple roles:

- `ema-genesis/EMA-GENESIS-PROMPT.md`
  - canon target, but contains strong planning energy and product vision
- `ema-genesis/SCHEMATIC-v0.md`
  - canon architecture target, but not implementation reality
- `docs/PRODUCT-SURFACES-MAP.md`
  - planning with implementation mapping
- `docs/backend/FUTURE-AGENT-HANDOFF-2026-04-12.md`
  - planning plus some reality grounding
- `docs/PLACE-ORG-EMA-ANALYSIS-2026-04-13.md`
  - planning/pattern-donor analysis, not canon or runtime truth

## Agent reading guidance

When unsure:
1. determine the plane first
2. avoid mixing plane claims in one statement
3. prefer explicit labels: `Canon:`, `Plan:`, `Reality:`, `Gap:`
