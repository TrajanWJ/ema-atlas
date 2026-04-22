---
id: PLANNING-MOC
ptype: moc
plane: planning
subtype: moc
title: "Planning Layer — Map of Content"
status: active
created: 2026-04-13
updated: 2026-04-13
author: system
tags: [moc, planning, schematic, intention-building]
connections:
  - { target: "[[../_meta/CANON-STATUS]]", relation: references }
  - { target: "[[../canon/specs/BLUEPRINT-PLANNER]]", relation: references }
---

# Planning Layer — Map of Content

This is the root index for EMA's intention-building layer.

## Purpose

The planning layer holds:
- aspirations
- candidate intents
- schematic/planning nodes
- promotion candidates
- planning-side expansions of blueprint/GAC work

It is not canon.
It is not runtime reality.
It is the structured formation layer between them.

## Folders

- `aspirations/`
- `gac-extensions/`
- `candidate-intents/`
- `schematic/`
- `promotion-candidates/`
- `_moc/`

## Relations that matter most

- `derived_from`
- `shapes`
- `decomposes_into`
- `targets_canon`
- `targets_runtime_surface`
- `blocked_by_gap`
- `promotion_candidate_for`
