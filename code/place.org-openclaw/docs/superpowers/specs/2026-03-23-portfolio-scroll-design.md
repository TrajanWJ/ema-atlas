# TRAJAN — Portfolio Scroll Site
## Final Spec · Ship-Ready Handoff Document
### place.org/portfolio

---

## DOCUMENT PURPOSE

This is the complete creative and technical specification for Trajan's portfolio scroll page. It is written to be consumed by a coding agent (Claude Code, Cursor, or similar) as a single-pass build prompt. Every decision is made. No ambiguity remains. The agent's job is execution, not design.

**If a section says "AGENT TASK," that is a discrete unit of work the coding agent must complete.**

---

## 1. PROJECT CONTEXT

### What this is
A single-page scroll experience at `place.org/portfolio` (or equivalent route). It sits alongside a separate desktop OS experience (`place.org/desktop`). This page is the front door — the thing people land on. The desktop is the deeper experience they can explore from here.

### Who sees it
Clients, employers, collaborators, and other developers — all equally. The site must impress a non-technical business owner AND a senior engineer. The way it does this: the vibes land first (everyone feels craft), the interactivity rewards curiosity (engineers stay and play), and the CTA is clear (everyone knows how to reach you).

### What matters, in order
1. **Vibes + interactivity** — the animations, physics, and overall feel ARE the portfolio proof
2. **The story** — copy supports the vibes, gives structure and emotional arc
3. **Interactive demos** — small, embedded, functional things that show what you build
4. **Everything else** — project cards, links, details

---

## 2. TECH STACK

### Framework
**Next.js (App Router)** — this is a route within the place.org Next.js project. Use `app/portfolio/page.tsx` as the entry point.

### Animation
**Framer Motion (`motion/react`)** — all scroll-driven animations, SVG path drawing, layout transitions, spring physics for floating objects, `useScroll` + `useTransform` for scroll-linked effects.

### Physics Engine
**Matter.js** — used in THE CATCH section only. Handles gravity, collisions, mouse/touch constraints, and custom sprite rendering. Objects are defined as Matter.js bodies with SVG sprite textures. Do NOT use Matter.js's built-in renderer — render with a custom Canvas or DOM layer synced to Matter.js body positions so we control the visual style.

### Fonts
- **Display:** `Instrument Serif` (Google Fonts, SIL Open Font License). Italic style for headings. Load via `next/font/google`.
- **Body / UI:** `Satoshi` (Fontshare, free for personal + commercial). Variable weight. Self-host the woff2 files — Fontshare doesn't have a CDN import like Google Fonts. Download from https://www.fontshare.com/fonts/satoshi, place in `public/fonts/`, load via `@font-face` in global CSS.
- **Mono:** `JetBrains Mono` (Google Fonts, SIL OFL). For code snippets and narrator asides.

