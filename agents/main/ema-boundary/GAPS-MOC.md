---
id: GAPS-MOC
type: moc
plane: gap
subtype: moc
title: "Gap Layer — Map of Content"
status: active
created: 2026-04-13
updated: 2026-04-13
author: system
tags: [moc, gap, contradiction, drift]
connections:
  - { target: "[[../_meta/CANON-STATUS]]", relation: references }
  - { target: "[[../planning/_moc/PLANNING-MOC]]", relation: references }
---

# Gap Layer — Map of Content

This is the root index for EMA's explicit gap layer.

## Purpose

The gap layer tracks:
- canon/reality drift
- planning/reality drift
- canon/planning under-decomposition
- contradictions
- promotion blockers
- trace failures

## Folders

- `canon-reality/`
- `planning-reality/`
- `canon-planning/`
- `contradictions/`
- `promotions/`
- `trace/`
- `_moc/`

## Relations that matter most

- `identifies_gap_in`
- `contradicted_by_reality`
- `blocks_promotion_of`
- `resolved_by`
- `superseded_by`
