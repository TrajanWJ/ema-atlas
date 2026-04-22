> See also: [[LetMeScale]]

# Hero Rework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the default hero's 2-panel scroll animation with a clean slide-in-from-right entrance and an overlapping client avatar row above the headline.

**Architecture:** Single-file rewrite of `hero.tsx`. Remove scroll-driven transforms and the stats panel. Import `CASE_STUDIES` from testimonials for avatar data. Use framer-motion entrance variants (not scroll-driven) for the slide-in effect.

**Tech Stack:** React, Framer Motion, Next.js Image, existing testimonials data

---

### Task 1: Rewrite hero.tsx — Remove scroll animation, add avatars + slide-in

**Files:**
- Modify: `apps/landing/components/sections/hero/hero.tsx`

**Step 1: Rewrite hero.tsx**

Replace the entire component with the new implementation. Key changes:
- Remove `useScroll`, `useTransform` imports — no scroll-driven animation
- Remove `STATS` array and stats Panel 2 entirely
- Section becomes standard `min-h-[100dvh]` (not `h-[200vh]` with sticky)
- Import `CASE_STUDIES` from `@/lib/testimonials` and `Image` from `next/image`
- Add `ClientAvatars` component: overlapping row of circular profile pics
- Wrap hero content in a slide-in-from-right motion.div

Full replacement code for `hero.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button, Badge } from "@letmescale/ui";
import { staggerContainer, fadeInUp } from "@letmescale/ui";
import { useApplyModal } from "@/components/apply-modal";
import { CASE_STUDIES } from "@/lib/testimonials";

const wordStagger = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.06, delayChildren: 0.3 },
  },
};

const wordReveal = {
  initial: { opacity: 0, y: 40, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const slideInFromRight = {
  initial: { opacity: 0, x: 80 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ── Client Avatars ────────────────────────────────────────── */

function ClientAvatars() {
  const clients = CASE_STUDIES.filter((c) => c.profile.profileImage);

  return (
    <motion.div variants={fadeInUp} className="flex items-center mb-8">
      <div className="flex -space-x-3">
        {clients.map((client) => (
          <div
            key={client.id}
            className="relative w-11 h-11 rounded-full border-2 border-[var(--bg-primary)] overflow-hidden ring-1 ring-white/10"
          >
            <Image
              src={client.profile.profileImage!}
              alt={client.name}
              fill
              className="object-cover"
              sizes="44px"
            />
          </div>
        ))}
      </div>
      <span className="ml-4 text-sm text-[var(--text-tertiary)] font-medium">
        Trusted by {clients.length}+ clients
      </span>
    </motion.div>
  );
}

/* ── Hero ──────────────────────────────────────────────────── */

export function Hero() {
  const { openApplyModal } = useApplyModal();

  return (
    <section className="relative min-h-[100dvh] flex items-center section-bg">
      <motion.div
        variants={slideInFromRight}
        initial="initial"
        animate="animate"
        className="relative z-10 max-w-7xl mx-auto px-6 w-full"
      >
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-3xl"
        >
          <ClientAvatars />
          <HeroContent onApply={openApplyModal} />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ── Shared headline / body / CTA ──────────────────────────── */

function HeroContent({ onApply }: { onApply: () => void }) {
  return (
    <>
      <motion.div variants={fadeInUp} className="mb-8">
        <Badge color="red" variant="dot">
          Attention Is Leverage. We Control Leverage.
        </Badge>
      </motion.div>

      <motion.h1
        variants={wordStagger}
        initial="initial"
        animate="animate"
        className="text-5xl md:text-7xl xl:text-8xl font-display font-black tracking-[-0.03em] text-white leading-[0.9] mb-10"
      >
        {["We", "Turn", "Attention"].map((word) => (
          <motion.span
            key={word}
            variants={wordReveal}
            className="inline-block mr-[0.25em]"
          >
            {word}
          </motion.span>
        ))}
        <br />
        <motion.span variants={wordReveal} className="inline-block mr-[0.25em]">
          Into
        </motion.span>
        <motion.span variants={wordReveal} className="inline-block text-red relative">
          Control.
          <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red via-red/60 to-transparent rounded-full" />
        </motion.span>
      </motion.h1>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-2 mb-8"
      >
        {["Not views. Not followers. Not vanity metrics."].map((line) => (
          <motion.p
            key={line}
            variants={fadeInUp}
            className="text-base md:text-lg text-[var(--text-tertiary)] font-medium tracking-wide"
          >
            {line}
          </motion.p>
        ))}
      </motion.div>

      <motion.p
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed mb-3 max-w-2xl"
      >
        If you already have an offer, a business, or revenue — we help you
        dominate distribution and turn attention into predictable upside.
      </motion.p>

      <motion.p
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="text-sm text-[var(--text-tertiary)] italic mb-10"
      >
        LetMeScale operates behind the scenes for people who already
        understand money.
      </motion.p>

      <motion.div variants={fadeInUp} className="flex items-center gap-6">
        <Button
          variant="primary"
          size="xl"
          glow
          onClick={onApply}
          className="cursor-pointer"
        >
          Request Access
        </Button>
      </motion.div>
    </>
  );
}
```

**Step 2: Verify build compiles**

Run: `pnpm --filter @letmescale/landing build`
Expected: Build succeeds with no errors

**Step 3: Visual test with Playwright**

Navigate to `http://localhost:3001`, take screenshot, verify:
- Avatar row visible above badge
- Content slides in from right on load
- No scroll-to-right panel transition
- Stats panel gone

**Step 4: Commit**

```bash
git add apps/landing/components/sections/hero/hero.tsx
git commit -m "feat(hero): replace scroll animation with slide-in + client avatars"
```

#letmescale #plans
