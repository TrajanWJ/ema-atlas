> See also: [[LetMeScale]]

# Testimonials Cascade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing PremiumTestimonials and AlternativeTestimonials sections with a scroll-triggered phone cascade where iPhone-styled cards slide in from alternating sides, and clicking any card opens a center modal with the person's full story, metrics, gallery, and social links.

**Architecture:** New `testimonials-cascade.tsx` section component orchestrates the cascade. It renders `PhoneCard` components in alternating left/right rows with scroll-triggered Framer Motion animations. Clicking a card opens a `ClientModal` overlay. All data lives in an enriched `testimonials.ts` data file.

**Tech Stack:** Next.js 15, React 19, Framer Motion 11, Tailwind CSS 4, Lucide React, `@letmescale/ui` shared components and animation presets.

**Design doc:** `docs/plans/2026-02-21-testimonials-cascade-design.md`

---

### Task 1: Update testimonials data model

**Files:**
- Modify: `apps/marketing/lib/testimonials.ts`

**Step 1: Rewrite the data file with enriched client profiles**

Replace the entire file contents with the new data model. This adds `ClientProfile` with bios, social links, profile images, and restructured story metrics.

```typescript
import { DollarSign, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ClientProfile {
  fullName: string;
  handle: string;
  bio: string;
  profileImage: string | null;
  socials: {
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
}

export interface StoryMetric {
  label: string;
  value: string;
}

export interface CaseStudy {
  id: string;
  name: string;
  subtitle: string;
  headline: string;
  stat: string;
  statLabel: string;
  category: "revenue" | "views";
  categoryIcon: typeof DollarSign | typeof Eye;
  heroImage: string;
  images: { src: string; alt: string }[];
  profile: ClientProfile;
  story: {
    before?: StoryMetric[];
    after?: StoryMetric[];
    metrics: StoryMetric[];
  };
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "trell",
    name: "Trell",
    subtitle: "The Trainer",
    headline: "$83K+ Revenue in 6 Days",
    stat: "$83,212+",
    statLabel: "Revenue in 6 days",
    category: "revenue",
    categoryIcon: DollarSign,
    heroImage: "/testimonials/trell/revenue-83k.jpeg",
    images: [
      { src: "/testimonials/trell/revenue-83k.jpeg", alt: "Trell revenue dashboard showing $83K+" },
      { src: "/testimonials/trell/before-1.jpeg", alt: "Trell before - analytics baseline" },
      { src: "/testimonials/trell/before-2.jpeg", alt: "Trell before - analytics baseline 2" },
      { src: "/testimonials/trell/after-1.jpeg", alt: "Trell after - results" },
      { src: "/testimonials/trell/after-2.jpeg", alt: "Trell after - results 2" },
      { src: "/testimonials/trell/after-3.jpeg", alt: "Trell after - results 3" },
    ],
    profile: {
      fullName: "Dontrell Britton",
      handle: "@trellthetrainer",
      bio: "Ex-felon turned celebrity fitness trainer. 5 years in prison became the foundation for a fitness empire. Trained Pusha T and Shy Glizzy. Founded 23&1 — a prison-style bootcamp hiring returning citizens. 1.4M on Instagram. Vegan. DC & LA.",
      profileImage: "/testimonials/trell/profile.png",
      socials: {
        instagram: "https://www.instagram.com/trellthetrainer/",
        tiktok: "https://www.tiktok.com/@trellthetrainer",
      },
    },
    story: {
      before: [
        { label: "Revenue", value: "$31,649.72" },
        { label: "Change", value: "-$8,832.24" },
        { label: "Period", value: "October 2025" },
      ],
      after: [
        { label: "Revenue", value: "$187,321.54" },
        { label: "Growth", value: "+$100,312.90" },
        { label: "Period", value: "December 2025" },
      ],
      metrics: [
        { label: "Revenue in 6 days", value: "$83,212+" },
        { label: "Growth", value: "+$100,312" },
        { label: "Active users", value: "360" },
        { label: "Total earned", value: "$466,593" },
      ],
    },
  },
  {
    id: "daniel",
    name: "Daniel",
    subtitle: "Content Creator",
    headline: "14.2M Views in 90 Days",
    stat: "14.2M",
    statLabel: "Views in 90 days",
    category: "views",
    categoryIcon: Eye,
    heroImage: "/testimonials/daniel/DecemberResult.jpeg",
    images: [
      { src: "/testimonials/daniel/DecemberResult.jpeg", alt: "Daniel December results overview" },
      { src: "/testimonials/daniel/Acc_reach_oneReel.png", alt: "Daniel account reach from one reel" },
      { src: "/testimonials/daniel/Last_90_days.PNG", alt: "Daniel last 90 days analytics" },
      { src: "/testimonials/daniel/ReelInsight(1).PNG", alt: "Daniel reel insight" },
      { src: "/testimonials/daniel/ReelInsight(2).jpeg", alt: "Daniel reel insight 2" },
      { src: "/testimonials/daniel/Audience(USAviral1).PNG", alt: "Daniel USA viral reach" },
    ],
    profile: {
      fullName: "Daniel",
      handle: "",
      bio: "Content creator who cracked organic distribution. Zero ad spend. Zero tricks. Just engineered reels that reached 14.2 million people in 90 days — 99.1% of them complete strangers.",
      profileImage: null,
      socials: {},
    },
    story: {
      metrics: [
        { label: "Total views", value: "13.7M" },
        { label: "Reach from 1 reel", value: "2.3M" },
        { label: "Non-followers", value: "99.1%" },
        { label: "Engagement", value: "246K+" },
      ],
    },
  },
  {
    id: "mark-shapiro",
    name: "Mark Shapiro",
    subtitle: "Capital",
    headline: "$90K+ Cash Collected",
    stat: "$90,300+",
    statLabel: "Cash collected",
    category: "revenue",
    categoryIcon: DollarSign,
    heroImage: "/testimonials/mark-shapiro/dashboard-1.jpeg",
    images: [
      { src: "/testimonials/mark-shapiro/dashboard-1.jpeg", alt: "Mark Shapiro dashboard overview" },
      { src: "/testimonials/mark-shapiro/dashboard-2.jpeg", alt: "Mark Shapiro revenue metrics" },
      { src: "/testimonials/mark-shapiro/dashboard-3.jpeg", alt: "Mark Shapiro growth analytics" },
      { src: "/testimonials/mark-shapiro/dashboard-4.jpeg", alt: "Mark Shapiro engagement data" },
      { src: "/testimonials/mark-shapiro/dashboard-5.jpeg", alt: "Mark Shapiro conversion stats" },
    ],
    profile: {
      fullName: "Mark Shapiro",
      handle: "@themarkshapiro",
      bio: "From broke at 18 to a billion-dollar real estate empire. 25,000+ units owned and managed. Overcame incarceration and homelessness. Now hosts The Mark Shapiro Podcast and mentors the next generation. 1M on Instagram.",
      profileImage: "/testimonials/mark-shapiro/profile.png",
      socials: {
        instagram: "https://www.instagram.com/themarkshapiro/",
        website: "https://mshapirocapital.com/",
      },
    },
    story: {
      metrics: [
        { label: "Cash collected", value: "$111,451" },
        { label: "Booked calls", value: "213" },
        { label: "Show rate", value: "71.83%" },
        { label: "Close rate", value: "33.9%" },
      ],
    },
  },
  {
    id: "chetha",
    name: "Chetha",
    subtitle: "Media",
    headline: "6.5M Views Generated",
    stat: "6.5M",
    statLabel: "Views generated",
    category: "views",
    categoryIcon: Eye,
    heroImage: "/testimonials/chetha/IMG_5177.PNG",
    images: [
      { src: "/testimonials/chetha/IMG_5177.PNG", alt: "Chetha main results" },
      { src: "/testimonials/chetha/IMG_9790.PNG", alt: "Chetha analytics overview" },
      { src: "/testimonials/chetha/IMG_4453.PNG", alt: "Chetha monthly overview" },
      { src: "/testimonials/chetha/IMG_3915.PNG", alt: "Chetha content insights" },
      { src: "/testimonials/chetha/IMG_3316.PNG", alt: "Chetha follower analytics" },
      { src: "/testimonials/chetha/IMG_5724.PNG", alt: "Chetha long-term growth" },
    ],
    profile: {
      fullName: "Chetha",
      handle: "@chethxa",
      bio: "Media operator who builds content ecosystems. 21.5 million total views. 7 million accounts reached. 91.2% non-follower audience. Doesn't just distribute — builds self-sustaining content machines.",
      profileImage: null,
      socials: {
        instagram: "https://www.instagram.com/chethxa",
      },
    },
    story: {
      metrics: [
        { label: "Total views", value: "21.5M" },
        { label: "Accounts reached", value: "7.07M" },
        { label: "Non-followers", value: "91.2%" },
        { label: "Monthly views", value: "6.98M" },
      ],
    },
  },
];

export const HERO_METRICS = [
  { value: 83212, prefix: "$", suffix: "+", label: "Revenue in 6 Days" },
  { value: 14.2, suffix: "M", label: "Views in 90 Days" },
  { value: 90300, prefix: "$", suffix: "+", label: "Cash Collected" },
  { value: 2.3, suffix: "M", label: "Reach from 1 Reel" },
];
```

