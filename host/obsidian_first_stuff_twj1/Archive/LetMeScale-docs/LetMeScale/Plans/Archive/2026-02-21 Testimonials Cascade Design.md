> See also: [[LetMeScale]]

# Testimonials Cascade Redesign

**Date:** 2026-02-21
**App:** `apps/marketing`
**Replaces:** `premium-testimonials.tsx` (and optionally `alternative-testimonials.tsx`)
**New Component:** `testimonials-cascade.tsx`

---

## Overview

A scroll-triggered phone cascade section. As the user scrolls, 4 phone-mockup cards slide in one at a time from alternating sides (right, left, right, left). Each card features a client with their key stat, profile photo, and a metric badge with category icon. Clicking any card opens a center modal showing their full personal story, enriched bio, metrics breakdown, image gallery, and social links.

---

## Data Model

### Updated `testimonials.ts`

Extend the existing `CaseStudy` interface to include personal/social data:

```typescript
export interface ClientProfile {
  fullName: string;
  handle: string;
  bio: string;
  profileImage: string; // path to PFP in /public/testimonials/{id}/
  socials: {
    instagram?: string;
    tiktok?: string;
    website?: string;
    threads?: string;
  };
}

export interface CaseStudy {
  id: string;
  name: string;
  subtitle: string;
  headline: string;
  stat: string;
  statLabel: string;
  category: "revenue" | "views";
  categoryIcon: "dollar-sign" | "eye";
  heroImage: string;
  images: { src: string; alt: string }[];
  profile: ClientProfile;
  story: {
    before?: { label: string; value: string }[];
    after?: { label: string; value: string }[];
    metrics: { label: string; value: string; icon?: string }[];
  };
}
```

### Client Data

#### Trell (Dontrell Britton)
- **Full Name:** Dontrell Britton
- **Handle:** @trellthetrainer
- **Subtitle:** The Trainer
- **Category:** revenue / dollar-sign
- **Stat:** $83,212+
- **Bio:** "Ex-felon turned celebrity fitness trainer. 5 years in prison became the foundation for a fitness empire. Trained Pusha T and Shy Glizzy. Founded 23&1 — a prison-style bootcamp hiring returning citizens. 1.4M on Instagram. Vegan. DC & LA."
- **Profile Image:** `/testimonials/trell/profile.png` (downloaded)
- **Socials:**
  - Instagram: https://www.instagram.com/trellthetrainer/
  - TikTok: https://www.tiktok.com/@trellthetrainer
- **Story Metrics:**
  - Before: $31,649.72 revenue (Oct 2025), -$8,832.24 decline
  - After: $187,321.54 revenue (Dec 2025), +$100,312.90 growth, 360 users, $466,593 total earned

#### Daniel
- **Full Name:** Daniel
- **Handle:** (pending)
- **Subtitle:** Content Creator
- **Category:** views / eye
- **Stat:** 14.2M
- **Bio:** "Content creator who cracked organic distribution. Zero ad spend. Zero tricks. Just engineered reels that reached 14.2 million people in 90 days — 99.1% of them complete strangers."
- **Profile Image:** placeholder monogram "D" until provided
- **Socials:** pending
- **Story Metrics:**
  - 13.7M total views, 2.3M reach from 1 reel
  - 99.1% non-follower audience
  - 234K likes, 1.2K comments, 3.2K shares, 7.6K saves

#### Mark Shapiro
- **Full Name:** Mark Shapiro
- **Handle:** @themarkshapiro
- **Subtitle:** Capital
- **Category:** revenue / dollar-sign
- **Stat:** $90,300+
- **Bio:** "From broke at 18 to a billion-dollar real estate empire. 25,000+ units owned and managed. Overcame incarceration and homelessness. Now hosts The Mark Shapiro Podcast and mentors the next generation. 1M on Instagram."
- **Profile Image:** `/testimonials/mark-shapiro/profile.png` (downloaded)
- **Socials:**
  - Instagram: https://www.instagram.com/themarkshapiro/
  - Website: https://mshapirocapital.com/
- **Story Metrics:**
  - 213 booked calls, 71.83% show rate, 33.9% close rate
  - $111,451 cash collected, 40 new deals, $3,987 AOV

