> See also: [[LetMeScale]]

# Brand Amplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify all 8 priority sections under one brand doctrine — cold authority, infrastructure positioning, zero agency tone — with 6 novel UI enhancements.

**Architecture:** Pure string replacements across 24 existing component files for copy upgrades. 4 new small components for novel enhancements. 1 DevNav modification for Command Mode. No structural changes to existing layouts.

**Tech Stack:** Next.js 15, React 19, Framer Motion 12, Tailwind CSS.

---

## Copy Replacement Convention

Every copy task uses the Edit tool with exact `old_string` → `new_string`. Subagents must match strings exactly including whitespace and JSX fragments.

---

### Task 1: Hero Copy — All 4 Variants

**Files:**
- Modify: `apps/landing/components/sections/hero-a.tsx`
- Modify: `apps/landing/components/sections/hero-b.tsx`
- Modify: `apps/landing/components/sections/hero-vsl.tsx`
- Modify: `apps/landing/components/sections-legacy/hero-editorial.tsx`

**hero-a.tsx replacements:**

1. `"Application only"` → `"By application"`
2. `"Not exposure."` → `"Not impressions."`
3. `"Not dopamine metrics."` → `"Not vanity."`
4. `"Request Access"` → `"Submit Application"`

**hero-b.tsx replacements:**

1. `"Application only"` → `"By application"`
2. `"Not exposure."` → `"Not impressions."`
3. `"Not dopamine metrics."` → `"Not vanity."`
4. `"Request Access"` → `"Submit Application"`

**hero-vsl.tsx replacements:**

1. `"Watch: 3 min breakdown"` → `"Documented result"`
2. Find the headline JSX. The current headline renders as "How We Generated $83K in 6 Days / With Zero Ad Spend". Replace the entire headline block so it reads: "One Client. Six Days. $83,212." with "$83,212" in red. Then the second line becomes "Zero Ad Spend. Engineered Organic Distribution. Fully Attributed."
3. `"No paid traffic. No funnels. Just engineered organic content that converts strangers into buyers."` → `"No paid traffic. No funnels. No luck. Fully attributed organic revenue."`
4. `"Watch the breakdown"` → `"View the proof"`
5. `"Apply Now"` → `"Submit Application"`
6. `"Skip to results"` → `"View all outcomes"`

**hero-editorial.tsx replacements:**

1. `"3 spots remaining this quarter"` → `"Intake closes quarterly"`

**Verify:** `cd apps/landing && npx next build 2>&1 | tail -5` — should compile successfully.

---

### Task 2: CTA Copy — All 3 Variants

**Files:**
- Modify: `apps/landing/components/final-cta.tsx`
- Modify: `apps/landing/components/sections/final-cta.tsx`
- Modify: `apps/landing/components/sections/mirror-final-cta.tsx`

**final-cta.tsx (original) replacements:**

1. `"Stop Posting"` → `"Stop Guessing"`
2. `"We accept 3 clients per quarter. Minimum $50K/month revenue. The application takes under five minutes."` → `"Quarterly intake is capped. Minimum $50K/month revenue. The application takes under five minutes."`
3. `"We review selectively. Not everyone gets a response."` → `"Applications are reviewed manually. Response is not guaranteed."`

**sections/final-cta.tsx replacements:**

1. Find the headline that reads "The application takes under five minutes." and replace with: "Five minutes. One application." with the period on "application" in red. The second part "That is the entire ask." as a new subheading line.
2. `"If you qualify, we'll walk you through exactly what we would change in your business. If you don't qualify, nothing happens."` → `"If you qualify, we walk you through exactly what changes in your business. If you do not qualify, nothing happens."`
3. `"This is for coaches, consultants, and info offer founders already making money and frustrated by inconsistency."` → `"This is for operators already generating revenue who need infrastructure, not more marketing."`
4. `"We review selectively. Not everyone gets a response."` → `"Applications are reviewed manually. Response is not guaranteed."`

**mirror-final-cta.tsx replacements:**

