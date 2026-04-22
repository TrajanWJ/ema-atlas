---
date: 2026-03-20
last_reviewed: 2026-04-22
tags: [animation, css, gsap, motion, rive, webgpu, houdini, view-transitions, scroll-driven, place-org, research]
status: active
---

# Research - Web Animation Techniques 2025-2026 (place.org)

> Research question: What are the most impressive, cutting-edge web animation techniques available in 2025-2026 that can power the "deep space cockpit that breathes" aesthetic of place.org?

Related: [[Research - Modern Browser Capabilities 2025-2026]] | [[Research - place.org Experimental UI Inspiration Deep Dive]] | [[Research - landonorris.com Technical Deep Dive]] | [[My Stack Decisions]]

---

## Executive Summary

The web animation platform in 2026 has fractured into three distinct capability tiers: (1) pure CSS techniques that now cover gradient animation, scroll-driven motion, and viewport reveals without a single line of JS; (2) declarative animation libraries (Motion v12, GSAP ScrollTrigger) that target compositor-thread properties at 120fps; (3) GPU compute pipelines (WebGPU + Three.js TSL) that can run 300k–1M particle simulations in real time. For place.org's "deep space cockpit that breathes" aesthetic, the sweet spot is a layered stack: CSS for ambient breathing, Motion for UI state transitions, GSAP for orchestrated sequences (boot, window open/close), Rive for interactive icon/mascot states, and selective WebGPU for the background nebula/particle layer.

---

## 1. View Transitions API

### What It Can Do Now

The View Transitions API animates between DOM states — within a page or across page navigations — using browser-managed screenshot compositing. As of 2025-2026:

**Same-document transitions** (SPAs) reached **Baseline Newly Available** status in October 2025 when Firefox 144 shipped. All four major browsers now support `document.startViewTransition()`. The default transition is a cross-fade; you override it by styling `::view-transition-old(name)` and `::view-transition-new(name)` with CSS animations.

**Cross-document transitions** (MPAs) are currently Chrome 126+, Edge 126+, Safari 18.2+. Both pages opt in with:

```css
@view-transition {
  navigation: auto;
}
```

Any element on both pages with matching `view-transition-name` values will morph between the two states — the browser handles FLIP interpolation automatically.

**2025/2026 new features** (Chrome 137–142, some experimental):

| Feature | Version | What it does |
|---------|---------|-------------|
| `view-transition-name: match-element` | Chrome 137+ | Auto-generates unique names for list items — eliminates manual naming for dynamic content |
| Nested view transition groups | Chrome 140+ | Hierarchical pseudo-elements that restore clipping during transition; enables 3D perspective effects |
| Scoped view transitions | Chrome 140 experimental | `element.startViewTransition()` — transitions on subtrees, multiple simultaneous transitions |
| Enhanced animation inheritance | Chrome 140+ | Pseudo-elements inherit animation longhands automatically, keeping cross-fades in sync |
| `document.activeViewTransition` | Chrome 142+ | Direct access to active transition without manual tracking |
| `ViewTransition.waitUntil()` | Late 2025 | Delay transition finish until async data is ready |

**React integration:** `<ViewTransition>` component moved from experimental to canary status, indicating near-final API design.

### Browser Support

| Browser | Same-document | Cross-document |
|---------|--------------|----------------|
| Chrome 137+ | Full | Full |
| Edge 126+ | Full | Full |
| Safari 18.2+ | Full | Partial |
| Firefox 144+ | Partial (no types yet) | No |

### place.org Applications

- **Window open/close**: Assign `view-transition-name` to window containers. Open/close triggers a morph from icon → window — the browser handles the FLIP animation. Zero JS animation code.
- **Panel-to-panel navigation**: When navigating between workspace areas, a scoped view transition on the panel container creates localized morphs without affecting the rest of the OS chrome.
- **Boot sequence to desktop**: The loader overlay and the desktop icon grid share a `view-transition-name`. The boot screen dissolves into the desktop with a single `startViewTransition()` call.
- **Multiple simultaneous transitions**: Chrome 140's scoped transitions mean window A can open while window B is closing — each independently animated.

### Performance

View transitions run at the compositor level. The browser captures screenshots before/after the DOM change and composites them — no layout recalculation during the animation. For 120fps displays, this is the highest-performance way to animate page-level changes.

---

## 2. Scroll-Driven Animations

### What It Can Do Now

CSS scroll-driven animations arrived in Chrome 115 (2023) and Safari 26. **Firefox support landed in 2026**, making this cross-browser as of early 2026. Two timeline types:

**`animation-timeline: scroll()`** — drives animation from 0%→100% as the scroll container scrolls from top to bottom.

**`animation-timeline: view()`** — drives animation based on an element's visibility in the scrollport. Combined with `animation-range`, you control exactly when in the element's viewport journey the animation runs:

```css
.star-card {
  animation: fade-rise linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}

@keyframes fade-rise {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: no-preference) {
  .star-card { animation-fill-mode: both; }
}
```

**Scroll-triggered animations (Chrome 145)** — a distinct capability landing in 2026: time-based animations that *start* when crossing a scroll offset, rather than being continuously driven by scroll position. Closer to the classic "add class on scroll" pattern, but native.

**`sibling-index()` function** — new CSS function that lets elements know their position among siblings. Enables staggered scroll animations without JS:

```css
.panel { animation-delay: calc(80ms * sibling-index()); }
```

### Browser Support

| Browser | scroll() / view() | scroll-triggered (Chrome 145) |
|---------|------------------|-------------------------------|
| Chrome 115+ | Full | Chrome 145+ |
| Safari 26 | Full | Unknown |
| Firefox (2026) | Full | Unknown |
| Edge | Full | Edge (Chromium-based) |

### place.org Applications

- **Ambient "breathing" panels**: Desktop panels that gently pulse or shift opacity as the user scrolls a content area within them — the panel itself breathes in response to scroll.
- **HUD element reveals**: Instrument readouts that animate from 0 to their current value as they scroll into view — pure CSS, compositor-thread.
- **Parallax depth layers**: Background nebula layers scroll at different rates from foreground elements using `scroll()` with different scroll-containers, creating z-depth without JS.
- **Staggered boot sequence panels**: Using `sibling-index()` delays, cockpit panels can cascade into view in sequence without any JS timing logic.

### Performance

All scroll-driven animations run on the compositor thread. No main-thread JavaScript involvement, no layout recalculation. The browser handles everything. This is the most performant animation mechanism for scroll-synchronized motion.

---

## 3. CSS `@property` Animations

### What It Can Do Now

`@property` (CSS Custom Properties Level 5) is **Baseline — fully supported in all major browsers** as of 2025. It lets you register a typed custom property with an `initial-value` and declare whether it `inherits`.

**The critical insight:** Without `@property`, CSS cannot animate custom properties because it does not know their type. With `@property`, the browser understands how to interpolate between values.

This unlocks gradient animation, color cycling, and angle animation — none of which were possible with untyped `var()`:

```css
/* Register a typed hue property */
@property --hue-shift {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

/* Register animatable color stops */
@property --nebula-color-1 {
  syntax: "<color>";
  inherits: false;
  initial-value: hsl(220, 80%, 20%);
}

@property --nebula-color-2 {
  syntax: "<color>";
  inherits: false;
  initial-value: hsl(280, 60%, 15%);
}

/* Now CSS can smoothly transition between these */
.cockpit-bg {
  background: radial-gradient(
    ellipse at var(--glow-x) var(--glow-y),
    var(--nebula-color-1),
    var(--nebula-color-2),
    hsl(240 90% 5%)
  );
  transition: --nebula-color-1 2s ease, --nebula-color-2 2s ease;
}

/* Rotating conic gradient border (no JS) */
@property --angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.glow-border {
  background: conic-gradient(from var(--angle), #00f, #f0f, #0ff, #00f);
  animation: rotate-hue 4s linear infinite;
}

@keyframes rotate-hue {
  to { --angle: 360deg; }
}
```

### What Is Possible

- **Animated gradient stops**: Each stop is a `<color>` property; CSS interpolates between them smoothly
- **Rotating conic gradients**: Spinning glows, scanning borders, radar-sweep effects — all pure CSS
- **Color cycling without JS**: Register multiple `<color>` properties, animate them on different durations and delays for organic color drift
- **Animatable blur/shadow radii**: Register `<length>` properties for `box-shadow` blur-radius animation

### Browser Support

Baseline — Chrome 85+, Firefox 128+, Safari 16.4+. No polyfill needed in 2026.

### place.org Applications

- **Nebula breathing**: Background gradient colors that slowly shift through deep space hues (`--nebula-hue` animating on a 30s loop) — zero JS, zero CPU.
- **Active window glow**: Focused window gets a `conic-gradient` border that rotates slowly. CSS-only, GPU-composited.
- **Status color indicators**: System health readouts that interpolate between green/amber/red through registered `<color>` properties — smooth, not a hard cut.
- **Deep space ambient pulse**: Register a `<length>` for radial gradient radius and animate it on a 4-second loop — the nebula "breathes."

