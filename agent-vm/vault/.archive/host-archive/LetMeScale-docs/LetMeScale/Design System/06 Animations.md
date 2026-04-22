> See also: [[LetMeScale]]

# Animation System

## Philosophy

Animations should feel **inevitable**, not decorative. Every motion serves comprehension — revealing content at the right moment, creating reading rhythm, directing attention. The overall feeling should be smooth, unhurried, and precise.

**Speed:** Slower than typical. Most transitions are 300-800ms. Nothing should feel snappy or bouncy — this isn't a SaaS product.

**Triggers:** Primarily scroll-based (`useInView`). No animations on page load except the hero.

**Stack:** Framer Motion for orchestrated variants + CSS `@keyframes` for ambient loops. Lenis for smooth scrolling.

---

## Smooth Scrolling (Lenis)

**File:** `apps/landing/components/smooth-scroll.tsx`

Lenis provides smooth, momentum-based scrolling across the whole page. It wraps the app layout and uses `requestAnimationFrame` directly (no GSAP ticker).

```tsx
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  touchMultiplier: 2,
});

function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
```

Lenis respects `prefers-reduced-motion: reduce` and is disabled when the media query matches.

---

## Core Easing

**File:** `packages/ui/src/animations/presets.ts`

All presets share a single default easing curve:

```typescript
export const EASE = [0.16, 1, 0.3, 1]; // custom cubic-bezier — smooth deceleration
```

Exported transition helpers:

```typescript
export const smoothTransition: Transition = {
  duration: 0.6,
  ease: EASE,
};

export const springTransition: Transition = {
  type: "spring",
  damping: 30,
  stiffness: 300,
};
```

---

## Framer Motion Variant Presets

All presets are typed `Variants` from `framer-motion` and follow the `initial` / `animate` convention.

### Fade Variants

```typescript
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
```

### Blur Reveal

Content emerges from a gaussian blur — like focusing a lens. Used for important text blocks.

```typescript
export const blurReveal: Variants = {
  initial: { opacity: 0, filter: "blur(10px)" },
  animate: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
};
```

### Stagger Containers

```typescript
export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.12 },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// Slower variant for softer reveals
export const staggerContainerSlow: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.2 },
  },
};

export const staggerItemSoft: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};
```

### Slide Variants

```typescript
export const slideFromLeft: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
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
```

### Scale In

Subtle scale for cards and modals.

```typescript
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE } },
};
```

### Line Scale (Horizontal Rules)

Red or white lines that scale from center.

```typescript
export const lineScale: Variants = {
  initial: { scaleX: 0 },
  animate: { scaleX: 1, transition: { duration: 0.8, ease: EASE } },
};
```

### Scroll Reveal

Deeper vertical travel for scroll-triggered entrances.

```typescript
export const scrollReveal: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};
```

### Sharp Cut

Quick horizontal entrance for list items and sequential elements.

```typescript
export const sharpCut: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};
```

---

## Section-Specific Variants

### Hero: Word Stagger (`wordStagger` / `wordReveal`)

**File:** `apps/landing/components/sections/hero/hero.tsx`

The hero headline animates word-by-word with blur + vertical travel. Defined locally in the hero component:

```typescript
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
    transition: { duration: 0.7, ease: EASE },
  },
};
```

Usage:

```tsx
<motion.h1 variants={wordStagger} initial="initial" animate="animate">
  {["We", "Turn", "Attention"].map((word) => (
    <motion.span key={word} variants={wordReveal} className="inline-block mr-[0.25em]">
      {word}
    </motion.span>
  ))}
</motion.h1>
```

### Philosophy: Typewriter Cascade (`typewriterContainer` / `typewriterLine`)

**File:** `packages/ui/src/animations/presets.ts`

Lines reveal sequentially with a longer stagger delay, creating a reading-pace effect:

```typescript
export const typewriterContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.4, delayChildren: 0.2 } },
};

export const typewriterLine: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};
```

---

## Scroll Trigger Pattern

All section animations use `useInView` from Framer Motion:

```tsx
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { staggerContainer, fadeInUp } from "@letmescale/ui/animations";

function Section() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      variants={staggerContainer}
    >
      <motion.h2 variants={fadeInUp}>Headline</motion.h2>
      <motion.p variants={fadeInUp}>Body text</motion.p>
    </motion.section>
  );
}
```

**Key settings:**
- `once: true` — animation plays once, doesn't reset on scroll back
- `margin: "-100px"` — triggers when element is 100px into the viewport (not at the very edge)

---

## Hover Animations

### Card Hover

```tsx
import { hoverLift } from "@letmescale/ui/animations";

<motion.div
  whileHover={hoverLift}  // { y: -3, transition: { duration: 0.3, ease: "easeOut" } }
>
```

Very subtle — only 3px lift. No scale or rotation. Combined with CSS `hover:bg-white/[0.03] hover:border-white/[0.08]`.

### Glow Pulse

Ambient red glow for accent elements (stats, highlighted cards):

```typescript
export const glowPulse = {
  boxShadow: [
    "0 0 0px rgba(153,27,27,0)",
    "0 0 20px rgba(153,27,27,0.15)",
    "0 0 0px rgba(153,27,27,0)",
  ],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
};
```

### Button Hover

```tsx
<motion.button
  whileHover={{ scale: 1.01 }}
  whileTap={{ scale: 0.99 }}
  transition={{ duration: 0.2 }}
>
```

Nearly imperceptible scale — just enough tactile feedback.

---

## CSS Keyframe Animations

**File:** `apps/landing/app/globals.css`

Ambient loops that run continuously, independent of Framer Motion:

```css
@keyframes breathe {
  0%, 100% { opacity: 0.03; }
  50% { opacity: 0.06; }
}

@keyframes drift {
  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(2px, -3px) rotate(0.5deg); }
  66% { transform: translate(-1px, 2px) rotate(-0.3deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes ambient-border-breathe {
  0%, 100% { border-color: rgba(255, 255, 255, 0.03); }
  50% { border-color: rgba(255, 255, 255, 0.06); }
}

@keyframes ambient-stat-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(153, 27, 27, 0); }
  50% { box-shadow: 0 0 20px rgba(153, 27, 27, 0.15); }
}
```

Utility classes: `.animate-ambient-glow` (6s border breathe), `.animate-stat-pulse` (4s red glow).

---

## Counter Animation

For metrics and stat displays using Framer Motion springs:

```tsx
import { useSpring, useTransform, useInView } from "framer-motion";

function Counter({ target, duration = 2 }: { target: number; duration?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    if (isInView) spring.set(target);
  }, [isInView, spring, target]);

  const display = useTransform(spring, (v) => Math.floor(v).toLocaleString());

  return <motion.span ref={ref}>{display}</motion.span>;
}
```

---

## Parallax (Hero Only)

```tsx
const { scrollYProgress } = useScroll();
const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

<motion.div style={{ y }}>
  {/* Hero content moves slightly slower than scroll */}
</motion.div>
```

Parallax is used ONLY in the hero. All other sections scroll normally.

---

## Canonical Aliases

The presets file exports convenience aliases for common usage:

```typescript
export const fadeUp = fadeInUp;
export const stagger = staggerContainer;
export const staggerSlow = staggerContainerSlow;
export const staggerChild = staggerItem;
```

---

## Page Transitions

No page transitions. Pages load instantly with no enter/exit animations. The scroll-triggered section animations provide enough motion within each page.

---

## Reduced Motion

All CSS keyframe animations respect `prefers-reduced-motion: reduce` via a global media query that collapses durations to 0.01ms. Lenis smooth scrolling is disabled entirely when reduced motion is preferred.

---

## Performance Rules

1. **Use `will-change: transform`** only on parallax elements
2. **Never animate `width`, `height`, or `margin`** — use `transform` and `opacity` only
3. **`useInView` with `once: true`** — don't re-trigger animations
4. **Limit concurrent animations** — max 3 stagger children animating at once
5. **`backdrop-blur` is expensive** — don't animate blur values, only opacity
6. **Use `layout` animations sparingly** — only for tab indicators and filter transitions
7. **CSS keyframes for ambient loops** — keep Framer Motion for one-shot orchestration

#letmescale #design-system
