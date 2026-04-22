# Portfolio Scroll Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a jms.dev-inspired scroll portfolio at `/portfolio` with 5 full-viewport sections, 8 floating SVG objects, a scroll-driven flowing line, and a Matter.js physics sandbox.

**Architecture:** Single Next.js App Router page under the existing `(immersive)` route group. Framer Motion drives all scroll animations and spring physics. Matter.js handles the interactive "Catch" section only, lazy-loaded. Custom SVG objects are shared across sections via context.

**Tech Stack:** Next.js 16 (App Router), motion v12, Matter.js, Instrument Serif + Satoshi + JetBrains Mono, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-03-23-portfolio-scroll-design.md`

---

## Task 1: Foundation — Route, Fonts, Design Tokens

**Files:**
- Modify: `app/(immersive)/portfolio/page.tsx`
- Create: `app/(immersive)/portfolio/portfolio.css`
- Create: `app/(immersive)/portfolio/layout.tsx` (override immersive layout — portfolio needs its own scroll container without the shared nav padding)
- Modify: `app/layout.tsx` (add Instrument Serif + JetBrains Mono via next/font/google)
- Download: Satoshi woff2 files to `public/fonts/`

**Context the agent needs:**
- The existing immersive layout at `app/(immersive)/layout.tsx` wraps with `ImmersiveNav` and `BackToDesktop`. The portfolio page needs its OWN layout that removes the shared nav (the portfolio is a full-screen scroll experience, not a standard immersive page).
- Existing globals.css uses `--place-*` tokens. Portfolio adds its own `--portfolio-*` tokens scoped to the portfolio page.
- Motion v12 is already installed as `motion` package (import from `motion/react`).

- [ ] Install matter-js: `pnpm add matter-js @types/matter-js`
- [ ] Download Satoshi Variable woff2 from Fontshare, place in `public/fonts/Satoshi-Variable.woff2` and `public/fonts/Satoshi-VariableItalic.woff2`
- [ ] Create `app/(immersive)/portfolio/layout.tsx` — a minimal layout that does NOT include ImmersiveNav or BackToDesktop. Just renders children in a full-screen scroll container with `scroll-snap-type: y proximity`.
- [ ] Create `app/(immersive)/portfolio/portfolio.css` with all design tokens from spec Section 3 (colors, typography classes, layout constants). Use `--portfolio-*` prefix to avoid collision with existing `--place-*` tokens.
- [ ] Rewrite `app/(immersive)/portfolio/page.tsx` — import portfolio.css, render 5 empty `<section>` elements with correct IDs, background colors, and `min-height: 100vh`. Sections: hero (light), the-throw (light), the-air (150vh, gradient), the-catch (dark), cta (deep).
- [ ] Add font loading: Instrument Serif and JetBrains Mono via `next/font/google` in root layout. Satoshi via `@font-face` in portfolio.css.
- [ ] Verify: `pnpm dev`, navigate to `/portfolio`, see 5 colored sections, fonts load, scroll snaps work.
- [ ] Commit: `feat(portfolio): scaffold route with design system and fonts`

---

## Task 2: SVG Objects — Sneaker, Oar, Browser, Club

**Files:**
- Create: `app/(immersive)/portfolio/components/objects/Sneaker.tsx`
- Create: `app/(immersive)/portfolio/components/objects/Oar.tsx`
- Create: `app/(immersive)/portfolio/components/objects/Browser.tsx`
- Create: `app/(immersive)/portfolio/components/objects/Club.tsx`

**Context the agent needs:**
- Read spec Section 4 "Object Inventory" and "Object Asset Production" for exact visual style.
- Each is an inline SVG React component. ViewBox 0 0 80 80. Bold 2-2.5px strokes, single accent color + white. Risograph/technical illustration aesthetic — slightly imperfect paths (1-2px organic wobble).
- Accept `className` and `style` props. Export as named export.
- Sneaker: AJ1 High silhouette, `--obj-blue` (#3b82f6) + white. Patent-drawing style.
- Oar: Sculling oar diagonal, `--obj-amber` (#f59e0b). Thin, elegant. 2px stroke.
- Browser: Mini browser chrome (3 dots + URL bar), gray frame, blurred blue/green content area. ~120x80 (non-square viewBox ok).
- Club: Juggling club, `--obj-blue` head, white handle. Bold stroke. ~60px tall (adjust viewBox).

- [ ] Create Sneaker.tsx with hand-drawn AJ1 SVG
- [ ] Create Oar.tsx with sculling oar SVG
- [ ] Create Browser.tsx with browser window SVG
- [ ] Create Club.tsx with juggling club SVG
- [ ] Verify: render all 4 in a temp test page, visually inspect
- [ ] Commit: `feat(portfolio): add sneaker, oar, browser, club SVG objects`

---

## Task 3: SVG Objects — Balls, Ian, Object System

**Files:**
- Create: `app/(immersive)/portfolio/components/objects/Ball.tsx`
- Create: `app/(immersive)/portfolio/components/objects/Ian.tsx`
- Create: `app/(immersive)/portfolio/components/objects/index.ts` (barrel export)
- Create: `app/(immersive)/portfolio/lib/objects.ts` (object definitions, physics props, initial positions)

**Context the agent needs:**
- Ball.tsx accepts a `color` prop (rose/violet/amber hex values). Classic juggling ball with white stripe. ~40px diameter.
- Ian: Dog silhouette in profile, ears perked, head tilted. `--obj-emerald` (#10b981). 2.5px stroke. NOT cartoonish — dignified, simplified. Must read clearly at 60px.
- `lib/objects.ts` exports an `OBJECTS` array with: id, component reference, initial position (x%, y%), physics properties (mass, restitution, friction, gravityScale). See spec Section 4 table.

- [ ] Create Ball.tsx with color prop
- [ ] Create Ian.tsx with dog silhouette SVG
- [ ] Create index.ts barrel exporting all object components
- [ ] Create lib/objects.ts with OBJECTS array definition
- [ ] Commit: `feat(portfolio): add ball, ian objects and object registry`

---

## Task 4: Floating Object Animation System

**Files:**
- Create: `app/(immersive)/portfolio/components/objects/FloatingObject.tsx`
- Create: `app/(immersive)/portfolio/components/objects/ObjectProvider.tsx`
- Create: `app/(immersive)/portfolio/hooks/useObjectPositions.ts`

**Context the agent needs:**
- FloatingObject wraps any SVG object with Framer Motion spring bob animation. Props: `objectId`, `children` (the SVG), `initialPosition` ({x, y}), `scale` (default 1). Uses spring physics: `stiffness: 20, damping: 5` for organic float. Each instance has different duration/delay for desync.
- ObjectProvider is a React context that tracks all objects' current positions and visibility state across sections. Components read from this to coordinate object movement between sections.
- useObjectPositions hook consumes the context.
- Import motion from `motion/react` (v12 API).

- [ ] Create FloatingObject.tsx with spring bob animation
- [ ] Create ObjectProvider.tsx context provider
- [ ] Create useObjectPositions.ts hook
- [ ] Verify: wrap a test object in FloatingObject, confirm spring animation
- [ ] Commit: `feat(portfolio): add floating object animation system`

---

## Task 5: Hero Section

**Files:**
- Create: `app/(immersive)/portfolio/components/sections/Hero.tsx`
- Create: `app/(immersive)/portfolio/components/ui/ScrollIndicator.tsx`
- Modify: `app/(immersive)/portfolio/page.tsx` (replace empty hero section)

**Context the agent needs:**
- Read spec Section 6 "HERO" for exact layout and animation sequence.
- Name "Trajan" in display-xl (Instrument Serif italic), left-aligned, baseline ~40% from top.
- Subtitle: "Developer. Designer. Too many things in the air." in body-lg, text-secondary.
- All 8 objects scattered around the name, each in a FloatingObject wrapper with staggered entrance.
- Character-by-character name reveal: individual `<span>` per char, Framer Motion staggerChildren: 0.06, each fades in + translates up 8px.
- Objects enter from below with spring animation, staggered 120ms, order: ball-1, ball-2, ball-3, club, sneaker, browser, oar, ian.
- ScrollIndicator: thin pulsing vertical line + "scroll" label at bottom center.
- Background: `--portfolio-bg-light` (#fafaf9).

- [ ] Create ScrollIndicator.tsx
- [ ] Create Hero.tsx with name animation, subtitle, object placement, entrance sequence
- [ ] Wire into page.tsx
- [ ] Verify: hero renders with typing animation, objects spring in, indicator pulses
- [ ] Commit: `feat(portfolio): implement hero section with animated entrance`

---

## Task 6: The Flowing Line

**Files:**
- Create: `app/(immersive)/portfolio/components/FlowingLine.tsx`
- Create: `app/(immersive)/portfolio/lib/path.ts`
- Create: `app/(immersive)/portfolio/hooks/useSectionProgress.ts`
- Modify: `app/(immersive)/portfolio/page.tsx` (add FlowingLine overlay)

**Context the agent needs:**
- Read spec Section 5 and Section 7 for path coordinates and implementation.
- Single SVG path, position fixed, full viewport, pointer-events none, z-index 1.
- Path in viewBox 0 0 1000 6000. Uses quadratic bezier curves (Q) for parabolic arcs.
- Scroll-driven pathLength animation via `useScroll()` + `useTransform()` from motion/react.
- Color transitions: dark on light sections, light on dark sections, blue on CTA. Use `useTransform` to interpolate colors based on scrollYProgress.
- Subtle glow (drop-shadow) on dark sections only.
- useSectionProgress hook: takes a section ref, returns 0-1 progress through that section.

- [ ] Author path `d` attribute in lib/path.ts (parabolic arcs per spec Section 7)
- [ ] Create useSectionProgress.ts hook
- [ ] Create FlowingLine.tsx with scroll-driven pathLength and color transitions
- [ ] Wire into page.tsx
- [ ] Verify: line draws progressively on scroll, color shifts between sections
- [ ] Commit: `feat(portfolio): add scroll-driven flowing line with color transitions`

---

## Task 7: The Throw Section

**Files:**
- Create: `app/(immersive)/portfolio/components/sections/TheThrow.tsx`
- Modify: `app/(immersive)/portfolio/page.tsx`

**Context the agent needs:**
- Read spec Section 6 "THE THROW".
- Sneaker object drifts to center and scales 2x as section enters viewport. Other objects drift to periphery.
- Text left of sneaker (below on mobile): label "01" in accent, heading "The first throw." in display-lg italic, body copy (the spec quote about eighth grade), mono comment `// if the checkout was fast enough, you won`.
- Use `useScroll({ target: sectionRef })` to drive sneaker scale/position.
- Text enters with staggered fade-up (label → heading → body → mono).
- Background: `--portfolio-bg-light`.

