> See also: [[LetMeScale]]

# Testimonials Variants D & E — Design Document

## Overview

Two new testimonial/case study section variants for the LetMeScale landing page. Both consume the existing `testimonials.ts` data (6 clients) and register in the DevNav A/B system as toggleable options alongside existing testimonial sections.

## Decisions

- **Fonts:** Add Playfair Display, Outfit, IBM Plex Mono via `next/font/google`
- **Missing assets (Farid, Josh Snow):** Redacted/classified placeholder treatment where images would appear
- **Mark Shapiro stat:** Use before/after transformation data (~$60K → ~$250K in 82 days) for gauge visualizations

## Shared Constraints

### Design Tokens (from `packages/ui/src/theme/tokens.ts`)

- Text: `rgba(255,255,255,X)` only — no gray hex values
- Red `#991B1B` as accent only: dots, borders, glows, period in headline, badges, timeline nodes
- Backgrounds: `#000000` (page), `#030303` (subtle), `#0A0A0A` (card solid)
- Surfaces: `bg-white/[0.02]` default, `bg-white/[0.03]` hover, `bg-white/[0.06]` elevated
- Borders: `border-white/[0.06]` default, `border-white/[0.08]` hover
- Accent surface: `bg-red-950/[0.08]` with `border-red-900/[0.15]`
- Glow: `0 0 20px rgba(127,29,29,0.3)` for red glow

### Glass Tiers

| Tier | Usage | Recipe |
|------|-------|--------|
| Ambient | Section backgrounds | `bg-white/[0.01] backdrop-blur-sm` |
| Surface | Cards, panels | `bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl` |
| Elevated | Hover/featured | `bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl shadow-2xl shadow-black/50` |
| Accent | Terminal summary only | `bg-red-950/[0.08] border border-red-900/[0.15] backdrop-blur-xl` |

### Animation Conventions

- Scroll trigger: `useInView(ref, { once: true, margin: "-100px" })`
- Easing: `[0.25, 0.1, 0.25, 1]`
- Duration: 0.8s standard, 0.6s for small elements
- Stagger: 0.15s between children, 0.1s delay
- Only animate `transform` and `opacity`
- Card hover: `translateY(-2px)` + border-color transition
- Respect `prefers-reduced-motion`

### Typography Map

| Element | Font | Classes |
|---------|------|---------|
| Section headline | Playfair Display | `font-serif text-3xl md:text-4xl font-bold tracking-tight` |
| Large metrics | Playfair Display | `font-serif text-2xl font-bold tabular-nums` |
| Body/descriptions | Outfit | `font-sans text-sm text-white/60 leading-relaxed` |
| Labels/tags/markers | IBM Plex Mono | `font-mono text-[11px] tracking-[0.25em] uppercase` |
| Overline | IBM Plex Mono | `font-mono text-[11px] tracking-[0.25em] uppercase text-white/20` |

### Section Spacing

- Vertical padding: `py-32 md:py-40`
- Content max-width: `max-w-7xl mx-auto`
- Horizontal padding: `px-6`

## The 6 Clients (from testimonials.ts)

| Client | ID | Category | Stat | Has Before/After | Has Images | Has Profile Photo |
|--------|----|----------|------|-------------------|------------|-------------------|
| Trell | `trell` | revenue | $83,212+ | Yes ($31K → $187K) | 6 images | Yes |
| Daniel | `daniel` | views | 14.2M | No | 6 images | No |
| Mark Shapiro | `mark-shapiro` | revenue | $90,300+ | Yes ($60K → $250K) | 5 images | Yes (logo) |
| Chetha | `chetha` | views | 6.5M | No | 6 images | No |
| Farid | `farid` | revenue | $700K+ | No | 0 (REDACTED) | No |
| Josh Snow | `josh-snow` | revenue | $1B+ | No | 0 (REDACTED) | No |

**Narrative hierarchy:** Revenue clients lead, views clients are supporting evidence.

---

## Variant D — "The Evidence Wall"

### Concept

