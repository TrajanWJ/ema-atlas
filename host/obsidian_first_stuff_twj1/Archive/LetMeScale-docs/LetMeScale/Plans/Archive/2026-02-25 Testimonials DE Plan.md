> See also: [[LetMeScale]]

# Testimonials D & E Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build two testimonial section variants — "Evidence Wall" (D) and "Transformation Timeline" (E) — and wire them into the DevNav system.

**Architecture:** Both variants are standalone `"use client"` components in `apps/landing/components/sections/`. They import `CASE_STUDIES` from `@/lib/testimonials` and use Framer Motion for scroll-driven animations. Font infrastructure (Playfair Display, Outfit, IBM Plex Mono) is added to the root layout and globals.css. The page.tsx variant map gets two new entries.

**Tech Stack:** Next.js 15, React 19, Framer Motion 11, Tailwind CSS 4, `@letmescale/ui` (animation presets, cn utility), `next/font/google`

---

### Task 1: Add Fonts (Playfair Display, Outfit, IBM Plex Mono)

**Files:**
- Modify: `apps/landing/app/layout.tsx`
- Modify: `apps/landing/app/globals.css`

**Step 1: Add font imports to layout.tsx**

Replace the current font setup with all four fonts:

```tsx
import { Inter, Playfair_Display, Outfit, IBM_Plex_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ibm-mono",
});
```

Update the `<html>` tag to include all font variables:

```tsx
<html lang="en" className={`${inter.variable} ${playfair.variable} ${outfit.variable} ${ibmPlexMono.variable}`}>
```

**Step 2: Register font families in globals.css**

Add these font-family definitions inside the existing `@theme` block:

```css
@theme {
  /* ... existing tokens ... */
  --font-serif: "Playfair Display", ui-serif, Georgia, serif;
  --font-body: "Outfit", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
```

This makes `font-serif`, `font-body`, and `font-mono` available as Tailwind classes.

**Step 3: Verify the dev server compiles without errors**

Run: Check browser at `http://localhost:3001` — page should load, existing sections unchanged.

**Step 4: Commit**

```bash
git add apps/landing/app/layout.tsx apps/landing/app/globals.css
git commit -m "feat: add Playfair Display, Outfit, IBM Plex Mono fonts"
```

---

### Task 2: Build Variant D — "The Evidence Wall"

**Files:**
- Create: `apps/landing/components/sections/testimonials-d.tsx`

**Reference data:** `apps/landing/lib/testimonials.ts` — the `CASE_STUDIES` array and `CaseStudy` type.

**Reference patterns:**
- Animation presets from `@letmescale/ui`: `fadeInUp`, `staggerContainer`, `staggerItem`, `glowPulse`, `EASE`
- Counter pattern from `apps/landing/components/counter.tsx`: `useSpring` + `useTransform`
- Section pattern from `apps/landing/components/sections/results.tsx`: `useInView`, section padding, overline style

**Step 1: Create the component file with all sub-components**

Create `apps/landing/components/sections/testimonials-d.tsx` with the full implementation. The file structure:

```tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useSpring, useTransform, useScroll } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem, glowPulse, EASE } from "@letmescale/ui";
import Image from "next/image";
import { CASE_STUDIES, type CaseStudy } from "@/lib/testimonials";
import { DollarSign, Eye } from "lucide-react";
```

**Sub-components to implement (all in same file):**

#### A. `RedactedEvidence` — placeholder for clients with no images

```tsx
function RedactedEvidence() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-xl bg-white/[0.01] border border-white/[0.04] overflow-hidden">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/10">
          Classified
        </span>
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/[0.06]">
          Evidence Pending
        </span>
      </div>
    </div>
  );
}
```

#### B. `EvidenceScreenshot` — tilted screenshot with glass border

