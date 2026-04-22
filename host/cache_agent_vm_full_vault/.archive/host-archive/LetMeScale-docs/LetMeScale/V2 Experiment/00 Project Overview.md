> See also: [[LetMeScale]]

# LetMeScale v2 — Project Overview

> The alternate reality rebuild. Everything we learned from v1, distilled into a sharper vision.

---

## What Is LetMeScale?

**LetMeScale** is a premium content distribution and personal brand growth agency. The business sells attention-to-ROI services to high-earning creators and operators ($10K-$1M+/month).

- **Tagline:** "Attention Is Leverage. We Control Leverage."
- **Hero:** "We Build Attention That Produces Direct ROI."
- **Audience:** Creators & operators who already make money and understand leverage
- **Not for:** Beginners, view-chasers, guarantee-seekers

## The Two-Track Model

1. **Full ROI System** — Distribution + pipeline + conversion infrastructure
2. **Pure Distribution** — Clipping, volume, reach only

---

## v2 Direction — What Changed

### Aesthetic
- **v1:** Palantir x Bloomberg Terminal. Clinical, monochrome glass, surgical precision.
- **v2:** Nike x Arc Browser. Bold, expressive, high-contrast, movement-forward. Design with swagger.

### Tone
- **v1:** Emotional temperature 2/10. Cold authority. Written by a machine.
- **v2:** Emotional temperature 6-7/10. Bold and direct. Assertive coach energy — direct but human. Confident person, not a robot.

### Visual Language
- **v1:** Glass morphism, grain overlays, monospace terminal aesthetic, serif headlines.
- **v2:** Solid elevated surfaces with shadows, alternating black/white sections, bold sans-serif (Clash Display / Plus Jakarta Sans), red as a bridging element.

### Scope
- **v1:** Full platform (auth, database, portal, DM center, admin panel) — mostly scaffolded but unbuilt.
- **v2:** Landing page only. Ship fast, iterate from live data.

---

## v2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (with `@theme` block) |
| Animation | Framer Motion (primary), GSAP ScrollTrigger (optional for scroll-driven proof) |
| Icons | Lucide React |
| Fonts | Clash Display (headlines), Plus Jakarta Sans (body) |

**Dropped from v1:** Three.js, Lenis, glass morphism, grain overlay, SQLite, Drizzle, NextAuth, monospace fonts, serif fonts.

---

## What We're Carrying Forward from v1

### 1. DevNav Variant System
The floating developer panel for hot-swapping section variants at runtime. Persists via localStorage + URL params. Kept as a dev tool for iteration.

### 2. Conversion Psychology
- Scarcity framing ("3 clients this quarter")
- Qualification barrier (apply modal with screening questions)
- Anti-sell ("This isn't for everyone")
- Revenue-first proof (lead with money, not vanity metrics)

### 3. Centralized Data
All case study data in one typed TypeScript file. Change once, update everywhere.

---

## What We're Leaving Behind

- Glass morphism (replaced by solid elevated surfaces)
- Grain texture overlay
- Terminal/mirror aesthetic (no monospace, no "system readout" feel)
- Sales/Mirror dual variant pattern (one design per section)
- Serif typography (all sans-serif now)
- Clinical/cold tone (bold + direct now)
- Full platform backend (landing page only)
- Competitor analysis focus (running our own lane)
- Prescribed vocabulary lists and banned word lists
- GSAP as a required dependency (optional only)
- 12-section page length (down to 6)

---

## v2 Page Structure (6 Sections)

1. **Hero** (black bg) — Statement headline left, vertical stat stack right, CTA
2. **Proof** (white bg) — Scroll-driven deep dive, 4 clients, per-client unique layouts
3. **Who For** (black bg) — Checklist qualifier
4. **System** (white bg) — Explained through a real client case study
5. **CTA** (black bg) — Apply modal with screening questions
6. **Footer**

---

## v2 Design Principles

1. **Bold over subtle** — Clash Display headlines that punch. No whispering.
2. **Solid over transparent** — Elevated cards with shadows, not frosted glass.
3. **Contrast over uniformity** — Alternating black/white sections create rhythm.
4. **Stories over abstractions** — Show the system through real client results, not diagrams.
5. **Ship over perfect** — 6 sections. Get live. Iterate from data.

#letmescale #v2-experiment
