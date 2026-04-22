> See also: [[LetMeScale]]

# Section Specifications

## Page Architecture

9 sections rendered in order, each with ONE definitive component. DevNav shows section name + on/off toggle.

## Section Order

1. Hero — `hero/hero.tsx`
2. Disqualifier — `disqualify/disqualifier.tsx`
3. What We Do — `system/what-we-do.tsx`
4. Why This Works — `why-works/why-this-works.tsx`
5. Results — `proof/results.tsx` (wraps `testimonials-cascade-v2`)
6. How We Engage — `engage/how-we-engage.tsx`
7. Who This Is For — `who-for/who-is-for.tsx`
8. Philosophy — `philosophy/philosophy.tsx`
9. Final CTA — `cta/final-cta.tsx`

All file paths are relative to `apps/landing/components/sections/`.

---

## 1. Hero

**File:** `hero/hero.tsx`

**Layout:**
- Full viewport height, parallax background (grid pattern + red radial glow)
- Centered content stack

**Content:**
- **Badge:** "Attention Is Leverage. We Control Leverage."
- **Headline:** "We Turn Attention Into Control." — word-by-word stagger animation (Framer Motion)
- **Stats strip:** 4 animated counters with LIVE badges, scroll-triggered count-up
- **CTA:** "Request Access" — primary glass button

**Animations:**
- Word-by-word headline stagger via Framer Motion
- Parallax depth on background elements
- Animated stat counters on scroll into view

---

## 2. Disqualifier

**File:** `disqualify/disqualifier.tsx`

**Layout:**
- Centered, narrow (`max-w-3xl`), raw text — no glass card
- Bluntness is the design

**Content:**
- 3 negation lines with `blurReveal` stagger animation
- Qualification list with red dot bullets
- Direct, confrontational tone — filters out non-fit visitors early

**Design Note:** No decorative elements. The lack of polish is intentional — this section earns trust through directness, not aesthetics.

---

## 3. What We Do

**File:** `system/what-we-do.tsx`

**Layout:**
- 3 full-width editorial blocks, numbered 01 / 02 / 03
- 96-128px vertical spacing between blocks

**Content per Block:**
- Large faded pillar number (decorative, low opacity)
- Headline
- Paragraph description
- Red dot bullet list with supporting points

**Structure:** Editorial layout, not card grid. Each block spans the full width and breathes with generous whitespace.

---

## 4. Why This Works

**File:** `why-works/why-this-works.tsx`

**Layout:**
- Centered editorial with comparison structure
- Two columns side by side

**Content:**
- **Left column:** Struck-through / dimmed items — things we do NOT optimize for (output, effort, aesthetics)
- **Right column:** Bright, full-opacity items — what we actually optimize for (leverage, control, systems)
- **Closer:** "Most agencies sell output. We sell control."

**Design:** The contrast between dimmed and bright text creates an immediate visual argument without requiring the visitor to read closely.

---

## 5. Results

**File:** `proof/results.tsx`

**Layout:**
- Two-part structure: intro text block + cascade component

**Content:**
- **Intro:** Blunt proof text — "Our systems have been used to..." followed by specific proof lines
- **Cascade:** Full `testimonials-cascade-v2` component with client stories

**Cascade v2 features:**
- Client screenshots with lightbox zoom
- Before/after curtain sliders
- Infinite video marquee
- Per-client bespoke entrance and hover animations
- Stat pulse glow micro-interactions

---

## 6. How We Engage

**File:** `engage/how-we-engage.tsx`

**Layout:**
- Guarded layout with glass card statements
- Centered, restrained

**Content:**
- Three engagement points (NOT numbered steps — these are principles, not a process)
- Each point in a glass card with `blurReveal` animation
- **Closer:** "Details are discussed privately."

**Design Note:** Deliberately vague on specifics. The exclusivity is the message.

---

## 7. Who This Is For

**File:** `who-for/who-is-for.tsx`

**Layout:**
- Two-column comparison layout

**Content:**
- **Left — "For" column:** Brighter text, red dot bullets — describes the ideal client
- **Right — "Not For" column:** Dimmed text, dash bullets — describes who should not apply
- **Closer:** "If you're counting followers, this isn't your room."

**Design:** The "For" column uses higher opacity (white/60-80) and red accent bullets. The "Not For" column uses lower opacity (white/30) and plain dashes. Visual hierarchy makes the intended audience obvious at a glance.

---

## 8. Philosophy

**File:** `philosophy/philosophy.tsx`

**Layout:**
- Full-width centered, large typography
- Typewriter cascade animation — each line reveals sequentially

**Content:**
```
"Money follows leverage."
"Leverage follows attention."
"Attention follows distribution."

"Most people never control distribution. They rent it."

"We don't rent."
```

**Animations:** Sequential line reveal with typewriter timing. The final line ("We don't rent.") lands at full opacity and bold weight — everything else stays dimmer. This is the emotional anchor of the page.

---

## 9. Final CTA

**File:** `cta/final-cta.tsx`

**Layout:**
- Centered, generous whitespace
- Red orb glow background effect

**Content:**
- **Headline:** "You don't need convincing. You need alignment."
- **CTA:** "Request Access" — primary glass button with pulsing glow animation
- **Micro-copy:** "We review selectively." — dimmed, below button

**Design:** Mirrors the hero in visual weight but with a warmer, more resolved tone. The pulsing glow on the CTA is the only animated element — everything else is still.

#letmescale #design-system