```tsx
function EvidenceScreenshot({ src, alt, index }: { src: string; alt: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  // Deterministic rotation from index: range -3 to 3 degrees
  const rotation = ((index * 7 + 3) % 7) - 3;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASE as unknown as number[] }}
      className="relative w-32 md:w-40 aspect-[3/4] rounded-lg overflow-hidden border border-white/[0.08] shadow-xl shadow-black/40 shrink-0"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="160px" />
    </motion.div>
  );
}
```

#### C. `BeforeAfterGauge` — horizontal bar visualization for Trell & Mark Shapiro

This extracts numeric values from the before/after StoryMetric data and renders a bar.

```tsx
function BeforeAfterGauge({ before, after }: { before: string; after: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="w-full mt-4">
      <div className="flex justify-between mb-1.5">
        <span className="font-mono text-[10px] text-white/30">{before}</span>
        <span className="font-mono text-[10px] text-white/60">{after}</span>
      </div>
      <div className="relative h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/10 to-[#991B1B] rounded-full"
          initial={{ width: "0%" }}
          animate={inView ? { width: "100%" } : undefined}
          transition={{ duration: 1.2, ease: EASE as unknown as number[], delay: 0.3 }}
        />
        {/* Red marker at transition point */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#991B1B]"
          style={{ left: "20%" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.4, delay: 0.8 }}
        />
      </div>
    </div>
  );
}
```

#### D. `CumulativeCounter` — running total that builds as user scrolls

Uses `useSpring` + `useTransform` pattern from `counter.tsx`. This component is positioned sticky within the section.

