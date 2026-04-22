# EMA Harness Design Overhaul

Status: active architecture synthesis
Date: 2026-04-13

## Executive summary

EMA's harness design should be overhauled around the active `runtime-fabric` subsystem and explicit decision boundaries.

The harness should not be conceived merely as:
- tmux session wrappers
- terminal attachment logic
- coding-agent launch helpers

Instead, the harness should be understood as the system that converts:
- planning and operational intent
- reviewed/promotion-approved downstream work
- human runtime control decisions

into bounded runtime activity with durable traceability.

## Current reality

The active runtime/harness authority is:
- backend subsystem: `runtime-fabric`
- CLI surface: `ema runtime ...`
- renderer surface: `Terminal`

Current live substrate:
- tmux-backed sessions
- local tool detection
- managed and attachable sessions
- pane capture
- runtime-state classification
- input relay
- durable activity events

This is already substantial enough to design around.

## Problem with older harness thinking

Older harness/bridge/session-shell concepts tend to be too vague.
They blur together:
- planning
- dispatch
- session control
- execution tracking
- tool transport

That creates architectural confusion.

## Correct harness role

The harness should sit between:
- operational planning / runtime demand
- proposal/execution decision boundaries
- runtime-fabric substrate
- review/provenance logging

It should answer questions like:
- should this work become a runtime session?
- which tool/runtime should receive it?
- should a managed session be created or an external one attached?
- what control decision was made at each step?
- what trace should be written back?

## Harness planes and boundaries

### Upstream inputs
- planning handoff candidates
- operational work requiring runtime execution
- proposal-approved work
- human runtime-control decisions

### Control boundaries
- approval / review / promotion where required
- runtime dispatch decision
- runtime redirect/stop/escalation decisions

### Downstream substrate
- `runtime-fabric`
- tmux sessions today
- future node-pty or other transport later

### Writeback outputs
- execution state
- runtime activity events
- result artifacts
- decision records / provenance links
- gap signals when runtime behavior diverges from plan

## Harness decision model

Harness design should explicitly include decision objects such as:
- `dispatch_decision`
- `runtime_selection_decision`
- `attach_vs_launch_decision`
- `interrupt_decision`
- `redirect_decision`
- `escalation_decision`
- `stop_decision`

These decisions should be visible and linkable rather than hidden inside raw event streams.

## Recommended architecture split

### `runtime-fabric`
Owns:
- transport/session/tool control
- session observation
- runtime-state classification
- input relay
- activity events

### proposal/execution systems
Own:
- approved runtime work
- execution lifecycle
- execution artifact/result truth

### Blueprint / planning systems
Own:
- shaping work before it becomes runtime demand

### Review / provenance systems
Own:
- reviewed imported material
- durable promotion receipts into downstream work

### Harness layer (conceptual, potentially thin implementation)
Owns:
- the decisionful conversion from approved/planned work into runtime-fabric actions
- durable control rationale about runtime choices

## Why this matters

Without this split, EMA risks:
- treating runtime-fabric like the whole execution system
- smuggling planning decisions into terminal control
- losing why a runtime session was launched or redirected
- making session transport feel like architecture instead of substrate

## Decision embedding in the harness

The harness should write or expose decisions such as:
- why a tool was selected
- why an existing external session was attached instead of launching a new one
- why a runtime was stopped or interrupted
- why work was escalated back to planning or review
- why execution evidence should create a gap or contradiction record

## Relationship to Blueprint

Blueprint can hand off runtime-worthy work, but should not directly become the harness.
Blueprint shapes; the harness dispatches and controls.

## Relationship to Human Ops

Human Ops can create runtime demand via:
- goals
- buildouts
- calendar blocks
- now-work decisions

But Human Ops should not own runtime transport/session internals.

## Relationship to Review and Decisions

Reviewed material or explicit decisions may trigger harness actions.
Harness outcomes should in turn produce:
- execution artifacts
- activity evidence
- decision records
- gap signals when expectations and runtime reality diverge

## Strong recommendation

Design the EMA harness around **decisionful dispatch over runtime-fabric**, not around generic session wrappers.

That keeps:
- planning honest
- runtime substrate replaceable
- provenance preserved
- control actions explainable
