> See also: [[LetMeScale]]

# Section Architecture — v2

> 6 sections. Alternating black/white. Each section earns its place.

---

## Page Layout

```
┌─────────────────────────────────────┐
│ [NAV] Logo              [CTA btn]   │  ← Fixed, minimal
├─────────────────────────────────────┤
│ ██████ HERO (BLACK) ██████████████  │  ← Statement headline + stat stack
├──── RED BRIDGE LINE ────────────────┤
│ ░░░░░ PROOF (WHITE) ░░░░░░░░░░░░░  │  ← 4 clients, scroll-driven
├──── RED BRIDGE LINE ────────────────┤
│ ██████ WHO FOR (BLACK) █████████████│  ← Checklist qualifier
├──── RED BRIDGE LINE ────────────────┤
│ ░░░░░ SYSTEM (WHITE) ░░░░░░░░░░░░░ │  ← Explained via client case study
├──── RED BRIDGE LINE ────────────────┤
│ ██████ CTA (BLACK) █████████████████│  ← Apply modal trigger
├─────────────────────────────────────┤
│ ██████ FOOTER (BLACK) ██████████████│
└─────────────────────────────────────┘
```

Red bridge lines/gradients connect the black and white sections, giving red its role as connective tissue.

---

## Section 1: Hero (BLACK)

**Layout:** Split composition
- **Left:** Massive Clash Display headline, filling most of viewport height
- **Right:** Vertical stack of 3 animated counters (2.1B views, $3.4M rev, 2.4K appts)
- **Below:** Single CTA button — "Request Access"

**Counter Behavior:** Animate once on page load (count up from 0 over 2-3 seconds). No live ticking.

**Copy:**
```
WE BUILD ATTENTION
THAT PRODUCES
DIRECT ROI.
```

---

## Section 2: Proof (WHITE)

**Layout:** Scroll-driven deep dive. Full-width, one client at a time.

**Clients in order:** Trell → Farid → Mark Shapiro → Josh Snow

Each client occupies a "chapter" of the scroll. As you scroll through each chapter:
- Client name and headline stat appear
- Personal story unfolds with supporting text
- Before/after metrics animate in
- Proof images/screenshots embedded
- Transition to next client

**Per-client unique layouts and animations** — see `02-CLIENT-CASE-STUDIES.md` for specifics.

**Cards:** Solid white/light-gray cards with shadows on the white background. Large readable stat numbers. Supporting text that tells the story clearly.

---

## Section 3: Who For (BLACK)

**Layout:** Checklist qualifier. 4-5 criteria with checkmarks.

**Content:**
```
✓ You make $10K+/month
✓ You have an existing audience or product
✓ You want systems, not services
✓ You're ready to invest in distribution
✗ Not for beginners or guarantee-seekers
```

Clean, scannable. Cards with light borders on black background. Quick section — doesn't need to be long.

---

## Section 4: System (WHITE)

**Layout:** Case study integration — explain the system through a real client's journey.

Don't explain the system abstractly. Show it through a specific client: "Here's exactly what we did for [Client], step by step."

Use one of the featured clients (likely Trell — strongest before/after arc) and walk through what happened at each stage:
1. Where they were (the "before")
2. What LetMeScale deployed (the intervention)
3. What happened (the results)

**Cards:** Solid elevated cards with shadows on white background. Timeline or step-by-step progression.

---

## Section 5: CTA (BLACK)

**Layout:** Bold headline + CTA button that triggers the apply modal.

**Apply Modal Flow (kept from v1):**
1. CTA button opens modal
2. Question 1: "What's your current monthly revenue?" (screening)
3. Question 2: "What's your primary goal with content?"
4. If qualified → form submission → "Application received"
5. If under $10K → polite rejection with guidance

**Restyle the modal** to match v2 design system (solid surfaces, Clash Display, Plus Jakarta Sans, elevated card with shadow).

---

## Section 6: Footer (BLACK)

Standard footer. Social links, legal, copyright.

---

## DevNav (Dev Tool)

Kept from v1. Floating developer panel for hot-swapping section variants at runtime.

Even though v2 builds more decisively (one design per section to start), the DevNav system allows:
- Comparing draft vs refined versions during iteration
- Testing different copy variants
- Toggling sections on/off
- Sharing specific combos via URL params

### Component Registry Pattern (kept from v1)
```typescript
const COMPONENTS: Record<string, Record<string, React.FC>> = {
  hero: { "hero-v2": HeroV2 },
  proof: { "proof-v2": ProofV2 },
  "who-for": { "who-for-v2": WhoForV2 },
  system: { "system-v2": SystemV2 },
  cta: { "cta-v2": CtaV2 },
  footer: { "footer-v2": FooterV2 },
};

const SECTION_ORDER = ["hero", "proof", "who-for", "system", "cta", "footer"] as const;
```

New variants get added to the registry as they're built. DevNav auto-generates toggles from the registry.

#letmescale #v2-experiment