```tsx
function CumulativeCounter({ revenueCents, views }: { revenueCents: number; views: number }) {
  const revenueSpring = useSpring(0, { duration: 800, bounce: 0 });
  const viewsSpring = useSpring(0, { duration: 800, bounce: 0 });

  const revenueDisplay = useTransform(revenueSpring, (v) => {
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B+`;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M+`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K+`;
    return `$${Math.round(v)}`;
  });
  const viewsDisplay = useTransform(viewsSpring, (v) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return `${Math.round(v)}`;
  });

  useEffect(() => {
    revenueSpring.set(revenueCents);
  }, [revenueCents, revenueSpring]);

  useEffect(() => {
    viewsSpring.set(views);
  }, [views, viewsSpring]);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-xl px-4 py-3 flex gap-6 items-center">
      <div>
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/20 block">Total Revenue</span>
        <motion.span className="font-serif text-lg font-bold text-white tabular-nums">
          {revenueDisplay}
        </motion.span>
      </div>
      <div className="w-px h-8 bg-white/[0.06]" />
      <div>
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/20 block">Total Views</span>
        <motion.span className="font-serif text-lg font-bold text-white/60 tabular-nums">
          {viewsDisplay}
        </motion.span>
      </div>
    </div>
  );
}
```

#### E. `MetricPin` — floating metric callout with red dot

```tsx
function MetricPin({ label, value, isRevenue }: { label: string; value: string; isRevenue: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-[#991B1B] shrink-0" style={isRevenue ? { boxShadow: "0 0 8px rgba(153,27,27,0.4)" } : undefined} />
      <div>
        <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-white/25 block">{label}</span>
        <span className={`font-serif text-sm font-bold tabular-nums ${isRevenue ? "text-white" : "text-white/60"}`}>{value}</span>
      </div>
    </div>
  );
}
```

#### F. `CaseFile` — individual client evidence panel

```tsx
function CaseFile({ study, index, onVisible }: { study: CaseStudy; index: number; onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const hasImages = study.images.length > 0;
  const hasBefore = study.story.before && study.story.after;
  const isRevenue = study.category === "revenue";
  const caseNum = String(index + 1).padStart(2, "0");

  useEffect(() => {
    if (inView) onVisible();
  }, [inView, onVisible]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: EASE as unknown as number[] }}
      className="relative bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 md:p-8 overflow-hidden hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300 group"
    >
      {/* Top inner glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Case number label */}
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/[0.15] absolute top-4 right-4 md:top-6 md:right-6">
        Case {caseNum} // {study.name.toUpperCase()}
      </span>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          {study.profile.profileImage && (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/[0.08] shrink-0">
              <Image src={study.profile.profileImage} alt={study.name} width={40} height={40} className="object-cover" />
            </div>
          )}
          <div>
            <h3 className="font-body text-lg font-semibold text-white">{study.name}</h3>
            <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/30">{study.subtitle}</span>
          </div>
        </div>

        {/* Category badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${
          isRevenue
            ? "bg-red-900/10 text-red-400/80 border border-red-900/20"
            : "bg-white/[0.06] text-white/60 border border-white/[0.06]"
        }`}>
          {isRevenue ? <DollarSign className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {study.category === "revenue" ? "Revenue" : "Views"}
        </span>
      </div>

      {/* Key metric */}
      <div className="mb-6">
        <div className="relative inline-block">
          {isRevenue && (
            <div className="absolute -inset-4 bg-[radial-gradient(ellipse,rgba(153,27,27,0.12),transparent_70%)] pointer-events-none" />
          )}
          <span className="font-serif text-3xl md:text-4xl font-bold text-white tabular-nums relative">{study.stat}</span>
        </div>
        <span className="block font-mono text-[10px] tracking-[0.15em] uppercase text-white/30 mt-1">{study.statLabel}</span>
      </div>

      {/* Headline */}
      <p className="font-body text-sm text-white/40 leading-relaxed mb-6">{study.headline}</p>

      {/* Story metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {study.story.metrics.map((m) => (
          <MetricPin key={m.label} label={m.label} value={m.value} isRevenue={isRevenue} />
        ))}
      </div>

      {/* Before/After gauge */}
      {hasBefore && study.story.before && study.story.after && (
        <BeforeAfterGauge
          before={study.story.before[0].value}
          after={study.story.after[0].value}
        />
      )}

      {/* Evidence screenshots or redacted */}
      <div className="mt-6">
        {hasImages ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {study.images.slice(0, 4).map((img, i) => (
              <EvidenceScreenshot key={img.src} src={img.src} alt={img.alt} index={i} />
            ))}
          </div>
        ) : (
          <RedactedEvidence />
        )}
      </div>
    </motion.div>
  );
}
```

#### G. Main `TestimonialsD` export

The main component arranges case files in a spatial layout. Revenue clients (Trell, Mark Shapiro, Farid, Josh Snow) are prioritized — placed first and larger. Views clients (Daniel, Chetha) support.

Client order: Trell (0), Mark Shapiro (2), Farid (4), Josh Snow (5), Daniel (1), Chetha (3) — revenue first.

```tsx
// Revenue-first ordering
const EVIDENCE_ORDER = [0, 2, 4, 5, 1, 3]; // indices into CASE_STUDIES

// Numeric values for cumulative counter
const CUMULATIVE_VALUES: { revenue: number; views: number }[] = [
  { revenue: 83212, views: 0 },         // Trell
  { revenue: 83212 + 90300, views: 0 },  // + Mark Shapiro
  { revenue: 83212 + 90300 + 700000, views: 0 },  // + Farid
  { revenue: 83212 + 90300 + 700000 + 1_000_000_000, views: 0 },  // + Josh Snow
  { revenue: 83212 + 90300 + 700000 + 1_000_000_000, views: 14_200_000 },  // + Daniel
  { revenue: 83212 + 90300 + 700000 + 1_000_000_000, views: 14_200_000 + 6_500_000 },  // + Chetha
];

