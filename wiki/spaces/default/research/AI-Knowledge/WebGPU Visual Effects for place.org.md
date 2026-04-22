---
date: 2026-03-20T00:00:00.000Z
tags:
  - webgpu
  - three-js
  - r3f
  - visual-effects
  - place-org
  - tsl
  - particles
status: active
type: research
wiki_id: research/AI-Knowledge/WebGPU_Visual_Effects_for_place_org
imported_from: vault/Research/AI-Knowledge/WebGPU Visual Effects for place.org.md
imported_at: '2026-04-04T00:23:56.989Z'
summary: ''
---

# WebGPU Visual Effects for place.org

Research conducted 2026-03-20. Related: [[place.org]], [[My Stack Decisions]]

## Question

What single WebGPU visual effect would be most impactful for place.org's deep-space cockpit desktop background — jaw-dropping but not performance-killing, feasible for a Next.js 16 / React 19 app?

## Candidates Evaluated

| Approach | Stars (rep) | Complexity | Fallback | Score |
|---|---|---|---|---|
| TSL Compute GPU Particle Nebula (Three.js + R3F) | ~750k particles proven | Medium | WebGL 2 auto-fallback | **91** |
| Three.js TSL Bloom Post-Processing only | Built into Three.js | Low | Compiles to GLSL | 72 |
| Raw WGSL fullscreen shader (Shadertoy port) | Many public examples | Low-Medium | CSS gradient | 68 |
| WebGPU fluid sim (marching cubes) | Codrops demo | Very High | None | 22 |
| CSS backdrop-filter WebGPU replacement | No production impl | N/A | CSS itself | 15 |

## Browser Support (March 2026)

WebGPU ships by default in all major browsers as of late 2025:
- Chrome 113+ (2023), Edge parity
- Firefox 141+ (Windows July 2025), 145+ (macOS Tahoe 26)
- Safari 26+ (September 2025, macOS/iOS/iPadOS/visionOS)
- Global desktop coverage: ~90%+. Mobile: ~70-75%
- Three.js r171+ auto-falls back to WebGL 2 when WebGPU unavailable

Source: [WebGPU Hits Critical Mass](https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/)

## Recommendation

**TSL Compute GPU Particle Nebula via React Three Fiber + Three.js WebGPU**

The `dgreenheck/webgpu-galaxy` repo proves the exact aesthetic at 750,000 particles with Three.js TSL:
- Spiral star arms, alpha-blended dust clouds, spherical starfield background
- Bloom post-processing baked in
- Runs entirely GPU-resident — particles never hit the CPU
- Fallback: `import * as THREE from 'three/webgpu'` auto-falls back to WebGL 2 GLSL via TSL compilation

Key perf facts:
- 100k particles update in <2ms compute time on WebGPU
- 500k particles at 60fps documented on mid-range GPUs
- For a non-interactive background (no mouse forces), 100k–200k is more than sufficient and leaves headroom for the rest of the OS

## Key Architecture

```
three/webgpu import → WebGPURenderer (async init) → falls back to WebGL2
TSL compute shader → instancedArray(N, 'vec3') → SpriteNodeMaterial (AdditiveBlending)
R3F Canvas gl= prop (async factory) → useFrame compute dispatch
Bloom pass: import { bloom } from 'three/tsl'
```

## TSL vs Raw WGSL

TSL is the correct choice for place.org because:
1. Single codebase compiles to both WGSL (WebGPU) and GLSL (WebGL 2 fallback)
2. Three.js handles all renderer abstraction
3. Post-processing pipeline (`bloom`, `fxaa`) uses same node graph — no separate EffectComposer setup
4. Documented R3F integration pattern exists (Wawa Sensei course, Pragmattic blog)

## Sources

- [WebGPU Galaxy repo (dgreenheck) — TSL + 750k particles](https://github.com/dgreenheck/webgpu-galaxy)
- [GPGPU particles TSL pattern — Wawa Sensei](https://wawasensei.dev/courses/react-three-fiber/lessons/tsl-gpgpu)
- [R3F + WebGPU + TSL setup — Pragmattic blog](https://blog.pragmattic.dev/react-three-fiber-webgpu-typescript)
- [Three.js WebGPU migration guide 2026](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)
- [Field Guide to TSL and WebGPU — Maxime Heckel](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [Codrops WebGPU Fluids (ruled out — too heavy)](https://tympanus.net/codrops/2025/01/29/particles-progress-and-perseverance-a-journey-into-webgpu-fluids/)
- [WebGPU compute shader ping-pong pattern](https://medium.com/source-true/webgpu-performance-is-it-what-we-expect-b1c96b1705e1)
- [WebGPU Samples — official particles demo](https://webgpu.github.io/webgpu-samples/samples/particles/)

#webgpu #three-js #visual-effects #place-org #tsl #particles #research