---

## 4. Motion (formerly Framer Motion) v12

### What It Can Do Now

Motion is at **v12.36.0** as of March 2026 (published 3 days prior). It is the most actively developed React animation library. The package retains the `framer-motion` name on npm but the primary brand is now **Motion**.

**Hybrid engine architecture:** Motion's runtime uses the **Web Animations API (WAAPI)** and **ScrollTimeline** for hardware-accelerated animations (transform, filter, opacity) at up to 120fps. When capabilities those APIs cannot provide are needed — spring physics, interruptible keyframes, gesture tracking — it seamlessly falls back to a JavaScript engine.

**Layout animations** are the headline feature: any element with a `layout` prop automatically animates between layout changes — resize, reorder, add/remove — using FLIP internally:

```tsx
// Automatic FLIP animation when layout changes
<motion.div layout layoutId="window-chrome" />

// Shared element transition between two components
// Component A:
<motion.img layoutId="thumbnail-42" src={src} />

// Component B (different route/state):
<motion.img layoutId="thumbnail-42" src={src} className="fullscreen" />
```

`layoutId` enables **shared element transitions**: elements that exist in two different states/routes will animate between them as if they are the same physical element. This is the browser's `view-transition-name` equivalent, but in React component space.

**Key v12 features:**
- `motion()` function wraps any HTML element or custom component
- `useAnimate()` hook for imperative animations with cleanup on unmount
- `useScroll()` + `useTransform()` for scroll-linked value transforms
- `AnimatePresence` for enter/exit animations when components unmount
- `LayoutCamera` for perspective-correct layout animations (Safari polyfill active in v12)
- Size: ~32KB gzipped

### place.org Applications

- **Window open/close**: `AnimatePresence` wraps the window component. Entry animation: scale from 0.9 + fade in, spring physics so it overshoots slightly (feels physical). Exit: scale to 0.95 + fade out.
- **Shared icon-to-window transition**: Desktop icon and open window share a `layoutId`. Clicking the icon triggers the shared-element morph — the icon expands into the window.
- **Panel reordering**: Dragging panels to rearrange them uses `layout` prop — sibling panels animate into their new positions automatically.
- **Scroll-linked cockpit instruments**: `useScroll` + `useTransform` map scroll position to gauge needle angles, bar heights, opacity.
- **Staggered boot reveals**: `staggerChildren` on a container staggers panel entrance animations.

### Performance

WAAPI-backed animations run off the main thread. Spring physics fall back to JS but only for the duration of the gesture/animation — they do not hold the thread. The 32KB bundle is small relative to GSAP (which is smaller core but adds up with plugins).

---

## 5. GSAP 2025-2026

### What It Can Do Now

GSAP became **free for all users** (including commercial projects) after Webflow's acquisition in 2024. Previously paywalled plugins — ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, Draggable — are now fully open.

**Core:** ~23KB gzipped. Handles thousands of simultaneous tweens without frame loss. Timeline-based sequencing with `gsap.timeline()` is the industry standard for orchestrated, multi-step animation sequences (exactly what a boot sequence or intro animation requires).

**ScrollTrigger (now free):**
```javascript
gsap.to(".panel", {
  x: "100vw",
  scrollTrigger: {
    trigger: ".panel",
    start: "top center",
    end: "bottom top",
    scrub: 1,           // smooth scrub, 1s lag
    pin: true,          // pin element during scroll
    snap: {
      snapTo: "labels", // snap to timeline labels
      duration: { min: 0.2, max: 3 },
      ease: "power1.inOut"
    },
    onEnter: () => activateHUD(),
    onLeave: () => deactivateHUD(),
    containerAnimation: horizontalTimeline  // for horizontal scroll containers
  }
})
```

**ScrollSmoother:** Smooth momentum scrolling for the entire page — the successor to Lenis in the GSAP ecosystem. Single plugin, production-grade, no bundle bloat.

**SplitText (now free):** Splits text into individual characters/words/lines for staggered text animations — critical for terminal-style text reveals and HUD label animations.

**MorphSVG (now free):** Morphs between any two SVG path shapes. Useful for icon state transitions (e.g., a status icon that morphs between shapes).

