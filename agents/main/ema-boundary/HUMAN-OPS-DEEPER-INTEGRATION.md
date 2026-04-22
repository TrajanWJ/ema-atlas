# Human Ops — Deeper Integration

Status: active architecture synthesis
Date: 2026-04-13

## Executive summary

Human Ops should be the primary operator surface over the **operational planning plane**.
It should integrate with planning, decisions, review, and runtime work without collapsing into any of them.

## Role

Human Ops should help answer:
- what matters today and this week?
- what is owned now?
- what should be scheduled?
- what should be handed off to runtime work?
- what should be reviewed or deferred?

## Inputs Human Ops should consume

### From planning
- mature planning artifacts
- promotion candidates ready for owned work
- important gaps that affect day/week planning

### From decisions
- operational decisions
- selected planning decisions that became active work constraints
- precedent reminders when relevant

### From review/provenance
- reviewed goal candidates
- reviewed calendar candidates
- reviewed follow-up candidates

### From runtime/execution
- execution evidence relevant to current commitments
- failed execution fallout that should change daily planning
- agent agenda blocks and active work context

## Outputs Human Ops should create or influence

- active goals
- calendar commitments
- buildouts
- day plans
- now-task decisions
- runtime demand when work is ready to execute
- review blocks when unresolved material needs human attention

## Core boundary

Human Ops should not become:
- canon editor
- Blueprint substitute
- Review queue
- runtime-fabric control shell

It is the tractable work ownership and scheduling layer.

## Deeper integration rule

When planning or reviewed material becomes owned work, Human Ops should be the layer that operationalizes it.
When runtime or review surfaces produce meaningful consequences for the day/week, Human Ops should absorb them as operational reality.

## Strong recommendation

Treat Human Ops as the bridge between strategic shaping and lived execution, but keep the semantic and runtime layers distinct.
