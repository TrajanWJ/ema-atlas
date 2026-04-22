> See also: [[LetMeScale]]

# Cinematic Redesign — Design Doc

**Date:** 2026-03-03

## Vision

The site IS the pitch. Clients visit, see big names, big numbers, big images, and the quality of the site itself sells the brand. No filler sections, no blank space, no SaaS template energy. High-end agency portfolio feel.

## Page Structure

Three seamless areas on one continuous dark canvas. Zero visual separation.

```
HERO (cinematic, ~200vh scroll zone)
 ├─ "Let Me Scale." rises cinematically on black + ambient glow
 ├─ Stats slide in from right (desktop) / compact strip (mobile)
 ├─ Brief copy + "Request Access" CTA
 └─ Client carousel integrated INTO hero (not below it)

TESTIMONIALS (scroll-triggered, dense)
 ├─ Results cards: big client photo + key metric + short quote
 ├─ Staggered grid, no section header, no padding walls
 └─ "Request Access" button after last card

FOOTER (minimal, ~40px)
 └─ Logo + copyright
```

**Removed from default:** disqualify, system, why-works, engage, who-for, philosophy, standalone CTA section. Code stays in codebase, just removed from SECTION_ORDER.

## Hero — Cinematic Mode

Added as new option: `heroStyle: "cinematic"` (new default).

### Desktop (scroll choreography within ~200vh)

- **0-20% scroll:** Pure black. After 300ms, "Let Me Scale." fades+rises from below center. 8xl+ display font. Ambient radial glow (dark red, slow drift+breathe) behind text.
- **20-40%:** Text shifts left into 7-col layout. Stats stagger in from right (5-col). Each stat card delays 0.15s.
- **40-50%:** One-liner copy + "Request Access" button fade in. Copy is minimal — one sentence from existing options, not 3 paragraphs.
- **50%+:** Content parallax-fades on scroll. Client carousel is integrated at bottom of hero viewport, always visible during hero scroll zone. Carousel uses full-height portrait cards (the "cards" style), prominently sized.

### Mobile

- Simple and tight. "Let Me Scale." slides upward, brief one-liner, CTA button.
- Stats shown as compact horizontal strip (2x2 grid, tiny) or hidden entirely — carousel is the star.
- Client carousel takes up significant viewport space — large portrait cards scrolling horizontally. This is the eye-catch on mobile.
- No 200vh scroll zone on mobile — single screen hero that flows directly into testimonials.

### Ambient Visuals

CSS-only atmospheric glow behind hero text. Slow-drifting radial gradient using existing `animate-drift` + `animate-breathe` keyframes. Dark red, subtle pulse. No particles.

### Copy Reduction

Current hero: badge + headline + 3 rejection lines + paragraph + italic paragraph + CTA.
Cinematic hero: **headline → one-liner → CTA.** Stats and images do the talking.

## Client Carousel

Integrated INTO the hero, not a separate strip below. Full portrait cards (9:16 ratio) are the default — big images of real clients. Randomly shuffled on mount. Fade-to-black edges. Marquee animation.

On mobile, the carousel should be prominent — taking up ~40% of the viewport. Cards should be large enough to see faces clearly.

## Testimonials

Results-driven cards flowing seamlessly from hero. No section header, no padding wall.

### Card Design

```
┌─────────────────────────────────┐
│  [BIG Client Photo - fills top] │
│                                 │
│  Name                @handle    │
│  ─────────────────────────────  │
│  "212K → 505K followers"       │  ← key metric, large bold
│  "in 4 months"                 │
│  ─────────────────────────────  │
│  "Short quote." (1-2 lines)    │
└─────────────────────────────────┘
```

Photo is the dominant visual element — fills the top half+ of the card. Not a small avatar.

### Layout

2-3 column staggered grid. Cards animate in on viewport entry — fade + upward slide. Preserve interesting effects from existing testimonial variants:
- Scroll-scale entrance (from testimonials-phones)
- Ambient border breathing (from cascade)
- Hover glow effects

Dense — minimal gap between cards. The wall of client faces and numbers IS the proof.

### CTA at Bottom

After last testimonial: centered "Request Access" button with glow. No box, no section wrapper. Just the button on the dark canvas with a one-liner above it.

## Footer

Single line: LetMeScale wordmark left, copyright right. ~40px. No nav links (page is short, no need).

## Implementation Notes

- New hero mode via `heroStyle` option in `SECTION_OPTION_DEFS`, default to `"cinematic"`
- Existing hero modes preserved as options for comparison
- `SECTION_ORDER` shrinks to `["hero", "testimonials", "footer"]`
- Testimonials: new component in `sections/testimonials/` with the results-card format
- Keep all removed section code — just not in default render order
- All existing design system (tokens, glass, backgrounds) stays intact

#letmescale #plans
