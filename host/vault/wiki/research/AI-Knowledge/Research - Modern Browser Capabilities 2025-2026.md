---
date: 2026-03-20T00:00:00.000Z
tags:
  - browser
  - web-platform
  - local-first
  - webgpu
  - pwa
  - research
status: active
type: research
wiki_id: research/AI-Knowledge/Research_-_Modern_Browser_Capabilities_2025-2026
imported_from: >-
  vault/Research/AI-Knowledge/Research - Modern Browser Capabilities
  2025-2026.md
imported_at: '2026-04-04T00:23:56.980Z'
summary: ''
---

# Research - Modern Browser Capabilities 2025-2026

> Research question: What cutting-edge browser APIs can power a boundary-pushing, local-first, no-login executive management web app in 2025-2026?

---

## Executive Summary

The browser platform in 2025-2026 has crossed several critical thresholds simultaneously: full-stack local storage with SQLite-over-OPFS, GPU-accelerated ML inference via WebGPU and Gemini Nano, native-app-quality PWA surface area, and cross-browser CSS animation primitives that eliminate most JS animation overhead. An executive management app built today can credibly have zero server dependency for data, run AI features on-device, and animate at 120fps with minimal bundle size.

---

## 1. Storage and Local-First Architecture

### APIs Covered
IndexedDB, OPFS (Origin Private File System), File System Access API, Cache API, Storage Buckets API, SQLite WASM

### Status

| API | Chrome | Firefox | Safari | Edge | Notes |
|-----|--------|---------|--------|------|-------|
| IndexedDB | Full | Full | Full | Full | Baseline |
| OPFS | Full | Full | Full | Full | Baseline since 2023 |
| File System Access | Full | Partial | Partial | Full | User-facing picker only |
| Cache API | Full | Full | Full | Full | Baseline |
| Storage Buckets | Experimental | No | No | Experimental | Chrome-only 2025 |
| SQLite WASM + OPFS | Full | Full | Full | Full | Via wa-sqlite or official build |

### What Is Possible

**OPFS** is the foundation for a true local-first app. Unlike IndexedDB (key-value) and LocalStorage (tiny, synchronous), OPFS provides byte-level random-access file I/O with 3-4x faster throughput than IndexedDB. Critically, it is sandboxed to the origin, survives browser restarts, and is not shared across tabs unless explicitly coordinated.

**SQLite WASM over OPFS** is the state of the art for local-first data. The official SQLite WASM build (from the SQLite project itself) and `wa-sqlite` both support OPFS as a persistent backend. Notion uses this stack and reported 20% improvement in page navigation times after migrating to OPFS-backed SQLite. The combination gives you:
- Full relational queries in the browser
- Persistent across sessions
- Worker-thread isolation (no main-thread blocking)
- Compatible with CRDT sync layers (ElectricSQL, PowerSync, Zero)

**Storage Buckets API** (Chrome experimental) lets you assign eviction priority to storage — critical data buckets survive low-storage pressure while cache buckets get cleaned. Not cross-browser yet, but worth wrapping with a feature check.

**File System Access API** is ideal for letting executives import/export `.csv` files, `.json` exports, or drag-and-drop documents directly into the app — all without any upload server.

### Exec App Use Case

A local-first exec management app can store the entire dataset — goals, decisions, contacts, OKRs, board notes — in SQLite WASM, backed by OPFS. No login. No sync server needed for single-user. Optional sync via ElectricSQL (Postgres-backed) or PowerSync if you ever want multi-device.

### Key Libraries

| Library | Purpose | Status |
|---------|---------|--------|
| `wa-sqlite` | SQLite WASM + OPFS + IndexedDB backends | Active, production |
| `@sqlite.org/sqlite-wasm` | Official SQLite WASM | Beta, stable enough |
| `RxDB` (OPFS storage) | Reactive database on top of OPFS | Production |
| `TanStack DB` (2025) | Local-first reactive store | New, growing |
| `LiveStore` (2024) | Event-sourced local store | Emerging |