export function TestimonialsD() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(headerRef, { once: true, margin: "-100px" });
  const [visibleCount, setVisibleCount] = useState(0);

  const cumulative = CUMULATIVE_VALUES[Math.min(visibleCount, CUMULATIVE_VALUES.length) - 1] || { revenue: 0, views: 0 };

  const handleCaseVisible = useCallback((idx: number) => {
    setVisibleCount((prev) => Math.max(prev, idx + 1));
  }, []);

  const orderedStudies = EVIDENCE_ORDER.map((i) => CASE_STUDIES[i]);

  return (
    <section ref={sectionRef} className="relative py-32 md:py-40 bg-black overflow-hidden">
      {/* Faint grid background */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          ref={headerRef}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="mb-20"
        >
          <motion.span variants={fadeInUp} className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/20 block mb-4">
            // Evidence
          </motion.span>
          <motion.h2 variants={fadeInUp} className="font-serif text-3xl md:text-5xl font-bold text-white tracking-tight">
            The Case Files<span className="text-[#991B1B]">.</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="font-body text-base text-white/40 mt-4 max-w-xl font-light">
            Six operators. Exposed metrics. Exposed timelines. No NDAs needed.
          </motion.p>
        </motion.div>

        {/* Cumulative counter — sticky within section */}
        <div className="sticky top-4 z-10 flex justify-end mb-8 pointer-events-none">
          <div className="pointer-events-auto">
            <CumulativeCounter revenueCents={cumulative.revenue} views={cumulative.views} />
          </div>
        </div>

        {/* Case files grid — spatial layout */}
        {/* Desktop: 2-col staggered. Revenue cases (first 4) are larger. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {orderedStudies.map((study, i) => (
            <div
              key={study.id}
              className={`${
                i < 4 ? "" : "md:col-span-1"
              } ${i % 2 === 1 ? "md:mt-12" : ""}`}
            >
              <CaseFile study={study} index={i} onVisible={() => handleCaseVisible(i)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Important notes for implementation:**
- Import `useCallback` in the top-level imports
- The `EVIDENCE_ORDER` and `CUMULATIVE_VALUES` arrays are defined outside the component (module-level constants)
- `handleCaseVisible` uses `useCallback` with stable reference
- `visibleCount` drives the cumulative counter — each CaseFile calls `onVisible` once when it enters view
- The staggered `md:mt-12` on odd-indexed items creates the spatial offset effect

**Step 2: Verify the component renders**

Navigate to `http://localhost:3001` and switch to Testimonials "D" in the DevNav (after Task 3 wires it up). Check:
- All 6 case files render with correct data
- Revenue cases show red glow on metrics
- Farid and Josh Snow show "CLASSIFIED // EVIDENCE PENDING" redacted panels
- Trell and Mark Shapiro show the BeforeAfterGauge
- Cumulative counter updates as you scroll
- Evidence screenshots are slightly rotated

**Step 3: Commit**

```bash
git add apps/landing/components/sections/testimonials-d.tsx
git commit -m "feat: add Testimonials D — Evidence Wall section"
```

---

### Task 3: Build Variant E — "The Transformation Timeline"

**Files:**
- Create: `apps/landing/components/sections/testimonials-e.tsx`

**Step 1: Create the component file with all sub-components**

```tsx
"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { fadeInUp, staggerContainer, glowPulse, EASE } from "@letmescale/ui";
import { CASE_STUDIES, type CaseStudy } from "@/lib/testimonials";
import { DollarSign, Eye } from "lucide-react";
```

**Client order for narrative arc (indices into CASE_STUDIES):**

```tsx
const TIMELINE_ORDER = [0, 1, 3, 2, 4, 5]; // Trell, Daniel, Chetha, Mark Shapiro, Farid, Josh Snow

const CHAPTER_LABELS: Record<number, string> = {
  0: "// DAY 0 \u2014 SYSTEM ACTIVATED",
  1: "// FIRST PROOF OF CONCEPT",
  2: "// REACH UNLOCKED",
  3: "// PATTERN CONFIRMED",
  4: "// COMPOUNDING IN EFFECT",
  5: "// OPERATIONAL INEVITABILITY", // after last entry (used in terminal)
};

const ARC_LABELS = ["THE SPARK", "THE REACH", "THE DISTRIBUTION", "THE TRANSFORMATION", "THE ACCUMULATION", "THE SCALE"];
```

#### A. `ChapterMarker` — floating narrative text on timeline

```tsx
function ChapterMarker({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : undefined}
      transition={{ duration: 0.8, ease: EASE as unknown as number[] }}
      className="flex justify-center py-8 md:py-12"
    >
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/20">
        {text}
      </span>
    </motion.div>
  );
}
```

#### B. `TimelineNode` — red dot on the spine with glow animation

```tsx
function TimelineNode() {
  return (
    <motion.div
      animate={glowPulse}
      className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#991B1B] z-10 md:block hidden"
      style={{ boxShadow: "0 0 12px rgba(153,27,27,0.3)" }}
    />
  );
}

function TimelineNodeMobile() {
  return (
    <motion.div
      animate={glowPulse}
      className="absolute left-4 -translate-x-1/2 w-2 h-2 rounded-full bg-[#991B1B] z-10 md:hidden block"
      style={{ boxShadow: "0 0 12px rgba(153,27,27,0.3)" }}
    />
  );
}
```

#### C. `TimelineEntry` — card + connector + node for one client

```tsx
function TimelineEntry({ study, index, arcLabel }: { study: CaseStudy; index: number; arcLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isLeft = index % 2 === 0;
  const isRevenue = study.category === "revenue";

  return (
    <div ref={ref} className="relative">
      {/* Desktop layout: alternating */}
      <div className="hidden md:grid md:grid-cols-[1fr_40px_1fr] items-center gap-0">
        {/* Left card or spacer */}
        {isLeft ? (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE as unknown as number[] }}
          >
            <TimelineCard study={study} arcLabel={arcLabel} isRevenue={isRevenue} />
          </motion.div>
        ) : (
          <div />
        )}

        {/* Center: node + connectors */}
        <div className="relative flex items-center justify-center">
          <TimelineNode />
          {/* Horizontal connector */}
          <div className={`absolute top-1/2 -translate-y-1/2 h-px bg-white/[0.06] ${isLeft ? "right-full w-4" : "left-full w-4"}`}>
            <div className={`absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#991B1B] ${isLeft ? "left-0" : "right-0"}`} />
          </div>
        </div>

        {/* Right card or spacer */}
        {!isLeft ? (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE as unknown as number[] }}
          >
            <TimelineCard study={study} arcLabel={arcLabel} isRevenue={isRevenue} />
          </motion.div>
        ) : (
          <div />
        )}
      </div>

      {/* Mobile layout: single column, spine on left */}
      <div className="md:hidden relative pl-10">
        <TimelineNodeMobile />
        {/* Horizontal connector */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-px bg-white/[0.06]">
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-1 rounded-full bg-[#991B1B]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7, ease: EASE as unknown as number[] }}
        >
          <TimelineCard study={study} arcLabel={arcLabel} isRevenue={isRevenue} />
        </motion.div>
      </div>
    </div>
  );
}
```

#### D. `TimelineCard` — the glass card content

```tsx
function TimelineCard({ study, arcLabel, isRevenue }: { study: CaseStudy; arcLabel: string; isRevenue: boolean }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-5 md:p-6 hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300 hover:-translate-y-0.5 group">
      {/* Inner glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent rounded-t-2xl" />

      {/* Arc label */}
      <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-white/15 block mb-3">
        {arcLabel}
      </span>

      {/* Client name */}
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/20 block mb-2">
        {study.name}
      </span>

      {/* Key metric */}
      <div className="relative inline-block mb-2">
        {isRevenue && (
          <div className="absolute -inset-3 bg-[radial-gradient(ellipse,rgba(153,27,27,0.1),transparent_70%)] pointer-events-none" />
        )}
        <span className="font-serif text-2xl md:text-3xl font-bold text-white tabular-nums relative">
          {study.stat}
        </span>
      </div>

      {/* Context line */}
      <p className="font-body text-sm text-white/40 leading-relaxed mb-3">
        {study.headline}
      </p>

      {/* Category badge */}
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
        isRevenue
          ? "bg-red-900/10 text-red-400/80 border border-red-900/20"
          : "bg-white/[0.06] text-white/60 border border-white/[0.06]"
      }`}>
        {isRevenue ? <DollarSign className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
        {study.category === "revenue" ? "Revenue" : "Views"}
      </span>
    </div>
  );
}
```

