> See also: [[LetMeScale]]

# Visual Polish Pass — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring all 4 testimonial variants to feature parity via shared components, and add visual polish to text-heavy sections site-wide.

**Architecture:** Extract reusable proof UI components from the 1200-line `testimonials-cascade-v2.tsx` into `proof/shared/`. Compose them into phones and editorial variants. Polish engage, philosophy, who-for, and CTA with glass cards, numbered steps, and micro-animations.

**Tech Stack:** React 19, Next.js 15, Framer Motion, Tailwind CSS v4, design tokens from `globals.css`

---

## Phase 1: Extract Shared Proof Components

### Task 1: Create MetricsRow shared component

**Files:**
- Create: `apps/landing/components/sections/proof/shared/metrics-row.tsx`
- Reference: `apps/landing/components/sections/proof/testimonials-cascade-v2.tsx` (lines ~188-223 in the original, the `MetricsRow` function and `parseMetric` helper)

**Step 1: Create the file**

Extract `parseMetric()` and `MetricsRow` from cascade-v2 into a standalone module. The component renders a flex-wrap row of stat pills with count-up animation via `<Counter>`.

```tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Counter } from "@/components/counter";
import type { StoryMetric } from "@/lib/testimonials";

function parseMetric(value: string): { numeric: number; prefix: string; suffix: string; decimals: number } | null {
  const match = value.match(/^(\$?)([\d,.]+)(\+?[A-Za-z%]*\+?)$/);
  if (!match) return null;
  const num = parseFloat(match[2].replace(/,/g, ""));
  if (isNaN(num)) return null;
  return {
    prefix: match[1],
    numeric: num,
    suffix: match[3],
    decimals: match[2].includes(".") ? match[2].split(".")[1].length : 0,
  };
}

export function MetricsRow({ metrics }: { metrics: StoryMetric[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="flex flex-wrap justify-center gap-3">
      {metrics.map((m, i) => {
        const parsed = parseMetric(m.value);
        return (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className={`bg-white/[0.03] border border-[var(--border)] rounded-2xl px-5 py-3.5 text-center min-w-[100px] ${inView ? "animate-stat-pulse" : ""}`}
            style={{ animationDelay: `${i * 0.5}s` }}
          >
            {parsed ? (
              <Counter
                target={parsed.numeric}
                prefix={parsed.prefix}
                suffix={parsed.suffix}
                decimals={parsed.decimals}
                duration={1.8}
                className="text-white font-bold text-base"
              />
            ) : (
              <p className="text-white font-bold text-base">{m.value}</p>
            )}
            <p className="text-[var(--text-tertiary)] text-[10px] mt-1 font-data tracking-wider uppercase">{m.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `pnpm --filter landing build 2>&1 | tail -5` (or just check HMR doesn't error)

**Step 3: Commit**

```bash
git add apps/landing/components/sections/proof/shared/metrics-row.tsx
git commit -m "feat(proof): extract MetricsRow shared component"
```

---

### Task 2: Create CardHeader shared component

**Files:**
- Create: `apps/landing/components/sections/proof/shared/card-header.tsx`
- Reference: `testimonials-cascade-v2.tsx` `CardHeader` function (~lines 241-295)

**Step 1: Create the file**

Extract `CardHeader` — renders avatar, name, subtitle, badge, social links, and headline quote.

```tsx
"use client";

import Image from "next/image";
import { Instagram, Globe } from "lucide-react";
import { STACK_HEADLINES, type CaseStudy } from "@/lib/testimonials";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="16" height="16">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.2 8.2 0 004.76 1.52V6.69h-1z" />
    </svg>
  );
}

