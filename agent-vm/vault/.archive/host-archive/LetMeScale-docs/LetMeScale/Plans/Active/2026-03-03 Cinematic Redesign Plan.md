> See also: [[LetMeScale]]

# Cinematic Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the landing page from 10 separate sections to a seamless 3-part cinematic experience: Hero (cinematic text rise + stats + carousel) → Testimonials (results cards) → minimal Footer.

**Architecture:** Add a new `heroStyle: "cinematic"` option to the existing hero component. Strip `SECTION_ORDER` to 3 entries. Create a new testimonials component reusing existing `CaseStudy` data. All removed sections stay in codebase, just removed from defaults.

**Tech Stack:** Next.js, Framer Motion, Tailwind CSS, existing design tokens/glass system.

**Design doc:** `docs/plans/2026-03-03-cinematic-redesign-design.md`

---

### Task 1: Strip page.tsx to 3 sections

**Files:**
- Modify: `apps/landing/app/(site)/page.tsx`

**Step 1: Update SECTION_ORDER and COMPONENTS**

Change `SECTION_ORDER` to only include the 3 core sections:

```typescript
const SECTION_ORDER = [
  "hero",
  "testimonials",
  "footer",
] as const;
```

Add `testimonials` to `COMPONENTS`:

```typescript
testimonials: {
  "testimonials-cinematic": TestimonialsCinematic,
  "testimonials-phones": TestimonialsPhones,
  "testimonials-cascade": TestimonialsCascade,
  "testimonials-editorial": TestimonialsEditorial,
  off: Noop,
},
```

Add import at top:
```typescript
import { TestimonialsCinematic } from "@/components/sections/testimonials/testimonials-cinematic";
```

Keep all other imports — they're still needed if someone toggles sections back on via DevNav.

**Step 2: Add `heroStyle` option to SECTION_OPTION_DEFS**

Add to the existing `hero` options array:
```typescript
{
  key: "heroStyle",
  label: "Hero Style",
  choices: [
    { key: "cinematic", label: "Cinematic" },
    { key: "classic", label: "Classic" },
  ],
  defaultValue: "cinematic",
},
```

**Step 3: Update LABELS**

```typescript
const LABELS: Record<string, string> = {
  hero: "Hero",
  testimonials: "Testimonials",
  footer: "Footer",
};
```

**Step 4: Remove `section-flow` class logic if wrapping divs have it**

In the render map, remove the `relative` className wrapper since we want seamless flow. Replace with:
```tsx
<div key={`${id}-${variants[id]}-${JSON.stringify(sectionOptions[id] ?? {})}`} id={`section-${id}`}>
  <Component />
</div>
```

No `relative` class — let sections flow naturally.

**Step 5: Verify compilation**

