# 23 - current-work-tracker vApp launch

Status: active design. Iframe embed slice is implemented (cwt-side); daemon-brokered window slice is documented but not enforced.
Date: 2026-05-07

## Purpose

Document how `current-work-tracker-trajan` (cwt) is launched and surfaced
**through EMA** as a virtual application on localhost. Companion to:

- `20-cwt-integration.md` — the data plane (shared-files projection, ingest contract).
- `14-companion-bridge.md` — the daemon-brokered companion / window protocol.
- `19-project-scoped-agent-workspaces.md` — workspace_scope envelope.
- `22-git-backed-project-storage.md` — Git-backed project materialization.

Three things this doc resolves:

1. **How EMA launches cwt on localhost** without making cwt a subproject under
   `Projects/EMA/subprojects/`.
2. **What "isolation parameter" means** in the user's request, given that no
   real isolation enforcer exists yet.
3. **Where the cwt manifest lives** and how EMA reads it.

## Boundary

cwt is a **sibling vApp**, not a subproject. The boundary is set in
`Projects/current-work-tracker-trajan/blueprint/09-ema-central-tracker-promotion.md`:

- cwt owns `client`, `project`, `campaign`, `mission`, `lane`, `queue`,
  `problem`, `solution`, `vcalendar`, `checkup`, `handoff`, `execution`,
  `dependency`, `responsibility`.
- EMA owns `org`, `space`, agent identity, daemon transport, and shell-state.
- EMA reads cwt's `client` and `project` registries via the data plane (doc 20).
- EMA hosts cwt's UI via the launch contract (this doc).

## Manifest

cwt declares itself via `cwt.vapp.json` at the active-build root:

```text
Active builds/current-work-tracker-trajan/cwt.vapp.json
```

Resolved from `Projects/current-work-tracker-trajan/project.md` frontmatter
field `active_build:`. The current shape:

```json
{
  "vapp_id": "cwt",
  "name": "current-work-tracker",
  "version": "0.0.1-dev",
  "manifest_version": 0,
  "project_id": "project:01KR0AAG8D004J8015N9P8A0VY",
  "surface": {
    "kind": "web",
    "url": "http://127.0.0.1:3015",
    "default_bounds": { "width": 1280, "height": 800 },
    "embed": {
      "host_origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
      "host_route": "/cwt",
      "frame_ancestors_csp": "configured in apps/web/next.config.ts headers()"
    }
  },
  "isolation": "none",
  "isolation_note": "...",
  "data_contract": "Active builds/EMA-0.0.5/docs/architecture/20-cwt-integration.md",
  "launch_contract": "Active builds/EMA-0.0.5/docs/architecture/23-cwt-vapp-launch.md",
  "registers_in": "SpaceInstalledVAppsProjection (shell-protocol.md)"
}
```

## Three launch paths, ranked by enforcement

### Path A — Iframe embed inside EMA web (implemented, current)

Already wired in cwt's `apps/web/next.config.ts` via a CSP `frame-ancestors`
header that allows `http://localhost:5173` and `http://127.0.0.1:5173`. EMA's
own web shell at port 5173 mounts the cwt origin at `/cwt` and renders it in
an iframe.

```text
operator → http://localhost:5173/cwt
         → EMA web shell renders <iframe src="http://127.0.0.1:3015">
         → cwt Next.js dev server serves the cwt UI
```

**Properties:**

- Same-origin barrier between EMA and cwt at the browser level (cross-origin
  iframe, `frame-ancestors` whitelist).
- No cwt code changes required for EMA shell to host it.
- No daemon broker required for the localhost slice.
- Crash isolation: cwt process can die without taking EMA web with it.
- **Limit:** browser-level isolation only; both processes still run as the
  operator's user. The cwt SQLite at `~/.cwt/cwt.sqlite` is reachable by any
  process with file-system access.

### Path B — Daemon-brokered window via companion.window.open (documented)

Per `packages/contracts/ipc/shell-protocol.md` line 128:

```json
{
  "v": 0,
  "type": "command",
  "op": "companion.window.open",
  "args": {
    "window_id": "<ulid>",
    "app_id": "cwt",
    "url": "http://127.0.0.1:3015",
    "bounds": { "width": 1280, "height": 800 },
    "transparent": false
  }
}
```