Full-width forensic evidence board. Each client is a "case file" pinned to a spatial layout. Proof is layered — metrics, screenshots, timelines, quotes — creating cumulative conviction through accumulation psychology.

### Section Header

```
// EVIDENCE
The Case Files.   ← period in red
```

Subheadline: "Six operators. Exposed metrics. Exposed timelines. No NDAs needed." — text-white/40, font-sans (Outfit) 300

### Layout Architecture

NOT a grid of cards. Spatial, overlapping, layered — like documents pinned to a wall. Elements overlap slightly. Screenshots sit at randomized 1–3 degree rotations. Metric callouts float near their evidence.

- Faint grid background behind entire section (ambient glass tier)
- Thin connecting lines (SVG or absolute-positioned divs) between related metrics
- Red dot markers at data points

### Case File Panel

Each client gets a case file panel using surface glass tier:

```
Corner label: "CASE 01 // TRELL" — font-mono, text-[10px], text-white/20
Inner content:
  - Client name (font-sans, font-semibold, text-white)
  - Category badge (revenue = red-accent badge, views = standard badge)
  - Key metric (font-serif, text-2xl, font-bold)
    - Revenue metrics: faint red glow halo behind number
    - Views metrics: no glow
  - Subtitle/headline from data
  - Evidence screenshots (glass-elevated borders, 1-3deg random rotation)
  - Story metrics grid
```

Subtle paper-grain texture on panels: CSS noise filter at 0.01 opacity.

### Evidence Screenshots

For clients WITH images:
- Glass-elevated border
- 1–3 degree rotation (randomized per image via inline style)
- Fade up on scroll into view

For Farid & Josh Snow (no images):
- "CLASSIFIED // EVIDENCE PENDING" redacted panel
- Faint grid overlay within the redacted area
- Mono text, text-white/10
- Stylized redaction aesthetic

### Before/After Gauge (Trell, Mark Shapiro)

Horizontal bar visualization:
- Thin bar that fills from "before" value to "after" value
- Red accent marker at the transition point
- Labels at each end (before value left, after value right)
- Not just text — a visual gauge

### Cumulative Counter

Fixed within the section (not viewport). Tallies total proven revenue and total proven views as user scrolls past each case file.

- Starts at $0 / 0 views
- Builds as each case enters view
- Uses the same `useSpring` ticker pattern from `counter.tsx`
- Revenue total: sum of all revenue stats
- Views total: sum of all views stats

### Scroll Interaction

- Each case file region activates on scroll (`whileInView`)
- Evidence "pins" itself — metrics animate in, screenshots fade up
- Staggered entrance within each case file

### Responsive

- Desktop: Spatial, overlapping layout across full width
- Mobile (< 768px): Collapses to vertical stack, no overlaps, screenshots scale down
- Padding: 48px desktop → 24px mobile
- Touch targets: min 44x44px

### Component Structure

```
apps/landing/components/sections/testimonials-d.tsx

Exports: TestimonialsD

Internal components:
  - CaseFile: individual client evidence panel
  - MetricPin: floating metric callout with red dot + connecting line
  - EvidenceScreenshot: tilted screenshot with glass border
  - CumulativeCounter: running total building on scroll
  - BeforeAfterGauge: horizontal bar visualization
  - RedactedEvidence: classified placeholder for missing images
```

---

## Variant E — "The Transformation Timeline"

### Concept

Single continuous vertical timeline weaving all 6 client stories into one chronological narrative. Each data point is a chapter in a larger story about what systematic attention-building produces. Narrative momentum — starting small, escalating, culminating at $1B+.

### Section Header

```
// TIMELINE
The Compounding Record.   ← period in red
```

Subheadline: "Every data point is a chapter. Every chapter compounds." — text-white/40, font-sans (Outfit) 300

### Timeline Entry Order (Narrative Arc)

