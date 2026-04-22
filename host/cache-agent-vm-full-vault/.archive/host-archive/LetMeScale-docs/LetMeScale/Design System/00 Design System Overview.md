> See also: [[LetMeScale]]

# LetMeScale Design System

> Master reference for all UI patterns, theming, and component specifications.

## Design Philosophy

**Aesthetic:** Ultra-modern dark glass — think Bloomberg Terminal meets luxury brand.
**Feel:** Quiet confidence, not flashy. The design should feel like money, not like marketing.
**Palette:** Deep blacks, crisp whites, frosted glass layers, with dark red as a surgical accent — never a primary fill color.

## Files Index

| File | Covers |
|------|--------|
| [[01 Color System]] | Full color palette, usage rules, opacity scales |
| [[02 Glass Morphism]] | Glass card recipes, blur layers, border treatments |
| [[03 Typography]] | Three-font stack, type scale via Text component, hierarchy |
| [[04 Components]] | Button, Card, Badge, Input, Modal, Toast specs + Text primitive |
| [[05 Section Specs]] | Page-by-page section breakdown with exact implementations |
| [[06 Animations]] | Framer Motion presets, scroll triggers, Lenis smooth scroll |
| [[07 Variant Architecture]] | Options-over-variants principle, section options system |

## Quick Reference

### Color Tokens (Tailwind)
```
bg-void             → #000000 (page background)
bg-surface-1        → #0A0A0A (card backgrounds)
bg-surface-2        → #111111 (elevated surfaces)
bg-surface-3        → #1A1A1A (highest elevation)
bg-white/[0.02]     → frosted glass base
bg-white/[0.04]     → frosted glass hover
border-white/[0.06] → glass borders
text-white           → primary text (92% opacity via --text-primary)
text-[var(--text-secondary)] → secondary text (55% opacity)
text-[var(--text-tertiary)]  → muted/tertiary text (30% opacity)
text-red             → accent text (#991B1B)
```

### Font Stack
```
General Sans (display, --font-display)  — self-hosted variable, 200-700
Outfit       (body, --font-body)        — Google Font, variable
Geist Sans   (data/overline, --font-data) — self-hosted variable, 100-900
```

### Glass Recipe (Copy-Paste)
```tsx
className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl"
```

### Accent Red Rule
Red is NEVER used as:
- A large background fill
- A primary button color at full opacity
- A text color for body copy

Red IS used as:
- A thin border glow: `border-red-900/30`
- A subtle radial gradient: `rgba(153, 27, 27, 0.06)`
- An icon accent or dot indicator
- A hover state shift (very subtle)
- A focused input ring: `ring-red-900/20`
- Punctuation in headlines (e.g. the period in "Control.")

#letmescale #design-system
