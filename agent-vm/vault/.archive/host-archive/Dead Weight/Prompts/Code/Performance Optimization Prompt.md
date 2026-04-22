# Performance Optimization Prompt

Sources: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [React Performance Best Practices 2025](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9)

**When to use**: When performance is measurably degraded, before scaling events, during optimization sprints.

---

## Core Rule

**Profile before optimizing. Measure before/after. Never optimize without data.**

Write efficient code by default with correct algorithms and appropriate data structures. Only micro-optimize after profiling shows a bottleneck.

## Prompt

Analyze the following code/system for performance issues and recommend optimizations.

**Target**: `[describe the system, endpoint, or operation to optimize]`
**Current Performance**: `[response time, throughput, resource usage if known]`
**Target Performance**: `[desired metrics]`

### Step 1: Measure
- Establish baseline metrics (response time, throughput, memory, CPU)
- Identify the hot path (where is time actually spent?)
- Profile with appropriate tools:

| Context | Tool | Command |
|---------|------|---------|
| Node.js CPU | Built-in profiler | `node --prof app.js` then `node --prof-process` |
| Node.js memory | Heap snapshot | `--inspect` + Chrome DevTools Memory tab |
| Next.js bundle | Bundle analyzer | `ANALYZE=true next build` (with `@next/bundle-analyzer`) |
| React renders | React DevTools Profiler | Record interaction, sort by render time |
| Web Vitals | Lighthouse | `npx lighthouse URL --view` |
| CLI benchmarks | hyperfine | `hyperfine 'command1' 'command2'` |
| Database queries | Query logging | Enable in ORM, check `EXPLAIN ANALYZE` |
| Network waterfall | Browser DevTools | Network tab, sort by duration |

### Step 2: Identify Bottlenecks
Common patterns to check:

| Pattern | Symptom | Fix |
|---------|---------|-----|
| N+1 queries | Slow list pages | Eager loading, JOINs, DataLoader |
| Unbounded queries | Memory spikes | Pagination, LIMIT, cursor-based |
| Missing indexes | Slow queries | Add targeted indexes, check `EXPLAIN` |
| No caching | Repeated expensive work | Redis, in-memory cache, HTTP cache headers |
| Synchronous blocking | High latency | Async/concurrent execution, `Promise.all` |
| Large payloads | Slow network | Compression, pagination, field selection |
| Unnecessary re-renders | Janky UI | Memoization, key stability, state colocation |
| String concatenation | Slow text processing | Template literals, Array.join |
| Large bundle | Slow initial load | Code splitting, tree shaking, dynamic imports |
| Unoptimized images | Slow LCP | `next/image`, WebP/AVIF, lazy loading |

### Step 3: React-Specific Optimizations

**Re-render Prevention (ordered by impact):**

| Technique | When to Use | Impact |
|-----------|-------------|--------|
| State colocation | State lifted too high in tree | High — prevents subtree re-renders |
| `React.memo` | Component receives same props frequently | Medium — adds comparison overhead |
| `useMemo` | Expensive computation in render path | Medium — only for measurably slow computations |
| `useCallback` | Function prop causing child re-renders | Low-Medium — mainly for memo'd children |
| React Compiler (19+) | All of the above, automatically | High — eliminates manual memoization |

**Note on React 19+ Compiler**: The React Compiler automatically memoizes components and values at build time. If using React 19+, manual `useMemo`/`useCallback` may be unnecessary — check if the compiler handles your case first.

**Bundle Size Reduction:**
```tsx
// Route-level code splitting (automatic in Next.js App Router)
// Manual splitting for heavy components:
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false  // Skip SSR for client-only components
});

// Analyze what's in your bundle:
// next.config.js: const withBundleAnalyzer = require('@next/bundle-analyzer')({enabled: process.env.ANALYZE === 'true'})
```

**List Rendering:**
```tsx
// Virtualize long lists (only render visible items)
import { useVirtualizer } from '@tanstack/react-virtual';
// Use for lists > 100 items
```

**Data Fetching:**
- Use Server Components for initial data (zero client JS)
- Use `React.cache()` to deduplicate server-side fetches
- Use SWR/React Query for client-side with stale-while-revalidate
- Set appropriate `revalidate` intervals for ISR pages

### Step 4: Optimize
For each optimization:
- **What**: Specific change
- **Expected improvement**: Quantified estimate
- **Risk**: What could break
- **Complexity**: How hard to implement and maintain

### Step 5: Verify
- Run benchmarks with same methodology as baseline
- Compare before/after with statistical significance
- Check for regressions in other areas
- Load test at expected scale
- Verify Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1)

### Web Vitals Quick Reference

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4.0s | > 4.0s |
| INP (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |
| TTFB (Time to First Byte) | < 800ms | 800-1800ms | > 1800ms |

### Model Selection for Agent Tasks

| Model | Best For | Cost |
|-------|----------|------|
| Haiku 4.5 | Lightweight agents, pair programming, workers | Lowest |
| Sonnet 4.6 | Primary development, orchestration | Medium |
| Opus 4.5 | Architecture, deep reasoning, research | Highest |

### Context Window Management
- Reserve the final 20% of context for simple operations
- Large refactoring and multi-file work should have full context available
- Use `/clear` when switching tasks to reset context
