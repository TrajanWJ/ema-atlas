# 0.0.6 Workspace Entrypoint

Use this repo as the implementation root for EMA `0.0.6`.

## Before coding

Read:

1. `orchestration/STATUS.md` - live ledger; trust this over plan claims when they disagree.
2. `../../Projects/EMA/project.md`
3. `../../Projects/EMA/PROJECT-MAP.md`
4. `../../Projects/EMA/builds/BUILD-MANIFEST.md`
5. `../../Projects/EMA/atlas/README.md`
6. `../../Projects/EMA/atlas/canon/current/ema-0-0-6-current-canon.md` - distilled current truth.
7. `../../Projects/EMA/builds/0.0.6/BUILD.md`
8. `architecture/08-vanilla-workspace.md`
9. `architecture/09-see-agent-work.md`
10. `agents/see-agent-work-agent-usage.md`
11. `architecture/10-first-boot.md`
12. `architecture/11-transport-and-auth-survey.md`
13. `architecture/12-hermes-integration.md`
14. `operations/peer-computer-access.md`
15. `plans/README.md` - plan-hierarchy index (controlling vs superseded).
16. `superpowers/plans/2026-05-10-ema-proslync-first-head-orchestrator-master-plan.md` - **current controlling implementation plan**.
17. `plans/IMPLEMENTATION-ROADMAP.md` - broader roadmap; verify against the master plan above before treating any step as current.

## CLI doctrine

EMA's CLI is `ema` (post-cwt-absorption, 2026-05-07). All record families
below org/space surface via `ema` verbs.

The Cockpit vApp (`?vapp=cockpit` in EMA web; `ema cockpit …` in CLI) owns
project/client/work registry surfacing — formerly cwt's role. The
`~/.local/bin/cwt` alias execs `ema cockpit "$@"`; there is no separate
binary. See `docs/decisions/2026-05-07-cwt-absorbed-by-ema.md` and the
`Agent Workspace CLI Loop` section in `~/Desktop/AGENTS.md`.

Cockpit is the client/project workbench, not the whole Agent Workspace.
For the canonical glossary (EMA Project / EMA 0.0.6 active build /
Holodeck / vDesktop / Native popout / Agent Workspace / Cockpit / Duct
Tape-Harness) see the `Vocabulary` section in `AGENTS.md`.

## Environment preflight

Run this from any directory before coding:

```bash
ema help
ema ping --json
ema status --json
ema tl about --summary --json
ema vcalendar tick --json
ema doctor --json
```

When the work names a project, scope follow-up commands explicitly:

```bash
ema next --project <project-name-or-id> --json
ema agent orient --project <project-name-or-id> --json
ema agent meta-progress --project <project-name-or-id> --json
```

`ema doctor --json` is the runtime-health check. Use
`ema doctor --strict --json` only when incomplete roadmap gaps should fail the
gate.

## First build assumptions

- backend language direction: Gleam / BEAM
- desktop shell direction: Tauri
- shared surface layer: web-based UI reused by desktop and browser
- Blueprint is the first deep project-thinking vApp
- git-ema is the first source/attachment vApp
- See Agent Work is the first swarm/vCalendar vApp
- the first milestone is a vanilla workspace, not the full workflow engine

## First product surfaces to support

- shell topbar
- organization interface
- space interface
- project interface
- settings interface
- invites and memberships
- Blueprint vApp
- git-ema attachment/source surface
- See Agent Work swarm/vCalendar surface

## Quick reference — locked vs open

**Locked** (do not re-litigate without a decision record):

- Daemon language: Gleam on BEAM.
- Desktop shell: Tauri v2; does not spawn or embed the daemon.
- Daemon runs as a user-level system service (launchd / systemd --user
  / Windows Scheduled Task). Surfaces connect over
  `ws://127.0.0.1:49555`.
- Topology: `Organization → Space → Project`, always three levels.
- Daemon owns all writes to canonical SQLite. Surfaces are
  command-dispatching projection consumers.
- Authority: LiteFS-style static lease; no Consul; lease record is an
  event.
- Event catalog is versioned contract; pre-commit check enforces.
- Attachments are a canonical first-class concept (git-ema);
  no other vApp owns file storage.

**Open** (decisions a later wave will make):

- Device pairing ceremony details (QR+BLE inspired by WebAuthn hybrid).
- Recovery packet format (seed words vs Shamir vs both).
- Collaborative-prose CRDT choice for Blueprint (BEAM-native preferred:
  `delta_crdt` / Automerge-BEAM adapter; Yjs/Hocuspocus is not the default).
- Real OAuth flows replacing git-ema demo stubs.
- Replication transport (the event family is stubbed; bytes aren't
  flying yet) — shortlist in `architecture/11-transport-and-auth-survey.md`;
  default is Iroh sidecar.
- Trusted dev peer computer access — SSH/admin bootstrap rail in
  `operations/peer-computer-access.md`; Tailscale is not default.
- Lane / handoff / proposal vApp surfaces.
- Tauri window capability partitioning beyond the single `main` window.

## First anti-drift rule

Do not let the first UI own truth.

The first codebase should encode the authority split from day one:

- daemon owns truth
- runtime owns execution
- surfaces render and request actions
