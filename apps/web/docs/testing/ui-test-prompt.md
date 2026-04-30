# EMA Web UI Test Prompt

Use this when an agent or human reviewer needs a deterministic frontend pass.

## Setup

Run one of:

```bash
pnpm --filter @ema/web test:e2e:static
pnpm --filter @ema/web test:e2e:dev
```

For manual inspection:

```bash
pnpm --filter @ema/web dev
```

## Navigation Contract

Do not hunt through the UI to open state unless the test is explicitly about discovery.

Prefer URLs like:

```text
/?test=1
/?vapp=blueprint&test=1
/?vapp=launchpad&theme=dracula&test=1
/?windows=blueprint:120,80,860,540;hq:1020,80,500,540&test=1
/?panel=wiki&test=1
```

## What To Check

- Shell boots without console errors or blank surfaces.
- Requested vApps actually mount and remain interactive.
- Dock, launcher, titlebar, and popout flows still work after URL-driven boot.
- Theme, contrast, and titlebar params apply to `<html>` state.
- Tauri-specific affordances do not break the browser path.
- No unexpected retries, crashes, or animation noise in `?test=1` mode.

## Report Format

- URL used
- expected behavior
- observed behavior
- screenshot path if captured
- whether the issue reproduces in `static` only, `dev` only, or both