#### E. `TerminalSummary` — accent glass panel with combined totals

```tsx
function TerminalSummary() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const totals = [
    { label: "Total Revenue Proven", value: "$1B+", highlight: true },
    { label: "Total Views Proven", value: "20.7M+", highlight: false },
    { label: "Clients", value: "6", highlight: false },
    { label: "Avg. Time to ROI", value: "<90 days", highlight: true },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: EASE as unknown as number[] }}
      className="relative bg-red-950/[0.08] border border-red-900/[0.15] backdrop-blur-xl rounded-2xl p-8 md:p-10 mt-8"
    >
      {/* Top red border accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-900/20 to-transparent" />

      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/20 block mb-6">
        // SYSTEM TOTAL
      </span>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {totals.map((t) => (
          <div key={t.label}>
            <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-white/25 block mb-1">{t.label}</span>
            <span className={`font-serif text-xl md:text-2xl font-bold tabular-nums ${t.highlight ? "text-white" : "text-white/60"}`}>
              {t.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
```

#### F. `TimelineSpine` — the center vertical line with scroll-driven draw

```tsx
function TimelineSpine({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const scaleY = useTransform(scrollYProgress, [0.1, 0.9], [0, 1]);

  return (
    <>
      {/* Desktop: centered spine */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px hidden md:block">
        {/* Static background line (dotted) */}
        <div className="absolute inset-0 border-l border-dashed border-white/[0.04]" />
        {/* Animated fill line with gradient from white to red glow */}
        <motion.div
          className="absolute top-0 left-0 w-full origin-top"
          style={{
            scaleY,
            height: "100%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.08) 40%, rgba(153,27,27,0.15) 100%)",
          }}
        />
      </div>

      {/* Mobile: left-aligned spine */}
      <div className="absolute inset-y-0 left-4 w-px md:hidden">
        <div className="absolute inset-0 border-l border-dashed border-white/[0.04]" />
        <motion.div
          className="absolute top-0 left-0 w-full origin-top"
          style={{
            scaleY,
            height: "100%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.08) 40%, rgba(153,27,27,0.15) 100%)",
          }}
        />
      </div>
    </>
  );
}
```

