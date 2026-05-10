# 24 - Duct Tape Harness vApp launch

Status: active design. Manifest exists; iframe embed slice and daemon-brokered window slice are documented but not enforced. Standalone localhost path is the failure mode that always works.
Date: 2026-05-07

## Purpose

Document how the **Duct Tape Harness** (`Active builds/duct-tape-onion-harness/`)
is launched and surfaced **through EMA** as a virtual application on
localhost. Companion to:

- `14-companion-bridge.md` — the daemon-brokered companion / window protocol.
- `23-cwt-vapp-launch.md` — the parallel cwt vApp launch story; this doc
  copies that doc's shape so two siblings stay in sync.
- `18-harness-glue.md` — earlier glue notes; this doc supersedes the
  "how does the operator open it" section.
- `19-project-scoped-agent-workspaces.md` — workspace_scope envelope.

Three things this doc resolves:

1. **How EMA launches the harness on localhost** without making the
   harness a subproject under `Projects/EMA/subprojects/`.
2. **What "self-orchestration" means** when the harness embeds the same
   head-orchestrator pattern Claude + Trajan ran by hand on 2026-05-07
   (see `Projects/EMA/atlas/intent/transcripts/2026-05-07-EMA-frontend-daemon-disconnect-orchestration.md`).
3. **Where the harness manifest lives** and how EMA reads it.

## Boundary

The harness is a **sibling vApp**, not a subproject. The boundary is set
in the harness's own project record:

- Harness owns `session`, `session_event`, `session_tag`, `session_pin`,
  `permission_request`, `tool_call`, `transcript_export`, `lost_thread`,
  `synthesized_plan`, `subagent_result`.
- EMA owns `org`, `space`, `project`, `lane`, `queue`, daemon transport,
  and shell-state.
- The harness reads EMA's `lane`, `queue`, and `project` registries via
  the existing `ema` CLI (today) and via the daemon WS (future).
- EMA may host the harness UI via the launch contract (this doc).
- The harness writes intent fragments (transcripts, decisions,
  orchestration close-packets) into `Projects/EMA/atlas/intent/transcripts/`
  via the harness's own `orchestrator.writeBackTranscript` method. When
  EMA L11 lands the Blueprint v0 writer, the harness extends to write
  Blueprint nodes too.

## Manifest

The harness declares itself via `harness.vapp.json` at the active-build root:

```text
Active builds/duct-tape-onion-harness/harness.vapp.json
```

Resolved from `Projects/duct-tape-onion-harness/project.md` frontmatter
field `active_build:`. Current shape (abbreviated):

```json
{
  "vapp_id": "duct-tape-harness",
  "name": "Duct Tape Harness",
  "version": "0.0.2-dev",
  "manifest_version": 0,
  "surface": {
    "kind": "web",
    "url": "http://127.0.0.1:3000",
    "default_bounds": { "width": 1440, "height": 900 },
    "embed": {
      "host_origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
      "host_route": "/harness",
      "frame_ancestors_csp": "configure in apps/web/next.config.ts headers() (not yet wired)"
    }
  },
  "service": {
    "kind": "websocket",
    "transport": "ws://127.0.0.1:4100",
    "json_rpc_methods": [
      "capabilities.probe",
      "providers.startSession",
      "providers.sendTurn",
      "sessions.list",
      "sessions.search",
      "analytics.daily",
      "permissions.request",
      "permissions.respond",
      "orchestrator.discoverPlans",
      "orchestrator.recoverIntent",
      "orchestrator.synthesizePlan",
      "orchestrator.dispatchSubagent",
      "orchestrator.integrateResults",
      "orchestrator.writeBackTranscript"
    ]
  },
  "isolation": "none",
  "isolation_note": "...",
  "data_contract": "Active builds/EMA-0.0.6/docs/architecture/14-companion-bridge.md",
  "launch_contract": "Active builds/EMA-0.0.6/docs/architecture/24-harness-vapp-launch.md",
  "registers_in": "SpaceInstalledVAppsProjection (shell-protocol.md)",
  "self_orchestration": {
    "module": "code/web/server/orchestrator/",
    "rpc_namespace": "orchestrator.*",
    "v0_demo": "orchestrator.discoverPlans returns 30+ plan-shaped documents from ~/.claude/plans/, EMA docs/, harness project record, and Projects/EMA/atlas/intent/transcripts."
  }
}
```

The harness has **two** localhost endpoints:

- `http://127.0.0.1:3000` — Next.js UI (this is what the iframe / native
  window points at).
- `ws://127.0.0.1:4100` — JSON-RPC WebSocket for sessions, analytics,
  permissions, **and the new `orchestrator.*` methods**.

Both must be running for the full surface to function. Either can be
launched independently for a partial surface (UI without harness =
read-only-ish; harness without UI = scriptable / matrix-only).

## Three launch paths, ranked by enforcement