1. `"// PROTOCOL_SELECTION — v2.4.1"` → `"// PROTOCOL_SELECTION"`
2. The headline currently renders "SELECT ACCESS POINT" followed by a cursor "_". Replace the entire headline to just read `"SELECT_PROTOCOL"` with no trailing cursor element.
3. `"Two tracks available. Select protocol and submit request."` → `"Two protocols. Select and submit."`
4. `"Apply Main Protocol"` → `"Apply — Main Protocol"`
5. `"Apply Overflow Track"` → `"Apply — Overflow"`
6. `"SELECTIVE_REVIEW // ALL_APPLICATIONS_VERIFIED // END_OF_TRANSMISSION"` → `"SELECTIVE_REVIEW // ALL_APPLICATIONS_VERIFIED"`

**Verify:** Build check.

---

### Task 3: Proof / Testimonials Copy

**Files:**
- Modify: `apps/landing/components/sections/testimonials-cascade.tsx`
- Modify: `apps/landing/components/sections/results.tsx`

**testimonials-cascade.tsx replacements:**

1. Find the intro subtitle line that contains both "Exposed metrics." and "Scroll through each story." The first part should become `"Six operators. Exposed dashboards. Verified revenue."` and the second line `"Scroll through each story."` should be completely removed from the JSX.

**results.tsx replacements:**

1. `"$3.4M+ Generated. "` → `"$3.4M Attributed. "`
2. `"2.1B+ Views."` → `"2.1B Distributed."`
3. `"Our team has generated over $3.4 million in revenue, driven over 2.1 billion views, and booked over 2,400 qualified appointments for a small group of coaching and info offer businesses."` → `"Over $3.4 million in attributed revenue. Over 2.1 billion views distributed. Over 2,400 qualified appointments booked. A small group of operators. Exposed data."`

**Verify:** Build check.

---

### Task 4: Disqualifier Copy — All 3 Variants

**Files:**
- Modify: `apps/landing/components/sections/disqualifier.tsx`
- Modify: `apps/landing/components/sections/mirror-disqualifier.tsx`
- Modify: `apps/landing/components/sections/disqualifier-checkmark.tsx`

**disqualifier.tsx replacements:**

1. The headline has two parts. Replace `"If you are not already selling something, "` → `"If you do not have a proven offer, "` and `"please leave."` → `"this page is not for you."`
2. `"Let me save us both some time. This is not for everyone — and that is by design."` → `"This infrastructure requires existing revenue signal to function. Qualification is not optional."`

**mirror-disqualifier.tsx replacements:**

1. `"Our systems require established signal to function. If you are still figuring out your offer, this infrastructure will fail. We only scale what is already working."` → `"The system calibrates against existing revenue. Without signal, there is nothing to scale. We do not build foundations. We scale what already works."`

**disqualifier-checkmark.tsx replacements:**

1. `"This is selective by design."` → `"Qualification is binary."`
2. `"We only take on operators where our system can produce measurable ROI. Here is how to know if this is for you."` → `"The system requires specific operating conditions. This is how to know if you qualify."`

**Verify:** Build check.

---

### Task 5: System Copy — 4 Key Variants

**Files:**
- Modify: `apps/landing/components/system/system-a.tsx`
- Modify: `apps/landing/components/system/system-b.tsx`
- Modify: `apps/landing/components/system/system-d.tsx`
- Modify: `apps/landing/components/system/system-mirror.tsx`

**system-a.tsx replacements:**

1. `"This Isn't a Service"` → `"This Is Not a Service"`
2. `"It's a Machine"` → `"It Is Infrastructure"`

**system-b.tsx replacements:**

1. `"One machine"` → `"One operating system"`

**system-d.tsx replacements:**

1. `"Most agencies explain"` → `"Agencies describe"`
2. The second headline part: find `"We'll show you what changes"` → `"We install"`

**system-mirror.tsx replacements:**

1. `"CALIBRATING"` → `"ACTIVE"` (replace all occurrences — there are 2, one in the layer card for INBOUND_PIPELINE and one in the legend)
2. `"PENDING"` → `"ACTIVE"` (replace all occurrences — there are 2, one in COMPOUND_GROWTH and one in the legend)
3. `"SYSTEM_LOAD: NOMINAL // LAST_SYNC: 2.4s AGO"` → `"SYSTEM_LOAD: NOMINAL // ALL_LAYERS: ACTIVE"`
4. Remove the legend color entries for CALIBRATING (amber) and PENDING (white) — keep only the ACTIVE (green) legend item. This requires removing two JSX blocks from the legend.