#### G. Main `TestimonialsE` export

```tsx
export function TestimonialsE() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(headerRef, { once: true, margin: "-100px" });

  const orderedStudies = TIMELINE_ORDER.map((i) => CASE_STUDIES[i]);

  return (
    <section ref={sectionRef} className="relative py-32 md:py-40 bg-black overflow-hidden">
      <div className="relative max-w-5xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          ref={headerRef}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mb-20"
        >
          <motion.span variants={fadeInUp} className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/20 block mb-4">
            // Timeline
          </motion.span>
          <motion.h2 variants={fadeInUp} className="font-serif text-3xl md:text-5xl font-bold text-white tracking-tight">
            The Compounding Record<span className="text-[#991B1B]">.</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="font-body text-base text-white/40 mt-4 max-w-lg mx-auto font-light">
            Every data point is a chapter. Every chapter compounds.
          </motion.p>
        </motion.div>

        {/* Timeline body */}
        <div className="relative">
          {/* The spine */}
          <TimelineSpine sectionRef={sectionRef} />

          {/* Opening chapter marker */}
          <ChapterMarker text={CHAPTER_LABELS[0]} />

          {/* Timeline entries with chapter markers between them */}
          {orderedStudies.map((study, i) => (
            <div key={study.id}>
              <TimelineEntry study={study} index={i} arcLabel={ARC_LABELS[i]} />
              {/* Chapter marker after each entry except the last */}
              {i < orderedStudies.length - 1 && CHAPTER_LABELS[i + 1] && (
                <ChapterMarker text={CHAPTER_LABELS[i + 1]} />
              )}
            </div>
          ))}

          {/* Terminal chapter marker */}
          <ChapterMarker text={CHAPTER_LABELS[5]} />
        </div>

        {/* Terminal summary */}
        <TerminalSummary />
      </div>
    </section>
  );
}
```

