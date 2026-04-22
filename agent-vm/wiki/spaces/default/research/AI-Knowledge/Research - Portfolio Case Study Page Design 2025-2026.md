---
date: 2026-03-20T00:00:00.000Z
tags:
  - design
  - ux-patterns
  - portfolio
  - case-study
  - place-org
  - research
  - layout
  - animation
status: active
type: research
wiki_id: research/AI-Knowledge/Research_-_Portfolio_Case_Study_Page_Design_2025-2026
imported_from: >-
  vault/Research/AI-Knowledge/Research - Portfolio Case Study Page Design
  2025-2026.md
imported_at: '2026-04-04T00:23:56.982Z'
summary: ''
---

# Research - Portfolio Case Study Page Design 2025-2026

> Research question: What are the best layout structures and interaction patterns for a developer/agency portfolio showcasing 9 projects at place.org/portfolio? Every claim is sourced.

Related: [[Research - place.org Experimental UI Inspiration Deep Dive]] | [[Research - Web Animation Techniques 2025-2026 place.org]]

---

## Key Finding Upfront

The strongest 2025-2026 portfolios do one thing differently from 2022-era portfolios: **the card-to-case-study transition is itself the design statement**. The best sites (Joffrey Spitzer, Stefan Vitasović, Eduard Bodak) treat the moment of clicking a project card as an animation opportunity — a shared element morph, a FLIP transition, or a viewport reveal — not just a page load. This is the highest-ROI investment for place.org/portfolio.

---

## Candidates Surveyed

| Site / Resource | Type | Relevance |
|---|---|---|
| almost.studio | Design studio portfolio | Navigation minimalism, canvas interactions |
| michaelkrukar.com | Design engineer portfolio | Grid structure, logo-first card design |
| henry.codes | Developer case study site | Typographic project list, garden metaphor |
| Joffrey Spitzer portfolio (Codrops, Feb 2026) | GSAP FLIP case study | Slider↔grid toggle, FLIP transitions |
| Stefan Vitasović portfolio (Codrops, Mar 2025) | Framer Motion + WebGL case study | Typography animation, shared element transitions |
| Eduard Bodak portfolio (Codrops, Jul 2025) | GSAP scroll-driven case study | Locomotive Scroll, 3D card flip, mouse-reactive cards |
| designerup.co — 10 Product Design Portfolios | Case study format analysis | Case study page structure patterns |
| sitebuilderreport.com | Portfolio layout survey | Grid, masonry, horizontal scroll comparisons |
| onepagelove.com — Bento Grid section | Bento layout examples | Featured vs all grid patterns |
| designshack.net — Portfolio Trends 2025 | Trend analysis | Hover effects, card patterns, agency-specific techniques |
| Awwwards winners 2025/2026 | Award winners | Named: Olivier Ouendeno, Eric Huguenin, Filip Felbar, Eliot Besson |
| pafolios.com | Portfolio directory | Card taxonomy, filter patterns |
| freefrontend.com — clip-path examples | CSS techniques | Clip-path hover implementations |
| olivierlarose.com — Next.js transitions | Code tutorial | AnimatePresence patterns, 3 transition styles |

---

## Part 1 — Project List / Index Page Layouts

### Layout Pattern 1: The Typed List (henry.codes model)

**Structure:** Single-column or narrow two-column list. Each row shows project name (large), client/type (small), and a "Read case study →" link. No thumbnails.

**How it works at henry.codes:**
- Project name is shown very large, then repeated below it (creates typographic rhythm/texture)
- No images on the index — identity comes from typography alone
- Equal visual weight for all 7 projects (no "featured" hierarchy on the list itself)
- Separate "Articles" section below with category tags and reading time
- Real-time data in the footer (weather, coordinates) adds personality

**When to use:** When the project names themselves carry meaning. Works for well-known clients (Stripe, YouTube, NYT). Fails when project names are generic.

**CSS pattern:**
```css
.project-row {
  display: grid;
  grid-template-columns: 1fr auto;
  padding-block: 1.5rem;
  border-bottom: 1px solid oklch(50% 0 0 / 0.15);
}
```

---

### Layout Pattern 2: The Minimalist Logo Grid (michaelkrukar.com model)

**Structure:** Responsive grid, 4 columns desktop → 2 columns mobile. No text cards — each cell contains just a client SVG logo or project mark at a fixed height. The logo is the entire card.

