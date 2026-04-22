> See also: [[LetMeScale]]

# Testimonials V2 Proof Section — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade testimonials-cascade-v2.tsx with a contextual gallery lightbox, Trell's draggable curtain slider, Farid's infinite video marquee, and per-client bespoke animations (scroll entrances, ambient micro-animations, hover interactions).

**Architecture:** Modular sub-components in `apps/landing/components/proof/`. V2 remains the orchestrator. Each new interaction pattern is a self-contained component. A shared `useCardAnimations` hook provides per-client entrance + ambient + hover animation config. Framer Motion (already a dependency) powers all animations. No new dependencies.

**Tech Stack:** Next.js 15, React 19, Framer Motion 11, Tailwind CSS 4, Lucide React, TypeScript 5

**Key Files:**
- `apps/landing/components/sections/testimonials-cascade-v2.tsx` — main orchestrator (1183 lines)
- `apps/landing/components/proof-lightbox.tsx` — current single-image lightbox (186 lines)
- `apps/landing/lib/testimonials.ts` — all client data (408 lines)
- `apps/landing/components/proof/` — destination for new components

**Design tokens (from existing codebase):**
- Easing: `[0.16, 1, 0.3, 1]`
- Red accent: `#991B1B` (CSS var `--red` or class `text-red`, `bg-red`)
- Glass: `bg-white/[0.03]` with `border-[var(--border)]`
- Mono font: `font-mono` (IBM Plex Mono)
- Display font: `font-display` (Playfair Display)
- Background: `bg-void` (#060608)

---

## Task 1: Create Gallery Lightbox Component

**Files:**
- Create: `apps/landing/components/proof/gallery-lightbox.tsx`

**Step 1: Create the gallery lightbox component**

This replaces the single-image `ProofLightbox` with a multi-image gallery. It supports keyboard navigation, swipe gestures, dot indicators, and the same 6 entrance animations.

```tsx
"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const ENTRANCE_ANIMATIONS = [
  {
    initial: { scale: 0.3, opacity: 0, filter: "blur(12px)" },
    animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
  {
    initial: { y: "100vh", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
  {
    initial: { clipPath: "circle(0% at 50% 50%)", opacity: 1 },
    animate: { clipPath: "circle(100% at 50% 50%)", opacity: 1 },
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] },
  },
  {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
  {
    initial: { opacity: 0, x: -3 },
    animate: { opacity: [0, 1, 0.3, 1, 0.7, 1], x: [-3, 3, -2, 1, 0, 0] },
    transition: { duration: 0.4, ease: "easeOut" },
  },
  {
    initial: { opacity: 0, filter: "blur(40px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
  },
];

const EXIT = { exit: { scale: 0.95, opacity: 0 }, transition: { duration: 0.2, ease: "easeIn" } };

interface GalleryImage {
  src: string;
  alt: string;
}

interface GalleryLightboxProps {
  images: GalleryImage[];
  startIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function GalleryLightbox({ images, startIndex, isOpen, onClose }: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const animIndexRef = useRef(Math.floor(Math.random() * ENTRANCE_ANIMATIONS.length));
  const touchStartX = useRef(0);

  // Sync startIndex when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
      animIndexRef.current = Math.floor(Math.random() * ENTRANCE_ANIMATIONS.length);
    }
  }, [isOpen, startIndex]);

  const total = images.length;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, goNext, goPrev]);

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const delta = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 50) {
        delta > 0 ? goNext() : goPrev();
      }
    },
    [goNext, goPrev]
  );

  const anim = ENTRANCE_ANIMATIONS[animIndexRef.current];
  const current = images[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#060608]/90 backdrop-blur-xl"
          onClick={onClose}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white/20 hover:text-white/50 transition-colors z-10"
            aria-label="Close"
          >
            <X size={28} />
          </button>

          {/* Prev arrow (desktop) */}
          {total > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors z-10 hidden lg:block"
              aria-label="Previous"
            >
              <ChevronLeft size={36} />
            </button>
          )}

          {/* Next arrow (desktop) */}
          {total > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors z-10 hidden lg:block"
              aria-label="Next"
            >
              <ChevronRight size={36} />
            </button>
          )}

          {/* Image */}
          <div style={{ perspective: "1200px" }} onClick={(e) => e.stopPropagation()}>
            <motion.div
              key={currentIndex}
              initial={anim.initial}
              animate={anim.animate}
              exit={EXIT.exit}
              transition={anim.transition as Record<string, unknown>}
              className="relative max-w-[90vw] max-h-[85vh] cursor-default"
            >
              <Image
                src={current.src}
                alt={current.alt}
                width={1200}
                height={800}
                className="object-contain max-h-[85vh] w-auto rounded-lg"
                sizes="90vw"
                priority
              />
              {/* Caption */}
              {current.alt && (
                <p className="font-mono text-xs text-white/40 text-center mt-3 max-w-lg mx-auto">
                  {current.alt}
                </p>
              )}
            </motion.div>
          </div>

          {/* Dot indicators + counter */}
          {total > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex ? "bg-white w-3" : "bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] text-white/30 ml-2">
                {currentIndex + 1} / {total}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Verify it builds**

Run: `cd apps/landing && npx next build --no-lint 2>&1 | tail -20`
Expected: No TypeScript errors related to gallery-lightbox.tsx

**Step 3: Commit**

```bash
git add apps/landing/components/proof/gallery-lightbox.tsx
git commit -m "feat(proof): add gallery lightbox with multi-image navigation, swipe, keyboard, dot indicators"
```

---

## Task 2: Create Curtain Slider Component

**Files:**
- Create: `apps/landing/components/proof/curtain-slider.tsx`

**Step 1: Create the draggable before/after curtain slider**

```tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

interface CurtainSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;
  afterLabel: string;
  beforeStat?: string;
  afterStat?: string;
  onClickExpand?: () => void;
}