export function CardHeader({ client, badge }: { client: CaseStudy; badge?: string }) {
  const { profile } = client;
  const socials = profile.socials;
  const headline = STACK_HEADLINES[client.id];

  return (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[var(--border-hover)] bg-white/[0.04] mb-5">
        {profile.profileImage ? (
          <Image src={profile.profileImage} alt={client.name} width={96} height={96} className="object-cover w-full h-full" />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-[var(--text-tertiary)] text-2xl font-display font-bold">
            {client.name.charAt(0)}
          </span>
        )}
      </div>

      <h3 className="font-display text-4xl md:text-5xl text-white tracking-tight text-center">{client.name}</h3>
      <div className="flex items-center gap-3 mt-2">
        <p className="font-data text-xs tracking-[0.2em] text-[var(--text-tertiary)] uppercase">{client.subtitle}</p>
        {badge && (
          <span className="font-data text-[9px] tracking-wider uppercase px-2 py-0.5 rounded bg-red/20 text-red border border-red/20">
            {badge}
          </span>
        )}
      </div>

      {(socials.instagram || socials.tiktok || socials.website) && (
        <div className="flex items-center gap-3 mt-3">
          {socials.instagram && (
            <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              <Instagram size={16} />
            </a>
          )}
          {socials.tiktok && (
            <a href={socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              <TikTokIcon className="w-4 h-4" />
            </a>
          )}
          {socials.website && (
            <a href={socials.website} target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              <Globe size={16} />
            </a>
          )}
        </div>
      )}

      {headline && (
        <p className="font-display italic text-xl md:text-2xl text-[var(--text-secondary)] text-center max-w-xl mt-8 leading-relaxed">
          &ldquo;{headline}&rdquo;
        </p>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/landing/components/sections/proof/shared/card-header.tsx
git commit -m "feat(proof): extract CardHeader shared component"
```

---

### Task 3: Create ClickableShot shared component

**Files:**
- Create: `apps/landing/components/sections/proof/shared/clickable-shot.tsx`
- Reference: `testimonials-cascade-v2.tsx` `ClickableShot` function (~lines 88-168)

**Step 1: Create the file**

Extract `ClickableShot` — annotated screenshot thumbnail with hover glow, expand hint, labels, and stat overlay. Triggers lightbox via `onOpen` callback.

Copy the exact implementation from cascade-v2 lines 88-168 into the new file. Add `"use client"` and the required imports (`Image` from next/image).

**Step 2: Commit**

```bash
git add apps/landing/components/sections/proof/shared/clickable-shot.tsx
git commit -m "feat(proof): extract ClickableShot shared component"
```

---

### Task 4: Create BeforeAfterToggle shared component

**Files:**
- Create: `apps/landing/components/sections/proof/shared/before-after-toggle.tsx`
- Reference: `testimonials-cascade-v2.tsx` `TrellBeforeAfter` function (~lines 301-456)

**Step 1: Create the file**

Generalize the before/after toggle. Instead of hardcoded Trell images, accept props:

```tsx
interface BeforeAfterToggleProps {
  beforeImage: string;
  afterImage: string;
  beforeStat: string;
  afterStat: string;
  beforeBadge: string;
  afterBadge: string;
  beforePeriod: string;
  afterPeriod: string;
  onOpen: (src: string, alt: string) => void;
}
```

Keep the same idle (side-by-side) → expanded (single with nav arrows) → back-to-both UX. Use `useInView` to auto-collapse when scrolled away.

**Step 2: Commit**

```bash
git add apps/landing/components/sections/proof/shared/before-after-toggle.tsx
git commit -m "feat(proof): extract BeforeAfterToggle shared component"
```

---

### Task 5: Create TimelineBar shared component

**Files:**
- Create: `apps/landing/components/sections/proof/shared/timeline-bar.tsx`
- Reference: `testimonials-cascade-v2.tsx` `TrellTimeline` function (~lines 464-579)

**Step 1: Create the file**

Generalize the horizontal timeline. Accept an array of nodes:

```tsx
interface TimelineNode {
  period: string;
  value: string;
  change: string;
  direction: "up" | "down";
  highlight?: boolean;
}

interface TimelineBarProps {
  nodes: TimelineNode[];
  inView: boolean;
  summary?: string; // e.g. "$31K → $187K in 60 days — 6x growth"
}
```

Keep: red connecting line, animated nodes, hover tooltip cards with arrow pointing down, summary text.

**Step 2: Commit**

```bash
git add apps/landing/components/sections/proof/shared/timeline-bar.tsx
git commit -m "feat(proof): extract TimelineBar shared component"
```

---

### Task 6: Create MonthlyLedger, ContentGrid, and barrel export

**Files:**
- Create: `apps/landing/components/sections/proof/shared/monthly-ledger.tsx`
- Create: `apps/landing/components/sections/proof/shared/content-grid.tsx`
- Create: `apps/landing/components/sections/proof/shared/index.ts`

**Step 1: Create MonthlyLedger**

Extract Mark's 6-month grid from cascade-v2 (~lines 742-788). Accept `months: RevenueMonth[]` prop. Keep highlight style, red progress line, grid layout.

**Step 2: Create ContentGrid**

Extract Daniel's 9-reel grid from cascade-v2 (~lines 682-701). Accept `items: { views: string; theme: string }[]` prop. Keep 3-col grid, stagger animation.

**Step 3: Create barrel export**

```ts
// apps/landing/components/sections/proof/shared/index.ts
export { MetricsRow } from "./metrics-row";
export { CardHeader } from "./card-header";
export { ClickableShot } from "./clickable-shot";
export { BeforeAfterToggle } from "./before-after-toggle";
export { TimelineBar } from "./timeline-bar";
export { MonthlyLedger } from "./monthly-ledger";
export { ContentGrid } from "./content-grid";
```

**Step 4: Commit**

```bash
git add apps/landing/components/sections/proof/shared/
git commit -m "feat(proof): extract MonthlyLedger, ContentGrid, and barrel export"
```

---

### Task 7: Create ClientStoryViz resolver

**Files:**
- Create: `apps/landing/components/sections/proof/shared/client-story-viz.tsx`
- Update: `apps/landing/components/sections/proof/shared/index.ts`

**Step 1: Create the resolver**

This component takes a `client: CaseStudy` and `onOpen` callback, then renders the appropriate per-client data visualization:

```tsx
"use client";

import { useRef, useState, useCallback } from "react";
import { useInView } from "framer-motion";
import type { CaseStudy } from "@/lib/testimonials";
import {
  TRELL_TIMELINE, MARK_MONTHS, CHETHA_CAMPAIGNS,
  DANIEL_VIRAL_REELS, DANIEL_CONTENT_GRID,
  FARID_TOP_VIDEOS, JOSH_MILESTONES
} from "@/lib/testimonials";
import { TimelineBar } from "./timeline-bar";
import { BeforeAfterToggle } from "./before-after-toggle";
import { MonthlyLedger } from "./monthly-ledger";
import { ContentGrid } from "./content-grid";
import { ClickableShot } from "./clickable-shot";
import { GalleryLightbox } from "../gallery-lightbox";
import { VideoMarquee } from "../video-marquee";

export function ClientStoryViz({ client, onOpen }: { client: CaseStudy; onOpen: (src: string, alt: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="space-y-8">
      {client.id === "trell" && <TrellViz client={client} inView={inView} onOpen={onOpen} />}
      {client.id === "daniel" && <DanielViz client={client} inView={inView} onOpen={onOpen} />}
      {client.id === "mark-shapiro" && <MarkViz client={client} inView={inView} onOpen={onOpen} />}
      {client.id === "chetha" && <ChethaViz client={client} inView={inView} />}
      {client.id === "farid" && <FaridViz client={client} inView={inView} onOpen={onOpen} />}
      {client.id === "josh-snow" && <JoshViz inView={inView} />}
    </div>
  );
}
```

Each per-client sub-component (`TrellViz`, `DanielViz`, etc.) composes the shared components with the client-specific data from `@/lib/testimonials`. These are the same implementations currently inline in cascade-v2's `TrellStory`, `DanielStory`, `MarkStory`, etc. — just refactored to use shared components.

**Key mappings:**
- `TrellViz`: `<TimelineBar nodes={TRELL_TIMELINE.map(...)}>` + `<BeforeAfterToggle>` + bio
- `DanielViz`: Hero stats bar + `<ClickableShot>` breakout reel + `<ContentGrid items={DANIEL_CONTENT_GRID}>` + scatter shots
- `MarkViz`: `<MonthlyLedger months={MARK_MONTHS}>` + cumulative totals card
- `ChethaViz`: Campaign table (Whop data from `CHETHA_CAMPAIGNS`)
- `FaridViz`: `<VideoMarquee videos={FARID_TOP_VIDEOS...}>` + bio
- `JoshViz`: Milestones timeline from `JOSH_MILESTONES`

**Step 2: Add to barrel export**

**Step 3: Commit**

```bash
git add apps/landing/components/sections/proof/shared/
git commit -m "feat(proof): add ClientStoryViz resolver with per-client visualizations"
```

---

## Phase 2: Refactor cascade-v2 to Use Shared Components

### Task 8: Refactor testimonials-cascade-v2.tsx

**Files:**
- Modify: `apps/landing/components/sections/proof/testimonials-cascade-v2.tsx`

**Step 1: Replace inline implementations with shared imports**

Replace the inline `MetricsRow`, `CardHeader`, `ClickableShot`, `TrellBeforeAfter`, `TrellTimeline`, `TrellStory`, `DanielStory`, `MarkStory`, `ChethaStory`, `FaridStory`, `JoshStory` with imports from `./shared/`.

The main `ClientCard` component should now:
1. Render `<CardHeader>` for the header
2. Render `<ClientStoryViz>` for the per-client body
3. Render `<MetricsRow>` for the stats
4. Keep the card chrome (border, glass background, animation wrapper)

The file should shrink from ~1200 lines to ~300-400 lines.

**Step 2: Visual verification**

Navigate to `http://localhost:3001`, set proof variant to `results` in DevNav, scroll through all 6 clients. Every card should look identical to before the refactor.

**Step 3: Commit**

```bash
git add apps/landing/components/sections/proof/testimonials-cascade-v2.tsx
git commit -m "refactor(proof): cascade-v2 now uses shared proof components"
```

---

## Phase 3: Upgrade testimonials-phones

### Task 9: Upgrade phones modal with full client story

**Files:**
- Modify: `apps/landing/components/sections/proof/testimonials-phones.tsx`

**Step 1: Upgrade the ClientModal**

Replace the current basic modal (profile + before/after + metrics grid + image gallery) with a richer layout:

```
CardHeader (avatar, name, socials, quote)
↓
ClientStoryViz (per-client data visualization — timeline, ledger, scatter, etc.)
↓
MetricsRow (count-up stat pills)
↓
ClickableShot gallery strip (if images exist)
```

Import from `./shared/`:
```tsx
import { CardHeader, MetricsRow, ClientStoryViz } from "./shared";
import { GalleryLightbox } from "./gallery-lightbox";
```

Keep the existing phone-frame PhoneCard layout and alternating L/R cascade unchanged. Only the modal content changes.

**Step 2: Add aggregate stats bar**

After the phone cards cascade, add an aggregate stats section using `AGGREGATE_STATS` from `@/lib/testimonials`:

```tsx
import { AGGREGATE_STATS } from "@/lib/testimonials";
// ... at bottom of section:
<div className="mt-24 px-6">
  <MetricsRow metrics={AGGREGATE_STATS.map(s => ({ label: s.label, value: s.value }))} />
</div>
```

**Step 3: Add scroll parallax to phone frames**

Wrap each `PhoneCard` in a `motion.div` with `useScroll` + `useTransform` for a subtle scale effect:
- Cards scale from 0.95 → 1.0 as they enter the viewport
- Slight Y parallax offset

**Step 4: Visual verification**

Switch proof variant to `testimonials-phones`. Tap each phone card — modal should show full client story with timeline/ledger/grid data viz. Scroll down to see aggregate stats.

**Step 5: Commit**

```bash
git add apps/landing/components/sections/proof/testimonials-phones.tsx
git commit -m "feat(proof): upgrade phones modal with full client story + aggregate stats"
```

---

## Phase 4: Upgrade testimonials-editorial

### Task 10: Upgrade editorial ClientBlock with inline story viz

**Files:**
- Modify: `apps/landing/components/sections/proof/testimonials-editorial.tsx`

**Step 1: Enhance ClientBlock**

After the existing quote and featured image, add:

```tsx
import { MetricsRow, ClientStoryViz } from "./shared";
import { GalleryLightbox } from "./gallery-lightbox";

// Inside ClientBlock, after the featured image section:
{/* Client-specific data visualization */}
<motion.div variants={fadeInUp} className="mb-8">
  <ClientStoryViz client={client} onOpen={openLightbox} />
</motion.div>

{/* Metrics row with count-up */}
<motion.div variants={fadeInUp}>
  <MetricsRow metrics={client.story.metrics} />
</motion.div>
```

**Step 2: Wire up Counter in Summary**

In the `Summary` component, replace static text stats with `<Counter>` components using `AGGREGATE_STATS` numeric values:

```tsx
import { Counter } from "@/components/counter";
import { AGGREGATE_STATS } from "@/lib/testimonials";

// In Summary, replace the static <p> tags:
{AGGREGATE_STATS.map((stat) => (
  <div key={stat.label} className="text-center">
    <Counter
      target={stat.numericValue}
      prefix={stat.prefix || ""}
      suffix={stat.suffix}
      decimals={stat.decimals}
      duration={2}
      className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight"
    />
    <p className="font-data text-[10px] tracking-[0.15em] text-[var(--text-tertiary)] uppercase mt-2">
      {stat.label}
    </p>
  </div>
))}
```

**Step 3: Visual verification**

Switch proof variant to `testimonials-editorial`. Each client block should show their inline data viz below the quote. Aggregate stats at bottom should count up on scroll.

**Step 4: Commit**

```bash
git add apps/landing/components/sections/proof/testimonials-editorial.tsx
git commit -m "feat(proof): upgrade editorial with inline story viz + count-up stats"
```

---

## Phase 5: Site-Wide Visual Polish

### Task 11: Polish Engage section

**Files:**
- Modify: `apps/landing/components/sections/engage/how-we-engage.tsx`

**Step 1: Add numbered step indicators and glass cards**

Replace the bare `ENGAGEMENT_POINTS` render with numbered glass cards:

```tsx
{ENGAGEMENT_POINTS.map((point, i) => (
  <motion.div key={point.title} variants={fadeInUp} className="relative">
    {/* Connecting line (except last) */}
    {i < ENGAGEMENT_POINTS.length - 1 && (
      <div className="absolute left-5 top-14 bottom-0 w-px bg-gradient-to-b from-red/30 to-transparent" />
    )}

    <div className="glass-card-hover p-6 sm:p-8 flex gap-6">
      {/* Step number pill */}
      <div className="w-10 h-10 rounded-full glass-2 flex items-center justify-center flex-shrink-0">
        <span className="font-data text-sm font-bold text-red">
          {String(i + 1).padStart(2, "0")}
        </span>
      </div>

      <div>
        <h3 className="text-xl sm:text-2xl font-display font-semibold text-white mb-3">
          {point.title}
        </h3>
        <p className="text-base text-[var(--text-secondary)] font-body leading-relaxed max-w-2xl">
          {point.description}
        </p>
      </div>
    </div>
  </motion.div>
))}
```

**Step 2: Visual verification**

Scroll to Engage section. Should show numbered pills + glass cards + red connecting line.

**Step 3: Commit**

```bash
git add apps/landing/components/sections/engage/how-we-engage.tsx
git commit -m "feat(engage): add numbered glass-card steps with red connecting line"
```

---

### Task 12: Polish Philosophy section

**Files:**
- Modify: `apps/landing/components/sections/philosophy/philosophy.tsx`

**Step 1: Progressive text scaling + glow**

Change the three cascade lines to progressively increase in size, and add a breathing glow behind "We don't rent.":

```tsx
{/* Core cascade — progressive sizing */}
<motion.p
  variants={typewriterLine}
  className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-[var(--text-tertiary)] tracking-tight"
>
  Money follows leverage.
</motion.p>
<motion.p
  variants={typewriterLine}
  className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-[var(--text-secondary)] tracking-tight"
>
  Leverage follows attention.
</motion.p>
<motion.p
  variants={typewriterLine}
  className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white tracking-tight"
>
  Attention follows distribution.
</motion.p>

{/* ... bridge ... */}

{/* Resolution with breathing glow */}
<motion.div variants={typewriterLine} className="relative inline-block">
  <div className="absolute inset-0 -inset-x-8 -inset-y-4 rounded-2xl bg-red/10 blur-2xl animate-breathe pointer-events-none" />
  <p className="relative text-xl sm:text-2xl md:text-3xl font-display font-semibold text-white">
    We don&apos;t rent.
  </p>
</motion.div>
```

**Step 2: Commit**

```bash
git add apps/landing/components/sections/philosophy/philosophy.tsx
git commit -m "feat(philosophy): progressive text scaling + breathing glow on resolution"
```

---

### Task 13: Polish Who-For section

**Files:**
- Modify: `apps/landing/components/sections/who-for/who-is-for.tsx`

**Step 1: Add icon badges**

Import `Check` and `X` from lucide-react. Replace the dot/dash indicators:

For the "This is for" list:
```tsx
<div className="w-6 h-6 rounded-full bg-red/15 border border-red/25 flex items-center justify-center flex-shrink-0">
  <Check className="w-3.5 h-3.5 text-red" />
</div>
```

For the "This is not for" list:
```tsx
<div className="w-6 h-6 rounded-full bg-white/[0.03] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
  <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
</div>
```

**Step 2: Commit**

```bash
git add apps/landing/components/sections/who-for/who-is-for.tsx
git commit -m "feat(who-for): add checkmark/X icon badges to qualifier lists"
```

---

### Task 14: Polish CTA section

**Files:**
- Modify: `apps/landing/components/sections/cta/final-cta.tsx`

**Step 1: Add pulsing glow ring on button**

The CTA already has a `glowPulse` animation on a blur div. Enhance it with a concentric ring:

```tsx
{/* Pulsing ring */}
<motion.div
  animate={{
    scale: [1, 1.15, 1],
    opacity: [0.3, 0, 0.3],
  }}
  transition={{
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  }}
  className="absolute inset-0 rounded-lg border-2 border-red/30 pointer-events-none"
/>
```

Add this inside the `motion.div` wrapper (the one with `className="relative mb-10"`), alongside the existing blur glow div.

**Step 2: Add fade-in animation on lead-in text**

The lead-in paragraphs already use `fadeInUp` variant. Just ensure the first paragraph has a slight blur reveal instead:

```tsx
import { blurReveal } from "@letmescale/ui";

// Replace fadeInUp on lead-in with blurReveal:
<motion.p variants={blurReveal} className="...">
  If you&apos;re already making money
</motion.p>
<motion.p variants={blurReveal} className="...">
  and you want more control over how opportunity flows toward you —
</motion.p>
```

**Step 3: Commit**

```bash
git add apps/landing/components/sections/cta/final-cta.tsx
git commit -m "feat(cta): add pulsing glow ring + blur reveal on lead-in"
```

---

## Phase 6: Cross-Cutting Audit

### Task 15: Final audit and visual verification

**Step 1: Audit section-bg usage**

Check every section component uses `section-bg` class. Fix any that use hardcoded backgrounds or miss the class.

Run: `grep -rn "className.*section-bg" apps/landing/components/sections/ | wc -l`
Expected: One per section variant (should be ~15+)

**Step 2: Audit font token usage**

Check for raw `font-sans`, `font-mono`, or bare font families — should all be `font-display`, `font-body`, or `font-data`.

Run: `grep -rn "font-sans\|font-mono\|font-serif" apps/landing/components/sections/ --include="*.tsx"`
Expected: 0 matches

**Step 3: Audit raw color usage**

Check for hardcoded hex colors that should be tokens.

Run: `grep -rn "#991B1B\|#0A0A0A\|#111111" apps/landing/components/sections/ --include="*.tsx" | grep -v _archive`

Replace any found with `text-red`, `bg-surface-1`, `bg-surface-2` etc.

**Step 4: Full visual walkthrough**

Using Playwright MCP:
1. Navigate to `http://localhost:3001`
2. Screenshot hero, disqualify, system, why-works
3. Switch proof to `results` — screenshot and scroll through all 6 clients
4. Switch proof to `testimonials-phones` — screenshot, tap a card, screenshot modal
5. Switch proof to `testimonials-editorial` — screenshot, verify inline story viz
6. Screenshot engage, who-for, philosophy, CTA

Verify:
- All variants show per-client data viz (timelines, ledgers, grids)
- Count-up counters animate on scroll
- Glass cards render correctly
- Philosophy has progressive text sizing
- Engage has numbered steps
- CTA has pulsing glow

**Step 5: Commit all audit fixes**

```bash
git add -A
git commit -m "chore: cross-cutting audit — token consistency, section-bg, font tokens"
```

---

## Summary

| Phase | Tasks | Files Created | Files Modified |
|-------|-------|--------------|----------------|
| 1. Shared Components | 1-7 | 8 new files in `proof/shared/` | 0 |
| 2. Refactor Cascade | 8 | 0 | `testimonials-cascade-v2.tsx` |
| 3. Upgrade Phones | 9 | 0 | `testimonials-phones.tsx` |
| 4. Upgrade Editorial | 10 | 0 | `testimonials-editorial.tsx` |
| 5. Site Polish | 11-14 | 0 | `how-we-engage.tsx`, `philosophy.tsx`, `who-is-for.tsx`, `final-cta.tsx` |
| 6. Audit | 15 | 0 | Various (token fixes) |

**Total: 15 tasks, 8 new files, ~8 modified files**

#letmescale #plans