```
1. Trell ($83K / 6 days)           — THE SPARK
2. Daniel (14.2M views)            — THE REACH
3. Chetha (6.5M views, 91% new)   — THE DISTRIBUTION
4. Mark Shapiro ($60K → $250K)     — THE TRANSFORMATION
5. Farid ($700K+)                  — THE ACCUMULATION
6. Josh Snow ($1B+)                — THE SCALE
```

### The Spine

Single vertical line, center of section:
- 1px wide
- Starts as thin dotted line (before era) — `border-dashed`, `border-white/[0.04]`
- Transitions to solid line when first result hits
- Gradually gets faint red glow toward bottom (peak results era)
- Gradient progression via CSS gradient on the line element
- Scroll-driven draw: `useScroll({ target: sectionRef })` mapped to `scaleY` from 0 to 1

### Timeline Nodes

- 8px circle on the center line
- `bg-[#991B1B]`
- `box-shadow: 0 0 12px rgba(153,27,27,0.3)` glow pulse (Framer Motion animate)
- Staggered animation

### Timeline Entries

Each entry has:
- Node on center line (8px red circle with glow)
- Glass-surface card branching left or right (alternating by index)
- Thin horizontal connector line (1px, white/[0.06]) from node to card, red dot at card end
- Card contents:
  - Client name: font-mono, text-[10px], text-white/20
  - Key metric: font-serif, text-2xl, font-bold, text-white
  - One sentence context: font-sans, text-sm, text-white/40
  - Category tag: red-accent badge (revenue) or standard badge (views)

### Chapter Markers

Floating narrative text on the timeline between groups (not in a card):
- Font: IBM Plex Mono
- Size: 0.62rem (text-[10px])
- Color: text-white/20
- Style: uppercase, tracking-[0.12em]

Placement:
- Before first entry: `// DAY 0 — SYSTEM ACTIVATED`
- After Trell: `// FIRST PROOF OF CONCEPT`
- After Daniel: `// REACH UNLOCKED`
- After Mark Shapiro: `// PATTERN CONFIRMED`
- After Farid: `// COMPOUNDING IN EFFECT`
- After Josh Snow: `// OPERATIONAL INEVITABILITY`

### Terminal Summary

After last timeline entry, the line terminates in a glass-accent summary panel:
- Accent glass tier: `bg-red-950/[0.08] border border-red-900/[0.15]`
- Top border: `rgba(153,27,27,0.20)` for visual distinction
- Contents: Combined totals — total revenue, total views, number of clients, average time to ROI
- This is one of the few places the accent tier appears

### Responsive

- Desktop: Alternating left/right cards, spine centered
- Mobile (< 768px): Single-column, all cards align left, spine moves to left edge (left: 16px)
- Touch targets: min 44x44px
- Padding scales: 48px desktop → 24px mobile

### Component Structure

```
apps/landing/components/sections/testimonials-e.tsx

Exports: TestimonialsE

Internal components:
  - TimelineSpine: center vertical line with gradient progression + scroll draw
  - TimelineNode: red dot on spine with glow animation
  - TimelineEntry: card + connector + node for one client
  - ChapterMarker: floating narrative text between entries
  - TerminalSummary: glass-accent panel with combined totals
```

---

## Infrastructure Changes

### Font Setup (layout.tsx)

Add Playfair Display, Outfit, IBM Plex Mono via `next/font/google`. Expose as CSS variables. Map to Tailwind `fontFamily` in config or via globals.css.

### DevNav Registration (page.tsx)

Add "D" and "E" to the Testimonials options in the `testimonialsMap`:

```typescript
const testimonialsMap: Record<string, React.FC> = {
  Casc: TestimonialsCascade,
  Phone: TestimonialsPhones,
  Prem: PremiumTestimonials,
  Alt: AlternativeTestimonials,
  D: TestimonialsD,
  E: TestimonialsE,
};
```

### File Structure

```
apps/landing/components/sections/
  testimonials-d.tsx    (new — Evidence Wall)
  testimonials-e.tsx    (new — Transformation Timeline)
```

All sub-components are defined within their respective files (no separate files for CaseFile, TimelineEntry, etc.).

#letmescale #plans #archive
