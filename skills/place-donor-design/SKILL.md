---
name: place-donor-design
description: SUPERSEDED. Use the auto-loaded shared skills under `.claude/skills/` instead — `place-design-tokens`, `place-glass-system`, `place-theme-system`. This file is kept only as a redirect.
---

# Place Donor Design — superseded

This skill has been split into three auto-loaded shared skills. Use those instead:

- **`place-design-tokens`** — the full `--place-*` token contract (surfaces, text-at-opacity, scales, semantic, borders, contrast/light modes, typography, easing). Includes `assets/tokens.css`.
- **`place-glass-system`** — the four glass tiers (`ambient` / `surface` / `elevated` / `accent`), the `blur + saturate` formula, when to use which. Includes `assets/glass.css`.
- **`place-theme-system`** — the 10 themable presets and the `buildTokens()` contract. Includes `assets/theme-presets.ts`.

Canonical source: `Projects/EMA/atlas/shared/skills/`.
Auto-loaded into every EMA / vApp via `.claude/skills/`.
Install or re-install: `bash Projects/EMA/atlas/shared/skills/install-shared-skills.sh`.

## Why this file still exists

Removed nothing — kept as a redirect so any agent still grepping the old name lands on the new home. Safe to delete once no references remain.
