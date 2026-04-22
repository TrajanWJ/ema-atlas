# TS Runtime Reality Summary

## Runtime center
The active EMA runtime is TypeScript-first and Electron-hosted.

## Current implementation planes
- `apps/electron` — shell / desktop container
- `apps/renderer` — human-facing GUI surfaces
- `services` — backend/control-plane/runtime services
- `workers` — execution/background/async workload plane
- `cli` — agent/human command surface that must converge with GUI truth
- `shared` — schemas and shared contracts

## Required planning consequence
Do not plan EMA as if the archived daemon is still the active runtime.
Do salvage:
- concepts
- behaviors
- good product ideas
- supervision expectations
- chronicle/review expectations

Do not assume:
- old module boundaries
- old implementation structure
- old UI composition