export function CurtainSlider({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  beforeStat,
  afterStat,
  onClickExpand,
}: CurtainSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(viewRef, { once: true, margin: "-80px" });
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Demo sweep on first viewport entry: 50 → 30 → 70 → 50
  useEffect(() => {
    if (!inView || hasAnimated) return;
    setHasAnimated(true);

    const steps = [
      { value: 30, delay: 0 },
      { value: 70, delay: 500 },
      { value: 50, delay: 1000 },
    ];

    const timeouts = steps.map(({ value, delay }) =>
      setTimeout(() => setPosition(value), delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [inView, hasAnimated]);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    // Only fire expand if NOT dragging (no significant movement)
    if (!isDragging && onClickExpand) {
      onClickExpand();
    }
  }, [isDragging, onClickExpand]);

  return (
    <div ref={viewRef}>
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-[var(--border)] bg-white/[0.02] select-none cursor-col-resize"
        style={{ aspectRatio: "16/10" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        {/* After image (full, underneath) */}
        <div className="absolute inset-0">
          <Image src={afterImage} alt={afterLabel} fill className="object-cover" sizes="640px" />
        </div>

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image src={beforeImage} alt={beforeLabel} fill className="object-cover" sizes="640px" />
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-[#991B1B] z-10"
          style={{
            left: `${position}%`,
            transform: "translateX(-50%)",
            transition: isDragging ? "none" : "left 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Grab handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#991B1B] border-2 border-white/20 flex items-center justify-center shadow-lg shadow-black/40">
            <div className="flex gap-0.5">
              <div className="w-[2px] h-3 bg-white/60 rounded-full" />
              <div className="w-[2px] h-3 bg-white/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-red-900/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-red-500/20">
            <span className="font-mono text-[9px] text-red-200 tracking-wider uppercase">Before</span>
            {beforeStat && <span className="font-mono text-[9px] text-red-300 ml-2">{beforeStat}</span>}
          </div>
          <p className="font-mono text-[8px] text-white/40 mt-1 ml-0.5">{beforeLabel}</p>
        </div>

        <div className="absolute top-3 right-3 z-10">
          <div className="bg-emerald-900/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-emerald-500/20">
            <span className="font-mono text-[9px] text-emerald-200 tracking-wider uppercase">After</span>
            {afterStat && <span className="font-mono text-[9px] text-emerald-300 ml-2">{afterStat}</span>}
          </div>
          <p className="font-mono text-[8px] text-white/40 mt-1 text-right mr-0.5">{afterLabel}</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify it builds**

Run: `cd apps/landing && npx next build --no-lint 2>&1 | tail -20`
Expected: Clean build

**Step 3: Commit**

```bash
git add apps/landing/components/proof/curtain-slider.tsx
git commit -m "feat(proof): add draggable curtain slider with demo sweep animation"
```

---

## Task 3: Create Video Marquee Component

**Files:**
- Create: `apps/landing/components/proof/video-marquee.tsx`

**Step 1: Create the infinite marquee with passive/active modes**

```tsx
"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Eye } from "lucide-react";

interface MarqueeVideo {
  image: string;
  viewCount: string;
  title: string;
  isTop?: boolean;
}

interface VideoMarqueeProps {
  videos: MarqueeVideo[];
  onVideoClick?: (index: number) => void;
}

function VideoCard({
  video,
  onClick,
}: {
  video: MarqueeVideo;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 w-[140px] sm:w-[160px] group/card cursor-pointer"
    >
      <div
        className={`relative rounded-2xl overflow-hidden border transition-all duration-300 group-hover/card:scale-[1.03] ${
          video.isTop
            ? "border-[#991B1B]/40 shadow-[0_0_20px_rgba(153,27,27,0.25)]"
            : "border-[var(--border)] group-hover/card:border-[var(--border-hover)]"
        }`}
      >
        <div className="aspect-[9/16] relative">
          <Image src={video.image} alt={video.title} fill className="object-cover" sizes="160px" />

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

          {/* View count badge */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-[#060608]/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5">
              <Eye size={10} className="text-white/50" />
              <span className="font-mono text-[10px] text-white/80 tracking-wide">{video.viewCount}</span>
            </div>
          </div>

          {/* Title overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3">
            <p className="font-mono text-[9px] text-white/70 text-center leading-tight">{video.title}</p>
          </div>

          {/* Expand hint */}
          <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
            <div className="bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
              <span className="font-mono text-[7px] text-white/50 tracking-wider">EXPAND</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function VideoMarquee({ videos, onVideoClick }: VideoMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(viewRef, { once: true, margin: "-60px" });
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);

  // Duplicate videos for seamless loop
  const belt = [...videos, ...videos];

  const handleVideoClick = useCallback(
    (index: number) => {
      if (isActive && onVideoClick) {
        onVideoClick(index % videos.length);
      } else {
        setIsActive(true);
      }
    },
    [isActive, videos.length, onVideoClick]
  );

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only toggle active if clicking the container background, not a card
    if (e.target === e.currentTarget) {
      setIsActive((prev) => !prev);
    }
  }, []);

  // Manual drag in active mode
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive) return;
      dragStartX.current = e.clientX;
      scrollStart.current = containerRef.current?.scrollLeft ?? 0;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [isActive]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive || !containerRef.current) return;
      const dx = dragStartX.current - e.clientX;
      containerRef.current.scrollLeft = scrollStart.current + dx;
    },
    [isActive]
  );

  // CSS animation duration (matches the @keyframes below)
  const animationDuration = `${belt.length * 3}s`;

  return (
    <div ref={viewRef}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden"
        onMouseEnter={() => !isActive && setIsPaused(true)}
        onMouseLeave={() => { setIsPaused(false); setIsActive(false); }}
        onClick={handleContainerClick}
      >
        {/* Active mode indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-[#991B1B]/20 border border-[#991B1B]/30 backdrop-blur-sm rounded-md px-2 py-0.5">
              <span className="font-mono text-[8px] text-[#991B1B] tracking-wider uppercase">Interactive · Click outside to resume</span>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className={`flex gap-3 py-2 ${isActive ? "overflow-x-auto scrollbar-hide" : "overflow-hidden"}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          style={{
            cursor: isActive ? "grab" : "default",
          }}
        >
          <div
            className={`flex gap-3 ${!isActive ? "marquee-belt" : ""}`}
            style={
              !isActive
                ? {
                    animationDuration,
                    animationPlayState: isPaused ? "paused" : "running",
                  }
                : undefined
            }
          >
            {belt.map((video, i) => (
              <VideoCard
                key={`${video.title}-${i}`}
                video={video}
                onClick={() => handleVideoClick(i)}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* CSS keyframes for the infinite marquee — injected inline */}
      <style jsx>{`
        .marquee-belt {
          animation-name: marquee-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
```

**Step 2: Verify it builds**

Run: `cd apps/landing && npx next build --no-lint 2>&1 | tail -20`
Expected: Clean build

**Step 3: Commit**

```bash
git add apps/landing/components/proof/video-marquee.tsx
git commit -m "feat(proof): add infinite video marquee with passive scroll and interactive mode"
```

---

## Task 4: Create useCardAnimations Hook

**Files:**
- Create: `apps/landing/components/proof/use-card-animations.ts`

**Step 1: Create the per-client animation hook**

This hook provides unique entrance animations, ambient CSS classes, and hover handlers for each client card.

```tsx
"use client";

import { useRef, useState, useCallback, useEffect, type CSSProperties, type RefObject } from "react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const ENTRANCE_CONFIG: Record<string, { from: CSSProperties; to: CSSProperties; duration: number }> = {
  daniel: {
    from: { transform: "scale(0.85)", filter: "blur(8px)", opacity: 0 },
    to: { transform: "scale(1)", filter: "blur(0px)", opacity: 1 },
    duration: 600,
  },
  chetha: {
    from: { clipPath: "circle(0% at 50% 50%)", opacity: 0 },
    to: { clipPath: "circle(100% at 50% 50%)", opacity: 1 },
    duration: 700,
  },
  farid: {
    from: { transform: "perspective(1200px) rotateY(-15deg)", opacity: 0 },
    to: { transform: "perspective(1200px) rotateY(0deg)", opacity: 1 },
    duration: 650,
  },
  trell: {
    from: { transform: "translateY(60px)", opacity: 0 },
    to: { transform: "translateY(0px)", opacity: 1 },
    duration: 550,
  },
  "mark-shapiro": {
    from: { transform: "translateX(-80px)", opacity: 0 },
    to: { transform: "translateX(0px)", opacity: 1 },
    duration: 600,
  },
  "josh-snow": {
    from: { filter: "blur(12px)", opacity: 0 },
    to: { filter: "blur(0px)", opacity: 1 },
    duration: 800,
  },
};

// Default fallback
const DEFAULT_ENTRANCE = {
  from: { transform: "translateY(60px)", opacity: 0 } as CSSProperties,
  to: { transform: "translateY(0px)", opacity: 1 } as CSSProperties,
  duration: 600,
};

interface CardAnimations {
  entranceRef: RefObject<HTMLDivElement | null>;
  entranceStyle: CSSProperties;
  ambientClassName: string;
  hoverHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onMouseMove: (e: React.MouseEvent) => void;
  };
  isInView: boolean;
}

export function useCardAnimations(clientId: string): CardAnimations {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Intersection Observer for entrance trigger
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const config = ENTRANCE_CONFIG[clientId] ?? DEFAULT_ENTRANCE;

  const entranceStyle: CSSProperties = isInView
    ? {
        ...config.to,
        transition: `all ${config.duration}ms ${EASE}`,
      }
    : {
        ...config.from,
        transition: "none",
      };

  // Hover: card lift + shadow
  if (isHovered && isInView) {
    entranceStyle.transform = `${(entranceStyle.transform as string) || ""} translateY(-4px)`.trim();
    entranceStyle.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
  }

  const hoverHandlers = {
    onMouseEnter: useCallback(() => setIsHovered(true), []),
    onMouseLeave: useCallback(() => {
      setIsHovered(false);
      setMouseOffset({ x: 0, y: 0 });
    }, []),
    onMouseMove: useCallback((e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMouseOffset({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      });
    }, []),
  };

  return {
    entranceRef: ref,
    entranceStyle,
    ambientClassName: isInView ? "animate-ambient-glow" : "",
    hoverHandlers,
    isInView,
  };
}
```

**Step 2: Verify it builds**

Run: `cd apps/landing && npx next build --no-lint 2>&1 | tail -20`
Expected: Clean build

**Step 3: Commit**

```bash
git add apps/landing/components/proof/use-card-animations.ts
git commit -m "feat(proof): add useCardAnimations hook with per-client entrance, ambient, hover"
```

---

## Task 5: Add Ambient Animation CSS

**Files:**
- Modify: `apps/landing/app/globals.css`

**Step 1: Add the ambient glow keyframe and utility class**

Find the globals.css file and add these keyframes at the bottom (before any closing brackets):

```css
/* Proof section ambient animations */
@keyframes ambient-border-breathe {
  0%, 100% { border-color: rgba(255, 255, 255, 0.03); }
  50% { border-color: rgba(255, 255, 255, 0.06); }
}

@keyframes ambient-stat-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(153, 27, 27, 0); }
  50% { box-shadow: 0 0 20px rgba(153, 27, 27, 0.15); }
}

.animate-ambient-glow {
  animation: ambient-border-breathe 6s ease-in-out infinite;
}

.animate-stat-pulse {
  animation: ambient-stat-pulse 4s ease-in-out infinite;
}
```

**Step 2: Verify dev server shows no errors**

Run: `cd apps/landing && npx next build --no-lint 2>&1 | tail -20`
Expected: Clean build

**Step 3: Commit**

```bash
git add apps/landing/app/globals.css
git commit -m "feat(proof): add ambient glow and stat pulse CSS keyframes"
```

---

## Task 6: Integrate Gallery Lightbox into V2

**Files:**
- Modify: `apps/landing/components/sections/testimonials-cascade-v2.tsx` (lines 1-28, 1141-1182)

This is the main integration task. We need to:
1. Replace the `ProofLightbox` import with `GalleryLightbox`
2. Change lightbox state from `{src, alt}` to `{clientId, startIndex}`
3. Update `openLightbox` to accept `clientId` + image index
4. Update all `ClickableShot` `onOpen` calls to pass the client context

**Step 1: Update imports**

At the top of the file (line 27), replace:
```tsx
import { ProofLightbox } from "@/components/proof-lightbox";
```
with:
```tsx
import { GalleryLightbox } from "@/components/proof/gallery-lightbox";
```

**Step 2: Update lightbox state in TestimonialsCascadeV2 (lines 1141-1182)**

Replace the component's state and handlers:

Old (lines 1142-1150):
```tsx
const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

const openLightbox = useCallback((src: string, alt: string) => {
  setLightbox({ src, alt });
}, []);

const closeLightbox = useCallback(() => {
  setLightbox(null);
}, []);
```

New:
```tsx
const [galleryState, setGalleryState] = useState<{ clientId: string; startIndex: number } | null>(null);

const openGallery = useCallback((clientId: string, src: string) => {
  const study = clients.find((c) => c.id === clientId);
  if (!study) return;
  const idx = study.images.findIndex((img) => img.src === src);
  setGalleryState({ clientId, startIndex: Math.max(0, idx) });
}, []);

const closeGallery = useCallback(() => {
  setGalleryState(null);
}, []);

const galleryImages = galleryState
  ? clients.find((c) => c.id === galleryState.clientId)?.images ?? []
  : [];
```

**Step 3: Update ClientCard to pass client context**

In the `ClientCard` function, change `onOpen` prop type and storyMap usage. The `onOpen` callback in each story component currently has signature `(src: string, alt: string) => void`. We need to change it to pass the client ID through.

Update `ClientCard` (around line 1021):
```tsx
function ClientCard({
  client,
  index,
  onOpen,
}: {
  client: CaseStudy;
  index: number;
  onOpen: (clientId: string, src: string) => void;
}) {
```

And update how StoryComponent receives onOpen — create a bound callback:
```tsx
const boundOnOpen = useCallback(
  (src: string, _alt: string) => onOpen(client.id, src),
  [client.id, onOpen]
);
```

Then pass `boundOnOpen` to both `CardHeader` and `StoryComponent`:
```tsx
{StoryComponent ? <StoryComponent client={client} onOpen={boundOnOpen} /> : null}
```

**Step 4: Update the render in TestimonialsCascadeV2**

Replace the `onOpen={openLightbox}` with `onOpen={openGallery}`:
```tsx
<ClientCard key={client.id} client={client} index={i} onOpen={openGallery} />
```

Replace the `ProofLightbox` at the bottom with:
```tsx
<GalleryLightbox
  images={galleryImages}
  startIndex={galleryState?.startIndex ?? 0}
  isOpen={galleryState !== null}
  onClose={closeGallery}
/>
```

**Step 5: Verify it builds**

Run: `cd apps/landing && npx next build --no-lint 2>&1 | tail -20`
Expected: Clean build

**Step 6: Visually verify**

Run: `cd apps/landing && pnpm dev`
Navigate to localhost:3001, scroll to the proof section, click any screenshot. Verify:
- Lightbox opens on the clicked image
- Left/right arrows navigate between images for that client
- Dot indicators show position
- Escape closes
- Keyboard arrows work

**Step 7: Commit**

```bash
git add apps/landing/components/sections/testimonials-cascade-v2.tsx
git commit -m "feat(proof): integrate gallery lightbox with per-client image navigation"
```

---

## Task 7: Integrate Curtain Slider into Trell's Card

**Files:**
- Modify: `apps/landing/components/sections/testimonials-cascade-v2.tsx` (TrellStory function, lines 284-437)

**Step 1: Add import**

Add to the imports at the top:
```tsx
import { CurtainSlider } from "@/components/proof/curtain-slider";
```

**Step 2: Replace the Before → After section in TrellStory**

Replace lines 317-384 (the `{/* Vertical Split: Before (muted, left) → After (bright, right) */}` block) with:

```tsx
{/* Curtain Slider: Before → After */}
<div>
  <p className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.2em] uppercase text-center mb-6">Before → After</p>
  <CurtainSlider
    beforeImage="/testimonials/trell/before-1.jpeg"
    afterImage="/testimonials/trell/after-1.jpeg"
    beforeLabel="OCT 2025"
    afterLabel="DEC 2025"
    beforeStat="$31,649"
    afterStat="$187,321"
    onClickExpand={() => onOpen("/testimonials/trell/before-1.jpeg", "Before/After comparison")}
  />
  <p className="text-center font-mono text-[10px] text-[var(--text-tertiary)] mt-3">Drag the slider to compare. $31K → $187K in 60 days.</p>
</div>
```

**Step 3: Verify it builds and renders**

Run: `cd apps/landing && npx next build --no-lint 2>&1 | tail -20`
Then: `cd apps/landing && pnpm dev`
Navigate to Trell's card. Verify:
- Curtain slider shows with before/after images
- Demo sweep fires on first viewport entry (30% → 70% → 50%)
- Dragging the handle works
- Labels show "BEFORE" / "AFTER" with stats

**Step 4: Commit**

```bash
git add apps/landing/components/sections/testimonials-cascade-v2.tsx
git commit -m "feat(proof): integrate curtain slider into Trell's before/after section"
```

---

## Task 8: Integrate Video Marquee into Farid's Card

**Files:**
- Modify: `apps/landing/components/sections/testimonials-cascade-v2.tsx` (FaridStory function, lines 821-900)

**Step 1: Add import**

Add to the imports at the top (may already be near the CurtainSlider import):
```tsx
import { VideoMarquee } from "@/components/proof/video-marquee";
```

**Step 2: Prepare marquee data**

Add a constant near the top of the file (after line 30, near `const clients = ...`):

```tsx
const FARID_MARQUEE_VIDEOS = FARID_TOP_VIDEOS.map((v, i) => ({
  image: `/testimonials/farid/${v.file}`,
  viewCount: v.views,
  title: v.theme,
  isTop: i === 0, // 7.9M whiteboard is the top video
}));
```

**Step 3: Replace the masonry grid in FaridStory**

Replace lines 847-871 (the `{/* Masonry wall — tight layout, no gaps feel */}` block) with:

```tsx
{/* Infinite Video Marquee */}
<div>
  <p className="font-mono text-[10px] text-[var(--text-tertiary)] tracking-[0.2em] uppercase text-center mb-4">
    The Wall — 28 Videos, All Above 90K
  </p>
  <VideoMarquee
    videos={FARID_MARQUEE_VIDEOS}
    onVideoClick={(index) => {
      const video = FARID_TOP_VIDEOS[index];
      if (video) {
        onOpen(`/testimonials/farid/${video.file}`, `${video.theme} — ${video.views} views`);
      }
    }}
  />
  <p className="text-center text-[var(--text-tertiary)] text-xs font-mono mt-3">Average: 514K/video. Lowest: 90.6K. Tap to interact.</p>
</div>
```

**Step 4: Verify it builds and renders**

Run: `cd apps/landing && npx next build --no-lint 2>&1 | tail -20`
Then: `cd apps/landing && pnpm dev`
Navigate to Farid's card. Verify:
- Video thumbnails scroll horizontally in a seamless loop
- Hovering pauses the animation
- Clicking activates interactive mode
- Clicking a video in interactive mode opens it in the gallery lightbox
- View count badges show on each video
- The 7.9M video has a red glow

**Step 5: Commit**

```bash
git add apps/landing/components/sections/testimonials-cascade-v2.tsx
git commit -m "feat(proof): integrate infinite video marquee into Farid's card"
```

---

## Task 9: Integrate Per-Client Animations into ClientCard

**Files:**
- Modify: `apps/landing/components/sections/testimonials-cascade-v2.tsx` (ClientCard function, lines 1021-1086)

**Step 1: Add import**

Add to the imports:
```tsx
import { useCardAnimations } from "@/components/proof/use-card-animations";
```

**Step 2: Replace ClientCard's animation logic**

Replace the current `ClientCard` function with one that uses the hook:

```tsx
function ClientCard({
  client,
  index,
  onOpen,
}: {
  client: CaseStudy;
  index: number;
  onOpen: (clientId: string, src: string) => void;
}) {
  const { entranceRef, entranceStyle, ambientClassName, hoverHandlers, isInView } = useCardAnimations(client.id);

  const boundOnOpen = useCallback(
    (src: string, _alt: string) => onOpen(client.id, src),
    [client.id, onOpen]
  );

  const storyMap: Record<string, React.FC<{ client: CaseStudy; onOpen: (src: string, alt: string) => void }>> = {
    trell: TrellStory,
    daniel: DanielStory,
    "mark-shapiro": MarkStory,
    chetha: ChethaStory,
    farid: FaridStory,
    "josh-snow": JoshStory,
  };

  const StoryComponent = storyMap[client.id];
  const badge = client.id === "chetha" ? "OUR SYSTEM" : undefined;

  return (
    <div
      ref={entranceRef}
      style={entranceStyle}
      className={ambientClassName}
      {...hoverHandlers}
    >
      <article className="glass-1 rounded-3xl overflow-hidden transition-shadow duration-300">
        <div className="h-[2px] w-full bg-red" />
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col items-center">
          <CardHeader client={client} badge={badge} />
          <div className="w-full mt-12">
            {StoryComponent ? <StoryComponent client={client} onOpen={boundOnOpen} /> : null}
          </div>
          <div className="mt-12 w-full max-w-xl">
            <MetricsRow metrics={client.story.metrics} />
          </div>
          <div className="mt-12 h-px w-16 bg-red/20 mx-auto" />
        </div>
      </article>
    </div>
  );
}
```

This removes the old Framer Motion entrance (the uniform `opacity: 0, y: 60`) and the special first-card 3D tilt, replacing them with per-client bespoke entrances via the hook.

**Step 3: Verify it builds and renders**

Run: `cd apps/landing && npx next build --no-lint 2>&1 | tail -20`
Then: `cd apps/landing && pnpm dev`
Scroll through all 6 cards. Verify:
- Daniel: scale bloom entrance
- Chetha: iris reveal
- Farid: 3D flip from right
- Trell: slide up
- Mark: slide from left
- Josh: fog dissolve
- All cards have ambient border breathing
- Hover lifts cards with deeper shadow

**Step 4: Commit**

```bash
git add apps/landing/components/sections/testimonials-cascade-v2.tsx
git commit -m "feat(proof): integrate per-client bespoke entrance and hover animations"
```

---

## Task 10: Add Stat Pulse and Image Zoom Micro-Interactions

**Files:**
- Modify: `apps/landing/components/sections/testimonials-cascade-v2.tsx` (MetricsRow and ClickableShot)

**Step 1: Add stat pulse to MetricsRow**

In the `MetricsRow` function (around line 171), add the `animate-stat-pulse` class to each metric pill when in view. Update the className on the metric `motion.div`:

Replace:
```tsx
className="bg-white/[0.03] border border-[var(--border)] rounded-2xl px-5 py-3.5 text-center min-w-[100px]"
```
With:
```tsx
className={`bg-white/[0.03] border border-[var(--border)] rounded-2xl px-5 py-3.5 text-center min-w-[100px] ${inView ? "animate-stat-pulse" : ""}`}
style={{ animationDelay: `${i * 0.5}s` }}
```

**Step 2: Add image zoom to ClickableShot**

In the `ClickableShot` function (around line 71), the image container already has `overflow-hidden`. Add a scale transform on hover to the Image wrapper div.

Replace the image container (around line 121):
```tsx
<div className="w-full rounded-[1.1rem] overflow-hidden aspect-[9/16] relative">
```
With:
```tsx
<div className="w-full rounded-[1.1rem] overflow-hidden aspect-[9/16] relative group-hover:scale-[1.02] transition-transform duration-500">
```

Wait — the `group-hover` only works if the parent has `group`. Looking at line 99, the parent div has `group` class. But the hover transform should be on a child wrapper, not the containing div (which has `overflow-hidden`). Instead, apply the scale to the Image itself:

In the Image tag (around line 122), change:
```tsx
<Image src={src} alt={alt} fill className="object-cover" sizes="260px" />
```
To:
```tsx
<Image src={src} alt={alt} fill className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" sizes="260px" />
```

**Step 3: Verify it builds and renders**

Run: `cd apps/landing && pnpm dev`
Scroll to any client card. Verify:
- Metric pills have a subtle red glow pulse (staggered)
- Hovering over a screenshot zooms the image slightly (1.03x)

**Step 4: Commit**

```bash
git add apps/landing/components/sections/testimonials-cascade-v2.tsx
git commit -m "feat(proof): add stat pulse glow and image zoom micro-interactions"
```

---

## Task 11: Final Polish and Visual QA

**Files:**
- Modify: `apps/landing/components/sections/testimonials-cascade-v2.tsx` (cleanup)

**Step 1: Remove unused ProofLightbox import if still present**

Check line 27. If it still imports `ProofLightbox`, remove that line. If the `proof-lightbox.tsx` file is no longer imported anywhere in the codebase, leave it in place but don't import it.

**Step 2: Clean up any unused ClickableShot import from proof-lightbox.tsx**

The V2 file has its own internal `ClickableShot` function. The one in `proof-lightbox.tsx` is separate. No action needed unless there's a duplicate import.

**Step 3: Full visual QA checklist**

Run: `cd apps/landing && pnpm dev`

Verify each item manually:

- [ ] **Gallery lightbox:** Click any screenshot in any card → opens on that image → arrows/dots navigate → Escape closes → swipe works on mobile
- [ ] **Trell curtain slider:** Demo sweep fires on scroll entry → draggable → labels show → click (not drag) opens lightbox
- [ ] **Farid video marquee:** Auto-scrolls left infinitely → pauses on hover → click activates interactive mode → click video opens lightbox → red glow on 7.9M video
- [ ] **Daniel entrance:** Scale bloom (0.85 → 1 + blur clear)
- [ ] **Chetha entrance:** Iris reveal (clip-path circle)
- [ ] **Farid entrance:** 3D flip from right
- [ ] **Trell entrance:** Slide up from below
- [ ] **Mark entrance:** Slide from left
- [ ] **Josh entrance:** Fog dissolve
- [ ] **Ambient:** Border breathing on all cards, stat pulse on metrics
- [ ] **Hover:** Cards lift 4px, screenshots zoom 1.03x
- [ ] **Mobile:** Touch swipe in lightbox, touch drag on curtain slider, marquee works on touch
- [ ] **Performance:** No jank during scroll, marquee is smooth 60fps

**Step 4: Fix any issues found during QA**

Address any visual bugs, alignment issues, or animation timing problems.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(proof): testimonials V2 interactive proof section — gallery lightbox, curtain slider, video marquee, per-client animations"
```

---

## Summary of Changes

| Task | Component | Status |
|------|-----------|--------|
| 1 | Gallery Lightbox | New file |
| 2 | Curtain Slider | New file |
| 3 | Video Marquee | New file |
| 4 | useCardAnimations | New file |
| 5 | Ambient CSS | Modified globals.css |
| 6 | Gallery integration | Modified V2 |
| 7 | Curtain integration | Modified V2 (TrellStory) |
| 8 | Marquee integration | Modified V2 (FaridStory) |
| 9 | Entrance animations | Modified V2 (ClientCard) |
| 10 | Micro-interactions | Modified V2 (MetricsRow, ClickableShot) |
| 11 | Polish & QA | Final cleanup |

**New files (4):**
- `apps/landing/components/proof/gallery-lightbox.tsx`
- `apps/landing/components/proof/curtain-slider.tsx`
- `apps/landing/components/proof/video-marquee.tsx`
- `apps/landing/components/proof/use-card-animations.ts`

**Modified files (2):**
- `apps/landing/components/sections/testimonials-cascade-v2.tsx`
- `apps/landing/app/globals.css`

#letmescale #plans #archive