**Verify:** Build check.

---

### Task 6: Two-Track + Secondary Room Copy

**Files:**
- Modify: `apps/landing/components/two-track.tsx`
- Modify: `apps/landing/components/sections/secondary-room.tsx`
- Modify: `apps/landing/components/sections/mirror-secondary-room.tsx`

**two-track.tsx replacements:**

1. `"Choose Your Access Point"` → `"Two Protocols. One Application"`
2. `"Full ROI system"` → `"Full-stack revenue infrastructure"`
3. `"Pure distribution"` → `"Distribution-only protocol"`
4. `"Apply for Main Room"` → `"Apply — Main Protocol"`
5. `"Apply for Overflow"` → `"Apply — Overflow"`

**secondary-room.tsx replacements:**

1. `"Not For Everyone"` → `"Selective Access"`
2. `"This is not for people who want hacks, people who want to stay in control of everything, people who refuse structure. This is for founders who want leverage."` → `"This is not for operators who want shortcuts, operators who refuse structure, or operators who confuse control with involvement. This is for founders who want infrastructure."`

**mirror-secondary-room.tsx replacements:**

1. `"View Tracking Protocols"` → `"Submit Application"`

**Verify:** Build check.

---

### Task 7: Philosophy Copy — All 4 Variants

**Files:**
- Modify: `apps/landing/components/philosophy/philosophy-a.tsx`
- Modify: `apps/landing/components/philosophy/philosophy-mirror.tsx`
- Modify: `apps/landing/components/sections/philosophy.tsx`
- Modify: `apps/landing/components/sections/mirror-philosophy.tsx`

**philosophy-a.tsx replacements:**

1. `"You lose time, energy, opportunity, focus —"` → `"You lose time. Revenue. Leverage. Focus."`
2. `"and worst of all, you normalize chaos."` → `"And worst of all, you stop noticing."`
3. `"This is how founders burn out quietly."` → `"That is how operators stall."`

**philosophy-mirror.tsx replacements:**

1. `"// Thesis_v4.2 // Operational Inevitability"` → `"// Operational Inevitability"`

**sections/philosophy.tsx replacements:**

Same 3 replacements as philosophy-a.tsx:
1. `"You lose time, energy, opportunity, focus —"` → `"You lose time. Revenue. Leverage. Focus."`
2. `"and worst of all, you normalize chaos."` → `"And worst of all, you stop noticing."`
3. `"This is how founders burn out quietly."` → `"That is how operators stall."`

**sections/mirror-philosophy.tsx replacements:**

1. `"Thesis_v4.2 // Operational Inevitability"` → `"Operational Inevitability"`

**Verify:** Build check.

---

### Task 8: Who-Is-For Copy — Both Variants

**Files:**
- Modify: `apps/landing/components/sections/who-is-for.tsx`
- Modify: `apps/landing/components/sections/mirror-who-is-for.tsx`

**who-is-for.tsx replacements:**

1. `"Coaches & Info Offer Founders "` → `"Operators Who Have Revenue "`
2. `"Frustrated by Inconsistency."` → `"But Not Infrastructure."`
3. `"You already make money. You have proof. But revenue is still unpredictable and the business is quietly becoming dependent on you."` → `"You sell. You close. You deliver. But revenue is unpredictable and the business runs on you."`
4. `"You sell coaching, consulting, or info offers"` → `"You sell coaching, consulting, or information products"`
5. `"You already make money and have clients"` → `"You have revenue and proof of concept"`
6. `"Revenue feels inconsistent, chaotic, dependent on you"` → `"Revenue is real but unpredictable. The business depends on you."`
7. `"You care about conversion, not applause"` → `"You measure revenue, not impressions"`

**mirror-who-is-for.tsx — no changes needed.** The Mirror variant ("The Quiet Protocol") is already on-brand.

**Verify:** Build check.

---

### Task 9: Protocol Status Bar (Novel Enhancement)

**Files:**
- Create: `apps/landing/components/protocol-bar.tsx`
- Modify: `apps/landing/app/(site)/page.tsx` — add to layout

Create a thin fixed bar at the top of the viewport. Shows: `PROTOCOL: ACTIVE // INTAKE: OPEN // QUEUE: 3`. Disappears on scroll-down, reappears on scroll-up (like a smart navbar).

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