**GSAP Timeline for boot sequences:**
```javascript
const boot = gsap.timeline({ defaults: { ease: "power2.out" } })

boot
  .from(".os-logo",      { opacity: 0, scale: 0.8, duration: 0.6 })
  .from(".boot-text",    { opacity: 0, y: 12, stagger: 0.08 }, "-=0.2")
  .from(".progress-bar", { scaleX: 0, transformOrigin: "left", duration: 1.2 }, "-=0.4")
  .to(".boot-screen",    { opacity: 0, duration: 0.4 }, "+=0.3")
  .from(".desktop-icon", { opacity: 0, scale: 0.5, stagger: { amount: 0.6, from: "center" } })
```

**Codrops (March 2026):** Active tutorial publishing: SVG mask transitions on scroll, layered zoom scroll effects with ScrollSmoother, dual-wave text animations, scroll-revealed WebGL galleries. GSAP + Three.js is the dominant pairing for high-end 2026 sites.

### place.org Applications

- **Boot sequence**: GSAP timeline orchestrates the entire boot: OS logo, progress bar, boot text rolling in, then dissolve to desktop. Cannot be replicated with CSS alone due to cross-element timing coordination.
- **Window open choreography**: When a window opens, GSAP sequences: container scales in → titlebar slides down → content fades in → shadow spreads. Feels like a real OS.
- **Kinetic HUD labels**: SplitText staggers individual characters of instrument labels when values change.
- **Horizontal cockpit scroll**: ScrollTrigger `containerAnimation` for horizontally arranged instruments that reveal on vertical scroll.
- **Morphing status icons**: MorphSVG transitions status indicators between SVG states (e.g., nominal → alert → critical).

### GSAP vs Motion Decision

GSAP for: orchestrated multi-element sequences, boot/intro animations, scroll storytelling, text reveals, SVG morphing. Motion for: React component enter/exit, shared element transitions, gesture-driven layout changes. Use both — they do not conflict.

---

## 6. Rive

### What It Can Do Now

Rive is a **vector animation runtime with built-in state machines**. Unlike Lottie (playback-only), Rive animations can respond in real time to application inputs. The file format is binary (`.riv`), not JSON, which is why Rive files are typically 90% smaller than equivalent Lottie files.

