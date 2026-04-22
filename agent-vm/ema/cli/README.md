# EMA CLI — Personal AI OS Control Surface

EMA CLI is currently split between:

1. a newer real daemon-facing control surface (`cli/ema`, `ema_cli.main`, `ema_cli.commands/*`)
2. an older mock/scenario harness (`ema_cli.cli`) used for product simulation and local test flows

The real direction is the daemon-facing CLI. The mock harness remains useful for simulation, but operator/agent workflows should prefer the real HTTP-backed commands and the daemon contract in `docs/AGENT-CONTRACT.md`.

**Zero external dependencies** — pure Python stdlib.

---

## Quick Start

### Real daemon-facing CLI

```bash
cd ~/Projects/ema/cli

./ema status
./ema context operator
./ema control status
./ema control live --limit 20
./ema surfaces host-truth
./ema surfaces gateway
./ema work packet --project ema-core
./ema work start "Investigate failed executions" --project ema-core --agent gamma-1
```

### Mock/scenario harness

```bash
cd ~/Projects/ema/cli

# Seed the store with realistic test data
./ema seed

# Run a full scenario
./ema scenario full-proposal-lifecycle

# Interactive REPL
./ema shell
```

---

## File Structure

```
cli/
├── ema                        # Executable entry point
├── README.md
├── ema_cli/
│   ├── __init__.py
│   ├── cli.py                 # All commands + dispatch + scenarios + shell
│   ├── store.py               # JSON-backed persistent state store
│   ├── fixtures.py            # Realistic data generators for all 18 schemas
│   ├── mock_api.py            # Mock handlers for all 46 endpoints
│   ├── output.py              # Formatters: JSON, table, tree, summary (ANSI)
│   └── commands/
│       └── seed_data.py       # Bulk seeding utility
└── tests/
    └── test_all.py            # 118 tests, 100% endpoint coverage
```

---

## Commands

### `proposal`

```bash
# Create (optionally from a seed source or parent proposal)
./ema proposal create --title="Add streaming UI"
./ema proposal create --seed-source=vault:features/F1
./ema proposal create --parent-id=prp_abc123

# List (filterable)
./ema proposal list
./ema proposal list --format=table
./ema proposal list --status=queued
./ema proposal list --tag=streaming --confidence-min=0.7

# View a specific proposal
./ema proposal prp_abc123

# Show full genealogy chain (seed → parent → child)
./ema proposal prp_abc123 genealogy
./ema proposal prp_abc123 genealogy --format=tree

# Lifecycle actions
./ema proposal prp_abc123 approve      # → creates a task automatically
./ema proposal prp_abc123 kill
./ema proposal prp_abc123 redirect     # → generates 3 new seeds
./ema proposal prp_abc123 validate     # run quality gate (accept/reject)
```

### `task`

```bash
./ema task create "Implement Scorer quality gate"
./ema task create "Refactor router" --description="..." --intent=int_abc
./ema task list
./ema task list --status=in_progress --format=table
./ema task tsk_abc123 route            # get agent + model recommendation
./ema task tsk_abc123 route --format=table
./ema task tsk_abc123 assign coder
```

### `intent`

```bash
# Create nodes at any level (0=product, 1=flow, 2=action, 3=system, 4=implementation)
./ema intent create "Personal AI OS" --level=0
./ema intent create "Proposal pipeline" --level=1 --parent-id=int_root

# List / tree
./ema intent list --format=table
./ema intent list --level=2
./ema intent tree --format=tree

# Link a task to an intent node
./ema intent int_abc link-task tsk_xyz

# Create typed edges
./ema intent edges create int_a int_b --relationship=implements
# Relationships: depends-on | implements | enables | blocks
```

### `gaps`

```bash
./ema gaps list --format=table
./ema gaps list --severity=5 --status=open

./ema gaps gap_abc resolve
./ema gaps gap_abc create-task        # auto-creates a fix task
```

### `token-usage`

```bash
./ema token-usage
./ema token-usage --format=summary    # dashboard with bar charts
./ema token-usage --days=7 --model=opus
```

### `projects`

```bash
./ema projects list --format=table
./ema projects pro_ema0001 health
./ema projects pro_ema0001 health --format=summary
```

### `session`

```bash
./ema session list --format=table
./ema session ais_abc messages
./ema session ais_abc messages --format=table
./ema session ais_abc fork             # fork at last message
./ema session ais_abc fork --to-message=aim_xyz
./ema session ais_abc resume
```

### `providers` & `routing`

```bash
./ema providers list --format=table
./ema providers claude-personal health-check

./ema routing estimate --prompt="Generate a vault analysis"
./ema routing estimate --prompt="..." --strategy=cheapest --format=table
```

### `seeds`

```bash
./ema seeds list --format=table
./ema seeds create "Weekly review" --prompt="Analyze {{project_name}}"
```

### `engine`

```bash
./ema engine pause
./ema engine resume
```

### `superman`

```bash
./ema superman status
./ema superman index --path=/home/trajan/Projects/ema
./ema superman ask "What modules handle PubSub routing?" --format=table
./ema superman gaps --format=table
./ema superman intent-graph
```

