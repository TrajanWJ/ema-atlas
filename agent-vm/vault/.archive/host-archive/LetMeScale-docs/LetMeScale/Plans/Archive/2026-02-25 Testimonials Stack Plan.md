> See also: [[LetMeScale]]

# Testimonials Stack Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace R:Casc proof section with a cinematic stacking-card testimonial experience where each client story is a sticky card that collapses into a thin bar as the next slides over it, building weakest→strongest to a climax.

**Architecture:** 6 client cards in ~150vh scroll containers with `position: sticky`. Framer Motion `useScroll`/`useTransform` drives collapse animations. A progress sidebar with 6 dots provides navigation. Intro cinematic type and aggregate summary card bookend the section. Parallax phone frames, count-up metrics, red ember particles, and a before/after drag slider provide interactivity.

**Tech Stack:** React 19, Next.js 15, Framer Motion 12, Tailwind CSS, existing Counter component, existing `@letmescale/ui` animation presets. Canvas API for particles. CSS noise for grain.

---

## Client Ordering (weakest → strongest)

Based on testimonial research, order for narrative climax:

1. **Daniel** — 14.2M views (views only, no revenue, no handle — weakest proof)
2. **Chetha** — 21.5M views, 57.6M campaign views (internal operator, impressive but not a "client")
3. **Farid** — $700K+ revenue, 1,000+ calls, 14.4M views (strong but gaps in proof)
4. **Trell** — $83K in 6 days, $31K→$187K/mo growth (dramatic arc: prison → empire)
5. **Mark Shapiro** — $748K collected, 1,452 calls, 70%+ show rate (most complete data)
6. **Josh Snow** — $1B+ career sales, 9-figure exits (ultimate credibility — climax)

## Client Story Copy (from research)

Each card needs a headline quote. Sourced from research narratives:

| Client | Headline | Source |
|--------|----------|--------|
| Daniel | "14.2 million people in 90 days. 99.1% of them complete strangers." | Research narrative |
| Chetha | "57.6 million views. $0.40 average CPM. That's the engine." | Campaign data composite |
| Farid | "From a garage shipping boxes to seven figures. Volume plus structure." | Research narrative |
| Trell | "Prison to $187K months. Six days was all it took to prove it." | Research: $83K in 6 days + origin story |
| Mark Shapiro | "Broke at 18. Incarcerated. Homeless. Now $748K collected in six months." | Research: origin + hero metric |
| Josh Snow | "Bootstrapped to $100 million. Then kept going to a billion." | Research: career arc |

---

### Task 1: Scaffold file structure and data layer updates

**Files:**
- Create: `apps/landing/components/sections/testimonials-stack.tsx`
- Create: `apps/landing/components/sections/testimonials-stack/card.tsx`
- Create: `apps/landing/components/sections/testimonials-stack/collapsed-bar.tsx`
- Create: `apps/landing/components/sections/testimonials-stack/progress-sidebar.tsx`
- Create: `apps/landing/components/sections/testimonials-stack/phone-frame.tsx`
- Create: `apps/landing/components/sections/testimonials-stack/before-after-slider.tsx`
- Create: `apps/landing/components/sections/testimonials-stack/particles.tsx`
- Create: `apps/landing/components/sections/testimonials-stack/intro.tsx`
- Create: `apps/landing/components/sections/testimonials-stack/summary-card.tsx`
- Modify: `apps/landing/lib/testimonials.ts` — add ordered constant, aggregate stats, headline quotes

**Step 1: Create directory**

```bash
mkdir -p apps/landing/components/sections/testimonials-stack
```

**Step 2: Update testimonials data**

In `apps/landing/lib/testimonials.ts`, add after the existing `CASE_STUDIES` array:

```typescript
/** Headline quotes for the stack testimonial section — sourced from client research */
export const STACK_HEADLINES: Record<string, string> = {
  daniel: "14.2 million people in 90 days. 99.1% of them complete strangers.",
  chetha: "57.6 million views. $0.40 average CPM. That's the engine.",
  farid: "From a garage shipping boxes to seven figures. Volume plus structure.",
  trell: "Prison to $187K months. Six days was all it took to prove it.",
  "mark-shapiro": "Broke at 18. Incarcerated. Homeless. Now $748K collected in six months.",
  "josh-snow": "Bootstrapped to $100 million. Then kept going to a billion.",
};

/** Ordered weakest → strongest for narrative climax */
export const STACK_ORDER = ["daniel", "chetha", "farid", "trell", "mark-shapiro", "josh-snow"] as const;

/** Get case studies in stack order */
export function getStackedStudies(): CaseStudy[] {
  return STACK_ORDER.map((id) => CASE_STUDIES.find((cs) => cs.id === id)!);
}

/** Aggregate stats across all clients */
export const AGGREGATE_STATS = [
  { label: "Combined Revenue", value: "$2.6M+", numericValue: 2.6, prefix: "$", suffix: "M+", decimals: 1 },
  { label: "Total Views", value: "100M+", numericValue: 100, suffix: "M+", decimals: 0 },
  { label: "Calls Booked", value: "3,400+", numericValue: 3400, suffix: "+", decimals: 0 },
  { label: "Clients Scaled", value: "6", numericValue: 6, suffix: "", decimals: 0 },
];
```

**Step 3: Create the empty shell `testimonials-stack.tsx`**

```typescript
"use client";

import { useRef } from "react";
import { getStackedStudies, STACK_HEADLINES, AGGREGATE_STATS } from "@/lib/testimonials";

const clients = getStackedStudies();

export function TestimonialsStack() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section ref={sectionRef} id="proof" className="relative bg-[#060608]">
      {/* TODO: Intro, Cards, Summary */}
      <div className="h-screen flex items-center justify-center">
        <span className="text-white/20 font-mono text-sm">TestimonialsStack placeholder</span>
      </div>
    </section>
  );
}
```

**Step 4: Register in page.tsx**

In `apps/landing/app/(site)/page.tsx`:
- Add import: `import { TestimonialsStack } from "@/components/sections/testimonials-stack";`
- Add to `COMPONENTS.proof`: `"Stack": TestimonialsStack,`

**Step 5: Verify it renders**

Open `localhost:3001`, use DevNav to switch proof to "Stack". Should see placeholder text.

**Step 6: Commit**

```bash
git add apps/landing/components/sections/testimonials-stack.tsx \
  apps/landing/components/sections/testimonials-stack/ \
  apps/landing/lib/testimonials.ts \
  "apps/landing/app/(site)/page.tsx"
git commit -m "feat(proof): scaffold testimonials-stack section with data layer"
```

---

### Task 2: Build the cinematic intro

**Files:**
- Create: `apps/landing/components/sections/testimonials-stack/intro.tsx`
- Modify: `apps/landing/components/sections/testimonials-stack.tsx`

**Step 1: Create intro component**

The intro is a ~100vh container. Large serif text scales down from 1.3→0.8 as user scrolls through it, fading out at the bottom. Sets the narrative stage.

```typescript
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function StackIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.3, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div ref={containerRef} className="relative h-screen flex items-center justify-center">
      <motion.div
        style={{ scale, opacity, y }}
        className="text-center px-6 max-w-4xl"
      >
        <span className="font-mono text-xs tracking-[0.2em] text-[#991B1B] block mb-8">
          // PROOF
        </span>
        <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05]">
          These Are Their
          <br />
          Numbers<span className="text-[#991B1B]">.</span>
        </h2>
        <p className="font-body text-white/25 text-base mt-6 max-w-md mx-auto leading-relaxed">
          Six operators. Real dashboards. Exposed metrics.
          Scroll through each story.
        </p>
      </motion.div>
    </div>
  );
}
```

**Step 2: Wire into main component**

Replace placeholder in `testimonials-stack.tsx` with `<StackIntro />` followed by the card area.

**Step 3: Verify** — scroll should scale the intro text down smoothly.

**Step 4: Commit**

```bash
git commit -m "feat(proof): add cinematic intro with scroll-driven scale animation"
```

---

### Task 3: Build the stacking card scroll engine

**Files:**
- Create: `apps/landing/components/sections/testimonials-stack/card.tsx`
- Create: `apps/landing/components/sections/testimonials-stack/collapsed-bar.tsx`
- Modify: `apps/landing/components/sections/testimonials-stack.tsx`

