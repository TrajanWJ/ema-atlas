> See also: [[LetMeScale]]

# LetMeScale v2 Landing Page — Implementation Plan

**Date:** 2026-02-27
**Design:** See `Alternate-reality/documentation/10-IMPLEMENTATION-SPEC.md`
**Location:** `Alternate-reality/` (standalone Next.js 15 app)

---

## Task 1: Project Foundation

Set up the Next.js 15 app inside `Alternate-reality/`:

- `package.json` — next@15, react@19, framer-motion@11, gsap@3, lucide-react, tailwindcss@4, @tailwindcss/postcss
- `tsconfig.json` — strict, path aliases (@/ → .)
- `next.config.ts` — minimal config
- `postcss.config.mjs` — @tailwindcss/postcss
- `app/globals.css` — ALL @theme tokens from spec (color-void, surface-1/2/3, white-surface, white-border, red variants, font-display, font-body), :root CSS custom properties (text-on-dark-primary/secondary/muted, text-on-light-primary/secondary/muted, border-dark/dark-hover/light), dot grid utility class, red bridge CSS, selection, scrollbar, body base, reduced motion, focus styles. NO glass classes. NO grain overlay.
- `app/layout.tsx` — Load Clash Display (from local files or Google Fonts variable) + Plus Jakarta Sans (Google Fonts). Set metadata. Wrap children in ApplyModalProvider.
- `app/(site)/layout.tsx` — Site layout shell
- Copy `public/testimonials/` from v1 (symlink or copy the image assets)

**Acceptance:** `pnpm dev` runs, page renders black background with correct fonts loaded.

---

## Task 2: Shared Components + Data Layer

Build all reusable components and port testimonials data:

- `lib/animations.ts` — EASE curve, fadeInUp, fadeInDown, staggerContainer, staggerItem, scaleIn, scrollReveal presets (Framer Motion only)
- `lib/testimonials.ts` — Port from v1, keep only 4 featured clients (Trell, Farid, Mark, Josh Snow) + HERO_METRICS + TRELL_TIMELINE + MARK_MONTHS + FARID_TOP_VIDEOS + JOSH_MILESTONES. Remove Daniel/Chetha from featured. Update HERO_METRICS to remove tick behavior.
- `lib/variants.ts` — Port variant persistence logic from v1
- `components/logo.tsx` — "LetMeScale" + oversized red period (1.5-2x size), accepts className prop
- `components/cta-button.tsx` — Outlined red border+text, fills solid #991B1B on hover, 300ms transition, rounded-lg. Accepts onClick, children, size variant (sm for nav, default for sections).
- `components/counter.tsx` — Framer Motion useSpring, counts from 0 to target in ~1.5s, tabular-nums, accepts value/prefix/suffix/label/decimals props. No live ticking.
- `components/nav.tsx` — Fixed top, transparent bg on hero → bg-black/80 backdrop-blur-sm after scroll (IntersectionObserver on hero). Logo left, CTA button right (sm variant).
- `components/section.tsx` — Wrapper accepting bg="black"|"white", handles text color inversion, dot grid on black sections, appropriate padding per section.
- `components/red-bridge.tsx` — 2-3px solid red line + ::before/::after gradient glow (40-60px). Scroll-animated draw (Framer Motion useInView + scaleX).

**Acceptance:** All components render correctly in isolation. Nav scrolls properly. Counter animates.

---

## Task 3: Hero Section

`components/sections/hero.tsx`

- Split layout: headline left (60% width), vertical stat stack right
- Headline: "WE BUILD ATTENTION THAT PRODUCES DIRECT ROI." in Clash Display Bold, 4xl-6xl, tight leading
- Right side: 3 Counter components stacked vertically (2.1B+ views, $3.4M+ rev, 2,400+ appts), each with number + label below
- Below headline: CTAButton "REQUEST ACCESS" triggers apply modal
- Orchestrated entrance (1.2s): staggerChildren container — bg (0ms), headline lines (200ms stagger), counters (400ms), CTA (800ms), nav fades in via separate logic (1000ms)
- Background: black with dot grid
- Generous spacing: py-32 to min-h-screen, centered vertically
- Mobile: stack vertically (headline on top, stats below, CTA at bottom)

**Acceptance:** Hero renders with full entrance animation, counters count up, CTA opens apply modal.

---

## Task 4: Proof Section — Pinned Scroll Storytelling

`components/sections/proof/` directory:

- `proof.tsx` — Main proof section container (white bg). Uses GSAP ScrollTrigger to pin the section. Total scroll distance = ~8vh (2vh per client x 4 clients). Each client has a scroll timeline driven by GSAP.
- `proof-trell.tsx` — Before/after split layout. Before stats appear normally, dramatic pause, after stats explode upward (rapid counter animation). Full-width proof images.
- `proof-farid.tsx` — Media grid layout. Viral video thumbnails slide in progressively building a mosaic. Revenue number ($700K+) drops in over the wall.
- `proof-mark.tsx` — Single large counter with timeline. Increments at steady metronome pace: $100K... $200K... $400K... $748K. Monthly revenue table below.
- `proof-josh.tsx` — Centered minimal. Just the number ($1B+) and credibility statement. Maximum whitespace. Clear "career total" attribution.
- Shared: styled proof images (border-radius, shadow, gradient mask edge), card hover states (lift + shadow + red top-line), supporting narrative text per client
- After scrolling past each client, content minimizes/collapses
- Mobile: No pinning. Standard vertical flow with fadeInUp reveals. Same narrative structure.

