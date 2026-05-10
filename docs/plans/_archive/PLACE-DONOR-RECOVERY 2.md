# Place Donor Recovery

Date: 2026-04-29

The current EMA 0.0.5 surface should be rebuilt with `place.org` and `place-companion` as primary donor repos. The goal is not a blind copy; the goal is to recover the mature shell, tokens, polish, app/window grammar, and native companion behavior while preserving EMA's daemon-first product model.

## Donor Roots

- `Projects/EMA/atlas/incubating/place/place.org/`
- `Projects/EMA/atlas/incubating/place/place-companion/`

## Generated Skills

- `skills/place-donor-design/`: tokens, CSS, glass tiers, typography, contrast, visual polish.
- `skills/place-donor-surface/`: virtual desktop, dock, launcher, command palette, app registry, window manager, widgets, app surfaces.
- `skills/place-companion-bridge/`: Tauri/native popout bridge, transparent windows, localhost protocol, app packaging.

## Immediate Cleanup

- Removed generated macOS bundle: `apps/desktop/src-tauri/target/release/bundle/macos/EMA.app`.
- No Desktop-installed app was found at `/Users/trajanm4air/Desktop/*.app` during cleanup.

## Recovery Map

| EMA need | Donor source | EMA target |
| --- | --- | --- |
| Design tokens and glass tiers | `place.org/app/globals.css`, `docs/design/tokens.md` | `apps/web/src/app/styles.css`, `packages/design-system/` |
| Virtual desktop shell | `src/components/desktop/` | `apps/web/src/shell/`, `apps/web/src/place-reflection/` |
| Window manager | `src/components/window-manager/`, `src/stores/window-store.ts`, `src/lib/constants.ts` | `packages/surface-core/`, `apps/web/src/shell/` |
| App registry | `src/lib/app-registry.ts`, `src/lib/app-registrations.ts` | `apps/web/src/shell/vapp-registry.tsx`, `packages/surface-core/` |
| Mature app patterns | `src/components/apps/` | `apps/web/src/vapps/` |
| Settings and preferences | `src/stores/settings-store.ts`, `src/lib/settings-defaults.ts`, `src/lib/settings-migration.ts` | daemon-backed settings contract plus local UI preference cache |
| Command/launcher UX | `CommandPalette.tsx`, `KickoffLauncher.tsx`, `Dock.tsx`, shortcut hooks | EMA command palette, launchpad, dock, vApp quick actions |
| Native popouts | `place-companion/src-tauri/src/*`, `place.org/src/lib/companion-bridge.ts` | `apps/desktop/src-tauri/`, `packages/contracts/ipc/` |

## Implementation Order

1. Freeze the current ugly mac app artifact and only rebuild after the web shell is visibly improved.
2. Promote donor tokens and glass tiers into `packages/design-system` so web and desktop surfaces share one source.
3. Rebuild the EMA shell around donor virtual-desktop primitives: dock, launcher, command palette, window manager, titlebars, and deterministic window sizes.
4. Reframe donor app registry as EMA vApp registry. Keep donor capabilities like search, quick actions, menu bars, file previews, and app settings.
5. Port selected mature donor apps as EMA vApps, starting with settings, finder, notes, tasks, journal, focus, terminal, system monitor, documents, canvas, and the executive-function apps.
6. Recover the companion bridge after the web shell works, using typed contracts and preserving EMA daemon ownership.
7. Rebuild and install the mac app only when visual review passes in the web shell.

## Guardrails

- Active coding stays in `Active builds/EMA-0.0.5/`.
- Do not recreate `EMA-atlas/` or `Projects/atlas/` at Desktop root.
- Do not import donor localStorage/OPFS as canonical EMA truth. EMA's daemon owns truth.
- Do not delete dirty source work. Generated app bundles are disposable; source folders are not.
- Keep provenance comments when donor code is copied or substantially adapted.
