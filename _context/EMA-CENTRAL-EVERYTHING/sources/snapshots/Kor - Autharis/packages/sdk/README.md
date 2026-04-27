# @autharis/sdk

Typed TypeScript SDK for the Autharis API. Zero runtime dependencies — uses
`globalThis.fetch` by default, or accepts an injected `fetch` implementation.

Consumable from Next.js, the Autharis CLI, Expo (mobile), Tauri (desktop), and
any modern Node 18+ runtime.

## Install

This package is internal to the Autharis monorepo. Add to any workspace via
pnpm workspace protocol:

```json
{
  "dependencies": {
    "@autharis/sdk": "workspace:*"
  }
}
```

## Usage

```ts
import { AutharisClient } from '@autharis/sdk';

const client = new AutharisClient({
  baseUrl: 'https://api.autharis.dev',
  apiKey: process.env.AUTHARIS_API_KEY,
});
```

The constructor accepts:

| Option           | Type                                    | Notes                                         |
| ---------------- | --------------------------------------- | --------------------------------------------- |
| `baseUrl`        | `string` (required)                     | Autharis API base URL, no trailing slash.     |
| `apiKey`         | `string`                                | Sent as `Authorization: Bearer ...`.          |
| `fetch`          | `FetchLike`                             | Override for testing / non-browser runtimes.  |
| `defaultHeaders` | `Record<string, string>`                | Merged into every request.                    |

All methods accept a trailing `RequestOptions` with `signal` (AbortSignal) and
per-call `headers`.

## Resources

### Talent

```ts
const page = await client.talent.list({ status: 'Active', skill: 'Notion' });
const talent = await client.talent.get('t-001');
console.log(talent.score, talent.skills);
```

### Jobs

```ts
const jobs = await client.jobs.list({ status: 'Reviewing' });
const job = await client.jobs.get('jr-001');

const created = await client.jobs.create({
  title: 'Weekly market research brief',
  category: 'rsrch',
  client: 'Ladder Fintech',
  description: 'Competitive landscape across five fintech categories.',
  hoursPerWeek: 10,
  duration: '2 months',
  timezone: 'Any',
  budget: [40, 60],
  skills: ['Market Research', 'Desk Research'],
  industry: 'Fintech',
});
```

### Timesheets

```ts
const draft = await client.timesheets.submit({
  engagementId: 'e-001',
  weekOf: 'Apr 20 — Apr 26, 2026',
  entries: [
    { day: 'Mon, Apr 20', hours: 3.5, note: 'Evening intake queue.' },
    { day: 'Tue, Apr 21', hours: 4.0, note: '7 consults scheduled.' },
  ],
});

await client.timesheets.approve(draft.id);
```

## Errors

Every non-2xx response throws an `AutharisError`:

```ts
import { AutharisError } from '@autharis/sdk';

try {
  await client.talent.get('missing');
} catch (err) {
  if (err instanceof AutharisError) {
    console.error(err.status, err.code, err.requestId, err.message);
  }
}
```

## Build

```sh
pnpm --filter @autharis/sdk build
```

Produces dual ESM + CJS bundles plus `.d.ts` declarations in `dist/`.
