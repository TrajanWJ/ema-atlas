---
date: 2026-03-20
tags: [animation, css, gsap, lenis, rive, webgl, clip-path, marquee, scroll, webflow, place-org, research]
status: active
---

# Research - landonorris.com Technical Deep Dive

> Exhaustive technical teardown of landonorris.com for place.org portfolio and immersive page patterns.
> Built by OFF+BRAND studio (Glasgow/London). Won Awwwards SOTM, SOTD, and FWA of the Day.
> Platform: Webflow. Featured in GSAP Showreel 2024.

Related: [[Research - Web Animation Techniques 2025-2026 place.org]] | [[Research - place.org Experimental UI Inspiration Deep Dive]] | [[My Stack Decisions]]

---

## Site Overview

**URL:** https://landonorris.com
**Builder:** OFF+BRAND (itsoffbrand.com)
**Platform:** Webflow (confirmed via `.w-mod-js`, `wf-design-mode` classes, Webflow's CDN)
**Awards:** Awwwards SOTM + SOTD + FWA of the Day
**GSAP Showreel:** Featured 2024

**Tech stack confirmed from source:**
- Webflow (CMS + hosting)
- Lenis (smooth scroll — confirmed via `html.lenis` class and `[data-lenis-prevent]` attributes)
- GSAP + ScrollTrigger (confirmed via Awwwards listing and GSAP Showreel)
- GSAP SplitText (confirmed via `[split-text]` and `[split-rich-text]` data attributes)
- Rive (confirmed via `canvas[data-rive-object]`, `canvas[data-rive-primary]` elements)
- WebGL for 3D helmet rendering (confirmed via webgpu.com showcase listing)
- Google Analytics GA4 (`G-P8L2KTXDN0`)

**Page sections (top to bottom):**
1. Full-screen hero — "Lando Norris / 2025 McLaren Formula 1 Driver" — video + GSAP intro
2. "Message from Lando" personal statement section
3. Horizontal scroll gallery (candid moments — Qatar, Miami, Monaco, Britain, etc.)
4. F1 season stats / calendar section
5. Helmets Hall of Fame (helmet grid with hover reveals)
6. Additional content / race schedule
7. Footer with SVG mask reveal

---

## 1. CSS Architecture

### Core Custom Properties

```css
/* Easing */
--cubic-default: cubic-bezier(0.65, 0.05, 0, 1);
--duration-default: 0.75s;
--animation-default: 0.75s cubic-bezier(0.65, 0.05, 0, 1);

/* Layout */
--section-padding: calc(3.5rem + (var(--gap) * 2));
--container-padding: 2rem;
--nav-height: calc(3.75rem + (var(--gap) * 2));
```

### Color Palette (CSS Custom Properties)

```css
--color--lime           /* primary accent — F1 McLaren papaya-adjacent lime green */
--color--lime-off       /* muted lime variant */
--color--dark-green     /* primary dark background */
--color--white
--color--black
--color--grey-1
--color--grey-2
--color--grey-on-track
--color--green-off-white-2
```

**Focus ring:** `outline: 2px solid var(--color--lime); outline-offset: 2px`

### Theme System — Data Attributes

Three page-level themes applied via `data-theme` on sections:

```css
[data-theme="dark"]  → background: var(--color--dark-green)
[data-theme="light"] → color: var(--color--black)
[data-theme="lime"]  → lime background treatment, inverted text
```

Nav adapts independently:
```css
[data-nav-theme="light"] → logo fills var(--color--grey-2), var(--color--grey-1)
[data-nav-theme="dark"]  → logo/middle fill var(--color--dark-green)
```

Footer has its own theme:
```css
[data-footer-theme="white"]  → background: var(--color--white)
[data-footer-theme="black"]  → background: var(--color--black)
[data-footer-theme="green"]  → background: var(--color--dark-green)
```

Transition timing for all theme switches: `var(--animation-default)` (0.75s cubic-bezier).

### Fluid Typography System

The font scaling formula derives from a custom viewport interpolation — not standard `clamp()`:

```css
/* Desktop (≥992px) */
:root {
  --min-width:    992px;
  --max-width:   1920px;
  --design-width: 1728;     /* base design canvas width */
  --design-unit:    16;     /* base unit in px */
  --scale-factor:    1;

  /* Derived fluid container — clamps viewport between min/max */
  --fluid-container: clamp(var(--min-width), 100vw, var(--max-width));

  /* The fluid font unit — scales proportionally to viewport */
  --fluid-font: calc(
    var(--fluid-container) / var(--design-width) * var(--design-unit) * var(--scale-factor)
  );
}

/* Tablet (768px–991px) */
@media screen and (max-width: 991px) {
  :root {
    --min-width:    768px;
    --max-width:    991px;
    --design-unit:   20;   /* unit bumps up — text reads bigger on smaller viewport */
  }
}

/* Mobile landscape (480px–767px) */
@media screen and (max-width: 767px) {
  :root {
    --min-width:  480px;
    --max-width:  767px;
  }
}

/* Mobile portrait (≤479px) */
@media screen and (max-width: 479px) {
  :root {
    --min-width:  320px;
    --max-width:  479px;
    --design-unit: 48;  /* largest unit — impact text is proportionally huge on small screens */
  }
}
```

**Impact text example:**
```css
.text-impact-lg { font-size: 8.25rem; line-height: 83%; }
```
(Relative to `--fluid-font`, so it scales with viewport.)

**Fonts:**
- `Brier` — impact/display text (large headlines)
- `Mona` — body / medium weight
- Global: `text-wrap: pretty; -webkit-font-smoothing: antialiased`

### Responsive Visibility System

Uses data attributes rather than utility classes:

```css
/* Applied inside appropriate breakpoint media queries */
[data-hide="d"]  { display: none !important; }  /* hide on desktop */
[data-hide="t"]  { display: none !important; }  /* hide on tablet */
[data-hide="ml"] { display: none !important; }  /* hide on mobile landscape */
[data-hide="m"]  { display: none !important; }  /* hide on mobile portrait */

/* Other utility attributes */
[display-none]       { display: none; }
[visibility-hidden]  { visibility: hidden; }
[pointer-none]       { pointer-events: none; }
[pointer-auto]       { pointer-events: auto; }
[overflow-clip="x"]  { overflow-x: clip; }
[overflow-clip="y"]  { overflow-y: clip; }
[screen-reader]      { /* visually hidden, accessible */ }
```

### Global Resets Worth Noting

```css
/* Scrollbar hidden everywhere */
body ::-webkit-scrollbar { display: none; }
body { -ms-overflow-style: none; }
html { scrollbar-width: none; }

/* SVG normalization */
:where(svg) {
  height: 100%;
  width: 100%;
  max-width: none;
  vertical-align: middle;
}

/* Selection */
img::selection, svg::selection { background: transparent; }
```

---

## 2. Lenis Smooth Scroll

### How It's Integrated (Webflow pattern)

Lenis is loaded as a custom script in Webflow. The CSS classes confirm integration:

```css
/* Lenis applies these classes to html/body */
html.lenis,
html.lenis body { height: auto; }

/* Prevent nested scroll containers from propagating */
.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

/* When lenis is stopped (e.g., modal open), clip overflow */
.lenis.lenis-stopped { overflow: clip; }

/* iframe scroll hijack prevention */
.lenis.lenis-smooth iframe { pointer-events: none; }
```

### Recommended Configuration (Production Pattern)

Based on the GSAP synchronization requirement and the site's scrub-heavy animations:

```javascript
const lenis = new Lenis({
  duration: 1.2,        // seconds — how long a scroll "flick" takes to decelerate
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // default exponential decay
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  syncTouch: true,      // mimics native iOS momentum on touch
});

// GSAP sync — critical for ScrollTrigger scrub accuracy
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);
```

**Key parameter notes:**
- `duration: 1.2` is the Lenis standard sweet spot — feels premium, not sluggish
- `syncTouch: true` — without this, iOS momentum and Lenis momentum fight each other
- `gsap.ticker.lagSmoothing(0)` — prevents GSAP from trying to "catch up" after tab switch, which breaks Lenis sync
- `[data-lenis-prevent]` attribute on any element that should use native scroll (e.g., a code block inside a modal)

### Preventing Lenis on Specific Elements

```html
<!-- Add this attribute to any scrollable sub-container that should scroll natively -->
<div data-lenis-prevent>
  <!-- nested content with its own scroll -->
</div>
```

---

## 3. GSAP Usage

### Plugins Used

```javascript
gsap.registerPlugin(ScrollTrigger, SplitText);
// MorphSVG likely used for helmet transitions (inferred from 3D helmet rotations)
```

### SplitText Scroll Reveals

The `[split-text]` and `[split-rich-text]` data attributes indicate Webflow custom code that initializes SplitText on page load:

**Line mask reveal (the pattern used for large display text):**

```javascript
// Modern SplitText API (GSAP 3.12+ — now free)
SplitText.create("[split-text]", {
  type: "lines,words",
  mask: "lines",       // creates overflow: clip wrapper per line — words slide up from beneath
  autoSplit: true,     // re-splits on resize
  onSplit(self) {
    return gsap.from(self.lines, {
      yPercent: 110,    // starts below the mask (line height + extra)
      opacity: 0,
      stagger: 0.06,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: self.elements[0],
        start: "top 85%",
        once: true,
      }
    });
  }
});
```

**Character-level stagger for impact text:**

```javascript
SplitText.create("[split-text].is-chars", {
  type: "chars",
  charsClass: "char",
  onSplit(self) {
    return gsap.from(self.chars, {
      opacity: 0,
      y: 20,
      rotateX: -40,
      stagger: 0.025,
      duration: 0.6,
      ease: "back.out(1.2)",
      scrollTrigger: {
        trigger: self.elements[0],
        start: "top 80%",
        once: true,
      }
    });
  }
});
```

### ScrollTrigger — Nav Theme Changes

The nav theme switches based on which section is currently in view. The `[data-nav-theme]` attribute on sections drives this:

```javascript
// Inferred from data-nav-group, data-nav-theme-target attributes
document.querySelectorAll('[data-nav-theme]').forEach(section => {
  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom top",
    onEnter: () => setNavTheme(section.dataset.navTheme),
    onEnterBack: () => setNavTheme(section.dataset.navTheme),
  });
});
```

### GSAP Animation High Priority (`[data-anim-high]`)

Elements with this attribute animate with reduced delay/priority — used for above-the-fold hero content that must animate immediately without waiting for scroll.

---

## 4. Helmet Hover Reveal (Clip-Path)

This is the standout interaction. Each helmet has:
1. A base image (always visible)
2. A reveal image (hidden by clip-path ellipse, grows on hover)

### The Exact CSS

```css
/* Reveal image starts clipped to nothing at the top */
.helmet-grid-item-reveal-img {
  clip-path: ellipse(60% 0% at 50% 0%);
  transform: scale(0.95);
  transition:
    clip-path var(--animation-default),   /* 0.75s cubic-bezier(0.65, 0.05, 0, 1) */
    transform var(--animation-default);
}

/* On hover: ellipse expands to cover the full card */
[data-helmet-item]:hover .helmet-grid-item-reveal-img {
  clip-path: ellipse(100% 120% at 50% 0%);
  transform: scale(1);
}

/* Base image scales slightly on hover */
.helmet-grid-item-w:hover .helmet-grid-item-img-helmet {
  transform: scale(1.1);
}
```

**How to read the ellipse:**
- `ellipse(rx ry at cx cy)` — rx = horizontal radius, ry = vertical radius, cx/cy = center point
- `ellipse(60% 0% at 50% 0%)` — zero vertical radius = flat line at top = nothing visible
- `ellipse(100% 120% at 50% 0%)` — horizontal 100% = full width, vertical 120% = extends past bottom = fully revealed

**SVG mask overlay:** The helmet grid also uses an SVG `mask-image` on the container to give the grid a custom shape (irregular edges, not rectangular):

```css
/* Desktop mask */
.helmet-grid {
  -webkit-mask-image: url('/...67e2c781c4c953cd9e74eda5_ln4-2-helm-mask-fill.svg');
  mask-image: url('/...67e2c781c4c953cd9e74eda5_ln4-2-helm-mask-fill.svg');
  -webkit-mask-size: cover;
  mask-size: cover;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

/* Mobile mask (different SVG) */
@media (max-width: 479px) {
  .helmet-grid {
    -webkit-mask-image: url('/...67eea130c0f25ef68ac8889e_ln4-helm-mob-refactor-lime-fill.svg');
    mask-image: url('/...67eea130c0f25ef68ac8889e_ln4-helm-mob-refactor-lime-fill.svg');
  }
}
```

### Adapt This for place.org

```css
/* Portfolio card hover reveal — same ellipse technique */
.portfolio-card-reveal {
  clip-path: ellipse(65% 0% at 50% 0%);
  transform: scale(0.97);
  transition:
    clip-path 0.75s cubic-bezier(0.65, 0.05, 0, 1),
    transform 0.75s cubic-bezier(0.65, 0.05, 0, 1);
}

.portfolio-card:hover .portfolio-card-reveal {
  clip-path: ellipse(105% 125% at 50% 0%);
  transform: scale(1);
}
```

---

## 5. CSS Marquee (Infinite Scroll Text)

Pure CSS implementation — no JavaScript.

### Keyframe Animations

```css
@keyframes translateXLeft {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-100% - var(--gap))); }
}

@keyframes translateXRight {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(100% + var(--gap))); }
}
```

### Applied to Elements

```css
[data-css-marquee-list="left"] {
  animation: translateXLeft 30s linear infinite;
  animation-play-state: paused; /* JS starts it when in view */
}

[data-css-marquee-list="right"] {
  animation: translateXRight 30s linear infinite;
  animation-play-state: paused;
}
```

### Edge Fade (Desktop ≥1920px)

```css
@media screen and (min-width: 1920px) {
  .marquee-gl-target-w {
    -webkit-mask-image: linear-gradient(
      90deg,
      hsla(0, 0%, 100%, 0) 0%,
      white 7.5%,
      white 92.5%,
      hsla(0, 0%, 100%, 0) 100%
    );
    mask-image: linear-gradient(
      90deg,
      hsla(0, 0%, 100%, 0) 0%,
      white 7.5%,
      white 92.5%,
      hsla(0, 0%, 100%, 0) 100%
    );
  }
}
```

### HTML Structure

```html
<!-- Outer container — overflow hidden -->
<div class="marquee-gl-target-w" style="overflow: hidden; display: flex;">

  <!-- First list — the real content -->
  <ul data-css-marquee-list="left" class="marquee__content">
    <li class="marquee-spacer">Text Item 1</li>
    <li class="marquee-spacer">Text Item 2</li>
    <!-- ... -->
  </ul>

  <!-- Duplicate — aria-hidden, creates the seamless loop -->
  <ul data-css-marquee-list="left" class="marquee__content" aria-hidden="true">
    <li class="marquee-spacer">Text Item 1</li>
    <li class="marquee-spacer">Text Item 2</li>
    <!-- ... -->
  </ul>

</div>
```

**Why `calc(-100% - var(--gap))` and not just `-100%`:**
Without the gap offset, there is a 1px jump at the loop point. The gap variable accounts for the spacing between the two list items.

---

## 6. Horizontal Scroll Gallery

The gallery of candid photos (Qatar, Miami, Monaco, etc.) scrolls horizontally while the page scrolls vertically. This is implemented with GSAP ScrollTrigger pinning.

### GSAP ScrollTrigger Horizontal Pin Pattern

```javascript
// The standard Lenis + GSAP horizontal scroll pattern
const gallery = document.querySelector('.horizontal-gallery');
const galleryInner = gallery.querySelector('.horizontal-gallery-inner');

gsap.to(galleryInner, {
  x: () => -(galleryInner.scrollWidth - document.documentElement.clientWidth),
  ease: "none",
  scrollTrigger: {
    trigger: gallery,
    pin: true,              // pins .horizontal-gallery during scroll
    scrub: 1,               // 1s lag between scroll position and animation — feels smooth
    start: "top top",
    end: () => `+=${galleryInner.scrollWidth - document.documentElement.clientWidth}`,
    invalidateOnRefresh: true,  // recalculates on window resize
  }
});
```

**CSS for the horizontal track:**
```css
.horizontal-gallery {
  overflow: hidden;
  will-change: transform;
}

.horizontal-gallery-inner {
  display: flex;
  flex-wrap: nowrap;
  gap: 1.5rem;
  width: max-content;  /* critical — lets content overflow naturally */
}

.horizontal-gallery-item {
  flex: 0 0 auto;
  width: 28vw;   /* or fixed width — adjust for number of items visible */
}
```

**With Lenis**: Lenis smooth scroll and GSAP scrub work together because Lenis is synced to GSAP's ticker (see Section 2). The `scrub: 1` value means the horizontal position takes 1 second to catch up with the scroll position — this is what gives it the premium feel.

---

## 7. Footer SVG Mask Reveal

The footer has irregular top edges defined by SVG masks:

```css
.footer-wrap {
  --mask-url: url('/...67d2dd47cfe84bed1dce9542_ln4-footer-mask-desktop.svg');
  -webkit-mask-image: var(--mask-url);
  mask-image: var(--mask-url);
  -webkit-mask-size: cover;
  mask-size: cover;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

@media (max-width: 479px) {
  .footer-wrap {
    --mask-url: url('/...67e4213817c888515fa4855b_ln4-footer-mask-mobile.svg');
  }
}
```

**Implementing this without custom SVGs:**

You can approximate the same effect with a CSS `clip-path` polygon:

```css
.section-with-torn-edge {
  clip-path: polygon(
    0 8%,          /* top-left — starts 8% down (creates angled top edge) */
    100% 0%,       /* top-right */
    100% 100%,     /* bottom-right */
    0 100%         /* bottom-left */
  );
}
```

Or for a curved top edge using SVG mask inline:

```css
.section-curved-top {
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 100'%3E%3Cpath d='M0,50 Q720,0 1440,50 L1440,100 L0,100 Z' fill='white'/%3E%3C/svg%3E");
  mask-image: url("data:image/svg+xml,...");
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}
```

---

## 8. Rive Animations

### Where They Appear

Rive is used for:
- **Button icons** (`[data-btn-rive-rotate]`, `[data-rive-btn-invert]`) — icons that rotate/invert as interactive state indicators
- **Interactive canvas elements** (`canvas[data-rive-object]`, `canvas[data-rive-primary]`) — likely the helmet 3D rotation and interactive logo treatments
- **Placeholder display in design mode** (`[data-rive-placeholder]`) — shows a static image in Webflow designer where Rive runs in production

### Webflow + Rive Integration

Rive is now native in Webflow (September 2024). In Webflow you can:
1. Drag a `.riv` file into your asset library
2. Drop it as an element on the canvas
3. Connect state machine inputs to Webflow interactions

For custom code control (what OFF+BRAND likely uses):

```javascript
import { Rive } from "@rive-app/canvas";

const r = new Rive({
  src: "helmet-spin.riv",
  canvas: document.querySelector("canvas[data-rive-primary]"),
  autoplay: true,
  stateMachines: "HoverMachine",
  onLoad: () => {
    const inputs = r.stateMachineInputs("HoverMachine");
    const isHovered = inputs.find(i => i.name === "isHovered");
    const rotationSpeed = inputs.find(i => i.name === "rotationSpeed");

    // Trigger from JS
    document.querySelector("[data-helmet-item]").addEventListener("mouseenter", () => {
      isHovered.value = true;
    });
    document.querySelector("[data-helmet-item]").addEventListener("mouseleave", () => {
      isHovered.value = false;
    });
  }
});
```

### Button rotation pattern

```css
/* These CSS rules handle Rive button state via data attributes */
[data-btn-rive-rotate="true"] .btn-icon-w {
  transform: rotate(180deg);  /* or rotate(90deg) for right-angle variants */
}

[data-rive-btn-invert="true"] .btn-icon-w {
  filter: invert(1);  /* lime button on dark → dark icon on lime */
}
```

---

## 9. Performance Techniques

### What Is Preloaded / Lazy Loaded

- **Images**: Standard `loading="lazy"` on below-fold images (Webflow default)
- **Video**: `[data-video-stream]` attributes — videos are stream-loaded, not preloaded to disk
- **Rive**: Canvas placeholder shown in design mode (`[data-rive-placeholder]`) while runtime loads
- **Fonts**: `Brier` and `Mona` loaded via `@font-face` — critical fonts inline, others deferred

### Scrollbar Hidden Globally

```css
body ::-webkit-scrollbar { display: none; }
body { -ms-overflow-style: none; }
html { scrollbar-width: none; }
```
This is standard for Lenis sites — Lenis replaces native scroll, so the scrollbar is meaningless.

### Platform Detection

```css
.is-safari img { /* aspect-ratio and width adjustments */ }
.is-iphone img { /* iOS-specific sizing */ }
.nav-brand.is-safari { width: 8.2rem; }  /* Safari nav logo fix */
```

Platform classes added via JS:
```javascript
if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
  document.documentElement.classList.add('is-safari');
}
if (/iPhone/.test(navigator.userAgent)) {
  document.documentElement.classList.add('is-iphone');
}
```

---

## 10. Complete CSS Easing Tokens

Extracted directly from the stylesheet:

```css
:root {
  /* The primary easing — aggressive deceleration, near-zero start, hard stop */
  --cubic-default: cubic-bezier(0.65, 0.05, 0, 1);

  /* Standard duration */
  --duration-default: 0.75s;

  /* Combined shorthand (used in transition: property var(--animation-default)) */
  --animation-default: 0.75s cubic-bezier(0.65, 0.05, 0, 1);
}
```

**Analysis of `cubic-bezier(0.65, 0.05, 0, 1)`:**
- P1: (0.65, 0.05) — slow start with gentle initial velocity
- P2: (0, 1) — sharp deceleration, snaps to final position
- Character: aggressive ease-out that feels like a racing car braking into a corner
- Very different from the standard `ease-out` (0.25, 0.1, 0.25, 1) — this is more dramatic

---

## Implementable Patterns for place.org

### Pattern 1: Fluid Font System

Adapt the `--fluid-font` calculation for place.org's design tokens:

```css
:root {
  --design-width: 1440;  /* your design canvas width */
  --design-unit: 16;
  --fluid-container: clamp(768px, 100vw, 1440px);
  --fluid-font: calc(var(--fluid-container) / var(--design-width) * var(--design-unit));
}

/* Usage: multiply by design em value */
.heading-xl { font-size: calc(var(--fluid-font) * 5.5); }  /* 88px at 1440 */
.heading-lg { font-size: calc(var(--fluid-font) * 3.5); }  /* 56px at 1440 */
```

### Pattern 2: Clip-Path Ellipse Hover Reveal (place.org Cards)

```css
/* Immersive page case study card */
.case-card-reveal-layer {
  position: absolute;
  inset: 0;
  clip-path: ellipse(65% 0% at 50% 0%);
  transform: scale(0.96);
  transition:
    clip-path 0.75s cubic-bezier(0.65, 0.05, 0, 1),
    transform 0.75s cubic-bezier(0.65, 0.05, 0, 1);
  will-change: clip-path, transform;
}

.case-card:hover .case-card-reveal-layer {
  clip-path: ellipse(105% 130% at 50% 0%);
  transform: scale(1);
}

/* Base image scales to reinforce the reveal */
.case-card:hover .case-card-base-img {
  transform: scale(1.05);
  transition: transform 0.75s cubic-bezier(0.65, 0.05, 0, 1);
}
```

### Pattern 3: Lenis + GSAP Setup (place.org)

```typescript
// lib/scroll.ts
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitText from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initScroll() {
  const lenis = new Lenis({
    duration: 1.2,
    syncTouch: true,
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
```

### Pattern 4: Data-Attribute Theme Switching

Apply themes via data attributes on section wrappers (not global classes):

```tsx
// Each section declares its theme
<section data-theme="dark" data-nav-theme="light">
  {/* content */}
</section>

<section data-theme="light" data-nav-theme="dark">
  {/* content */}
</section>
```

```css
[data-theme="dark"] {
  --bg: var(--color-surface-dark);
  --text: var(--color-text-inverse);
  background-color: var(--bg);
  color: var(--text);
}

[data-theme="light"] {
  --bg: var(--color-surface-light);
  --text: var(--color-text-primary);
  background-color: var(--bg);
  color: var(--text);
}
```

Nav theme tracked via ScrollTrigger:
```javascript
document.querySelectorAll('[data-nav-theme]').forEach(section => {
  ScrollTrigger.create({
    trigger: section,
    start: 'top top+=1',
    end: 'bottom top+=1',
    onEnter: () => updateNavTheme(section.dataset.navTheme),
    onEnterBack: () => updateNavTheme(section.dataset.navTheme),
  });
});
```

### Pattern 5: CSS Marquee (place.org)

```css
:root { --marquee-duration: 28s; --marquee-gap: 2rem; }

.marquee-track {
  display: flex;
  overflow: hidden;
  user-select: none;
}

.marquee-list {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-width: 100%;
  gap: var(--marquee-gap);
}

@keyframes marquee-left {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-100% - var(--marquee-gap))); }
}

.marquee-list[data-direction="left"] {
  animation: marquee-left var(--marquee-duration) linear infinite;
}

/* Paused by default — start via IntersectionObserver or ScrollTrigger */
.marquee-list { animation-play-state: paused; }
.marquee-list.is-playing { animation-play-state: running; }
```

---

## Scoring Against place.org Portfolio Page Needs

| Technique | Effort | Impact | Adopt? |
|-----------|--------|--------|--------|
| Clip-path ellipse hover | Low | High | Yes — portfolio cards |
| Fluid font system | Low | High | Yes — replace standard clamp() |
| Lenis + GSAP sync | Medium | High | Yes — already planned |
| SplitText line mask reveal | Low | High | Yes — hero headings |
| Data-attribute theme switching | Low | Medium | Yes — section-level themes |
| CSS marquee | Low | Medium | Yes — skills/tech strip |
| Horizontal scroll gallery | Medium | High | Yes — work showcase |
| SVG mask section transitions | Medium | High | Yes — immersive page sections |
| Rive button icons | Medium | Medium | Defer — Phase 2 |
| `--cubic-default` easing | Trivial | High | Yes — steal the easing value |

---

## Sources

- [landonorris.com — direct source fetch](https://landonorris.com)
- [OFF+BRAND case study — Lando Norris](https://www.itsoffbrand.com/our-work/lando-norris)
- [WebGPU.com showcase — Lando Norris](https://www.webgpu.com/showcase/mclaren-f1-driver-lando-norris-official-website/)
- [Lando Norris Awwwards SOTD](https://www.awwwards.com/sites/lando-norris)
- [No-Code Supply Co listing](https://www.nocodesupply.co/item/lando-norris)
- [Lenis GitHub — darkroomengineering](https://github.com/darkroomengineering/lenis)
- [Lenis configuration API — npm README](https://github.com/darkroomengineering/lenis/blob/main/README.md)
- [GSAP + Lenis sync patterns — GSAP Community Forum](https://gsap.com/community/forums/topic/40426-patterns-for-synchronizing-scrolltrigger-and-lenis-in-reactnext/)
- [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Rive native Webflow support — Rive blog](https://rive.app/blog/rive-is-natively-supported-in-webflow)
- [Lenis + Webflow smooth scroll guide — digidop.com](https://www.digidop.com/blog/lenis-smooth-scroll)
- [Lenis horizontal scroll in Webflow — showcased.webflow.io](https://showcased.webflow.io/projects/lenis-horizontal-scroll)
- [CSS infinite marquee — ryanmulligan.dev](https://ryanmulligan.dev/blog/css-marquee/)
- [Infinite marquee modern CSS — frontendmasters.com](https://frontendmasters.com/blog/infinite-marquee-animation-using-modern-css/)
- [Clip-path animations — CSS-Tricks](https://css-tricks.com/animating-with-clip-path/)
- [Horizontal scroll with GSAP ScrollTrigger — gsapify.com](https://gsapify.com/gsap-scrolltrigger)

#animation #css #gsap #lenis #rive #webgl #clip-path #marquee #scroll #place-org #research
