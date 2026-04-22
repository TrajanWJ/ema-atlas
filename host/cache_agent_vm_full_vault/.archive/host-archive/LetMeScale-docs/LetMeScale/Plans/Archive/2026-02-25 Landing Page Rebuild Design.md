> See also: [[LetMeScale]]

# LetMeScale Landing Page Rebuild — Design Document

**Date:** 2026-02-25
**Status:** Approved
**Approach:** Full rebuild with DevNav curation (old + new sections coexist as toggleable variants)

---

## Summary

Complete rebuild of the landing page following the Master Build Prompt spec. New design tokens (Playfair Display / Outfit / IBM Plex Mono fonts, #060608 void background, updated glass tiers), new section architecture, and a fully-featured DevNav with magnify system and embedded prompt cards.

Existing sections are preserved as additional DevNav variants so the user can compare old vs new and prune what they don't like.

## Key Design Decisions

### 1. DevNav as Curation Tool
- All existing sections remain accessible as "Legacy" variants in DevNav
- New sections built per spec are the default variants (A/B/C)
- User can toggle between old and new, then instruct removal of unwanted sections
- DevNav stores preferences in localStorage + supports URL params

### 2. Design Token Migration
- **FROM:** Inter only, #000000 bg, old glass values (0.01/0.02/0.04/0.08)
- **TO:** Playfair Display + Outfit + IBM Plex Mono, #060608 void bg, new glass system
- All tokens updated in globals.css and packages/ui/src/theme/tokens.ts
- Old token values are completely replaced (no dual system)

### 3. File Structure
- New sections organized in subdirectories: `components/hero/`, `components/proof/`, etc.
- Old flat sections moved to `components/sections-legacy/` for DevNav access
- Shared utilities in `lib/variants.ts`

### 4. Section Architecture
Per spec, 8 primary sections each with Sales + Mirror variants:
1. Hero (A/B/C)
2. Social Proof Marquee
3. Proof / Case Studies (Sales + Mirror)
4. System — Five Layers (Sales + Mirror)
5. Philosophy (Sales + Mirror)
6. Two-Track Model
7. Final CTA
8. Footer

### 5. DevNav Spec
- Fixed bottom-left, draggable green # button
- Popup panel with variant toggles per section
- 5 embedded prompt cards with copy-to-clipboard
- Magnify button: 380px/540px -> 680px/85vh with smooth transition
- Dev-only (NODE_ENV check)

### 6. Counter Component
- Framer Motion useSpring for initial animation
- Optional live ticking with jitter post-animation
- tabular-nums for layout stability
- IntersectionObserver trigger

### 7. Conversion Psychology
- Scarcity framing ("3 clients this quarter")
- Metric-first social proof
- Revenue > vanity metrics
- Systematic language (system/engine/pipeline, never service/package)
- Red scarcity (CTA button is the ONLY red fill element)

## Token Reference

### Backgrounds
- void: #060608, surface-1: #0a0a0d, surface-2: #0f0f13, surface-3: #141418, surface-4: #1a1a1f

### Text
- 100: white, 60: white/60, 40: white/40, 20: white/20 (NEVER gray hex)

### Red
- Primary: #991B1B, glow: rgba(153,27,27,0.25), subtle: rgba(153,27,27,0.08), border: rgba(153,27,27,0.20)

### Glass Tiers
- Ambient: white/[0.01] no blur
- Surface: white/[0.02] blur-[12px]
- Elevated: white/[0.04] blur-[16px]
- Accent: rgba(153,27,27,0.08) blur-[20px]

### Fonts
- Display: Playfair Display (headings, italic for emphasis)
- Body: Outfit (copy, buttons, nav)
- Mono: IBM Plex Mono (labels, tags, metrics, DevNav)

### Borders
- Default: rgba(255,255,255,0.06), Hover: rgba(255,255,255,0.10), Red: rgba(153,27,27,0.20)

### Animation Easing
- Standard: [0.16, 1, 0.3, 1] (ease-out-expo)

## Build Order
1. globals.css (tokens, fonts, grain overlay)
2. layout.tsx (font loading, metadata)
3. page.tsx (variant state, DevNav integration)
4. nav.tsx (fixed nav, scroll-aware)
5. hero-a.tsx (grid + stats, default)
6. counter.tsx (live ticking)
7. marquee.tsx (social proof strip)
8. proof-a.tsx (case study cards)
9. system-a.tsx (five layers)
10. final-cta.tsx
11. footer.tsx
12. dev-nav.tsx (full spec: toggles, prompts, magnify)
13. Remaining variants (hero-b, hero-c, mirrors, legacy wiring)

#letmescale #plans #archive