- [ ] Create TheThrow.tsx with scroll-driven sneaker animation and staggered text
- [ ] Wire into page.tsx
- [ ] Verify: sneaker scales on scroll, text staggers in
- [ ] Commit: `feat(portfolio): implement The Throw section`

---

## Task 8: The Air Section

**Files:**
- Create: `app/(immersive)/portfolio/components/sections/TheAir.tsx`
- Modify: `app/(immersive)/portfolio/page.tsx`

**Context the agent needs:**
- Read spec Section 6 "THE AIR". This is the most complex section — 150vh, two phases.
- **First half (light bg):** Objects scatter to random positions (seeded deterministic random by object ID). Heading "Then everything else went up." in display-lg. Five scattered text fragments (spec has the exact copy) positioned around objects like a collage — fade in staggered from different directions on scroll.
- **Second half (darkening):** Text fades out. Objects reorganize from scattered chaos into concentric orbital rings using Framer Motion layout animations. Balls inner ring, sneaker/browser/club middle, oar/ian outer. Entire system rotates slowly (1 rev / 30s per ring, different speeds). Background: CSS gradient from `--portfolio-bg-light` to `--portfolio-bg-dark`.
- Use section scroll progress (0-1) to interpolate between scattered and organized states.

- [ ] Create TheAir.tsx — scatter state with heading and text fragments
- [ ] Add organized state with concentric orbital animation
- [ ] Add scroll-driven interpolation between scatter and organized
- [ ] Wire into page.tsx
- [ ] Verify: objects scatter then reorganize, background transitions, text collage works
- [ ] Commit: `feat(portfolio): implement The Air section with scatter-to-orbit transition`