**Step 2: Verify the data file has no TypeScript errors**

Run: `cd /home/trajan/Desktop/Coding/Projects/letmescale && npx tsc --noEmit --project apps/marketing/tsconfig.json 2>&1 | head -30`

Expected: No errors related to `testimonials.ts` (there may be other pre-existing errors).

**Step 3: Commit**

```bash
git add apps/marketing/lib/testimonials.ts
git commit -m "feat(marketing): enrich testimonials data with profiles, bios, and social links"
```

---

### Task 2: Create the PhoneCard component

**Files:**
- Create: `apps/marketing/components/phone-card.tsx`

**Step 1: Create the phone mockup card component**

This component renders a single phone-shaped card with the client's profile photo, name, subtitle, metric badge, and hero screenshot. It accepts a `direction` prop for the slide animation and an `onClick` handler.

```tsx
"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { cn } from "@letmescale/ui";
import type { CaseStudy } from "@/lib/testimonials";

interface PhoneCardProps {
  client: CaseStudy;
  direction: "left" | "right";
  onClick: () => void;
}

export function PhoneCard({ client, direction, onClick }: PhoneCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const initialX = direction === "right" ? 200 : -200;

  return (
    <div
      ref={ref}
      className={cn(
        "flex px-8 md:px-16 lg:px-32",
        direction === "right" ? "justify-end" : "justify-start"
      )}
    >
      <motion.div
        initial={{ opacity: 0, x: initialX }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: initialX }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={onClick}
        className="group relative w-[200px] h-[380px] md:w-[220px] md:h-[420px] bg-[#0A0A0A] border border-white/[0.08] rounded-[2.5rem] p-3 shadow-2xl shadow-black/40 cursor-pointer hover:border-white/[0.12] hover:-translate-y-1 transition-all duration-500"
      >
        {/* Inner screen */}
        <div className="relative w-full h-full bg-black rounded-[2rem] overflow-hidden flex flex-col items-center">
          {/* Notch */}
          <div className="w-12 h-1 rounded-full bg-white/[0.06] mt-3 mb-4 shrink-0" />

          {/* Profile Photo */}
          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/[0.08] bg-white/[0.04] flex items-center justify-center shrink-0">
            {client.profile.profileImage ? (
              <Image
                src={client.profile.profileImage}
                alt={client.profile.fullName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-white/30 text-lg font-bold">
                {client.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Name & Subtitle */}
          <p className="text-sm font-bold text-white mt-2">{client.name}</p>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/25">
            {client.subtitle}
          </p>

          {/* Metric Badge */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 mt-3">
            <client.categoryIcon className="w-3.5 h-3.5 text-white/50" />
            <span className="text-white font-bold text-sm">{client.stat}</span>
          </div>

          {/* Hero Screenshot */}
          <div className="relative w-full flex-1 mt-3 mx-2 rounded-xl overflow-hidden border border-white/[0.04]">
            <Image
              src={client.heroImage}
              alt={client.headline}
              fill
              className="object-cover"
              sizes="220px"
            />
          </div>

          {/* Ghost CTA */}
          <p className="text-white/15 text-[10px] mt-2 mb-3 shrink-0">
            Tap to explore
          </p>
        </div>
      </motion.div>
    </div>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd /home/trajan/Desktop/Coding/Projects/letmescale && npx tsc --noEmit --project apps/marketing/tsconfig.json 2>&1 | grep -i "phone-card" | head -10`