### Sources
- [Origin Private File System — MDN](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
- [OPFS — web.dev](https://web.dev/articles/origin-private-file-system)
- [RxDB OPFS Storage](https://rxdb.info/rx-storage-opfs.html)
- [SQLite WASM in the browser backed by OPFS — Chrome Developers](https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system)
- [SQLite Persistence on the Web: November 2025 Update — PowerSync](https://www.powersync.com/blog/sqlite-persistence-on-the-web)
- [ElectricSQL vs PowerSync](https://www.powersync.com/blog/electricsql-vs-powersync)
- [Awesome Local-First](https://github.com/alexanderop/awesome-local-first)

---

## 2. AI in the Browser

### APIs Covered
Chrome Built-in AI (Gemini Nano), WebNN API, TensorFlow.js, ONNX Runtime Web, Transformers.js, WebLLM

### Status

| API/Library | Chrome | Firefox | Safari | Edge | Notes |
|-------------|--------|---------|--------|------|-------|
| Chrome Built-in AI (Prompt API) | Chrome 127+ | No | No | No | Chromium-only |
| Gemini Nano CPU support | Chrome 140+ | No | No | No | Rolling out |
| WebNN API | Experimental | Experimental | No | Experimental | Behind flag most places |
| TensorFlow.js (WebGPU backend) | Full | Full | Full (v26+) | Full | All backends |
| ONNX Runtime Web (WebGPU) | Full | Full | Full (v26+) | Full | Production |
| Transformers.js | Full | Full | Full | Full | Hugging Face, all backends |
| WebLLM (LLM via WebGPU) | Full | Full | Partial | Full | Large models, client-side |

### What Is Possible

**Chrome Built-in AI / Gemini Nano** ships inside Chrome 127+ with a JavaScript API. Available APIs: Prompt API (multimodal: text, image, audio input), Summarizer API, Translator API, Writer API, Rewriter API, Proofreader API. These work entirely client-side — no API key, no network call, no cost per token. CPU inference rolls out in Chrome 140, expanding beyond GPU-only devices to Linux, macOS, and Windows broadly.

The browser connects to a local model on the device's CPU/GPU/NPU via the browser's AI runtime (LiteRT-LM). Privacy-preserving by design — data never leaves the device.

**WebNN API** (Web Neural Network) provides hardware-accelerated ML across CPUs, GPUs, and NPUs. It is the low-level substrate that Chrome's built-in AI uses. Direct WebNN usage is mostly for framework authors, not app developers.

**ONNX Runtime Web** is the most production-ready option for running arbitrary ML models in the browser. Supports WebGPU backend (20x speedup vs. multithreaded CPU; 550x vs. single-threaded on some tasks). Models are quantized to 4-bit or 8-bit for practical browser use.

**Transformers.js** (Hugging Face) is the highest-level option: same API as Python transformers, runs entirely in browser. Supports text classification, embeddings, NER, translation, summarization, and more.

### Exec App Use Cases

- **Summarize meeting notes or long documents** — Chrome Summarizer API or Transformers.js
- **Semantic search across local data** — embedding model (all-MiniLM-L6-v2) via Transformers.js, vectors stored in OPFS
- **Voice commands / dictation** — Web Speech API (recognition) feeding into local AI for intent parsing
- **Auto-categorize decisions, goals, contacts** — classification model, zero server calls
- **Translate exec communications** — Chrome Translator API

### Performance Reality Check

- Small models (embedding, classification, <100M params): practical on any modern device
- 7B+ LLMs (via WebLLM): 8-12 token/s on M2 MacBook, 3-5 token/s on mid-range PC — usable for batch tasks, not real-time chat
- Initial model load: 100MB–4GB depending on model size — cache in OPFS after first load

### Sources
- [Chrome Built-in AI — Chrome Developers](https://developer.chrome.com/docs/ai/built-in)
- [AI on Chrome — Chrome Developers](https://developer.chrome.com/docs/ai)
- [Gemini Nano CPU Support — Chrome Developers Blog](https://developer.chrome.com/blog/gemini-nano-cpu-support)
- [Client-Side AI in 2025 — Medium](https://medium.com/@sauravgupta2800/client-side-ai-in-2025-what-i-learned-running-ml-models-entirely-in-the-browser-aa12683f457f)
- [AI In Browser With WebGPU: 2025 Developer Guide](https://aicompetence.org/ai-in-browser-with-webgpu/)
- [WebGPU for On-Device AI Inference — 2025](https://makitsol.com/webgpu-for-on-device-ai-inference/)

---

## 3. Advanced Graphics

### APIs Covered
WebGPU, CSS Houdini, View Transitions API, Scroll-Driven Animations, CSS Anchor Positioning

### Status

| API | Chrome | Firefox | Safari | Edge | Notes |
|-----|--------|---------|--------|------|-------|
| WebGPU | v113+ | v141+ (Windows) | Safari 26 Beta | v113+ | Critical mass reached Nov 2025 |
| CSS Paint Worklet (Houdini) | Full | No | No | Full | Chromium-only native |
| CSS Properties & Values (@property) | Full | Full | Full | Full | Baseline |
| View Transitions (SPA) | Full | v144+ | Full | Full | Baseline Newly Available |
| View Transitions (cross-doc MPA) | Full | v144+ | Partial | Full | Interop 2026 focus |
| Scroll-Driven Animations | Full | Partial | Full | Full | Chromium + Safari |
| CSS Anchor Positioning | Full | Experimental | Experimental | Full | Interop 2026 focus |

### WebGPU

WebGPU is not just WebGL's successor — it exposes modern GPU compute shaders (WGSL), explicit memory management, and pipeline state objects, matching what native Vulkan/Metal/D3D12 offer. Use cases for an exec app:

- **Custom chart rendering** — ChartGPU handles 1M+ data points at 60fps using WebGPU compute shaders. Viable for rendering large KPI grids, timeline charts, heat maps
- **Background compute** — Offload data processing (ranking algorithms, scoring, analytics) to GPU compute shaders
- **Visual effects** — Particle systems, fluid simulations, mesh gradients without CPU overhead

WebGPU performance benchmarks: 3-4x faster token generation vs. WebGL for LLM inference; 20x over multithreaded WASM CPU.

### CSS Houdini

**Paint Worklets** — draw custom CSS backgrounds in JavaScript, running off-main-thread. Best cross-browser approach uses the [CSS Paint Polyfill](https://github.com/GoogleChromeLabs/css-paint-polyfill). Use cases: custom shimmer/skeleton loaders, data-driven background patterns, animated borders without SVG.

**`@property` (CSS Custom Properties Level 5)** — Baseline across all browsers. Allows registering typed custom properties with `inherits`, `initial-value`, and `syntax`. Enables animating custom properties (e.g., animating a gradient stop position via CSS transitions — impossible without `@property`).

**Layout Worklets** — define custom layout algorithms (masonry, deck, etc.). Chrome Canary only, not production-ready.

### View Transitions

View Transitions API enables seamless, animated page transitions in SPAs and now MPAs (cross-document). A focus area of both Interop 2025 and 2026. In 2026, Chrome 142 changes `::view-transition` pseudo from `position: fixed` to `position: absolute`, enabling scroll-aware transitions.

For an exec app: full-page section transitions (dashboard → detail view → modal) with 0 lines of animation JS. Just name the elements with `view-transition-name` and the browser handles the morph.

### Scroll-Driven Animations

`@scroll-timeline` and `animation-timeline: scroll()` let you drive any CSS animation from scroll position — entirely on the compositor thread (no JS). Chromium and Safari ship this; Firefox support is landing. Use cases: progress indicators tied to scroll, parallax effects, sticky headers that morph, KPI cards that reveal on scroll.

### CSS Anchor Positioning

Position tooltips, popovers, dropdowns precisely relative to any anchor element — no JS calculations. Interop 2026 focus area. Pair with a `position: absolute` fallback for now. Critical for a data-dense exec dashboard where context menus must align to specific cells.

### Sources
- [WebGPU API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [WebGPU Hits Critical Mass — webgpu.com](https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/)
- [WebGPU vs WebGL Inference Benchmarks — SitePoint](https://www.sitepoint.com/webgpu-vs-webgl-inference-benchmarks/)
- [What's New in View Transitions 2025 — Chrome Developers](https://developer.chrome.com/blog/view-transitions-in-2025)
- [CSS Houdini — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Houdini_APIs)
- [Scroll-Driven Animations — WebExpo](https://webexpo.net/blog/scroll-driven-animations-with-css-performance-focused-web-interactivity/)
- [CSS Features 2025 — Riad Kilani](https://blog.riadkilani.com/css-features-2025/)

---

## 4. Performance

### APIs Covered
Web Workers, SharedArrayBuffer + Atomics, WebAssembly, Scheduler API, Navigation API

### Status

| API | Chrome | Firefox | Safari | Edge | Notes |
|-----|--------|---------|--------|------|-------|
| Web Workers | Full | Full | Full | Full | Baseline |
| SharedArrayBuffer | Full (COOP/COEP required) | Full | Full | Full | Cross-origin isolation required |
| WebAssembly 3.0 | Full | Full | Full | Full | GC, threads, SIMD, Memory64 |
| WASM Threads | Full | Full | Full | Full | Requires SharedArrayBuffer |
| `scheduler.postTask()` | Full | Full | Full | Full | Priority task scheduling |
| `scheduler.yield()` | Chrome (March 2025) | Experimental | Experimental | Chrome | Baseline in progress |
| Navigation API | Baseline Newly Available (early 2026) | Full | Full | Full | Replaces `history` API |

### WebAssembly 3.0

As of late 2025, WASM 3.0 ships in all major browsers with: GC (garbage collection), threads (via SharedArrayBuffer), Memory64, SIMD, and exception handling. This enables near-native computation in the browser. Practical use cases for an exec app:

- Compile Rust/Go/C++ analytics kernels to WASM for sub-millisecond data processing
- Run SQLite (a C library) as a WASM module — this is exactly how SQLite WASM works
- Cryptography, compression, and data serialization at native speeds

### SharedArrayBuffer and True Parallelism

SharedArrayBuffer + Atomics API enables multiple Web Workers to share memory and coordinate via locks. Requires cross-origin isolation (`COOP: same-origin` + `COEP: require-corp` headers). This is the only mechanism for true multi-core parallelism in the browser. Use for: parallel data processing, background analytics, ML inference.

### Scheduler API

`scheduler.postTask()` accepts priority (`user-blocking`, `user-visible`, `background`) and a signal for cancellation. `scheduler.yield()` (Chrome, March 2025) lets long tasks voluntarily yield back to the browser, preventing input jank. Critical pattern for any data-heavy exec dashboard where large operations should not block user interaction.

### Navigation API

Became Baseline Newly Available (early 2026). Replaces the `history.pushState()` patchwork with a proper semantic model. Gives SPAs a native way to intercept navigations, scroll restoration, and transition logic. Integrates naturally with View Transitions API.

### Sources
- [SharedArrayBuffer — Medium](https://medium.com/@jacobscottmellor/sharedarraybuffer-the-hidden-super-primitive-thats-reshaping-the-future-of-webassembly-net-e369e667f6e9)
- [State of WebAssembly 2025-2026 — platform.uno](https://platform.uno/blog/the-state-of-webassembly-2025-2026/)
- [scheduler.yield() — Chrome Developers](https://developer.chrome.com/blog/use-scheduler-yield)
- [Navigation API — Chrome Developers](https://developer.chrome.com/docs/web-platform/navigation-api)
- [Navigation API Now Baseline — web.dev](https://web.dev/blog/baseline-navigation-api)

---

## 5. Notifications and Background

### APIs Covered
Background Sync, Periodic Background Sync, Push API, Notification API

### Status

| API | Chrome | Firefox | Safari | Edge | Notes |
|-----|--------|---------|--------|------|-------|
| Push API | Full | Full | iOS 16.4+ | Full | All modern browsers |
| Notification API | Full | Full | Full | Full | Requires permission |
| Background Sync | Chrome/Edge/Android | In development | Experimental | Chrome/Edge | Not yet standardized |
| Periodic Background Sync | Chrome/Edge | No | No | Chrome/Edge | Chromium-only |

### What Is Possible

For a **no-login local-first app**, push notifications require a server (push endpoint). However, the **Notification API** works entirely locally — show notifications triggered by the app logic (e.g., "Board meeting in 30 min", "Goal review overdue"). No server needed.

**Background Sync** is useful if you add optional cloud sync later — queues failed sync attempts and retries when connectivity returns.

**Periodic Background Sync** (Chromium) lets the PWA refresh data on a schedule (e.g., pull latest from a shared calendar) even when the app is closed. Requires the PWA to be installed and the user to have engaged with it (browser heuristic). Not suitable as a primary feature but useful as an enhancement.

### Exec App Use Cases

- Local Notification API for deadlines, reminders, review cycles — no server required
- Service Worker can schedule notifications using the Notification Triggers API (Chrome experimental)
- Background Sync for graceful deferred writes if optional sync is added

### Sources
- [Offline and Background Operation — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [Periodic Background Sync — Chrome Developers](https://developer.chrome.com/docs/capabilities/periodic-background-sync)
- [Background Sync APIs — Progressier](https://progressier.com/pwa-capabilities/background-sync)

---

## 6. Hardware Access

### APIs Covered
Web Bluetooth, Web USB, Web Serial, Web NFC, Gamepad API, Ambient Light Sensor

### Status

| API | Chrome | Firefox | Safari | Edge | Notes |
|-----|--------|---------|--------|------|-------|
| Web Bluetooth | Full | No | No | Full | Chromium-only |
| Web USB | Full (81% global) | No | No | Full | Chromium-only |
| Web Serial | Full | No | No | Full | Chromium-only |
| Web NFC | Chrome Android | No | No | No | Android Chrome only |
| Gamepad API | Full | Full | Full | Full | Baseline |
| Ambient Light Sensor | Chromium | No | No | Chromium | Behind Permissions Policy |

### Executive App Relevance

Honest assessment: hardware APIs are low-relevance for a management app. However, a few creative angles exist:

- **Gamepad API** — repurpose a Bluetooth controller as a presentation remote or rapid-navigation device (next meeting, previous, approve). Zero latency, works offline.
- **Web Bluetooth** — pair with a smart whiteboard or presenter clicker for seamless room-switching
- **Web Serial / USB** — connect a physical status board (e.g., a ePaper display on a desk showing today's agenda)
- **Ambient Light Sensor** — auto-switch app to dark mode in dim board rooms

All hardware APIs are HTTPS-only and require explicit user gestures to request access.

### Sources
- [Web Bluetooth / Serial / USB / NFC — web.dev Capabilities](https://web.dev/learn/pwa/capabilities)
- [Web NFC Browser Support — webnfc.org](https://www.webnfc.org/documentation/browser-support)
- [WebUSB — Can I use](https://caniuse.com/webusb)

---

## 7. PWA Capabilities

### APIs Covered
Window Controls Overlay, File Handling API, Protocol Handlers, App Shortcuts, Badging API

### Status

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| Window Controls Overlay | Full | No | No | Full | Chromium + Chromium-based Edge |
| File Handling API | Full (desktop) | No | No | Full | Desktop Chromium only |
| Protocol Handlers | Full | Partial | No | Full | `web+` schemes |
| App Shortcuts | Full | No | Partial | Full | Via manifest `shortcuts` |
| Badging API | Full | No | Full (iOS 16.4+) | Full | Most installed PWA contexts |
| Share Target | Full | No | Full | Full | Receive OS shares into app |

### What Is Possible

**Window Controls Overlay** is a significant UX differentiator. It removes the browser chrome title bar from an installed PWA and lets the web content render into that space, with OS window controls (close/minimize/maximize) floating as an overlay. Result: the app looks and feels like a native Electron app without Electron's overhead. Available in Chrome/Edge desktop.

**File Handling API** registers the PWA as the OS handler for specific file types. Double-clicking a `.execplan` or `.boardnote` file in Finder/Explorer opens your app directly.

**App Shortcuts** add right-click context menu items to the installed PWA icon: "New Goal", "Today's Briefing", "Board Dashboard". Defined in `manifest.json`.

**Badging API** puts a numeric badge on the app icon (unreviewed items, overdue goals) — works on iOS 16.4+ and Android.

**Share Target** lets other apps share content into your exec app (share an article from Chrome to your reading list, share a contact, etc.).

### Exec App Use Cases

An installed PWA with Window Controls Overlay effectively delivers a native desktop experience. The combination of WCO + file handling + shortcuts makes the gap between "web app" and "native app" imperceptible to an executive user.

### Sources
- [Window Controls Overlay — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API)
- [File Handling — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Associate_files_with_your_PWA)
- [Protocol Handlers — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/protocol_handlers)
- [PWA Features on ChromeOS — chromeos.dev](https://chromeos.dev/en/posts/features-to-take-full-advantage-of-pwa-installation)

---

## 8. Novel Interactions

### APIs Covered
Pointer Lock, Keyboard Lock, Screen Wake Lock, Web Speech API (recognition + synthesis), Vibration API

### Status

| API | Chrome | Firefox | Safari | Edge | Notes |
|-----|--------|---------|--------|------|-------|
| Pointer Lock | Full | Full | Full | Full | Baseline |
| Keyboard Lock | Full | No | No | Full | Chromium-only |
| Screen Wake Lock | Full | Full | Full | Full | Baseline, all browsers March 2025 |
| Web Speech Recognition | Chrome/Edge | Experimental | Full | Chrome/Edge | Safari speech recognition needs evaluation |
| Web Speech Synthesis | Full | Full | Full | Full | Baseline |
| Vibration API | Chrome/FF/Android | Full (Android) | No | Chrome | Not on iOS |

### What Is Possible

**Screen Wake Lock** — prevents the screen from dimming during a presentation or meeting review. Now Baseline (all browsers, March 2025). Simple API: `navigator.wakeLock.request('screen')`. Critical for an exec who puts the app on a screen during a board meeting.

**Web Speech Recognition** — hands-free voice navigation and dictation. Speak "show Q3 goals" or dictate notes directly into the app without touching the keyboard. Chrome and Edge send audio to Google's servers by default — important privacy consideration for exec data. Safari's implementation may be on-device; needs verification.

**Web Speech Synthesis** — read back summaries, briefings, alerts while the exec drives or walks between meetings. High-quality neural voices available on modern OS.

**Keyboard Lock** — in fullscreen mode, captures keys normally reserved by the OS (Escape, Cmd+Tab, etc.) for app use. Enables true kiosk-mode presentation experience.

**Pointer Lock** — lock cursor to a region. Useful for implementing custom drag behaviors, panoramic data navigation (drag to pan across a large timeline), or presentation pointer modes.

### Sources
- [Screen Wake Lock — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Screen Wake Lock Now in All Browsers — web.dev](https://web.dev/blog/screen-wake-lock-supported-in-all-browsers)
- [Web Speech API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)
- [21 Native Browser APIs You Might Not Have Used — DEV Community](https://dev.to/lingodotdev/21-native-browser-apis-you-might-not-have-used-before-1nbp)

---

## 9. Cutting-Edge Platform Features

### APIs Covered
WebTransport, Speculation Rules API, Cross-Document View Transitions, Popover API, CSS `@scope`, CSS `@layer`

### Status

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| WebTransport | Full | No | No | Full | HTTP/3, Chromium-only |
| Speculation Rules | Full | No | No | Full | Chromium-only, Interop 2026 |
| Cross-Doc View Transitions | Full | v144+ | Partial | Full | Interop 2026 focus |
| Popover API (`auto`) | Full | Full | Full | Full | Baseline |
| Popover `hint` type | Experimental | No | No | Experimental | New subtype |
| CSS `@scope` | Full | Full | Full | Full | Interop 2025 result — cross-browser |
| CSS `@layer` | Full | Full | Full | Full | Baseline |

### Interop 2026 Context

Interop 2026 (announced February 2026, run by Apple/Google/Microsoft/Mozilla/Igalia) defines 20 focus areas across all browsers. Key areas for this app:

- Cross-document view transitions (MPA transitions without JS)
- CSS anchor positioning
- Dialog/Popover improvements (`closedby`, `:open` pseudo-class, `popover="hint"`)
- WebTransport
- Container style queries

### WebTransport

Low-latency bidirectional communication over HTTP/3 (QUIC). Multiple concurrent streams, optional ordering, datagrams. Chromium-only in 2026. Relevant if the app ever adds real-time collaboration — faster and more flexible than WebSockets.

### Speculation Rules API

Declare page prefetch/prerender rules in JSON so the browser can speculatively load the next likely navigation before the user clicks. Dramatically reduces perceived navigation latency in MPAs. Defined in `<script type="speculationrules">`. Not relevant for pure SPAs.

### CSS @scope and @layer

Both are Baseline and production-ready. `@scope` limits selector specificity to a subtree — eliminates the need for BEM or CSS Modules in many cases. `@layer` gives explicit control over cascade ordering — makes design system tokens and utility classes coexist without specificity battles.

### Popover API

The `popover` attribute creates native browser-managed popovers with automatic light-dismiss, focus management, and top-layer promotion — no JS positioning needed for basic cases. Combine with CSS anchor positioning for fully positioned popovers.

### Sources
- [Interop 2026 — web.dev](https://web.dev/blog/interop-2026)
- [Launching Interop 2026 — Mozilla Hacks](https://hacks.mozilla.org/2026/02/launching-interop-2026/)
- [Speculation Rules API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API)
- [Speculation Rules Improvements — Chrome Developers](https://developer.chrome.com/blog/speculation-rules-improvements)
- [What's New in View Transitions 2025 — Chrome Developers](https://developer.chrome.com/blog/view-transitions-in-2025)
- [Scoped View Transitions — Chrome Developers](https://developer.chrome.com/blog/scoped-view-transitions-feedback)
- [Interop 2026 Focus Areas — Igalia](https://www.igalia.com/news/interop-2026.html)

---

## 10. Spatial and 3D

### APIs Covered
WebXR, Three.js, React Three Fiber (R3F), Motion (formerly Framer Motion), GSAP

### Status

| Library/API | Version | Stars | Notes |
|-------------|---------|-------|-------|
| WebXR | W3C Working Draft | — | Chrome, Firefox, Oculus Browser |
| Three.js | r170+ | 100k+ | Stable, active |
| React Three Fiber | v9 | 27k+ | Stable |
| `@react-three/xr` | v6.6.29 | 2k+ | VR/AR via WebXR + R3F |
| Motion (Framer Motion) | v12.37.0 | 24k+ | Fastest growing animation lib |
| GSAP | v3.x | 19k+ | Professional-grade, minimal bundle |

### WebXR

WebXR Device API enables VR (immersive-vr) and AR (immersive-ar) sessions. Browser support: Chrome desktop/Android, Firefox, Oculus Browser. Not relevant for most exec app interactions but could power:

- A 3D spatial data visualization mode (view OKRs as 3D nodes in a graph)
- VR meeting room (speculative future use)
- AR overlay on a physical whiteboard (Chrome Android, WebXR AR)

### React Three Fiber and Three.js

R3F is a React renderer for Three.js. The `@react-three/xr` package at v6 provides clean XR integration. The broader pmndrs ecosystem (Drei, Rapier physics, React Spring for R3F) makes building 3D scenes within a React app practical.

For an exec app, 3D is most useful for: animated data visualization (spinning globe for geo-distributed teams, 3D org chart, network graph), immersive fullscreen transitions, and brand/identity moments.

### Motion (formerly Framer Motion)

Version 12.x. Motion is built on **Web Animations API (WAAPI)** and **Scroll Timeline**, enabling hardware-accelerated animations for `transform`, `filter`, and `opacity` with a minimal footprint. Bundle: ~32KB gzipped. Directly integrates with React. Growing faster than any other animation library in the ecosystem as of 2025.

Key 2025 features: `motion()` component works with any HTML/SVG element, `useAnimate()` for imperative animations, scroll-linked animations via `useScroll`, layout animations that automatically interpolate between DOM positions.

### GSAP

23KB gzipped core. Plugin-based (ScrollTrigger, Draggable, SplitText, MorphSVG). Handles thousands of simultaneous tweens without frame loss. GSAP is the choice for complex timeline-based animations, scroll storytelling, and marketing-grade motion. For a data-dense exec app, Motion's React integration is usually more ergonomic than GSAP's imperative API.

### Sources
- [Building 3D Web Apps in 2025 — GitNation](https://gitnation.com/contents/building-3d-web-apps-in-2025-react-xr-and-ai)
- [react-three/xr — npm](https://www.npmjs.com/package/@react-three/xr)
- [pmndrs/xr — GitHub](https://github.com/pmndrs/xr)
- [GSAP vs Motion — motion.dev](https://motion.dev/docs/gsap-vs-motion)
- [Motion — motion.dev](https://motion.dev/)
- [Framer Motion vs GSAP — Semaphore](https://semaphore.io/blog/react-framer-motion-gsap)

---

## Synthesis: What to Build With

Based on all research, here is the recommended capability set for a local-first executive management PWA in 2026:

### Tier 1 — Production-Ready, Use Immediately

| Capability | Technology | Why |
|-----------|-----------|-----|
| Local database | SQLite WASM + OPFS via `wa-sqlite` | 3-4x faster than IndexedDB, full SQL, persistent |
| PWA installation | Service Worker + manifest | Window Controls Overlay for native-app feel |
| Page transitions | View Transitions API | Zero JS animation cost, native browser morphs |
| GPU-accelerated charts | WebGPU via custom renderer or ChartGPU | 1M+ data points at 60fps |
| CSS animations | Scroll-Driven Animations + `@property` | Compositor-thread, no JS cost |
| Modern CSS | `@scope`, `@layer`, anchor positioning | Clean specificity, native tooltips |
| React animation | Motion v12 | WAAPI-backed, smallest footprint |
| Popovers/tooltips | Popover API | Native light-dismiss, focus trap |
| Wake lock | Screen Wake Lock API | Critical for meeting/presentation mode |

### Tier 2 — High Value, Chromium-First

| Capability | Technology | Why |
|-----------|-----------|-----|
| On-device AI | Chrome Built-in AI (Gemini Nano) | Summarize, translate, write — no API key |
| File import/export | File System Access API | Native file picker, no server upload |
| PWA shortcuts + badges | App Shortcuts + Badging API | OS-level entry points |
| Window Controls Overlay | WCO API | Title-bar content area for branding/nav |
| Task priorities | Scheduler API (`postTask`, `yield`) | Prevent jank on data-heavy operations |
| SPA navigation | Navigation API | Replaces history.pushState patchwork |

### Tier 3 — Enhanced, With Fallbacks

| Capability | Technology | Fallback |
|-----------|-----------|---------|
| ML inference (cross-browser) | Transformers.js + ONNX Runtime Web | Server-side API call |
| Voice commands | Web Speech API | Text input |
| 3D visualization | React Three Fiber + WebGPU | 2D SVG/Canvas |
| Real-time collaboration | WebTransport | WebSocket |
| Periodic sync | Periodic Background Sync | On-open sync |

---

## Confidence Assessment

| Claim | Confidence | Source Count |
|-------|-----------|-------------|
| OPFS + SQLite WASM production-ready | High | 6+ sources |
| WebGPU in all major browsers 2025 | High | 4+ sources |
| Chrome Built-in AI (Gemini Nano) shipping Chrome 127+ | High | 5+ sources |
| View Transitions Baseline 2025 | High | 3+ sources |
| Screen Wake Lock Baseline March 2025 | High | 3+ sources |
| Navigation API Baseline early 2026 | High | 2 sources |
| CSS @scope cross-browser (Interop 2025 result) | High | 2 sources |
| Periodic Background Sync Chromium-only | High | 3+ sources |
| Web Bluetooth/USB/Serial Chromium-only | High | 3+ sources |
| WebTransport Chromium-only 2026 | Medium | 2 sources |

---

## Related Notes

- [[My Stack Decisions]]
- [[Research - Self-Hosted AI Agent Platforms 2026]]

#browser #web-platform #local-first #pwa #webgpu #research #ai-in-browser
