> See also: [[LetMeScale]]

# Visual Polish Pass — Design Document

**Date:** 2026-02-27
**Scope:** Testimonials variant parity + site-wide visual polish

## Problem

The 4 proof section variants have wildly different feature levels:
- **results/cascade-v2**: Rich per-client layouts, timelines, before/after, count-up counters, clickable screenshots
- **testimonials-cascade (v1)**: Nearly identical to v2 (redundant)
- **testimonials-phones**: Simple phone frames, basic modal, no per-client data viz
- **testimonials-editorial**: Bare text layout, no before/after, no timelines, no interactivity

Other sections (engage, philosophy, who-for) are text-on-black with no visual components.

## Approach: Shared Component Library (Approach A)

Extract the best interactive elements from cascade-v2 into reusable shared components, then compose them into each variant's layout.

## Part 1: Shared Proof Components

Extract into `apps/landing/components/sections/proof/shared/`:

| Component | File | Purpose |
|-----------|------|---------|
| MetricsRow | `metrics-row.tsx` | Count-up stat pills with animation |
| BeforeAfterToggle | `before-after-toggle.tsx` | Expandable before/after comparison |
| TimelineBar | `timeline-bar.tsx` | Horizontal node timeline with hover tooltips |
| MonthlyLedger | `monthly-ledger.tsx` | 6-month grid cards with highlight |
| ContentGrid | `content-grid.tsx` | Mini reel/content grid |
| ClickableShot | `clickable-shot.tsx` | Annotated screenshot with lightbox trigger |
| CardHeader | `card-header.tsx` | Avatar + name + socials + quote |
| ClientStoryViz | `client-story-viz.tsx` | Maps client.id to appropriate per-client data visualization |

**ClientStoryViz resolver mapping:**
- `trell` → TimelineBar + BeforeAfterToggle
- `daniel` → Hero stats bar + Breakout reel card + ContentGrid + Radial scatter
- `mark-shapiro` → MonthlyLedger + Cumulative totals
- `chetha` → Campaign table (Whop analytics)
- `farid` → VideoMarquee + top videos
- `josh-snow` → Milestones timeline

## Part 2: Variant Upgrades

### testimonials-phones
- Keep phone-frame alternating L/R layout
- **Upgraded modal**: CardHeader → ClientStoryViz → MetricsRow → BeforeAfterToggle → ClickableShot gallery
- Add aggregate stats bar at bottom
- Add subtle parallax/scale on phone frames during scroll

### testimonials-editorial
- Keep editorial rhythm (separator → client → separator)
- **Enhanced ClientBlock**: Quote → Image → ClientStoryViz (inline) → MetricsRow (count-up) → BeforeAfterToggle
- Wire up Counter in Summary aggregate stats
- Add scroll-reveal stagger animations

### testimonials-cascade / results
- Extract shared components (reduce ~1200 line file)
- Import shared components back — identical functionality
- Minor polish: consistent hover glow on ClickableShots

## Part 3: Site-Wide Visual Polish

### Engage (how-we-engage)
- Numbered glass-pill step indicators ("01", "02", "03")
- Glass-card containers around each phase description
- Red accent connecting line between steps

### Philosophy
- Progressive text-size scaling on the "Money follows leverage" lines
- Breathing glow behind "We don't rent."

### Who-For (who-is-for)
- Icon badges (checkmark / X) next to qualifiers
- Glass-1 card wrappers with hover states

### CTA (final-cta)
- Pulsing glow ring on "Request Access" button
- Fade-in animation on the intro quote

## Part 4: Cross-Cutting

- Audit all sections use `section-bg` class
- Consistent font tokens: `font-display`, `font-body`, `font-data`
- All stat numbers use `<Counter>` for count-up
- Glass-card hover states on all interactive elements
- Red accent color consistency (token classes, not raw hex)

#letmescale #plans
