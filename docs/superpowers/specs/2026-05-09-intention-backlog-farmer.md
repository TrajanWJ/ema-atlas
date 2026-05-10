# Intention Backlog Farmer

## Purpose

Bootstrap Launchpad/HQ intelligence from existing local Claude and Codex work.
The farmer reads local session artifacts and project instruction markdown,
extracts human intents, removes duplicate or empty records, and exposes a
cleaned backlog for Dispatch Board, Reflexion Injection, Scope Advisor, and
future deliberation routing.

## Sources

- `~/.claude/projects/**/*.jsonl`
- `~/.codex/sessions/**/*.jsonl`
- `~/.codex/history.jsonl`
- `AGENTS.md`, `CLAUDE.md`, and `README.md` under local project roots

The farmer never rewrites source files. It is an importer and projection layer.

## Current Slice

The first implementation lands as an Elixir bounded context in
`apps/daemon/lib/ema_intention_farmer*`, matching the existing
`EmaClients` and `EmaResponsibilities` pattern:

- `SourceRegistry` discovers local sources.
- `Parser` streams JSONL and extracts common text fields.
- `Cleaner` drops empty/system noise, deduplicates by normalized text, and
  assigns quality scores.
- `Projection` stores harvested sessions and intents in ETS.
- `Server` serializes loads and exposes stats for HQ surfaces.
- `EmaIntentionFarmer` is the public API.

## Next Slices

1. Add a durable SQLite projection table once the Elixir contexts are mounted
   into the Gleam supervisor or the canonical bus exposes a write path for
   imported historical context.
2. Add an IPC projection so the web shell can render a live Dispatch Board and
   backlog review queue.
3. Promote approved harvested intents into CWT-owned work records rather than
   creating new project/client families in EMA core.
4. Feed accepted outcomes into Execution Memory for Reflexion Injection and
   Scope Advisor.