**Technical details (from source analysis):**
- Column count: `lg:grid-cols-4`, fallback `grid-cols-2`
- Card height: scales with viewport — `h-10 xs:h-14 sm:h-16 md:h-20 xl:h-28`
- Content: SVG logos with `fill-current`, no captions, `aria-label` for accessibility
- Navigation: Fixed sidebar with "KRUKAR" + "Design Engineer" — stays pinned while grid scrolls
- All cards open external links (`target="_blank"`) — this is a client logos grid, not a case study index

**When to use:** When you want to lead with client brand recognition rather than project narrative. Weak for solo developer portfolios without famous clients.

---

### Layout Pattern 3: The Asymmetric GSAP Grid with Toggle (Joffrey Spitzer model)

**Source:** [Codrops case study, Feb 2026](https://tympanus.net/codrops/2026/02/18/joffrey-spitzer-portfolio-a-minimalist-astro-gsap-build-with-reveals-flip-transitions-and-subtle-motion/)

**Structure:** Two modes the user can switch between:
1. **Vertical slider** — one project at a time, scaled up, with scroll moving to next/previous
2. **Grid** — all projects visible simultaneously in a responsive grid

**The toggle transition** is the signature move: switching between these modes uses GSAP FLIP to animate each card from its slider position to its grid position (or back). The browser doesn't reload — every card morphs to its new position.

**GSAP FLIP implementation:**
```javascript
// Capture state BEFORE layout change
const state = Flip.getState(".project-card");

// Apply the class that changes layout
container.classList.toggle("grid-mode");

// Animate FROM the old state TO the new layout
Flip.from(state, {
  scale: true,           // handles both size and position change
  duration: 0.6,
  ease: "power2.inOut",
  stagger: 0.05
});
```

**Vertical slider scroll behavior:** ScrollTrigger drives scaling — the active project is at `scale(1)`, others at ~`scale(0.85)`. As you scroll, the current project shrinks while the next one grows. Non-linear scale transformation for the effect.

**Text reveal animation pattern:**
- Titles: `SplitText` into characters, each animates with `yPercent: -120, scale: 1.2 → 0, 1`, stagger 0.01s, `expo.out` ease
- Paragraphs: `SplitText` into lines, `yPercent: 105 → 0`, stagger 0.02s
- Images: `yPercent: 100 → 0` fade-up, 0.1s stagger on gallery items

**Stack:** Astro (no React), GSAP + ScrollTrigger + FLIP + SplitText, Lenis for smooth scroll, Swup for page transitions, Tailwind for responsive.

**Mobile:** Tailwind breakpoints, `SplitText autoSplit: true` so text re-splits on resize.

---

### Layout Pattern 4: The Bento Grid with Featured Hierarchy

**Sources:** [onepagelove.com/section/bento-grid-portfolio](https://onepagelove.com/section/bento-grid-portfolio) | [bentogrids.com](https://bentogrids.com) | [DEV Community: Interactive Bento Grid](https://dev.to/varshithvhegde/portfolio-interactive-bento-grid-experience-4nfc)

**Structure:** CSS Grid where cells have varying sizes. The featured project gets `grid-column: span 2` (or `span 3` in a 4-column grid). Supporting projects are single cells.

**Best practices for 9 projects:**
- 4-column grid, max 4–8 visible "compartments" at once
- 1 large featured cell (2×2 or 2×1)
- 4–6 standard cells
- Keep typography large — pair with 2–3 accent colors max
- Each cell limited to a single focus: one image, one fact, or one project

**Hover interaction on bento cells:** The standard is to reveal a short description overlay on hover — text appears over the thumbnail with `opacity: 0 → 1` and a slight `translateY`. Not an entirely different view, just metadata surfacing.

**When to use for place.org/portfolio:** Bento works well for a "featured projects" homepage section (3–5 projects) rather than an exhaustive index of all 9. Consider bento on the main portfolio landing, then a list/grid on a "view all" sub-page.

---

### Layout Pattern 5: Dual Masonry + Horizontal Gallery (Israel Arredondo model)

**Source:** sitebuilderreport.com portfolio analysis

**Structure:** Default view is a 4-column masonry grid (varying heights). A toggle reveals a horizontal carousel where images are enlarged for closer inspection.

**When to use:** When projects have strong visual assets. Weak for code-heavy or infrastructure work with no UI screenshots.

**Horizontal scroll gallery CSS pattern:**
```css
.horizontal-gallery {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  gap: 1.5rem;
}

.gallery-item {
  scroll-snap-align: start;
  flex: 0 0 80vw; /* partial reveal of next item */
}
```

**GSAP horizontal scroll (more controlled):**
```javascript
gsap.to(".gallery-track", {
  x: () => -(track.scrollWidth - window.innerWidth),
  ease: "none",
  scrollTrigger: {
    trigger: ".gallery-section",
    pin: true,
    scrub: 1,
    end: () => `+=${track.scrollWidth}`
  }
});
```

---

### Layout Pattern 6: The Filtered Grid

**Source:** [pafolios.com](https://pafolios.com) directory structure | Framer filter system analysis

**Structure:** Grid with filter tabs/buttons above. Clicking a filter hides non-matching cards. Common categories for developer/agency: Product, Branding, Development, Interaction, Data Viz.

**Animation pattern for filtering (Framer Motion):**
```tsx
<AnimatePresence mode="popLayout">
  {filteredProjects.map(project => (
    <motion.div
      key={project.id}
      layout                          // FLIP animation when positions change
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
    >
      <ProjectCard {...project} />
    </motion.div>
  ))}
</AnimatePresence>
```

`mode="popLayout"` is the key — it removes exiting items from layout flow immediately, so remaining items animate into their new positions via FLIP.

**When to use for 9 projects:** Filtering is overkill for 9 projects. Consider simple category tags displayed on cards instead, with no active filtering. Save filtering for 20+ projects.

---

## Part 2 — Project Card Design

### What Information Goes On a Card

Based on analysis across all portfolio survey sources:

**Minimum viable card:**
- Project name
- Client or context
- Primary category (one tag)
- Thumbnail image or motion preview

**Extended card (designerup.co pattern):**
- Project name
- Client/company
- Designer's role
- Visual thumbnail
- One result stat ("Increased conversion 45%")
- Optional: client testimonial excerpt (Kelsey O'Halloran pattern)

**What to omit:** Technologies used (belongs on the case study page, not the card). Year (unless recency matters). Long descriptions (3 words max on a card).

---

### Card Hover Patterns (Ranked by Frequency in 2025 Award Sites)

**1. Metadata overlay reveal** (most common)
- On hover: semi-transparent overlay slides up from bottom or fades in
- Shows: project name, role, category, "View case study →" CTA
- CSS:
```css
.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, oklch(10% 0 0 / 0.85) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.card:hover .card-overlay { opacity: 1; }
```

**2. Image scale + brightness** (near-universal)
```css
.card-image {
  transition: transform 0.4s ease, filter 0.4s ease;
}
.card:hover .card-image {
  transform: scale(1.04);
  filter: brightness(0.85);
}
```

**3. Clip-path reveal** (high-craft, medium effort)
- A color or image layer is hidden behind a `clip-path: circle(0% at 50% 50%)` and expands on hover
- Creates a "spotlight" or "ink spread" reveal effect
```css
.card-reveal {
  clip-path: circle(0% at 50% 50%);
  transition: clip-path 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover .card-reveal {
  clip-path: circle(75% at 50% 50%);
}
```
- **Scroll-driven variant** (new in 2026): `@property` + `animation-timeline: view()` can drive clip-path reveal as the card enters the viewport — no JS needed.

**4. Color shift / duotone reveal** (designshack.net pattern)
- Card starts grayscale. On hover: `filter: grayscale(0)` reveals color. Or vice versa.
- Add a semi-transparent accent color overlay that fades in on hover for duotone effect.

**5. Cursor shape change** (subtle, signals clickability)
```css
.card { cursor: none; }  /* use custom cursor */
/* OR */
.card { cursor: pointer; }
```
Custom cursor: a circle that grows to 2× size on hover over project cards — very common in Awwwards-recognized portfolios (Studio Anton pattern from sitebuilderreport analysis).

---

## Part 3 — Card → Case Study Page Transition

This is the **highest-impact pattern** for 2025-2026 portfolios. The transition from the card to the full case study should feel like the card expanding into the page, not a cut to a new URL.

### Option A: GSAP FLIP (Joffrey Spitzer approach)

The navigation menu item morphs into the page title on entry. On the project list page:
1. `Flip.getState()` captures the card element's bounding box
2. Navigation pushes to the case study page (Swup/Barba.js handles the transition)
3. On the case study page, `Flip.fit()` places the page title exactly where the nav link was
4. `Flip.from()` animates it from that position to its natural layout position

This creates the illusion that the card title "flew" from the list into the page header.

**Stack requirement:** Swup or Barba.js for page transitions (prevents full page reload), GSAP FLIP for the element-level morph.

---

### Option B: View Transitions API + `view-transition-name` (native browser)

Assign matching `view-transition-name` values to the card thumbnail and the case study hero image. Navigate between pages. The browser handles the shared-element morph automatically.

```css
/* On project list page */
.project-card[data-id="1"] img {
  view-transition-name: project-hero-1;
}

/* On case study page */
.case-study-hero[data-id="1"] {
  view-transition-name: project-hero-1;
}

/* Opt both pages in */
@view-transition {
  navigation: auto;
}
```

**Benefit:** Zero JavaScript animation code. Browser handles screenshot compositing and morph.
**Constraint:** Chrome/Edge/Safari 18.2+ only. Firefox partial support (2026). Provide CSS fallback.

---

### Option C: Motion `layoutId` (React/Next.js)

```tsx
// ProjectCard component
<motion.div layoutId={`project-${project.id}`}>
  <img src={project.thumbnail} />
</motion.div>

// CaseStudyPage component
<motion.div layoutId={`project-${project.id}`}>
  <img src={project.hero} className="w-full aspect-video object-cover" />
</motion.div>
```

Motion handles the FLIP interpolation. The card and the hero image share a `layoutId` — when the case study page mounts, Motion animates from the card's last position/size to the hero's full-width position.

**Stack requirement:** React/Next.js, Motion v12. Pages must stay in the same React tree (or use `AnimatePresence`).

---

### Option D: Stairs / Overlay Transitions (olivierlarose.com pattern)

Full-screen overlay animates across the viewport before revealing the new page. Three variants from the tutorial:

1. **Stairs:** Staggered columns wipe from bottom to top, then reverse
2. **Curve:** SVG path morphs across the screen (complex, high-craft)
3. **Inner perspective:** Page scales down with perspective, overlay covers, new page fades in

```tsx
// Stairs transition — stagger on column index
const columns = Array.from({ length: 5 });

<AnimatePresence>
  {isTransitioning && columns.map((_, i) => (
    <motion.div
      key={i}
      className="fixed top-0 h-full w-[20vw]"
      style={{ left: `${i * 20}vw` }}
      initial={{ scaleY: 0, originY: 1 }}
      animate={{ scaleY: 1 }}
      exit={{ scaleY: 0, originY: 0 }}
      transition={{ duration: 0.5, delay: i * 0.05 }}
    />
  ))}
</AnimatePresence>
```

**Source:** [Next.js page transition guide — olivierlarose.com](https://blog.olivierlarose.com/articles/nextjs-page-transition-guide)

---

## Part 4 — Case Study Page Structure

### The Canonical Structure (from 8 portfolios analyzed via designerup.co)

```
1. Hero / Cover
   - Project name (large)
   - Client + role + year
   - One hero image (full-width, 16:9 or cinematic)
   - Optional: 3 key stats ("45% conversion increase", "2M users", "3 months")

2. Context / Problem
   - 1–3 paragraphs: who is the client, what was broken, what was the business need
   - Key constraint (budget, timeline, technical debt, political)

3. Research / Discovery
   - What you found before designing
   - User quotes, data points, competitive audit
   - Personas or journey maps (visual, not text)

4. Process / Approach
   - Key decisions with rationale
   - What you tried and rejected (transparency signals seniority)
   - Wireframes, sketches, or early prototypes
   - Collaboration details (who else was involved)

5. Solution
   - Final design — multiple screenshots/mockups
   - Interaction details (video or GIF of key flows)
   - Design principles that guided decisions

6. Results / Impact
   - Quantified outcomes where possible
   - If no metrics: qualitative impact + what was shipped
   - What you'd do differently (optional, shows growth mindset)

7. Next Project →
   - Navigation to adjacent case study
   - Do NOT force user back to index — keep them in the work
```

### Variations by Portfolio Type

**Developer portfolio (not product design):** Replace "Research" section with "Technical Approach" — architecture decisions, performance trade-offs, stack choices. Replace "Personas" with "System Architecture diagram."

**Agency portfolio:** Add a "Deliverables" section listing what was shipped (brand identity, web app, motion system, etc.). Emphasize the team composition.

**Results-first variant (Gautham Mukesh pattern):** Lead with outcomes, then work backwards to problem and process. Effective for scanners who decide within 3 seconds.

---

### Case Study Typography Patterns

From Henry.codes and Joffrey Spitzer:

- **Section labels** in small caps or uppercase, subdued color — orient the reader without competing with content
- **Pullquotes** for key decisions: large, 1.5× body size, indented
- **Image captions** 80% opacity, 0.8× body size
- **Two-column layout** for process sections: images left, annotation right (or vice versa)
- Line length: 60–75 characters for body text (never full viewport width)

---

## Part 5 — Featured vs All Projects

### The Current Consensus (2025-2026)

**Quality beats quantity universally.** Across all sources surveyed:

- 3–5 featured projects on the portfolio homepage
- Full archive of all work available but deprioritized (accordion, secondary page, or "View all" link)
- For 9 projects: show 3–4 on homepage, link to a `/portfolio` page for all 9
- Hide "All Projects" list behind a filter if projects span multiple disciplines

**The "partial preview with color overlay" pattern (designshack.net):**
Homepage shows 3 projects prominently. The remaining projects are partially visible below the fold — thumbnails show but are slightly desaturated or overlaid. A "View all projects →" CTA reveals them. Creates intrigue and click through without hiding work entirely.

**Anti-pattern to avoid:** Showing all 9 projects with equal visual weight on the homepage. Dilutes the strongest work. Hiring managers and clients scan for signal, not comprehensiveness.

---

## Part 6 — Animation Patterns for Project Reveals

### Scroll-Triggered Card Entrance (pure CSS, 2026)

```css
.project-card {
  animation: card-rise linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}

@keyframes card-rise {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Cross-browser as of 2026 (Chrome, Safari 26, Firefox 2026). No JS, compositor-thread.

---

### Staggered Entrance with `sibling-index()` (Chrome 137+)

```css
.project-grid .project-card {
  animation-delay: calc(60ms * sibling-index());
  animation: card-rise linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}
```

No JS stagger logic needed. Each card gets an automatic delay based on its DOM position.

---

### GSAP Stagger for Controlled Timing (cross-browser)

```javascript
gsap.from(".project-card", {
  opacity: 0,
  y: 32,
  duration: 0.6,
  stagger: { amount: 0.4, from: "start" },
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".project-grid",
    start: "top 80%",
    once: true       // fires once, not on every scroll direction change
  }
});
```

---

### Clip-Path Scroll Reveal

From [utilitybend.com](https://utilitybend.com/blog/animating-clip-paths-on-scroll-with-at-property-in-css/) — animating clip-path on scroll using `@property`:

```css
@property --clip-progress {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 0%;
}

.project-card {
  clip-path: inset(0 var(--clip-progress) 0 0);
  animation: clip-reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 50%;
}

@keyframes clip-reveal {
  from { --clip-progress: 100%; }
  to   { --clip-progress: 0%; }
}
```

This reveals the card from left to right as it enters the viewport — pure CSS, no JS.

---

## Part 7 — Mobile Adaptation Patterns

### What Works

**From Joffrey Spitzer (Codrops 2026):**
- Tailwind breakpoints for grid collapse (4 col → 2 col → 1 col)
- `SplitText autoSplit: true` rebuilds text animations on resize — no stale positions
- Vertical slider on mobile (replaces the slider/grid toggle — only one mode on small screens)
- Touch-friendly: minimum 44×44px tap targets

**From Stefan Vitasović (Codrops 2025):**
- WebGL video grid → native HTML5 `<video>` on mobile
- Keeps the interaction principles (hover → tap) but drops the GPU-heavy layer
- Framer Motion handles the same transitions on both platforms

**From michaelkrukar.com:**
- Logo grid: `lg:grid-cols-4` → `grid-cols-2` (simplest, cleanest collapse)
- Fixed sidebar: likely becomes a sticky header on mobile

### What to Avoid

- Horizontal scroll on mobile without clear affordance (visual bleed showing next item)
- WebGL/Canvas effects with no fallback (causes poor performance on older phones)
- Hover-only interactions with no touch equivalent
- Case study images at full viewport width with no max-width cap (too large to read on tablets)

---

## Ranked Recommendations for place.org/portfolio

Ranked by **impact-to-effort ratio** (9 projects, developer/agency context):

### Tier 1 — High Impact, Medium Effort

**1. Shared element card→case study transition (View Transitions API)**
- Assign `view-transition-name` to card thumbnail and case study hero
- Browser handles the morph — zero animation code
- Fallback: simple opacity fade for Firefox
- Impact: makes the portfolio feel like a native app, not a website

**2. Scroll-triggered card entrance with clip-path reveal**
- Pure CSS using `animation-timeline: view()` + `@property` clip-path
- Cross-browser as of 2026
- Impact: every card enters with purpose; feels polished without performance cost

**3. Featured 3 + View All 9 structure**
- 3 hero projects on `/portfolio` landing (bento or large grid)
- All 9 accessible via `/portfolio/all` or an accordion
- Impact: immediately signals your best work; respects visitor attention

### Tier 2 — High Impact, Higher Effort

**4. GSAP FLIP slider↔grid toggle**
- Two viewing modes for the project list — vertical focused view vs. all-at-once grid
- Borrowed directly from Joffrey Spitzer pattern
- Stack: GSAP FLIP + SplitText (now free since Webflow acquisition)
- Impact: memorable differentiator; shows technical range within the portfolio itself

**5. Case study page: Results-first structure**
- Lead with the outcome stat, then problem, process, solution
- Impact: clients and hiring managers who spend 10 seconds will see the result first

### Tier 3 — Medium Impact, Low Effort

**6. Metadata overlay on card hover**
- Semi-transparent gradient overlay fades in on hover, shows project name, role, category
- 15 lines of CSS
- Impact: professional baseline expected in 2025; noticeable by absence, not presence

**7. "Next project →" navigation on case study pages**
- Linear next/previous between all 9 projects
- Keeps visitors in the work rather than returning to index
- Impact: increases depth of engagement per visit

**8. Project category tags on cards (no active filtering)**
- Display-only tags for 9 projects (filtering is overkill below ~20 projects)
- Helps visual scanners categorize work at a glance

### Skip / Deprioritize

- **3D WebGL project showcase** — overhead not justified unless 3D is part of the work being showcased
- **Active isotope-style filtering** — 9 projects don't need it; adds JS weight for minimal utility
- **Horizontal scroll gallery on index** — works for photography, not for mixed project types
- **Video backgrounds** — high bandwidth cost for portfolio context where load speed matters

---

## Sources

- [Joffrey Spitzer Portfolio — Codrops (Feb 2026)](https://tympanus.net/codrops/2026/02/18/joffrey-spitzer-portfolio-a-minimalist-astro-gsap-build-with-reveals-flip-transitions-and-subtle-motion/)
- [Stefan Vitasović Portfolio — Codrops (Mar 2025)](https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/)
- [Eduard Bodak Portfolio — Codrops (Jul 2025)](https://tympanus.net/codrops/2025/07/29/built-to-move-a-closer-look-at-the-animations-behind-eduard-bodaks-portfolio/)
- [Two Portfolios, One Process — Codrops (Dec 2025)](https://tympanus.net/codrops/2025/12/02/two-portfolios-one-process-where-design-motion-and-code-come-together/)
- [Next.js Page Transition Guide — Olivier Larose](https://blog.olivierlarose.com/articles/nextjs-page-transition-guide)
- [10 Exceptional Product Design Portfolios — DesignerUp](https://designerup.co/blog/10-exceptional-product-design-portfolios-with-case-study-breakdowns/)
- [Portfolio Design Trends 2025 — Design Shack](https://designshack.net/articles/trends/portfolio-design/)
- [Portfolio Website Examples — SiteBuilderReport](https://www.sitebuilderreport.com/inspiration/portfolio-websites)
- [Bento Grid Portfolio — OnePage Love](https://onepagelove.com/section/bento-grid-portfolio)
- [Pafolios — Best Design Portfolios](https://pafolios.com/)
- [Animating clip-path on scroll with @property — UtilityBend](https://utilitybend.com/blog/animating-clip-paths-on-scroll-with-at-property-in-css/)
- [CSS clip-path hover effects — FreeForFrontEnd](https://freefrontend.com/css-clip-path-examples/)
- [Awwwards Portfolio Winners](https://www.awwwards.com/websites/winner_category_portfolio/)
- [Bento Grid Design — Muzli](https://muz.li/blog/bento-ui-grids/)
- [Guide to Portfolio Case Studies — InfluenceFlow](https://influenceflow.io/resources/guide-to-portfolio-case-studies-showcase-your-work-land-more-opportunities-in-2026/)
- [What makes a portfolio stand out 2025 — WebWave](https://webwave.me/blog/what-makes-a-portfolio-stand-out)
- [Interactive UI with GSAP & Framer Motion — Medium](https://medium.com/@toukir.ahamed.pigeon/interactive-ui-animations-with-gsap-framer-motion-f2765ae8a051)

#design #ux-patterns #portfolio #case-study #place-org #research #layout #animation
