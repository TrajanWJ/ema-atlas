# Human Ops Integration

Status: active architecture synthesis
Date: 2026-04-13

## Purpose

Define how Human Ops fits into the broader EMA multi-plane architecture.

## Key distinction

Human Ops is primarily part of the **operational planning plane**, not the canon plane and not the intention-building plane.

It should consume:
- canon constraints where relevant
- planning outputs when they become owned work
- reviewed provenance inputs when safely promoted

It should manage:
- goals
- calendar commitments
- buildouts
- day objects
- user-state-aware daily planning

## Core rule

Human Ops should not be asked to carry canon semantics or pre-canonical blueprint formation directly.
It is the layer for tractable day/week execution and recovery.

## Relationship to planning

- intention-building shapes what may matter
- Human Ops shapes what is actually owned/scheduled now

## Relationship to runtime

- Human Ops can emit proposal and execution demand through goals/buildouts
- but it should not become the runtime ledger itself
