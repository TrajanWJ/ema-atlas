# EMA 0.0.6 — agent context

You are working in the active EMA build. Read `README.md` and `AGENTS.md` first if you have not. The orchestrator overview is in `../../AGENTS.md`.

## Current Workspace Scope

The active personal EMA daemon scope is:

- org: `Trajan's Organization` (`org:01J00000000000000000000012`)
- space: `Personal Workspace` (`space:01J00000000000000000000013`)

Spaces contain multiple projects. `locked-in-ios-app` is a project in
`Personal Workspace`, not a space:

- project: `/Users/trajanm4air/Desktop/Projects/locked-in-ios-app`
- project_id: `project:01KQD9RMA000Y2Z58RCSNCJNT0`
- orientation command: `ema agent orient --project locked-in-ios-app --json`

The CLI is invoked globally as `ema <command>` (wrapper at `~/.local/bin/ema`,
default `EMA_HOME=Active builds/EMA-0.0.6`); `pnpm cli <command>` from this
build root is equivalent and is the fallback when the wrapper is unavailable.

Before editing, verify the general environment first:

```bash
ema help
ema ping --json
ema status --json
ema tl about --summary --json
ema vcalendar tick --json
ema doctor --json
```

When the task names a project, scope the working commands explicitly:

```bash
ema next --project <project-name-or-id> --json
ema agent orient --project <project-name-or-id> --json
ema agent meta-progress --project <project-name-or-id> --json
ema cockpit workpack --project <project-name-or-id> --json
```

As of 2026-05-10, `ema doctor --json` exits 0 unless daemon health fails and
reports `health_ok`, `readiness_ok`, and `readiness_blockers` separately.
`ema doctor --strict --json` exits nonzero when daemon health fails or
`readiness_ok` is false. Roadmap gaps do not fail strict mode; they remain
informational `subsystems` entries with `partial` or `missing` status.

Do not use the mistaken `lockedinIOSapp` space/project as canonical context.
It is a cleanup target once archive/move writers exist.

## Cockpit boundary (2026-05-07, post-CWT absorption)

`current-work-tracker-trajan` (project id
`project:01KR0AAG8D004J8015N9P8A0VY`) is now a **legacy / donor** project.
Its UI patterns and contracts have been absorbed into EMA web as the
`cockpit` vApp. Keep the donor build at
`/Users/trajanm4air/Desktop/Active builds/current-work-tracker-trajan/`, but
do not develop it as an independent active surface unless the user explicitly
asks for legacy comparison or salvage.

EMA's daemon/cockpit path owns the active project/client/work registry below
org/space:

- `client` (first-class; one client → many projects)
- `project` (with `client_id`, `kind`, `client_label`, `client_color`)
- `campaign`, `mission`, `lane`, `queue`, `problem`, `solution`,
  `vcalendar`, `checkup`, `handoff`, `execution`, `dependency`,
  `responsibility`

EMA also owns:

- `org`, `space`, agent identity, daemon-process, shell-state
- the daemon transport itself

When `ema` needs project or client metadata, route through `ema cockpit …` and
the daemon-backed registry/projection path. The old `cwt` command is only a
muscle-memory alias for `ema cockpit "$@"`.

See `docs/decisions/2026-05-07-cwt-absorbed-by-ema.md`.

## Unified CLI doctrine

EMA's CLI is `ema`. For projects, clients, captures, responsibilities, and
cross-client work, use `ema cockpit …`; do not add or depend on a separate
writer CLI.

## Auto-loaded skills

10 design / voice / craft skills are symlinked under `.Codex/skills/` from `Projects/EMA/atlas/shared/skills/`. Read the relevant `SKILL.md` before touching that area:

- **Brand identity & voice** — `place-brand-voice`, `place-product-philosophy`, `place-psychology-and-language`
- **Design system** — `place-design-tokens`, `place-glass-system`, `place-theme-system`
- **Frontend craft** — `place-frontend-conventions`, `place-window-and-shell`, `place-app-registry`, `place-keyboard-and-command`

The skills auto-load — do not invoke them by name; just read the file before writing code in that domain. When in doubt: brand voice for any user-visible text; design tokens for any color/text/border decision.

## URL navigation API (the test surface)

The URL is a first-class API into the shell — for users (deep links) and for agents driving E2E tests. Full contract: `docs/dev/url-test-api.md`. Quick examples:

```
/?vapp=blueprint
/?theme=dracula&contrast=high
/?windows=blueprint:120,80,860,540;hq:1020,80,500,540
/?test=1   ← suppresses ambient motion for deterministic screenshots
```

When writing automated checks, always pass `?test=1` plus the explicit state.

## E2E test bench

Live in `apps/web/tests/e2e/`. Reuse the running dev server with `EMA_E2E_NO_WEBSERVER=1`:

```bash
cd apps/web
EMA_E2E_NO_WEBSERVER=1 pnpm exec playwright test --reporter=list
```

Specs:
- `themes.spec.ts` — 10 presets × screenshot + `--place-void` assertion
- `vapps.spec.ts` — every registered vApp must mount `[data-app=<id>]`
- `url-nav.spec.ts` — URL contract assertions (windows, titlebar, contrast, composite)
- `a11y.spec.ts` — `@axe-core/playwright` against shell + Blueprint + Settings + high-contrast (fails on serious/critical)

Screenshots land under `tests/screenshots/current/<spec>.png`. To take a one-off agent screenshot, write a tiny inline test (single `page.goto` + `page.screenshot`) — do **not** use `screencapture` or other host tooling.

## Architecture quick refs

- Daemon at `ws://127.0.0.1:49555` (per `apps/daemon/`). Surfaces never embed truth.
- Web shell: Next.js 16 + React 19, on `:5173`. Loads `@ema/design-system/{tokens,glass}.css`.
- Window state: `apps/web/src/place-reflection/shell-state/window-store-bridge.ts` (Zustand, `localStorage`-persisted per project scope).
- vApp registration: `apps/web/src/shell/vapp-registry.tsx`. Add new vApps here + in `vapp-renderer.tsx`.
- The `place-reflection/` folder is partial port from place.org — treat as donor; revamps land in shell/, vapps/, lib/, components/.

## Conventions enforced

- Tabs, double quotes, line-width 100 (Biome).
- No `any` (build error per `biome.json`).
- No hardcoded hex outside `@ema/design-system/tokens.css` and theme presets.
- Tokens via `var(--place-*)`. Text is white-at-opacity, never gray hex.
- Glass via classes from `@ema/design-system/glass.css`.
- `'use client'` on every interactive component.
- `motion/react` with easing `var(--place-ease-smooth)` (cubic-bezier 0.65, 0.05, 0, 1).
- Respect `prefers-reduced-motion` AND `[data-test=1]` for ambient motion.

## Doc structure

- `docs/changelog.md` — every commit
- `docs/dev/url-test-api.md` — URL nav contract
- `docs/architecture/` — system contracts
- `docs/decisions/` — ADRs
- `docs/superpowers/{specs,plans}/` — feature design + execution checklists
- `docs/orchestration/STATUS.md` — wave / orchestrator state

When you ship something non-obvious, add an ADR.