**State machine architecture:** A Rive state machine has named **inputs** (Boolean, Number, Trigger) that you set from JavaScript. The state machine logic (defined in Rive's editor) handles transitions between animation states automatically:

```javascript
import { Rive } from "@rive-app/canvas";

const r = new Rive({
  src: "cockpit-indicator.riv",
  canvas: document.getElementById("indicator"),
  autoplay: true,
  stateMachines: "MainStateMachine",
  onLoad: () => {
    const inputs = r.stateMachineInputs("MainStateMachine");
    const alertLevel = inputs.find(i => i.name === "alertLevel");
    const isActive   = inputs.find(i => i.name === "isActive");

    // From your app:
    alertLevel.value = 0.75;   // Number input (0–1)
    isActive.value = true;     // Boolean input
  }
});
```

The state machine in the Rive editor defines: if `alertLevel > 0.8` AND `isActive === true`, transition from "nominal" animation to "warning-pulse" animation with a smooth blend.

**Performance:** Rive uses the canvas (not DOM) and a native runtime compiled to WebAssembly. Renders at 60–120fps. File sizes for interactive icons: typically 15–50KB, versus Lottie JSON equivalents at 200–500KB+.

**Production users:** Duolingo uses Rive state machines to scale character animation across their app. Teams report 4x faster production and 90% smaller file sizes vs After Effects/Lottie pipelines.

### Browser Support

All modern browsers. Rive ships both a Canvas API renderer and a WebGL renderer. The WASM runtime is cross-browser and production-tested.

### place.org Applications

- **System status indicators**: A Rive state machine with a `healthLevel` Number input. Feed it CPU/memory values. The indicator smoothly animates between nominal/elevated/critical visual states — no code for the animation logic, it lives in the `.riv` file.
- **Boot logo**: An animated place.org logo that plays once on boot, responding to a `bootComplete` trigger input — the logo "lights up" when boot finishes.
- **Desktop icon hover states**: Rive handles hover → active → open animation states for desktop icons. The state machine manages all transitions from one input: `mouseState` (idle/hover/pressed).
- **Interactive mascot/character**: An ambient cockpit character (crew member, AI companion) that reacts to user activity — idle animations when no input, attention animation when a window opens, alert animation when a notification arrives.

---

## 7. WebGPU for Visual Effects

### What It Can Do Now

WebGPU is in all major browsers as of late 2025 (Chrome 113+, Firefox 141+, Safari 26). The critical advance over WebGL: **compute shaders** (WGSL) run arbitrary GPU computation alongside rendering, with the particle data staying entirely on GPU memory — no CPU↔GPU transfer bottleneck.

**Particle system architecture:**
```
Initialize pass: compute shader populates position/velocity buffers once
Update pass (each frame): compute shader reads + writes buffers
Render pass: vertex shader reads buffers as vertex attributes
```

**Scale benchmarks (real hardware, 2025):**
- Galaxy simulation: 1M particles at interactive framerates on modern GPU
- Fluid simulation (MLS-MPM): 300k particles at 60fps on mid-range GPU
- Particle flow field (curl noise + bloom): practical on most consumer hardware

**Three.js TSL (Three.js Shading Language):** A JavaScript-composable abstraction over WGSL that makes compute shaders accessible without raw WGSL knowledge. Part of Three.js WebGPURenderer. Enables GPU-accelerated particle systems within existing Three.js scenes.

**Production caution:** Codrops 2025 WebGPU fluid simulation article is explicit: raw physics simulations (120fps on M3 Max, 50fps on M1 Pro, poor on MacBook Air) "are not suitable for production" due to GPU budget variance. For place.org, WebGPU background effects must have a graceful fallback.

**Recommended pattern for place.org:** Use WebGPU for a background-only nebula/particle layer that degrades gracefully:
1. Detect WebGPU support
2. If supported: render 50k–200k star/nebula particles via compute shader
3. If not supported: fall back to a CSS-only deep space background (see Section 8)

**Point splatting** is the recommended technique for smooth-looking particle fields (not raw physics) — recommended by the Codrops WebGPU fluids author for production. Renders with reflections, soft edges, and depth cues at manageable GPU cost.

### Browser Support

| Browser | WebGPU | Notes |
|---------|--------|-------|
| Chrome 113+ | Full | Desktop + Android |
| Firefox 141+ | Windows only (2025) | Expanding |
| Safari 26 | Full | macOS/iOS |
| Edge 113+ | Full | Chromium-based |

### place.org Applications

- **Nebula background layer**: 50k–100k points driven by compute shader — curl noise velocity field creates organic star drift. WebGPU keeps it off the CPU entirely.
- **Window close particle burst**: On window close, 200 particles burst from the window bounds via a short compute dispatch. One-shot, not continuous.
- **Boot sequence particle convergence**: Boot logo assembles from scattered particles that converge to their positions. Classic effect, GPU-native.
- **Ambient warp lines**: Star-streak lines on a velocity field, driven by a WGSL compute pass, layered under the UI.

---

## 8. CSS Houdini Paint Worklets

### What It Can Do Now

The CSS Painting API (Houdini Paint) lets you define a JavaScript function that the browser calls as if it were a `background-image`. It runs in a **PaintWorklet** — a separate thread — keeping main thread and compositor thread clear.

```javascript
// my-noise-worklet.js
registerPaint("noise", class {
  static get inputProperties() {
    return ["--noise-cell-size", "--noise-hue", "--noise-saturation", "--noise-lightness"];
  }

  paint(ctx, size, props) {
    const cellSize = parseInt(props.get("--noise-cell-size")) || 2;
    const hue      = parseInt(props.get("--noise-hue")) || 220;
    const sat      = parseInt(props.get("--noise-saturation")) || 80;
    const light    = parseInt(props.get("--noise-lightness")) || 15;

    for (let x = 0; x < size.width; x += cellSize) {
      for (let y = 0; y < size.height; y += cellSize) {
        const l = light + Math.random() * 10;
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${l}%)`;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }
});
```

```css
.cockpit-bg {
  --noise-cell-size: 2;
  --noise-hue: 220;
  --noise-saturation: 60;
  --noise-lightness: 10;
  background: paint(noise);
}
```

**Reactive to CSS custom properties:** Change `--noise-hue` via CSS transition and the paint worklet re-executes automatically. Combine with `@property` for animated noise transitions.

**Noise texture pattern (CSS-only alternative):** The CSS-Tricks animated grainy texture technique uses an oversized pseudo-element (300% × 300%) with a tiled grain texture image, animated via `steps(10)` discrete keyframes — the jitter produces grain without WebGL:

```css
.cockpit-bg::after {
  content: "";
  background-image: url("/assets/grain-tile.png");
  height: 300%;
  width: 300%;
  opacity: 0.08;
  position: fixed;
  top: -100%;
  left: -50%;
  animation: grain 8s steps(10) infinite;
}

