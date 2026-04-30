---
name: place-donor-surface
description: SUPERSEDED. Use the auto-loaded shared skills under `.claude/skills/` instead — `place-window-and-shell`, `place-app-registry`, `place-keyboard-and-command`. This file is kept only as a redirect.
---

# Place Donor Surface — superseded

This skill has been split into three auto-loaded shared skills. Use those instead:

- **`place-window-and-shell`** — window grammar, dock, virtual desktops, snap zones, popouts, boot sequence, desktop surface, ambient bar.
- **`place-app-registry`** — the app contract (`id / name / icon / defaultSize / chromeColor / menuBar / quickActions / search / files / status / settings`); registration pattern; send-to flow.
- **`place-keyboard-and-command`** — canonical keymap, single global handler, command palette (`Cmd+K`), quick capture (`Cmd+.`), shortcut help (`?`), focus management, accessibility rules.

Canonical source: `Projects/EMA/atlas/shared/skills/`.
Auto-loaded into every EMA / vApp via `.claude/skills/`.
Install or re-install: `bash Projects/EMA/atlas/shared/skills/install-shared-skills.sh`.

## What also lives in shared

- **`place-frontend-conventions`** — TS discipline, file layout, store/hook patterns, motion, performance — the craft baseline this skill used to hint at.
- **`place-brand-voice`**, **`place-psychology-and-language`**, **`place-product-philosophy`** — the *why* and *voice* underneath every surface.

## Why this file still exists

Removed nothing — kept as a redirect so any agent still grepping the old name lands on the new home. Safe to delete once no references remain. (The companion-bridge donor skill is unchanged; it's vApp-specific to the EMA Tauri shell.)