### Path A — Iframe embed inside EMA web (documented; not yet wired)

Mirror the cwt pattern from `23-cwt-vapp-launch.md`:

1. Add the harness origin (`http://127.0.0.1:3000`) to EMA web's
   `next.config.ts` `frame-ancestors` allowlist.
2. Mount a `/harness` route in EMA web that renders
   `<iframe src="http://127.0.0.1:3000">`.
3. The harness's WS endpoint at `ws://127.0.0.1:4100` is reachable from
   the iframe via the harness's own client-side transport (no
   cross-origin proxying; the WS is a peer connection on the operator's
   loopback).

```text
operator → http://localhost:5173/harness
         → EMA web shell renders <iframe src="http://127.0.0.1:3000">
         → harness Next.js UI loads, opens its own ws://127.0.0.1:4100
```

**Status:** documented; the cwt L0 lane handled the `next.config.ts`
glue for cwt, and the same change for the harness origin is the
"realistic minimum" for Path A. Tracked as a follow-up queue item under
the harness project record.

### Path B — Daemon-brokered window via companion.window.open (documented)

Per `packages/contracts/ipc/shell-protocol.md` line 128:

```json
{
  "v": 0,
  "type": "command",
  "op": "companion.window.open",
  "args": {
    "window_id": "<ulid>",
    "app_id": "duct-tape-harness",
    "url": "http://127.0.0.1:3000",
    "bounds": { "width": 1440, "height": 900 },
    "transparent": false
  }
}
```

Same daemon broker that handles cwt. The daemon validates origin policy,
tracks native window state, and emits `companion.status` /
`companion.windows` projections. Today the broker marks opened windows
`pending_native_attach` and the browser surface falls back to
`window.open()`.

The harness registers in `SpaceInstalledVAppsProjection`
(`shell-protocol.md` lines 414–431) with:

```json
{
  "installation_id": "<ulid>",
  "vapp_id": "duct-tape-harness",
  "slug": "duct-tape-harness",
  "label": "Duct Tape Harness",
  "status": "live",
  "project_name": "duct-tape-onion-harness",
  "enabled": true,
  "sort_order": 1,
  "config": { "url": "http://127.0.0.1:3000", "service": "ws://127.0.0.1:4100" }
}
```

**No EMA contract changes required** — both the RPC and the projection
already exist.

### Path C — Standalone localhost (always available)

Operator runs both processes inside the harness active build, opens
`http://127.0.0.1:3000` in any browser. No EMA component required. This
is the failure mode that always works.

```bash
cd "Active builds/duct-tape-onion-harness/code/web"
npm run dev   # web (3000) + harness ws (4100), both via concurrently
open http://127.0.0.1:3000
```

## Self-orchestration is a first-class capability

The harness is **not just a session manager**. It also exposes a
self-orchestration surface that lets the operator (or any agent
connected to its WS) run the same head-orchestrator pattern Claude +
Trajan executed manually on 2026-05-07: sweep plans, recover lost
intent, synthesize lane sequences, dispatch subagents in parallel waves,
integrate results, and write back to canon.

This capability lives in `code/web/server/orchestrator/` and is exposed
over WS as `orchestrator.*`:

| Method                              | Purpose                                                      | v0 status |
| ----------------------------------- | ------------------------------------------------------------ | --------- |
| `orchestrator.discoverPlans`        | Sweep plan-shaped docs across `~/.claude/plans/`, EMA docs, harness project, atlas intent | real     |
| `orchestrator.recoverIntent`        | Mine plan files for unchecked boxes, open questions, TODOs, blocked-on, frontmatter status: living | real     |
| `orchestrator.synthesizePlan`       | Bucket lost threads into draft lanes; shard into parallel waves with non-overlapping scope | real     |
| `orchestrator.dispatchSubagent`     | Spawn a subagent with a brief, observe its close-packet      | **stub** — returns deterministic mock packets |
| `orchestrator.integrateResults`     | Roll up batches of close-packets into a verdict + follow-ups + conflict report | real     |
| `orchestrator.writeBackTranscript`  | Append intent / decisions / lane-close blocks to `Projects/EMA/atlas/intent/transcripts/<date>-<slug>.md` | real     |

The first five run in-process; `writeBackTranscript` performs the only
canon write. Daemon writes (`ema lane open`, `ema queue add`) are
performed via the existing `ema` CLI from the orchestrator surface for
v0 — a native daemon-binding wsTransport-style client is queued behind
the L11 Blueprint v0 writer.

**The shape is the contract.** Real subagent dispatch (Codex / Claude
SDK / PTY) reuses the existing duct-tape adapter shapes and routes via
`providers.startSession`; the wiring lives in the dispatch-subagent
follow-up lane referenced in the harness project record.

### Why this matters

