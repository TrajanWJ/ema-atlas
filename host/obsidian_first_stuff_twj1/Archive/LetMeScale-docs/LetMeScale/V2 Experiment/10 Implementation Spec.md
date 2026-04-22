> See also: [[LetMeScale]]

# Implementation Spec — Every Detail

> The complete technical specification for building LetMeScale v2.
> Every decision from the design interview, in one document.

---

## Page Entrance Sequence (1.2s max)

Orchestrated entrance when the page loads:

```
0ms     — Black background fades in
200ms   — Headline reveals (line by line or word by word)
400ms   — Stat counters begin racing up from 0 (right side)
800ms   — CTA button slides/fades in
1000ms  — Nav fades in (logo left, CTA right)
1200ms  — Everything settled. Page is live.
```

Implementation: Framer Motion `staggerChildren` on a container, with delays per element. No loader screen — content appears and animates into position.

---

## Logo Treatment

**Text wordmark:** "LetMeScale" in Clash Display Bold.
**The period is red (#991B1B) and oversized** — noticeably larger than the text. It's a brand mark, not just punctuation.

```tsx
<span className="font-display font-bold text-xl">
  LetMeScale
  <span className="text-red text-3xl leading-none">.</span>
</span>
```

The oversized red period should be visually striking — 1.5-2x the size of the wordmark text.

---

## Hero Section (BLACK bg)

### Layout
```
┌─────────────────────────────────────────────┐
│  [Nav: LetMeScale.        REQUEST ACCESS]   │
│                                              │
│                                              │
│  WE BUILD ATTENTION          2.1B+          │
│  THAT PRODUCES               total views     │
│  DIRECT ROI.                                 │
│                              $3.4M+          │
│                              revenue          │
│                                              │
│                              2,400+          │
│  [ REQUEST ACCESS ]          appointments    │
│                                              │
│                                              │
└─────────────────────────────────────────────┘
```

- **Left:** Massive Clash Display Bold headline, filling ~60% width
- **Right:** Vertical stack of 3 counters, each with number + label
- **Below headline:** CTA button (outlined red, fills on hover)
- **Spacing:** Generous — `py-32` to `py-48`. Let the headline breathe.

### Counter Behavior
- Animate once on load (part of the entrance sequence)
- Count from 0 to final value over ~1.5s
- Framer Motion `useSpring` for smooth easing
- `tabular-nums` for layout stability
- No live ticking after initial animation

### Background
- Pure black `#000000`
- Subtle dot grid pattern (white dots at 3-4% opacity) for depth

---

## Red Bridge Transitions

Between every black/white section boundary:

```
████ BLACK SECTION ████████████████
  ~ subtle red glow bleeding up (40-60px gradient) ~
━━━━━ SOLID RED LINE (2-3px) ━━━━━━
  ~ subtle red glow bleeding down (40-60px gradient) ~
░░░░ WHITE SECTION ░░░░░░░░░░░░░░░
```

Implementation:
```css
.red-bridge {
  position: relative;
  height: 2px;
  background: #991B1B;
}
.red-bridge::before {
  /* Gradient bleeding upward into black section */
  background: linear-gradient(to top, rgba(153,27,27,0.15), transparent);
  height: 60px;
}
.red-bridge::after {
  /* Gradient bleeding downward into white section */
  background: linear-gradient(to bottom, rgba(153,27,27,0.10), transparent);
  height: 60px;
}
```

The bridge should be scroll-animated — the red line draws itself across as you scroll to the boundary.

---

## Proof Section (WHITE bg) — Pinned Scroll Storytelling

### Behavior
Each client pins the viewport while content animates in. Scroll controls the animation timeline.

- **~2 viewport heights of scroll distance per client**
- After scrolling past a client, their content **minimizes/collapses** (doesn't just disappear)
- 4 clients total: Trell → Farid → Mark → Josh Snow

### Scroll Timeline Per Client (~2vh)
```
0-10%    Client name + headline stat fade in
10-30%   Before stats / context slides in from left
30-50%   Dramatic pause (content settles, slight breathing animation)
50-70%   After stats ANIMATE in (per-client unique animation)
70-90%   Proof image scales up from styled thumbnail to prominent display
90-100%  Content minimizes, transition to next client begins
```

### Per-Client Unique Layouts & Animations

**Trell — Dramatic Reversal:**
- Before stats appear normally: "$31K/mo, declining"
- Dramatic pause — slight tension
- After stats EXPLODE: numbers rapidly count to $187K, growth indicator shoots upward
- Different STRUCTURE: before/after split layout

**Farid — Volume Accumulation:**
- Wall of viral content thumbnails builds up progressively
- Each thumbnail slides in, building a mosaic
- Then the revenue number ($700K+) drops in over the wall
- Different STRUCTURE: media grid → number overlay

**Mark Shapiro — Steady Climb:**
- Counter that increments at a steady, metronome pace
- $100K... $200K... $400K... $748K
- No drama, no explosion — just relentless compounding
- Different STRUCTURE: single large counter with timeline below

**Josh Snow — Aspirational Reveal:**
- Minimal. Clean. Just the number and a credibility statement.
- "$1B+ in career sales. Josh trusts LetMeScale."
- Different STRUCTURE: centered text, maximum whitespace
- Clarification that this is career total, not LetMeScale attribution

### Proof Images
- Styled with overlay treatment: subtle border radius, drop shadow, slight gradient mask at edges
- Click triggers **smooth scale-from-position lightbox**: image scales up from its exact position to fill viewport (400ms Framer Motion transition)
- Click again or Escape scales it back to original position
- On white background: cards with `shadow-lg` elevation

### Cards
- Solid white cards with `shadow-lg` and `rounded-xl`
- Hover: lift (`translateY(-4px)`) + shadow deepens + thin red top-line reveals (`scaleX(0) → scaleX(1)`)
- Clear, readable stat numbers in Clash Display Bold
- Supporting body text in Plus Jakarta Sans

### Mobile
- No pinning on mobile
- Content flows naturally with same narrative structure: name → story → stats → image
- Standard scroll-reveal animations (fadeInUp on enter)
- Lightbox still works (tap to expand, tap to dismiss)

---

## Who For Section (BLACK bg)

### Layout: Checklist Qualifier

```
┌─────────────────────────────────────────┐
│                                          │
│  IS THIS FOR YOU?                        │
│                                          │
│  ✓  You make $10K+/month               │
│  ✓  You have an existing audience       │
│  ✓  You want systems, not services      │
│  ✓  You're ready to invest              │
│  ✗  Not for beginners                   │
│                                          │
└─────────────────────────────────────────┘
```

- Text appears instantly on scroll
- **Checkmark icons draw themselves** (SVG path animation) one by one as the section enters view
- The ✗ item could use a different color/treatment (muted) to distinguish

### Spacing: Generous — let it scan quickly. `py-24` to `py-32`.

### Background: Black with subtle dot grid.

---

## System Section (WHITE bg)

### Layout: Case Study Integration

Don't explain the system abstractly. Walk through a specific client's journey (likely Trell):

```
HERE'S EXACTLY WHAT WE DID.

Step 1: Where Trell was
  $31K/mo revenue, declining $8K month over month.

Step 2: What we deployed
  Distribution system: clips across 4 platforms.
  Pipeline: DM sequences + appointment booking.

Step 3: What happened
  $83K in 6 days. $187K the full month.
  62 deals closed in January.
```

- Elevated cards with shadows on white
- Timeline or step progression layout
- Scroll-revealed (moderate animation density — less than proof, more than CTA)

### Spacing: Tight-to-moderate. Content-rich section.

---

## CTA Section (BLACK bg)

### Layout
Bold headline + CTA button. Simple.

```
READY?
3 clients this quarter.

[ REQUEST ACCESS ]
```

### CTA Button
- **Default:** Red border, red text, transparent background. `rounded-lg` (scale-based: button gets less rounding than cards)
- **Hover:** Fills solid `#991B1B` with white text. Smooth 300ms transition.
- Button triggers the apply modal

### Spacing: Generous. One clear action. `py-32` to `py-48`.

### Animation: Minimal. Calm energy after the proof section peak.

---

## Apply Modal

Kept from v1, restyled for v2:
- Solid elevated card (not glass)
- Clash Display headings
- Plus Jakarta Sans body
- Scale-based border radius (`rounded-2xl` for modal)
- Smooth Framer Motion entrance (scale from center)

### Flow
1. Question 1: Monthly revenue (4 options)
2. Under $10K → Polite rejection
3. Question 2: Content goal
4. Qualified → Form submission → "Application received"

---

## Footer (BLACK bg)

Statement footer:
```
"Attention is leverage."

LetMeScale.    [IG] [TW] [TK]

© 2026 LetMeScale. All rights reserved.
```

Final bold line, logo with oversized red period, social icons, copyright.

---

## Navigation

- Fixed top, minimal
- Logo left: "LetMeScale" + oversized red period
- CTA right: "Request Access" button (outlined red)
- No section links, no hamburger
- Background: transparent on hero, then `bg-black/80 backdrop-blur-sm` once scrolled past hero

---

## Border Radius Scale

| Element | Radius | Tailwind |
|---------|--------|----------|
| Buttons | 8px | `rounded-lg` |
| Stat cards | 12px | `rounded-xl` |
| Proof image cards | 12px | `rounded-xl` |
| Section cards | 12px | `rounded-xl` |
| Modal | 16px | `rounded-2xl` |
| Lightbox image | 12px | `rounded-xl` |
| Nav | 0 (full-width) | — |

---

## Background Textures

### Black Sections
Subtle dot grid pattern at 3-4% white opacity:
```css
.bg-dotgrid {
  background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

### White Sections
Pure flat white. No texture. Clean.

---

## Animation Density (Progressive)

| Section | Density | Description |
|---------|---------|-------------|
| Hero | Medium | Orchestrated entrance (1.2s), then static |
| Red Bridge 1 | Low | Line draws across on scroll |
| Proof | **High** | Full pinned scroll choreography, per-client animations |
| Red Bridge 2 | Low | Line draws across |
| Who For | Low-Medium | SVG checkmark draw animations |
| Red Bridge 3 | Low | Line draws across |
| System | Medium | Scroll-revealed cards, moderate stagger |
| Red Bridge 4 | Low | Line draws across |
| CTA | Minimal | Simple fade in. Calm. |
| Footer | None | Static |

Peak energy is in the **Proof section**. Everything before builds to it, everything after calms from it.

---

## Hover States (Global)

### Cards (both dark and light sections)
```css
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* Lift */
.card:hover {
  transform: translateY(-4px);
}

/* Shadow deepens (white sections) */
.card:hover { box-shadow: 0 20px 40px rgba(0,0,0,0.12); }

/* Border brightens (dark sections) */
.card:hover { border-color: rgba(255,255,255,0.15); }

/* Red top-line reveals */
.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: #991B1B;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}
.card:hover::before {
  transform: scaleX(1);
}
```

### CTA Button
- Default: `border-2 border-red text-red bg-transparent`
- Hover: `bg-red text-white` with 300ms transition

### Nav CTA (smaller)
Same pattern as main CTA but smaller scale.

### Proof Images
- Hover: slight scale (1.02x) + cursor changes to zoom icon
- Click: smooth scale-from-position to fullscreen lightbox

---

## Lightbox Spec

When a proof image is clicked:

1. Calculate the image's current position and size on screen
2. Animate from that exact position/size to viewport-centered, larger size (400ms, EASE curve)
3. Dark overlay fades in behind (`bg-black/80`)
4. Image gets `rounded-xl` treatment
5. Click image again OR press Escape → reverse animation back to original position
6. Framer Motion `layoutId` or manual position interpolation

---

## Color Token Summary (v2 Final)

```css
@theme {
  /* Backgrounds */
  --color-void: #000000;
  --color-surface-1: #0A0A0A;
  --color-surface-2: #111111;
  --color-surface-3: #1A1A1A;

  /* White section */
  --color-white-surface: #F5F5F5;
  --color-white-border: #EBEBEB;

  /* Red — bridge + accent */
  --color-red: #991B1B;
  --color-red-glow: rgba(153, 27, 27, 0.15);
  --color-red-subtle: rgba(153, 27, 27, 0.08);
  --color-red-border: rgba(153, 27, 27, 0.20);

  /* Fonts */
  --font-display: "Clash Display", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}

:root {
  /* Dark section text */
  --text-on-dark-primary: rgba(255, 255, 255, 1);
  --text-on-dark-secondary: rgba(255, 255, 255, 0.6);
  --text-on-dark-muted: rgba(255, 255, 255, 0.3);

  /* Light section text */
  --text-on-light-primary: rgba(0, 0, 0, 1);
  --text-on-light-secondary: rgba(0, 0, 0, 0.7);
  --text-on-light-muted: rgba(0, 0, 0, 0.4);

  /* Borders */
  --border-dark: rgba(255, 255, 255, 0.10);
  --border-dark-hover: rgba(255, 255, 255, 0.15);
  --border-light: #EBEBEB;
}
```

#letmescale #v2-experiment