Expected: No errors related to `phone-card.tsx`.

**Step 3: Commit**

```bash
git add apps/marketing/components/phone-card.tsx
git commit -m "feat(marketing): add PhoneCard component for testimonial cascade"
```

---

### Task 3: Create the ClientModal component

**Files:**
- Create: `apps/marketing/components/client-modal.tsx`

**Step 1: Create the expanded story modal component**

This modal shows the full client story when a phone card is clicked. It includes profile header with social links, bio, metrics grid, before/after section, and image gallery.

```tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, Instagram, ExternalLink, ArrowRight } from "lucide-react";
import { cn } from "@letmescale/ui";
import type { CaseStudy } from "@/lib/testimonials";

interface ClientModalProps {
  client: CaseStudy;
  onClose: () => void;
}

function SocialButton({ href, icon: Icon, label }: { href: string; icon: typeof Instagram; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-2.5 text-white/30 hover:text-white/60 hover:border-white/[0.08] transition-all duration-300"
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs">{label}</span>
    </a>
  );
}

export function ClientModal({ client, onClose }: ClientModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [handleEscape]);

  const { profile, story } = client;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />

      {/* Modal Panel */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#0A0A0A] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 p-8 md:rounded-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-white/[0.08] bg-white/[0.04] flex items-center justify-center shrink-0">
            {profile.profileImage ? (
              <Image
                src={profile.profileImage}
                alt={profile.fullName}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-white/30 text-2xl font-bold">
                {client.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{profile.fullName}</h3>
            {profile.handle && (
              <a
                href={profile.socials.instagram || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 text-sm hover:text-white/60 transition-colors"
              >
                {profile.handle}
              </a>
            )}
            <p className="text-[11px] tracking-[0.25em] uppercase text-white/25 mt-1">
              {client.subtitle}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.04] my-6" />

        {/* Bio */}
        <p className="text-white/50 text-sm leading-relaxed">{profile.bio}</p>

        {/* Divider */}
        <div className="h-px bg-white/[0.04] my-6" />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {story.metrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4"
            >
              <p className="text-white font-bold text-lg">{metric.value}</p>
              <p className="text-white/30 text-xs mt-1">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Before/After Section */}
        {story.before && story.after && (
          <>
            <div className="h-px bg-white/[0.04] my-6" />
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Before */}
              <div className="space-y-2">
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/20">Before</p>
                {story.before.map((m) => (
                  <div key={m.label}>
                    <p className="text-white/40 text-sm font-medium">{m.value}</p>
                    <p className="text-white/20 text-[10px]">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Arrow */}
              <ArrowRight className="w-5 h-5 text-white/15" />

              {/* After */}
              <div className="space-y-2">
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/30">After</p>
                {story.after.map((m) => (
                  <div key={m.label}>
                    <p className="text-white/80 text-sm font-bold">{m.value}</p>
                    <p className="text-white/30 text-[10px]">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Image Gallery */}
        <div className="h-px bg-white/[0.04] my-6" />
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {client.images.map((img) => (
            <div
              key={img.src}
              className="relative w-32 h-24 shrink-0 rounded-xl overflow-hidden border border-white/[0.04]"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          ))}
        </div>

        {/* Social Links Footer */}
        {Object.keys(profile.socials).length > 0 && (
          <>
            <div className="h-px bg-white/[0.04] my-6" />
            <div className="flex flex-wrap gap-3">
              {profile.socials.instagram && (
                <SocialButton
                  href={profile.socials.instagram}
                  icon={Instagram}
                  label="Instagram"
                />
              )}
              {profile.socials.tiktok && (
                <SocialButton
                  href={profile.socials.tiktok}
                  icon={ExternalLink}
                  label="TikTok"
                />
              )}
              {profile.socials.website && (
                <SocialButton
                  href={profile.socials.website}
                  icon={ExternalLink}
                  label="Website"
                />
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd /home/trajan/Desktop/Coding/Projects/letmescale && npx tsc --noEmit --project apps/marketing/tsconfig.json 2>&1 | grep -i "client-modal" | head -10`

