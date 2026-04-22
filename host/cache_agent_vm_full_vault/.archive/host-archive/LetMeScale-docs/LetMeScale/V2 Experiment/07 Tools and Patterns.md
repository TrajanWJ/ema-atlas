> See also: [[LetMeScale]]

# Tools & Patterns — v2

> Reusable code patterns and architectural decisions for the rebuild.

---

## Pattern 1: Component Registry + DevNav

The variant system carries forward. A dynamic section registry:

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

// Render dynamically
{SECTION_ORDER.map((id) => {
  const Component = COMPONENTS[id][variants[id]];
  return Component ? <Component key={`${id}-${variants[id]}`} /> : null;
})}
```

Add new variants to the registry as you iterate. DevNav auto-generates UI from the registry.

---

## Pattern 2: Variant Persistence

URL params > localStorage > defaults:

```typescript
function loadVariants(sections: SectionDef[]): Record<string, string> {
  const defaults = Object.fromEntries(sections.map((s) => [s.id, s.defaultVariant]));

  // URL params take highest precedence
  const params = new URLSearchParams(window.location.search);
  // localStorage fills remaining
  // Defaults as fallback
  return defaults;
}
```

---

## Pattern 3: Typed Testimonial Data

Single source of truth for all case studies:

```typescript
interface CaseStudy {
  id: string;
  name: string;
  headline: string;
  stat: string;
  statLabel: string;
  category: "revenue" | "views";
  heroImage: string;
  images: { src: string; alt: string }[];
  profile: ClientProfile;
  story: {
    before?: StoryMetric[];
    after?: StoryMetric[];
    metrics: StoryMetric[];
  };
}

export const CASE_STUDIES: CaseStudy[] = [/* Trell, Farid, Mark, Josh Snow */];
```

Every proof component imports from this file. Change data once → updates everywhere.

---

## Pattern 4: Tailwind v4 @theme Tokens (v2)

```css
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-void: #000000;
  --color-surface-1: #0A0A0A;
  --color-surface-2: #111111;
  --color-surface-3: #1A1A1A;

  /* Red */
  --color-red: #991B1B;
  --color-red-glow: rgba(153, 27, 27, 0.15);
  --color-red-subtle: rgba(153, 27, 27, 0.08);
  --color-red-border: rgba(153, 27, 27, 0.20);

  /* Fonts */
  --font-display: "Clash Display", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
}
```

---

## Pattern 5: Solid Surface Utilities (Replaces Glass)

### On White Backgrounds
```tsx
// Standard card
className="bg-white rounded-xl shadow-lg border border-gray-100"

// Elevated card
className="bg-white rounded-xl shadow-xl"

// Subtle card
className="bg-[#F5F5F5] rounded-xl shadow-sm"
```

### On Black Backgrounds
```tsx
// Standard card (light border, no shadow)
className="bg-[#111111] rounded-xl border border-white/10"

// Elevated card
className="bg-[#1A1A1A] rounded-xl border border-white/[0.12]"

// Subtle card
className="bg-[#0A0A0A] rounded-xl border border-white/[0.06]"
```

---

## Pattern 6: Animation Presets (Framer Motion Only)

```typescript
export const EASE = [0.16, 1, 0.3, 1]; // ease-out-expo

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.12 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// Counter spring animation (one-shot, no live ticking)
export const counterSpring = { type: "spring", damping: 30, stiffness: 300 };
```

GSAP ScrollTrigger is available as an optional addition for the scroll-driven proof section if Framer Motion's scroll-linked animations can't achieve the precision needed.

---

## Pattern 7: Section Background Wrapper

Helper component to handle the alternating black/white backgrounds:

```tsx
interface SectionProps {
  bg: "black" | "white";
  children: React.ReactNode;
  className?: string;
}

function Section({ bg, children, className }: SectionProps) {
  return (
    <section className={cn(
      "relative",
      bg === "black" ? "bg-black text-white" : "bg-white text-black",
      className
    )}>
      {children}
    </section>
  );
}
```

---

## Libraries — v2

| Library | Role | Status |
|---------|------|--------|
| **Framer Motion** | Scroll reveals, counters, stagger, transitions | Primary |
| **GSAP ScrollTrigger** | Scroll-driven proof stories | Optional |
| **Lucide React** | Icons | Keep |
| **Next.js 15** | Framework | Keep |
| **Tailwind CSS v4** | Styling | Keep |
| **TypeScript** | Language | Keep |

### Dropped
- Three.js (not needed)
- Lenis (not needed without GSAP scroll)
- Drizzle ORM (no database)
- NextAuth (no auth)
- Zod (no backend validation needed)

---

## File Organization

```
app/
├── (site)/
│   ├── layout.tsx          ← Fonts, metadata
│   └── page.tsx            ← Variant state, DevNav, section rendering
├── results/
│   └── page.tsx            ← Full proof gallery (Daniel, Chetha + expanded versions)
├── globals.css             ← @theme tokens, section backgrounds, selection, scrollbar
└── layout.tsx              ← Root layout, ApplyModal provider

components/
├── sections/
│   ├── hero/               ← Hero variants
│   ├── proof/              ← Proof variants + per-client sub-components
│   ├── who-for/            ← Who For variants
│   ├── system/             ← System variants
│   └── cta/                ← CTA variants
├── apply-modal.tsx         ← Apply flow modal (context provider)
├── dev-nav.tsx             ← DevNav tool
├── nav.tsx                 ← Minimal fixed nav
├── footer.tsx              ← Footer
└── counter.tsx             ← Animated counter (one-shot)

lib/
├── testimonials.ts         ← Centralized case study data
└── variants.ts             ← Variant persistence logic
```

#letmescale #v2-experiment
