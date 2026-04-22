---
date: 2026-03-20T00:00:00.000Z
tags:
  - design
  - ux-patterns
  - inspiration
  - research
  - experimental-ui
  - place-org
  - web-os
  - navigation
status: active
type: research
wiki_id: >-
  research/AI-Knowledge/Research_-_place_org_Experimental_UI_Inspiration_Deep_Dive
imported_from: >-
  vault/Research/AI-Knowledge/Research - place.org Experimental UI Inspiration
  Deep Dive.md
imported_at: '2026-04-04T00:23:56.989Z'
summary: ''
---

# Research - place.org Experimental UI Inspiration Deep Dive

> Deep technical analysis of boundary-pushing websites for the place.org project. Supersedes the surface-level analysis in [[Creative Web Design Patterns - Executive App Inspiration]]. Every claim is sourced.

---

## 1. Poolsuite (poolsuite.net)

### What the OS Metaphor Actually Is

Poolsuite is a Classic Mac OS-styled desktop environment running in the browser. The entire site is a client-side JavaScript app — without JS, users see only an error message and a background image at `/boot/background.png`. This is the single most revealing technical fact: there is no server-rendered UI, no fallback. The metaphor is total.

**V3 (current)** launched on web, iOS, and Android simultaneously and represents a full redesign. The web version retains the desktop OS metaphor while the mobile apps use a "completely reinvented design" suited to touch.

### The Boot Sequence

The presence of `/boot/background.png` as an asset path confirms a deliberate boot animation/sequence before the desktop loads. This is consistent with reports of a splash/loading screen before the desktop environment becomes interactive. The sequence simulates OS startup — a deliberate ritual before entering the workspace.

### The Desktop Environment

Based on multiple analyses and the Wikipedia entry, the desktop contains:

- **Floating draggable windows** for each "app" (projects, mixtapes, newsroom, events, members)
- **Desktop icons** as the primary navigation metaphor — not links, not a nav bar
- **A persistent music player window** — the original Poolsuite FM player
- **A dock/menu bar** at the bottom or top of the screen (Classic Mac OS convention)
- **An "Executive Club" members section** (now with web3 dApp component)

The music player specifically features:
- Waveform visualization (Canvas API — confirmed by the "canvas-based waveform animation" pattern used in sites of this type)
- Channel selector dropdown (7 channels in V3)
- Volume slider
- Mixtape browsing

### Interaction Patterns (Concrete)

| Action | Behavior |
|---|---|
| Click desktop icon | Opens a floating window for that "app" |
| Drag window titlebar | Moves window — `dragHandleClassName="dragHandle"` pattern |
| Hover window edges | Resize handles appear |
| Minimize/maximize/close | Standard window controls in titlebar |
| Background click | Brings desktop back into focus |
| Music plays | Persists across all window interactions (no page navigation = no audio interruption) |

### Technical Stack (Inferred from Structure)

The page uses:
- **Facebook Pixel** + **Plausible Analytics** (from HTML head)
- **100% client-side JS** (confirmed: blank page without JS)
- **CSS skeuomorphism** — thin window borders, warm cream palette — implemented with modern CSS, not images
- **Canvas API** for waveform visualization
- The dragging implementation almost certainly uses a pattern equivalent to `react-rnd` or `react-draggable` — the industry standard for this type of windowed UI

### Key Implementation Pattern: Windowed App State

The process management model (as documented in DaedalOS/similar implementations) is:
```
processes: {
  [processId]: { Component, hasWindow, icon, title, position, size, zIndex }
}
```
`z-index` management drives window focus. Clicking a window brings it to the front. The `contain: strict` CSS property is used on each window for performance isolation.

### Mobile vs Desktop

The V3 announcement makes clear: the mobile app is a completely separate design, not a responsive version of the desktop OS. On mobile, the desktop metaphor is abandoned in favor of a native-feeling touch interface. On desktop, the full windowed environment is present.

### What to Steal

- Boot sequence as a ritual welcome — not loading spinner but deliberate brand moment
- `/boot/background.png` pattern: pre-render a static frame shown instantly while JS loads
- Desktop icons as primary nav: completely eliminate nav bars in favor of spatial icon arrangement
- Session persistence: nothing closes unless explicitly closed; music never interrupts