### `openclaw`

```bash
./ema openclaw status --project ema
./ema openclaw context --project ema
./ema openclaw host-truth
./ema openclaw propose --project ema --intent host-truth --summary "Inspect dispatch drift"
./ema openclaw run prp_abc123
./ema openclaw dispatch-update exe_abc123 --status failed --summary "runtime timeout"
./ema openclaw complete exe_abc123 --status succeeded --summary "task finished cleanly"
```

These commands are the real OpenClaw-facing wrapper over the EMA daemon contract in `docs/AGENT-CONTRACT.md`.
They are meant to give chat/runtime integrations one stable entry point instead of mixing mock flows and raw endpoints.

Under the hood, they prefer:
- `GET /api/control-plane`
- `GET /api/control-plane/context_for?project=...`
- `GET /api/context/operator/package` (with fallback to operator-status / control-plane)
- `GET /api/surfaces/host-truth`
- `POST /api/control-plane/proposals`
- `POST /api/control-plane/proposals/:id/run`
- `POST /api/control-plane/executions/:id/complete`
- `POST /api/control-plane/executions/:id/dispatch-update`

---

## Scenarios

Pre-built multi-step test flows that exercise endpoints in realistic sequences:

```bash
# List all available scenarios
./ema scenario

# Create seed → generate proposal → run pipeline stages → validate → approve → route → assign
./ema scenario full-proposal-lifecycle

# Create 5-level intent tree + typed edges + linked tasks, then render tree
./ema scenario intent-mapping

# Create session → add messages → fork at checkpoint → resume forked branch
./ema scenario session-continuity

# Generate normal usage + spike events → show cost anomaly detection
./ema scenario token-spike

# Register providers → simulate failure → re-route via healthy providers
./ema scenario provider-failover
```

---

## Output Formats

| Flag | Description | Best for |
|------|-------------|----------|
| `--format=json` | Pretty-printed JSON (default) | Piping, programmatic access |
| `--format=table` | ANSI-colored aligned table | Human-readable lists |
| `--format=tree` | Unicode tree with status colors | Intent hierarchies, genealogies |
| `--format=summary` | Dashboard cards with bar charts | Token costs, project health |

---

## Interactive Shell

```bash
./ema shell
```

Full REPL with readline history saved to `~/.ema_history`:

```
ema> seed
ema> proposal list --format=table
ema> proposal prp_abc genealogy --format=tree
ema> task create "New feature" --status=todo
ema> gaps list --severity=5 --format=table
ema> token-usage --format=summary
ema> scenario full-proposal-lifecycle
ema> exit
```

---

## State & Persistence

State persists across invocations at `~/.ema_cli_state.json`.

```bash
# Override location
EMA_STORE=/tmp/test.json ./ema seed

# Reset all state
./ema reset

# Re-seed with fresh data
./ema seed
```

---

## Endpoint Coverage

| Group | Endpoints |
|-------|-----------|
| Intent nodes | `list`, `tree`, `create`, `update`, `delete` |
| Intent edges | `create` |
| Gaps | `list`, `resolve`, `create-task` |
| Token usage | `usage summary` |
| Proposals | `list`, `get`, `approve`, `redirect`, `kill`, `lineage`, `validate` |
| Seeds | `list`, `create` |
| Engine | `pause`, `resume` |
| Sessions | `list`, `messages`, `fork`, `resume` |
| Providers | `list`, `health-check` |
| Routing | `estimate` |
| Tasks | `list`, `get`, `create`, `update`, `route`, `assign`, `link-intent` |
| Projects | `list`, `get`, `health` |
| Superman | `status`, `index`, `ask`, `apply`, `gaps`, `intent-graph` |
| OpenClaw | `dispatch`, `dispatch-status` |
| **Total** | **46 endpoints** |

---

## Running Tests

```bash
cd ~/Projects/ema/cli
EMA_STORE=/tmp/ema_test.json python3 -m pytest tests/test_all.py -v
```

Expected: **118 tests passed**.

Test classes:
- `TestFixtures` — all 18 data model generators
- `TestStore` — CRUD operations and persistence
- `TestMockAPIIntentNodes` — 14 intent endpoint tests
- `TestMockAPIGaps` — 7 gap tests
- `TestMockAPITokenUsage` — 2 token usage tests
- `TestMockAPIProposals` — 13 proposal tests
- `TestMockAPISeeds` — 3 seed tests
- `TestMockAPIEngine` — 2 engine tests
- `TestMockAPISessions` — 7 session tests
- `TestMockAPITasks` — 8 task tests
- `TestMockAPIProjects` — 3 project tests
- `TestMockAPIProviders` — 5 provider/routing tests
- `TestMockAPISuperman` — 7 Superman tests
- `TestMockAPIOpenClaw` — 3 OpenClaw tests
- `TestSeedData` — bulk seeding validation
- `TestCLIDispatch` — 15 CLI end-to-end tests
- `TestParseArgs` — argument parsing
- `TestEndpointCoverage` — coverage manifest (46 endpoints verified)