The daemon validates origin policy, tracks native window state, and emits
`companion.status` / `companion.windows` projections. Today the broker marks
opened windows `pending_native_attach` and the browser surface falls back to
`window.open()`. cwt is launched the same way any other registered vApp would
be.

**Properties:**

- Daemon owns the window lifecycle.
- vApp is registered in `SpaceInstalledVAppsProjection`
  (`shell-protocol.md` lines 414–431) with:

  ```json
  {
    "installation_id": "<ulid>",
    "vapp_id": "cwt",
    "slug": "cwt",
    "label": "current-work-tracker",
    "status": "live",
    "project_name": "current-work-tracker-trajan",
    "enabled": true,
    "sort_order": 0,
    "config": { "url": "http://127.0.0.1:3015" }
  }
  ```

- No EMA contract changes required — both the RPC and the projection already exist.

### Path C — Standalone localhost (always available)

Operator runs `pnpm dev:web` in the cwt active build, opens
`http://127.0.0.1:3015` in any browser. No EMA component required. This is
the failure mode that always works, even if the EMA daemon and EMA web shell
are both down.

## Isolation, honestly

The user's request mentioned "the virtual app isolation parameter on
localhost." There is no such parameter today as an enforced contract. What
exists:

- `frame-ancestors` CSP — browser-level isolation between EMA and cwt iframes.
- daemon-tracked `companion.windows` projection — observability, not enforcement.
- file-system permissions — operator-user level only.

The `cwt.vapp.json` manifest carries an `"isolation": "none"` field and an
`isolation_note` explaining this. Future values reserved (non-binding):

- `"none"` — current state.
- `"process"` — cwt runs under a separate user / sandbox profile.
- `"sandbox"` — cwt runs under a daemon-managed sandbox (network policy +
  filesystem jail). Requires daemon-side enforcer; not implemented.

When a daemon-side enforcer ships, this section becomes a contract; until then
it is a forward-looking name reservation.

## Operator commands (today)

```bash
# Path A — EMA-hosted iframe
( cd "Active builds/EMA-0.0.5" && pnpm dev:web )         # port 5173
( cd "Active builds/current-work-tracker-trajan" && pnpm dev:web )   # port 3015
open http://localhost:5173/cwt

# Path C — standalone
( cd "Active builds/current-work-tracker-trajan" && pnpm dev:web )
open http://127.0.0.1:3015
```

`Path B` (daemon-brokered) is a future operator command:

```bash
# Future: daemon launches cwt and tracks the window
ema vapp run cwt
```

`ema vapp run` does not exist today; the launch path is browser fallback or
`window.open()`.

## Cross-references

- Data plane: `docs/architecture/20-cwt-integration.md`.
- Companion bridge: `docs/architecture/14-companion-bridge.md`.
- Shell protocol RPCs: `packages/contracts/ipc/shell-protocol.md`
  (`companion.window.open` line 128, `SpaceInstalledVAppsProjection` line 414).
- Workspace scope envelope: `docs/architecture/19-project-scoped-agent-workspaces.md`.
- cwt-side blueprint: `Projects/current-work-tracker-trajan/blueprint/09-ema-central-tracker-promotion.md`.
- cwt-side design psychology: `Projects/current-work-tracker-trajan/blueprint/10-design-psychology.md`.

## Open questions for revisers

- **Port allocation policy.** cwt hardcodes 3015 in `apps/web/package.json`.
  Should the manifest declare a port range and let EMA assign at launch?
- **Multi-instance.** Can two cwt instances run on different ports for the
  same Space? The manifest currently assumes a single live install.
- **Native window vs browser tab.** When the daemon broker matures, does
  `ema vapp run cwt` open a native window (Tauri / Electron) or always a
  browser tab?
- **Enforcement.** What is the smallest unit of isolation worth enforcing
  first — network policy, filesystem jail, or process-uid separation?

## Status

Path A iframe embed: implemented in `apps/web/next.config.ts` (frame-ancestors
CSP) and documented in `apps/web/README.md`. Path B daemon-brokered window:
contract exists, implementation is `pending_native_attach` per
`shell-protocol.md`. Path C standalone: always works.