Expected: No errors related to `client-modal.tsx`.

**Step 3: Commit**

```bash
git add apps/marketing/components/client-modal.tsx
git commit -m "feat(marketing): add ClientModal component for expanded testimonial stories"
```

---

### Task 4: Create the TestimonialsCascade section component

**Files:**
- Create: `apps/marketing/components/sections/testimonials-cascade.tsx`

**Step 1: Create the main cascade section**

This component renders the section header and maps over clients to create the alternating phone card cascade. It manages the selected client state for the modal.

```tsx
"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { staggerContainer, fadeInUp } from "@letmescale/ui";
import { CASE_STUDIES, type CaseStudy } from "@/lib/testimonials";
import { PhoneCard } from "@/components/phone-card";
import { ClientModal } from "@/components/client-modal";

export function TestimonialsCascade() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });
  const [selectedClient, setSelectedClient] = useState<CaseStudy | null>(null);

  return (
    <section id="testimonials" className="relative py-32 sm:py-48 bg-black overflow-hidden">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Section Header */}
      <motion.div
        ref={headerRef}
        variants={staggerContainer}
        initial="initial"
        animate={isHeaderInView ? "animate" : "initial"}
        className="text-center mb-20 px-6"
      >
        <motion.span
          variants={fadeInUp}
          className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/20 block mb-4"
        >
          Proof
        </motion.span>
        <motion.h2
          variants={fadeInUp}
          className="text-3xl md:text-4xl font-bold text-white tracking-tight"
        >
          These Are Their Numbers.
        </motion.h2>
      </motion.div>

      {/* Phone Card Cascade */}
      <div className="space-y-12 md:space-y-16">
        {CASE_STUDIES.map((client, i) => (
          <PhoneCard
            key={client.id}
            client={client}
            direction={i % 2 === 0 ? "right" : "left"}
            onClick={() => setSelectedClient(client)}
          />
        ))}
      </div>

      {/* Client Modal */}
      <AnimatePresence>
        {selectedClient && (
          <ClientModal
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd /home/trajan/Desktop/Coding/Projects/letmescale && npx tsc --noEmit --project apps/marketing/tsconfig.json 2>&1 | grep -i "testimonials-cascade" | head -10`

