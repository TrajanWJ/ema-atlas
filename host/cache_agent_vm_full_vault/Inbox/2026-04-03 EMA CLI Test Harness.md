---
type: auto-captured
source: session-transcript
captured: 2026-04-03T22:46:00Z
session: f59899ce-ceca-46a4-b7a5-db40e5eef029
category: build-deliverable
score: 8
tags: [ema, cli, test-harness, development-tool, coder, api-coverage]
---

# EMA CLI Test Harness

**Date:** 2026-04-03  
**Location:** `/home/trajan/Projects/ema/cli/`  
**Built by:** Coder agent  
**Status:** Delivered

---

## What It Is

A standalone CLI that exercises all 40+ EMA API endpoints **without requiring the Elixir/Phoenix daemon to run**. Built as a pure Python stdlib project (zero external deps) with an in-memory state store backed by `~/.ema_cli_state.json`.

This enables full API development and testing before the daemon is built.

---

## Capabilities

| Layer | Details |
|---|---|
| **API coverage** | 40+ endpoints across proposals, tasks, intents, gaps, sessions, projects |
| **Mock API** | In-memory state store with realistic response shapes |
| **Fixture generators** | Genealogy chains + 5-level intent trees |
| **Output formats** | JSON, table, tree, summary |
| **Test scenarios** | Full proposal lifecycle, intent mapping, session fork (3 multi-step) |
| **Interactive mode** | `./ema shell` — REPL for ad-hoc testing |
| **Data seeding** | `./ema seed` — populate store with realistic test data |

---

## Quick Start

```bash
cd ~/Projects/ema/cli

# Seed with realistic test data
./ema seed

# List proposals in table format
./ema proposal list --format=table

# Run a full scenario
./ema scenario full-proposal-lifecycle

# Interactive REPL
./ema shell
```

---

## File Structure

```
cli/
├── ema                     # main entry point
├── ema_cli/
│   ├── cli.py              # command routing (40+ handlers)
│   ├── mock_api.py         # mock server (~740 lines)
│   ├── fixtures.py         # data generators (~534 lines)
│   ├── output.py           # formatters: JSON/table/tree/summary
│   ├── store.py            # persistent JSON state store
│   └── commands/           # command modules
└── tests/                  # test scenarios
```

**Total:** ~600+ lines of CLI handlers + 3,094 lines across core modules

---

## Why This Matters

EMA is a fully-specified system (40+ APIs, 18 data schemas, 5 features F1-F5) but the daemon doesn't exist yet. The CLI creates a full exercisable environment for:
- Validating API contract shapes before implementation
- Running multi-step scenarios (proposal → intent → session flow)
- Testing without daemon startup cost
- Development workflow: design → CLI-test → implement → verify

---

## Related

- [[EMA Master Knowledge Base]] — full system spec
- [[EMA Phase 2 Implementation Guide]] — current build targets
- [[EMA Sprint Status]] — current sprint state
- [[Codebases/EMA]] — codebase overview

---
*Auto-captured from daily session review — 2026-04-03 22:46 UTC*
