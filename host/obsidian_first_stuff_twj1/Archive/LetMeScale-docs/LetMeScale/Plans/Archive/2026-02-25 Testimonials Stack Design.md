> See also: [[LetMeScale]]

# Testimonials Stack — Design Document

## Overview

Replace the current `TestimonialsCascade` (R:Casc) proof section with a cinematic stacking-card experience. Each client is a full-width sticky card that pins to the viewport. As the user scrolls, the next card slides up and covers the previous one, which compresses into a thin collapsed bar at the top. Cards only re-expand when scrolled back to the section top.

## Section Structure

### Sequence: weakest → strongest
Order the 6 clients so the section builds to a climax. The strongest result is the final card — the payoff.

### Three phases:
1. **Animated intro** — large cinematic type that scales down as the user scrolls, transitioning into the first card
2. **6 stacking client cards** — sticky cards that collapse into bars as the next enters
3. **Aggregate summary card** — combined stats across all 6 clients + subtle CTA ("Ready to be next?")

## Scroll Behavior

- Each card wrapped in ~150vh scroll container, card itself `position: sticky; top: 0`
- `useScroll` + `useTransform` per card to track progress
- As scrollProgress 0→1: card stays pinned, then compresses (scaleY 1→0.05, opacity 1→0, borderRadius increases)
- Collapsed bars stack at top as 48px strips (avatar thumbnail, name, stat) with layered z-index
- **Re-expansion**: when `window.scrollY < sectionTop + 50px`, reset ALL cards to uncollapsed. All-or-nothing.
- Collapsed bars are NOT clickable

## Card Anatomy

```
┌──────────────────────────────────────────────────┐
│  border-t-2 border-[#991B1B]  (active indicator) │
│                                                  │
│  ┌──────────┐                                    │
│  │  Avatar  │  NAME (Playfair)    [IG] [TT] [YT]│
│  │  (glass  │  Subtitle (Mono)                   │
│  │  border) │                                    │
│  └──────────┘                                    │
│                                                  │
│  "headline / testimonial quote" (serif italic)   │
│                                                  │
│  ┌─────┐  ┌─────┐  ┌─────┐   ← phone frames     │
│  │ img │  │ img │  │ img │     parallax float    │
│  │     │  │     │  │     │     at different       │
│  └─────┘  └─────┘  └─────┘     speeds            │
│  (flexbox: 1 centers, 2 side-by-side, 3+ wraps) │
│                                                  │
│  ┌─ metrics row (4 KPIs, count-up animation) ──┐ │
│  │ $83K+    │ +$100K   │ 360 users │ $466K     │ │
│  │ 6 days   │ growth   │ active    │ total     │ │
│  └──────────────────────────────────────────────┘ │
│                                                  │
│  BEFORE ──────────> AFTER  (1-3 clients only)    │
│  (draggable before/after slider on one phone)    │
│                                                  │
│  ── red accent line ──                           │
└──────────────────────────────────────────────────┘
```

### Avatar
Real client photos with glass border. Fallback: first initial on glass circle.

### Social icons
Platform icons only (IG, TikTok, YouTube). No follower counts.

### Headline
Mix of real quotes and descriptive taglines. Styling works for both.

### Phone frames
Count varies per client (1–6+). Flexbox row that dynamically adapts. Each frame at different parallax rates (0.8x, 1x, 1.2x) via `useTransform`. Glass border `border-white/[0.08]`, rounded-3xl.

### Metrics
4 consistent KPI categories per client. Animated count-up from 0 → final value on viewport entry. Odometer/slot-machine energy.

### Before/After
Only 1–3 clients have this data. For those: one phone frame becomes a draggable comparison slider (left=before, right=after). Others: omit row, keep standard screenshots.

## Card Entrance Effects

| Card | Effect |
|------|--------|
| First card only | 3D tilt (`rotateX`) + blur-to-sharp rack-focus as it settles |
| Cards 2–6 | Standard slide-up and pin |
| All cards | Micro red ember particle burst from bottom edge on pin (~1s) |

## Progress Sidebar

Fixed left side of viewport:
- 6 dots, one per client, `#991B1B`
- Active: color/size change (subtle)
- Hover: expands into mini tooltip (name + key stat)
- Click: smooth-scroll to that card
- Mobile: reposition to bottom or smaller side indicator

## Visual System

- **Card surface**: `bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]`
- **Collapsed bar**: 48px, `bg-white/[0.02] border-white/[0.04]`, avatar + name + stat
- **Red accent**: `#991B1B` — top border on active card, stat highlights, dots, particles
- **Film grain**: Very faint animated noise/grain over `bg-[#060608]`. Canvas-based or CSS. A24 feel.
- **Phone screen glow**: Hover only — soft color-matched glow underneath as if screen casts light
- **Fonts**: Playfair Display (names/headlines), Outfit (body), IBM Plex Mono (stats/labels) — already loaded

## Interactions Reference

| Element | Behavior |
|---|---|
| Collapsed bars | NOT clickable |
| Progress dots | Clickable (smooth-scroll) + hover tooltips |
| Active card stat badge | Subtle red glow pulse |
| Phone screenshots | Hover: lift + border brighten + color-matched glow |
| Before/after slider | Draggable (1–3 cards only) |
| Metrics | Count-up from 0 on viewport entry |
| Red particles | Ember burst on every card entry (~1s) |
| First card | 3D tilt + rack-focus entrance |

## Mobile

Equally polished, not a degraded fallback:
- Vertical stack with swipe gestures (not horizontal stories)
- Parallax: disabled or heavily reduced for GPU performance
- Phone frames: stack vertically or adapt to screen width
- Progress sidebar: reposition (bottom dots or smaller side)
- Particles: reduced count for performance
- Film grain: simplify or disable on low-power devices
- Before/after slider: touch drag support
- Count-up animations: keep (work great on mobile)

## Data Model

Uses existing `CASE_STUDIES` from `@/lib/testimonials.ts`. No schema changes needed — all fields (profile, images, story.metrics, story.before/after) already exist. Client ordering will be hardcoded in the component.

## Files Affected

- `apps/landing/components/sections/testimonials-cascade.tsx` — full rewrite
- `apps/landing/lib/testimonials.ts` — may need ordering constant or aggregate stats helper
- Possibly new sub-components extracted into `apps/landing/components/sections/testimonials/` directory

#letmescale #plans #archive