This is the core mechanic. Each card lives in a tall scroll container. The card itself is `position: sticky; top: 0`. As scrollProgress advances, the card compresses and the collapsed bar appears.

**Step 1: Build the card scroll wrapper**

```typescript
"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface StackCardWrapperProps {
  index: number;
  totalCards: number;
  isCollapsed: boolean;
  onCollapse: () => void;
  children: ReactNode;
}

export function StackCardWrapper({
  index,
  totalCards,
  isCollapsed,
  onCollapse,
  children,
}: StackCardWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Card compresses in the last 30% of its scroll container
  const scaleY = useTransform(scrollYProgress, [0.7, 1], [1, 0.05]);
  const opacity = useTransform(scrollYProgress, [0.7, 0.95], [1, 0]);
  const borderRadius = useTransform(scrollYProgress, [0.7, 1], [24, 60]);

  // Track when card should be considered "collapsed"
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v > 0.95 && !isCollapsed) onCollapse();
  });

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: index === totalCards - 1 ? "100vh" : "150vh" }}
    >
      <motion.div
        className="sticky top-0 min-h-screen"
        style={{
          scaleY: isCollapsed ? 0.05 : scaleY,
          opacity: isCollapsed ? 0 : opacity,
          borderRadius,
          transformOrigin: "top center",
          zIndex: totalCards - index,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
```

**Step 2: Build the collapsed bar**

```typescript
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { CaseStudy } from "@/lib/testimonials";
import { EASE } from "@letmescale/ui";

interface CollapsedBarProps {
  client: CaseStudy;
  index: number;
  visible: boolean;
}

export function CollapsedBar({ client, index, visible }: CollapsedBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: EASE as unknown as number[] }}
      className="h-12 bg-white/[0.02] backdrop-blur-md border-b border-white/[0.04] flex items-center px-6 gap-4"
      style={{ zIndex: 100 + index }}
    >
      {/* Avatar thumbnail */}
      <div className="w-7 h-7 rounded-full overflow-hidden border border-white/[0.08] bg-white/[0.04] flex-shrink-0">
        {client.profile.profileImage ? (
          <Image
            src={client.profile.profileImage}
            alt={client.name}
            width={28}
            height={28}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-white/20 text-xs font-bold">
            {client.name.charAt(0)}
          </span>
        )}
      </div>
      {/* Name */}
      <span className="font-mono text-[11px] text-white/40 tracking-wide">
        {client.name}
      </span>
      {/* Key stat */}
      <span className="font-mono text-[11px] text-white/20 ml-auto">
        {client.stat}
      </span>
    </motion.div>
  );
}
```

**Step 3: Wire the scroll engine into the main component**

The main `TestimonialsStack` component manages collapse state. Array of booleans — one per client. When `window.scrollY < sectionTop + 50`, reset all to false.

```typescript
// In testimonials-stack.tsx
const [collapsed, setCollapsed] = useState<boolean[]>(Array(clients.length).fill(false));
const sectionRef = useRef<HTMLDivElement>(null);

// Re-expansion: scroll back to top resets all
useEffect(() => {
  const handleScroll = () => {
    if (!sectionRef.current) return;
    const sectionTop = sectionRef.current.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY < sectionTop + 50) {
      setCollapsed(Array(clients.length).fill(false));
    }
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

const handleCollapse = (index: number) => {
  setCollapsed((prev) => {
    const next = [...prev];
    next[index] = true;
    return next;
  });
};
```

Render: collapsed bars fixed at top, then StackIntro, then 6 StackCardWrappers.

**Step 4: Verify** — cards should pin, compress, and show collapsed bars at top. Scrolling back to section top resets.

**Step 5: Commit**

```bash
git commit -m "feat(proof): implement stacking card scroll engine with collapse/re-expansion"
```

---

### Task 4: Build the card content layout

**Files:**
- Modify: `apps/landing/components/sections/testimonials-stack/card.tsx` — add `CardContent` component

This is the actual visual content inside each sticky card: avatar, name, headline, phone frames, metrics, before/after.

**Step 1: Build CardContent**

