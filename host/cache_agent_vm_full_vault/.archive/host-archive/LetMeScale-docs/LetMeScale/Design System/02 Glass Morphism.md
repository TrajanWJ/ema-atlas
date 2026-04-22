> See also: [[LetMeScale]]

# Glass Morphism System

## Philosophy

Glass is the primary visual language of LetMeScale. Every elevated surface uses transparency and blur to create depth without breaking the monochromatic palette. The glass should feel like looking through smoked crystal — never milky or washed out.

---

## Glass Tiers

### Tier 1: Ambient Glass (Sections / Large Areas)

For full-width section backgrounds that sit above the page but barely break the surface.

```tsx
// Usage: Section wrappers, hero overlays
className="bg-white/[0.01] backdrop-blur-sm"
```

**Properties:**
- Background: `rgba(255, 255, 255, 0.01)` — barely visible
- Blur: `backdrop-blur-sm` (4px)
- Border: None
- Use case: Full-bleed section differentiation

---

### Tier 2: Surface Glass (Cards / Panels)

The workhorse. Used for content cards, feature blocks, testimonial cards.

```tsx
// Usage: Content cards, feature panels, info blocks
className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl"
```

**Properties:**
- Background: `rgba(255, 255, 255, 0.02)`
- Border: `1px solid rgba(255, 255, 255, 0.06)`
- Blur: `backdrop-blur-xl` (24px)
- Radius: `rounded-2xl` (16px)
- Hover state:
  ```tsx
  className="hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300"
  ```

---

### Tier 3: Elevated Glass (Modals / Dropdowns / Popovers)

For elements that float above the page — modals, command palettes, dropdowns.

```tsx
// Usage: Modals, dropdowns, floating panels
className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/50"
```

**Properties:**
- Background: `rgba(255, 255, 255, 0.04)`
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Blur: `backdrop-blur-2xl` (40px)
- Shadow: `shadow-2xl shadow-black/50`
- Radius: `rounded-2xl` (16px)

---

### Tier 4: Accent Glass (Red-Tinted)

Sparingly used for CTAs or highlighted content blocks that need a subtle red warmth.

```tsx
// Usage: CTA cards, highlighted features, active states
className="bg-red-950/[0.08] border border-red-900/[0.15] backdrop-blur-xl rounded-2xl"
```

**Properties:**
- Background: `rgba(69, 10, 10, 0.08)` (red-950 at 8%)
- Border: `1px solid rgba(127, 29, 29, 0.15)`
- Blur: `backdrop-blur-xl`
- Hover:
  ```tsx
  className="hover:bg-red-950/[0.12] hover:border-red-900/[0.25] transition-all duration-300"
  ```

---

## Glass Component Recipes

### Glass Card (Standard)

```tsx
<div className="relative bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-8 hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300">
  {/* Content */}
</div>
```

### Glass Card with Inner Glow

```tsx
<div className="relative bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-8 overflow-hidden">
  {/* Subtle inner glow at top */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
  {/* Content */}
</div>
```

### Glass Card with Red Accent Line

```tsx
<div className="relative bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-8 overflow-hidden">
  {/* Thin red line at top */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-900/30 to-transparent" />
  {/* Content */}
</div>
```

### Glass Input Field

```tsx
<input
  className="w-full bg-[#111111] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/[0.12] focus:ring-1 focus:ring-red-900/20 transition-all duration-200"
/>
```

### Glass Nav (Sticky)

```tsx
<nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.04] transition-all duration-300">
  {/* Nav content */}
</nav>
```

### Glass Divider

```tsx
{/* Horizontal divider inside glass card */}
<div className="h-px bg-white/[0.04] my-6" />

{/* Vertical divider */}
<div className="w-px bg-white/[0.04] mx-4 self-stretch" />
```

---

## Glass + Content Patterns

### Feature Pillar Card

```tsx
<div className="group relative bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-10 hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-500">
  {/* Top accent line */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent group-hover:via-red-900/20 transition-all duration-500" />

  {/* Number */}
  <span className="text-6xl font-black text-white/[0.04] group-hover:text-white/[0.06] transition-colors duration-500">01</span>

  {/* Title */}
  <h3 className="text-xl font-semibold text-white mt-4">We Turn Content Into Inbound Advantage</h3>

  {/* Body */}
  <p className="text-white/60 text-sm leading-relaxed mt-4">Your content isn't meant to "perform." It's meant to work.</p>

  {/* Bullet list */}
  <ul className="mt-6 space-y-3">
    <li className="flex items-start gap-3">
      <span className="w-1 h-1 rounded-full bg-red-800 mt-2 shrink-0" />
      <span className="text-white/50 text-sm">Interest comes to you</span>
    </li>
  </ul>
</div>
```

### Testimonial/Results Card

```tsx
<div className="relative bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl overflow-hidden group cursor-pointer">
  {/* Image */}
  <div className="aspect-[4/3] overflow-hidden">
    <Image
      src="/testimonials/trell/revenue-83k.jpeg"
      alt="Trell Results"
      fill
      className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
    />
    {/* Dark gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
  </div>

  {/* Caption overlay */}
  <div className="absolute bottom-0 inset-x-0 p-6">
    <p className="text-white font-semibold text-lg">Trell</p>
    <p className="text-white/50 text-sm mt-1">$83,212+ generated</p>
  </div>
</div>
```

---

## Implementation in `packages/ui/src/theme/tokens.ts`

```typescript
export const glass = {
  ambient: {
    background: "rgba(255, 255, 255, 0.01)",
    blur: "blur(4px)",
  },
  surface: {
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    blur: "blur(24px)",
    hoverBg: "rgba(255, 255, 255, 0.03)",
    hoverBorder: "1px solid rgba(255, 255, 255, 0.08)",
  },
  elevated: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    blur: "blur(40px)",
  },
  accent: {
    background: "rgba(69, 10, 10, 0.08)",
    border: "1px solid rgba(127, 29, 29, 0.15)",
    hoverBg: "rgba(69, 10, 10, 0.12)",
    hoverBorder: "1px solid rgba(127, 29, 29, 0.25)",
  },
} as const;
```

---

## Implementation in `packages/ui/src/components/card.tsx`

```tsx
const variants = {
  glass: "bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl",
  "glass-elevated": "bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl shadow-2xl shadow-black/50",
  "glass-accent": "bg-red-950/[0.08] border border-red-900/[0.15] backdrop-blur-xl",
  solid: "bg-[#0A0A0A] border border-white/[0.06]",
};
```

---

## Do's and Don'ts

**DO:**
- Layer glass elements with slight opacity differences for depth
- Use `transition-all duration-300` on hover states
- Add inner glow lines (`h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent`) for polish
- Keep blur values consistent within a tier

**DON'T:**
- Stack more than 2 levels of glass blur (performance)
- Use white backgrounds anywhere
- Make glass backgrounds above 0.08 opacity (looks milky)
- Mix glass cards with solid white/gray cards
- Use `backdrop-blur` on elements with many children (expensive)

#letmescale #design-system
