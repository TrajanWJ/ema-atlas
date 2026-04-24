# EMA-0.0.5--4-24

This is the actual implementation home for EMA `0.0.5`.

If you are writing code for EMA rather than reading history, this is where that
work should happen.

## Product direction locked for this repo

- daemon-first
- native-first
- `Organization -> Space -> Project`
- first deep project-thinking vApp: `Blueprint`
- first source/attachment vApp: `git-ema`
- first swarm/vCalendar app: `See Agent Work`
- first milestone: a vanilla workspace ready for workflow later
- full organization, space, project, settings, and invite surfaces from day one
- shell topbar includes:
  - project selector
  - space selector

## Intended repo shape

```text
EMA-0.0.5--4-24/
├── apps/
│   ├── daemon/
│   ├── desktop/
│   └── web/
├── packages/
│   ├── contracts/
│   ├── surface-core/
│   └── design-system/
├── docs/
├── scripts/
└── tooling/
```

## Role of each app

- `apps/daemon/`
  - EMA authority, truth ownership, sync, identity, control plane
  - runs as a user-level system service (launchd / systemd --user /
    Windows Scheduled Task); not spawned by Tauri
  - surfaces connect over `ws://127.0.0.1:49555`
- `apps/desktop/`
  - native EMA shell (Tauri v2); connects to the daemon, does not embed it
- `apps/web/`
  - browser-hosted shell for parity, access, and development

## macOS launchers

- `scripts/install-macos-tauri-app.sh` installs the built Tauri bundle
  (`apps/desktop/src-tauri/target/release/bundle/macos/EMA.app`) as the
  human-facing `~/Desktop/EMA 0.0.5.app`. Existing target apps are moved to a
  timestamped backup path; EMA user data under `~/Library` is not deleted.
- `scripts/create-macos-launcher.sh` creates
  `~/Desktop/EMA 0.0.5 Web Dev Launcher.app`.
  That helper is intentionally a web dev launcher: it starts the daemon and
  Vite web surface, then opens `http://localhost:5173`.

## What should be built first

1. daemon boundaries and data contracts
2. shell structure with org/space/project selectors
3. vanilla workspace shape
4. Blueprint as the first deep vApp
5. git-ema as the first source/attachment vApp
6. See Agent Work as the first swarm/vCalendar vApp
7. org/space/project/settings/invite surfaces

## What should not happen here

- donor code copied in blindly
- archive docs mixed into runtime source folders
- implementation starting inside old imported roots instead of this repo

## Supporting docs

- [docs/WORKSPACE-ENTRYPOINT.md](./docs/WORKSPACE-ENTRYPOINT.md)
- [docs/dev/p2p-dev-updates.md](./docs/dev/p2p-dev-updates.md)
- [docs/architecture/08-vanilla-workspace.md](./docs/architecture/08-vanilla-workspace.md)
- [docs/architecture/09-see-agent-work.md](./docs/architecture/09-see-agent-work.md)
- [docs/architecture/10-first-boot.md](./docs/architecture/10-first-boot.md)
- [docs/architecture/11-transport-and-auth-survey.md](./docs/architecture/11-transport-and-auth-survey.md)
- [docs/architecture/12-hermes-integration.md](./docs/architecture/12-hermes-integration.md)
- [docs/vapps/see-agent-work.md](./docs/vapps/see-agent-work.md)
- [docs/cli/see-agent-work.md](./docs/cli/see-agent-work.md)
- [docs/agents/see-agent-work-agent-usage.md](./docs/agents/see-agent-work-agent-usage.md)
- [docs/plans/IMPLEMENTATION-ROADMAP.md](./docs/plans/IMPLEMENTATION-ROADMAP.md)
- [../../doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md](../../doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md)
- [../../doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md](../../doctrine/planning/EMA-0.0.5-BUILDOUT-MASTER-PLAN.md)
- [../../doctrine/planning/EMA-0.0.5-PASSOVER-AND-PREP.md](../../doctrine/planning/EMA-0.0.5-PASSOVER-AND-PREP.md)
- [../../data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md](../../data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md)
