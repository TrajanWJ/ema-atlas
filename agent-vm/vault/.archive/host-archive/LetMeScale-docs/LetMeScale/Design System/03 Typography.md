> See also: [[LetMeScale]]

# Typography System

## Font Stack

| Role | Font | CSS Variable | Tailwind Class | Usage |
|------|------|-------------|----------------|-------|
| Display | General Sans | --font-display | font-display | Headlines, large display text |
| Body | Outfit | --font-body | font-body | Body text, descriptions, UI |
| Data | Geist Sans | --font-data | font-data | Overlines, stats, tabular data, captions |

General Sans: self-hosted variable font (200-700 weight range)
Outfit: Google Font (variable)
Geist Sans: self-hosted variable font from Vercel (100-900 weight range)

## Type Scale (via Text component)

| Variant | Font | Size (responsive) | Weight | Tracking | Usage |
|---------|------|-------------------|--------|----------|-------|
| display-xl | General Sans | text-6xl → text-9xl | font-black (900) | -0.03em | Hero headline |
| display | General Sans | text-5xl → text-7xl | font-bold (700) | -0.02em | Major headlines |
| h1 | General Sans | text-4xl → text-6xl | font-bold (700) | -0.02em | Section headlines |
| h2 | General Sans | text-3xl → text-4xl | font-semibold (600) | -0.01em | Sub-sections |
| h3 | General Sans | text-2xl → text-3xl | font-semibold (600) | normal | Card titles |
| body | Outfit | text-base → text-lg | font-normal (400) | normal | Body text |
| body-sm | Outfit | text-sm → text-base | font-normal (400) | normal | Secondary text |
| caption | Outfit | text-xs → text-sm | font-normal (400) | normal | Small text |
| overline | Geist Sans | 11px → text-xs | font-medium (500) | 0.2em, uppercase | Labels, tags |
| data | Geist Sans | text-base | tabular-nums | normal | Stats, numbers |

## Text Color Hierarchy

```
Primary:   text-white / var(--text-primary) (92% opacity)
Secondary: var(--text-secondary) (55% opacity)
Tertiary:  var(--text-tertiary) (30% opacity)
Accent:    text-red (#991B1B — punctuation only)
```

## Usage

Import the typed Text component from @letmescale/ui:
```tsx
import { Text } from "@letmescale/ui";

<Text variant="display-xl">Headline</Text>
<Text variant="overline">LABEL TEXT</Text>
<Text variant="data">$3.4M+</Text>
```

#letmescale #design-system
