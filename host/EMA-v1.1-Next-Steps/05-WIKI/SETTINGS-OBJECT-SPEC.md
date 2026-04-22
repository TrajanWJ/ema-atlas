---
id: WIKI-SETTINGS-OBJECT-SPEC
type: object-spec
layer: canon
title: "Settings object spec — scoped, categorized, authoritative"
status: draft
created: 2026-04-13
scope: "renderer SettingsApp + services /api/settings/* + shared/schemas/settings.ts"
related:
  - "[[05-WIKI/EMA-SHARED-OBJECT-MODEL-DRAFT]]"
  - "[[05-WIKI/OBJECT-PAGE-TEMPLATE]]"
  - "[[05-WIKI/EMA-PLANES-INDEX]]"
  - "[[01-PLANS/2026-04-13-FRONTEND-BUILDOUT-PLAN]]"
  - "[[05-WIKI/TOP-BAR-SPACES-ORGS-SPEC]]"
tags: [wiki, spec, settings, object-model, v1.1]
---

# Settings Object Spec

> Settings today are a thin single-page form. This spec defines what
> settings exist, at what scope, in what categories, and how they persist.
> It is the canon shape the renderer will render and the services daemon
> will store.

## Core principles

1. **Three scopes, explicit.** Every setting is `global`, `org`, or
   `space`. The scope picker is part of the UI and never hidden. A setting
   that exists at multiple scopes follows "narrowest wins" (space > org >
   global).
2. **Categories, not a flat list.** Six top-level categories. No nesting
   past two levels.
3. **Typed end-to-end.** Zod schema in `@ema/shared/schemas/settings.ts`
   is the source of truth. Services validates on write. Renderer parses on
   read.
4. **Durable across daemon restart.** Stored in SQLite in a single
   `settings` table with `(scope, scope_id, category, key)` primary key.
5. **Observable.** Changes publish `settings.updated` on the WS bus so
   every open window updates without reload.
6. **No silent fallbacks.** If a setting is unset, the UI shows "inherits
   from <scope>" or "default" — never a hidden-injected value that looks
   user-set.

## Scope rules

| Scope | Applies to | Example |
|---|---|---|
| `global` | This machine, all orgs, all spaces | theme, keybindings, telemetry opt-in |
| `org` | A specific organization (every space inside it) | brand color, default actor, agent provider |
| `space` | A specific space (smallest unit) | pinned vApps, dashboard layout, focus rules |

Precedence: `space` > `org` > `global` > schema default.

When editing a setting that exists at multiple scopes, the UI shows:

```
[ global value: light ]  [ org override: dark ]  [ space override: (unset, inherits dark) ]
```

## Category 1 — Identity

At scope: `global`, `org`

| Key | Type | Scope | Default |
|---|---|---|---|
| `display_name` | string | global | "Trajan" (from env) |
| `email` | string? | global | none |
| `avatar_url` | url? | global | none |
| `default_actor_id` | actor ref | org | `self` |
| `org_name` | string | org | — |
| `org_brand_color` | hex color | org | `#6366f1` |

## Category 2 — Daemon

At scope: `global`

| Key | Type | Default | Notes |
|---|---|---|---|
| `daemon_mode` | `managed` / `attach` / `external` | `attach` | `managed` = Electron spawns; `attach` = expect systemd; `external` = developer |
| `daemon_port` | number | `4488` | |
| `daemon_bind` | `127.0.0.1` / `0.0.0.0` | `127.0.0.1` | |
| `bootstrap_token_path` | path | `~/.config/ema/token` | |
| `auto_start_on_login` | boolean | `false` | |
| `log_level` | `debug` / `info` / `warn` / `error` | `info` | |
| `log_retention_days` | number | `14` | |
| `db_path` | path | `~/.local/share/ema/ema.db` | Advanced; warning on change |
| `vault_path` | path | `~/.local/share/ema/vault` | Advanced; warning on change |

The Daemon category has a panel surface, not just a form: **[Start] [Stop]
[Restart] [Install systemd] [View logs] [Open DB folder]** buttons at the
top, with status pill and last-error display.

## Category 3 — Appearance

At scope: `global` (theme), `space` (layout)

| Key | Type | Scope | Default |
|---|---|---|---|
| `theme` | `light` / `dark` / `system` | global | `system` |
| `accent_color` | hex color | global | `#6366f1` |
| `glass_opacity` | 0.04–0.16 | global | `0.08` |
| `font_family` | `system` / `mono` / custom | global | `system` |
| `font_size` | `small` / `medium` / `large` | global | `medium` |
| `density` | `compact` / `comfortable` | global | `comfortable` |
| `dashboard_layout` | layout json | space | default grid |
| `pinned_vapps` | string[] | space | `[]` |
| `dock_position` | `bottom` / `top` / `hidden` | global | `bottom` |

