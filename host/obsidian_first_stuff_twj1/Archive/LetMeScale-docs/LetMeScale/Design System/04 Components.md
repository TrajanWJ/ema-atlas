> See also: [[LetMeScale]]

# Component Specifications

## All components live in `packages/ui/src/components/`

---

## Button

**File:** `packages/ui/src/components/button.tsx`

### Variants

| Variant | Appearance | Usage |
|---------|-----------|-------|
| `primary` | Glass + subtle red border glow | Main CTAs — "Request Access" |
| `secondary` | Glass neutral | Secondary actions |
| `ghost` | Transparent, text only | Tertiary actions, nav links |
| `dev` | Green glow | Dev quick-login only |

### Primary Button (CTA)

```tsx
<button className="
  relative px-8 py-4 rounded-xl
  bg-white/[0.04] border border-white/[0.08]
  backdrop-blur-xl
  text-white font-semibold text-sm tracking-wide
  hover:bg-white/[0.06] hover:border-red-900/20
  transition-all duration-300
  group
">
  {/* Subtle red glow on hover */}
  <div className="absolute inset-0 rounded-xl bg-red-900/0 group-hover:bg-red-900/[0.04] transition-all duration-500" />
  <span className="relative z-10">Request Access</span>
</button>
```

Note: The CTA is NOT a bright red button. It's a glass button that subtly warms to red on hover. This matches the "quiet confidence" aesthetic.

### Secondary Button

```tsx
<button className="
  px-6 py-3 rounded-xl
  bg-white/[0.02] border border-white/[0.06]
  text-white/70 font-medium text-sm
  hover:bg-white/[0.04] hover:text-white
  transition-all duration-300
">
  Learn More
</button>
```

### Ghost Button

```tsx
<button className="
  px-4 py-2 rounded-lg
  text-white/50 font-medium text-sm
  hover:text-white hover:bg-white/[0.03]
  transition-all duration-200
">
  View Details
</button>
```

### Sizes

| Size | Padding | Text | Radius |
|------|---------|------|--------|
| `sm` | `px-4 py-2` | `text-xs` | `rounded-lg` |
| `md` | `px-6 py-3` | `text-sm` | `rounded-xl` |
| `lg` | `px-8 py-4` | `text-sm` | `rounded-xl` |
| `xl` | `px-10 py-5` | `text-base` | `rounded-2xl` |

---

## Card

**File:** `packages/ui/src/components/card.tsx`

### Variants

| Variant | Implementation | Usage |
|---------|---------------|-------|
| `glass` | `bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl` | Default everywhere |
| `glass-elevated` | `bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl shadow-2xl shadow-black/50 rounded-2xl` | Modals, floating panels |
| `glass-accent` | `bg-red-950/[0.08] border border-red-900/[0.15] backdrop-blur-xl rounded-2xl` | Highlighted cards |
| `solid` | `bg-[#0A0A0A] border border-white/[0.06] rounded-2xl` | Non-glass contexts |

### Props

```typescript
interface CardProps {
  variant?: "glass" | "glass-elevated" | "glass-accent" | "solid";
  hover?: boolean;      // adds hover:bg-white/[0.03] hover:border-white/[0.08]
  glow?: boolean;       // adds inner glow line at top
  padding?: "none" | "sm" | "md" | "lg";  // p-0, p-4, p-6, p-10
  className?: string;
  children: React.ReactNode;
}
```

---

## Badge

**File:** `packages/ui/src/components/badge.tsx`

All badges use glass backgrounds — no solid colors.

```tsx
// Standard badge
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide bg-white/[0.06] text-white/60 border border-white/[0.06]">
  By Application Only
</span>

// Red accent badge
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide bg-red-900/10 text-red-400/80 border border-red-900/20">
  ROI Focused
</span>

// Status badges
<span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ...">Active</span>
<span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 ...">Pending</span>
```

---

## Input

**File:** `packages/ui/src/components/input.tsx`

```tsx
<div className="w-full space-y-1.5">
  <label className="block text-xs font-medium text-white/40 tracking-wide">
    Email
  </label>
  <input
    className="
      w-full bg-[#111111] border border-white/[0.06] rounded-xl
      px-4 py-3.5 text-white text-sm
      placeholder-white/20
      focus:outline-none focus:border-white/[0.12] focus:ring-1 focus:ring-red-900/20
      transition-all duration-200
    "
    placeholder="you@company.com"
  />
</div>
```

### Error State

```tsx
<input className="... border-red-900/30 focus:border-red-900/40 focus:ring-red-900/20" />
<p className="text-xs text-red-400/80 mt-1">This field is required</p>
```

---

## Modal

**File:** `packages/ui/src/components/modal.tsx`

```tsx
{/* Backdrop */}
<motion.div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />

{/* Panel */}
<motion.div className="
  fixed inset-0 z-50 flex items-center justify-center p-4
">
  <div className="
    w-full max-w-lg
    bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl
    rounded-2xl shadow-2xl shadow-black/50
    overflow-hidden
  ">
    {/* Header */}
    <div className="px-6 py-5 border-b border-white/[0.04]">
      <h3 className="text-lg font-semibold text-white">Title</h3>
    </div>

    {/* Body */}
    <div className="px-6 py-6">
      {/* Content */}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-white/[0.04] flex justify-end gap-3">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </div>
  </div>
</motion.div>
```

---

## Toast

**File:** `packages/ui/src/components/toast.tsx`

```tsx
// Success
<div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl rounded-xl px-4 py-3 text-sm text-emerald-400">
  Application submitted
</div>

// Error
<div className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl rounded-xl px-4 py-3 text-sm text-red-400">
  Something went wrong
</div>

// Info
<div className="bg-blue-400/10 border border-blue-400/20 backdrop-blur-xl rounded-xl px-4 py-3 text-sm text-blue-400">
  Your application is under review
</div>
```

