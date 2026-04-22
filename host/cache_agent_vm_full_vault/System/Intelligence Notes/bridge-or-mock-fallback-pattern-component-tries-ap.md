---
title: "Bridge-or-Mock Fallback Pattern"
type: reference
created: 2026-03-20
updated: 2026-04-07
confidence: high
source: task-1467181f, frontend development practice
summary: "Component tries live API first, falls back to rich local mock data when backend is unavailable — enables frontend development without a running server"
tags:
  - intelligence
  - design-pattern
  - resilience
  - frontend
  - developer-experience
---

# Bridge-or-Mock Fallback Pattern

## Core Pattern

The bridge-or-mock fallback pattern is a frontend resilience strategy where components attempt to fetch data from a live API endpoint first, and silently fall back to rich local mock data when the backend is unavailable. This keeps demo pages, development environments, and offline workflows fully functional without requiring a running backend server.

The key insight: **the component should never know or care whether it's consuming live or mock data.** The data shape is identical in both paths, so rendering logic stays clean and unconditional.

## How It Works

### The Fetch-with-Fallback Flow

1. **Component mounts** and initiates a data fetch to the live API endpoint (e.g., `/api/feed/:id`)
2. **If the API responds successfully**: use the live data as-is
3. **If the fetch fails** (network error, 500, timeout, CORS issue): catch the error silently and load the corresponding mock data
4. **Component renders** using whichever data source responded — the rendering path is identical

### Implementation Shape

```typescript
import { MOCK_FEED_DATA } from '../mocks/feed';

async function fetchFeedData(id: string): Promise<FeedEvent[]> {
  try {
    const response = await fetch(`/api/feed/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch {
    // Backend not available — use mock data for development
    console.debug('[feed] Using mock data — API unavailable');
    return MOCK_FEED_DATA[id] ?? MOCK_FEED_DATA.default;
  }
}
```

### Mock Data Requirements

The mock data layer is not a throwaway placeholder — it's a first-class development artifact:

- **Shape-accurate**: Mock data must match the exact TypeScript types returned by the real API. If the API returns `FeedEvent[]`, the mock returns `FeedEvent[]`.
- **Rich and realistic**: Include edge cases (empty arrays, long strings, missing optional fields) so the UI is tested against realistic conditions.
- **Versioned alongside the API**: When the API response shape changes, mock data must be updated in the same PR. Stale mocks silently break the fallback path.
- **Scenario-indexed**: Organize mocks by scenario (empty state, error state, full state, pagination boundary) rather than a single default blob.

## Why This Pattern Matters

### Developer Experience

Frontend developers can work on UI components without running the entire backend stack. This is especially valuable in microservice architectures where "the backend" might mean spinning up 5+ services, a database, and a message queue. The fallback pattern collapses that dependency to zero for most UI work.

### Demo and Presentation Safety

Product demos, design reviews, and stakeholder walkthroughs become reliable because they don't depend on backend uptime. A flaky staging server doesn't derail a demo — the UI falls back to curated mock data that shows the feature at its best.

### Progressive Integration

Teams can build frontend features before the corresponding API endpoints exist. The mock data serves as the **API contract** — once the backend implements endpoints matching the mock shape, the frontend automatically starts consuming live data with zero code changes. This enables true parallel frontend/backend development.

### Offline-First Groundwork

While this pattern alone doesn't make an app offline-first, it establishes the architectural foundation. The separation between data fetching and data consumption is the same boundary where service workers, IndexedDB caching, or local-first sync layers would be introduced later.

## Design Rules

1. **Never branch rendering logic on data source.** The component should not know whether data is live or mocked. No `if (isMock) { ... }` in render code.
2. **Log fallback events in development.** A `console.debug` or dev-only toast notification helps developers know when they're seeing mock data vs. live data, without polluting production logs.
3. **Keep mock data co-located with the component or feature.** A `mocks/` directory next to the component is better than a global `__mocks__/` directory, because it signals that mock data is part of the feature's contract.
4. **Type-check mock data against API response types.** Use `satisfies` or explicit type annotations to ensure mocks stay in sync with API changes:
   ```typescript
   const MOCK_FEED: FeedEvent[] = [ /* ... */ ] satisfies FeedEvent[];
   ```
5. **Set reasonable timeouts on the live fetch.** A 10-second timeout before fallback is too slow for development; 1-2 seconds keeps the dev loop fast.
6. **Don't retry before falling back.** In development, if the backend is down, it's down. Retries just add latency. A single failed attempt should trigger immediate fallback.

## When NOT to Use This Pattern

- **In production user-facing code**: Users should see real data or an explicit error state, not mock data presented as real. The fallback path is for development and demos only.
- **For authentication flows**: Mock auth data creates false security assumptions. Auth should fail explicitly.
- **When data correctness matters more than availability**: Financial data, medical records, or any domain where showing stale/fake data is worse than showing nothing.

## Relationship to Other Patterns

This pattern is the **component-level sibling** of [[best-effort-enrichment-with-graceful-degradation-c]], which applies the same graceful-degradation philosophy at the API layer. Where best-effort enrichment says "return base data if enrichment fails," bridge-or-mock says "render with mock data if the API fails."

It also shares DNA with the [[pipeline-smoke-test-pattern-verify-all-layers-disp]] — both patterns address the reality that multi-layer systems have many failure points. The smoke test verifies all layers are up; bridge-or-mock ensures the frontend keeps working when they're not.

More broadly, this pattern embodies the **progressive enhancement** philosophy: the baseline experience (mock data rendering) always works, and the enhanced experience (live data) layers on top when available.

## Anti-Patterns to Avoid

- **Empty fallback data**: Falling back to `[]` or `{}` instead of rich mock data. This makes the fallback path useless for development — you see an empty screen instead of the feature you're building.
- **Production mock leakage**: Shipping mock data in the production bundle when it's only needed in development. Use build-time tree-shaking or dynamic imports gated on `NODE_ENV`.
- **Silent fallback in production**: If this pattern is accidentally active in production, users see mock data instead of errors. Add an environment guard: only fall back to mocks when `process.env.NODE_ENV !== 'production'`.
- **Fetch-mock confusion**: Using this pattern alongside test mocking libraries (like `msw` or `jest.mock`) creates layered indirection. Keep test mocks and development fallback mocks separate.

## Origin

Originally extracted from Agent-OS-Frontend feed implementation (task-1467181f), where feed components need to render during development without requiring the full dispatch backend and database stack. The pattern proved essential for rapid UI iteration on the feed, dashboard, and agent status pages.

---
Category: design-pattern | Impact: 4/5 | Project: Agent-OS-Frontend