export function ProtocolBar() {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    if (y < 100) {
      setVisible(true);
    } else if (y > lastY.current) {
      setVisible(false); // scrolling down
    } else {
      setVisible(true); // scrolling up
    }
    lastY.current = y;
  });

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: visible ? 0 : -40 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-[60] h-8 flex items-center justify-center bg-[#060608]/80 backdrop-blur-sm border-b border-white/[0.04]"
    >
      <p className="font-mono text-[10px] tracking-[0.15em] text-white/20 uppercase">
        Protocol: <span className="text-white/40">Active</span>
        <span className="mx-3 text-white/10">//</span>
        Intake: <span className="text-white/40">Open</span>
        <span className="mx-3 text-white/10">//</span>
        Queue: <span className="text-[#991B1B]/60">3</span>
      </p>
    </motion.div>
  );
}
```

In `page.tsx`, import and render `<ProtocolBar />` right before `<DevNav .../>` inside `<main>`.

**Verify:** Build check. Bar should appear at top and hide on scroll-down.

---

### Task 10: Confidence Meter (Novel Enhancement)

**Files:**
- Create: `apps/landing/components/confidence-meter.tsx`
- Modify: `apps/landing/app/(site)/page.tsx` — add to layout

A fixed right-edge vertical bar (thin, 2px) that fills from bottom to top as the visitor scrolls through the page. Starts empty, reaches 100% at the CTA section, then fades out.

```typescript
"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function ConfidenceMeter() {
  const { scrollYProgress } = useScroll();
  const height = useTransform(scrollYProgress, [0, 0.85], ["0%", "100%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.85, 0.95], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{ opacity }}
      className="fixed right-3 top-1/2 -translate-y-1/2 w-[2px] h-[30vh] z-50 hidden lg:block"
    >
      <div className="w-full h-full bg-white/[0.04] rounded-full overflow-hidden relative">
        <motion.div
          style={{ height }}
          className="absolute bottom-0 left-0 w-full bg-[#991B1B]/30 rounded-full"
        />
      </div>
    </motion.div>
  );
}
```

In `page.tsx`, import and render `<ConfidenceMeter />` right after ProtocolBar.

**Verify:** Build check. Thin red bar on right edge fills as you scroll.

---

### Task 11: System Depth Indicator (Novel Enhancement)

**Files:**
- Modify: `apps/landing/components/system/system-a.tsx`

Add a left-edge depth bar to each system card that pulses once when the card scrolls into view — like a system coming online. This is a small addition to the existing card component.

In system-a.tsx, each card already has a `motion.div` with `ref` and `inView`. Add inside each card, as the first child:

```tsx
{/* Depth indicator */}
<motion.div
  initial={{ scaleY: 0, opacity: 0 }}
  animate={inView ? { scaleY: 1, opacity: [0, 1, 0.3] } : undefined}
  transition={{ duration: 0.8, delay: 0.2 + index * 0.15, ease: [0.16, 1, 0.3, 1] }}
  className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#991B1B]/40 origin-top"
/>
```

Each card needs to be `relative` positioned (they likely already are). The `index` variable should be the card's position (0-4).

**Verify:** Build check. Cards show a red left-edge pulse on scroll entry.

---

### Task 12: Application Gravity (Novel Enhancement)

**Files:**
- Modify: `apps/landing/components/final-cta.tsx`

Add magnetic cursor pull to the CTA button. When cursor is within 100px, the button translates 2-3px toward the cursor.

Add this hook and apply it to the Apply button:

```typescript
import { useMotionValue, useSpring, motion } from "framer-motion";

// Inside the component, before the return:
const btnRef = useRef<HTMLAnchorElement>(null);
const x = useMotionValue(0);
const y = useMotionValue(0);
const springX = useSpring(x, { stiffness: 300, damping: 30 });
const springY = useSpring(y, { stiffness: 300, damping: 30 });

