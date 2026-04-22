> See also: [[LetMeScale]]

# Testimonials V2 Proof Section — Interactive Redesign

**Date:** 2026-02-26
**Status:** Approved
**Approach:** Modular sub-components (B)

## Summary

Enhance `testimonials-cascade-v2.tsx` with three new interactive proof patterns and a full per-client bespoke animation system. Each client card gets a unique entrance, ambient micro-animations, and rich hover states. Two clients (Trell, Farid) get custom proof widgets. All clients gain a contextual gallery lightbox.

## Architecture

### New Components

```
apps/landing/components/proof/
├── gallery-lightbox.tsx      # Multi-image gallery with navigation
├── curtain-slider.tsx        # Draggable before/after comparison
├── video-marquee.tsx         # Infinite scroll video wall
└── use-card-animations.ts    # Per-client animation hook
```

### Modified Files

- `testimonials-cascade-v2.tsx` — Integrate new components, apply animation hook
- `proof-lightbox.tsx` — Deprecated (superseded by gallery-lightbox)

### No New Dependencies

CSS `@keyframes`, Intersection Observer, native pointer/touch events, Canvas API.

---

## Component 1: Gallery Lightbox

Replaces single-image `ProofLightbox` with a fullscreen navigable gallery scoped per client.

### Props
```typescript
interface GalleryLightboxProps {
  images: Array<{ src: string; caption?: string }>;
  startIndex: number;
  isOpen: boolean;
  onClose: () => void;
}
```

### Behavior
- Opens on the exact image that was clicked (index-aware)
- Left/right arrow buttons + swipe gestures to navigate
- Dot indicators at bottom showing position (e.g., `3 / 6`)
- Keyboard: left/right arrows navigate, Escape closes
- Keeps the 6 random entrance animations from existing ProofLightbox
- Dark backdrop (#060608/90%) with `backdrop-blur: 20px`
- Image scales to fit viewport with padding
- Counter bottom-right in IBM Plex Mono

### Special Modes
- **Curtain slider mode:** When opened from Trell's before/after, renders the curtain slider fullscreen instead of a standard image

---

## Component 2: Curtain Slider (Trell)

Draggable before/after comparison embedded in Trell's card.

### Props
```typescript
interface CurtainSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;   // "OCT 2025"
  afterLabel: string;    // "DEC 2025"
  beforeStat?: string;   // "$31,649"
  afterStat?: string;    // "$187,321"
}
```

### In-Card Behavior
- Side-by-side with a draggable vertical divider
- Left: before screenshot (Oct, declining)
- Right: after screenshot (Dec, peak)
- Thin vertical handle: 2px red line (#991B1B) with 16px grab circle
- Labels: "BEFORE" / "AFTER" in IBM Plex Mono at top corners
- Month labels below
- Draggable with touch + mouse, constrained to container bounds
- Starts at 50% split

### Passive Demo Animation
On first viewport entry, divider auto-slides: 30% → 70% → 50% over 1.5s with ease `[0.16, 1, 0.3, 1]`. Fires once, then stops.

### Lightbox Integration
Click (not drag) opens gallery lightbox in curtain slider fullscreen mode.

---

## Component 3: Video Marquee (Farid)

Infinite horizontal marquee of TikTok screenshots with view counts.

### Props
```typescript
interface VideoMarqueeProps {
  videos: Array<{
    image: string;
    viewCount: string;
    title: string;
    isTop?: boolean;      // Red glow on highest performer
  }>;
}
```

### Passive State (default)
- Horizontal belt of video thumbnails, duplicated for seamless CSS loop
- Each thumbnail: rounded rect (phone-frame style), view count badge overlaid at bottom
- Scrolls left continuously at ~30px/s via CSS `@keyframes translateX`
- GPU-accelerated (transform only, no layout triggers)
- Pauses on hover (`animation-play-state: paused`)

### Active State (on click/tap)
- Marquee freezes
- Strip becomes swipeable/draggable (touch + mouse via pointer events)
- Tap outside strip or press Escape to resume auto-scroll
- Click individual thumbnail → opens in gallery lightbox

### View Count Badge
- Semi-transparent dark pill (#060608/80%, backdrop-blur: 8px)
- Lucide Eye icon + count in IBM Plex Mono, 11px
- Top video (7.9M) gets red glow: `box-shadow: 0 0 12px rgba(153,27,27,0.4)`

---

## Component 4: Per-Client Animation System

Custom hook providing unique entrance, ambient, and interaction animations per client.

### Hook API
```typescript
function useCardAnimations(clientId: string): {
  entranceRef: RefObject<HTMLDivElement>;
  entranceStyle: CSSProperties;
  ambientClassName: string;
  hoverHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onMouseMove: (e: MouseEvent) => void;
  };
}
```

### Scroll-Triggered Entrances

| Client | Animation | Duration |
|--------|-----------|----------|
| Daniel | Scale bloom: scale 0.85→1, blur 8px→0 | 600ms |
| Chetha | Iris reveal: clip-path circle 0%→100% | 700ms |
| Farid | 3D flip: rotateY -15°→0° | 650ms |
| Trell | Slide up: translateY 60px→0 | 550ms |
| Mark Shapiro | Slide left: translateX -80px→0 | 600ms |
| Josh Snow | Fog dissolve: blur 12px→0, opacity 0→1 | 800ms |

All use Intersection Observer with `threshold: 0.15`, fire once (`once: true`).
Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (matching existing project standard).

### Ambient Micro-Animations (in-viewport only)

- **Stats pulse:** `box-shadow` breathing glow every 4s on stat values
- **Counter ticks:** Stats with `tick: true` increment by tiny amounts (existing behavior, extended to all visible cards)
- **Glass border breathing:** Card border opacity cycles 3%→6%→3% over 6s
- **Red ember particles:** Canvas particles drift upward from card bottom on viewport entry (adapted from existing `particles.tsx`)

### Hover/Interaction Animations

- **Card lift:** `translateY(-4px)` + shadow `0 8px 32px rgba(0,0,0,0.3)` over 200ms
- **Image zoom:** Scale 1.02x on hover, `overflow: hidden` on container
- **Stat highlight:** Red text color flash on hovered metric
- **CTA magnetic pull:** Button translates toward cursor within 20px bounding box

---

## Data

No data changes needed. All required data exists in `apps/landing/lib/testimonials.ts`:

- `CASE_STUDIES[].images` — screenshot arrays per client (for gallery lightbox)
- `FARID_TOP_VIDEOS` — 6 videos with image paths, view counts, titles
- `TRELL_TIMELINE` — before/after metrics
- Existing `beforeImage`/`afterImage` in Trell's story data

---

## Mobile Adaptations

- **Gallery lightbox:** Swipe gestures primary, arrows hidden on touch devices
- **Curtain slider:** Touch-drag works natively, grab circle enlarged to 24px on mobile
- **Video marquee:** Touch-swipe for active mode, marquee speed reduced to 20px/s
- **Particles:** Reduced count (15→8) below 768px
- **Entrances:** Simplified to fade-in + translateY on mobile (no 3D transforms, no clip-path) for performance
- **Hover states:** Disabled on touch devices (no hover handlers attached)

---

## Performance Considerations

- All marquee animations use `transform` only (GPU-composited)
- Intersection Observer for lazy entrance triggers (no scroll listeners)
- Particles use `requestAnimationFrame` with visibility check (pause when off-screen)
- Gallery lightbox images loaded on-demand (not prefetched)
- CSS animations preferred over JS animations where possible

#letmescale #plans #archive