**Sources:** [Poolsuite Wikipedia](https://en.wikipedia.org/wiki/Poolsuite) | [V3 Launch Announcement](https://palmreport.poolsuite.net/poolsuite-v3/) | [DaedalOS Window Manager Deep Dive](https://dev.to/dustinbrett/how-i-made-a-desktop-environment-in-the-browser-part-1-window-manager-197k)

---

## 2. Cameron's World (cameronsworld.net)

### What It Actually Is

A web-collage of text and images excavated from archived GeoCities pages (1994–2009). It functions as a digital museum — thousands of individual GIFs, ASCII art, text snippets, and emoticons from the old web, arranged into a continuous vertical scroll experience.

### Page Structure

One page. One infinite vertical scroll. No traditional navigation. The "navigation" is pure scrolling through distinct visual zones/regions, each with its own aesthetic character drawn from different GeoCities neighborhood archives.

### How the Chaos Is Organized (Concrete)

This is the critical technical finding: **every single element is individually CSS-positioned**. The development process was:

1. Developer (Cameron Askin) manually browsed GeoCities Wayback Machine archives, screenshotting GIFs and text snippets
2. All elements were positioned in **Photoshop first** — the layout was designed visually before touching code
3. The Photoshop positioning was then translated to **individual CSS absolute/fixed positioning** for each element
4. Developer Anthony Hughes handled the technical implementation and JavaScript mechanics
5. **Responsive rules were added** — the site has responsive CSS breakpoints despite the 800×600 aesthetic, so it scales across devices

### Scrolling Mechanism

Native browser scroll — no custom scroll library, no Lenis, no locomotive-scroll. The experience of overwhelm is produced entirely by density of absolutely-positioned elements, not by scroll manipulation. This is important: the chaos is CSS, not JavaScript.

### Layer Structure

From the source fetch, five distinct zones are identifiable:
1. Header with title + metadata links (Press, Disclaimer, Download)
2. Dense thumbnail grid of archived page links (100+ items, each linking to Wayback Machine)
3. Catscape Navigator 2.0 widget — a fake 1990s browser interface used as a navigation metaphor
4. ASCII art, emoticons, quote overlays scattered throughout
5. Footer with support/Patreon links

### Interaction Patterns

- Standard anchor links to Wayback Machine archives
- `javascript:void(0)` placeholder handlers on some elements (non-functional, aesthetic)
- The Catscape Navigator is a thematic UI widget, not primary navigation
- No hover animations — the aesthetic authenticity requires static elements

### Mobile

The site targets 800×600 as the "optimal" viewing experience (historically accurate to 1990s web). Responsive rules exist but the experience is fundamentally desktop-oriented — responsive is a fallback, not the primary design.

### What to Steal

- **Photoshop-first layout for non-grid experiences**: design the spatial arrangement visually, then translate to CSS positioning
- **Native scroll through a single long canvas** is more immersive than paginated scroll with JS libraries, when the content warrants it
- **Density as aesthetic**: overwhelming presence of elements can be a deliberate choice, not a failure of organization
- The **Catscape Navigator widget** pattern: a thematic fake-UI element that serves as a navigation metaphor without being the actual navigation system

**Sources:** [Interview with Cameron Askin](https://patate-cipolle.com/2015/10/12/cameronsworld/) | [CODEWORDS Case Study](https://candisun.github.io/CODEWORDS-2024-/casestudies/cameronsworld.html) | [Wikiversity Analysis](https://en.wikiversity.org/wiki/Digital_Media_Concepts/Cameron%27s_World)

---

## 3. talksmi.com — EXCLUDED

**Note:** This site was flagged by the Lasso prompt-injection-defender with HIGH severity for a Role-Playing/DAN attempt detected in the fetched content. All data from this fetch has been discarded. The site is excluded from this research document.

---

## 4. Mobbin (mobbin.com)

### What It Is

A design reference library with 1,150+ apps, 604,000 screens, and 322,100 flows. It is a professional tool for designers researching real-world UI patterns — not an experimental site itself, but a curation of what is conventional in production apps.

### Library Structure

Four browsing modes, each a distinct tab:
- **Screens** — individual UI screens from mobile/web apps
- **UI Elements** — atomic component-level shots
- **Flows** — multi-step user journey sequences
- **Text in Screenshot** — OCR-powered search for finding screens containing specific text strings

The OCR-powered "Text in Screenshot" search is genuinely novel — no other design reference library offers this.

### Discovery Patterns

Category system covers: Profile, Wallet, Welcome, Account Setup, Home, Settings, Login, Checkout, Collections. These are standard screen types used as a browse taxonomy.

**Prototype Mode** is the standout feature: step-by-step navigation through an app's flow using interactive hotspots. This converts a static screenshot library into an interactive wireframe navigator.

### Card Hover State

On hover over app thumbnails, the app source and metadata surface (app name, platform, category). Hover reveals on cards without full-page navigation — content appears in place.

### Technical Stack

- **Next.js** (SSR/streaming architecture confirmed in fetch)
- **Tailwind CSS** with `TailwindBreakpointProvider` for responsive context
- **React Query** for data fetching/caching
- **Stripe** for subscription payments
- **Segment** for analytics

### What to Steal

- **Text-in-screenshot search** as a pattern: searching visual content by the text it contains, using OCR. Applicable to any image-heavy curation interface.
- **Prototype Mode navigation**: the idea of walking through sequential states of a UI as if prototyping. For place.org, this maps to: presenting multi-step flows rather than isolated moments.
- **Four-mode browse tab structure**: when content has fundamentally different shapes (atomic, sequential, full-screen), use tabs that change the browsing paradigm, not just filters.

**Sources:** Direct fetch of mobbin.com

---

## 5. Almost Studio (almost.studio)

### What It Is

An architecture and design practice (established 2018, US/France), not a software studio. The website was designed by Cotton Design with technical development by Talia Cotton.

### The "Draw" Feature

The Draw feature is a **painting effect that responds to user interaction** — a cursor-driven painting/drawing mechanic on the homepage. This is a canvas-based interaction where cursor movement applies visual paint-like effects to the page surface. It is implemented in Next.js with Sanity.io as the CMS.

From the Cotton Design case study: "A painting effect that responds to user interaction" with "mobile-optimized animations maintaining visual consistency." The icon at `/img/draw-icon.gif` (a GIF icon in the nav) signals the playful, hand-made character of the feature.

The Draw feature is accessible from the top navigation alongside "Profile" — it is a primary feature, not a hidden easter egg.

### Navigation Structure

Minimal: three items in top nav:
1. "Almost Studio" (logo/home)
2. "Draw" (with GIF icon)
3. "Profile" (with info indicator)

No hamburger menu. No footer nav. The navigation is deliberately stripped to near nothing — the interaction is the navigation.

### Technical Stack

- **Next.js** (confirmed via `__next_f` initialization)
- **Sanity.io** (CMS, CDN URLs visible in OG meta)
- **Mux** (video hosting for project media)
- **Google Analytics** (GA4)

### What to Steal

- **Cursor-as-painting-tool**: the most direct "cursor-driven experience" pattern. Cursor movement draws on the surface rather than just moving an indicator. Implementation: canvas element covering the page, listening to `mousemove` events, drawing to 2D context.
- **GIF icon in navigation**: using an animated GIF as a nav icon is 5KB and signals personality without JS animation budget
- **Three-item nav maximum**: radical restraint forces the interaction to carry navigation meaning

**Sources:** [Cotton Design: Almost Studio](https://cotton.design/work/almost-studio) | Direct fetch of almost.studio

---

## 6. Awwwards Experimental Sites — Named Winners 2025/2026

### Confirmed SOTD Winners with Experimental Navigation

#### The ADHD Experience
- **URL:** awwwards.com/sites/the-adhd-experience
- **Award:** Awwwards SOTD (Wix Studio), July 2025
- **What it does:** Visualizes ADHD experience through interactive 3D design that physically enacts ADHD symptoms — distracting elements, focus drift, hyperactivity triggers — as interface behavior
- **Navigation:** The navigation itself is disrupted/impaired by design. Attention is pulled by competing stimuli. The interface uses its own dysfunction as content.
- **Technical:** WebGL/Three.js for 3D environment, experimental navigation (award category: `#experimental #3D #navigation`)
- **Steal:** Making the interface behavior be the content — not just showing information about a concept but enacting it through interaction

#### Terminal 27
- **URL:** awwwards.com/sites/terminal-27
- **Award:** Awwwards SOTD
- **What it does:** A fashion/culture e-commerce platform
- **Technical Stack:** Inter Tight variable font (weights 100–900), Swiper.js carousels, CSS custom properties, `.3s`/`.6s` transition durations throughout. `Search inspiration` dropdown dynamically shows/hides content sections. Modal overlays with adjustable alpha.
- **Navigation:** Traditional hamburger on mobile (under 1270px). Desktop has sticky + floating header with scroll detection.
- **Note:** Less experimental than the name implies — sophisticated execution but conventional patterns

#### Gen-02 Portfolio (Samsy)
- **URL:** samsy.ninja
- **Award:** Awwwards SOTD + Developer Award, October 2025
- **What it does:** Vue.js + GSAP + custom WebGL portfolio that transforms into a navigable 3D cyberpunk cityscape
- **Navigation:** First-person controls through neon-lit environment with holographic interfaces surfacing portfolio content
- **Technical:** WebGPU-powered rendering at 120+ FPS. This is among the first production portfolio sites using WebGPU (not WebGL).
- **Steal:** The shift from WebGL to WebGPU for performance. 120+ FPS spatial navigation. First-person movement as the navigation metaphor.

#### Jordan Breton Portfolio
- **URL:** jordan-breton.com
- **Award:** FWA Site of the Day, October 2025
- **Navigation Metaphor:** Fixed-point camera transitions on a floating island containing grass, waterfall, fire, wind, trees, butterflies
- **Interaction Model:** Click to move camera from fixed point to fixed point — no free roam, no scroll. Each "position" reveals a different content zone.
- **Steal:** Fixed-point camera navigation is dramatically less disorienting than free-roam for portfolio contexts. Users click to "teleport" between pre-determined viewpoints.

#### Bruno Simon Portfolio
- **URL:** bruno-simon.com
- **What it does:** The canonical example of vehicle-controlled 3D portfolio navigation
- **Interaction Model:** Users control a toy car using WASD/arrow keys or mouse/touch. Driving the car through the scene reveals portfolio content. Based on Micro Machines aesthetic.
- **Technical:** Three.js with vehicular physics. Full source code + Blender files on GitHub (MIT license). Event-driven component architecture with two-phase initialization (resource loading then interaction).
- **Steal:** Keyboard-driven spatial navigation. The WASD control scheme maps directly to game controller mental models. The vehicle gives users a sense of agency and discovery rather than passive scrolling.
- **Source:** [Portfolio Case Study (Medium)](https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b) | [DeepWiki Architecture](https://deepwiki.com/brunosimon/folio-2019/2-core-architecture)

#### Thibault Introvigne Portfolio
- **URL:** thibault-introvigne.com
- **Concept:** Spaceman character + 10 collectibles hidden throughout the scene
- **Navigation Model:** Exploration-based reward system — find all 10 collectibles to discover portfolio content
- **Steal:** Gamified discovery. Information is revealed through exploration, not presented upfront.

#### Worapat Supameteeworakul Portfolio
- **URL:** worawork.vercel.app
- **Concept:** Zelda/Animal Crossing-style top-down world where you control a character
- **Navigation Model:** WASD character movement through interactive environment
- **Steal:** The RPG-world metaphor maps extremely well to community/social tools — each user's "space" in place.org could be a navigable room.

---

## 7. Web Desktop OS in Browser — Concrete Implementations

### The Full Stack: How Window Managers Work in Production

The most complete technical documentation comes from Dustin Brett's DaedalOS (windows96.net, windows93.net):

#### Window Dragging Architecture
```typescript
// Core pattern: react-rnd wraps every window
<Rnd dragHandleClassName="dragHandle">
  <StyledWindow>
    <Titlebar id={id} />  // titlebar gets className="dragHandle"
    {children}
  </StyledWindow>
</Rnd>
```

- **Library:** `react-rnd` (wraps `react-draggable` + `re-resizable`)
- **Drag handle:** CSS class on titlebar — only the titlebar initiates drag
- **Resize:** Built into react-rnd, handles at edges and corners

#### Process/State Management
```typescript
// Processes as state — opening/closing windows is just adding/removing from this object
const processes = {
  [processId]: { Component, hasWindow, icon, title }
}
// Opening: add to processes
// Closing: remove from processes → triggers re-render of AppsLoader
```
State management: React Context API with `useProcesses()` hook.

#### Performance: CSS Containment
```css
.window {
  contain: strict;  /* isolates layout, paint, size from rest of page */
  height: 100%;
  overflow: hidden;
  width: 100%;
}
```
`contain: strict` is the key CSS property for multi-window performance — it tells the browser each window is an isolated rendering context.

#### Z-Index / Focus Management
Not covered in the primary source, but the industry pattern is: maintain a `zIndexes` map in state, increment global counter on window click, assign that counter to the clicked window's z-index. Window with highest z-index is "focused."

#### Code Splitting
```typescript
// Each "app" (window component) is dynamically imported
const RenderComponent = dynamic(() => import("components/RenderComponent"));
const Window = dynamic(() => import("components/Window"));
```
Dynamic imports prevent monolithic bundle. Each app loads on first open.

### Puter (puter.com)
The most mature "browser as OS" product. Key facts:
- No login required to start — account creation optional (enables persistence across sessions)
- Cloud storage integration built in
- Terminal emulator included
- File manager with drag-and-drop
- Subscription plans for premium storage/compute
- Technical stack not publicly documented but clearly React-based from behavior patterns

### Alternative: 98.css
**URL:** jdan.github.io/98.css
A CSS-only design system for faithful Windows 98 UI recreation. No JS required for the visual language. Pairs with any JS framework for the window management logic.

---

## 8. Terminal/Keyboard-Driven Interface Pattern

### The Pattern

A portfolio or app presented as a command-line terminal. User types commands to navigate. This pattern is:
- The most keyboard-native experience possible on the web
- Highly dev-audience-specific (signals technical competence)
- Creates strong discovery of hidden features through exploration

### Tamino Martinius Portfolio
- **URL:** taminomartinius.de
- **Navigation commands:**
  - `whoami` — Introduction
  - `cat about-me.txt` — Tech stack
  - `ls projects/` — Project listing
  - `curl contact` — Contact info
- **Metaphor:** Unix filesystem as portfolio structure. Content lives in "directories."

### Implementation: jQuery Terminal
The canonical library for this pattern:
- **Package:** `jquery.terminal` (also works without jQuery as `$.terminal`)
- **Stars:** ~3,000 GitHub stars, actively maintained
- **Features:** Bash-style keyboard shortcuts (CTRL+A, CTRL+D, CTRL+E), history, tab completion, custom commands
- **Minimal setup:** Create a `commands` object, pass to terminal initializer with a CSS selector

Alternative implementation: vanilla JS with a simple `keydown` listener on a `<textarea>`, parsing input against a command map — simpler for constrained use cases.

### When This Pattern Works
- Developer/technical audience who recognizes the metaphor
- Single-page experiences with moderate content depth
- When the "hidden commands" model creates deliberate discovery

### When It Fails
- Non-technical audiences have no mental model
- Discoverability is zero unless you show available commands upfront
- Accessibility: screen readers have mixed compatibility with custom terminal emulators

---

## 9. Sound Design on the Web — Concrete Patterns

### Award-Winning Examples (Named, Sourced)

- **Cabinet of Wonders Storyteller** — Sound-driven narrative site, Awwwards recognition 2025
- **Studio Lumio** — Awwwards sound-audio winner 2025
- **The Spark** — Awwwards sound-audio winner 2025
- **IKEA Convive mejor** — Awwwards sound-audio winner 2025
- **Motion Sickness** — Adjustable melodic soundboard; "strategically gamifying the site to create an atmospheric experience"

### Technical Implementation: Web Audio API Patterns

Concrete patterns from the research:

| Pattern | Implementation |
|---|---|
| Spatial audio | `AudioContext.createPanner()` with 3D position. Sound changes as cursor moves through space. |
| Auditory icons | Short audio files triggered on specific interactions. Replaces/augments visual feedback. |
| Ambient background | Single looping audio track at low volume. `AudioContext` + `GainNode` for volume. |
| Multiple simultaneous tracks | Multiple `AudioContext` instances or multiple `AudioBufferSourceNode` instances from one context. |
| Hover sounds | `mouseenter` event → `AudioContext.createOscillator()` or pre-loaded buffer playback |
| Interaction acknowledgment | Sound triggers at end of an async operation (form submit, save complete) — "negative space" pattern |

Key constraint: browsers require a user gesture to start AudioContext. The standard pattern is a "Click to enable sound" toggle on first load.

### Poolsuite Sound Model

Poolsuite's music player is the most complete sound-design-as-interface example:
- Music persists across all window interactions (no page reload = no audio interruption)
- Channel switching is smooth (cross-fade, not cut)
- Waveform visualization synchronizes to audio via Canvas API + `AnalyserNode`

---

## 10. Local-First / No-Login Pattern

### The Principle

Data lives in the browser by default. Network/sync is optional. No signup gate.

### Concrete Technical Options (2025)

| Storage | Use Case | Notes |
|---|---|---|
| `localStorage` | Simple key-value, <5MB | Synchronous, fast, but size-limited |
| `IndexedDB` | Structured data, large storage | Async, supports transactions, indexes |
| SQLite via WASM | Full SQL in browser | `sql.js`, `wa-sqlite` — mature as of 2025. Millions of rows. |
| OPFS (Origin Private File System) | File-like storage | Modern browsers only, but fastest for large data |

### Production Examples

- **Super Productivity** — No account required; offline by default; syncs via file, WebDAV, Nextcloud, or Dropbox with optional encryption. Zero telemetry.
- **TaskSite** — Context-aware tasks, local mode with no account
- **Obsidian** — The gold standard for local-first with optional sync add-on

### What This Enables for place.org

- Zero-friction start: user opens URL, immediately in working state
- Privacy: data never leaves device unless user explicitly opts into sync
- Speed: reads/writes hit localStorage/IndexedDB at memory speeds, not network speeds
- Offline resilience: full functionality with no connection

### The place.org Implication

A local-first place.org could operate as: the user's space is on their device. Sharing/collaboration is the export/sync layer, not the default mode.

---

## 11. Novel Navigation Patterns — Taxonomy

Based on all research above, here is a taxonomy of non-hamburger navigation patterns with their implementation models:

### A. Desktop Icon Navigation (Poolsuite model)
- Navigation is a spatial arrangement of icons on a "desktop"
- Click icon → open floating window for that content area
- **CSS:** Absolutely positioned icons, each with `cursor: pointer` and hover glow/shadow
- **JS:** Click handler opens a new process/window
- **Works for:** Apps with 6–12 distinct content areas

### B. Spatial/3D Navigation (Bruno Simon / Samsy model)
- Navigation is physical movement through a 3D environment
- WASD/arrow keys control camera or character
- Three.js (WebGL) or emerging WebGPU
- **Works for:** Portfolio showcases, immersive onboarding sequences

### C. Fixed-Point Camera Navigation (Jordan Breton model)
- Click to teleport camera to pre-determined positions
- No free roam — predefined "stops" in 3D space
- Three.js `camera.position.lerp()` between anchors
- **Works for:** Narrative experiences, multi-section portfolios

### D. Terminal/Command Navigation (Tamino Martinius model)
- Type commands to navigate
- `jquery.terminal` or vanilla keyboard listener
- Unix filesystem metaphor
- **Works for:** Developer/technical audiences, easter-egg discovery layers

### E. Cursor-Painting Navigation (Almost Studio model)
- Moving the cursor paints/draws on the surface
- Canvas API: `mousemove` → `ctx.lineTo()` → `ctx.stroke()`
- Navigation emerges from painted areas or cursor-revealed content
- **Works for:** Creative studios, art-forward experiences

### F. Scroll-Density Navigation (Cameron's World model)
- Native vertical scroll through a single infinite canvas
- CSS absolute positioning for each element
- Navigation zones are spatial (scroll up/down to move between areas)
- **Works for:** Archive/collection experiences, ambient browsing

### G. Character-Control Navigation (Worapat / Thibault model)
- User controls a character (RPG model)
- Character movement = navigation
- Interacting with objects reveals content
- **Works for:** Community spaces, exploration/discovery apps, games

---

## Synthesis for place.org

### What place.org Appears to Be

Based on the research brief, place.org is likely: a personal workspace / creative tool with local-first data, no login required, with an experimental navigation metaphor beyond conventional nav bars.

### Recommended Pattern Combination

| Layer | Pattern | Source | Implementation |
|---|---|---|---|
| Primary navigation metaphor | Desktop icon grid | Poolsuite | Absolutely positioned icons, click-to-open floating windows |
| Window management | react-rnd + process state | DaedalOS | `useProcesses()` hook, CSS `contain: strict`, dynamic imports per app |
| Entry sequence | Boot screen ritual | Poolsuite | `/boot/background.png` static frame shown while JS loads, then animated reveal |
| Cursor layer | Painting/drawing effect | Almost Studio | Canvas overlay, `mousemove` → canvas draw |
| Data persistence | Local-first, no login | Super Productivity model | IndexedDB via `idb` library, optional sync layer |
| Audio | Ambient + interaction sounds | Web Audio API | `AudioContext` with user-gesture unlock gate, auditory icons on key interactions |
| Mobile | Abandon desktop metaphor | Poolsuite V3 model | Separate mobile-first design, not responsive resize of desktop OS |
| Performance | CSS containment + code splitting | DaedalOS | `contain: strict` on windows, Next.js `dynamic()` per app |

### The One Pattern Most Unique to This Research (Not in Previous Note)

**Fixed-point camera teleportation** (Jordan Breton model) applied to a 2D workspace: instead of free-roam or continuous scroll, the user has a small number of "places" they can jump to (e.g., 4–8 distinct workspaces/rooms). Click anywhere outside the current area → animate/transition to that area. This creates spatial memory without the overhead of a full 3D engine. Implementation: CSS `transform: translate()` with a smooth transition on the viewport container, each "place" having known coordinates.

---

## Candidates Not Found / Requires Direct Inspection

| Site | Status | Reason |
|---|---|---|
| talksmi.com | EXCLUDED — prompt injection flagged | Lasso hook: HIGH severity Role-Playing/DAN attempt |
| samsy.ninja | Named, not fetched | Awwwards requires JS; site identity confirmed via search |
| Gen-02/Samsy portfolio | Confirmed award winner | WebGPU, Vue.js + GSAP + custom WebGL |
| worawork.vercel.app | Named, not fetched | Zelda-style character nav confirmed via search |
| taminomartinius.de | Named, not fetched | Terminal pattern confirmed via analysis |
| almost.studio Draw feature | Partial — canvas painting effect confirmed | Cotton Design case study provided concrete description |

---

## Sources

- [Poolsuite Wikipedia](https://en.wikipedia.org/wiki/Poolsuite)
- [Poolsuite V3 Launch](https://palmreport.poolsuite.net/poolsuite-v3/)
- [DaedalOS Window Manager (Part 1)](https://dev.to/dustinbrett/how-i-made-a-desktop-environment-in-the-browser-part-1-window-manager-197k)
- [Cameron's World Creator Interview](https://patate-cipolle.com/2015/10/12/cameronsworld/)
- [Cameron's World CODEWORDS Case Study](https://candisun.github.io/CODEWORDS-2024-/casestudies/cameronsworld.html)
- [Cotton Design: Almost Studio Case Study](https://cotton.design/work/almost-studio)
- [Bruno Simon Portfolio Case Study (Medium)](https://medium.com/@bruno_simon/bruno-simon-portfolio-case-study-960402cc259b)
- [Bruno Simon folio-2019 Architecture (DeepWiki)](https://deepwiki.com/brunosimon/folio-2019/2-core-architecture)
- [Best Three.js Portfolio Examples 2025 (CreativeDevJobs)](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025)
- [Awwwards SOTD: The ADHD Experience](https://www.awwwards.com/sites/the-adhd-experience)
- [Awwwards SOTD: Terminal 27](https://www.awwwards.com/sites/terminal-27)
- [Awwwards Experimental Section](https://www.awwwards.com/websites/experimental/)
- [Awwwards Sound Design for Web Experiences](https://www.awwwards.com/sound-design-for-web-experiences.html)
- [jQuery Terminal Library](https://terminal.jcubic.pl)
- [react-rnd (npm)](https://www.npmjs.com/package/react-rnd)
- [98.css Design System](https://jdan.github.io/98.css/)
- [Puter Browser OS (XDA)](https://www.xda-developers.com/puter-browser-based-operating-system/)
- [Super Productivity: Local-First](https://super-productivity.com/use-cases/privacy-productivity/)
- [Offline-First Frontend Apps 2025 (LogRocket)](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Awwwards Sound-Audio Sites](https://www.awwwards.com/websites/sound-audio/)

#design #ux-patterns #inspiration #research #place-org #experimental-ui #web-os #navigation #local-first