Expected: No errors.

**Step 3: Commit**

```bash
git add apps/marketing/components/sections/testimonials-cascade.tsx
git commit -m "feat(marketing): add TestimonialsCascade section component"
```

---

### Task 5: Wire up the new component in the page

**Files:**
- Modify: `apps/marketing/app/(site)/page.tsx` (lines 9, 11, 34, 36)

**Step 1: Replace PremiumTestimonials and AlternativeTestimonials imports and usage**

In `apps/marketing/app/(site)/page.tsx`:

1. Remove line 9: `import { PremiumTestimonials } from "@/components/sections/premium-testimonials";`
2. Remove line 11: `import { AlternativeTestimonials } from "@/components/sections/alternative-testimonials";`
3. Add: `import { TestimonialsCascade } from "@/components/sections/testimonials-cascade";`
4. Replace line 34 `<PremiumTestimonials />` with `<TestimonialsCascade />`
5. Remove line 36 `<AlternativeTestimonials />`

The final page.tsx should have `<TestimonialsCascade />` where `<PremiumTestimonials />` was, and the `<AlternativeTestimonials />` line removed entirely.

**Step 2: Verify no TypeScript errors**

Run: `cd /home/trajan/Desktop/Coding/Projects/letmescale && npx tsc --noEmit --project apps/marketing/tsconfig.json 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/marketing/app/\(site\)/page.tsx
git commit -m "feat(marketing): swap testimonials sections for new cascade component"
```

---

### Task 6: Visual verification and polish

**Step 1: Start the dev server**

Run: `cd /home/trajan/Desktop/Coding/Projects/letmescale && pnpm dev --filter=marketing`

Open `http://localhost:3000` in the browser and scroll to the testimonials section.

**Step 2: Verify the following**

- [ ] 4 phone cards visible as you scroll
- [ ] Cards alternate sliding from right and left
- [ ] Each card shows: notch, profile photo (or monogram), name, subtitle, metric badge with icon, hero screenshot, "Tap to explore" text
- [ ] Hover lifts the card slightly on desktop
- [ ] Clicking a card opens the center modal
- [ ] Modal shows: profile header with name/handle, subtitle, bio, metrics grid, before/after (for Trell), image gallery, social links
- [ ] Pressing Escape or clicking backdrop closes the modal
- [ ] Social links open in new tabs
- [ ] Mobile responsive (cards smaller, modal full-width)

**Step 3: Fix any visual issues found during verification**

Common adjustments:
- Image sizing within phone frame
- Spacing and padding tweaks
- Mobile breakpoint adjustments
- Scroll position for phone card visibility

**Step 4: Commit any polish fixes**

```bash
git add -A
git commit -m "fix(marketing): polish testimonials cascade visual details"
```

#letmescale #plans #archive
