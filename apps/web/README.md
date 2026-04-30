# EMA Web

Browser-hosted shell for EMA `0.0.5`.

This app has two distinct verification modes:

- `next dev` on `http://127.0.0.1:5173` for fast local iteration.
- static-export playback from `apps/web/out/` for Playwright coverage against the bytes that ship in the Tauri app.

## Commands

From `apps/web/`:

```bash
pnpm dev
pnpm build
pnpm test:unit
pnpm test:e2e:static
pnpm test:e2e:dev
```

From repo root:

```bash
pnpm --filter @ema/web dev
pnpm --filter @ema/web test:unit
pnpm --filter @ema/web test:e2e:static
```

## Agent Testing Loop

1. Build or start the target surface.
2. Drive state through the URL contract instead of UI clicking.
3. Use `?test=1` on every E2E URL to suppress ambient motion.
4. Prefer static-export Playwright for regressions that matter to the packaged app.
5. Use dev-server Playwright only when debugging a local iteration issue.

Primary references:

- `../../docs/dev/url-test-api.md`
- `./playwright.config.ts`
- `./docs/testing/ui-test-prompt.md`
- `../../tooling/workspace-e2e.mjs`

## URL-Driven Navigation

Examples:

```text
/?test=1
/?vapp=blueprint&test=1
/?windows=blueprint:120,80,860,540;hq:1020,80,500,540&test=1
/?theme=dracula&titlebar=compact&contrast=high&test=1
/?panel=wiki&test=1
```

This URL contract is the canonical agent/E2E control surface. If the shell stops honoring one of these parameters, update both the implementation and `docs/dev/url-test-api.md`.
