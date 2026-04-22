# Proslync live-site brand audit

Date: 2026-04-14
Audited live URL: `https://proslync.vercel.app`
Repo anchor: `~/proslync-app`
Screenshot artifact: `docs/audits/live-site/proslync-live-home-2026-04-14.png`

## Executive take

The current live site is not a public marketing landing page. It resolves to the Expo web **Dev Login** surface and functions as a role-switching demo shell.

That is not inherently bad for internal demos. In fact, it preserves a very useful operator path for local and stakeholder walkthroughs. But from a brand and product-signaling standpoint, it means the live deployment currently communicates **"development preview / internal showcase"** more strongly than **"production-ready NIL marketplace platform."**

The strongest current brand assets are:
- the black + metallic gray + orange palette
- the repeated Proslync mark / monogram
- the premium, dark, glassy shell language
- the multi-portal role framing (athlete / brand / agent / fan / admin)

The main weakness is that the live experience undersells the clearer product story already present in the newer `web/` Next app.

## Surfaces reviewed

### Live deployment
- `/`
- `/dev-login`
- `/athlete`
- `/brand`
- `/agent`
- `/fan`
- `/admin`
- `/aiengine`

Observed result: all tested live routes currently resolve to the same **Dev Login** experience / shell rather than distinct public-facing pages.

### Host repo surfaces reviewed

#### Expo / React Native app
- `src/theme/colors.ts`
- `src/components/BrandMark.tsx`
- `src/components/PortalHero.tsx`
- `src/screens/onboarding/DevLoginScreen.tsx`

#### Next web app
- `web/app/page.tsx`
- `web/app/dev-login/page.tsx`
- `web/app/globals.css`
- `web/components/brand/ProslyncLogo.tsx`
- `web/components/shell/PageHero.tsx`
- `web/components/shell/AppShell.tsx`

## What the live site currently communicates

## 1) Logo usage

### Strong points
- The live Dev Login page uses the Proslync logo mark aggressively and memorably.
- The logo appears as a central hero image plus multiple low-opacity echoes around it, creating a branded wallpaper / halo effect.
- The monogram-led brand mark also exists in code as a reusable component (`BrandMark` in Expo, `ProslyncLogo` in Next).
- The mark is visually consistent with the palette: orange glow, white letterform, dark background.

### Risks
- On the live page, the repeated mark motif is visually distinctive, but it can drift toward decorative overload if used everywhere.
- The current live deployment uses the logo mark more clearly than it uses the **wordmark + product promise**.
- The Next web logo treatment is cleaner and more scalable than the current Expo web home shell.

## 2) Color language

The brand palette is one of the clearest strengths in the current system.

### Canonical colors found in code
- True black / near-black backgrounds: `#000000`, `#08090B`, `#0F1012`, `#15171A`, `#1E2125`
- Primary orange: `#FF6F3C`
- Bright orange: `#FF8F66`
- Deep orange: `#CC4F1E`
- Metallic graphite / gray: `#A9A9A9`, `#D4D4D4`, `#6F6F6F`

### Brand read
This palette reads as:
- premium
- slightly industrial / performance-oriented
- credible for sports, operations, and deal-flow
- more mature than the earlier blue/cyan startup aesthetic

### One inconsistency to resolve
The Expo app is now aligned to the orange + graphite palette, but the newer Next marketing shell still contains multiple **blue** hero and CTA treatments (`bg-blue-600`, `text-blue-300`, etc.).

That means the repo currently contains **two competing accent systems**:
- live Expo/web shell -> orange/graphite premium system
- newer Next landing shell -> blue-led SaaS system with orange only partially present

This is the single biggest branding mismatch in the repo.

## 3) Shell patterns / UI language

### Live shell pattern
The deployed shell uses:
- black background
- low-contrast frosted / glass cards
- soft borders
- rounded corners
- subtle glow
- stacked role cards
- dense but clean mobile-first spacing

This reads well for:
- operator demo mode
- app preview mode
- portal switching
- founder / stakeholder walkthroughs

### Strong product-shell motifs in code
- `GlassCard` / glass surfaces
- `PortalHero`
- branded accent pills / eyebrow labels
- stats blocks
- role cards
- dashboard portal segmentation

### Design read
The interface language feels like a blend of:
- premium sports-tech
- fintech trust cues
- AI-assisted operations UI

That is a good direction for an NIL platform. It makes Proslync feel more like a controlled transaction environment than a noisy creator marketplace.

## 4) Copy tone

### Live copy tone
Live Dev Login copy is short, direct, and utilitarian:
- "Your Showcase. Your Terms."
- "Dev Login"
- "Pick a portal and jump directly into the built demo environment."
- role blurbs like discovery / campaigns / roster / compliance / support

### What works
- concise
- product-literate
- no fluff
- easy for internal demos

### What is missing on live
- stronger external statement of category
- stronger explanation of why Proslync matters
- stronger trust / compliance / end-to-end deal narrative above the fold

