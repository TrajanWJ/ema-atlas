# 0.0.5 Workspace Entrypoint

Use this repo as the implementation root for EMA `0.0.5`.

## Before coding

Read:

1. `orchestration/STATUS.md`
2. `../../doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md`
3. `../../doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md`
4. `../../doctrine/planning/EMA-0.0.5-PASSOVER-AND-PREP.md`
5. `../../doctrine/planning/lane3-domain-model-and-system-design.md`
6. `../../data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md`
7. `architecture/08-vanilla-workspace.md`
8. `architecture/09-see-agent-work.md`
9. `agents/see-agent-work-agent-usage.md`
10. `architecture/10-first-boot.md`
11. `architecture/11-transport-and-auth-survey.md`
12. `architecture/12-hermes-integration.md`
13. `operations/peer-computer-access.md`
14. `plans/IMPLEMENTATION-ROADMAP.md`

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