Full glassmorphism card. Layout:
- Top: red `border-t-2 border-[#991B1B]`
- Avatar row: photo (glass border), name (Playfair), subtitle (Mono), social icons
- Headline: serif italic quote from `STACK_HEADLINES`
- Phone frames: flexbox row (built in Task 5)
- Metrics: 4-pill row with Counter component (built in Task 6)
- Before/After: conditional (built in Task 7)

```typescript
// Core card structure
<div className="min-h-screen bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden">
  {/* Red top accent */}
  <div className="h-[2px] w-full bg-[#991B1B]" />

  <div className="p-8 sm:p-12 lg:p-16 flex flex-col items-center">
    {/* Avatar */}
    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white/[0.10] bg-white/[0.04] mb-5">
      {/* Image or initial */}
    </div>

    {/* Name + subtitle */}
    <h3 className="font-serif text-4xl md:text-5xl text-white tracking-tight text-center">
      {client.name}
    </h3>
    <p className="font-mono text-xs tracking-[0.2em] text-white/20 uppercase mt-2">
      {client.subtitle}
    </p>

    {/* Social icons — IG, TikTok, website. Icons only, no counts */}
    <div className="flex items-center gap-3 mt-3">
      {/* Lucide icons with white/20 hover:white/50 */}
    </div>

    {/* Headline quote */}
    <p className="font-serif italic text-xl md:text-2xl text-white/50 text-center max-w-xl mt-8 leading-relaxed">
      "{STACK_HEADLINES[client.id]}"
    </p>

    {/* Phone frames slot */}
    <div className="mt-12 w-full">
      <PhoneFrameRow images={client.images} />
    </div>

    {/* Metrics slot */}
    <div className="mt-12 w-full">
      <MetricsRow metrics={client.story.metrics} />
    </div>

    {/* Before/After slot (conditional) */}
    {client.story.before && client.story.after && (
      <div className="mt-8">
        <BeforeAfterRow before={client.story.before} after={client.story.after} />
      </div>
    )}
  </div>
</div>
```

**Step 2: Add first-card cinematic entrance**

For `index === 0` only: wrap in motion.div with initial `rotateX: 8deg, filter: blur(8px), opacity: 0` that animates to `rotateX: 0, filter: blur(0), opacity: 1` on inView. Use `perspective: 1200px` on parent.

**Step 3: Verify** — cards should show full content with glassmorphism styling. First card has 3D tilt entrance.

**Step 4: Commit**

```bash
git commit -m "feat(proof): build card content layout with glassmorphism and cinematic first-card entrance"
```

---

### Task 5: Phone frames with parallax

**Files:**
- Create: `apps/landing/components/sections/testimonials-stack/phone-frame.tsx`

**Step 1: Build PhoneFrameRow**

Flexbox row. 1 image = centered, 2 = side-by-side, 3 = across, 4+ = wrapped grid. Each frame at different parallax rate using `useTransform` on parent scroll.

```typescript
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const PARALLAX_RATES = [0.8, 1.0, 1.2, 0.9, 1.1, 0.85];

interface PhoneFrameRowProps {
  images: { src: string; alt: string }[];
}

export function PhoneFrameRow({ images }: PhoneFrameRowProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
      {images.slice(0, 6).map((img, i) => (
        <PhoneFrame
          key={img.src}
          src={img.src}
          alt={img.alt}
          rate={PARALLAX_RATES[i % PARALLAX_RATES.length]}
        />
      ))}
    </div>
  );
}

function PhoneFrame({ src, alt, rate }: { src: string; alt: string; rate: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [30 * rate, -30 * rate]);

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
      className="group w-[130px] sm:w-[150px] md:w-[170px] flex-shrink-0"
    >
      <div className="bg-[#0A0A0A] border border-white/[0.08] group-hover:border-white/[0.15] rounded-[1.8rem] p-1.5 shadow-xl shadow-black/40 transition-colors duration-300 relative">
        {/* Hover glow */}
        <div className="absolute inset-0 rounded-[1.8rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ boxShadow: "0 8px 40px rgba(255,255,255,0.06)" }}
        />
        <div className="w-full rounded-[1.4rem] overflow-hidden aspect-[9/16] relative">
          <Image src={src} alt={alt} fill className="object-cover" sizes="170px" />
        </div>
      </div>
    </motion.div>
  );
}
```

**Step 2: Disable parallax on mobile** — wrap `useTransform` with a `useMediaQuery` check. If `< 768px`, set `y` to 0.

