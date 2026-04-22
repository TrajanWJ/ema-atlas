> See also: [[LetMeScale]]

# 07 — Variant Architecture & Section Options

## Core Principle: Options Over Variants

> When a section has layout variations, expose a configurable option rather than
> duplicating the component into a new file.

### Problem

Early in development, each layout tweak for a section (stats on right vs bottom,
grid vs list, etc.) spawned a separate variant file. This led to:

- **Code duplication** — 80%+ shared logic copied across files
- **Drift** — bug fixes in one variant not applied to others
- **DevNav bloat** — too many variant buttons, hard to navigate
- **Stale files** — variants fall out of sync with design system updates

### Solution: The Section Options System

Instead of `hero.tsx`, `hero-a.tsx`, `hero-b.tsx`, `hero-editorial.tsx`:
→ One `hero.tsx` with configurable options exposed in DevNav.

```
┌──────────────────────────────────────────────┐
│  ── Hero ──                                  │
│  [hero] [off]                                │
│                                              │
│  Stats Location                              │
│  [Right] [Bottom]                            │
└──────────────────────────────────────────────┘
```

### Implementation

#### 1. Define options in page.tsx

```tsx
const SECTION_OPTION_DEFS: Record<string, OptionDef[]> = {
  hero: [
    {
      key: "statsLocation",
      label: "Stats Location",
      choices: [
        { key: "right", label: "Right" },
        { key: "bottom", label: "Bottom" },
      ],
      defaultValue: "right",
    },
  ],
};
```

#### 2. Read in component via context

```tsx
import { useSectionOptions } from "@/lib/section-options";

export function Hero() {
  const options = useSectionOptions("hero");
  const statsLocation = options.statsLocation ?? "right";

  return statsLocation === "right" ? <RightLayout /> : <BottomLayout />;
}
```

#### 3. DevNav auto-renders toggles

The DevNav reads `sectionOptionDefs` and renders toggle pills below each
section's variant picker. No manual DevNav modifications needed per option.

### When to Use a Variant vs an Option

| Use a **Variant** when... | Use an **Option** when... |
|---|---|
| Component structure is fundamentally different | Same structure, different arrangement |
| Different data sources or APIs | Same data, different display |
| Different interaction models | Same interaction, different position/size |
| >50% of the code would differ | <50% of the code differs |
| New section concept entirely | Layout knob on existing concept |

### Examples

**Good options (not variants):**
- Stats position: bottom / right / hidden
- Card density: compact / comfortable / spacious
- Animation intensity: full / subtle / none
- Proof display: grid / timeline / cascade

**Legitimate variants:**
- `disqualifier` (text-only) vs `disqualifier-gauntlet` (two-column cards)
- `testimonials-cascade` (bespoke client stories) vs `testimonials-stack` (sticky scroll)

### Adding a New Option

1. Add to `SECTION_OPTION_DEFS` in `page.tsx`
2. Read in the component via `useSectionOptions()`
3. Done — DevNav picks it up automatically

#letmescale #design-system
