# Blueprint Planner Convergence

Status: active architecture synthesis
Date: 2026-04-13

## Purpose

Define Blueprint Planner as the primary operator surface for:
- intention-building
- gaps
- promotion candidates
- selected reviewed provenance inputs

## Core role

Blueprint Planner is not the entire planning system.
It is the main human-facing shaping surface over the planning and gap planes.

## It should own
- GAC queue interaction
- aspiration review/conversion
- candidate intent shaping
- planning/schematic graph browsing
- promotion-candidate surfacing
- important open gap surfacing

## It should consume
- canon targets
- planning nodes
- gap records
- selected Chronicle/Review outputs once approved for planning relevance

## It should not bypass
- Review as the decision boundary for provenance-derived material
- canon ratification rules
- operational planning ledgers for scheduled work

## Relationship to the planes

- canon: target/reference plane
- planning: primary working plane
- gap: secondary working plane
- provenance: selective reviewed inputs
- operational planning: downstream handoff when planning becomes owned work
- runtime: downstream handoff when planning becomes executable work