---

## Stepper (Application Flow)

**File:** `packages/ui/src/components/stepper.tsx`

```tsx
{/* Step indicator — glass dots with subtle red active state */}
<div className="flex items-center gap-4">
  {steps.map((step, i) => (
    <div key={i} className="flex items-center gap-2">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
        i < current && "bg-white/[0.08] text-white",       // completed
        i === current && "bg-red-900/20 border border-red-900/30 text-white",  // active
        i > current && "bg-white/[0.03] text-white/20",     // upcoming
      )}>
        {i < current ? "✓" : i + 1}
      </div>
      {i < steps.length - 1 && (
        <div className={cn(
          "w-12 h-px transition-colors duration-500",
          i < current ? "bg-white/[0.12]" : "bg-white/[0.04]"
        )} />
      )}
    </div>
  ))}
</div>
```

---

## Nav

**File:** `apps/marketing/components/nav.tsx`

```tsx
<nav className={cn(
  "fixed top-0 w-full z-50 transition-all duration-500",
  scrolled
    ? "bg-black/90 backdrop-blur-xl border-b border-white/[0.04]"
    : "bg-transparent"
)}>
  <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    {/* Logo */}
    <span className="text-lg font-bold tracking-tight">
      <span className="text-white">Let</span>
      <span className="text-white/40">Me</span>
      <span className="text-red-700">Scale</span>
    </span>

    {/* Links — ghost style */}
    <div className="hidden md:flex items-center gap-8">
      <a className="text-sm text-white/40 hover:text-white transition-colors duration-200">What We Do</a>
      <a className="text-sm text-white/40 hover:text-white transition-colors duration-200">Results</a>
      <a className="text-sm text-white/40 hover:text-white transition-colors duration-200">Philosophy</a>
    </div>

    {/* CTA */}
    <Button variant="primary" size="sm">Request Access</Button>
  </div>
</nav>
```

Logo note: "Let" is white, "Me" is dimmed white/40, "Scale" is the dark red accent. This creates a subtle hierarchy within the brand name itself.

---

## Text

**File:** `packages/ui/src/components/text.tsx`

Typed text component with 10 semantic variants. Each variant maps to a specific combination of font family, size, weight, tracking, and line-height. Eliminates ad-hoc `className` strings for typography across the site.

### Variants

| Variant | Typical Use |
|---------|-------------|
| `display-xl` | Hero headlines, maximum visual impact |
| `display` | Section headlines |
| `h1` | Primary headings |
| `h2` | Secondary headings |
| `h3` | Tertiary headings, card titles |
| `body` | Default paragraph text |
| `body-sm` | Smaller body text, descriptions |
| `caption` | Fine print, timestamps |
| `overline` | Section overlines, labels (uppercase, wide tracking) |
| `data` | Stat counters, numerical displays |

### Usage

```tsx
<Text variant="h2">Title</Text>
<Text variant="overline">Section Label</Text>
<Text variant="data">$83,212+</Text>
```

The component renders the appropriate semantic HTML element and applies all typographic styles through the variant prop. Additional `className` can be passed for color or spacing overrides.

---

## Section

**File:** `packages/ui/src/components/section.tsx`

Section wrapper that provides consistent vertical spacing, a max-width container, and optional scroll-triggered entrance animation.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | Anchor ID for scroll-to navigation |
| `className` | `string` | — | Additional classes |
| `spacing` | `"compact" \| "default" \| "generous"` | `"default"` | Vertical padding preset |
| `animate` | `boolean` | `true` | Enable scroll-in-view fade animation |

### Spacing Presets

| Preset | Mobile | Desktop (md+) |
|--------|--------|----------------|
| `compact` | `py-12` | `py-16` |
| `default` | `py-16` | `py-24` |
| `generous` | `py-24` | `py-32` |

### Container

Every Section includes an inner container: `max-w-7xl mx-auto px-6`.

### Usage

```tsx
<Section id="hero" spacing="generous" animate>
  {/* section content */}
</Section>
```

---

## Container

**File:** `packages/ui/src/components/container.tsx`

Width constrainer used inside sections or standalone. Provides consistent horizontal padding and a max-width cap.

### Variants

| Variant | Max Width | Typical Use |
|---------|-----------|-------------|
| `narrow` | `max-w-2xl` | Centered text blocks, disqualifier copy |
| `default` | `max-w-4xl` | Standard content areas |
| `wide` | `max-w-7xl` | Full-width layouts, grids |
| `full` | No max-width | Edge-to-edge content |

### Usage

```tsx
<Container variant="narrow">
  <Text variant="body">Centered paragraph text.</Text>
</Container>
```

All variants include `mx-auto px-6` for centering and horizontal padding.

---

## Divider

**File:** `packages/ui/src/components/divider.tsx`

Visual separator between content blocks. Supports horizontal and vertical orientations.

### Variants

| Variant | Implementation | Use |
|---------|---------------|-----|
| `subtle` | `bg-white/[0.04]` (4% white) | Soft separation within a section |
| `standard` | `bg-white/[0.06]` (6% white) | Default section dividers |
| `accent` | Red gradient (`from-transparent via-red-900/30 to-transparent`) | Emphasis dividers, section breaks |

### Orientation

| Orientation | Behavior |
|-------------|----------|
| `horizontal` | Full-width `h-px` line (default) |
| `vertical` | Full-height `w-px` line |

### Usage

```tsx
<Divider variant="accent" />
<Divider variant="subtle" orientation="vertical" />
```

#letmescale #design-system