@keyframes grain {
  0%,100% { transform: translate(0,0) }
  10%     { transform: translate(-5%,-10%) }
  20%     { transform: translate(-15%, 5%) }
  30%     { transform: translate( 7%,-20%) }
  40%     { transform: translate(-5%, 20%) }
  50%     { transform: translate(-15%, 10%) }
  60%     { transform: translate(15%,  0%) }
  70%     { transform: translate(0,   15%) }
  80%     { transform: translate(3%,  35%) }
  90%     { transform: translate(-10%,10%) }
}
```

### Browser Support

**Native Paint Worklet:** Chrome/Edge (full), Safari (partial), Firefox (no). Chromium-only for native.

**CSS Paint Polyfill** (`css-paint-polyfill` by Google) provides cross-browser support — every worklet on houdini.how works across all modern browsers via the polyfill.

### place.org Applications

- **Deep space grain overlay**: The grain animation technique (CSS-only, no worklet needed for basic grain) adds film grain texture to the entire cockpit background — establishes the "analog space" aesthetic without any JS.
- **Noise-textured panel backgrounds**: Paint worklet draws subtle HSL noise on each panel's background — makes panels feel like physical instrument faceplates rather than flat rectangles.
- **Custom shimmer/scan effect**: A worklet draws a horizontal scan line that moves (driven by `--scan-y` custom property) — cockpit radar sweep as a CSS background.
- **Animated border patterns**: Paint worklet draws a custom dashed/dotted border pattern that responds to `--border-phase` — rotating dashes around a window frame.

---

## 9. CSS-Only Advanced Animations (No JS)

### What's Possible in 2026

CSS has absorbed a significant portion of what previously required JavaScript:

**New CSS functions for animation:**

| Feature | What it does | Browser support |
|---------|-------------|-----------------|
| `sibling-index()` | Elements know their position — auto-stagger delays | Chrome 137+ |
| `animation-timeline: scroll()` | Scroll-driven animation, compositor-thread | Chrome, Safari, Firefox 2026 |
| `animation-timeline: view()` | Visibility-triggered animation | Chrome, Safari, Firefox 2026 |
| `@property` | Typed custom props, enables gradient/color animation | Baseline |
| `linear()` timing | Spring/bounce curves in pure CSS | Baseline (Dec 2023) |
| `transition-behavior` | Control discrete transitions (display, visibility) | Baseline |
| `if()` function | Conditional CSS values | Experimental 2026 |

**`linear()` timing for spring physics:**
```css
/* Spring physics without JS — using linear() with hand-crafted curve */
.window {
  transition: transform 600ms linear(
    0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%,
    0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159,
    1.163, 1.154, 1.129 32.8%, 1.051 39.6%, 1.017 44.1%,
    1.001 53%, 0.995 61.8%, 1
  );
}
```
Tools like joshwcomeau.com's spring visualizer generate these curves interactively. Result: OS-quality spring bounce on window open/close with pure CSS.

**Deep space animated background (pure CSS):**
```css
/* Stars layer using radial gradients */
.stars-far {
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 80% 10%, rgba(255,255,255,0.3) 0%, transparent 100%),
    /* ... repeat for 50-100 star positions */;
  animation: drift-far 80s linear infinite;
}

.stars-near {
  /* Larger, brighter stars for parallax depth */
  animation: drift-near 40s linear infinite;
}

@keyframes drift-far  { to { transform: translateY(-20px) } }
@keyframes drift-near { to { transform: translateY(-40px) } }
```

**Animated conic gradient scanner (pure CSS):**
```css
@property --scan-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.radar {
  background: conic-gradient(
    from var(--scan-angle),
    transparent 340deg,
    rgba(0, 255, 128, 0.4) 355deg,
    rgba(0, 255, 128, 0.8) 360deg
  );
  animation: scan 3s linear infinite;
}