---

## Task 9: The Catch Section (Matter.js)

**Files:**
- Create: `app/(immersive)/portfolio/components/sections/TheCatch.tsx`
- Create: `app/(immersive)/portfolio/hooks/usePhysicsEngine.ts`
- Create: `app/(immersive)/portfolio/hooks/useDeviceOrientation.ts`
- Create: `app/(immersive)/portfolio/lib/physics.ts`
- Modify: `app/(immersive)/portfolio/page.tsx`

**Context the agent needs:**
- Read spec Section 6 "THE CATCH" carefully — this is the interactive physics sandbox.
- Matter.js engine with custom canvas renderer (NOT Matter.Render). Gravity: { x: 0, y: 0.8 }.
- All 8 objects as physics bodies. Use SVG components rendered to the canvas (drawImage with pre-rendered sprites, or render SVG React components as DOM overlay synced to body positions — DOM overlay is simpler for a first pass).
- MouseConstraint for grab-and-throw. Walls on left, right, bottom.
- Ian has `gravityScale: 0.05` — near-zero gravity, floats up.
- Lazy-init: only create engine when section is within 1 viewport via IntersectionObserver. Destroy on leave.
- Heading "Catch." at top, hint "grab. throw. play." top-right.
- **Transition from Section 3:** When entering, objects should appear at top and fall. For first pass, just spawn them at random positions along the top edge.
- useDeviceOrientation: request gyroscope permission on mobile, map tilt to gravity.x/gravity.y.
- physics.ts: engine config, body definitions per object (mass, restitution, friction from spec table).

