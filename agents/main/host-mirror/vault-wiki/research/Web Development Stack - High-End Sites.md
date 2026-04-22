---
title: Web Development Stack - High-End Sites
created: '2026-03-17'
updated: '2026-03-17'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: external-research
tags:
  - architecture
  - research
summary: >-
  Premium, immersive websites aren't React SPAs built from scratch. They're
  **Webflow + targeted JS libraries** for the fancy bits. You don't need deep 
wiki_id: research/Web_Development_Stack_-_High-End_Sites
imported_from: vault/Research/Web Development Stack - High-End Sites.md
imported_at: '2026-04-04T00:23:57.144Z'
---
# Web Development Stack — High-End Sites

**Source:** [@sahanaintech on TikTok](https://www.tiktok.com/@sahanaintech/video/7595780468532874527) (2026-01-16)
**Inspired by:** [@Josh from Yolkk](https://www.tiktok.com/@joshfromyolkk)

## Key Insight

Premium, immersive websites aren't React SPAs built from scratch. They're **Webflow + targeted JS libraries** for the fancy bits. You don't need deep frontend experience to get close to this level.

## The Stack

| Layer | Tool | Role |
|---|---|---|
| **Design** | [[Figma]] | UI/UX design, prototyping |
| **Build** | [[Webflow]] | Visual site builder, does the heavy lifting |
| **3D / Immersive** | [[Three.js]] + [[React Three Fiber]] | WebGL 3D scenes; R3F is the React wrapper |
| **Smooth Scrolling** | [[Lenis]] | Buttery smooth scroll library |
| **Page Transitions** | [[Barba.js]] | SPA-like transitions between pages without being a SPA |
| **Motion / Interaction** | Osmo | Interaction and motion design |
| **Performance** | WebP | Image format, smaller files, faster loads |

## Why This Matters

- Most high-end agency sites are NOT custom React codebases
- Webflow handles 80-90% of the build
- JS libraries are added surgically for specific effects (3D, scroll, transitions)
- The "insanely complex" look comes from good design + a few well-chosen libraries, not a complex stack
- Accessible to people without deep frontend/web experience

## Related

- [[Webflow]] — no-code site builder, the backbone of this approach
- [[Three.js]] — JavaScript 3D library
- [[React Three Fiber]] — declarative Three.js for React
- [[Lenis]] — smooth scroll (by darkroom.engineering)
- [[Barba.js]] — page transition library