### Deployment
Self-hosted (Trajan's Linux mini PC). The Next.js app runs via Docker + systemd. No Vercel-specific features needed — stick to standard Next.js patterns. Static generation preferred where possible (`generateStaticParams`, no server-side data fetching on this route).

### Key Dependencies
```json
{
  "motion": "^11.x",
  "matter-js": "^0.20.x",
  "@types/matter-js": "^0.19.x"
}
```

---

## 3. DESIGN SYSTEM

### Color

```css
:root {
  /* Light sections */
  --bg-light: #fafaf9;
  --text-primary: #18181b;
  --text-secondary: #71717a;
  --text-muted: #a1a1aa;
  --accent: #3b82f6;

  /* Dark sections */
  --bg-dark: #09090b;
  --bg-dark-subtle: #111113;
  --text-on-dark: #fafaf9;
  --text-on-dark-secondary: #a1a1aa;
  --accent-light: #60a5fa;

  /* CTA / final section */
  --bg-deep: #0a1628;

  /* Object accent palette (for juggling props + highlights) */
  --obj-blue: #3b82f6;
  --obj-amber: #f59e0b;
  --obj-rose: #f43f5e;
  --obj-emerald: #10b981;
  --obj-violet: #8b5cf6;
}
```

No gradients on section backgrounds. Flat colors. The ONLY gradient is the light→dark transition section (Section 3), which uses a CSS vertical gradient from `--bg-light` to `--bg-dark` on the section element.

### Typography Scale

```css
.display-xl  { font-family: 'Instrument Serif', serif; font-style: italic; font-size: clamp(72px, 10vw, 160px); line-height: 1.0; letter-spacing: -0.02em; }
.display-lg  { font-family: 'Instrument Serif', serif; font-style: italic; font-size: clamp(40px, 6vw, 72px); line-height: 1.1; letter-spacing: -0.01em; }
.body-lg     { font-family: 'Satoshi', sans-serif; font-size: clamp(16px, 1.8vw, 20px); line-height: 1.6; font-weight: 400; }
.body-md     { font-family: 'Satoshi', sans-serif; font-size: 16px; line-height: 1.6; font-weight: 400; }
.mono-sm     { font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.5; font-weight: 400; color: var(--text-muted); }
.mono-xs     { font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.4; font-weight: 400; color: var(--text-muted); }
.label       { font-family: 'Satoshi', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
```

### Layout Constants

```css
--section-height: 100vh;
--section-height-tall: 150vh;  /* for transition sections that need scroll room */
--content-max-width: 1200px;
--content-padding: clamp(24px, 5vw, 80px);
```

### Scroll Behavior

```css
html {
  scroll-snap-type: y proximity;  /* proximity, not mandatory — allows partial stops */
}
.section {
  scroll-snap-align: start;
  min-height: var(--section-height);
}
```

Use `proximity` not `mandatory` — mandatory scroll-snap fights with physics sections and longer content. Proximity gives the "full page" feel without trapping the user.

---

## 4. THE FLOATING OBJECTS

These are the recurring visual cast of the site. They appear first in the hero, recur throughout, and converge at the end. They must be built as a shared component system.

### Object Inventory

| ID | Object | Description | Visual Style | Physics Properties |
|----|--------|-------------|-------------|-------------------|
| `sneaker` | AJ1 High | Air Jordan 1 silhouette in profile | Single color (`--obj-blue`) + white accent fill. Bold 2.5px stroke. Patent-drawing / blueprint aesthetic. Clean, geometric, not photorealistic. | Medium mass, medium restitution (0.6) |
| `oar` | Sculling oar | Single oar, diagonal, blade + shaft | Single color (`--obj-amber`). Thin, elegant. The blade has a slight curve. 2px stroke, minimal fill. | Light mass, low restitution (0.3), high air friction |
| `browser` | Browser window | Miniature browser chrome (3 dots + URL bar) with a blurred/abstracted screenshot of a shipped site inside | Gray chrome frame, the "content" area is a soft blur of blues/greens suggesting a real page. ~120x80px. | Medium mass, medium restitution (0.5) |
| `ian` | Dog silhouette | Small dog in alert pose — ears perked, head slightly tilted, body in 3/4 profile. Not cartoonish — simplified but recognizable as a real dog. | Single color (`--obj-emerald`). 2.5px stroke, selective fill (ears, body outline). Warmer, softer lines than the technical objects. | **Unique: near-zero gravity.** Ian doesn't arc like other objects. He floats with very gentle drift. This is the easter egg — he never comes down. |
| `ball-1` | Juggling ball | Classic juggling ball with a stripe/panel pattern | `--obj-rose` fill with a white stripe. Slightly oversized, ~40px diameter. Smooth, friendly. | Light mass, HIGH restitution (0.85) — very bouncy |
| `ball-2` | Juggling ball | Same form, different color | `--obj-violet` fill with white stripe | Same as ball-1 |
| `ball-3` | Juggling ball | Same form, different color | `--obj-amber` fill with white stripe | Same as ball-1 |
| `club` | Juggling club | Classic juggling club — bulbous head, tapered handle | `--obj-blue` head, white handle. Bold stroke. ~60px tall. | Medium mass, medium restitution (0.5), rotates on collision |

### Object Asset Production

**AGENT TASK: SVG Asset Creation**

Each object must be created as an optimized inline SVG component (`components/objects/Sneaker.tsx`, etc.). The coding agent should:

1. Create each SVG by hand in code. These are simple, bold, illustrative shapes — not traced photographs. Think: thick strokes, limited fills, the aesthetic of a technical illustration or screen print.
2. Each SVG must have a consistent viewBox and be designed at a base size of 80x80px (square bounding box) for physics body registration.
3. Export a React component that accepts `className` and `style` props.
4. Also export a static PNG render of each (for Matter.js sprite texture) at 2x (160x160px) into `public/objects/`. **Method:** Add a one-time Node script at `scripts/rasterize-objects.ts` that uses `sharp` (already a Next.js transitive dep) to render each SVG to PNG. Run manually during development, commit the PNGs. This is NOT a build-time step — it runs once when objects change.

**Style reference for the agent:** The objects should look like they belong on a risograph print or a Helvetica-era technical manual. Bold, confident, slightly imperfect (not mathematically perfect curves — add very subtle wobble to paths, 1-2px of organic deviation). Limited palette per object (one color + white). Consistent 2-2.5px stroke weight across all objects.

**For Ian specifically:** The silhouette should read clearly at 60px. Profile view, ears up, slight head tilt. Think of a medium-sized dog (lab/shepherd mix proportions). The emotional read should be: alert, present, loyal. Not cute-cartoon — dignified.

### Object Component Architecture

```
components/
  objects/
    ObjectProvider.tsx    <- Context provider: tracks all objects' positions, states, visibility
    FloatingObject.tsx    <- Framer Motion wrapper: handles float animation, scroll-linked position
    PhysicsObject.tsx     <- Matter.js wrapper: registers body, syncs position from engine
    Sneaker.tsx           <- SVG component
    Oar.tsx
    Browser.tsx
    Ian.tsx
    Ball.tsx              <- Accepts color prop
    Club.tsx
    IanCard.tsx           <- The expandable card that appears when Ian is clicked/tapped
```

### Ian Easter Egg Behavior

- **Default state:** Ian floats among other objects. Visually identical treatment (same stroke weight, same animation system). No label, no tooltip, no indication he's special.
- **Hover (desktop):** Subtle glow appears around Ian (box-shadow or SVG filter). Cursor changes to pointer.
- **Click/tap:** A small card expands from Ian's position. The card contains:
  - A line in Instrument Serif italic: *"The one that never comes down."*
  - Below, in Satoshi 14px: "His name is Ian. They said he couldn't be trained. I didn't listen."
  - The card has a frosted glass background (`backdrop-filter: blur(12px)`), rounded corners, max-width 280px.
  - Click/tap anywhere outside to dismiss.
- **Physics behavior:** In THE CATCH section (Matter.js), Ian has near-zero gravity (`body.gravityScale = 0.05`). He drifts slowly upward while everything else falls. He's the only object that defies the simulation. If the user throws him, he arcs but then slowly floats back up.

---

## 5. THE FLOWING LINE

A single SVG `<path>` element that spans the full height of the page. It's drawn progressively as the user scrolls — invisible at load, fully drawn by the time they reach the bottom.

### Technical Implementation

```tsx
// Simplified architecture
const FlowingLine = () => {
  const { scrollYProgress } = useScroll();
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <svg className="flowing-line" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <motion.path
        d={LINE_PATH_D}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        style={{ pathLength }}
      />
    </svg>
  );
};
```

### Path Shape

The path must be hand-authored to create **parabolic arcs** — the physics of thrown objects. It should:

- Start from the center-top of the hero section
- Make 5-6 major arcs, each peaking at a section boundary
- Arcs alternate left-right (first peaks left of center, second peaks right, etc.)
- Each arc's peak is where a floating object sits (visually, the object is "at the top of its throw")
- The arcs get tighter and faster toward the bottom (the juggling intensifies)
- Total path length should be roughly 4000-5000px of stroke

**AGENT TASK:** Author the path `d` attribute. Use quadratic bezier curves (`Q`) for the parabolic shapes. The path should be responsive — define it in a `viewBox="0 0 1000 6000"` (matching Section 7 coordinates) and let it scale to the full page height via CSS.

### Line Color

The line color transitions with the page background:
- Light sections: `#18181b` (near-black)
- During light-to-dark transition: crossfade to `#e4e4e7`
- Dark sections: `#e4e4e7` (light gray)
- CTA section: `#60a5fa` (accent blue)

Implement via `useTransform` mapping `scrollYProgress` to a color interpolation.

### Line Glow

No glow by default. On the dark sections only, add a subtle `filter: drop-shadow(0 0 4px currentColor)` with ~0.3 opacity.

---

## 6. SECTIONS

### Section 1: HERO
**Height:** 100vh
**Background:** `--bg-light`

#### Layout
- Name "Trajan" in `.display-xl`, left-aligned, baseline ~40% from top. Left margin: `--content-padding`.
- Below the name, ~24px gap: subtitle in `.body-lg`, `--text-secondary` color.
- Subtitle text: `Developer. Designer. Too many things in the air.`
- Objects (all 8) are scattered around and above the name in their initial float positions. They're in continuous gentle motion (spring physics bob, NOT sine wave — use Framer Motion spring with `stiffness: 20, damping: 5` for organic feel).
- Each object has a slightly different float rhythm (vary `duration` and `delay`).
- Bottom center: scroll indicator — a thin vertical line (1px, 30px tall) that pulses height (30-50-30px, 2s loop), with "scroll" in `.mono-xs` below it.

#### Load Animation Sequence
1. **0ms:** Page renders, everything invisible.
2. **100ms:** Name begins typing in, character by character. Use Framer Motion `staggerChildren: 0.06` on individual `<span>` elements wrapping each character. Each character fades in + translates up 8px. Total name duration: ~0.8s.
3. **900ms:** Subtitle fades in (opacity 0-1, y 12-0, duration 0.5s, ease `easeOut`).
4. **600ms-1600ms (staggered):** Objects enter from below viewport. Each springs up to its resting position with `type: "spring", stiffness: 80, damping: 12`. Stagger: 120ms between each. Order: ball-1, ball-2, ball-3, club, sneaker, browser, oar, ian (Ian enters last).
5. **1800ms:** Scroll indicator fades in.

---

### Section 2: THE THROW
**Height:** 100vh
**Background:** `--bg-light`

#### Concept
Your origin story in one beat. Not "I wanted to understand how things worked" — instead, the *sneaker*. The first object you ever threw into the air. This is about the specific moment when tinkering became automation.

#### Layout
- The sneaker object from the hero drifts to center-screen and scales up (~2x) as the user scrolls into this section. It becomes the focal point. Other objects continue floating but drift to the periphery.
- Text appears to the left of the sneaker (or below on mobile):
  - Chapter label in `.label`, `--accent` color: `01`
  - Heading in `.display-lg`: *"The first throw."*
  - Body copy in `.body-lg`, `--text-secondary`, max-width 480px:

> "Eighth grade. A shoe dropped, and the only way to get it was to be faster than everyone else. So I wrote something that was. That was the first time I realized: the interesting thing was never the shoe. It was the system that got it."

- Below the paragraph, in `.mono-sm`:

> `// if the checkout was fast enough, you won`

#### Animation
- Sneaker scales + moves to center as section enters viewport (`whileInView` + `useScroll` for the section's scroll progress).
- Text fades up with staggered children (label - heading - paragraph - mono comment).
- The flowing line makes its first big parabolic arc here, peaking near the sneaker.

---

### Section 3: THE AIR
**Height:** 150vh (needs extra scroll room for the transition + reorganization)
**Background:** CSS gradient from `--bg-light` (top) to `--bg-dark` (bottom)

#### Concept
Everything else enters the air. The screen fills with objects — scattered, overlapping, chaotic. Then as you scroll, they reorganize into a coordinated system. This is the visual thesis: chaos becomes architecture.

#### First Half (light bg, ~75vh of scroll)

Objects scatter across the viewport — random positions, random slight rotations, different scales. They look like a mess. Text appears in the clear spaces between them:

Heading in `.display-lg`:

> *"Then everything else went up."*

Body copy, broken into short phrases that appear scattered (not a block paragraph — individual lines positioned around the objects):

> "NLP parsers to read confirmation emails."
> "A content farm that printed money."
> "A governance system with its own constitution."
> "Sixty feet of carbon fiber and eight rowers listening."
> "A dog everyone said couldn't be trained."

Each line in `.body-md`, `--text-secondary`. They fade in staggered as the user scrolls, each from a slightly different direction. The lines are positioned around the objects — the composition should feel like a collage or evidence board, not a list.

#### Second Half (darkening bg, ~75vh of scroll)

As the user continues scrolling through the gradient:
- Text fades out
- Objects begin to reorganize — they move from scattered chaos into a **tight orbital pattern** (concentric ellipses, like a mobile/kinetic sculpture seen from above, or like electron shells)
- The reorganization uses Framer Motion `layout` animations with `layoutId` on each object. Define two layout states: `scattered` (random positions set via style) and `organized` (calculated positions on concentric circles)
- Scroll progress through this section (tracked via `useScroll({ target: sectionRef })`) interpolates between the two states
- By the time the background is fully dark, the objects are in a clean, rhythmic orbital pattern, slowly rotating

#### Animation Details
- Object scatter positions: randomize on mount, but seed them so they're consistent across refreshes. Use a deterministic random based on object ID.
- Reorganized positions: place objects on 2-3 concentric circles. Balls on the inner ring (small, fast), sneaker/browser/club on the middle ring, oar/ian on the outer ring (slow, stately). Ian's orbit should be the outermost — he's always slightly apart.
- Rotation: the entire organized system rotates slowly (1 revolution per 30 seconds). Each ring rotates at a different speed. CSS `transform: rotate()` driven by `requestAnimationFrame`, not scroll — this is ambient motion.

---

### Section 4: THE CATCH
**Height:** 100vh (but the canvas fills the viewport and is interactive — user can stay as long as they want)
**Background:** `--bg-dark`

#### Concept
An interactive physics sandbox. This is the engagement peak — the moment someone stops scrolling and starts playing. All the objects from the previous sections are now Matter.js physics bodies. Gravity is on. The user can grab and throw them. They bounce, collide, settle, and can be thrown again.

This section IS portfolio proof: physics programming, interaction design, attention to craft. Compressed into a toy.

#### Transition from Section 3
When The Catch enters the viewport, the Framer Motion orbital objects should animate to their "drop positions" (top of canvas) and then hand off to Matter.js. Sequence: (1) orbital rotation stops, (2) objects animate via Framer Motion to positions along the top edge of the canvas, (3) Framer Motion objects are unmounted and replaced by Matter.js bodies at the same positions, (4) gravity kicks in. This must be a clean swap — no visual jump.

#### Layout
- Heading at top in `.display-lg`, `--text-on-dark`: *"Catch."*
- Below: the Matter.js canvas fills the remaining viewport.
- A hint in `.mono-sm` at the top-right: `grab. throw. play.`
- Objects fall in from the top when the section enters the viewport (Matter.js gravity kicks in).
- Walls on left, right, and bottom of canvas (invisible Matter.js static bodies) keep objects contained.
- The user can click/touch and drag any object — `MouseConstraint` in Matter.js. On release, the object continues with the velocity of the throw.

#### Physics Tuning (cartoony feel)
```js
const engine = Engine.create({
  gravity: { x: 0, y: 0.8 }  // slightly less than Earth gravity — floatier
});

// Per-object properties defined in the Object Inventory table above
// Key tuning for "cartoony":
// - Higher restitution than realistic (0.5-0.85) = bouncier
// - Lower friction (0.05) = slidier
// - Slightly lower gravity = objects hang in the air a beat longer
// - frictionAir: 0.01 = objects travel further when thrown
```

#### Custom Rendering (NOT Matter.js default renderer)

Use a `<canvas>` element. On each `requestAnimationFrame`:
1. Clear canvas
2. Loop through `Composite.allBodies(engine.world)`
3. For each body, draw its sprite PNG at the body's `position` and `angle`
4. Use `ctx.drawImage()` with the pre-rendered PNG sprites from `public/objects/`

This gives full control over visual quality. Matter.js's default renderer is ugly.

#### Ian's Special Physics
Ian has `gravityScale: 0.05` — near-zero gravity. When the section loads and everything falls, Ian barely moves. He drifts very slowly downward, then begins drifting upward. If the user throws Ian, he arcs but then floats back up. He's the only object that defies the simulation.

Clicking Ian in this section still triggers the IanCard easter egg.

#### Mobile Adaptation
On mobile (`navigator.maxTouchPoints > 0`):
- Touch to grab, drag to aim, release to throw.
- If `DeviceOrientationEvent` is available and permission is granted: device tilt affects gravity direction. Tilting the phone makes objects roll. Add a small `.mono-xs` hint: `tilt your phone.`
- If gyroscope permission is denied or unavailable, fall back to standard touch-only interaction.

---

### Section 5: CTA
**Height:** 100vh
**Background:** `--bg-deep` (#0a1628 — dark blue-black, moodier than pure black)

#### Layout
Center-aligned. Clean. Breathing room.

- All 8 objects reappear above the heading in a **tight, fast juggling cascade pattern**. This is NOT Matter.js — it's back to Framer Motion spring animations, but now the arcs are short, quick, and rhythmic. The objects move in a classic 3-ball cascade pattern (figure-eight), but with all 8 objects distributed across the pattern. It should feel confident and locked in — the chaos of Section 3 has become mastery.
- Heading in `.display-lg`, `--text-on-dark`:

> *"Let's throw something up."*

- Body in `.body-lg`, `--text-on-dark-secondary`, max-width 520px, centered:

> "I take on contracted builds, consulting engagements, and problems that are more interesting than they should be. Currently Virginia -> California."

- Below, 48px gap: link row. Three links, horizontally arranged, spaced 32px apart:
  - **GitHub** — outlined button (1px border `--accent-light`, transparent bg, `--text-on-dark` text). Hover: fill `--accent-light`, text goes dark.
  - **LinkedIn** — same style.
  - **Email** — same style, `mailto:` link.
- Below links, 32px gap: a special link in `.label` style, `--accent-light` color:
  - `-> explore the desktop` — links to `place.org/desktop` (or whatever the desktop OS route is). This is the bridge from the portfolio scroll to the full place.org experience.

#### Footer
At the very bottom of the section, barely visible:

```
.mono-xs, opacity 0.3, centered:
"built with excessive ambition and claude-opus-4-6 . (c) 2026 trajan"
```

---

## 7. THE FLOWING LINE — PATH COORDINATES

**AGENT TASK:** Generate the SVG path. Here is the architectural intent — the agent must translate this into a `d` attribute:

The path exists in a coordinate space of `viewBox="0 0 1000 6000"` (width 1000 units, height 6000 units for 6 sections worth of content).

```
Section 1 (0-1000):    Path starts at (500, 100). Descends with gentle S-curve to (300, 900).
Section 2 (1000-2000): Big parabolic arc peaking at (700, 1200). The sneaker sits at the peak.
                        Descends to (400, 1900).
Section 3 (2000-3500): Two arcs — first peaks at (200, 2400), second at (800, 3000).
                        Objects sit at both peaks. Descends to (500, 3400).
Section 4 (3500-4500): Line goes horizontal briefly at (500, 3600) — a "held breath" before the catch.
                        Then tight zigzag arcs — three small fast arcs peaking at 3800, 4000, 4200.
Section 5 (4500-6000): Line spirals inward — arcs get tighter and tighter, converging toward center.
                        Ends at (500, 5800).
```

Use quadratic bezier curves (`Q cx cy, ex ey`) for the parabolic arcs. The curves should be smooth and continuous — no sharp corners. The path is a single unbroken stroke.

---

## 8. COMPONENT ARCHITECTURE

```
app/
  portfolio/
    page.tsx                    <- Main page component, wraps everything
    components/
      FlowingLine.tsx           <- The SVG path overlay
      ScrollProvider.tsx        <- Provides scroll context to all children
      sections/
        Hero.tsx
        TheThrow.tsx
        TheAir.tsx
        TheCatch.tsx            <- Contains Matter.js setup
        CTA.tsx
      objects/                  <- See Section 4 above
      ui/
        IanCard.tsx             <- Easter egg card
        ScrollIndicator.tsx     <- Pulsing line + "scroll" label
        SocialButton.tsx        <- Outlined link button
    hooks/
      useObjectPositions.ts     <- Tracks floating object positions across sections
      useSectionProgress.ts     <- Returns 0-1 progress through a specific section
      usePhysicsEngine.ts       <- Matter.js engine setup + teardown
      useDeviceOrientation.ts   <- Gyroscope permission + tilt data
    lib/
      objects.ts                <- Object definitions (id, physics props, initial positions)
      path.ts                   <- Flowing line path data
      physics.ts                <- Matter.js configuration constants
public/
  objects/                      <- Pre-rendered PNG sprites for Matter.js (2x resolution)
    sneaker.png
    oar.png
    browser.png
    ian.png
    ball-rose.png
    ball-violet.png
    ball-amber.png
    club.png
  fonts/
    Satoshi-Variable.woff2
    Satoshi-VariableItalic.woff2
```

---

## 9. SCROLL ARCHITECTURE

The entire page is a single scroll container. Each section uses `useScroll({ target: sectionRef, offset: ["start end", "end start"] })` to track its own progress (0 = section just entering viewport from below, 1 = section just leaving viewport above).

### Scroll-to-section mapping:

| Section | Scroll range | Key animations |
|---------|-------------|----------------|
| Hero | 0-16% | Objects float, name displayed |
| The Throw | 16-33% | Sneaker scales up, text enters, first line arc |
| The Air (scatter) | 33-50% | Objects scatter, text fragments appear |
| The Air (organize) | 50-58% | Objects reorganize, background darkens |
| The Catch | 58-83% | Matter.js physics active, user interaction |
| CTA | 83-100% | Objects in cascade pattern, links visible |

These are approximate — the actual breakpoints depend on section heights. The key constraint: THE CATCH must be fully visible and interactive when it's in the viewport. Don't let scroll-snap fight with the interactive canvas.

---

## 10. PERFORMANCE REQUIREMENTS

- **First Contentful Paint:** < 1.5s. The hero text must render immediately. Objects can load after.
- **Largest Contentful Paint:** < 2.5s. The hero is the LCP — name + subtitle.
- **Total JS bundle for this route:** < 200KB gzipped. Matter.js is ~60KB minified — budget the rest carefully.
- **Matter.js:** Only initialize when THE CATCH section is within 1 viewport of being visible. Use `IntersectionObserver` to trigger. Destroy the engine when the section leaves the viewport.
- **Floating objects:** Use `will-change: transform` on all animated objects. Animate only `transform` and `opacity` — never layout properties.
- **Sprites:** Pre-render PNGs at 2x in a build step. Don't rasterize at runtime.
- **Fonts:** Preload Instrument Serif and Satoshi Variable in `<head>`. Use `font-display: swap`.

---

## 11. MOBILE ADAPTATION

### Breakpoints
```css
/* Mobile: < 768px */
/* Tablet: 768-1024px */
/* Desktop: > 1024px */
```

### Mobile-specific changes:
- **Hero:** Name font size reduces to `clamp(48px, 12vw, 72px)`. Objects reduce to 5 (drop ball-3, club, oar — keep sneaker, browser, ian, ball-1, ball-2).
- **The Throw:** Stack vertically — sneaker above text.
- **The Air:** Text fragments stack vertically instead of scattered. Objects scatter in a vertical column. Organized state: single circle, not concentric rings.
- **The Catch:** Canvas is touch-interactive. Gyroscope hint appears. Touch-to-grab works via Matter.js `MouseConstraint` (it handles touch natively).
- **CTA:** Stack buttons vertically on mobile.

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all spring animations — snap to final positions */
  /* Disable floating object bob */
  /* Disable flowing line animation — show it fully drawn */
  /* Disable Matter.js — show objects in static positions */
  /* Keep text fade-ins but make them instant (duration: 0) */
}
```

---

## 12. AGENT EXECUTION PLAN

### Phase 1: Foundation (do first)
1. Set up the route (`app/portfolio/page.tsx`) with all 5 section components as empty `<section>` elements with correct background colors and heights.
2. Implement the design system (CSS variables, font loading, typography classes).
3. Build the scroll infrastructure (`ScrollProvider`, `useSectionProgress` hook).
4. Verify: page renders with colored sections, fonts load, scroll works.

### Phase 2: Objects
5. Create all 8 SVG object components with the specified visual style.
6. Build `FloatingObject` wrapper with Framer Motion spring bob animation.
7. Build `ObjectProvider` context.
8. Place objects in the Hero section with staggered entrance animation.
9. Verify: hero loads with animated objects, name types in, subtitle fades in.

### Phase 3: The Flowing Line
10. Author the SVG path with parabolic arcs.
11. Implement scroll-driven `pathLength` animation.
12. Implement color transition based on scroll position.
13. Verify: line draws as you scroll, color shifts on dark sections.

### Phase 4: Sections 2 + 3
14. Build The Throw — sneaker scaling, text stagger, mono easter egg.
15. Build The Air — scatter state, text fragments, background gradient.
16. Build The Air — organized state, layout animation between scatter and organized.
17. Verify: full scroll from hero through dark transition works smoothly.

### Phase 5: The Catch (Matter.js)
18. Set up Matter.js engine with custom renderer (canvas, not Matter.Render).
19. Register all objects as physics bodies with sprites.
20. Implement MouseConstraint for grab-and-throw.
21. Implement Ian's special gravity behavior.
22. Implement Ian's click-to-expand card.
23. Implement gyroscope support for mobile (with permission flow).
24. Verify: objects fall, bounce, can be grabbed and thrown, Ian floats.

### Phase 6: CTA + Polish
25. Build CTA section — cascade animation, text, buttons, desktop link.
26. Build footer.
27. Implement mobile adaptations for all sections.
28. Implement `prefers-reduced-motion` support.
29. Performance audit — bundle size, LCP, FCP.
30. Verify: full site works on desktop + mobile, all interactions functional.

---

## 13. CONFIRMED GOOD LIST

Things that are locked and should not be changed during implementation:

- [x] "Trajan" alone, no last name
- [x] Instrument Serif italic for display, Satoshi for body, JetBrains Mono for code
- [x] Flowing SVG line with scroll-driven stroke-dashoffset
- [x] Parabolic arc shapes on the line (not S-curves)
- [x] Objects at arc peaks
- [x] 100vh sections with scroll-snap (proximity)
- [x] Light to dark background gradient transition in Section 3
- [x] Monospace easter eggs / narrator asides
- [x] `built with excessive ambition and claude-opus-4-6` footer
- [x] Ian as a floating object with near-zero gravity + hidden interactive card
- [x] No sound
- [x] Self-hosted deployment
- [x] Next.js App Router
- [x] Matter.js for THE CATCH section physics
- [x] Framer Motion for all other animations
- [x] Link to place.org desktop in CTA
- [x] No project cards — vibes and interactivity are the proof
- [x] Object palette: sneaker, oar, browser, ian, 3 juggling balls, 1 club

---

*End of spec. This document is the single source of truth. Build from it.*