**Step 3: Verify** — phone frames render dynamically per client's image count, parallax drifts on desktop.

**Step 4: Commit**

```bash
git commit -m "feat(proof): add phone frame row with parallax and hover glow"
```

---

### Task 6: Metrics row with count-up

**Files:**
- Create: `apps/landing/components/sections/testimonials-stack/metrics-row.tsx`

**Step 1: Build MetricsRow**

4 glass pills. Use the existing `Counter` component for values that are numeric. For string-only values, just render static text.

```typescript
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Counter } from "@/components/counter";
import type { StoryMetric } from "@/lib/testimonials";

interface MetricsRowProps {
  metrics: StoryMetric[];
}

/** Try to parse a metric value into numeric parts for count-up */
function parseMetric(value: string): { numeric: number; prefix: string; suffix: string; decimals: number } | null {
  const match = value.match(/^(\$?)([\d,.]+)(\+?[A-Za-z%]*\+?)$/);
  if (!match) return null;
  const num = parseFloat(match[2].replace(/,/g, ""));
  if (isNaN(num)) return null;
  const hasDot = match[2].includes(".");
  return {
    prefix: match[1],
    numeric: num,
    suffix: match[3],
    decimals: hasDot ? match[2].split(".")[1].length : 0,
  };
}

export function MetricsRow({ metrics }: MetricsRowProps) {
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
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-3.5 text-center min-w-[100px]"
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
            <p className="text-white/25 text-[10px] mt-1 font-mono tracking-wider uppercase">
              {m.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
```

**Step 2: Verify** — metrics animate counting up from 0 when each card enters the viewport.

**Step 3: Commit**

```bash
git commit -m "feat(proof): add metrics row with count-up animation"
```

---

### Task 7: Before/After drag slider

**Files:**
- Create: `apps/landing/components/sections/testimonials-stack/before-after-slider.tsx`

**Step 1: Build draggable comparison slider**

Uses a phone-frame container. Left half = before screenshot, right half = after screenshot. A draggable divider in the middle. CSS `clip-path` on the "after" image based on drag position. Touch + mouse support.

```typescript
"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // percentage
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-[200px] sm:w-[240px] rounded-[1.8rem] overflow-hidden aspect-[9/16] cursor-ew-resize select-none border border-white/[0.08] bg-[#0A0A0A]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Before (full) */}
      <Image src={beforeSrc} alt={beforeLabel} fill className="object-cover" sizes="240px" />
      {/* After (clipped) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        <Image src={afterSrc} alt={afterLabel} fill className="object-cover" sizes="240px" />
      </div>
      {/* Divider */}
      <div className="absolute top-0 bottom-0" style={{ left: `${position}%` }}>
        <div className="absolute -translate-x-1/2 w-[2px] h-full bg-[#991B1B]/80" />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#991B1B] border-2 border-white/20 flex items-center justify-center shadow-lg">
          <span className="text-white text-xs font-mono">↔</span>
        </div>
      </div>
      {/* Labels */}
      <span className="absolute top-3 left-3 font-mono text-[9px] text-white/40 tracking-wider uppercase bg-black/40 px-2 py-0.5 rounded-full">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 font-mono text-[9px] text-white/40 tracking-wider uppercase bg-black/40 px-2 py-0.5 rounded-full">
        {afterLabel}
      </span>
    </div>
  );
}
```

**Step 2: Integrate into card** — for clients with `story.before` and `story.after`, replace the first phone frame with a `BeforeAfterSlider` using the first two images.

**Step 3: Verify** — draggable on desktop and touch on mobile.

**Step 4: Commit**

```bash
git commit -m "feat(proof): add draggable before/after comparison slider"
```

---

### Task 8: Progress sidebar

**Files:**
- Create: `apps/landing/components/sections/testimonials-stack/progress-sidebar.tsx`

**Step 1: Build ProgressSidebar**

Fixed left side. 6 dots, `#991B1B`. Active dot changes size. Hover = tooltip. Click = smooth scroll.

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CaseStudy } from "@/lib/testimonials";

interface ProgressSidebarProps {
  clients: CaseStudy[];
  activeIndex: number;
  cardRefs: React.RefObject<(HTMLDivElement | null)[]>;
}

