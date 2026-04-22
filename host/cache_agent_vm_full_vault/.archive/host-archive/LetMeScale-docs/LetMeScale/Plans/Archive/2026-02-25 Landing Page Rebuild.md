> See also: [[LetMeScale]]

# LetMeScale Landing Page Rebuild — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete rebuild of the landing page with new design tokens (Playfair Display/Outfit/IBM Plex Mono, #060608 void bg, updated glass system), 8 new sections with Sales+Mirror variants, a fully-featured DevNav with magnify+prompt cards, and legacy sections preserved as DevNav-toggleable variants.

**Architecture:** Next.js 15 App Router with Tailwind CSS v4, Framer Motion 11. New sections live in subdirectories (`components/hero/`, `components/proof/`, etc.), legacy sections moved to `components/sections-legacy/`. DevNav manages all variant state with localStorage persistence and URL param support. Page.tsx renders sections dynamically from a registry.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Framer Motion 11, TypeScript strict, pnpm monorepo

**Parallelization Strategy:** Tasks are grouped into waves. All tasks within a wave can run as parallel subagents. Each wave depends on the previous wave completing.

---

## WAVE 1: Foundation (Sequential — Single Agent)

These tasks MUST complete before any section work begins. They establish the design token system, font loading, and variant infrastructure that every other component depends on.

### Task 1: Update Design Tokens

**Files:**
- Modify: `packages/ui/src/theme/tokens.ts`
- Modify: `packages/ui/src/animations/presets.ts`
- Modify: `packages/ui/src/index.ts`

**Step 1: Replace tokens.ts with new token system**

```typescript
// packages/ui/src/theme/tokens.ts

export const colors = {
  bg: {
    void: "#060608",
    surface1: "#0a0a0d",
    surface2: "#0f0f13",
    surface3: "#141418",
    surface4: "#1a1a1f",
  },
  text: {
    100: "rgba(255, 255, 255, 1.0)",
    60: "rgba(255, 255, 255, 0.60)",
    40: "rgba(255, 255, 255, 0.40)",
    20: "rgba(255, 255, 255, 0.20)",
  },
  red: {
    DEFAULT: "#991B1B",
    glow: "rgba(153, 27, 27, 0.25)",
    subtle: "rgba(153, 27, 27, 0.08)",
    border: "rgba(153, 27, 27, 0.20)",
  },
  border: {
    DEFAULT: "rgba(255, 255, 255, 0.06)",
    hover: "rgba(255, 255, 255, 0.10)",
    red: "rgba(153, 27, 27, 0.20)",
  },
} as const;

export const glass = {
  ambient: {
    bg: "rgba(255, 255, 255, 0.01)",
    blur: "0px",
    // Tailwind: bg-white/[0.01]
  },
  surface: {
    bg: "rgba(255, 255, 255, 0.02)",
    blur: "12px",
    // Tailwind: bg-white/[0.02] backdrop-blur-[12px]
  },
  elevated: {
    bg: "rgba(255, 255, 255, 0.04)",
    blur: "16px",
    // Tailwind: bg-white/[0.04] backdrop-blur-[16px]
  },
  accent: {
    bg: "rgba(153, 27, 27, 0.08)",
    blur: "20px",
    // Tailwind: bg-[rgba(153,27,27,0.08)] backdrop-blur-[20px]
  },
} as const;

export const glow = {
  red: "0 0 20px rgba(153, 27, 27, 0.25)",
  redSubtle: "0 0 40px rgba(153, 27, 27, 0.12)",
  green: "0 0 20px rgba(34, 197, 94, 0.5)",
} as const;

// Standard easing — use everywhere
export const EASE = [0.16, 1, 0.3, 1] as const;
```

**Step 2: Replace presets.ts with new animation system**

```typescript
// packages/ui/src/animations/presets.ts
import type { Variants, Transition } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const springTransition: Transition = {
  type: "spring",
  damping: 30,
  stiffness: 300,
};

export const smoothTransition: Transition = {
  duration: 0.6,
  ease: EASE as unknown as number[],
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: EASE as unknown as number[] } },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE as unknown as number[] } },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE as unknown as number[] } },
};

export const blurReveal: Variants = {
  initial: { opacity: 0, filter: "blur(10px)" },
  animate: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE as unknown as number[] } },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE as unknown as number[] } },
};

export const slideFromLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE as unknown as number[] } },
};

export const slideInRight: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1, transition: springTransition },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.3 } },
};

export const slideInLeft: Variants = {
  initial: { x: "-100%", opacity: 0 },
  animate: { x: 0, opacity: 1, transition: springTransition },
  exit: { x: "-100%", opacity: 0, transition: { duration: 0.3 } },
};

export const slideInUp: Variants = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1, transition: springTransition },
  exit: { y: "100%", opacity: 0, transition: { duration: 0.3 } },
};

export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE as unknown as number[] } },
};

export const lineScale: Variants = {
  initial: { scaleX: 0 },
  animate: { scaleX: 1, transition: { duration: 0.8, ease: EASE as unknown as number[] } },
};

export const scrollReveal: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE as unknown as number[] } },
};

export const sharpCut: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export const typewriterContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.4, delayChildren: 0.2 } },
};

export const typewriterLine: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE as unknown as number[] } },
};

export const hoverLift = {
  y: -3,
  transition: { duration: 0.3, ease: "easeOut" },
};

export const glowPulse = {
  boxShadow: [
    "0 0 0px rgba(153,27,27,0)",
    "0 0 20px rgba(153,27,27,0.25)",
    "0 0 0px rgba(153,27,27,0)",
  ],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};
```

**Step 3: Update index.ts exports**

Add `EASE` to the exports from both tokens and presets. Ensure `slideFromLeft` is exported.

```typescript
// Add to the animations export block:
export { EASE } from "./animations/presets";
// Also re-export from tokens:
export { EASE as EASE_CURVE } from "./theme/tokens";
```

**Step 4: Verify build**

Run: `cd /home/trajan/Desktop/Coding/Projects/letmescale && pnpm build`
Expected: Build succeeds (existing sections may have warnings about removed token names — that's expected and will be fixed when sections are rebuilt)

---

### Task 2: Update globals.css

**Files:**
- Modify: `apps/landing/app/globals.css`

**Replace the entire file with:**

```css
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-void: #060608;
  --color-surface-1: #0a0a0d;
  --color-surface-2: #0f0f13;
  --color-surface-3: #141418;
  --color-surface-4: #1a1a1f;

  /* Red — punctuation only */
  --color-red: #991B1B;
  --color-red-glow: rgba(153, 27, 27, 0.25);
  --color-red-subtle: rgba(153, 27, 27, 0.08);
  --color-red-border: rgba(153, 27, 27, 0.20);

  /* Fonts */
  --font-display: "Playfair Display", Georgia, serif;
  --font-body: "Outfit", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}

/* ── Grain texture overlay ── */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 99999;
  pointer-events: none;
  opacity: 0.018;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  background-size: 256px;
  background-repeat: repeat;
}

/* ── Smooth scrolling ── */
html {
  scroll-behavior: smooth;
}

/* ── Selection ── */
::selection {
  background-color: rgba(153, 27, 27, 0.3);
  color: #ffffff;
}

/* ── Scrollbar ── */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #060608;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

---

### Task 3: Update layout.tsx — Font Loading

**Files:**
- Modify: `apps/landing/app/layout.tsx`

**Replace with:**

```tsx
import type { Metadata } from "next";
import { Playfair_Display, Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["200", "300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "LetMeScale — Attention That Produces Direct ROI",
  description:
    "Premium content distribution for creators and operators who expect measurable upside from attention. We build systems, not campaigns.",
  keywords: [
    "content distribution",
    "personal brand",
    "founder marketing",
    "attention leverage",
    "inbound marketing",
    "high ticket",
    "content strategy",
  ],
  openGraph: {
    title: "LetMeScale — Attention That Produces Direct ROI",
    description:
      "Premium distribution for creators and operators who understand money. Not exposure. ROI.",
    type: "website",
    siteName: "LetMeScale",
  },
  twitter: {
    card: "summary_large_image",
    title: "LetMeScale — We Turn Attention Into Control",
    description:
      "Premium content distribution for people who already understand money.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-void text-white antialiased font-body">
        {children}
      </body>
    </html>
  );
}
```

---

### Task 4: Create Variant Infrastructure

**Files:**
- Create: `apps/landing/lib/variants.ts`

```typescript
// apps/landing/lib/variants.ts

export type VariantKey = string;

export interface SectionDef {
  id: string;
  label: string;
  variants: { key: string; label: string }[];
  defaultVariant: string;
}

const STORAGE_KEY = "letmescale-variants";

export function loadVariants(sections: SectionDef[]): Record<string, string> {
  const defaults = Object.fromEntries(
    sections.map((s) => [s.id, s.defaultVariant])
  );

  // 1. Try URL params
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    for (const section of sections) {
      const val = params.get(section.id);
      if (val && section.variants.some((v) => v.key === val)) {
        defaults[section.id] = val;
      }
    }
  }

  // 2. Try localStorage (URL params take precedence)
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      for (const section of sections) {
        if (
          !new URLSearchParams(window.location.search).has(section.id) &&
          stored[section.id] &&
          section.variants.some((v) => v.key === stored[section.id])
        ) {
          defaults[section.id] = stored[section.id];
        }
      }
    } catch {}
  }

  return defaults;
}