**Step 2: Verify the component renders**

Navigate to `http://localhost:3001` and switch to Testimonials "E" in the DevNav. Check:
- All 6 entries appear in the correct narrative arc order
- Timeline spine draws downward as you scroll
- Cards alternate left/right on desktop
- Timeline collapses to single column with left spine on mobile
- Chapter markers appear between entries
- Terminal summary shows at the bottom with accent glass tier
- Red glow pulses on timeline nodes

**Step 3: Commit**

```bash
git add apps/landing/components/sections/testimonials-e.tsx
git commit -m "feat: add Testimonials E — Transformation Timeline section"
```

---

### Task 4: Wire Variants D & E into DevNav + page.tsx

**Files:**
- Modify: `apps/landing/app/(site)/page.tsx`

**Step 1: Add imports and register in the testimonials map**

Add two new imports after the existing testimonials imports:

```tsx
// Testimonials (add after existing imports)
import { TestimonialsD } from "@/components/sections/testimonials-d";
import { TestimonialsE } from "@/components/sections/testimonials-e";
```

Add to `testimonialsMap`:

```tsx
const testimonialsMap: Record<string, React.FC> = {
  Casc: TestimonialsCascade,
  Phone: TestimonialsPhones,
  Prem: PremiumTestimonials,
  Alt: AlternativeTestimonials,
  D: TestimonialsD,
  E: TestimonialsE,
};
```

**Step 2: Verify DevNav shows D and E options**

The DevNav automatically picks up options from `Object.keys(sectionMaps[name])`, so D and E should appear as buttons in the Testimonials row. Toggle between all options and verify each renders.

**Step 3: Commit**

```bash
git add apps/landing/app/\(site\)/page.tsx
git commit -m "feat: wire Testimonials D + E into DevNav system"
```

---

### Task 5: Polish and Verify Quality Gates

**Files:** All three new/modified files from Tasks 1-4.

**Step 1: Design token compliance check**

Visually inspect both variants in the browser:
- [ ] All text uses `rgba(255,255,255,X)` opacity scale — no gray hex values like `#666`
- [ ] Red `#991B1B` only appears as: period in headline, badge accents, glow halos, timeline nodes, gauge markers
- [ ] No red backgrounds except the terminal summary's accent glass tier (Variant E)
- [ ] Glass tiers correctly applied (ambient bg, surface cards, elevated hover, accent terminal)
- [ ] Fonts rendering correctly: serif for headlines/metrics, body for descriptions, mono for labels

**Step 2: Data integrity check**

- [ ] All 6 clients render with correct metrics from `testimonials.ts` (not hardcoded)
- [ ] Revenue clients (Trell, Mark Shapiro, Farid, Josh Snow) show red glow on metrics
- [ ] Views clients (Daniel, Chetha) show no glow — secondary evidence
- [ ] Farid and Josh Snow show redacted placeholder instead of screenshots
- [ ] Before/after gauges render for Trell and Mark Shapiro only

**Step 3: Responsive check**

Resize the browser to mobile width (< 768px):
- [ ] Variant D: stacks to single column, no overlaps
- [ ] Variant E: timeline goes single-column, spine moves to left edge, cards align left
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal overflow

**Step 4: Animation check**

- [ ] Scroll down — elements animate in on viewport entry (`whileInView`)
- [ ] Variant D: cumulative counter builds as case files enter view
- [ ] Variant E: timeline spine draws downward as you scroll
- [ ] Variant E: red dots pulse with glow
- [ ] Card hover: subtle lift + border-color transition
- [ ] No janky animations (only transform + opacity)

**Step 5: Fix any issues found, then commit**

```bash
git add -A
git commit -m "fix: polish Testimonials D + E — token compliance and responsive fixes"
```

#letmescale #plans #archive