#### Chetha
- **Full Name:** Chetha
- **Handle:** @chethxa
- **Subtitle:** Media
- **Category:** views / eye
- **Stat:** 6.5M
- **Bio:** "Media operator who builds content ecosystems. 21.5 million total views. 7 million accounts reached. 91.2% non-follower audience. Doesn't just distribute — builds self-sustaining content machines."
- **Profile Image:** placeholder monogram "C" until provided
- **Socials:**
  - Instagram: https://www.instagram.com/chethxa

---

## Phone Card Component (Collapsed State)

### Dimensions
- Desktop: ~200px wide x ~360px tall
- Mobile: ~160px wide x ~290px tall
- Aspect ratio: roughly 9:16 (phone proportions)

### Styling
```
Frame:
  bg-[#0A0A0A]
  border border-white/[0.08]
  rounded-[2.5rem]
  p-3
  shadow-2xl shadow-black/40

Notch:
  w-16 h-1 rounded-full bg-white/[0.06]
  centered at top of card, mt-2

Inner content area:
  bg-black rounded-[2rem] overflow-hidden
  flex flex-col
```

### Content Layout (top to bottom)
1. **Notch** — centered thin pill shape
2. **Profile Photo** — circular, 48px, centered
3. **Name** — `text-sm font-bold text-white`
4. **Subtitle** — `text-[10px] tracking-[0.2em] uppercase text-white/25`
5. **Metric Badge** — glass pill with icon + stat value
   - Revenue: DollarSign icon from lucide-react, stat in white
   - Views: Eye icon from lucide-react, stat in white
   - Badge: `bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2`
6. **Hero Screenshot** — the key analytics image, cropped to fit, `rounded-xl`
7. **Ghost CTA** — "Tap to explore" in `text-white/15 text-[10px]`

### Hover State (Desktop)
- Card lifts slightly: `translateY(-4px)`
- Border brightens: `border-white/[0.12]`
- Subtle glow around the metric badge
- `transition-all duration-500`

---

## Alternating Slide Animation

### Scroll Behavior
Each card has its own `useInView` trigger (with `margin: "-50px"` and `once: true`).

### Direction Pattern
```
Card 0 (Trell):   initial={{ opacity: 0, x: 200 }}  → slides from RIGHT
                   Rests at: justify-end (right-aligned)

Card 1 (Daniel):  initial={{ opacity: 0, x: -200 }}  → slides from LEFT
                   Rests at: justify-start (left-aligned)

Card 2 (Mark):    initial={{ opacity: 0, x: 200 }}  → slides from RIGHT
                   Rests at: justify-end (right-aligned)

Card 3 (Chetha):  initial={{ opacity: 0, x: -200 }}  → slides from LEFT
                   Rests at: justify-start (left-aligned)
```

### Transition
```typescript
transition: {
  duration: 0.8,
  ease: [0.25, 0.1, 0.25, 1], // smooth deceleration
}
```

### Spacing
- Vertical gap between cards: `space-y-12` on desktop, `space-y-8` on mobile
- Each card row is a flex container with alternating `justify-end` / `justify-start`
- Cards have horizontal padding to not touch edges: `px-8 md:px-16 lg:px-32`

---

## Center Modal (Expanded State)

### Trigger
Click/tap on any phone card.

### Animation
Card animates to center screen using Framer Motion `layoutId` for shared layout animation, OR:
```typescript
// Modal enters
initial: { scale: 0.9, opacity: 0 }
animate: { scale: 1, opacity: 1 }
transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
```

### Backdrop
```
bg-black/80 backdrop-blur-lg
```
Click backdrop or press Escape to close.

### Modal Layout
```
max-w-lg w-full mx-auto
bg-[#0A0A0A] border border-white/[0.06] rounded-2xl
shadow-2xl shadow-black/50
overflow-y-auto max-h-[85vh]
p-8
```

### Modal Content (top to bottom)

1. **Close button** — top-right, X icon, `text-white/30 hover:text-white/60`