The newer Next landing page copy is better on this front:
- "The AI-powered NIL & athlete brand platform"
- "Verified identity, smart deal matching, and embedded compliance"
- "Not another marketplace. An operating system for athlete-brand deals."

That copy is materially closer to a real external brand narrative.

## 5) Product structure currently visible

### Live structure
The deployed experience emphasizes **roles first**:
- athlete
- brand
- agent
- fan
- admin

That is good because it proves the product is multi-sided.

But the live home does **not** clearly foreground the full deal lifecycle, such as:
- discovery
- matching
- briefing
- contracting
- escrow
- payout
- compliance
- messaging

Those value chains are more explicit in the `web/app/page.tsx` copy and should become more visible in any public-facing surface.

## Key findings

## Finding A — The live site is effectively a demo gateway
That is okay for internal walkthroughs and should be preserved.

Do **not** delete or deprecate Dev Login as a concept. It is useful.

Instead, treat it as:
- a valid local demo path
- a stakeholder preview shortcut
- an internal QA / seeded-user switchboard

## Finding B — Brand direction is stronger than launch messaging
The visual identity is more mature than the current public product framing on the deployed site.

In plain English: the product *looks* more advanced than the live homepage *explains*.

## Finding C — The newer Next landing page is a better public anchor than the currently deployed Expo web home
The Next app already has:
- stronger information hierarchy
- clearer category framing
- better hero structure
- more explicit differentiators
- more obvious conversion paths

But it needs palette alignment away from blue-heavy accents and into the orange/graphite system.

## Finding D — Live route behavior is confusing for anyone expecting deep links
Because multiple routes appear to resolve to Dev Login, the deployment currently behaves more like a single-shell preview than a navigable public app.

That is acceptable for a demo environment, but not ideal for a production marketing domain.

## Concrete recommendations for the current repo

## 1) Keep Dev Login, but reposition it
Keep `Dev Login` as a first-class internal/demo route.

Recommended treatment:
- preserve `/dev-login`
- preserve seeded role switching
- preserve it for local demo use and stakeholder walkthroughs
- do **not** recommend deleting it

But move it out of the role of default public homepage for production marketing.

## 2) Promote the Next `web/app/page.tsx` landing structure into the public brand anchor
Use the Next landing page as the basis for the public homepage because it already has:
- hero
- stats
- role segmentation
- differentiators
- clearer product explanation

## 3) Unify the accent system across Expo and Next
Bring the Next web app into full alignment with the orange/graphite/black system.

Specifically:
- replace blue CTA / blue badge / blue icon accents with Proslync orange or graphite variants
- keep orange for primary action and emphasis
- use graphite / silver for neutral interaction and secondary framing
- reserve green for success only

## 4) Standardize the logo system
Recommend a simple hierarchy:
- **Primary external logo:** wordmark + mark
- **Secondary app logo:** monogram mark with glow
- **Decorative motif:** repeated low-opacity mark usage, but only in hero or splash contexts

This keeps the live motif without letting it dominate every surface.

## 5) Make the public homepage tell the full deal-flow story
The public page should explicitly ladder through:
- verified identity
- AI matching
- outreach / brief creation
- contract / e-sign
- escrow / payout
- embedded compliance

Right now that story exists in fragments. It should become the main narrative spine.

## 6) Decide and document deployment intent
In repo docs, explicitly distinguish:
- public marketing home
- app portals
- dev login / seeded-user demo

That avoids future confusion where the live domain accidentally points at the internal showcase shell.

## 7) Treat route behavior as a product signal, not only a technical issue
If `/athlete`, `/brand`, `/agent`, `/fan`, `/admin`, and `/aiengine` all collapse into Dev Login on production, document whether that is:
- intentional preview behavior, or
- incomplete deployment wiring

Either answer is fine, but it should be explicit.

## Recommended near-term target state

### Public production surface
- polished Next landing page
- orange/graphite brand alignment
- strong NIL platform story
- CTA into request demo / explore roles / internal preview

### Demo surface
- Dev Login remains intact
- clearly labeled as preview/demo environment
- accessible via `/dev-login`

### App surfaces
- role dashboards remain role-specific behind demo/login flows

## Durable outputs created
- Screenshot: `~/proslync-app/docs/audits/live-site/proslync-live-home-2026-04-14.png`
- Audit note: `~/proslync-app/docs/audits/live-site/proslync-live-site-brand-audit-2026-04-14.md`

## Bottom line

Proslync already has a credible premium visual language.
The strongest live signals are the palette, logo motif, and role-based platform framing.

The problem is not lack of brand. The problem is that the **currently deployed home route behaves like an internal demo switchboard**, while the repo already contains a more articulate public-facing product story.

So the move is:
- keep Dev Login,
- preserve it as a valid local/demo path,
- and elevate the stronger web landing narrative into the public-facing default, after palette cleanup.