Run: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3001`
Expected: 200 (may show errors in console about missing TestimonialsCinematic — that's fine, we build it next)

**Step 6: Commit**

```bash
git add apps/landing/app/\(site\)/page.tsx
git commit -m "feat: strip page to hero/testimonials/footer, add heroStyle option"
```

---

### Task 2: Build cinematic hero mode

**Files:**
- Modify: `apps/landing/components/sections/hero/hero.tsx`
- Modify: `apps/landing/app/globals.css` (if new keyframes needed)

This is the biggest task. The cinematic hero has scroll-driven choreography on desktop and a simple static layout on mobile.

**Step 1: Add heroStyle option reading**

In the `Hero()` function, read the new option:
```typescript
const heroStyle = (options.heroStyle as "cinematic" | "classic") ?? "cinematic";
```

When `heroStyle === "classic"`, render the existing logic (scroll animation toggle, stats location, etc.).
When `heroStyle === "cinematic"`, render the new `HeroCinematic` component.

```typescript
export function Hero() {
  const { openApplyModal } = useApplyModal();
  const options = useSectionOptions("hero");
  const heroStyle = (options.heroStyle as "cinematic" | "classic") ?? "cinematic";
  const carouselStyle = (options.clientCarousel as "cards" | "pills") ?? "cards";

  if (heroStyle === "cinematic") {
    return <HeroCinematic onApply={openApplyModal} carouselStyle={carouselStyle} />;
  }

  // Classic mode — existing logic
  const statsLocation = (options.statsLocation as "bottom" | "right") ?? "right";
  const scrollAnimation = (options.scrollAnimation ?? "off") === "on";
  return (
    <>
      {scrollAnimation ? (
        <HeroScrollAnimated onApply={openApplyModal} />
      ) : (
        <HeroStatic onApply={openApplyModal} statsLocation={statsLocation} />
      )}
      <div className="relative z-10 py-6 section-bg overflow-hidden">
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--bg-primary)] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--bg-primary)] to-transparent z-10 pointer-events-none" />
          <ClientCarousel style={carouselStyle} />
        </div>
      </div>
    </>
  );
}
```

**Step 2: Build HeroCinematic component**

Add to `hero.tsx`. This component handles both desktop (scroll-driven) and mobile (static) via responsive classes and a media query check.

Desktop scroll choreography (200vh container):
- 0-20%: "Let Me Scale." centered, fades+rises from below. Ambient red glow drifts behind.
- 20-40%: Text shifts left, stats stagger in from right (reuse existing StatsRight component).
- 40-50%: One-liner + CTA button fade in.
- 50%+: Content parallax-fades. Carousel pinned at bottom of viewport.

Mobile: No scroll container. Simple layout:
- "Let Me Scale." slides up on mount (framer-motion animate).
- One-liner + CTA below.
- Carousel takes up bottom ~40% of viewport — big cards.
- Stats as tiny 2x2 grid or hidden.

Key implementation details:
- Use `useScroll({ target: containerRef, offset: ["start start", "end end"] })` for the 200vh scroll zone
- Use `useTransform` for text position/opacity, stats entrance, CTA fade
- Carousel is absolutely positioned at `bottom-0` of the sticky viewport
- Mobile detection via `useMediaQuery` or just responsive Tailwind (hide 200vh on mobile, show static version)

Simplified approach: use a single component with responsive breakpoints rather than two separate desktop/mobile components. The 200vh scroll zone only applies on `lg:` screens.

```tsx
function HeroCinematic({
  onApply,
  carouselStyle,
}: {
  onApply: () => void;
  carouselStyle: "cards" | "pills";
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Desktop scroll transforms
  const titleY = useTransform(scrollYProgress, [0, 0.15], [60, 0]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.12], [0, 1]);
  const titleX = useTransform(scrollYProgress, [0.2, 0.4], ["0%", "-10%"]);
  const titleScale = useTransform(scrollYProgress, [0.2, 0.4], [1, 0.85]);

  const statsX = useTransform(scrollYProgress, [0.25, 0.45], ["80px", "0px"]);
  const statsOpacity = useTransform(scrollYProgress, [0.25, 0.45], [0, 1]);

  const ctaOpacity = useTransform(scrollYProgress, [0.4, 0.5], [0, 1]);

  const fadeOut = useTransform(scrollYProgress, [0.55, 0.8], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0.55, 0.8], [0, -60]);

  return (
    <>
      {/* Desktop: scroll-driven 200vh */}
      <section ref={containerRef} className="relative hidden lg:block h-[200vh]">
        <div className="sticky top-0 h-[100dvh] flex items-center overflow-hidden section-bg">
          {/* Ambient glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse,rgba(153,27,27,0.08),transparent_70%)] blur-[100px] animate-drift pointer-events-none" />

          <motion.div
            style={{ opacity: fadeOut, y: contentY }}
            className="relative z-10 max-w-7xl mx-auto px-6 w-full"
          >
            <div className="grid grid-cols-12 gap-12 items-center">
              {/* Left: title + CTA */}
              <div className="col-span-7">
                <motion.h1
                  style={{ y: titleY, opacity: titleOpacity, x: titleX, scale: titleScale }}
                  className="text-7xl xl:text-8xl 2xl:text-9xl font-display font-black tracking-[-0.03em] text-white leading-[0.9] mb-6 will-change-transform"
                >
                  Let Me Scale
                  <span className="text-red">.</span>
                </motion.h1>

                <motion.p
                  style={{ opacity: ctaOpacity }}
                  className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8 max-w-lg"
                >
                  We turn attention into predictable revenue for established businesses and creators.
                </motion.p>

                <motion.div style={{ opacity: ctaOpacity }}>
                  <Button variant="primary" size="xl" glow onClick={onApply} className="cursor-pointer">
                    Request Access
                  </Button>
                </motion.div>
              </div>

              {/* Right: stats */}
              <motion.div
                style={{ x: statsX, opacity: statsOpacity }}
                className="col-span-5 space-y-3 will-change-transform"
              >
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    style={{ opacity: statsOpacity }}
                    className="group relative p-5 rounded-xl glass-1 hover:border-[var(--border-hover)] transition-all duration-500"
                  >
                    {/* ... existing stat card content ... */}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Carousel pinned at bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pb-4">
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
              <ClientCarousel style={carouselStyle} />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: simple static layout */}
      <section className="relative lg:hidden min-h-[100dvh] flex flex-col section-bg">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[radial-gradient(ellipse,rgba(153,27,27,0.1),transparent_70%)] blur-[80px] animate-drift pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pt-20 pb-4">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl font-display font-black tracking-[-0.03em] text-white leading-[0.9] mb-4"
          >
            Let Me Scale<span className="text-red">.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-base text-[var(--text-secondary)] leading-relaxed mb-6 max-w-sm"
          >
            We turn attention into predictable revenue for established businesses and creators.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Button variant="primary" size="lg" glow onClick={onApply} className="cursor-pointer">
              Request Access
            </Button>
          </motion.div>
        </div>

        {/* Carousel takes bottom ~40% on mobile */}
        <div className="relative z-10 pb-6">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
            <ClientCarousel style={carouselStyle} />
          </div>
        </div>
      </section>
    </>
  );
}
```

Note: Import `Button` from `@letmescale/ui` is already present in hero.tsx.

**Step 3: Verify compilation and visuals**

Run: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3001`
Expected: 200

