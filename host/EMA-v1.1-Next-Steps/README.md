# EMA v1.1 Next Steps

Host-side working folder for the next EMA buildout pass.

## Purpose
A clean resume point for:
- plans
- artifacts
- ops
- canon
- wiki
- implementation notes
- imports / cross-pollination
- handoffs
- decisions
- gaps
- runtime truth
- CLI↔GUI parity
- workstream identity

This folder is also the **primary bootstrap database/corpus** for the EMA v1.1 convergence pass: the first place the daemon, backend, or a coding agent should ingest when reconstructing architecture, sequencing, gaps, and handoff context.

## Bootstrap role

- Treat this folder as the ingest-first bootstrap corpus for EMA v1.1 planning, daemon/backbone recovery, and backend convergence.
- Treat `bootstrap-database.json` as the machine-readable manifest for that bootstrap role.
- Treat `04-CANON/BOOTSTRAP-DATABASE-CONTRACT.md` as the human-readable contract that defines ingest order, boundaries, and writeback rules.
- Do not confuse this folder with the live EMA operational database. Runtime truth still lives in `~/Projects/ema` and `~/.local/share/ema/ema.db`.

## Folder guide
- `00-INBOX/` — quick dumps, rough notes, parking lot
- `01-PLANS/` — current planning docs and staged build plans
- `02-ARTIFACTS/` — generated planning artifacts, exports, diagrams
- `03-OPS/` — operational notes, recovery docs, host truth, checklists
- `04-CANON/` — canon extracts / canonical summaries / target-shape notes
- `05-WIKI/` — wiki-native shape, page templates, object definitions
- `06-IMPLEMENTATION/` — implementation checklists, module maps, active coding notes
- `07-TRACKS/` — track A-F planning lanes
- `08-IMPORTS/` — steal/adapt/ignore and cross-pollination imports
- `09-HANDOFFS/` — prompts, agent handoffs, resumable context packets
- `10-DECISIONS/` — decision logs and decision object drafts
- `11-GAPS/` — canon/planning/reality gap ledgers
- `12-RUNTIME/` — runtime truth, services/workers, host runtime notes
- `13-CLI-GUI-PARITY/` — mirrored workspace contract work
- `14-WORKSTREAMS/` — workstream identity, session/thread mirroring
- `15-PRODUCTIVITY/` — today, tasks, notes, journal, focus, utilities
- `16-HOST-OPS/` — terminal, machines, notifications, permissions, peers
- `17-KNOWLEDGE/` — blueprint, intentions, feeds, graph, research
- `18-AGENT-WORK/` — agent hub/live/comms/plans/scratchpads
- `19-SHELL-HQ/` — shell, HQ, launchpad, layouts, command center
- `20-CHRONICLE-REVIEW/` — chronicle, review, recall, trace, memory

## Current assumptions
- Active runtime target is TypeScript/Electron/services/workers.
- Old Tauri/Elixir build is archive/parity reference, not primary runtime.
- CLI and GUI must converge on the same underlying objects/workstreams.
- Planning must keep canon, planning, reality, and gap separate.
- This folder is the first bootstrap dataset for v1.1 planning and recovery work, but it does not override live runtime/code truth.

## Read-first repo docs
- `~/Projects/ema/README.md`
- `~/Projects/ema/docs/OPERATING-REALITY.md`
- `~/Projects/ema/docs/MEMORY-SYNC.md`
- `~/Projects/ema/docs/GROUND-TRUTH.md`
- `~/Projects/ema/docs/backend/README.md`
- `~/Projects/ema/ema-genesis/vapps/CATALOG.md`
- `~/Projects/ema/ema-genesis/_meta/VAPP-RECONCILIATION-TABLE.md`
