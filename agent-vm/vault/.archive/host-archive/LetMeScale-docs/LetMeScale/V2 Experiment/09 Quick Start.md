> See also: [[LetMeScale]]

# Quick Start — v2

> How to start building the alternate reality version.

---

## Step 1: Read These First

1. **00-PROJECT-OVERVIEW.md** — What changed from v1 and the v2 vision
2. **01-DESIGN-SYSTEM.md** — The complete v2 visual language
3. **02-CLIENT-CASE-STUDIES.md** — The 4 featured clients and their stories

These three files give you everything you need to start building.

---

## Step 2: Set Up the Project

```bash
# New Next.js 15 project
pnpm create next-app@latest letmescale-v2 --typescript --tailwind --app

# Install dependencies
pnpm add framer-motion lucide-react

# Optional: GSAP for scroll-driven proof
pnpm add gsap
```

### Install Fonts
- **Clash Display** — Available from Fontshare (free) or licensed
- **Plus Jakarta Sans** — Available from Google Fonts

---

## Step 3: Build Order

1. `globals.css` — @theme tokens, alternating section backgrounds, selection, scrollbar
2. `layout.tsx` — Font loading (Clash Display + Plus Jakarta Sans), metadata
3. `page.tsx` — Variant state, DevNav integration, section rendering
4. `nav.tsx` — Minimal fixed nav (logo left, CTA right)
5. `hero.tsx` — Statement headline + vertical stat stack + counter animation
6. `counter.tsx` — One-shot animated counter (Framer Motion useSpring)
7. `proof.tsx` — Scroll-driven deep dive for 4 clients
8. `who-for.tsx` — Checklist qualifier
9. `system.tsx` — Case study integration (explain through Trell's journey)
10. `cta.tsx` — Bold headline + apply modal trigger
11. `apply-modal.tsx` — Screening questions + form submission
12. `footer.tsx`
13. `dev-nav.tsx` — Variant switching tool

---

## Step 4: Ship

Target: Hero + Proof + CTA = Day 1. Polish = Day 2-3. Ship and iterate.

---

## Reference Index

| Document | What It Covers |
|----------|---------------|
| 00-PROJECT-OVERVIEW.md | v2 vision, what changed, what carries forward |
| 01-DESIGN-SYSTEM.md | Colors, surfaces, typography, animation, nav, logo, hovers |
| 02-CLIENT-CASE-STUDIES.md | 4 featured clients, metrics, stories, proof assets |
| 03-SECTION-ARCHITECTURE.md | 6 sections, layouts, DevNav, component registry |
| 05-COPY-AND-MESSAGING.md | Voice, tone, headlines, conversion psychology |
| 07-TOOLS-AND-PATTERNS.md | Reusable code patterns, libraries, file structure |
| 08-IDEAS-AND-DIRECTIONS.md | Post-launch ideas and future phases |
| 09-QUICK-START.md | This file |
| **10-IMPLEMENTATION-SPEC.md** | **FULL build spec: entrance sequence, scroll behavior, hover states, lightbox, per-client animations, border radii, color tokens, every detail** |

**Start with 10-IMPLEMENTATION-SPEC.md** — it has everything you need to build, pixel by pixel.

### Files Removed from v2 Docs
- ~~04-PLATFORM-ARCHITECTURE.md~~ — v2 is landing page only. Platform docs live in v1 codebase.
- ~~06-COMPETITOR-ANALYSIS.md~~ — Running our own lane. Competitor analysis dropped.

#letmescale #v2-experiment