EMA's orchestration plane is currently centered on the `ema` CLI +
human-driven head orchestrator (Claude in this case). Logging
"unfinished work / lost threads" by hand is fragile — they leak into
chat scrollback and never make it to a queue item. The harness's
self-orchestration loop programmatically:

- Discovers all the places intent has been logged (plan files, atlas,
  transcripts, queue items, lane briefs).
- Surfaces the unfinished portions to a UI.
- Lets the operator author lanes / dispatch subagents from one panel.
- Writes the resulting transcripts back to canon so nothing leaks.

This closes the loop between the "intent farming" Trajan asked for
("log all my responses and inputs and keep conducting this work
thoroughly") and the daemon's structured registries.

## Isolation, honestly

The user's broader request mentioned "the virtual app isolation
parameter on localhost." There is no enforced isolation parameter today.
Same status as `23-cwt-vapp-launch.md`:

- `frame-ancestors` CSP — browser-level isolation between EMA and the
  harness iframe (Path A; not yet wired but trivially configured the
  same way as cwt).
- Daemon-tracked `companion.windows` projection — observability, not
  enforcement.
- File-system permissions — operator-user level only.
- The harness's `~/.duct-tape/duct-tape.db` SQLite file is reachable by
  any process with file-system access.

The `harness.vapp.json` manifest carries an `"isolation": "none"` field
and an `isolation_note` explaining this. Reserved future values mirror
cwt: `"none"` / `"process"` / `"sandbox"`.

When a daemon-side enforcer ships, this section becomes a contract;
until then it is forward-looking name reservation.

## Operator commands (today)

```bash
# Path C — standalone (always works)
cd "Active builds/duct-tape-onion-harness/code/web"
npm run dev   # http://127.0.0.1:3000  +  ws://127.0.0.1:4100
open http://127.0.0.1:3000

# Smoke the orchestrator capability without the UI
node -e 'import("./server/orchestrator/index.ts").then(m => m.discoverPlans().then(p => console.log("plans:", p.length)))'

# When Path A lands (cwt-style frame-ancestors in EMA next.config.ts):
( cd "Active builds/EMA-0.0.6" && pnpm dev:web )                  # port 5173
( cd "Active builds/duct-tape-onion-harness/code/web" && npm run dev )
open http://localhost:5173/harness
```

`Path B` (daemon-brokered) is a future operator command:

```bash
# Future
ema vapp run duct-tape-harness
```

`ema vapp run` does not exist today; the launch path is iframe (Path A,
once wired) or standalone (Path C, today).

## Cross-references

- Companion bridge: `docs/architecture/14-companion-bridge.md`.
- cwt vApp launch (parallel doc): `docs/architecture/23-cwt-vapp-launch.md`.
- Earlier harness glue: `docs/architecture/18-harness-glue.md`.
- Shell protocol RPCs: `packages/contracts/ipc/shell-protocol.md`
  (`companion.window.open` line 128, `SpaceInstalledVAppsProjection` line 414).
- Workspace scope envelope: `docs/architecture/19-project-scoped-agent-workspaces.md`.
- Harness project record: `Projects/duct-tape-onion-harness/project.md`.
- Self-orchestration intent transcript:
  `Projects/EMA/atlas/intent/transcripts/2026-05-07-EMA-frontend-daemon-disconnect-orchestration.md`.

## Open questions for revisers

- **Port allocation policy.** The harness hardcodes UI=3000, WS=4100.
  Should the manifest declare a port range and let EMA assign at launch?
- **Multi-instance.** Can two harness instances run on different ports
  for the same Space? The manifest currently assumes a single live install.
- **Native window vs browser tab.** When the daemon broker matures, does
  `ema vapp run duct-tape-harness` open a native window (Tauri /
  Electron) or always a browser tab?
- **Orchestrator daemon binding.** Today the orchestrator surface shells
  out via the `ema` CLI for `lane open` / `queue add`. Should it bind a
  native WS client to the daemon and skip the CLI hop? (Probably yes,
  once L11 Blueprint v0 lands the daemon-side query writers the
  orchestrator needs to read.)
- **Intent farming write-back fidelity.** The orchestrator currently
  writes appends to existing dated transcripts. Should it also stamp
  Blueprint nodes (when L11 lands) and write to a separate
  `intent/decisions/` file when the close-packet contains a structured
  decision payload?
- **Enforcement.** What is the smallest unit of isolation worth
  enforcing first — network policy, filesystem jail, or process-uid
  separation?

## Status

Path A iframe embed: documented; `frame-ancestors` CSP not yet wired in
EMA `apps/web/next.config.ts` (queued — copy the cwt pattern).
Path B daemon-brokered window: contract exists, implementation is
`pending_native_attach` per `shell-protocol.md`.
Path C standalone: always works.
Self-orchestration: real for `discoverPlans` / `recoverIntent` /
`synthesizePlan` / `integrateResults` / `writeBackTranscript`; stubbed
for `dispatchSubagent`.