export function saveVariants(variants: Record<string, string>): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(variants));
    } catch {}
  }
}
```

---

### Task 5: Move Legacy Sections

**Files:**
- Move: `apps/landing/components/sections/*` → `apps/landing/components/sections-legacy/`

Run:

```bash
cd /home/trajan/Desktop/Coding/Projects/letmescale/apps/landing/components
mkdir -p sections-legacy
cp sections/*.tsx sections-legacy/
```

Keep the originals in `sections/` for now (they'll be replaced by new section files organized in subdirectories). The `sections-legacy/` directory is what DevNav will reference for "Legacy" variants.

---

### Task 6: Commit Foundation

```bash
git add -A
git commit -m "feat: rebuild foundation — new tokens, fonts (Playfair/Outfit/IBM Plex Mono), glass system, variant infra"
```

---

## WAVE 2: Core Components (Parallel — 4 Agents)

After Wave 1 completes, these 4 tasks can run simultaneously as parallel subagents.

### Task 7: Build nav.tsx (Agent A)

**Files:**
- Modify: `apps/landing/components/nav.tsx`

**Full implementation:**

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const NAV_LINKS = [
  { label: "What We Do", href: "#system" },
  { label: "Results", href: "#proof" },
  { label: "Philosophy", href: "#philosophy" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-surface-3/80 backdrop-blur-[16px] border-b border-white/[0.06] py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-body font-semibold tracking-tight">
              <span className="text-white transition-opacity group-hover:opacity-80">
                LetMeScale
              </span>
              <span className="text-[#991B1B] text-2xl leading-none">.</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] font-body font-medium tracking-wide text-white/40 hover:text-white/60 transition-all duration-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[rgba(153,27,27,0.40)] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/apply"
              className="px-5 py-2 bg-[#991B1B] text-white text-sm font-body font-medium rounded-lg hover:bg-[#991B1B]/90 transition-colors"
            >
              Request Access
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center cursor-pointer"
          >
            <div className="space-y-1.5">
              <motion.div
                animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                className="w-6 h-[2px] bg-white"
              />
              <motion.div
                animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                className="w-6 h-[2px] bg-white"
              />
              <motion.div
                animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                className="w-6 h-[2px] bg-white"
              />
            </div>
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 z-40 bg-void/95 backdrop-blur-[16px] md:hidden"
          >
            <div className="flex flex-col items-center gap-8 pt-16">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg font-body text-white/60 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/apply"
                onClick={() => setMobileOpen(false)}
                className="px-6 py-3 bg-[#991B1B] text-white font-body font-medium rounded-lg"
              >
                Request Access
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

### Task 8: Build counter.tsx (Agent A — same agent as nav)

**Files:**
- Modify: `apps/landing/components/counter.tsx`

The existing counter is good. Update to use `font-mono` class and `tabular-nums` for stable layout:

```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

interface CounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
  tick?: boolean;
  tickInterval?: number;
  tickIncrement?: number;
}

export function Counter({
  target,
  prefix = "",
  suffix = "",
  duration = 2,
  decimals = 0,
  className,
  tick = false,
  tickInterval = 2000,
  tickIncrement = 0.001,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hasStarted, setHasStarted] = useState(false);
  const currentValue = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });

  const display = useTransform(spring, (current) => {
    if (decimals > 0) {
      return `${prefix}${current.toFixed(decimals)}${suffix}`;
    }
    return `${prefix}${Math.round(current).toLocaleString()}${suffix}`;
  });

  const startTicking = useCallback(() => {
    if (!tick || intervalRef.current) return;
    currentValue.current = target;

    intervalRef.current = setInterval(() => {
      const jitter = 0.5 + Math.random();
      currentValue.current += tickIncrement * jitter;
      spring.set(currentValue.current);
    }, tickInterval + (Math.random() - 0.5) * 800);
  }, [tick, target, tickIncrement, tickInterval, spring]);

  useEffect(() => {
    if (isInView && !hasStarted) {
      spring.set(target);
      setHasStarted(true);
      if (tick) {
        const timeout = setTimeout(startTicking, duration * 1000 + 200);
        return () => clearTimeout(timeout);
      }
    }
  }, [isInView, hasStarted, spring, target, tick, duration, startTicking]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <motion.span
      ref={ref}
      className={`font-mono tabular-nums ${className || ""}`}
      style={{ fontFeatureSettings: '"tnum"' }}
    >
      {display}
    </motion.span>
  );
}
```

---

### Task 9: Build Hero A (Agent B)

**Files:**
- Create: `apps/landing/components/hero/hero-a.tsx`

This is the most important section — Grid + Stats hero per the spec.

```tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { Counter } from "@/components/counter";

export function HeroA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-void"
    >
      {/* ── Background: ambient grid ── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 70%)",
        }}
      />

      {/* ── Red orb glow ── */}
      <motion.div
        className="absolute w-[600px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(153,27,27,0.12) 0%, transparent 70%)",
          left: "20%",
          top: "30%",
          filter: "blur(80px)",
        }}
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-32 pb-24"
      >
        {/* ── Eyebrow tag ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#991B1B] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#991B1B]" />
          </span>
          <span className="font-mono text-xs tracking-[0.08em] text-white/20 uppercase">
            Accepting 3 clients this quarter
          </span>
        </motion.div>

        {/* ── Headline ── */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(3rem,7vw,6.8rem)] leading-[0.92] tracking-[-0.02em] mb-6 max-w-4xl"
        >
          We Build{" "}
          <br className="hidden sm:block" />
          <em className="relative inline-block">
            Attention
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[rgba(153,27,27,0.40)]" />
          </em>{" "}
          That
          <br />
          Produces Direct
          <br />
          ROI<span className="text-[#991B1B]">.</span>
        </motion.h1>

        {/* ── Subheadline ── */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-body font-light text-white/40 text-lg max-w-[440px] leading-relaxed mb-10"
        >
          Not exposure. Not personal brand. Not dopamine metrics.
          We work with creators & operators who expect measurable upside.
        </motion.p>

        {/* ── Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4 mb-16"
        >
          <Link
            href="/apply"
            className="px-6 py-3 bg-[#991B1B] text-white font-body font-medium text-sm rounded-lg hover:bg-[#991B1B]/90 transition-colors"
          >
            Apply Now
          </Link>
          <a
            href="#proof"
            className="px-6 py-3 border border-white/[0.10] text-white/60 font-body font-medium text-sm rounded-lg hover:border-white/[0.15] hover:text-white/80 transition-all"
          >
            See Results
          </a>
        </motion.div>

        {/* ── Stats bar ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-white/[0.06] pt-8 flex flex-wrap gap-x-12 gap-y-6"
        >
          <div>
            <Counter
              target={3.4}
              prefix="$"
              suffix="M+"
              decimals={1}
              tick
              tickInterval={2200}
              tickIncrement={0.01}
              className="text-2xl font-mono text-white"
            />
            <p className="text-xs font-mono text-white/20 uppercase tracking-wider mt-1">
              Revenue Generated
            </p>
          </div>
          <div>
            <Counter
              target={2.1}
              suffix="B+"
              decimals={1}
              tick
              tickInterval={1800}
              tickIncrement={0.001}
              className="text-2xl font-mono text-white"
            />
            <p className="text-xs font-mono text-white/20 uppercase tracking-wider mt-1">
              Total Views
            </p>
          </div>
          <div>
            <span className="text-2xl font-mono text-white tabular-nums">82</span>
            <p className="text-xs font-mono text-white/20 uppercase tracking-wider mt-1">
              Avg Days to 4× Revenue
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
```

---

### Task 10: Build Marquee (Agent C)

**Files:**
- Create: `apps/landing/components/marquee.tsx`

Social proof infinite scroll strip — pure CSS animation for performance.

```tsx
// apps/landing/components/marquee.tsx
"use client";

const ITEMS = [
  "$83K in 6 days — Trell",
  "14.2M views — Daniel",
  "$60K → $250K/mo — Mark Shapiro",
  "6.5M views — Chetha",
  "$700K+ revenue — Farid",
  "$1B+ lifetime — Josh Snow",
];

export function Marquee() {
  const track = ITEMS.map((item, i) => (
    <span key={i} className="flex items-center gap-6 shrink-0">
      <span className="w-1 h-1 rounded-full bg-[#991B1B]" />
      <span className="font-mono text-xs tracking-[0.06em] text-white/20 uppercase whitespace-nowrap">
        {item}
      </span>
    </span>
  ));

  return (
    <div className="border-y border-white/[0.06] bg-void overflow-hidden py-4">
      <div className="flex animate-marquee gap-6">
        {/* Duplicate track for seamless loop */}
        <div className="flex gap-6 shrink-0">{track}</div>
        <div className="flex gap-6 shrink-0" aria-hidden>{track}</div>
        <div className="flex gap-6 shrink-0" aria-hidden>{track}</div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
```

---

### Task 11: Build DevNav — Full Spec (Agent D)

**Files:**
- Create: `apps/landing/components/dev-nav.tsx` (full replacement)

This is the most complex component. Includes: draggable trigger, popup panel, variant toggles, prompt cards with modal, magnify button.

```tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ── */
interface SectionConfig {
  id: string;
  label: string;
  variants: { key: string; label: string }[];
}

interface PromptCard {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

interface DevNavProps {
  sections: SectionConfig[];
  variants: Record<string, string>;
  onVariantChange: (sectionId: string, variantKey: string) => void;
}

/* ── Prompt card data ── */
const PROMPT_CARDS: PromptCard[] = [
  {
    id: "new-section",
    title: "New Section Generator",
    description: "Create new section with Sales + Mirror variants",
    prompt: `CONTEXT: I'm building a section for the LetMeScale landing page.
The design system uses: void (#060608) background, white-at-opacity text
(100/60/40/20), red (#991B1B) as punctuation only, 4-tier glass morphism,
Playfair Display headings, Outfit body, IBM Plex Mono labels.

BUILD SECTION: [SECTION_NAME]

Requirements:
1. Create TWO variants — Sales (emotional, conversion-forward) and Mirror
   (technical documentation aesthetic)
2. Sales variant: Playfair Display headline ending in red period, emotional
   subhead in text-white/40, content cards in glass-surface tier
3. Mirror variant: Monospace-heavy, terminal aesthetic, same data presented
   as technical documentation / system readout
4. Both variants must use Framer Motion for entrance animations (fadeInUp
   with stagger)
5. Export as named components: [Section]A and [Section]Mirror
6. Include mobile responsive breakpoints (< 900px)
7. Follow the border system: rgba(255,255,255,0.06) default, 0.10 hover
8. Add red top-line accent on card hover (opacity 0 → 0.6)

COPY/CONTENT: [Describe what this section communicates]`,
  },
  {
    id: "conversion-audit",
    title: "Conversion Audit",
    description: "Audit CTA placement and conversion psychology",
    prompt: `CONTEXT: Audit the LetMeScale landing page for conversion psychology.
The page sells a premium content distribution service to operators making
$50K+/mo. Two service tiers: Main Room (full system) and Overflow
(distribution only).

AUDIT EACH SECTION FOR:
1. CTA placement and visibility — is there a clear next action?
2. Social proof proximity — are metrics near decision points?
3. Scarcity signals — does the copy convey limited availability?
4. Friction points — any confusion, ambiguity, or unnecessary steps?
5. Authority signals — does the design reinforce premium positioning?
6. Objection handling — are common concerns addressed before the CTA?
7. Progressive disclosure — does information reveal in the right order?

FOR EACH ISSUE FOUND:
- Identify the section and element
- Explain the conversion problem
- Provide the specific code change (component + Tailwind classes)
- Explain the psychological principle behind the fix

CONSTRAINTS: Maintain the existing design token system. Never break the
red-as-punctuation rule. Never add new colors outside the system.`,
  },
  {
    id: "animation-polish",
    title: "Animation Polish Pass",
    description: "Add/refine Framer Motion animations throughout",
    prompt: `CONTEXT: Add/refine Framer Motion animations across the LetMeScale landing
page. The aesthetic is Bloomberg Terminal × Luxury Brand — animations should
feel precise, engineered, and expensive. Never bouncy, playful, or casual.

STANDARD EASING: [0.16, 1, 0.3, 1] (ease-out-expo)

AUDIT AND ENHANCE:
1. Page load sequence — staggered reveals for hero elements (tag → title
   → subtitle → buttons → stats) with 0.1s delays
2. Scroll-triggered entrances — each section fades in when 20% visible
   (use Framer Motion useInView or whileInView)
3. Card hover states — subtle lift (translateY -3px) + border color
   transition + optional red top-line reveal
4. Counter animations — spring-based number animation on first view,
   then jitter ticking
5. Marquee — pure CSS infinite scroll (NOT Framer Motion — performance)
6. DevNav — popup slide-up with scale, magnify smooth expand
7. Navigation — backdrop-filter transition on scroll
8. CTA button — subtle glow pulse (red box-shadow animation)

PERFORMANCE RULES:
- Animate only transform and opacity (GPU-composited)
- Use will-change sparingly
- Disable animations for prefers-reduced-motion
- Marquee uses CSS animation, not JS`,
  },
  {
    id: "mirror-generator",
    title: "Mirror Variant Generator",
    description: "Create technical mirror of any sales section",
    prompt: `CONTEXT: Create the Mirror (technical documentation) variant of an existing
LetMeScale landing page section.

EXISTING SECTION: [Paste the Sales variant component code here]

MIRROR DESIGN LANGUAGE:
- Replace serif display font with IBM Plex Mono throughout
- Replace emotional language with clinical/technical language
- Replace flowing layouts with rigid grid/table structures
- Add terminal-style decorations: "//", line numbers, status indicators
- Use more text-white/20 (muted) and less text-white/100
- Data should feel like reading a system dashboard, not marketing copy
- Add subtle technical details: version numbers, timestamps, status codes
- Cards become "data rows" or "terminal panels"

NAMING: The Mirror component exports as [SectionName]Mirror
EXAMPLES OF TONE SHIFT:
  Sales: "Coaches frustrated by inconsistency"
  Mirror: "The Quiet Protocol"
  Sales: "Five Layers. Zero Improvisation."
  Mirror: "TECHNICAL ARCHITECTURE v2.1 // Layer Status"

Maintain identical data/metrics — only presentation changes.`,
  },
  {
    id: "mobile-pass",
    title: "Mobile Responsive Pass",
    description: "Audit and fix responsive behavior across all sections",
    prompt: `CONTEXT: Audit and fix responsive behavior for the LetMeScale landing page.
Breakpoints: mobile (< 640px), tablet (640–900px), desktop (> 900px).

FOR EACH SECTION, VERIFY:
1. Grid layouts collapse properly (3-col → 2-col → 1-col)
2. Font sizes scale down appropriately (use clamp() for headlines)
3. Padding reduces: desktop 48px → tablet 32px → mobile 20px
4. DevNav popup: default fits on mobile, magnified uses 95vw + 80vh
5. Navigation: hamburger menu on mobile (or hide links, keep CTA)
6. Marquee: continues working, no overflow issues
7. Hero stats: wrap to 2-row layout on mobile
8. Cards: full-width on mobile with maintained padding
9. Touch targets: minimum 44×44px for all interactive elements
10. Images/orbs: scale down or hide on small screens

TAILWIND RESPONSIVE PATTERN:
- Mobile-first: base styles are mobile
- md: (768px+) tablet adjustments
- lg: (1024px+) desktop layouts
- Use responsive padding: px-5 md:px-8 lg:px-12`,
  },
];

/* ── Component ── */
export function DevNav({ sections, variants, onVariantChange }: DevNavProps) {
  const [open, setOpen] = useState(false);
  const [magnified, setMagnified] = useState(false);
  const [promptModal, setPromptModal] = useState<PromptCard | null>(null);
  const [pos, setPos] = useState({ x: 16, y: -1 }); // -1 = unset, will calc on mount
  const dragRef = useRef<{
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);

  // Position at bottom-left on mount
  useEffect(() => {
    if (pos.y === -1) {
      setPos({ x: 16, y: window.innerHeight - 60 });
    }
  }, [pos.y]);

  if (process.env.NODE_ENV !== "development") return null;

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: pos.x,
      oy: pos.y,
      moved: false,
    };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 50, dragRef.current.ox + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 50, dragRef.current.oy + dy)),
      });
    };
    const onUp = () => {
      if (dragRef.current && !dragRef.current.moved) {
        setOpen((o) => !o);
      }
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Magnify sizes
  const m = magnified;
  const panelW = m ? "min(680px, 95vw)" : "380px";
  const panelMaxH = m ? "85vh" : "540px";
  const headerPad = m ? "20px 28px" : "14px 18px";
  const bodyPad = m ? "16px 28px" : "12px 18px";
  const bodyGap = m ? "24px" : "16px";
  const titleSize = m ? "1rem" : "0.72rem";
  const groupTitle = m ? "0.82rem" : "0.62rem";
  const btnPad = m ? "8px 16px" : "5px 12px";
  const btnFont = m ? "0.85rem" : "0.66rem";
  const cardPad = m ? "18px 20px" : "14px 16px";
  const cardTitle = m ? "0.95rem" : "0.72rem";
  const cardDesc = m ? "0.88rem" : "0.68rem";
  const copyBtn = m ? "0.82rem" : "0.62rem";
  const copyPad = m ? "7px 16px" : "4px 10px";
  const footPad = m ? "16px 28px" : "12px 18px";
  const magFont = m ? "0.88rem" : "0.64rem";
  const magPad = m ? "8px 18px" : "5px 12px";

  return (
    <>
      <div className="fixed z-[10000]" style={{ left: pos.x, top: pos.y }}>
        {/* ── Trigger ── */}
        <div
          onMouseDown={onDragStart}
          className="w-[42px] h-[42px] rounded-md bg-surface-3 border border-[rgba(34,197,94,0.30)] text-[rgba(34,197,94,0.8)] text-sm font-mono font-bold flex items-center justify-center hover:border-[rgba(34,197,94,0.50)] transition-colors cursor-grab active:cursor-grabbing select-none"
        >
          {open ? "×" : "#"}
        </div>

        {/* ── Popup ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-full mb-2 left-0 rounded-xl bg-surface-2 border border-white/[0.10] overflow-hidden"
              style={{
                width: panelW,
                maxHeight: panelMaxH,
                boxShadow: "0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
                transition: "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between border-b border-white/[0.06]"
                style={{ padding: headerPad, transition: "padding 0.45s cubic-bezier(0.16,1,0.3,1)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[rgba(34,197,94,0.8)]" />
                  <span
                    className="font-mono text-white/60 uppercase tracking-[0.06em]"
                    style={{ fontSize: titleSize, transition: "font-size 0.45s cubic-bezier(0.16,1,0.3,1)" }}
                  >
                    DevNav // Variant Control
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/20 hover:text-white/40 font-mono text-sm cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div
                className="overflow-y-auto"
                style={{
                  padding: bodyPad,
                  maxHeight: `calc(${panelMaxH} - 100px)`,
                  transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: bodyGap, transition: "gap 0.45s cubic-bezier(0.16,1,0.3,1)" }}>
                  {/* ── Section groups ── */}
                  {sections.map((section) => (
                    <div key={section.id}>
                      <p
                        className="font-mono text-white/20 uppercase tracking-[0.08em] mb-2"
                        style={{ fontSize: groupTitle, transition: "font-size 0.45s cubic-bezier(0.16,1,0.3,1)" }}
                      >
                        ── {section.label} ──
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {section.variants.map((v) => {
                          const active = variants[section.id] === v.key;
                          return (
                            <button
                              key={v.key}
                              onClick={() => onVariantChange(section.id, v.key)}
                              className={`rounded font-mono transition-all cursor-pointer ${
                                active
                                  ? "bg-[rgba(153,27,27,0.08)] border border-[rgba(153,27,27,0.20)] text-[#991B1B]"
                                  : "bg-white/[0.01] border border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.10]"
                              }`}
                              style={{
                                padding: btnPad,
                                fontSize: btnFont,
                                transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
                              }}
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* ── Divider ── */}
                  <div className="border-t border-white/[0.06]" />

                  {/* ── Prompt cards ── */}
                  <p
                    className="font-mono text-white/20 uppercase tracking-[0.08em]"
                    style={{ fontSize: groupTitle, transition: "font-size 0.45s cubic-bezier(0.16,1,0.3,1)" }}
                  >
                    ── AI Follow-Up Prompts ──
                  </p>

                  {PROMPT_CARDS.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white/[0.01] border border-white/[0.06] rounded-md"
                      style={{
                        padding: cardPad,
                        transition: "padding 0.45s cubic-bezier(0.16,1,0.3,1)",
                      }}
                    >
                      <p
                        className="font-mono text-white/60 flex items-center gap-1.5"
                        style={{ fontSize: cardTitle, transition: "font-size 0.45s cubic-bezier(0.16,1,0.3,1)" }}
                      >
                        <span className="text-[rgba(34,197,94,0.8)]">⚡</span> {card.title}
                      </p>
                      <p
                        className="text-white/20 mt-1 font-body"
                        style={{
                          fontSize: cardDesc,
                          lineHeight: m ? "1.6" : "1.4",
                          transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
                        }}
                      >
                        {card.description}
                      </p>
                      <button
                        onClick={() => setPromptModal(card)}
                        className="mt-2 font-mono text-[rgba(34,197,94,0.8)] bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.15)] rounded cursor-pointer hover:bg-[rgba(34,197,94,0.10)] transition-colors"
                        style={{
                          fontSize: copyBtn,
                          padding: copyPad,
                          transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
                        }}
                      >
                        View & Copy →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between border-t border-white/[0.06]"
                style={{ padding: footPad, transition: "padding 0.45s cubic-bezier(0.16,1,0.3,1)" }}
              >
                <span className="font-mono text-white/20" style={{ fontSize: "0.6rem" }}>
                  DEV ONLY • {sections.length} sections
                </span>
                <button
                  onClick={() => setMagnified((m) => !m)}
                  className={`font-mono rounded cursor-pointer transition-all ${
                    magnified
                      ? "bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.40)] text-[rgba(34,197,94,1)]"
                      : "bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.15)] text-[rgba(34,197,94,0.8)]"
                  }`}
                  style={{
                    fontSize: magFont,
                    padding: magPad,
                    letterSpacing: "0.02em",
                    transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  🔍 {magnified ? "Minimize" : "Magnify"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Prompt Modal ── */}
      <AnimatePresence>
        {promptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPromptModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface-2 border border-white/[0.10] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <h3 className="font-mono text-white/80 text-sm">
                  ⚡ {promptModal.title}
                </h3>
                <button
                  onClick={() => setPromptModal(null)}
                  className="text-white/20 hover:text-white/40 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <pre className="font-mono text-xs text-white/40 whitespace-pre-wrap leading-relaxed">
                  {promptModal.prompt}
                </pre>
              </div>
              <div className="p-5 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    copyToClipboard(promptModal.prompt);
                  }}
                  className="px-5 py-2.5 font-mono text-sm bg-[rgba(34,197,94,0.10)] border border-[rgba(34,197,94,0.30)] text-[rgba(34,197,94,1)] rounded-lg cursor-pointer hover:bg-[rgba(34,197,94,0.15)] transition-colors"
                >
                  Copy Full Prompt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## WAVE 3: Content Sections (Parallel — 4 Agents)

After Wave 2 completes. Each agent builds one or two sections.

### Task 12: Build Proof Section (Agent E)

**Files:**
- Create: `apps/landing/components/proof/proof-a.tsx`

Case study cards using testimonials.ts data.

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CASE_STUDIES } from "@/lib/testimonials";

export function ProofA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="proof" className="relative py-32 bg-surface-1">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4"
        >
          <span className="font-mono text-xs tracking-[0.08em]">
            <span className="text-white/20">// </span>
            <span className="text-[#991B1B]">CASE STUDIES</span>
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl md:text-5xl lg:text-6xl tracking-[-0.02em] mb-16"
        >
          Proof Over Promises<span className="text-[#991B1B]">.</span>
        </motion.h2>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CASE_STUDIES.map((study, i) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="group relative bg-white/[0.02] backdrop-blur-[12px] border border-white/[0.06] rounded-xl p-6 hover:border-white/[0.10] transition-all duration-300"
            >
              {/* Red top-line on hover */}
              <div className="absolute top-0 left-4 right-4 h-[1px] bg-[#991B1B] opacity-0 group-hover:opacity-60 transition-opacity duration-300" />

              {/* Metric */}
              <p className="font-mono text-3xl text-white mb-1 tabular-nums">
                {study.stat}
              </p>

              {/* Client */}
              <p className="font-body text-white/60 text-sm mb-2">
                {study.name}
              </p>

              {/* Description */}
              <p className="font-body text-white/20 text-xs leading-relaxed mb-4">
                {study.headline}
              </p>

              {/* Category tag */}
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-[rgba(153,27,27,0.08)] border border-[rgba(153,27,27,0.20)]">
                <span className="font-mono text-[10px] tracking-[0.06em] text-[#991B1B] uppercase">
                  {study.category}
                </span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### Task 13: Build Proof Mirror (Agent E — same agent)

**Files:**
- Create: `apps/landing/components/proof/proof-mirror.tsx`

Terminal-style readout of the same data.

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CASE_STUDIES } from "@/lib/testimonials";

export function ProofMirror() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="proof" className="relative py-32 bg-surface-1">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <span className="font-mono text-xs tracking-[0.08em] text-white/20">
            // PROOF_AUDIT v3.1
          </span>
        </motion.div>

        <div className="border border-white/[0.06] rounded-lg overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-white/[0.06] bg-white/[0.01]">
            <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider">Client</span>
            <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider">Metric</span>
            <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider">Category</span>
            <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider">Status</span>
          </div>

          {CASE_STUDIES.map((study, i) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.01] transition-colors"
            >
              <span className="font-mono text-xs text-white/40">{study.name}</span>
              <span className="font-mono text-sm text-white tabular-nums">{study.stat}</span>
              <span className="font-mono text-xs text-white/20 uppercase">{study.category}</span>
              <span className="font-mono text-xs text-[rgba(34,197,94,0.8)]">VERIFIED</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### Task 14: Build System Section (Agent F)

**Files:**
- Create: `apps/landing/components/system/system-a.tsx`

Five Layers with hover progress bars.

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const LAYERS = [
  {
    num: "01",
    title: "Content Engine",
    desc: "Engineered content extraction. We don't create — we systematize what you already produce into high-leverage assets.",
  },
  {
    num: "02",
    title: "Distribution",
    desc: "Multi-platform deployment across TikTok, Reels, Shorts, and X. Coordinated timing, not random posting.",
  },
  {
    num: "03",
    title: "Inbound Pipeline",
    desc: "Content drives strangers into your DMs, applications, and calls. Automated qualification filters noise.",
  },
  {
    num: "04",
    title: "Revenue Attribution",
    desc: "Every view traced to a dollar. Every piece of content measured against revenue, not vanity.",
  },
  {
    num: "05",
    title: "Compound Growth",
    desc: "Systems compound. Month 1 builds the engine. Month 3 the engine runs itself. Month 6 it accelerates.",
  },
];

export function SystemA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section ref={ref} id="system" className="relative py-32 bg-void">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="mb-4"
        >
          <span className="font-mono text-xs tracking-[0.08em]">
            <span className="text-white/20">// </span>
            <span className="text-[#991B1B]">THE SYSTEM</span>
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl md:text-5xl lg:text-6xl tracking-[-0.02em] mb-16"
        >
          Five Layers<span className="text-[#991B1B]">.</span> Zero Improvisation<span className="text-[#991B1B]">.</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {LAYERS.map((layer, i) => (
            <motion.div
              key={layer.num}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="group relative bg-white/[0.02] backdrop-blur-[12px] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.10] transition-all duration-300 hover:-translate-y-[3px]"
            >
              <div className="absolute top-0 left-4 right-4 h-[1px] bg-[#991B1B] opacity-0 group-hover:opacity-60 transition-opacity duration-300" />

              <span className="font-mono text-xs text-[#991B1B] mb-3 block">
                {layer.num} //
              </span>
              <h3 className="font-display text-lg text-white mb-2">
                {layer.title}
              </h3>
              <p className="font-body text-xs text-white/40 leading-relaxed mb-4">
                {layer.desc}
              </p>

              {/* Progress bar */}
              <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#991B1B]"
                  initial={{ width: "0%" }}
                  animate={{ width: hoveredIdx === i ? "100%" : "0%" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### Task 15: Build System Mirror (Agent F — same agent)

**Files:**
- Create: `apps/landing/components/system/system-mirror.tsx`

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const LAYERS = [
  { num: "01", name: "EXTRACTION_ENGINE", status: "ACTIVE", load: 94 },
  { num: "02", name: "DISTRIBUTION_MESH", status: "ACTIVE", load: 87 },
  { num: "03", name: "INBOUND_PIPELINE", status: "CALIBRATING", load: 72 },
  { num: "04", name: "REVENUE_ATTRIBUTION", status: "ACTIVE", load: 91 },
  { num: "05", name: "COMPOUND_GROWTH", status: "PENDING", load: 45 },
];

export function SystemMirror() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="system" className="relative py-32 bg-void">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="mb-12"
        >
          <span className="font-mono text-xs tracking-[0.08em] text-white/20">
            // TECHNICAL ARCHITECTURE v2.1 // Layer Status
          </span>
        </motion.div>

        <div className="space-y-3">
          {LAYERS.map((layer, i) => (
            <motion.div
              key={layer.num}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#991B1B]">{layer.num}</span>
                  <span className="font-mono text-sm text-white/60">{layer.name}</span>
                </div>
                <span className={`font-mono text-[10px] tracking-wider uppercase ${
                  layer.status === "ACTIVE" ? "text-[rgba(34,197,94,0.8)]" :
                  layer.status === "CALIBRATING" ? "text-[rgba(251,191,36,0.8)]" :
                  "text-white/20"
                }`}>
                  [{layer.status}]
                </span>
              </div>
              <div className="h-[3px] bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white/[0.15]"
                  initial={{ width: "0%" }}
                  animate={isInView ? { width: `${layer.load}%` } : {}}
                  transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p className="font-mono text-[10px] text-white/20 mt-2 text-right tabular-nums">
                {layer.load}% capacity
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### Task 16: Build Philosophy Section (Agent G)

**Files:**
- Create: `apps/landing/components/philosophy/philosophy-a.tsx`

Emotional typewriter with Playfair Display.

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const LINES = [
  { text: "Staying stuck doesn't feel expensive.", className: "text-white" },
  { text: "But it is.", className: "text-white" },
  { text: "You lose time, energy, opportunity, focus —", className: "text-white/60" },
  { text: "and worst of all, you normalize chaos.", className: "text-white/60" },
  { text: "This is how founders burn out quietly.", className: "text-[#991B1B]" },
];

export function PhilosophyA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="philosophy" className="relative py-40 bg-void">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="mb-12"
        >
          <span className="font-mono text-xs tracking-[0.08em]">
            <span className="text-white/20">// </span>
            <span className="text-[#991B1B]">PHILOSOPHY</span>
          </span>
        </motion.div>

        <div className="space-y-2">
          {LINES.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.2 + i * 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`font-display text-2xl md:text-4xl italic leading-relaxed ${line.className}`}
            >
              {line.text}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### Task 17: Build Philosophy Mirror (Agent G — same agent)

**Files:**
- Create: `apps/landing/components/philosophy/philosophy-mirror.tsx`

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function PhilosophyMirror() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="philosophy" className="relative py-32 bg-void">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="mb-12"
        >
          <span className="font-mono text-xs text-white/20 tracking-[0.08em]">
            // Thesis_v4.2 // Operational Inevitability
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-mono text-3xl md:text-4xl text-white uppercase tracking-tight leading-tight">
              Scale Is Not
              <br />A Creative Act
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <p className="font-body font-light text-white/40 leading-relaxed">
              Scale is the removal of human improvisation from repeatable processes.
              Creativity gets you to product-market fit. Systems get you to scale.
              These are different phases that require different thinking.
            </p>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
              <p className="font-mono text-[10px] text-white/20 uppercase tracking-wider mb-2">
                Internal Memo // Classification: Core Thesis
              </p>
              <p className="font-mono text-xs text-white/40 leading-relaxed">
                The founder who scales is the founder who replaces themselves
                in every repeatable function. Content production, distribution,
                lead qualification, appointment setting — each is a system,
                not a task. Build the system. Then remove yourself from it.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

---

### Task 18: Build Two-Track, Final CTA, Footer (Agent H)

**Files:**
- Create: `apps/landing/components/two-track.tsx`
- Create: `apps/landing/components/final-cta.tsx`
- Create: `apps/landing/components/footer.tsx`

**two-track.tsx:**

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";

const TRACKS = [
  {
    id: "main",
    title: "The Main Room",
    desc: "Full-stack attention system. Content engine + distribution + inbound pipeline + revenue attribution. For operators who want the machine.",
    features: ["Content extraction & production", "Multi-platform distribution", "Inbound pipeline automation", "Revenue attribution dashboard", "Dedicated team assignment"],
    cta: "Apply for Main Room",
    href: "/apply?track=main",
  },
  {
    id: "overflow",
    title: "The Overflow",
    desc: "Pure distribution. We clip, post, and distribute your existing content across platforms. Volume and visibility. No backend system.",
    features: ["Content clipping & editing", "TikTok / Reels / Shorts / X", "24-48 units daily", "Real-time posting schedule", "Fixed monthly retainer"],
    cta: "Apply for Overflow",
    href: "/apply?track=overflow",
  },
];

export function TwoTrack() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selected, setSelected] = useState("main");

  return (
    <section ref={ref} className="relative py-32 bg-surface-1">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="mb-4"
        >
          <span className="font-mono text-xs tracking-[0.08em]">
            <span className="text-white/20">// </span>
            <span className="text-[#991B1B]">TWO TRACKS</span>
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl md:text-5xl tracking-[-0.02em] mb-16"
        >
          Choose Your Access Point<span className="text-[#991B1B]">.</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRACKS.map((track, i) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setSelected(track.id)}
              className={`relative bg-white/[0.02] backdrop-blur-[12px] border rounded-xl p-8 cursor-pointer transition-all duration-300 ${
                selected === track.id
                  ? "border-[rgba(153,27,27,0.20)]"
                  : "border-white/[0.06] hover:border-white/[0.10]"
              }`}
            >
              {selected === track.id && (
                <div className="absolute top-0 left-4 right-4 h-[1px] bg-[#991B1B] opacity-60" />
              )}

              <h3 className="font-display text-2xl text-white mb-3">{track.title}</h3>
              <p className="font-body text-sm text-white/40 leading-relaxed mb-6">{track.desc}</p>

              <ul className="space-y-2 mb-8">
                {track.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#991B1B]" />
                    <span className="font-body text-xs text-white/40">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={track.href}
                className={`inline-block px-5 py-2.5 text-sm font-body font-medium rounded-lg transition-colors ${
                  track.id === "main"
                    ? "bg-[#991B1B] text-white hover:bg-[#991B1B]/90"
                    : "border border-white/[0.10] text-white/60 hover:text-white/80"
                }`}
              >
                {track.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**final-cta.tsx:**

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-36 md:py-44 bg-void overflow-hidden">
      {/* Subtle red glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px]"
        style={{
          background: "radial-gradient(ellipse, rgba(153,27,27,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl md:text-5xl lg:text-6xl tracking-[-0.02em] mb-6"
        >
          Stop Posting<span className="text-[#991B1B]">.</span>{" "}
          Start Operating<span className="text-[#991B1B]">.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-body font-light text-white/40 text-lg leading-relaxed mb-10 max-w-lg mx-auto"
        >
          We accept 3 clients per quarter. Minimum $50K/month revenue.
          The application takes under five minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/apply">
            <motion.span
              className="inline-block px-8 py-4 bg-[#991B1B] text-white font-body font-medium text-base rounded-lg cursor-pointer"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(153,27,27,0)",
                  "0 0 24px rgba(153,27,27,0.25)",
                  "0 0 0px rgba(153,27,27,0)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Apply Now
            </motion.span>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono text-[10px] text-white/20 mt-6 tracking-wider"
        >
          We review selectively. Not everyone gets a response.
        </motion.p>
      </div>
    </section>
  );
}
```

**footer.tsx:**

```tsx
// apps/landing/components/footer.tsx

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10 bg-void">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="font-body text-sm text-white/20 hover:text-white/40 transition-colors">
          LetMeScale<span className="text-[#991B1B]">.</span>
        </Link>
        <div className="flex items-center gap-6">
          <a href="#system" className="font-mono text-[10px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-wider">
            System
          </a>
          <a href="#proof" className="font-mono text-[10px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-wider">
            Results
          </a>
          <a href="#philosophy" className="font-mono text-[10px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-wider">
            Philosophy
          </a>
        </div>
        <span className="font-mono text-[10px] text-white/20">
          © 2026
        </span>
      </div>
    </footer>
  );
}
```

---

## WAVE 4: Assembly & Additional Variants (Parallel — 3 Agents)

### Task 19: Build page.tsx — Section Assembly (Agent I)

**Files:**
- Modify: `apps/landing/app/(site)/page.tsx`
- Modify: `apps/landing/app/(site)/layout.tsx`

This wires everything together. The page imports all new sections + legacy sections, defines the section registry, and renders them via DevNav.

```tsx
// apps/landing/app/(site)/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { DevNav } from "@/components/dev-nav";
import { loadVariants, saveVariants } from "@/lib/variants";
import type { SectionDef } from "@/lib/variants";

// ── New sections ──
import { HeroA } from "@/components/hero/hero-a";
import { Marquee } from "@/components/marquee";
import { ProofA } from "@/components/proof/proof-a";
import { ProofMirror } from "@/components/proof/proof-mirror";
import { SystemA } from "@/components/system/system-a";
import { SystemMirror } from "@/components/system/system-mirror";
import { PhilosophyA } from "@/components/philosophy/philosophy-a";
import { PhilosophyMirror } from "@/components/philosophy/philosophy-mirror";
import { TwoTrack } from "@/components/two-track";
import { FinalCTA } from "@/components/final-cta";
import { Footer } from "@/components/footer";

// ── Legacy sections (preserved for DevNav toggling) ──
import { HeroA as LegacyHeroA } from "@/components/sections-legacy/hero-a";
import { HeroB as LegacyHeroB } from "@/components/sections-legacy/hero-b";
import { HeroC as LegacyHeroC } from "@/components/sections-legacy/hero-c";
import { WhoIsFor as LegacyWhoIsFor } from "@/components/sections-legacy/who-is-for";
import { MirrorWhoIsFor as LegacyMirrorWhoIsFor } from "@/components/sections-legacy/mirror-who-is-for";
import { Disqualifier as LegacyDisqualifier } from "@/components/sections-legacy/disqualifier";
import { MirrorDisqualifier as LegacyMirrorDisqualifier } from "@/components/sections-legacy/mirror-disqualifier";
import { DisqualifierCheckmark as LegacyDisqualifierCheckmark } from "@/components/sections-legacy/disqualifier-checkmark";
import { WhatWeDo as LegacyWhatWeDo } from "@/components/sections-legacy/what-we-do";
import { MirrorWhatWeDo as LegacyMirrorWhatWeDo } from "@/components/sections-legacy/mirror-what-we-do";
import { TestimonialsCascade as LegacyTestimonialsCascade } from "@/components/sections-legacy/testimonials-cascade";
import { TestimonialsPhones as LegacyTestimonialsPhones } from "@/components/sections-legacy/testimonials-phones";
import { Results as LegacyResults } from "@/components/sections-legacy/results";
import { HowWeEngage as LegacyHowWeEngage } from "@/components/sections-legacy/how-we-engage";
import { MirrorHowWeEngage as LegacyMirrorHowWeEngage } from "@/components/sections-legacy/mirror-how-we-engage";
import { Philosophy as LegacyPhilosophy } from "@/components/sections-legacy/philosophy";
import { MirrorPhilosophy as LegacyMirrorPhilosophy } from "@/components/sections-legacy/mirror-philosophy";
import { WhyThisWorks as LegacyWhyThisWorks } from "@/components/sections-legacy/why-this-works";
import { MirrorWhyThisWorks as LegacyMirrorWhyThisWorks } from "@/components/sections-legacy/mirror-why-this-works";
import { SecondaryRoom as LegacySecondaryRoom } from "@/components/sections-legacy/secondary-room";
import { MirrorSecondaryRoom as LegacyMirrorSecondaryRoom } from "@/components/sections-legacy/mirror-secondary-room";
import { FinalCTA as LegacyFinalCTA } from "@/components/sections-legacy/final-cta";
import { MirrorFinalCTA as LegacyMirrorFinalCTA } from "@/components/sections-legacy/mirror-final-cta";

// ── Component registry ──
const COMPONENTS: Record<string, Record<string, React.FC>> = {
  hero: {
    A: HeroA,
    "Legacy A": LegacyHeroA,
    "Legacy B": LegacyHeroB,
    "Legacy C": LegacyHeroC,
  },
  marquee: {
    A: Marquee,
    Off: () => null,
  },
  proof: {
    A: ProofA,
    Mirror: ProofMirror,
    "Legacy Cascade": LegacyTestimonialsCascade,
    "Legacy Phones": LegacyTestimonialsPhones,
    "Legacy Results": LegacyResults,
  },
  "who-is-for": {
    Off: () => null,
    "Legacy A": LegacyWhoIsFor,
    "Legacy Mirror": LegacyMirrorWhoIsFor,
  },
  disqualifier: {
    Off: () => null,
    "Legacy A": LegacyDisqualifier,
    "Legacy Mirror": LegacyMirrorDisqualifier,
    "Legacy Check": LegacyDisqualifierCheckmark,
  },
  system: {
    A: SystemA,
    Mirror: SystemMirror,
    "Legacy WhatWeDo": LegacyWhatWeDo,
    "Legacy Mirror": LegacyMirrorWhatWeDo,
  },
  philosophy: {
    A: PhilosophyA,
    Mirror: PhilosophyMirror,
    "Legacy A": LegacyPhilosophy,
    "Legacy Mirror": LegacyMirrorPhilosophy,
  },
  "why-works": {
    Off: () => null,
    "Legacy A": LegacyWhyThisWorks,
    "Legacy Mirror": LegacyMirrorWhyThisWorks,
  },
  engage: {
    Off: () => null,
    "Legacy A": LegacyHowWeEngage,
    "Legacy Mirror": LegacyMirrorHowWeEngage,
  },
  "two-track": {
    A: TwoTrack,
    "Legacy Room": LegacySecondaryRoom,
    "Legacy Mirror": LegacyMirrorSecondaryRoom,
  },
  cta: {
    A: FinalCTA,
    "Legacy A": LegacyFinalCTA,
    "Legacy Mirror": LegacyMirrorFinalCTA,
  },
  footer: {
    A: Footer,
    Off: () => null,
  },
};

// ── Section definitions for DevNav ──
const SECTION_DEFS: SectionDef[] = Object.entries(COMPONENTS).map(([id, variants]) => ({
  id,
  label: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  variants: Object.keys(variants).map((k) => ({ key: k, label: k })),
  defaultVariant: Object.keys(variants)[0],
}));

const SECTION_ORDER = [
  "hero", "marquee", "proof", "who-is-for", "disqualifier",
  "system", "philosophy", "why-works", "engage", "two-track", "cta", "footer",
];

export default function HomePage() {
  const [variants, setVariants] = useState<Record<string, string>>(() =>
    Object.fromEntries(SECTION_DEFS.map((s) => [s.id, s.defaultVariant]))
  );
  const [mounted, setMounted] = useState(false);

  // Load saved variants on mount
  useEffect(() => {
    const loaded = loadVariants(SECTION_DEFS);
    setVariants(loaded);
    setMounted(true);
  }, []);

  const onVariantChange = useCallback((sectionId: string, variantKey: string) => {
    setVariants((prev) => {
      const next = { ...prev, [sectionId]: variantKey };
      saveVariants(next);
      return next;
    });
  }, []);

  if (!mounted) return null; // Prevent flash of wrong variants

  return (
    <main>
      <DevNav
        sections={SECTION_DEFS}
        variants={variants}
        onVariantChange={onVariantChange}
      />

      {SECTION_ORDER.map((id) => {
        const Component = COMPONENTS[id]?.[variants[id]];
        return Component ? <Component key={id + variants[id]} /> : null;
      })}
    </main>
  );
}
```

**Update (site)/layout.tsx** — remove inline footer (now a component), keep Nav + ScrollProgress:

```tsx
import { Nav } from "@/components/nav";
import { ScrollProgress } from "@/components/scroll-progress";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <Nav />
      {children}
    </>
  );
}
```

---

### Task 20: Build Hero B + Hero C (Agent J)

**Files:**
- Create: `apps/landing/components/hero/hero-b.tsx`
- Create: `apps/landing/components/hero/hero-c.tsx`

**hero-b.tsx** — Cinematic fullwidth:

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function HeroB() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-void">
      {/* Gradient mesh background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(153,27,27,0.06) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(3rem,8vw,7.5rem)] leading-[0.88] tracking-[-0.02em] mb-8"
        >
          We Build <em className="relative">Attention</em>
          <br />
          That Produces Direct ROI<span className="text-[#991B1B]">.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-body font-light text-white/40 text-xl max-w-lg mx-auto leading-relaxed mb-12"
        >
          Premium content distribution for creators and operators
          who expect measurable upside.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/apply"
            className="inline-block px-8 py-4 bg-[#991B1B] text-white font-body font-medium rounded-lg hover:bg-[#991B1B]/90 transition-colors"
          >
            Apply Now
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
```

**hero-c.tsx** — Centered animated blobs:

```tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Counter } from "@/components/counter";

export function HeroC() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-void">
      {/* Animated blobs */}
      {[
        { x: "30%", y: "25%", size: 400, delay: 0 },
        { x: "65%", y: "60%", size: 350, delay: 2 },
        { x: "45%", y: "45%", size: 300, delay: 4 },
      ].map((blob, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: blob.size,
            height: blob.size,
            left: blob.x,
            top: blob.y,
            background: `radial-gradient(circle, rgba(153,27,27,${0.08 + i * 0.02}) 0%, transparent 70%)`,
            filter: "blur(60px)",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, 30 * (i % 2 ? 1 : -1), 0],
            y: [0, -20 * (i % 2 ? -1 : 1), 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            delay: blob.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono text-xs text-white/20 uppercase tracking-[0.1em] mb-12"
        >
          What We've Built
        </motion.p>

        {/* Giant stats */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <Counter
              target={2.1}
              suffix="B+"
              decimals={1}
              tick
              tickInterval={1800}
              tickIncrement={0.001}
              className="text-7xl md:text-[8rem] font-mono text-white leading-none"
            />
            <p className="font-mono text-xs text-white/20 mt-2 uppercase tracking-wider">Views</p>
          </motion.div>

          <div className="hidden md:block w-[1px] h-16 bg-white/[0.06]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <Counter
              target={3.4}
              prefix="$"
              suffix="M+"
              decimals={1}
              tick
              tickInterval={2200}
              tickIncrement={0.01}
              className="text-7xl md:text-[8rem] font-mono text-white leading-none"
            />
            <p className="font-mono text-xs text-white/20 mt-2 uppercase tracking-wider">Revenue</p>
          </motion.div>

          <div className="hidden md:block w-[1px] h-16 bg-white/[0.06]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <span className="text-7xl md:text-[8rem] font-mono text-white leading-none tabular-nums">
              23.1<span className="text-4xl md:text-5xl">M+</span>
            </span>
            <p className="font-mono text-xs text-white/20 mt-2 uppercase tracking-wider">Peak Reach</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/apply"
            className="inline-block px-8 py-4 bg-[#991B1B] text-white font-body font-medium rounded-lg hover:bg-[#991B1B]/90 transition-colors"
          >
            Apply Now
          </Link>
          <p className="font-mono text-[10px] text-white/20 mt-3">
            2,400+ appointments booked
          </p>
        </motion.div>
      </div>
    </section>
  );
}
```

---

### Task 21: Move Legacy Sections & Fix Imports (Agent K)

**Files:**
- All files in `apps/landing/components/sections/` → `apps/landing/components/sections-legacy/`

```bash
cd /home/trajan/Desktop/Coding/Projects/letmescale/apps/landing/components
mkdir -p sections-legacy
# Copy all existing section files to legacy
cp sections/*.tsx sections-legacy/
```

Then verify each legacy file's imports still work (they import from `@letmescale/ui` and `@/components/counter` — paths that still exist). The legacy sections will have the old Inter font and old tokens but will still render since the CSS classes are utility-based.

---

## WAVE 5: Integration & Verification

### Task 22: Update scroll-progress.tsx

**Files:**
- Modify: `apps/landing/components/scroll-progress.tsx`

Update the red color to use #991B1B:

```tsx
"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#991B1B] z-[60] origin-left"
      style={{ scaleX }}
    />
  );
}
```

---

### Task 23: Final Build & Verify

Run:

```bash
cd /home/trajan/Desktop/Coding/Projects/letmescale
pnpm build
```

Then run dev and manually verify:

```bash
pnpm dev
```

Open http://localhost:3001 and check:
- [ ] Fonts load correctly (Playfair Display, Outfit, IBM Plex Mono)
- [ ] Background is #060608 void
- [ ] Grain overlay barely visible
- [ ] Hero A renders with grid, stats, red period
- [ ] Marquee scrolls infinitely
- [ ] DevNav appears bottom-left (green # button)
- [ ] DevNav opens, shows all sections with variant toggles
- [ ] Magnify button expands popup smoothly
- [ ] Prompt cards open modal, copy button works
- [ ] Legacy sections accessible via DevNav toggles
- [ ] All sections render without console errors
- [ ] Counters tick with jitter
- [ ] Scroll progress bar works
- [ ] Mobile responsive (resize to < 640px)

---

### Task 24: Commit Everything

```bash
git add -A
git commit -m "feat: complete landing page rebuild — new tokens, 3 fonts, 8 sections with variants, DevNav with magnify + prompt cards, legacy sections preserved"
```

---

## PARALLELIZATION MAP

```
WAVE 1 (Sequential): Tasks 1-6
  └─ Foundation: tokens, globals, layout, variants, legacy move, commit
       │
       ▼
WAVE 2 (4 Parallel Agents): Tasks 7-11
  ├─ Agent A: nav.tsx + counter.tsx (Tasks 7-8)
  ├─ Agent B: hero-a.tsx (Task 9)
  ├─ Agent C: marquee.tsx (Task 10)
  └─ Agent D: dev-nav.tsx (Task 11)
       │
       ▼
WAVE 3 (4 Parallel Agents): Tasks 12-18
  ├─ Agent E: proof-a.tsx + proof-mirror.tsx (Tasks 12-13)
  ├─ Agent F: system-a.tsx + system-mirror.tsx (Tasks 14-15)
  ├─ Agent G: philosophy-a.tsx + philosophy-mirror.tsx (Tasks 16-17)
  └─ Agent H: two-track.tsx + final-cta.tsx + footer.tsx (Task 18)
       │
       ▼
WAVE 4 (3 Parallel Agents): Tasks 19-21
  ├─ Agent I: page.tsx assembly + layout update (Task 19)
  ├─ Agent J: hero-b.tsx + hero-c.tsx (Task 20)
  └─ Agent K: legacy section migration (Task 21)
       │
       ▼
WAVE 5 (Sequential): Tasks 22-24
  └─ scroll-progress update, build verify, commit
```

**Total: 24 tasks across 5 waves. Waves 2-4 use parallel agents for maximum throughput.**

#letmescale #plans #archive