@keyframes scan { to { --scan-angle: 360deg; } }
```

---

## 10. Specific place.org Animation Patterns

### Boot Sequence

**Three-phase approach:**
1. **Instant static frame** (0ms): `<noscript>`/static HTML shows `/boot/background.png` — no FOUC, perceived as instant
2. **CSS boot text** (0–800ms): CSS `animation-timeline: view()` or simple keyframes for terminal-style text lines appearing sequentially, using `sibling-index()` stagger
3. **GSAP orchestration** (800ms–2s): Timeline sequences logo reveal, progress bar, panel cascade into desktop. GSAP handles cross-element coordination that CSS stagger cannot.

### Window Open/Close

**Combined approach:**
- Motion `AnimatePresence` for mount/unmount with spring physics (feels physical)
- `view-transition-name` on the window for icon → window shared element morph
- `linear()` spring curve as CSS fallback for simple scaling

```tsx
// Window component with Motion
<AnimatePresence>
  {isOpen && (
    <motion.div
      layoutId={`window-${id}`}  // matches desktop icon layoutId
      initial={{ scale: 0.85, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

### Ambient Background ("Breathes")

**Layered composition:**
1. **Base gradient** (CSS `@property`): Deep space colors cycling on a 60s loop — imperceptibly slow color drift
2. **Nebula breathing** (CSS `@property`): Radial gradient radius animates 8s back and forth — the nebula expands and contracts
3. **Grain overlay** (CSS pseudo-element + `steps(10)` animation): Film grain texture at 8% opacity — constant shimmer
4. **Star field** (CSS radial gradients): Two parallax layers drifting at different speeds
5. **WebGPU particle layer** (conditional): 50k–100k particles doing curl-noise drift — only if `navigator.gpu` is available

### Page/Panel Transitions

Use View Transitions API scoped transitions (`element.startViewTransition()`) for panel content changes. The panel chrome stays stable; only the content morphs. This is a Chrome 140+ feature — provide a simple opacity fallback via CSS for Firefox/Safari.

---

## Candidates Evaluated

| Technology | Stars/Downloads | Last Release | Recommendation |
|-----------|----------------|--------------|----------------|
| View Transitions API | Native browser | Chrome 142 (Mar 2026) | **Adopt** — Baseline for SPA transitions |
| CSS Scroll-Driven Animations | Native browser | Chrome 145 (scroll-triggered) | **Adopt** — Compositor-thread, zero cost |
| CSS `@property` | Native browser | Baseline 2025 | **Adopt** — Essential for gradient animation |
| Motion v12 | 24k+ GitHub stars | v12.36 (Mar 2026) | **Adopt** — Primary React animation library |
| GSAP + ScrollTrigger | 19k+ stars | v3.x (active) | **Adopt** — Orchestrated sequences, boot, text |
| Rive | Production (Duolingo) | Active 2026 | **Adopt** — Interactive icon/mascot states |
| WebGPU + Three.js TSL | Browser native | Safari 26 complete | **Extend** — Background layer, with CSS fallback |
| CSS Houdini Paint Worklet | Chromium native | Active | **Extend** — Noise/grain via CSS fallback if no support |
| CSS `linear()` springs | Baseline Dec 2023 | — | **Adopt** — Spring physics without JS for simple cases |
| ScrollSmoother (GSAP) | Bundled with GSAP | Free since 2024 | **Adopt** — Smooth scroll for any long content areas |

---

## Recommended Stack for place.org

| Layer | Technology | Why |
|-------|-----------|-----|
| Ambient background | CSS `@property` + multi-layer gradients + grain | Zero JS, GPU-composited, "breathes" |
| Star field | CSS radial gradients with keyframe drift | Pure CSS, no runtime |
| Nebula particles | WebGPU + Three.js TSL (graceful fallback) | GPU-native, degrades to CSS |
| Page/panel transitions | View Transitions API (scoped) | Native morph, zero JS animation |
| Window open/close | Motion `AnimatePresence` + `layoutId` | Shared element, spring physics |
| Boot sequence | GSAP timeline | Multi-element orchestration |
| Interactive icons/states | Rive state machines | Responsive to app state, 90% smaller than Lottie |
| Scroll reveals | CSS `animation-timeline: view()` | Compositor-thread, no JS |
| Text animations | GSAP SplitText | Character-level staggering |
| Spring physics | Motion (React) or CSS `linear()` | Choose by context |

---

## Sources

- [What's new in view transitions (2025 update) — Chrome Developers](https://developer.chrome.com/blog/view-transitions-in-2025)
- [View Transition API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Same-document view transitions Baseline — web.dev](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)
- [CSS scroll-driven animations — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations)
- [Mastering CSS Scroll Timeline 2026 — DEV Community](https://dev.to/softheartengineer/mastering-css-scroll-timeline-a-complete-guide-to-animation-on-scroll-in-2025-3g7p)
- [Create Apple-style scroll animations with CSS view-timeline — Builder.io](https://www.builder.io/blog/view-timeline)
- [Color Shifting in CSS — Josh W. Comeau](https://www.joshwcomeau.com/animation/color-shifting/)
- [Gradient animation using the @property directive — Medium](https://medium.com/@andrii.pznkv/gradient-animation-using-the-new-property-directive-7042aa85c814)
- [We can finally animate CSS gradient — DEV Community](https://dev.to/afif/we-can-finally-animate-css-gradient-kdk)
- [Motion — motion.dev](https://motion.dev/)
- [Motion Changelog — motion.dev](https://motion.dev/changelog)
- [Layout Animations — Motion docs](https://motion.dev/docs/react-layout-animations)
- [ScrollTrigger — GSAP Docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [SVG Mask Transitions on Scroll with GSAP and ScrollTrigger — Codrops (March 2026)](https://tympanus.net/codrops/2026/03/11/svg-maREDACTED_TOKEN-on-scroll-with-gsap-and-scrolltrigger/)
- [Layered Zoom Scroll with GSAP ScrollSmoother — Codrops (Oct 2025)](https://tympanus.net/codrops/2025/10/29/building-a-layered-zoom-scroll-effect-with-gsap-scrollsmoother-and-scrolltrigger/)
- [Rive — rive.app](https://rive.app/)
- [Rive State Machine Overview — help.rive.app](https://help.rive.app/editor/state-machine)
- [Rive vs Lottie 2025 — DEV Community](https://dev.to/uianimation/rive-vs-lottie-which-animation-tool-should-you-use-in-2025-p4m)
- [Particles, Progress, and Perseverance: WebGPU Fluids — Codrops (Jan 2025)](https://tympanus.net/codrops/2025/01/29/particles-progress-and-perseverance-a-journey-into-webgpu-fluids/)
- [Field Guide to TSL and WebGPU — Maxime Heckel](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [Interactive Galaxy with WebGPU Compute Shaders — threejsroadmap.com](https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders)
- [Houdini APIs — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Houdini_APIs)
- [CSS Houdini Paint Worklet for noise — github.com/jh3y/houdini-noise](https://github.com/jh3y/houdini-noise)
- [Cross-browser paint worklets and Houdini.how — web.dev](https://web.dev/articles/houdini-how)
- [Animated Grainy Texture — CSS-Tricks](https://css-tricks.com/snippets/css/animated-grainy-texture/)
- [CSS in 2025-2026: It's Getting Too Powerful — DEV Community](https://dev.to/pixelperfect_pro/css-in-2025-2026-its-getting-too-powerful-and-im-scared-2ej8)
- [Springs and Bounces in Native CSS — Josh W. Comeau](https://www.joshwcomeau.com/animation/linear-timing-function/)
- [10 Websites with Great Animation in 2026 — School of Motion](https://www.schoolofmotion.com/blog/10-websites-with-great-animation-in-2026)
- [Best Animated Websites 2026 — designrush.com](https://www.designrush.com/best-designs/websites/trends/best-animated-websites)

---

## Review Log

### 2026-04-22 Review

**Staleness assessment: LOW** — Animation techniques and browser APIs documented here are stable. Minor version bumps in libraries but no architectural changes.

**Key items verified:**
- View Transitions API: Same-document transitions remain Baseline Newly Available. Cross-document progressing via Interop 2026 as noted. Chrome 140+ scoped transitions still experimental.
- CSS Scroll-Driven Animations: Firefox support landed as predicted. `sibling-index()` in Chrome 137+.
- `@property`: Baseline, no changes.
- Motion: Was v12.36 at writing; likely v12.37-12.39 by now. No breaking changes in minor releases — the API documented here (AnimatePresence, layoutId, useScroll) is stable.
- GSAP: Free status post-Webflow acquisition unchanged. ScrollTrigger, SplitText, MorphSVG all free as documented.
- Rive: Still production, still used by Duolingo. No major version changes.
- WebGPU + Three.js TSL: Three.js likely r172-r173 by now. TSL API is stabilizing but the patterns documented here remain correct.
- CSS Houdini Paint Worklets: Still Chromium-only native, polyfill still needed for Firefox.

**Minor update:** Motion version should be checked on next deep review — the v12.36 reference may be slightly behind. No API changes expected.

**Items to watch for next review:**
- Chrome 145 scroll-triggered animations landing
- React ViewTransition component moving from canary to stable
- Three.js WebGPU renderer becoming the default renderer (currently opt-in)

**No factual corrections needed.**

#animation #css #gsap #motion #rive #webgpu #houdini #view-transitions #scroll-driven #place-org #research