2. **Profile Header**
   - Profile photo (64px circle) + Name + Handle + Social icons row
   - Handle links to Instagram
   - Social icons: small, `text-white/30 hover:text-white/60`

3. **Subtitle badge** — `text-[11px] tracking-[0.25em] uppercase text-white/25`

4. **Divider** — `h-px bg-white/[0.04]`

5. **Bio paragraph** — `text-white/50 text-sm leading-relaxed`
   - The personalized, compelling story for this client

6. **Divider**

7. **Metrics Grid** — 2x2 grid of key stats
   - Each: icon + value (large, bold) + label (small, dimmed)
   - Revenue cards: dollar values in `text-white font-bold`
   - Views cards: view counts in `text-white font-bold`

8. **Before/After Section** (if applicable — Trell)
   - Two columns: Before (dimmed) → After (bright)
   - Arrow or transition indicator between them

9. **Image Gallery** — Horizontal scrollable row of screenshots
   - `overflow-x-auto flex gap-3`
   - Each image: `rounded-xl border border-white/[0.04]`
   - Clicking an image could open full-size in the existing Case Study Modal

10. **Social Links Footer**
    - Row of social platform buttons
    - `bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-2`
    - Instagram, TikTok, Website icons from lucide-react

---

## Section Container

### Header
```
[Overline]  "PROOF"
            text-[11px] tracking-[0.25em] uppercase text-white/20

[Headline]  "These Are Their Numbers."
            text-3xl md:text-4xl font-bold text-white tracking-tight
```

### Section Wrapper
```tsx
<section id="testimonials" className="relative py-32 bg-black overflow-hidden">
  {/* Top accent line */}
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

  {/* Header */}
  ...

  {/* Phone card cascade */}
  <div className="mt-20 space-y-12 md:space-y-16">
    {clients.map((client, i) => (
      <PhoneCardRow key={client.id} client={client} direction={i % 2 === 0 ? 'right' : 'left'} />
    ))}
  </div>

  {/* Modal */}
  <AnimatePresence>
    {selectedClient && <ClientModal client={selectedClient} onClose={...} />}
  </AnimatePresence>
</section>
```

---

## Mobile Considerations

- Phone cards are slightly smaller (160x290px)
- Cards still alternate but with less horizontal offset (since screen is narrow)
- Modal goes full-screen on mobile: `rounded-none h-full w-full`
- Image gallery becomes full-width swipeable
- Touch targets minimum 44x44px
- Backdrop blur reduced for performance

---

## Files to Create/Modify

1. **Modify:** `apps/marketing/lib/testimonials.ts` — Add profile, social, bio data; restructure story data
2. **Create:** `apps/marketing/components/sections/testimonials-cascade.tsx` — Main section component
3. **Create:** `apps/marketing/components/phone-card.tsx` — Phone mockup card component
4. **Create:** `apps/marketing/components/client-modal.tsx` — Expanded story modal
5. **Modify:** Whatever page file renders the testimonials section — swap `PremiumTestimonials` for `TestimonialsCascade`
6. **Assets:** Profile photos already downloaded for Trell and Mark Shapiro. Chetha and Daniel use monogram placeholders until provided.

---

## Tech Stack (No New Dependencies)

- **Framer Motion** (already installed) — animations, AnimatePresence, useInView
- **Lucide React** (already installed) — DollarSign, Eye, Instagram, ExternalLink, X icons
- **Next.js Image** (already installed) — optimized image loading
- **Tailwind CSS** (already installed) — all styling

---

## Animation Summary

| Element | Animation | Trigger |
|---------|-----------|---------|
| Section header | `fadeInUp` stagger | Scroll into view |
| Phone cards (even index) | `slideInRight` (x: 200→0) | Scroll into view |
| Phone cards (odd index) | `slideInLeft` (x: -200→0) | Scroll into view |
| Phone card hover | `hoverLift` (y: -4px) | Mouse hover |
| Modal enter | `scaleIn` (0.9→1) + backdrop fade | Click card |
| Modal exit | reverse of enter | Click backdrop/Escape |
| Modal content | `fadeInUp` stagger | On modal open |
| Gallery images | horizontal scroll | User interaction |

#letmescale #plans #archive