- [ ] Create physics.ts with engine config and body definitions
- [ ] Create usePhysicsEngine.ts — engine lifecycle, body management, MouseConstraint
- [ ] Create useDeviceOrientation.ts — gyroscope permission + tilt data
- [ ] Create TheCatch.tsx — canvas/DOM rendering, object spawning, heading/hint
- [ ] Implement Ian's special gravity + IanCard easter egg click handler
- [ ] Wire into page.tsx
- [ ] Verify: objects fall, bounce, can be grabbed and thrown, Ian floats
- [ ] Commit: `feat(portfolio): implement The Catch physics sandbox`

---

## Task 10: CTA Section

**Files:**
- Create: `app/(immersive)/portfolio/components/sections/CTA.tsx`
- Create: `app/(immersive)/portfolio/components/ui/SocialButton.tsx`
- Modify: `app/(immersive)/portfolio/page.tsx`

**Context the agent needs:**
- Read spec Section 6 "CTA".
- Background: `--portfolio-bg-deep` (#0a1628).
- Objects in tight juggling cascade pattern (Framer Motion, figure-eight with all 8 objects).
- Heading: "Let's throw something up." in display-lg.
- Body copy: consulting/build availability text (see spec).
- Three outlined buttons (GitHub, LinkedIn, Email) with hover fill effect.
- Special link: "→ explore the desktop" linking to the desktop route.
- Footer: "built with excessive ambition and claude-opus-4-6 · © 2026 trajan" in mono-xs, opacity 0.3.

- [ ] Create SocialButton.tsx (outlined style, hover fill)
- [ ] Create CTA.tsx with cascade animation, text, buttons, footer
- [ ] Wire into page.tsx
- [ ] Verify: cascade animation runs, buttons work, desktop link works
- [ ] Commit: `feat(portfolio): implement CTA section with cascade animation`

---

## Task 11: Ian Easter Egg Card

**Files:**
- Create: `app/(immersive)/portfolio/components/ui/IanCard.tsx`
- Modify: Ian object components to handle click

**Context the agent needs:**
- Read spec Section 4 "Ian Easter Egg Behavior".
- On hover (desktop): subtle glow, cursor pointer.
- On click: frosted glass card expands from Ian's position. Max-width 280px, backdrop-filter blur(12px).
- Card text: *"The one that never comes down."* (Instrument Serif italic) + "His name is Ian. They said he couldn't be trained. I didn't listen." (Satoshi 14px).
- Click outside to dismiss. AnimatePresence for enter/exit.

- [ ] Create IanCard.tsx with frosted glass card and AnimatePresence
- [ ] Add click handler to Ian in FloatingObject and TheCatch contexts
- [ ] Verify: hover glow, click opens card, click outside dismisses
- [ ] Commit: `feat(portfolio): add Ian easter egg card`

---

## Task 12: Mobile Adaptation + Reduced Motion + Polish

**Files:**
- Modify: multiple section components
- Modify: `app/(immersive)/portfolio/portfolio.css`

**Context the agent needs:**
- Read spec Sections 11 (Mobile) and 10 (Performance).
- Mobile (<768px): reduce objects to 5 (drop ball-3, club, oar). Stack layouts vertically. Stack CTA buttons.
- Tablet (768-1024px): adjust typography scale, keep all objects.
- `prefers-reduced-motion`: disable spring animations (snap to final positions), disable floating bob, show flowing line fully drawn, disable Matter.js (show static objects), instant text fades.
- Performance: `will-change: transform` on animated objects, preload fonts, lazy-load Matter.js.

- [ ] Add responsive breakpoints to all section components
- [ ] Add prefers-reduced-motion media query support
- [ ] Add font preload links
- [ ] Performance pass — verify bundle size, will-change usage
- [ ] Verify: test at 375px, 768px, 1440px widths + reduced motion
- [ ] Commit: `feat(portfolio): add mobile adaptation and reduced motion support`

---

*End of plan. 12 tasks, ~30 steps. Tasks 2-4 are parallelizable. Tasks 5-10 are mostly sequential but 6 can run parallel to 7.*