**Acceptance:** Desktop: section pins, scroll drives 4 client stories with unique layouts/animations. Mobile: flows naturally without pinning.

---

## Task 5: Lightbox Component

`components/lightbox.tsx`

- Framer Motion layoutId-based scale-from-position animation
- Dark overlay (bg-black/80) fades in behind
- Image animates from exact source position/size to viewport-centered larger size (400ms, EASE)
- Click image or press Escape → reverse animation
- Image gets rounded-xl treatment
- Works on both desktop and mobile (tap to expand, tap to dismiss)
- Exported as context provider (LightboxProvider + useLightbox hook) for use in proof section

**Acceptance:** Click any proof image → smoothly expands to fullscreen. Click/Escape → returns to position.

---

## Task 6: Who For Section

`components/sections/who-for.tsx`

- Black bg with dot grid
- Headline: "IS THIS FOR YOU?" in Clash Display Bold
- 4-5 criteria with checkmark icons:
  - ✓ You make $10K+/month
  - ✓ You have an existing audience or product
  - ✓ You want systems, not services
  - ✓ You're ready to invest in distribution
  - ✗ Not for beginners or guarantee-seekers (muted/different treatment)
- SVG checkmark icons draw themselves (path animation) one by one as section enters view (staggered, ~200ms between each)
- The ✗ item uses different color/treatment (text-white/30, X icon instead of check)
- Cards: solid dark surface with light borders
- Generous spacing: py-24 to py-32

**Acceptance:** Section scrolls into view, checkmarks draw themselves sequentially, ✗ item is visually distinct.

---

## Task 7: System Section

`components/sections/system.tsx`

- White bg
- Headline: "HERE'S EXACTLY WHAT WE DID." in Clash Display Bold (black text)
- Walk through Trell's journey in 3 steps with elevated cards:
  - Step 1: "Where Trell was" — $31K/mo declining, context
  - Step 2: "What we deployed" — Distribution across 4 platforms, DM sequences, appointment booking
  - Step 3: "What happened" — $83K in 6 days, $187K the full month, 62 deals in January
- Timeline or numbered step progression layout
- Cards: solid white with shadow-lg, rounded-xl
- Scroll-revealed with moderate stagger
- Tight-to-moderate spacing

**Acceptance:** Section renders with 3-step case study walkthrough, cards animate in on scroll.

---

## Task 8: CTA Section + Apply Modal

`components/sections/cta.tsx` + update `components/apply-modal.tsx`

**CTA Section:**
- Black bg with dot grid
- Bold headline: "READY?" in massive Clash Display
- Subline: "3 clients this quarter." in Plus Jakarta Sans, text-white/60
- CTAButton "REQUEST ACCESS" centered
- Minimal animation (simple fade in)
- Generous spacing: py-32 to py-48

**Apply Modal (restyle from v1):**
- Port v1 logic (2 screening questions, qualification check)
- Restyle: solid #111111 card (no glass classes), rounded-2xl, Clash Display headings, Plus Jakarta Sans body
- Remove font-mono references, remove glass-1 classes
- Scale from center entrance (Framer Motion)
- Answer buttons: solid surface, red border when selected

**Acceptance:** CTA section renders, button opens restyled apply modal, qualification flow works.

---

## Task 9: Footer

`components/sections/footer.tsx`

- Black bg (continuation of CTA section, no bridge needed between CTA and footer)
- Statement line: "Attention is leverage." in Clash Display, text-white/60
- Logo: LetMeScale. with oversized red period
- Social icons: Instagram, Twitter/X, TikTok (Lucide icons, white/30, hover to white/60)
- Copyright: "© 2026 LetMeScale. All rights reserved." in Plus Jakarta Sans, text-white/20
- Centered layout, generous top padding, moderate bottom padding
- No animation

**Acceptance:** Footer renders with statement, logo, socials, copyright.

---

## Task 10: Page Assembly + DevNav

`app/(site)/page.tsx` + `components/dev-nav.tsx`

**Page Assembly:**
- Component registry pattern (COMPONENTS record + SECTION_ORDER)
- 6 sections: hero, proof, who-for, system, cta, footer
- RedBridge component between each alternating pair (hero→proof, proof→who-for, who-for→system, system→cta)
- No bridge between CTA and footer (both black)
- Variant state management (useState + loadVariants/saveVariants)
- Hydration flash prevention (mounted state)

**DevNav (port + simplify from v1):**
- Floating bottom-left panel
- Section variant dropdowns per section
- Persist to localStorage + URL params
- Remove v1 style controls (grain toggle, background pattern)
- Remove embedded prompt cards (not needed for v2)
- Keep page links (Home, Results)

**Acceptance:** Full page renders with all 6 sections, red bridges between alternating sections, DevNav switches variants, URL params work.

#letmescale #plans
