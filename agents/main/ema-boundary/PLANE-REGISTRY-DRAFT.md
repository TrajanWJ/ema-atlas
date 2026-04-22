# EMA Plane Registry (Draft)

Status: draft reference
Date: 2026-04-13

## Planes

| Plane | Role | Primary storage | Examples |
|---|---|---|---|
| canon | authoritative semantic truth | file-backed semantic graph | canon specs, decisions |
| planning | intention-building and schematic formation | file-backed semantic graph | aspirations, candidate intents, planning nodes |
| operational-planning | owned and scheduled work | SQLite runtime ledger | goals, calendar, buildouts, human-ops day |
| runtime | active proposal/execution/session work | SQLite + sessions + artifacts | proposals, executions, runtime fabric |
| reality | current implementation and host truth | docs + code + manifest + DB | operating reality, backend manifest |
| provenance | reviewed trace and promotion lineage | Chronicle files + SQLite review tables | chronicle, review items, receipts |
| gap | explicit drift/contradiction/blockage tracking | file-backed semantic graph | canon-reality gaps, contradictions |
| surface | UI/CLI/read-model projections | derived interfaces | apps, dashboards, CLI surfaces |

## Intended use

This draft registry is for architectural reference only.
If EMA later exposes plane-aware graph or read-model tooling, this can become input material for that system.