Use Playwright to screenshot and verify:
- Desktop: scroll through 200vh, verify text rise → stats slide → fade out
- Mobile (viewport 390x844): verify simple layout with prominent carousel

**Step 4: Commit**

```bash
git add apps/landing/components/sections/hero/hero.tsx
git commit -m "feat: add cinematic hero mode with scroll choreography"
```

---

### Task 3: Build testimonials-cinematic component

**Files:**
- Create: `apps/landing/components/sections/testimonials/testimonials-cinematic.tsx`

**Step 1: Create the component**

Uses existing `CASE_STUDIES` data from `@/lib/testimonials`. Each card shows:
- Big hero image filling top half
- Client name + handle
- Key metric (large, bold)
- Short stat label
- Their story metrics as compact pills

Layout: 2-3 column staggered grid. Dense gaps. Cards animate in on viewport entry.

Preserve effects from existing testimonials:
- Scroll-scale from testimonials-phones: `useScroll` + `useTransform` for scale on each card
- Border breathing from cascade (CSS animation `animate-ambient-glow` already in globals.css)
- Hover glow (red-glow-lg class already exists)

After the cards grid: centered "Request Access" button with glow, one-liner above it.

```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Image from "next/image";
import { Button } from "@letmescale/ui";
import { CASE_STUDIES, type CaseStudy } from "@/lib/testimonials";
import { useApplyModal } from "@/components/apply-modal";

function ResultCard({ client, index }: { client: CaseStudy; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.4, 1], [0.94, 1, 0.98]);

  const Icon = client.categoryIcon;

  return (
    <motion.div
      ref={ref}
      style={{ scale }}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.12] transition-all duration-500 animate-ambient-glow"
    >
      {/* Big hero image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={client.heroImage}
          alt={client.headline}
          fill
          className="object-cover opacity-70 group-hover:opacity-90 group-hover:scale-[1.03] transition-all duration-700"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {/* Category icon badge */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center">
          <Icon className="w-4 h-4 text-red" />
        </div>

        {/* Name overlay at bottom of image */}
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-bold text-sm">{client.name}</p>
          <p className="text-white/40 text-xs">{client.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Key metric — the star */}
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-black text-white group-hover:text-red transition-colors duration-300">
            {client.stat}
          </span>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider">
          {client.statLabel}
        </p>

        {/* Mini metrics */}
        <div className="flex flex-wrap gap-1.5">
          {client.story.metrics.slice(0, 3).map((m) => (
            <span
              key={m.label}
              className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] text-white/50 border border-white/[0.04]"
            >
              {m.value}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsCinematic() {
  const { openApplyModal } = useApplyModal();

  return (
    <div className="relative section-bg section-flow">
      {/* No section header — flows from hero */}

      {/* Cards grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {CASE_STUDIES.map((client, i) => (
            <ResultCard key={client.id} client={client} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pb-20 px-6">
        <p className="text-sm text-[var(--text-tertiary)] mb-6 italic">
          All figures represent real, auditable client outcomes.
        </p>
        <Button
          variant="primary"
          size="xl"
          glow
          onClick={openApplyModal}
          className="cursor-pointer"
        >
          Request Access
        </Button>
      </div>
    </div>
  );
}
```

