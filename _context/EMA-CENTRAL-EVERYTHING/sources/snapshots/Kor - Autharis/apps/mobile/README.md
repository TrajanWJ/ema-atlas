# @autharis/mobile

Lane **G1** — Expo / React Native companion to the Autharis talent surface.

Three tabs mirroring the web talent experience:

- **Opportunities** — open job-request feed
- **Timesheet** — weekly hour entry + submit
- **Earnings** — YTD total + per-invoice list

## Setup

From the monorepo root:

```bash
pnpm install
pnpm --filter @autharis/mobile start
```

Platform-specific launchers:

```bash
pnpm --filter @autharis/mobile ios      # iOS simulator
pnpm --filter @autharis/mobile android  # Android emulator
```

## Expo Go

With `expo start` running, scan the QR code from the Expo Go app on a physical
device. The app ships no native modules beyond `expo-router`,
`react-native-safe-area-context`, and `react-native-screens` — all bundled in
the standard Expo Go runtime for SDK 51.

## Data

Screens currently read inline fixtures whose shapes match `JobRequest`,
`TimesheetEntry`, and `Invoice` from `@autharis/sdk`. To swap in live data,
instantiate an `AutharisClient`:

```ts
import { AutharisClient } from '@autharis/sdk';

const client = new AutharisClient({ baseUrl: 'https://api.autharis.dev' });
const { items } = await client.jobs.list();
```

## Theme

`lib/theme.ts` is an RN-flavored mirror of `@autharis/tokens`. RN's `StyleSheet`
doesn't resolve CSS `var(...)` or `color-mix()`, so tokens are pinned to
concrete values. Keep in lockstep with `packages/tokens/src/index.ts`.

## Constraints

- Does **not** import from `@autharis/ui` (DOM React) or `autharis/components`
  (Next.js). Primitives live locally in `components/`.
- File scope: `apps/mobile/**`. No edits elsewhere except the G1 lane row and a
  decisions.md append.
