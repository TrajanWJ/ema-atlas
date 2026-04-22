> See also: [[LetMeScale]]

# Color System

## Philosophy

The palette is almost entirely monochromatic — black surfaces, white text, transparency for depth. Red exists only as a whisper. If you removed all red from the site, it should still look complete.

---

## Background Scale (Darkest → Lightest)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-black` | `#000000` | Page body, hero backgrounds |
| `bg-[#030303]` | `#030303` | Subtle section alternation |
| `bg-[#050505]` | `#050505` | Elevated section backgrounds |
| `bg-[#0A0A0A]` | `#0A0A0A` | Card solid backgrounds, sidebar |
| `bg-[#111111]` | `#111111` | Input fields, code blocks |
| `bg-[#1A1A1A]` | `#1A1A1A` | Hover states on dark surfaces |

## Surface / Glass Scale

| Token | Usage |
|-------|-------|
| `bg-white/[0.01]` | Barely-there glass — large hero overlays |
| `bg-white/[0.02]` | Default glass card background |
| `bg-white/[0.03]` | Glass card on hover, or secondary glass |
| `bg-white/[0.04]` | Active/pressed glass state |
| `bg-white/[0.06]` | Elevated glass (modals, dropdowns) |
| `bg-white/[0.08]` | Maximum glass elevation (rarely used) |

## Border Scale

| Token | Usage |
|-------|-------|
| `border-white/[0.04]` | Subtle dividers inside glass cards |
| `border-white/[0.06]` | Default glass card border |
| `border-white/[0.08]` | Hover border on interactive glass |
| `border-white/[0.10]` | Active/focused border |
| `border-white/[0.12]` | High-contrast border (rarely used) |

## Text Scale

| Token | Opacity | Usage |
|-------|---------|-------|
| `text-white` | 100% | Headlines, CTAs, primary labels |
| `text-white/80` | 80% | Body text in important sections |
| `text-white/60` | 60% | Secondary descriptions, sub-labels |
| `text-white/40` | 40% | Tertiary text, timestamps, metadata |
| `text-white/20` | 20% | Placeholder text, disabled states |

## Accent Red (Dark Red Only)

| Token | Hex | Usage |
|-------|-----|-------|
| `text-red-700` | `#B91C1C` | Accent text — "LetMe**Scale**" logo red |
| `text-red-800` | `#991B1B` | Darker accent text |
| `text-red-900` | `#7F1D1D` | Very subtle red text |
| `bg-red-900/10` | — | Faint red surface (badges, indicators) |
| `bg-red-900/20` | — | Red badge background |
| `border-red-900/20` | — | Red-tinted border |
| `border-red-900/30` | — | Red-tinted border on hover |

### Radial Glow (CSS Custom)

```css
/* Very subtle red ambiance — used behind hero and CTA sections */
.red-glow-bg {
  background: radial-gradient(
    ellipse 800px 500px at 50% 0%,
    rgba(127, 29, 29, 0.04) 0%,
    transparent 70%
  );
}
```

Note: This is much more subdued than the previous `rgba(220, 38, 38, 0.08)`. The red-900 base (`#7F1D1D`) at 4% opacity creates a barely perceptible warmth.

## Status Colors

| Purpose | Token | Usage |
|---------|-------|-------|
| Success | `text-emerald-500` / `bg-emerald-500/10` | Confirmations, positive states |
| Warning | `text-amber-500` / `bg-amber-500/10` | Caution states |
| Error | `text-red-500` / `bg-red-500/10` | Error messages only |
| Info | `text-blue-400` / `bg-blue-400/10` | Informational badges |

## Implementation

### `packages/ui/src/theme/tokens.ts`

```typescript
export const colors = {
  bg: {
    DEFAULT: "#000000",
    subtle: "#030303",
    raised: "#050505",
    card: "#0A0A0A",
    input: "#111111",
    hover: "#1A1A1A",
  },
  primary: {
    DEFAULT: "#991B1B", // red-800 — dark, muted
    light: "#B91C1C",   // red-700 — for text accents
    dark: "#7F1D1D",    // red-900 — for glows
  },
  text: {
    DEFAULT: "#FFFFFF",
    secondary: "rgba(255,255,255,0.6)",
    muted: "rgba(255,255,255,0.4)",
    dim: "rgba(255,255,255,0.2)",
  },
  surface: {
    DEFAULT: "rgba(255,255,255,0.02)",
    hover: "rgba(255,255,255,0.03)",
    active: "rgba(255,255,255,0.04)",
    elevated: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.06)",
    borderHover: "rgba(255,255,255,0.08)",
  },
  accent: {
    surface: "rgba(127,29,29,0.06)",
    border: "rgba(127,29,29,0.15)",
    borderHover: "rgba(127,29,29,0.25)",
  },
  success: "#10B981",
  warning: "#F59E0B",
  info: "#60A5FA",
  dev: "#22C55E",
} as const;
```

### `apps/marketing/app/globals.css` — `@theme` Block

```css
@theme {
  --color-brand-black: #000000;
  --color-brand-dark: #0A0A0A;
  --color-brand-darker: #050505;
  --color-brand-input: #111111;
  --color-brand-red: #991B1B;
  --color-brand-red-light: #B91C1C;
  --color-brand-red-dark: #7F1D1D;
  --color-brand-white: #FFFFFF;
}
```

#letmescale #design-system