export function ProgressSidebar({ clients, activeIndex, cardRefs }: ProgressSidebarProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const scrollToCard = (index: number) => {
    const refs = cardRefs.current;
    if (!refs || !refs[index]) return;
    refs[index]!.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4">
      {clients.map((client, i) => (
        <div
          key={client.id}
          className="relative"
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <button
            onClick={() => scrollToCard(i)}
            className="relative cursor-pointer"
          >
            <motion.div
              animate={{
                width: activeIndex === i ? 12 : 8,
                height: activeIndex === i ? 12 : 8,
                backgroundColor: activeIndex === i ? "#991B1B" : "rgba(255,255,255,0.15)",
              }}
              transition={{ duration: 0.3 }}
              className="rounded-full"
            />
          </button>

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredIdx === i && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/[0.06] backdrop-blur-md border border-white/[0.10] rounded-lg px-3 py-2 whitespace-nowrap pointer-events-none"
              >
                <p className="font-mono text-[11px] text-white/60">{client.name}</p>
                <p className="font-mono text-[10px] text-white/30">{client.stat}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Track active index** — in main component, use an IntersectionObserver or scroll position to determine which card is currently in view and pass `activeIndex`.

**Step 3: Add mobile version** — bottom-positioned dots, smaller, no tooltips. Show below `lg:` breakpoint.

**Step 4: Verify** — dots highlight as you scroll, tooltips on hover, click scrolls to card.

**Step 5: Commit**

```bash
git commit -m "feat(proof): add progress sidebar with dot navigation and tooltips"
```

---

### Task 9: Red ember particle effect

**Files:**
- Create: `apps/landing/components/sections/testimonials-stack/particles.tsx`

**Step 1: Build canvas-based particle burst**

Each card triggers a 1-second burst of red ember particles from its bottom edge when it pins. ~20 particles, moving upward with slight randomness, fading out.

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";

interface EmberParticlesProps {
  trigger: boolean;
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export function EmberParticles({ trigger, width, height }: EmberParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  const spawn = useCallback(() => {
    const count = window.innerWidth < 768 ? 10 : 20;
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x: Math.random() * width,
        y: height,
        vx: (Math.random() - 0.5) * 2,
        vy: -(2 + Math.random() * 3),
        life: 0,
        maxLife: 40 + Math.random() * 30,
        size: 1.5 + Math.random() * 2,
      });
    }
  }, [width, height]);

  useEffect(() => {
    if (!trigger) return;
    spawn();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.current = particles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.98;
        p.life++;
        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) return false;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(153, 27, 27, ${alpha * 0.8})`;
        ctx.fill();
        return true;
      });
      if (particles.current.length > 0) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [trigger, spawn, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10"
    />
  );
}
```

**Step 2: Trigger per card** — each card tracks when it first becomes "pinned" (scrollProgress crosses ~0.05). Fire the particle burst once.

**Step 3: Reduce particle count on mobile** (already handled with `window.innerWidth` check).

**Step 4: Verify** — red embers float up briefly as each card enters.

**Step 5: Commit**

```bash
git commit -m "feat(proof): add red ember particle burst on card entry"
```

---

### Task 10: Aggregate summary card

**Files:**
- Create: `apps/landing/components/sections/testimonials-stack/summary-card.tsx`

**Step 1: Build the summary**

After the 6th card's scroll container, a final card holds in the viewport. Combined stats with count-up. Subtle CTA.

```typescript
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Counter } from "@/components/counter";
import { AGGREGATE_STATS } from "@/lib/testimonials";
import { EASE } from "@letmescale/ui";

export function SummaryCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 1, ease: EASE as unknown as number[] }}
        className="text-center max-w-3xl"
      >
        {/* Aggregate stats */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12 mb-16">
          {AGGREGATE_STATS.map((stat) => (
            <div key={stat.label}>
              <Counter
                target={stat.numericValue}
                prefix={stat.prefix || ""}
                suffix={stat.suffix}
                decimals={stat.decimals}
                duration={2.5}
                className="text-4xl sm:text-5xl font-mono text-white"
              />
              <p className="font-mono text-[10px] text-white/20 tracking-[0.15em] uppercase mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px w-24 bg-[#991B1B]/30 mx-auto mb-10" />

        {/* CTA */}
        <p className="font-serif text-xl sm:text-2xl text-white/30 leading-relaxed mb-8">
          Ready to be next<span className="text-[#991B1B]">?</span>
        </p>
        <a
          href="/apply"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#991B1B] text-white font-body font-medium text-sm rounded-lg hover:shadow-[0_0_24px_rgba(153,27,27,0.3)] transition-all duration-300"
        >
          See If You Qualify
        </a>
      </motion.div>
    </div>
  );
}
```

**Step 2: Wire into main component** — render after the last card scroll container.

**Step 3: Verify** — summary appears after all 6 cards with count-up aggregate stats.

**Step 4: Commit**

```bash
git commit -m "feat(proof): add aggregate summary card with combined stats and CTA"
```

---

### Task 11: Film grain overlay

**Files:**
- Modify: `apps/landing/components/sections/testimonials-stack.tsx`

**Step 1: Add section-scoped grain**

The site already has a global grain via CSS (`--grain-opacity` in globals.css). For the testimonials section, add a local SVG noise overlay that uses the same technique but is scoped to this section:

```typescript
{/* Film grain overlay — A24 editorial feel */}
<div
  className="absolute inset-0 pointer-events-none z-[1] opacity-[0.03] mix-blend-overlay"
  style={{
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
    backgroundRepeat: "repeat",
    backgroundSize: "128px 128px",
  }}
/>
```

**Step 2: Verify** — faint grain visible on the section background.

**Step 3: Commit**

```bash
git commit -m "feat(proof): add film grain overlay to testimonials section"
```

---

### Task 12: Final assembly and polish

**Files:**
- Modify: `apps/landing/components/sections/testimonials-stack.tsx` — final wiring
- Modify: `apps/landing/app/(site)/page.tsx` — verify registration

**Step 1: Assemble all sub-components**

Wire everything together in `testimonials-stack.tsx`:
1. Film grain overlay
2. Fixed collapsed bars at top
3. Progress sidebar
4. StackIntro
5. 6 StackCardWrappers with CardContent
6. SummaryCard

**Step 2: Mobile polish pass**

- Verify phone frames stack vertically on small screens
- Verify progress dots reposition for mobile
- Verify before/after slider works with touch
- Verify particles are reduced on mobile
- Verify parallax is disabled under 768px

**Step 3: Performance check**

- Verify no layout thrashing (all animations use `transform`/`opacity` only)
- Check that `will-change: transform` is on sticky cards
- Verify canvas particles clean up properly

**Step 4: Full scroll test**

- Scroll through entire section: intro → 6 cards → summary
- Verify collapse behavior
- Scroll back to top: verify re-expansion
- Test progress sidebar click navigation
- Test before/after drag slider

**Step 5: Commit**

```bash
git add .
git commit -m "feat(proof): complete testimonials stack section — all 12 tasks assembled"
```

---

## File Manifest

| File | Action |
|------|--------|
| `apps/landing/lib/testimonials.ts` | Modify (add STACK_HEADLINES, STACK_ORDER, getStackedStudies, AGGREGATE_STATS) |
| `apps/landing/components/sections/testimonials-stack.tsx` | Create (main orchestrator) |
| `apps/landing/components/sections/testimonials-stack/intro.tsx` | Create |
| `apps/landing/components/sections/testimonials-stack/card.tsx` | Create (StackCardWrapper + CardContent) |
| `apps/landing/components/sections/testimonials-stack/collapsed-bar.tsx` | Create |
| `apps/landing/components/sections/testimonials-stack/phone-frame.tsx` | Create |
| `apps/landing/components/sections/testimonials-stack/metrics-row.tsx` | Create |
| `apps/landing/components/sections/testimonials-stack/before-after-slider.tsx` | Create |
| `apps/landing/components/sections/testimonials-stack/progress-sidebar.tsx` | Create |
| `apps/landing/components/sections/testimonials-stack/particles.tsx` | Create |
| `apps/landing/components/sections/testimonials-stack/summary-card.tsx` | Create |
| `apps/landing/app/(site)/page.tsx` | Modify (register Stack variant) |

#letmescale #plans #archive
