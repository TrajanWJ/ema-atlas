---
title: "LetMeScale"
type: reference
created: 2026-02-20
updated: 2026-04-06
tags: [project, agency, website, nextjs, framer-motion, vercel]
summary: "Premium content distribution and personal brand growth agency website"
---
# LetMeScale

> Premium content distribution and personal brand growth agency. The site IS the pitch.

---

## Quick Info

| Key | Value |
|---|---|
| **Location** | `/home/trajan/Desktop/Coding/Projects/letmescale` |
| **Stack** | Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion, Lenis |
| **Deployment** | Vercel |
| **Repo** | Monorepo: `apps/landing` (v1), `Alternate-reality` (v2 experiment), `packages/ui` |
| **Status** | In Progress — Cinematic Redesign Phase |
| **Port** | Landing: 3004, V2: 4001 |

---

## What Is LetMeScale?

LetMeScale sells attention-to-ROI services to high-earning creators and operators ($10K-$1M+/month).

- **Tagline:** "Attention Is Leverage. We Control Leverage."
- **Hero:** "We Build Attention That Produces Direct ROI."
- **Not for:** Beginners, view-chasers, guarantee-seekers

### Two-Track Model
1. **Full ROI System** — Distribution + pipeline + conversion infrastructure
2. **Pure Distribution** — Clipping, volume, reach only

---

## Product Vision (The Bible)

**The site IS the pitch.** Clients visit, see big names in the carousel, big numbers in stats, testimonials, and the quality of the site itself demonstrates the brand's capability.

- **Three core elements:** Hero (cinematic, stats, carousel) → Testimonials → Apply modal (CTA)
- **Seamless scroll cinematic.** No section breaks, no padding walls. One continuous dark canvas.
- **CTA = Apply modal.** Not a separate section. "Request Access" triggers the booking pipeline modal.
- **Image-forward, animation-heavy, minimal whitespace.** High-end agency portfolio, not SaaS landing.

Full document: [[LetMeScale Bible]]

---

## Architecture

### Design System
- **Aesthetic:** Ultra-modern dark glass — Bloomberg Terminal meets luxury brand
- **Palette:** Deep blacks, crisp whites, frosted glass, dark red (#991B1B) as surgical accent
- **Fonts:** General Sans (display), Outfit (body), Geist Sans (data)
- **Glass:** `glass-1`, `glass-2`, `glass-3` utility classes
- **Backgrounds:** Global CSS variable system via `.section-bg` class + `data-bg` themes

Full docs: [[00 Design System Overview]] → [[07 Variant Architecture]]

### Key Design Principles
1. **Options over variants** — Configurable options in DevNav, not new variant files
2. **Global backgrounds** — All sections use `.section-bg`, never hardcode per-section
3. **Design tokens** — CSS custom properties (`--text-primary`, `--border`, etc.)

### Page Structure
Hero → Testimonials → Footer. Minimal sections, maximum impact.

---

## Current Phase: Cinematic Redesign

"Let Me Scale." rises cinematically on pure black + ambient glow. Stats slide in from right. Client carousel integrated INTO hero.

- Plan: [[2026-03-03 Cinematic Redesign Plan]]
- Design: [[2026-03-03 Cinematic Redesign Design]]
- Prior: [[2026-03-02 Hero Rework]]

---

## V2 Experiment (Alternate Reality)

A parallel exploration with a different aesthetic direction:
- **v1:** Palantir x Bloomberg Terminal — clinical, monochrome glass
- **v2:** Nike x Arc Browser — bold, expressive, high-contrast

Full docs: [[00 Project Overview]] (V2)

---

## Client Case Studies

Six documented clients with full proof assets:
1. **Trell** — The Resurrection Arc
2. **Daniel** — The Viral Scatter
3. **Mark Shapiro** — The Compound Machine
4. **Chetha** — The Network Map
5. **Farid** — The Volume Wall
6. **Josh Snow** — The Ascent Staircase

Individual analyses in [[Master Testimonials Research]] and per-client notes under Resources/Testimonials/

---

## Dev Tooling

- **DevNav:** Floating developer panel for hot-swapping section variants at runtime (localhost only)
- **Forge Orchestrator:** AI agent dispatch system (`.claude/` directory)
- **Playwright MCP:** Visual testing loop for autonomous UI verification
- **Section Options:** `SECTION_OPTION_DEFS` in page.tsx + `useSectionOptions()` context

---

## Related Notes

### Design System
- [[00 Design System Overview]]
- [[01 Color System]]
- [[02 Glass Morphism]]
- [[03 Typography]]
- [[04 Components]]
- [[05 Section Specs]]
- [[06 Animations]]
- [[07 Variant Architecture]]

### Plans (Active)
- [[2026-03-03 Cinematic Redesign Plan]]
- [[2026-03-03 Cinematic Redesign Design]]
- [[2026-03-02 Hero Rework]]
- [[2026-02-27 Visual Polish Plan]]
- [[2026-02-27 Visual Polish Design]]
- [[2026-02-27 V2 Landing Page Plan]]

### Plans (Archive)
- [[2026-02-20 Landing Page Design]]
- [[2026-02-20 LetMeScale Implementation Plan]]
- [[2026-02-20 LetMeScale Platform Design]]
- [[2026-02-21 Sections Brainstorming]]
- [[2026-02-21 Testimonials Cascade Design]]
- [[2026-02-21 Testimonials Cascade Plan]]
- [[2026-02-25 Brand Amplification Design]]
- [[2026-02-25 Brand Amplification Plan]]
- [[2026-02-25 Landing Page Rebuild Design]]
- [[2026-02-25 Landing Page Rebuild]]
- [[2026-02-25 Testimonials DE Design]]
- [[2026-02-25 Testimonials DE Plan]]
- [[2026-02-25 Testimonials Stack Design]]
- [[2026-02-25 Testimonials Stack Plan]]
- [[2026-02-26 Testimonials V2 Proof Design]]
- [[2026-02-26 Testimonials V2 Proof Plan]]

### Resources
- [[LetMeScale Bible]]
- [[LetMeScale Business Overview]]
- [[Master Testimonials Research]]
- [[Trell Analysis]]
- [[Daniel Analysis]]
- [[Mark Shapiro Analysis]]
- [[Chetha Analysis]]
- [[Farid Analysis]]
- [[Josh Snow Analysis]]
- [[Clipping Accounts Analysis]]

### Reference Sites
- [[Clipping Stars Analysis]]
- [[Puppets Master Analysis]]
- [[Theroi Media Analysis]]

### V2 Experiment
- [[00 Project Overview]]
- [[01 Design System]]
- [[02 Client Case Studies]]
- [[03 Section Architecture]]
- [[05 Copy and Messaging]]
- [[07 Tools and Patterns]]
- [[08 Ideas and Directions]]
- [[09 Quick Start]]
- [[10 Implementation Spec]]
- [[V2 Business Overview]]

### Deployment
- [[Vercel Deploy]]

### Copy
- [[What We Do - Original A]]

#letmescale #projects #active