useEffect(() => {
  const el = btnRef.current;
  if (!el) return;
  const handleMove = (e: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 120) {
      const pull = (1 - dist / 120) * 3;
      x.set(dx * pull / dist * (dist > 0 ? 1 : 0));
      y.set(dy * pull / dist * (dist > 0 ? 1 : 0));
    } else {
      x.set(0);
      y.set(0);
    }
  };
  window.addEventListener("mousemove", handleMove);
  return () => window.removeEventListener("mousemove", handleMove);
}, [x, y]);
```

Then wrap the CTA `<a>` tag in a `<motion.a>` with `ref={btnRef}` and `style={{ x: springX, y: springY }}`.

**Verify:** Build check. On desktop, CTA button subtly shifts toward cursor when nearby.

---

### Task 13: DevNav Command Mode

**Files:**
- Modify: `apps/landing/components/dev-nav.tsx`

Add a "Command Mode" toggle to DevNav. When toggled:
- Panel scales to 1.5x
- Font sizes increase proportionally (via CSS scale transform)
- Border glow intensifies for 0.3s then settles
- State persisted in localStorage

Implementation: Add a state variable `commandMode` with localStorage persistence. The popup panel wrapper gets:

```typescript
const [commandMode, setCommandMode] = useState(false);

// On mount, read from localStorage
useEffect(() => {
  const stored = localStorage.getItem("letmescale-command-mode");
  if (stored === "true") setCommandMode(true);
}, []);

// Toggle handler
const toggleCommand = () => {
  const next = !commandMode;
  setCommandMode(next);
  localStorage.setItem("letmescale-command-mode", String(next));
};
```

The popup panel wrapper div gets these additional classes/styles:

```typescript
style={{
  transform: commandMode ? "scale(1.5)" : "scale(1)",
  transformOrigin: "bottom left",
  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
}}
className={`... ${commandMode ? "shadow-[0_0_30px_rgba(153,27,27,0.15)]" : ""}`}
```

Add the toggle button at the very top of the popup panel, before the Pages section:

```tsx
<button
  onClick={toggleCommand}
  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-mono tracking-wider uppercase transition-colors ${
    commandMode
      ? "bg-[#991B1B]/10 text-[#991B1B]/60 border border-[#991B1B]/20"
      : "bg-white/[0.02] text-white/20 border border-white/[0.04]"
  }`}
>
  <span>Command Mode</span>
  <span>{commandMode ? "ON" : "OFF"}</span>
</button>
```

Also replace the existing "Magnify" / "Minimize" labels in DevNav with "Command" / "Standard" to match the new language.

**Verify:** Build check. DevNav toggle scales panel 1.5x from bottom-left origin.

---

### Task 14: Final Build Verification + Cleanup

**Files:**
- All modified files from Tasks 1-13

**Step 1:** Run full build: `rm -rf .next && npx next build 2>&1 | tail -20`

**Step 2:** Verify no TypeScript errors, all 8 pages generate.

**Step 3:** Spot-check: grep for any remaining banned vocabulary across all modified files:
```bash
grep -rn "leverage\|unlock\|empower\|elevate\|game-changing\|cutting-edge\|synergy\|optimize\b" apps/landing/components/ --include="*.tsx" | grep -v node_modules
```

If any found, replace with brand-approved vocabulary.

---

## File Manifest

| Task | Files Modified | Type |
|------|---------------|------|
| 1 | hero-a, hero-b, hero-vsl, hero-editorial | Copy |
| 2 | final-cta (orig), final-cta (sections), mirror-final-cta | Copy |
| 3 | testimonials-cascade, results | Copy |
| 4 | disqualifier, mirror-disqualifier, disqualifier-checkmark | Copy |
| 5 | system-a, system-b, system-d, system-mirror | Copy |
| 6 | two-track, secondary-room, mirror-secondary-room | Copy |
| 7 | philosophy-a, philosophy-mirror, philosophy (sections), mirror-philosophy | Copy |
| 8 | who-is-for | Copy |
| 9 | NEW protocol-bar.tsx + page.tsx | Enhancement |
| 10 | NEW confidence-meter.tsx + page.tsx | Enhancement |
| 11 | system-a.tsx | Enhancement |
| 12 | final-cta.tsx | Enhancement |
| 13 | dev-nav.tsx | Enhancement |
| 14 | All files | Verification |

## Parallelization

**Batch A (copy — all independent):** Tasks 1-8 can all run in parallel.
**Batch B (enhancements — mostly independent):** Tasks 9-13 can run in parallel (except 12 modifies final-cta which Task 2 also touches — run 12 after 2).
**Batch C:** Task 14 runs last.

#letmescale #plans #archive
