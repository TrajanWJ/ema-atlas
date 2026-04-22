> See also: [[LetMeScale]]

# LetMeScale — Unified Landing Page Design

**Date:** 2026-02-20
**Priority:** Landing page is the ONLY priority
**App:** `apps/dashboard` on port 3001 — unified app (landing page + auth dashboard)
**Aesthetic:** Palantir x Apple x Aston Martin — monochrome glass, surgical precision, quiet dominance

---

## Table of Contents

1. [Architecture](#architecture)
2. [Visual Direction](#visual-direction)
3. [Navigation Bar](#navigation-bar)
4. [Scroll Progress](#scroll-progress)
5. [Apply Modal (Global)](#apply-modal-global)
6. [Section Map (Full Page Flow)](#section-map)
7. [Section 1: Hero](#section-1-hero)
8. [Section 2: VSL Feature](#section-2-vsl-feature)
9. [Section 3: Disqualifier](#section-3-disqualifier)
10. [Section 4: Who This Is For](#section-4-who-this-is-for)
11. [Section 5: What We Do (Three Pillars)](#section-5-what-we-do)
12. [Section 6: Trell Story (Full-Screen Testimonial)](#section-6-trell-story)
13. [Section 7: Why This Works](#section-7-why-this-works)
14. [Section 8: Daniel Story (Full-Screen Testimonial)](#section-8-daniel-story)
15. [Section 9: Aggregate Metrics Bar](#section-9-aggregate-metrics-bar)
16. [Section 10: How We Work](#section-10-how-we-work)
17. [Section 11: Mark Shapiro Story (Full-Screen Testimonial)](#section-11-mark-shapiro-story)
18. [Section 12: Why LetMeScale Is Different](#section-12-why-different)
19. [Section 13: Chetha Story (Full-Screen Testimonial)](#section-13-chetha-story)
20. [Section 14: Our Team](#section-14-our-team)
21. [Section 15: The Other Room (Secondary Positioning)](#section-15-the-other-room)
22. [Section 16: How We Engage](#section-16-how-we-engage)
23. [Section 17: Who This Is Not For](#section-17-who-this-is-not-for)
24. [Section 18: Philosophy](#section-18-philosophy)
25. [Section 19: Results Gallery](#section-19-results-gallery)
26. [Section 20: Final CTA + Apply Section](#section-20-final-cta)
27. [Section 21: Footer](#section-21-footer)
28. [Case Study Modal](#case-study-modal)
29. [Video Modal](#video-modal)
30. [Mobile Considerations](#mobile-considerations)
31. [Performance](#performance)

---

## Architecture

### Routing

```
/ ........................ Public landing page (NO auth required)
/login ................... Login page (NO auth required)
/admin/* ................. Auth-protected admin dashboard
/portal/* ................ Auth-protected client portal
/api/auth/* .............. NextAuth endpoints
/api/apply ............... Application form POST endpoint
```

### Middleware Changes

Update `middleware.ts` to whitelist:
- `/` — landing page
- `/api/apply` — form submission
- `/_next/*`, `/favicon.ico`, `/testimonials/*` — static assets

Everything else remains auth-gated. Unauthenticated users hitting `/admin` or `/portal` redirect to `/login`.

### File Structure

```
apps/dashboard/
├── app/
│   ├── page.tsx                          # Landing page (public)
│   ├── layout.tsx                        # Root layout
│   ├── (dashboard)/                      # Auth-protected group (unchanged)
│   └── api/apply/route.ts               # Application form endpoint
├── components/
│   ├── landing/
│   │   ├── nav.tsx                       # Transparent → glass nav
│   │   ├── scroll-progress.tsx           # Thin progress line
│   │   ├── apply-modal.tsx               # Global apply popup
│   │   ├── case-study-modal.tsx          # Fullscreen image gallery
│   │   ├── video-modal.tsx               # VSL / video player
│   │   ├── counter.tsx                   # Animated number counter
│   │   ├── scroll-reveal.tsx             # Reusable scroll-trigger wrapper
│   │   └── sections/
│   │       ├── hero.tsx
│   │       ├── vsl-feature.tsx
│   │       ├── disqualifier.tsx
│   │       ├── who-is-for.tsx
│   │       ├── what-we-do.tsx
│   │       ├── testimonial-story.tsx     # Reusable full-screen story component
│   │       ├── metrics-bar.tsx
│   │       ├── why-this-works.tsx
│   │       ├── how-we-work.tsx
│   │       ├── why-different.tsx
│   │       ├── our-team.tsx
│   │       ├── the-other-room.tsx
│   │       ├── how-we-engage.tsx
│   │       ├── not-for.tsx
│   │       ├── philosophy.tsx
│   │       ├── results-gallery.tsx
│   │       └── final-cta.tsx
│   ├── admin/                            # Existing (unchanged)
│   └── portal/                           # Existing (unchanged)
├── lib/
│   ├── testimonials.ts                   # Case study data + image paths
│   └── team.ts                           # Team member data
└── public/
    └── testimonials/                     # Copy from marketing/public/testimonials
        ├── trell/
        ├── daniel/
        ├── mark-shapiro/
        └── chetha/
```

The `apps/marketing` app becomes dormant. All landing page work happens in `apps/dashboard`.

---

## Visual Direction

### Core Aesthetic

**Palantir:** Data-dense surfaces, monochrome authority, information hierarchy through opacity. The UI communicates intelligence without decoration.

**Apple:** Generous whitespace (blackspace), cinematic scroll reveals, content that breathes. Typography does the heavy lifting. Every pixel is intentional.

**Aston Martin:** Dark luxury, restrained power. You feel the quality before you read a word. Nothing is loud. Everything is precise.

### Color System (Refined)

The existing design system colors are preserved but the red usage is pulled back further. Red is now a whisper — visible only in the smallest details.

| Token | Value | Usage |
|-------|-------|-------|
| `bg-black` | `#000000` | Primary page background |
| `bg-[#020202]` | `#020202` | Barely-there section alternation |
| `bg-[#050505]` | `#050505` | Elevated sections (testimonial stories) |
| `bg-[#0A0A0A]` | `#0A0A0A` | Card surfaces, modal backgrounds |
| `text-white` | `#FFFFFF` | Headlines, primary text |
| `text-white/80` | 80% | Important body text |
| `text-white/50` | 50% | Standard body |
| `text-white/30` | 30% | Tertiary, metadata |
| `text-white/15` | 15% | Ghost text, background numbers |
| `text-white/8` | 8% | Watermark-level text |
| `border-white/[0.03]` | 3% | Subtle dividers |
| `border-white/[0.06]` | 6% | Glass card borders |
| `border-white/[0.08]` | 8% | Hover borders |

### Red Accent (Darker, Minimized)

Red has been pulled darker and used only as punctuation — never as a surface, never as a fill.

| Token | Value | Usage |
|-------|-------|-------|
| `#7F1D1D` (red-900) | Dark maroon | Dot bullets, glow origins, focus rings |
| `#6B1A1A` | Even darker | Radial glow base (at 3-4% opacity) |
| `rgba(127,29,29,0.03)` | — | Radial ambient glow (barely perceptible warmth) |
| `rgba(127,29,29,0.08)` | — | Hover state on CTA buttons (maximum red visibility) |
| `border-red-900/10` | — | CTA button border on hover |

**Rule:** If you removed all red from the page, the design should still look complete and premium. Red is seasoning, not an ingredient.

### Glass Morphism

```
Default card:    bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-2xl
Hover card:      bg-white/[0.03] border border-white/[0.07]
Elevated (modal): bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl shadow-2xl shadow-black/60
Nav (scrolled):  bg-black/70 backdrop-blur-2xl border-b border-white/[0.03]
```

### Typography

Inter throughout. Hierarchy through size, weight, and opacity — never through color or font changes.

| Level | Class | Usage |
|-------|-------|-------|
| Display | `text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.04em] leading-[0.9]` | Hero headline only |
| H1 | `text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.05]` | Section headlines |
| H2 | `text-2xl md:text-3xl font-semibold tracking-tight` | Sub-headlines |
| H3 | `text-xl font-semibold` | Card titles |
| Body | `text-base text-white/50 leading-relaxed` | Standard paragraphs |
| Overline | `text-[11px] font-semibold tracking-[0.25em] uppercase text-white/25` | Section labels |
| Caption | `text-xs text-white/30` | Metadata, timestamps |

### Noise Texture

A very subtle grain overlay across the entire page to prevent the black from feeling "digital." Applied via CSS:

```css
.noise-bg::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.015;
  background-image: url("data:image/svg+xml,..."); /* tiny noise pattern */
  mix-blend-mode: overlay;
}
```

---

## Navigation Bar

**ID:** `#nav`

### Behavior

1. **Initial state (above fold):** Fully transparent. No background, no border. Logo and links float over the hero content.
2. **After scrolling past first viewport:** Transitions to glass state with `bg-black/70 backdrop-blur-2xl border-b border-white/[0.03]`. Transition is `duration-500 ease-out`.
3. **On scroll up (optional enhancement):** Nav reappears with a subtle slide-down if user scrolls up after hiding it on deep scroll.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [LetMeScale]         Testimonials  Results  Our Team       │
│                                                  [Apply]  [Login] │
└─────────────────────────────────────────────────────────────┘
```

- **Logo (left):** "Let" `text-white` + "Me" `text-white/30` + "Scale" `text-white` — no red in the logo at rest. On hover, "Scale" shifts to `text-red-900/60` with `duration-700` transition.
- **Section links (center-right):** `text-white/35 hover:text-white/80 transition-colors duration-300`. Smooth-scroll to section anchors.
  - **Testimonials** → scrolls to first testimonial story (Trell, Section 6)
  - **Results** → scrolls to Results Gallery (Section 19)
  - **Our Team** → scrolls to Our Team (Section 14)
- **Apply button (right):** Small glass CTA: `bg-white/[0.04] border border-white/[0.06] px-5 py-2 rounded-xl text-white/80 text-sm font-medium hover:bg-white/[0.06] hover:border-white/[0.08]`. On hover, a barely-perceptible warm red glow appears inside: `bg-red-950/[0.04]`. Clicking opens the **Apply Modal**.
- **Login link:** `text-white/25 text-xs hover:text-white/50`. Ghost link. Navigates to `/login`.

### Mobile Nav

- Hamburger icon (three thin white/30 lines)
- Opens fullscreen overlay: `bg-black/95 backdrop-blur-2xl`
- Links stack vertically, large touch targets (`py-4 text-xl`)
- Apply button full-width at bottom
- Close X in top right

### Animation

- Nav fades in on page load: `opacity: 0 → 1` over 800ms with 400ms delay
- Glass transition on scroll uses `useMotionValueEvent` on `scrollY`

---

## Scroll Progress

A 2px line fixed at the very top of the viewport, spanning the full page width.

```
bg-gradient-to-r from-white/[0.06] via-white/[0.15] to-white/[0.06]
```

Note: No red. The progress bar is a monochrome white gradient — barely visible but enough to give spatial orientation. This aligns with the "minimize red" directive.

Uses `useScroll()` + `useSpring()` from Framer Motion. `scaleX` transforms from 0 to 1.

---

## Apply Modal (Global)

**Trigger:** Any "Request Access" / "Apply" button anywhere on the page opens this same modal. It is a single shared component rendered at the root level.

### Appearance

- **Backdrop:** `bg-black/70 backdrop-blur-md` — medium blur so the page content is softly visible behind it
- **Panel:** Centered on desktop, full-screen on mobile
  - Desktop: `max-w-lg w-full mx-auto`
  - Mobile: full viewport with `rounded-none`
  - `bg-[#0A0A0A] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50`

### Content — Multi-Step Form

**Step indicator** at top: dots (not numbered). Active dot is `bg-white`, inactive dots are `bg-white/15`.

**Step 1 — Qualification:**
```
"Before we go further."
→ text-white/50 text-sm

"Do you currently generate revenue?"
→ Two card-select options: "Yes" / "No"
→ Cards: bg-white/[0.03] border border-white/[0.06] rounded-xl p-6
→ Selected: border-white/[0.12] bg-white/[0.05]
→ "No" selection → smooth transition to rejection view:
   "This isn't the right fit — yet."
   text-white/30 text-center
   [Back] ghost button

If "Yes":
"Monthly revenue range?"
→ Card-select: $10K-50K / $50K-250K / $250K-1M / $1M+
```

**Step 2 — Details:**
```
Name                    [input]
Email                   [input]
Business name           [input]
Website or social link  [input]
Primary goal            [textarea, 3 rows]
How did you hear?       [dropdown: Referral / Social / Search / Other]

All inputs: bg-[#111111] border border-white/[0.06] rounded-xl
Focus: border-white/[0.10] ring-1 ring-red-900/10
```

**Step 3 — Schedule:**
```
Calendly embed (dark theme) or placeholder:
"Select a time. This isn't a sales call — it's an alignment check."
→ text-white/40 text-sm
```

**Step 4 — Confirmation:**
```
Minimal checkmark animation (white circle, white check, no red)
"We've received your application."
"If there's alignment, you'll hear from us."
→ text-white/40

[Close] ghost button
```

### Animations

- Modal enters with `scaleIn` (scale 0.97 → 1, opacity 0 → 1, duration 400ms)
- Backdrop fades in over 300ms
- Step transitions: content slides left with crossfade (200ms)
- Exit: reverse of enter

### Mobile Optimization

- Full viewport height
- Steps scroll vertically if content overflows
- Large touch targets on all inputs and buttons (min 48px height)
- Keyboard-aware: form scrolls to keep focused input visible
- Bottom-anchored Next/Submit button

---

## Section Map

The full page scroll order. Testimonial stories are woven between conceptual sections to create a rhythm: *concept → proof → concept → proof → concept → proof...*

| # | Section | Type | Height | Purpose |
|---|---------|------|--------|---------|
| 1 | Hero | Conceptual | 100vh | First impression. Tagline. Single CTA. |
| 2 | VSL Feature | Media | ~80vh | The owner's pitch. Build trust through presence. |
| 3 | Disqualifier | Conceptual | ~60vh | Filter out the wrong audience immediately. |
| 4 | Who This Is For | Conceptual | ~80vh | Define the ideal client. Qualification. |
| 5 | What We Do | Conceptual | ~90vh | Three pillars of the service. |
| 6 | **Trell Story** | Testimonial | 200-300vh (scroll-driven) | $83K in 6 days. Before/after revenue. |
| 7 | Why This Works | Conceptual | ~70vh | Contrast: what others sell vs what we sell. |
| 8 | **Daniel Story** | Testimonial | 200-300vh (scroll-driven) | 14.2M views in 90 days. Viral analytics. |
| 9 | Metrics Bar | Data | ~30vh | Aggregate numbers — animated counters. |
| 10 | How We Work | Conceptual | ~70vh | Three-step blur reveal. Mystery. |
| 11 | **Mark Shapiro Story** | Testimonial | 200-300vh (scroll-driven) | $90K cash collected. Sales dashboards. |
| 12 | Why Different | Conceptual | ~60vh | Strikethrough negatives. "We sell leverage." |
| 13 | **Chetha Story** | Testimonial | 200-300vh (scroll-driven) | 6.5M views. Content rewards platform. |
| 14 | Our Team | Conceptual | ~90vh | The people behind LetMeScale. |
| 15 | The Other Room | Conceptual | ~60vh | Secondary positioning. Muted. |
| 16 | How We Engage | Conceptual | ~50vh | Minimal. Private. Exclusive. |
| 17 | Not For | Conceptual | ~50vh | Disqualification list. |
| 18 | Philosophy | Conceptual | ~70vh | Typewriter closer. Emotional peak. |
| 19 | Results Gallery | Interactive | ~100vh | All proof in one place. Cross-linked. |
| 20 | Final CTA + Apply | Conversion | ~80vh | Last CTA. Scroll anchor for Apply. |
| 21 | Footer | Utility | ~20vh | Minimal. Logo + copyright. |

**Total estimated scroll length:** ~25-30 viewport heights. This is a long, immersive, story-driven page.

---

## Section 1: Hero

**ID:** `#hero`
**Height:** `min-h-screen` (100vh)
**Background:** `bg-black` with `noise-bg` overlay
**Purpose:** Immediate authority. One sentence. One action. No clutter.

### Layout

Centered content with maximum restraint. Apple product-page energy.

```
                    [vertical center of viewport]

        "We Build Attention That Produces Direct ROI."

              Not exposure. Not "personal brand."
                    Not dopamine metrics.

                      [ Request Access ]
                     We review selectively.

                          ↓ (scroll indicator)
```

### Content

**Headline:**
```tsx
<h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-[-0.04em] leading-[0.9] text-white text-center">
  We Build Attention That
  <br />
  Produces Direct <span className="text-white/25">ROI.</span>
</h1>
```

"ROI." is dimmed to `text-white/25` — the most important word is de-emphasized, which paradoxically draws more attention to it. This is the Apple "quiet emphasis" technique.

**Sub-lines (staggered):**
```
"Not exposure."          → text-white/35 text-lg, delay 400ms
"Not 'personal brand.'"  → text-white/35 text-lg, delay 600ms
"Not dopamine metrics."  → text-white/35 text-lg, delay 800ms
```

Each line fades in individually with `fadeInUp` (y: 15 → 0, opacity 0 → 1).

**CTA Button:**
```tsx
<button className="
  relative px-10 py-4 rounded-xl
  bg-white/[0.04] border border-white/[0.06]
  text-white font-medium text-sm tracking-wide
  hover:bg-white/[0.06] hover:border-white/[0.08]
  transition-all duration-500
  group
">
  <div className="absolute inset-0 rounded-xl bg-red-950/0 group-hover:bg-red-950/[0.04] transition-all duration-700" />
  <span className="relative">Request Access</span>
</button>
```

Below CTA: `"We review selectively."` in `text-white/15 text-xs tracking-wider`

**Scroll indicator:**
```
Animated chevron-down at bottom of viewport
text-white/8, slow bounce animation (2s loop)
Fades out when user begins scrolling
```

### Animations

- **On load (not scroll-triggered):**
  - Headline: `blurReveal` — emerges from `blur(12px)` to sharp over 1.2s
  - Sub-lines: stagger `fadeInUp` at 400ms intervals
  - CTA: `fadeInUp` with 1s delay
  - Scroll indicator: `fadeIn` with 1.5s delay

- **Parallax:** Headline group moves at 0.85x scroll speed (slight depth as user scrolls away)

### Ambient Effect

Very subtle radial glow centered at top of viewport:
```css
background: radial-gradient(
  ellipse 600px 400px at 50% 20%,
  rgba(127, 29, 29, 0.025) 0%,
  transparent 70%
);
```

This creates a barely-perceptible warmth at the center of the hero. It should be almost invisible — felt more than seen.

---

## Section 2: VSL Feature

**ID:** `#vsl`
**Height:** `~80vh` (`min-h-[80vh]`)
**Background:** `bg-black` → `bg-[#020202]` gradient transition
**Purpose:** The owner's personal pitch. Build trust, convey authority, make the viewer feel they're hearing from someone real.

### Layout — Feng Shui Asymmetric

Content is deliberately off-center. The video sits on the left side with text anchoring on the right. This creates visual tension and sophistication — not a centered template layout.

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   ┌─────────────────────────┐                              │
│   │                         │     "Hear it directly."      │
│   │      VIDEO PLAYER       │                              │
│   │    (16:9, click play)   │     The founder explains     │
│   │                         │     what LetMeScale is,      │
│   │    ▶ Play (center)      │     how it works, and why    │
│   │                         │     it exists.               │
│   └─────────────────────────┘                              │
│                                        [ Watch → ]         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Desktop: `grid grid-cols-12 gap-8` — video takes `col-span-7`, text takes `col-span-5`
Mobile: stacks vertically — video full-width on top, text below

### Video Player

- **Aspect ratio:** 16:9, `rounded-2xl overflow-hidden`
- **Border:** `border border-white/[0.04]`
- **Initial state:** Dark thumbnail (first frame or custom poster) with centered play button
- **Play button:** Large circle, `bg-white/[0.06] backdrop-blur-xl`, white triangle icon inside. On hover: `bg-white/[0.10]`. Size: `w-20 h-20`.
- **On click:** Opens **Video Modal** (fullscreen player). Does NOT play inline — the modal experience is more cinematic.
- **Shadow:** `shadow-2xl shadow-black/40` — lifts the player off the page

### Text (Right Side)

```
[Overline]    "FROM THE FOUNDER"
              → text-[11px] tracking-[0.25em] uppercase text-white/20

[Headline]    "Hear it directly."
              → text-2xl md:text-3xl font-semibold text-white/90 tracking-tight

[Body]        "This isn't a pitch deck or a highlight reel.
               It's a direct conversation about what we do,
               who it's for, and why it works."
              → text-white/40 text-base leading-relaxed mt-4

[Duration]    "18 min"
              → text-white/20 text-xs mt-6, with a small clock icon
```

### Animations

- Video player: `fadeIn` + slight `scale(0.98 → 1)` on scroll reveal, `duration-1000`
- Text: `fadeInUp` staggered, 200ms delay after video
- Play button: subtle `glowPulse` animation (white glow breathes in and out slowly, 3s loop)

---

## Section 3: Disqualifier

**ID:** `#disqualifier`
**Height:** `~60vh` (`min-h-[60vh]`)
**Background:** `bg-black`
**Purpose:** Immediately filter the audience. Create exclusivity. The wrong people should feel unwelcome. The right people should feel seen.

### Layout

Centered, narrow column. `max-w-2xl mx-auto text-center`

### Content

Lines appear sequentially on scroll — each one cuts in sharply:

```
"This is not a content agency."          → text-white/60 text-xl font-medium
                                          → sharp cut animation (opacity 0→1, x: -20→0, 150ms)

"This is not a branding studio."         → text-white/60 text-xl font-medium
                                          → 300ms delay

"This is not for beginners."             → text-white/80 text-xl font-semibold
                                          → 600ms delay, slightly brighter — emphasis
```

After all three lines reveal, a horizontal rule scales in from center:
```
────────────────────────── (bg-white/[0.06], scaleX 0→1, duration 800ms)
```

Then the qualification statement fades in below:

```
"If you already make money and want more leverage, keep reading.
 If you don't, this page isn't for you."
→ text-white/35 text-base mt-8
→ fadeIn with 1s delay
```

### Subtle CTA

A ghost-style link appears at the bottom:
```
"Still here? Good."  → text-white/15 text-xs tracking-wider, fadeIn with 1.5s delay
```

No button. No action. Just psychological reinforcement.

---

## Section 4: Who This Is For

**ID:** `#who-is-for`
**Height:** `~80vh`
**Background:** `bg-[#020202]`
**Purpose:** Define the ideal client profile. Make the right person think "that's me."

### Layout

Two-column on desktop: `grid md:grid-cols-2 gap-16 items-center`
Left: text. Right: glass card with qualification criteria.

### Left Column

```
[Overline]    "WHO THIS IS FOR"
              → text-[11px] tracking-[0.25em] uppercase text-white/20

[Headline]    "Creators & Operators
               Who Expect ROI"
              → text-3xl md:text-4xl font-bold tracking-tight text-white

[Body]        "This is our core audience. You already:"
              → text-white/50 mt-4

[List]
  • Sell information, services, or high-ticket offers
  • Understand attention as a business asset
  • Care about conversion, not applause
  → Each: flex items-start gap-3
  → Dot: w-1 h-1 rounded-full bg-white/20 mt-2
  → Text: text-white/45 text-sm leading-relaxed
```

### Right Column — Glass Card

```tsx
<div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-2xl p-10">
  {/* Inner glow line */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

  <p className="text-white/60 font-medium">We design distribution systems that:</p>

  <ul className="mt-6 space-y-4">
    <li>Attract the right audience at volume</li>       {/* dot: bg-red-900/40 */}
    <li>Create inbound pressure</li>                    {/* dot: bg-red-900/40 */}
    <li>Translate attention into real opportunities</li> {/* dot: bg-red-900/40 */}
  </ul>

  <div className="h-px bg-white/[0.04] my-8" />

  <p className="text-white/70 font-semibold">
    "You don't need motivation. You need scale that pays."
  </p>
</div>
```

Note: The red dots (`bg-red-900/40`) are the most visible use of red so far on the page. They're small (1.5px), dark, and function as subtle visual markers — not decoration.

### Animations

- Left column: `fadeInUp` stagger (overline → headline → body → list items)
- Right card: `fadeInUp` with 200ms delay after left column begins
- Card has a very subtle `hoverLift` on desktop (y: -2px on hover)

---

## Section 5: What We Do (Three Pillars)

**ID:** `#what-we-do`
**Height:** `~90vh`
**Background:** `bg-black`
**Purpose:** Communicate the three core value propositions clearly and memorably.

### Layout

```
[Overline]    "WHAT WE DO"

[Headline]    "Three Systems. One Outcome."
              → text-3xl md:text-4xl font-bold text-white

[3-Column Grid]   → grid md:grid-cols-3 gap-6 mt-12
```

### Cards

Each card is a Feature Pillar Card:

```tsx
<div className="group relative bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-2xl p-10 hover:bg-white/[0.03] hover:border-white/[0.07] transition-all duration-500">
  {/* Top accent line — shifts to warm on hover */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent group-hover:via-red-950/15 transition-all duration-700" />

  {/* Large ghost number */}
  <span className="text-7xl font-black text-white/[0.025] group-hover:text-white/[0.04] transition-colors duration-700 select-none">01</span>

  {/* Title */}
  <h3 className="text-xl font-semibold text-white mt-4">We Turn Content Into Inbound Advantage</h3>

  {/* Key line */}
  <p className="text-white/45 text-sm mt-3 leading-relaxed">
    "Your content isn't meant to 'perform.' It's meant to work."
  </p>

  {/* Bullets */}
  <ul className="mt-6 space-y-3">
    <li className="flex items-start gap-3">
      <span className="w-1 h-1 rounded-full bg-red-900/30 mt-2 shrink-0" />
      <span className="text-white/40 text-sm">Interest comes to you</span>
    </li>
    ...
  </ul>

  {/* Closer */}
  <p className="text-white/50 text-sm mt-8 pt-6 border-t border-white/[0.03] italic">
    "This is how creators stop selling and start selecting."
  </p>
</div>
```

**Card 1:** "We Turn Content Into Inbound Advantage"
- Bullets: Interest comes to you / Conversations start without chasing / Your offer sits behind attention
- Closer: "This is how creators stop selling and start selecting."

**Card 2:** "We Manage Attention Like Capital"
- Bullets: Deployed intentionally / Tested aggressively / Scaled when efficient / Cut when wasteful
- Closer: "We don't guess. We observe, refine, and compound."

**Card 3:** "We Build Systems, Not Campaigns"
- Bullets: Run continuously / Adapt to platform behavior / Produce predictable inbound flow
- Closer: "This is why our work scales with you — not against you."

### Animations

- Cards stagger in: `fadeInUp` with 150ms between each
- Ghost numbers: crossfade opacity on hover
- Top accent line: gradient shift on hover (white → warm red-950)
- Entire card: `hoverLift` (y: -2px) on desktop

### Interactive

- On mobile: cards stack vertically, swipeable horizontal scroll (optional)
- Each card has a subtle "expand" behavior on tap (mobile): card grows slightly and bullets fade in with stagger

---

## Section 6: Trell Story (Full-Screen Testimonial)

**ID:** `#testimonial-trell`
**Height:** Scroll-driven — content is pinned while user scrolls. Approximately 250vh of scroll distance mapped to a single viewport of animated content.
**Background:** `bg-[#020202]`
**Purpose:** Prove the claim. $83K in 6 days. Show real revenue dashboards. Tell the transformation story through scroll.

### Scroll-Driven Story Architecture

The testimonial story uses `useScroll()` with a container ref. The section element is tall (250vh), but the visual content is `position: sticky; top: 0; height: 100vh` — it stays pinned in view while scroll progress drives the animation timeline.

```
Scroll Progress:  0% ────────────── 50% ────────────── 100%
                  │                  │                   │
                  ▼                  ▼                   ▼
            Name reveals      Metrics count up      Analytics screenshots
            + tagline         + before state         slide in + after state
```

### Story Phases (Scroll-Driven)

**Phase 1 (0-20% scroll): Client Introduction**

```
                         [center of viewport]

                              TRELL
                         THE TRAINER

              "$83,212 generated in 6 days."

         ─────────────── (line scales in) ───────────────
```

- "TRELL" appears first: `text-6xl md:text-7xl font-black text-white tracking-[-0.04em]` — `blurReveal` animation
- "THE TRAINER" below: `text-lg tracking-[0.3em] uppercase text-white/25` — fades in 400ms later
- Metric line: `text-white/50 text-xl` — fades in 800ms later
- Horizontal rule: `lineScale` from center

**Phase 2 (20-45% scroll): Before State**

The centered text fades and shifts left. A glass card appears on the right showing the "before" analytics:

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  "Before LetMeScale"           ┌──────────────────┐   │
│  text-white/20 overline        │  BEFORE SCREENSHOT │  │
│                                │                    │  │
│  October 2025                  │  $31,649 revenue   │  │
│  $31,649.72 gross revenue      │  -$8,832 decline   │  │
│  -$8,832 decline               │                    │  │
│                                │  (real screenshot)  │  │
│  text-white/40 body            └──────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

- Screenshot image slides in from right: `x: 100 → 0, opacity: 0 → 1, duration: 800ms`
- Image is inside a glass card with `rounded-2xl overflow-hidden border border-white/[0.04]`
- Before metrics text on the left: `fadeInUp` stagger
- Image source: `/testimonials/trell/before-15.01.09.jpeg`
- Additional before images available for gallery (click to open Case Study Modal)

**Phase 3 (45-55% scroll): Transition Moment**

Quick visual beat — everything fades briefly, then:

```
                    "Then we stepped in."
                    → text-white/60 text-lg italic
                    → blurReveal, centered
```

This is a 2-second emotional beat. The screen goes nearly black, then the line appears.

**Phase 4 (55-85% scroll): After State**

The transformation. Mirror layout of Phase 2 but dramatically brighter.

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ┌──────────────────┐         "After LetMeScale"      │
│  │  AFTER SCREENSHOT │         text-white/30 overline  │
│  │                    │                                │
│  │  $187,321 revenue  │         December 2025          │
│  │  +$100,312 increase│         $187,321.54 revenue    │
│  │                    │         +$100,312.90 increase   │
│  │  (real screenshot)  │         360 users              │
│  └──────────────────┘         $466,593 earned          │
│                                                        │
│                               text-white/70 body       │
└────────────────────────────────────────────────────────┘
```

- After screenshot slides in from left (mirrored direction for visual contrast)
- Key metrics count up using the `Counter` component
- The `$187,321` number is `text-white text-3xl font-bold` — full opacity, maximum emphasis
- Image source: `/testimonials/trell/after-14.59.36.jpeg`

**Phase 5 (85-100% scroll): Closing Statement**

```
                    "$83K in 6 days."
                    → text-white text-3xl font-bold
                    → fadeIn

                    "Revenue. Not views."
                    → text-white/35 text-sm
                    → fadeIn with 400ms delay

                    [View all results →]
                    → ghost link, opens Case Study Modal with all Trell images
```

### Interactive Elements

- **Click any screenshot** → Opens **Case Study Modal** with full Trell image gallery (before-1, before-2, before-3, after-1, after-2, after-3, revenue-83k)
- **"View all results" link** → Same modal
- **Cross-link:** This section's ID (`#testimonial-trell`) is linked from the Results Gallery. Clicking Trell's entry in the Results Gallery scrolls here, and vice versa.

### Subtle CTA (Seamless)

At the end of the story, a very small apply nudge appears:

```
"Results like these start with a conversation."
→ text-white/15 text-xs
→ [Request Access] small ghost button
→ Opens Apply Modal
```

---

## Section 7: Why This Works

**ID:** `#why-this-works`
**Height:** `~70vh`
**Background:** `bg-black`
**Purpose:** Position against competitors. Create contrast between what agencies sell and what LetMeScale sells.

### Layout

Centered, `max-w-3xl mx-auto text-center`

### Content

```
[Overline]    "WHY THIS WORKS"

[Negatives — strikethrough, staggered]
  "Most agencies sell effort."           → line-through text-white/25, fadeIn
  "Most agencies sell aesthetics."       → line-through text-white/25, fadeIn +200ms
  "Most agencies sell 'growth'           → line-through text-white/25, fadeIn +400ms
   with no accountability."

[Pause — 600ms]

[Positive — glow reveal]
  "We sell leverage."
  → text-white text-3xl md:text-4xl font-bold
  → blurReveal animation — emerges from blur(10px), 1s duration
  → Very subtle white glow around the text (text-shadow: 0 0 40px rgba(255,255,255,0.04))

[Closer]
  "The difference is obvious once you've made money before."
  → text-white/40 text-base mt-8
  → fadeIn with 400ms delay after "We sell leverage"
```

### Animation Sequence

This section is a choreographed sequence, not independent scroll reveals:
1. Overline fades in
2. Strikethrough lines appear one by one (150ms stagger)
3. Horizontal rule scales in from center
4. Beat/pause
5. "We sell leverage." blur-reveals — this is the climax of the section
6. Closer fades in

---

## Section 8: Daniel Story (Full-Screen Testimonial)

**ID:** `#testimonial-daniel`
**Height:** Scroll-driven, ~280vh
**Background:** `bg-[#050505]`
**Purpose:** Prove viral reach capability. 14.2M views. Show real Instagram analytics. Emphasize non-follower reach (99.1%).

### Story Phases

**Phase 1 (0-20%): Introduction**

```
                              DANIEL
                         CONTENT CREATOR

              "14.2 million views in 90 days."
```

Same treatment as Trell intro. `blurReveal` on name, stagger on details.

**Phase 2 (20-40%): The Scale**

A single analytics screenshot dominates the viewport:

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│           ┌────────────────────────────┐               │
│           │                            │               │
│           │   INSTAGRAM ANALYTICS      │               │
│           │   Views: 4,378,933         │               │
│           │   Watch time: 338d+        │               │
│           │   Interactions: 253,669    │               │
│           │                            │               │
│           └────────────────────────────┘               │
│                                                        │
│           "December 2025. One account."                │
│           → text-white/35 text-sm                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Image source: `/testimonials/daniel/DecemberResult.jpeg`
Image reveals with `scaleIn` (0.95 → 1) + `fadeIn`

**Phase 3 (40-60%): The Reel That Broke Through**

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  "One reel. 2.3M reach."      ┌──────────────────┐   │
│  → text-white text-2xl         │  REEL ANALYTICS   │   │
│                                │                    │   │
│  "99.1% non-followers."       │  234K likes        │   │
│  → text-white/70 text-lg      │  1.2K comments     │   │
│                                │  3.2K shares       │   │
│  Counter animations:           │  7.6K saves        │   │
│  234,000+ likes               │                    │   │
│  1,200+ comments              └──────────────────┘   │
│  3,200+ shares                                        │
│  7,600+ saves                                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Metrics on the left count up as user scrolls. Screenshot on the right.
Image sources: `/testimonials/daniel/ReelInsight(2).jpeg`, `/testimonials/daniel/Acc_reach_oneReel.png`

**Phase 4 (60-80%): The 90-Day View**

Full-width analytics screenshot showing the complete growth curve:

```
13,702,110 total views
→ Counter animation, text-white text-4xl font-bold

"90 days. Reels only. Organic."
→ text-white/40 text-base
```

Image source: `/testimonials/daniel/Last_90_days.PNG`

**Phase 5 (80-100%): Closing**

```
"14.2M views. Zero ad spend."
→ text-white text-2xl font-semibold

"That's what distribution engineering looks like."
→ text-white/35 text-sm

[View all analytics →]   → Opens Case Study Modal with all 10 Daniel images
```

### Subtle CTA

```
"Ready to see what this looks like for your brand?"
→ text-white/12 text-xs
→ [Request Access] ghost link → Apply Modal
```

---

## Section 9: Aggregate Metrics Bar

**ID:** `#metrics`
**Height:** `~30vh` (`min-h-[30vh] flex items-center`)
**Background:** `bg-black`
**Purpose:** Aggregate social proof in a single data-dense bar. Creates a breath between testimonial stories.

### Layout

Full-width glass bar:

```tsx
<div className="bg-white/[0.02] border-y border-white/[0.04] py-12">
  <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    {metrics.map(...)}
  </div>
</div>
```

### Metrics

| Number | Label | Counter Duration |
|--------|-------|-----------------|
| `$83,212+` | "Revenue generated" | 2.5s |
| `14.2M` | "Views in 90 days" | 2s |
| `$90,300+` | "Cash collected" | 2.5s |
| `2.3M` | "Reach from 1 reel" | 1.8s |

Each number: `text-2xl md:text-3xl font-bold text-white`
Each label: `text-xs text-white/25 mt-1 tracking-wider uppercase`
Dividers: `w-px h-12 bg-white/[0.04]` between metrics (desktop only)

### Animation

- Counters animate on scroll-into-view using `useInView` + `useSpring`
- Numbers count from 0 to target over specified duration
- All four start simultaneously
- Format: `$` prefix for dollar amounts, `M` suffix for millions

---

## Section 10: How We Work

**ID:** `#how-we-work`
**Height:** `~70vh`
**Background:** `bg-[#020202]`
**Purpose:** Create mystery. Show enough to intrigue without revealing internal process. Exclusive energy.

### Layout

Centered, `max-w-2xl mx-auto text-center`

### Content — Blur-to-Sharp Reveal

Three statements that start blurred and sharpen on scroll:

```
[Overline]    "HOW WE WORK"

[Statement 1]  "We assess where your attention currently sits."
               → starts at filter: blur(8px), opacity: 0.3
               → sharpens to blur(0px), opacity: 0.6 as user scrolls

[Statement 2]  "We engineer how monetization pressure is created."
               → same treatment, 200ms later in scroll timeline

[Statement 3]  "We scale without dilution."
               → same treatment, 400ms later

[Closer]       "Details are discussed privately."
               → text-white/60 font-semibold mt-12
               → fadeIn after all three statements sharpen
```

### Interactive Element

Each statement, on hover (desktop), reveals a brief one-line expansion:

```
Statement 1 hover → "Content audit. Platform analysis. Audience mapping."
                     → text-white/20 text-xs, slides down 20px with fadeIn
Statement 2 hover → "Hook engineering. Distribution sequencing. Conversion paths."
Statement 3 hover → "Volume control. Quality benchmarks. Revenue correlation."
```

These expansions are deliberately vague — just enough to signal competence without giving away the playbook.

---

## Section 11: Mark Shapiro Story (Full-Screen Testimonial)

**ID:** `#testimonial-mark`
**Height:** Scroll-driven, ~250vh
**Background:** `bg-black`
**Purpose:** Prove revenue-side results. $90K+ cash collected. Show real sales dashboards with conversion metrics.

### Story Phases

**Phase 1 (0-20%): Introduction**

```
                          MARK SHAPIRO
                            CAPITAL

              "$90,300+ cash collected."
```

**Phase 2 (20-50%): The Sales Machine**

Multiple dashboard screenshots revealing sequentially:

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  "The numbers behind                                   │
│   attention-driven revenue."   ┌──────────────────┐   │
│                                │  SALES DASHBOARD   │   │
│  Key metrics animate in:      │                    │   │
│                                │  213 Booked Calls  │   │
│  213    Booked Calls           │  72% Show Rate     │   │
│  72%    Show Up Rate           │  40 New Deals      │   │
│  40     New Deals Closed       │  $111K Collected   │   │
│  $111K  Cash Collected         │                    │   │
│                                └──────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Image sources: `/testimonials/mark-shapiro/dashboard-1.jpeg` through `dashboard-7.jpeg`

The screenshots cycle/crossfade between different months showing consistent results.

**Phase 3 (50-75%): The Conversion Story**

```
"This isn't social media vanity.
 This is a sales pipeline."

 Booked → Showed → Closed → Collected

 Lead to Book: 21.19%
 Show Rate: 71.83%
 Close Rate: 33.90%
```

Each metric has a thin horizontal bar that fills to represent the percentage, using `bg-white/[0.08]` fill on `bg-white/[0.02]` track.

**Phase 4 (75-100%): Closing**

```
"$90K+ collected. From attention alone."
→ text-white text-2xl font-semibold

"No ads. No cold outreach. Inbound."
→ text-white/30 text-sm

[View full dashboard →]   → Opens Case Study Modal with all 7 dashboard images
```

### Subtle CTA

```
"Your pipeline could look like this."
→ text-white/12 text-xs
→ [Request Access] → Apply Modal
```

---

## Section 12: Why LetMeScale Is Different

**ID:** `#why-different`
**Height:** `~60vh`
**Background:** `bg-[#020202]`
**Purpose:** Direct competitive differentiation in one powerful statement.

### Layout

Centered, `max-w-3xl mx-auto`

### Content

Two columns — "Them" vs "Us":

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  THEM                        US                     │
│                                                     │
│  Sell effort                 Sell leverage           │
│  Sell aesthetics             Sell outcomes           │
│  Sell "growth"               Sell control            │
│  No accountability           Private accountability  │
│                                                     │
│  (text-white/20              (text-white/70          │
│   line-through)               font-medium)           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Alternatively, the simpler version from the brand doc:

```
[Strikethrough negatives]
  "Sell effort"           → line-through text-white/20
  "Sell aesthetics"       → line-through text-white/20
  "Sell 'growth'"         → line-through text-white/20

[Strong positive]
  "We sell leverage."     → text-white text-3xl font-bold, blurReveal

[Closer]
  "The difference is obvious once you've made money before."
  → text-white/40
```

Choose whichever treatment feels stronger during implementation. The two-column version is more Palantir; the sequential version is more Apple.

---

## Section 13: Chetha Story (Full-Screen Testimonial)

**ID:** `#testimonial-chetha`
**Height:** Scroll-driven, ~280vh
**Background:** `bg-[#050505]`
**Purpose:** Show scale across multiple accounts. 6.5M views. Content rewards platform. The most data-rich testimonial.

### Story Phases

**Phase 1 (0-20%): Introduction**

```
                             CHETHA
                              MEDIA

              "6.5 million views generated."
```

**Phase 2 (20-45%): The Analytics**

Large screenshot showing 90-day analytics:

```
21,492,253 total views
→ Counter, text-white text-4xl font-bold

Accounts reached: 7,072,385
→ Counter with +49.8% badge

91.2% non-followers
→ text-white/60
```

Image source: `/testimonials/chetha/IMG_5177.PNG`

**Phase 3 (45-65%): Monthly Breakdown**

```
June-July 2025 alone:
6,986,848 views
2,735,726 accounts reached
98.2% Reels
```

Image source: `/testimonials/chetha/IMG_4453.PNG`

Screenshot slides in, metrics animate alongside.

**Phase 4 (65-85%): The Content Rewards System**

A unique angle — showing the Maaz results and the content rewards platform:

```
"We don't just distribute.
 We build ecosystems."

 Content Rewards Dashboard:
 1.8M views
 81 submissions
 $2.00/1K reward
```

Image source: `/testimonials/chetha/IMG_3316.PNG`

This demonstrates that LetMeScale's system creates self-sustaining content machines.

**Phase 5 (85-100%): Closing**

```
"6.5M views. Multiple accounts. One system."
→ text-white text-2xl font-semibold

[View all results →]   → Case Study Modal with all Chetha images
```

### Subtle CTA

```
"Scale like this is engineered, not accidental."
→ text-white/12 text-xs
→ [Request Access] → Apply Modal
```

---

## Section 14: Our Team

**ID:** `#our-team`
**Height:** `~90vh`
**Background:** `bg-black`
**Purpose:** Humanize the brand. Show the people are absurdly overqualified. Build trust through credentials.

### Layout

```
[Overline]    "OUR TEAM"

[Headline]    "Laughably Overqualified."
              → text-3xl md:text-4xl font-bold text-white

[Subline]     "The people behind the leverage."
              → text-white/40 text-base mt-2
```

Then a grid of team member cards: `grid md:grid-cols-3 gap-6`

### Team Member Cards

Each card is a glass card with hover interaction:

```tsx
<div className="group bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-2xl p-8 hover:bg-white/[0.03] hover:border-white/[0.07] transition-all duration-500">

  {/* Avatar placeholder — monogram circle */}
  <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
    <span className="text-white/30 text-xl font-bold">AB</span>
  </div>

  {/* Name */}
  <h3 className="text-lg font-semibold text-white mt-4">Name</h3>

  {/* Title */}
  <p className="text-white/40 text-sm mt-1">Title</p>

  {/* Divider */}
  <div className="h-px bg-white/[0.03] my-4" />

  {/* Credentials — revealed on hover/tap */}
  <div className="space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
    <p className="text-white/30 text-xs">• Credential 1</p>
    <p className="text-white/30 text-xs">• Credential 2</p>
    <p className="text-white/30 text-xs">• Credential 3</p>
  </div>
</div>
```

### Team Data

Source from project docs and brand positioning. Members should include the founder and key operators. Credentials should be real and impressive — backgrounds in finance, tech, media, or performance marketing.

**Example cards (placeholder — fill with real team data):**

| Name | Title | Credentials |
|------|-------|-------------|
| [Founder Name] | Founder & CEO | Built systems generating 50M+ views. Former [impressive background]. |
| [Name] | Head of Distribution | Managed campaigns reaching 100M+ impressions. Platform algorithm specialist. |
| [Name] | Head of Strategy | Ex-[notable company]. Revenue optimization across 200+ accounts. |
| [Name] | Lead Editor | 10,000+ pieces of content produced. Viral content architect. |
| [Name] | DM & Conversion Lead | 5,000+ DM conversations managed. Inbound pipeline specialist. |
| [Name] | Operations | Systems and automation. Keeps the machine running. |

### Animations

- Cards stagger `fadeInUp` with 100ms delay between each
- Credentials reveal on hover (desktop) or tap (mobile)
- `hoverLift` on each card (y: -3px)

### Interactive

- On mobile, credentials are always visible (no hover state) — displayed below the divider at reduced opacity
- Optional: clicking a card opens a mini-modal or expands the card with a brief bio paragraph

---

## Section 15: The Other Room (Secondary Positioning)

**ID:** `#other-room`
**Height:** `~60vh`
**Background:** `bg-[#030303]` — visually separated, intentionally muted
**Purpose:** Acknowledge the secondary audience (views-only creators) without diluting the primary message.

### Visual Treatment

Everything in this section is deliberately dimmer than the rest of the page. Max text opacity is `text-white/35`. This creates a visual "step down" — the viewer can tell this is secondary information.

### Content

```
[Overline]    "THE OTHER ROOM"
              → text-white/15

[Headline]    "For Creators Who Just Want Views"
              → text-2xl md:text-3xl font-bold text-white/50

[Body]        "This is not the main room — but it exists."
              → text-white/30

[What they want]
  • Want reach               → text-white/25
  • Want consistency         → text-white/25
  • Want content amplified   → text-white/25

[What we do]
  "This side focuses purely on:"
  • Clipping                 → text-white/25
  • Distribution             → text-white/25
  • Volume                   → text-white/25

[Negatives]
  "No backend. No conversion focus.
   No operating involvement."
  → text-white/15, stacked

[Closer]
  "If that's what you need, we'll keep it simple."
  → text-white/30 italic
```

### Animations

- Everything scroll-triggered with `fadeIn` (not `fadeInUp` — less emphasis)
- Slow, understated reveals (1s duration)

---

## Section 16: How We Engage

**ID:** `#how-we-engage`
**Height:** `~50vh`
**Background:** `bg-black`
**Purpose:** Reinforce exclusivity. Private engagement model. Not everyone gets in.

### Layout

Centered glass card: `max-w-2xl mx-auto`

```tsx
<div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-12 text-center">
  <p className="text-white/50">We don't publicly outline execution.</p>
  <p className="text-white/50 mt-3">We don't run cookie-cutter systems.</p>
  <p className="text-white/50 mt-3">We don't onboard everyone.</p>

  <div className="h-px bg-white/[0.03] my-8" />

  <p className="text-white/80 font-semibold text-lg">
    "Fit is determined privately."
  </p>
</div>
```

### Animation

Each line reveals with `blurReveal` stagger (400ms between lines). The closer line is the last to appear — it should feel like a door closing.

---

## Section 17: Who This Is Not For

**ID:** `#not-for`
**Height:** `~50vh`
**Background:** `bg-[#020202]`
**Purpose:** Final filter. Disqualify remaining wrong-fit prospects. The right people read this and feel more confident, not deterred.

### Content

```
[Overline]    "NOT FOR EVERYONE"
              → text-white/15

[List]
  • Beginners                                → text-white/25
  • People experimenting with content        → text-white/25
  • Anyone obsessed with views over outcomes → text-white/25
  • Anyone asking for guarantees             → text-white/25

  Each bullet: fadeIn stagger, 200ms apart
  Dot: bg-white/[0.08], not red

[Closer]
  "This is for people who understand risk, leverage, and upside."
  → text-white/50 font-medium mt-8
  → fadeIn with 400ms delay after last bullet
```

---

## Section 18: Philosophy

**ID:** `#philosophy`
**Height:** `~70vh`
**Background:** `bg-black`
**Purpose:** Emotional peak. The brand's core belief stated plainly. This is the moment the right reader decides to apply.

### Layout

Full-bleed centered. Large typography. Maximum visual impact.

### Content — Typewriter Cascade

Lines appear one at a time with deliberate pauses:

```
"Attention compounds faster than capital —"
→ text-white/35 text-2xl md:text-3xl font-light leading-relaxed
→ typewriterLine, delay 0ms

"if you control distribution."
→ text-white/35 text-2xl md:text-3xl font-light leading-relaxed
→ typewriterLine, delay 500ms

                              [800ms pause]

"Most people don't."
→ text-white/50 text-xl
→ typewriterLine, delay 1300ms

"We do."
→ text-white font-bold text-2xl
→ typewriterLine, delay 1800ms
```

"We do." is the only line at full white opacity and bold weight on the entire page up to this point. It should land with quiet confidence — not shouting, but certain.

### Ambient Effect

A very faint radial glow appears behind "We do." as it reveals:
```css
background: radial-gradient(
  circle 200px at 50% 70%,
  rgba(255, 255, 255, 0.015) 0%,
  transparent 70%
);
```

White glow, not red. Clean.

---

## Section 19: Results Gallery

**ID:** `#results`
**Height:** `~100vh` (scrollable within if content overflows)
**Background:** `bg-[#020202]`
**Purpose:** All proof assets in one place. Cross-linked with testimonial stories. This is where the "Results" nav link points.

### Layout

```
[Overline]    "RESULTS"
[Headline]    "The Work Speaks."

[Filter Tabs]  All | Revenue | Views | Before/After
               → glass tab bar with animated indicator

[Grid]         Masonry or 2x2 grid of proof cards
```

### Filter Tabs

```tsx
<div className="flex gap-2 bg-white/[0.02] border border-white/[0.04] rounded-xl p-1">
  {tabs.map(tab => (
    <button className={cn(
      "px-4 py-2 rounded-lg text-sm transition-all duration-300",
      active === tab
        ? "bg-white/[0.06] text-white"
        : "text-white/30 hover:text-white/50"
    )}>
      {tab}
    </button>
  ))}
</div>
```

Active tab indicator uses Framer Motion `layoutId` for smooth sliding animation.

### Proof Cards

Each card shows a testimonial screenshot with overlay:

```tsx
<div className="relative group cursor-pointer rounded-2xl overflow-hidden border border-white/[0.04] hover:border-white/[0.08] transition-all duration-500">
  {/* Image */}
  <div className="aspect-[4/3]">
    <Image src={...} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-700" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
  </div>

  {/* Caption */}
  <div className="absolute bottom-0 inset-x-0 p-5">
    <p className="text-white font-semibold">{clientName}</p>
    <p className="text-white/40 text-sm mt-1">{metricHeadline}</p>
  </div>

  {/* Hover overlay */}
  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
    <span className="text-white/70 text-sm font-medium">View Results →</span>
  </div>
</div>
```

### Cross-Linking

Each proof card has two actions:
1. **Click image** → Opens **Case Study Modal** with all images for that client
2. **"Go to story" link** → Smooth-scrolls to the corresponding testimonial story section (e.g., `#testimonial-trell`)

From testimonial stories, the "View all results" link scrolls to this section.

### Grid Items

| Client | Card Image | Metric | Tags |
|--------|-----------|--------|------|
| Trell | revenue-83k.jpeg | "$83K in 6 days" | Revenue |
| Trell | before-1.jpeg | "Before LetMeScale" | Before/After |
| Trell | after-1.jpeg | "After LetMeScale" | Before/After |
| Daniel | DecemberResult.jpeg | "4.3M views in December" | Views |
| Daniel | Acc_reach_oneReel.png | "2.3M reach, one reel" | Views |
| Daniel | Last_90_days.PNG | "14.2M views, 90 days" | Views |
| Mark Shapiro | dashboard-1.jpeg | "213 booked calls" | Revenue |
| Mark Shapiro | dashboard-2.jpeg | "$125K collected" | Revenue |
| Chetha | IMG_5177.PNG | "21.4M views" | Views |
| Chetha | IMG_4453.PNG | "7M views, 30 days" | Views |
| Chetha | IMG_3316.PNG | "Content rewards" | Views |

### Animations

- Cards stagger `fadeInUp` on scroll reveal
- Filter transitions use Framer Motion `AnimatePresence` + `layout` for smooth grid reflow
- Image hover zoom is CSS `transition-transform duration-700`

---

## Section 20: Final CTA + Apply Section

**ID:** `#apply`
**Height:** `~80vh` (`min-h-[80vh] flex items-center justify-center`)
**Background:** `bg-black` with subtle radial glow
**Purpose:** Final conversion point. This is where the "Apply" nav link scrolls to. It should feel like a destination.

### Layout

Centered, `max-w-2xl mx-auto text-center`

### Content

```
"If you're already making money"
→ text-white/50 text-xl leading-relaxed

"and want attention that produces more of it —"
→ text-white/50 text-xl leading-relaxed

[Large CTA Button]
"Request Access"
→ Same glass CTA as hero but larger: px-12 py-5 text-base rounded-2xl
→ Subtle glowPulse animation (breathing white glow, 4s loop)
→ On hover: bg-red-950/[0.04] border-red-900/10

"We review selectively. Not everyone gets a response."
→ text-white/15 text-xs tracking-wider mt-4
```

### CTA Button Click

Opens the **Apply Modal** (same global modal used everywhere).

### Ambient Effect

Radial glow behind the CTA:
```css
background: radial-gradient(
  ellipse 500px 300px at 50% 50%,
  rgba(127, 29, 29, 0.02) 0%,
  transparent 70%
);
```

---

## Section 21: Footer

**ID:** `#footer`
**Height:** minimal
**Background:** `bg-black`

```
┌─────────────────────────────────────────────────────────┐
│  ────────────────── border-t border-white/[0.03] ──── │
│                                                        │
│  LetMeScale                            © 2026          │
│  text-white/20 text-sm                text-white/10    │
│                                                        │
│                  [Login]                                │
│              text-white/15 text-xs                      │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

Minimal. No social links (exclusivity). Just the brand name, copyright, and a quiet login link.

---

## Case Study Modal

**Trigger:** Clicking any proof card, screenshot, or "View results" link.
**Type:** Fullscreen gallery overlay.

### Structure

```
┌─────────────────────────────────────────────────────────┐
│  [✕ Close]                                  1 / 7      │
│                                                        │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │
│  │                                                  │  │
│  │             FULL-SIZE IMAGE                      │  │
│  │          (object-contain, max height)            │  │
│  │                                                  │  │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
│                                                        │
│  [← Prev]          Client Name           [Next →]      │
│                  "Metric headline"                      │
│                                                        │
│  [·  ·  ●  ·  ·  ·  ·]  ← dot indicators              │
│                                                        │
│  [↗ Go to story]  ← scrolls to testimonial section     │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

### Backdrop

`bg-black/90 backdrop-blur-lg` — nearly opaque, immersive viewing experience.

### Image Display

- Images shown at maximum resolution within viewport bounds
- `object-contain` so nothing is cropped
- Glass border around image: `border border-white/[0.04] rounded-xl overflow-hidden`

### Navigation

- Left/right arrows: ghost buttons, `text-white/30 hover:text-white/60`
- Keyboard: Left/Right arrow keys, Escape to close
- Swipe: Touch swipe on mobile
- Dot indicators: active dot `bg-white`, inactive `bg-white/15`

### Image Transitions

Crossfade between images: `AnimatePresence` with opacity + slight x-offset (20px in direction of navigation)

### Cross-Link

"Go to story →" link at bottom scrolls to the corresponding testimonial section and closes the modal.

### Animations

- Enter: backdrop fades in (300ms), image scales in (0.95 → 1, 400ms)
- Exit: reverse
- Image swap: crossfade (200ms)

---

## Video Modal

**Trigger:** Clicking the VSL play button in Section 2, or any video reference.

### Structure

```
┌─────────────────────────────────────────────────────────┐
│                                             [✕ Close]  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │              VIDEO PLAYER                       │   │
│  │           (16:9, native controls)               │   │
│  │           autoplay on modal open                │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
└─────────────────────────────────────────────────────────┘
```

### Backdrop

`bg-black/95 backdrop-blur-xl` — nearly fully opaque for cinematic viewing.

### Video Player

- `<video>` element with native browser controls
- Autoplay when modal opens (with sound)
- `max-w-5xl mx-auto` — large but not fullscreen
- `rounded-2xl overflow-hidden border border-white/[0.04]`
- Lazy-loaded — video src is only set when modal opens

### Performance Note

The VSL is 775MB. For local dev, serve from `public/` with lazy loading. For production, this must be hosted externally (S3, Cloudflare R2, or similar) or significantly compressed.

### Animations

- Enter: backdrop fades in (300ms), video container scales in (0.9 → 1, 500ms)
- Exit: fade out (300ms)

---

## Mobile Considerations

### Responsive Breakpoints

- **Mobile:** < 768px — single column, stacked layouts, full-width cards
- **Tablet:** 768-1024px — two-column where appropriate
- **Desktop:** > 1024px — full multi-column layouts

### Testimonial Stories on Mobile

Scroll-driven stories remain sticky but with simplified layouts:
- No side-by-side text + image — stack vertically
- Screenshots go full-width (edge-to-edge with small padding)
- Metrics text appears above/below images
- Scroll distance reduced (200vh instead of 250-300vh)

### Navigation on Mobile

- Hamburger menu replacing horizontal links
- Apply button remains visible (fixed bottom bar or in hamburger)
- Section links work the same (smooth scroll)

### Apply Modal on Mobile

- Full viewport height
- Slides up from bottom (not center scale)
- Bottom-anchored action buttons
- Larger input fields (min 48px height)

### Touch Interactions

- Card hovers → tap to reveal (credentials, expansions)
- Case Study Modal → swipe between images
- Scroll-driven stories → same behavior, touch scroll
- All touch targets minimum 44x44px

### Performance on Mobile

- Reduce `backdrop-blur` values on mobile (performance)
- Use `will-change: transform` sparingly
- Lazy-load all images below the fold
- Testimonial screenshots use responsive `srcSet` via Next.js `<Image>`

---

## Performance

### Image Optimization

- All testimonial images served through Next.js `<Image>` with automatic optimization
- WebP format, responsive sizes (`sizes="(max-width: 768px) 100vw, 50vw"`)
- Lazy loading on everything below fold (`loading="lazy"` or Intersection Observer)
- Placeholder: blurred low-res version (`placeholder="blur"`)

### Animation Performance

1. Only animate `transform` and `opacity` — never `width`, `height`, `margin`
2. `will-change: transform` only on parallax and sticky elements
3. `useInView` with `once: true` — animations don't re-trigger
4. Maximum 3 simultaneous stagger children animating
5. `backdrop-blur` is expensive — never animate blur values
6. Scroll-driven animations use `requestAnimationFrame` via Framer Motion (not JS scroll handlers)

### Bundle

- Tree-shake Framer Motion (import only needed functions)
- Code-split sections with dynamic imports if page bundle gets large
- Fonts: Inter loaded via `next/font/google` with `display: swap`

### Lighthouse Targets

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

---

## Summary of Interactive Elements

| Element | Trigger | Action |
|---------|---------|--------|
| Nav Apply button | Click | Opens Apply Modal |
| Nav section links | Click | Smooth-scrolls to section anchor |
| Nav Login link | Click | Navigates to `/login` |
| Hero CTA | Click | Opens Apply Modal |
| VSL play button | Click | Opens Video Modal |
| Testimonial screenshots | Click | Opens Case Study Modal |
| "View all results" links | Click | Opens Case Study Modal |
| Results Gallery cards | Click | Opens Case Study Modal |
| Results Gallery "Go to story" | Click | Scrolls to testimonial section |
| Results filter tabs | Click | Filters grid with layout animation |
| Team cards | Hover/Tap | Reveals credentials |
| How We Work statements | Hover | Reveals expansion text |
| Final CTA button | Click | Opens Apply Modal |
| Subtle CTAs (after testimonials) | Click | Opens Apply Modal |
| Case Study Modal arrows | Click/Swipe/Keyboard | Navigate images |
| Case Study Modal "Go to story" | Click | Scrolls to section, closes modal |
| Case Study Modal close | Click/Escape | Closes modal |
| Video Modal close | Click/Escape | Closes modal, pauses video |
| Mobile hamburger | Click | Opens fullscreen nav overlay |
| Scroll progress bar | Passive | Shows page position |

## Summary of Animations

| Animation | Where Used | Trigger |
|-----------|-----------|---------|
| `blurReveal` | Hero headline, testimonial names, "We sell leverage", Philosophy closer | Scroll into view / Page load (hero) |
| `fadeIn` | Body text, images, closers | Scroll into view |
| `fadeInUp` | Cards, list items, sub-headlines | Scroll into view (staggered) |
| `fadeInDown` | Eyebrow badges | Scroll into view |
| `sharpCut` | Disqualifier lines | Scroll into view (x: -20 → 0) |
| `lineScale` | Horizontal rules | Scroll into view (scaleX 0 → 1) |
| `stagger` | Card grids, bullet lists, team cards | Scroll into view (100-200ms between) |
| `typewriterCascade` | Philosophy section | Scroll into view (400ms between lines) |
| `countUp` | Metrics bar, testimonial numbers | Scroll into view (spring-based) |
| `scaleIn` | Modals, images | Modal open / Scroll into view |
| `hoverLift` | Cards | Mouse hover (y: -2 to -3px) |
| `glowPulse` | Final CTA button | Continuous (4s breathing loop) |
| `parallax` | Hero headline | Continuous scroll (0.85x speed) |
| `crossfade` | Case Study Modal image transitions | Image navigation |
| `slideUp` | Apply Modal (mobile) | Modal open |
| `blur-to-sharp` | How We Work statements | Scroll progress (8px → 0px) |
| `strikethrough` | Why This Works negatives | Scroll into view |
| Glass transition | Nav bar | Scroll past first viewport |

---

## Data Files

### `lib/testimonials.ts`

```typescript
export const CASE_STUDIES = [
  {
    id: "trell",
    name: "Trell",
    subtitle: "The Trainer",
    headline: "$83K in 6 days",
    metricValue: 83212,
    metricLabel: "Revenue generated",
    sectionId: "testimonial-trell",
    tags: ["revenue"],
    images: {
      hero: "/testimonials/trell/revenue-83k.jpeg",
      before: [
        "/testimonials/trell/before-15.01.09.jpeg",
        "/testimonials/trell/before-1.jpeg",
        "/testimonials/trell/before-2.jpeg",
      ],
      after: [
        "/testimonials/trell/after-14.59.36.jpeg",
        "/testimonials/trell/after-1.jpeg",
        "/testimonials/trell/after-2.jpeg",
      ],
    },
    story: {
      before: { revenue: "$31,649.72", change: "-$8,832.24", period: "October 2025" },
      after: { revenue: "$187,321.54", change: "+$100,312.90", period: "December 2025", users: "360", earned: "$466,593" },
    },
  },
  {
    id: "daniel",
    name: "Daniel",
    subtitle: "Content Creator",
    headline: "14.2M views in 90 days",
    metricValue: 14200000,
    metricLabel: "Views in 90 days",
    sectionId: "testimonial-daniel",
    tags: ["views"],
    images: {
      hero: "/testimonials/daniel/DecemberResult.jpeg",
      gallery: [
        "/testimonials/daniel/Acc_reach_oneReel.png",
        "/testimonials/daniel/Last_90_days.PNG",
        "/testimonials/daniel/Last4months.PNG",
        "/testimonials/daniel/ReelInsight(1).PNG",
        "/testimonials/daniel/ReelInsight(2).jpeg",
        "/testimonials/daniel/Audience(USAviral1).PNG",
        "/testimonials/daniel/Audience(USAtalking1).PNG",
        "/testimonials/daniel/Audience(USAtalking2).PNG",
        "/testimonials/daniel/IMG_3813.PNG",
      ],
    },
    story: {
      views: 13702110,
      reelReach: 2300000,
      nonFollowers: "99.1%",
      likes: 234000,
      comments: 1200,
      shares: 3200,
      saves: 7600,
    },
  },
  {
    id: "mark-shapiro",
    name: "Mark Shapiro",
    subtitle: "Capital",
    headline: "$90K+ cash collected",
    metricValue: 90300,
    metricLabel: "Cash collected",
    sectionId: "testimonial-mark",
    tags: ["revenue"],
    images: {
      hero: "/testimonials/mark-shapiro/dashboard-1.jpeg",
      gallery: [
        "/testimonials/mark-shapiro/dashboard-2.jpeg",
        "/testimonials/mark-shapiro/dashboard-3.jpeg",
        "/testimonials/mark-shapiro/dashboard-4.jpeg",
        "/testimonials/mark-shapiro/dashboard-5.jpeg",
        "/testimonials/mark-shapiro/dashboard-6.jpeg",
        "/testimonials/mark-shapiro/dashboard-7.jpeg",
      ],
    },
    story: {
      bookedCalls: 213,
      showRate: "71.83%",
      closeRate: "33.90%",
      cashCollected: "$111,451",
      newDeals: 40,
      aov: "$3,987",
    },
  },
  {
    id: "chetha",
    name: "Chetha",
    subtitle: "Media",
    headline: "6.5M views generated",
    metricValue: 6500000,
    metricLabel: "Views generated",
    sectionId: "testimonial-chetha",
    tags: ["views"],
    images: {
      hero: "/testimonials/chetha/IMG_5177.PNG",
      gallery: [
        "/testimonials/chetha/IMG_4453.PNG",
        "/testimonials/chetha/IMG_9790.PNG",
        "/testimonials/chetha/IMG_9791.PNG",
        "/testimonials/chetha/IMG_9792.PNG",
        "/testimonials/chetha/IMG_3915.PNG",
        "/testimonials/chetha/IMG_3917.PNG",
        "/testimonials/chetha/IMG_3922.PNG",
        "/testimonials/chetha/IMG_3316.PNG",
        "/testimonials/chetha/IMG_4509.PNG",
        "/testimonials/chetha/IMG_4510.PNG",
        "/testimonials/chetha/IMG_5724.PNG",
      ],
    },
    story: {
      totalViews: 21492253,
      accountsReached: 7072385,
      nonFollowers: "91.2%",
      monthlyViews: 6986848,
      rewardsViews: 1800000,
      submissions: 81,
    },
  },
] as const;
```

---

*End of design document. This is the single source of truth for landing page implementation. All 21 sections, all interactive elements, all animations, all modals, all data structures are specified above.*

#letmescale #plans #archive