## Category 4 — Data

At scope: `global`, `org`

| Key | Type | Scope | Default |
|---|---|---|---|
| `genesis_path` | path | global | `~/Projects/ema/ema-genesis` |
| `auto_ingest_on_boot` | boolean | global | `true` |
| `auto_ingest_watch` | boolean | global | `false` (requires `EMA_WORKERS_WATCH_INTENTS=1`) |
| `backup_enabled` | boolean | global | `false` |
| `backup_path` | path | global | `~/.local/share/ema/backup` |
| `backup_retention_days` | number | global | `30` |
| `telemetry_opt_in` | boolean | global | `false` |
| `anthropic_api_key_ref` | keyring ref | org | — |
| `agent_provider` | `claude-code` / `claude-api` / `codex` / `openai` | org | `claude-code` |

API keys are **never** stored in settings directly — only keyring refs
(`keychain://service/key-name`). The renderer must never read raw keys.

## Category 5 — Keybindings

At scope: `global`

Schema: `Record<actionId, keyCombo>`.

Default bindings:

| Action | Default |
|---|---|
| `launchpad.open` | `Cmd+K` |
| `brain-dump.quick` | `Cmd+Shift+C` |
| `shell.quit` | `Cmd+Q` |
| `shell.minimize` | `Cmd+M` |
| `shell.switch-space` | `Cmd+1..9` |
| `vapp.reload` | `Cmd+R` |
| `vapp.close` | `Cmd+W` |
| `search.global` | `Cmd+F` |
| `command-palette` | `Cmd+Shift+P` |

UI: list of all actions, click-to-rebind, conflict detection inline,
reset-to-default button per row + global.

Global shortcuts (registered at Electron level) and in-window shortcuts
(React level) are both shown; global ones have a distinct badge.

## Category 6 — Advanced

At scope: `global`

| Key | Type | Default | Notes |
|---|---|---|---|
| `dev_mode` | boolean | `false` | Shows request panel, WS inspector, store state |
| `show_internal_routes` | boolean | `false` | Surfaces quarantined vApps |
| `experimental_flags` | Record<string,bool> | `{}` | Per-feature gating |
| `reset_all` | button | — | Wipes settings table, keeps data |
| `factory_reset` | button (confirmation required) | — | Wipes settings + DB + vault |

## Wire format (services)

`GET /api/settings/:scope/:scope_id?/:category?`
- `scope` = `global` / `org` / `space`
- `scope_id` required for `org`/`space`, optional for `global`
- `category` optional (omit = return all categories for that scope)

`PUT /api/settings/:scope/:scope_id?/:category/:key`
- Body: `{ value: <typed> }`
- Validates against shared schema
- Broadcasts `settings.updated` on WS topic `settings:<scope>:<scope_id>`

`DELETE /api/settings/:scope/:scope_id?/:category/:key`
- Reverts to parent scope / default

## Storage shape

```sql
CREATE TABLE settings (
  scope TEXT NOT NULL CHECK (scope IN ('global','org','space')),
  scope_id TEXT NOT NULL,            -- 'default' for global; org/space slug otherwise
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,               -- JSON-encoded
  updated_at INTEGER NOT NULL,
  updated_by TEXT,                   -- actor id
  PRIMARY KEY (scope, scope_id, category, key)
);
```

## Migration from current state

1. Rename current `SettingsApp.tsx` → `SettingsApp.legacy.tsx` (freeze).
2. Create `apps/renderer/src/components/settings/` directory with one file
   per category.
3. Create `shared/schemas/settings.ts` with the Zod schemas.
4. Create `services/core/settings/` domain following existing pattern (`router.ts`, `service.ts`, `schema.ts`, `settings.test.ts`).
5. Wire the new `<SettingsShell />` to the existing `settings` route.
6. Delete `SettingsApp.legacy.tsx` once F3 acceptance passes.

## Open questions

- Should org and space be user-facing terms or internal only? Top bar
  uses them — see [[05-WIKI/TOP-BAR-SPACES-ORGS-SPEC]]. Decision deferred
  to that spec.
- Keybindings: should global (OS-level) vs in-window bindings have
  separate tables, or one with a flag? Recommend: one table, flag column.
- Telemetry opt-in ships `false` — but is telemetry actually implemented?
  Today: no. Ship the setting anyway so it's ready.
- Keyring backend: on Linux, `libsecret`; on macOS, Keychain; on Windows,
  Credential Manager. Node module: `keytar`. Add to deps when F3 lands.
