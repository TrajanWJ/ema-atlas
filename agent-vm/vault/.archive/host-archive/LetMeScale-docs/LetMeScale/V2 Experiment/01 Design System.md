> See also: [[LetMeScale]]

# LetMeScale v2 Design System

> Nike x Arc Browser. Bold, expressive, high-contrast. Design with swagger.

---

## Design Philosophy

- **Aesthetic:** Nike x Arc Browser — athletic confidence meets modern software
- **Feel:** Bold statements, dynamic layouts, high contrast. This design has energy.
- **Tone:** 6-7/10 emotional temperature. Assertive, direct, human. Not cold, not clinical.
- **The design should feel like confidence, not like a dashboard.**

---

## Color System

### The Alternating Palette

The page alternates between black and white background sections. This creates natural rhythm and high contrast as you scroll.

```
Section 1 (Hero):     BLACK background, WHITE text
Section 2 (Proof):    WHITE background, BLACK text
Section 3 (Who For):  BLACK background, WHITE text
Section 4 (System):   WHITE background, BLACK text
Section 5 (CTA):      BLACK background, WHITE text
Section 6 (Footer):   BLACK background
```

### Black Sections
```
#000000  — Primary background
#0A0A0A  — Slight lift (card interiors)
#111111  — Card surface
#1A1A1A  — Elevated surface
```
**Text on black:** White at full opacity for headlines, white/60 for body, white/30 for muted.

### White Sections
```
#FFFFFF  — Primary background
#F5F5F5  — Slight depth (card backgrounds)
#EBEBEB  — Card borders
```
**Text on white:** Black at full opacity for headlines, black/70 for body, black/40 for muted.

### Red — The Bridge

Red connects the two worlds. It has MORE presence in v2 than v1. No longer just "punctuation" — it's the connective tissue.

```
#991B1B                      — Primary red
rgba(153, 27, 27, 0.15)     — Red glow (dark sections)
rgba(153, 27, 27, 0.08)     — Red subtle
rgba(153, 27, 27, 0.20)     — Red border
```

**Red is used for:**
- Section divider lines between black/white transitions
- Red gradient bands at section boundaries
- Headline underlines and accent lines
- CTA button fill (still the boldest red use)
- Icon accents, stat highlights
- Subtle glow on dark sections, bolder lines on white sections

**Red is NOT a full background fill** — it's always linear (lines, underlines, dividers) or small (buttons, dots, badges).

---

## Surfaces — Solid Elevated Cards

No glass. No blur. No transparency.

### On White Sections
```tsx
className="bg-white rounded-xl shadow-xl border border-gray-100"
// or
className="bg-[#F5F5F5] rounded-xl shadow-lg"
```
Standard elevated cards with drop shadows. Natural, modern SaaS feel.

### On Black Sections
```tsx
className="bg-[#111111] rounded-xl border border-white/10"
// or
className="bg-[#1A1A1A] rounded-xl border border-white/[0.08]"
```
No shadows on black (they disappear). Use subtle 1px light borders to define card edges.

### Elevation Scale
| Level | White Section | Black Section |
|-------|--------------|---------------|
| Base | `bg-white shadow-sm` | `bg-[#0A0A0A] border-white/[0.06]` |
| Card | `bg-white shadow-lg rounded-xl` | `bg-[#111111] border-white/10 rounded-xl` |
| Elevated | `bg-white shadow-xl rounded-xl` | `bg-[#1A1A1A] border-white/[0.12] rounded-xl` |

---

## Typography

### All sans-serif. Bold and expressive.

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Headlines | **Clash Display** | Bold / Semibold | Hero text, section headers, stat numbers |
| Body | **Plus Jakarta Sans** | Regular / Medium | Paragraphs, descriptions, UI elements |
| Labels | **Plus Jakarta Sans** | Semibold | Buttons, nav, small labels, tags |

**No serif. No monospace. No terminal aesthetic.**

### Tailwind @theme Declaration
```css
@theme {
  --font-display: "Clash Display", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}
```

### Type Scale Guidance
- Hero headline: 4xl-6xl, Clash Display Bold, tight leading
- Section headline: 3xl-4xl, Clash Display Semibold
- Body: base-lg, Plus Jakarta Sans Regular
- Labels/tags: sm, Plus Jakarta Sans Semibold, tracking-wide

---

## Animation System

### Philosophy
Framer Motion is the primary animation library. GSAP ScrollTrigger is optional for complex scroll-driven proof stories if needed.

**No Lenis. No Three.js. No grain overlay.**

### Core Easing
```ts
export const EASE = [0.16, 1, 0.3, 1]; // ease-out-expo — kept from v1
```

### Animation Approach
- **Scroll reveals:** Framer Motion `useInView` with `once: true`
- **Stagger sequences:** Framer Motion `staggerChildren`
- **Counter animations:** Framer Motion `useSpring` — animate once on load, no live ticking
- **Hover effects:** CSS transitions for simple lifts/glows, Framer for complex
- **Scroll-driven proof:** Framer Motion scroll-linked animations, or GSAP ScrollTrigger if Framer can't handle the precision

### Reduced Motion
Always respect `prefers-reduced-motion`. Disable animations, show content immediately.

---

## Scrollbar & Selection

```css
::selection {
  background-color: rgba(153, 27, 27, 0.3);
  color: #ffffff;
}

/* Dark scrollbar for black sections */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #000000; }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 3px; }
```

---

## Background Textures

### Black Sections
Subtle dot grid at 3-4% opacity for depth:
```css
background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px);
background-size: 24px 24px;
```

### White Sections
Pure flat white. No texture.

---

## Logo

**"LetMeScale."** — Clash Display Bold with an **oversized red period**.
The period is 1.5-2x the size of the wordmark text. It's a brand mark, not just punctuation.

---

## Navigation

Minimal fixed nav:
- **Left:** "LetMeScale." logo (oversized red period)
- **Right:** "Request Access" button (outlined red, fills on hover)
- Nothing else — no section links, no hamburger
- Background: transparent on hero, then `bg-black/80 backdrop-blur-sm` after scroll

---

## Border Radius Scale

| Element | Radius | Tailwind |
|---------|--------|----------|
| Buttons | 8px | `rounded-lg` |
| Cards | 12px | `rounded-xl` |
| Images | 12px | `rounded-xl` |
| Modal | 16px | `rounded-2xl` |

---

## CTA Button

The ONE element where red is a primary fill:
- **Default:** Red border, red text, transparent background
- **Hover:** Fills solid `#991B1B` with white text (300ms transition)
- **Radius:** `rounded-lg`

---

## Card Hover States

All interactive cards get:
1. **Lift:** `translateY(-4px)` on hover
2. **Shadow deepens** (white sections) or **border brightens** (dark sections)
3. **Red top-line reveals:** 2px red line at card top, `scaleX(0) → scaleX(1)` on hover

---

## For full implementation details, see `10-IMPLEMENTATION-SPEC.md`.

#letmescale #v2-experiment