Note: Uses `section-flow` class (already in globals.css) to suppress fader lines between hero and testimonials.

**Step 2: Verify compilation**

Run: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3001`
Expected: 200

**Step 3: Commit**

```bash
git add apps/landing/components/sections/testimonials/testimonials-cinematic.tsx
git commit -m "feat: add cinematic testimonials with results cards grid"
```

---

### Task 4: Slim down footer

**Files:**
- Modify: `apps/landing/components/footer.tsx`

**Step 1: Simplify footer**

Remove nav links. Just brand + copyright on one line.

```tsx
export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.04] py-6 section-bg section-flow">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <span className="font-body text-sm text-[var(--text-tertiary)]">
          LetMeScale<span className="text-red">.</span>
        </span>
        <span className="font-data text-[10px] text-[var(--text-tertiary)]">
          &copy; 2026
        </span>
      </div>
    </footer>
  );
}
```

**Step 2: Commit**

```bash
git add apps/landing/components/footer.tsx
git commit -m "feat: simplify footer to minimal brand + copyright"
```

---

### Task 5: Visual verification and polish

**Files:**
- Potentially: `apps/landing/components/sections/hero/hero.tsx`, `apps/landing/components/sections/testimonials/testimonials-cinematic.tsx`, `apps/landing/app/globals.css`

**Step 1: Full-page visual test with Playwright**

Navigate to `http://localhost:3001` and screenshot at multiple scroll positions:
1. Initial load (hero entrance)
2. Mid-scroll (stats visible)
3. Bottom of hero (carousel + testimonials starting)
4. Testimonials grid
5. Footer

Check for:
- No blank white/black dead space between sections
- Carousel is prominent and integrated into hero
- Testimonials flow seamlessly from hero
- Cards are dense (minimal gaps)
- Client images are big and eye-catching
- Mobile (390px viewport): carousel dominates, simple text hero

**Step 2: Fix any spacing/transition issues**

Likely adjustments:
- Tweak carousel card sizes for mobile (make them bigger)
- Adjust gap between hero exit and testimonials entry
- Ensure `section-flow` is applied to suppress fader lines

**Step 3: Test DevNav option switching**

Verify these options still work:
- `heroStyle`: cinematic ↔ classic
- `clientCarousel`: cards ↔ pills
- `statsLocation` and `scrollAnimation` (only visible in classic mode)

**Step 4: Final commit**

```bash
git add -u
git commit -m "fix: visual polish for cinematic redesign"
```

---

### Task 6 (Optional): Deploy to Vercel

**Step 1: Push and verify**

```bash
git push origin master
```

Wait for Vercel auto-deploy, then verify at letmescale.vercel.app.

If Vercel doesn't auto-deploy, trigger manually:
```bash
vercel --prod
```

#letmescale #plans
