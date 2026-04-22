---
date: 2026-03-20
tags: [research, place-org, web-os, window-manager, browser-desktop, architecture, daedalos, puter, prozillaos, arozos]
status: active
---

# Research - Browser OS Implementations 2026

> Deep architecture analysis of existing browser-based OS / web desktop implementations for the place.org project. Covers tech stack, window management, file systems, performance techniques, and concrete lessons for place.org.

Related: [[Research - place.org Experimental UI Inspiration Deep Dive]] | [[Research - Modern Browser Capabilities 2025-2026]]

---

## 1. DaedalOS (dustinbrett.com)

**Status:** Active, open source (GitHub: DustinBrett/daedalOS). 12,000+ stars.
**Represents:** The most complete single-developer browser OS. The canonical reference implementation.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React + TypeScript, Next.js |
| Build | Vite/Webpack |
| Window drag/resize | `react-rnd` (wraps `react-draggable` + `re-resizable`) |
| Animations | Framer Motion |
| CSS | Styled Components |
| File system | BrowserFS (abstraction over IndexedDB + ZIP + ISO) |
| Terminal | xterm.js |
| PDF | pdf.js |
| Media | VideoJS, Webamp (Winamp clone) |
| Emulation | EmulatorJS (retro ROMs), Ruffle (Flash) |
| Code editor | Monaco Editor (VS Code engine) |
| Python runtime | Pyodide |
| Git | isomorphic-git |
| AI | Prompt API + WebLLM (Llama models in-browser) |
| Compression | fflate (ZIP), 7Z/GZ/RAR/TAR extraction |
| Persistent storage | localStorage for UI state, IndexedDB via BrowserFS |

### Window Manager Architecture

The architecture is documented by Dustin Brett in "How I Made a Desktop Environment in the Browser" (dev.to).

**Process state model:**
```typescript
// Everything lives in React Context
const processes = {
  [processId]: {
    id: string,
    Component: React.ComponentType,
    hasWindow: boolean,
    icon: string,
    title: string,
  }
}
```

Opening a window = adding to this object. Closing = removing from this object. React re-renders `AppsLoader` which maps over `Object.entries(processes)`.

**Component hierarchy:**
```
AppsLoader
  → RenderComponent (for each process)
      → if hasWindow: <Window id={id}><Component id={id} /></Window>
      → else: <Component id={id} />
```

**Window wrapper:**
```tsx
<Rnd dragHandleClassName="dragHandle">
  <StyledWindow>
    <Titlebar id={id} />   // has className="dragHandle"
    {children}
  </StyledWindow>
</Rnd>
```

**CSS performance isolation:**
```css
.window {
  contain: strict;   /* isolates layout, paint, size — critical */
  height: 100%;
  overflow: hidden;
  width: 100%;
}
```

**Content sizing:**
```css
.window-content {
  height: calc(100% - ${theme.titleBar.height});
}
```

**Code splitting:**
```typescript
// Every app is a dynamic import — nothing loads until first opened
const RenderComponent = dynamic(() => import("components/RenderComponent"));
const Window = dynamic(() => import("components/Window"));
```

**Z-index / focus:** Maintained via React Context; highest z-index = focused window. Increment global counter on window click, assign to clicked window.

**Worker threads:** Clock and wallpaper rendering offloaded to Web Workers using OffscreenCanvas — main thread is never blocked by these.

**Persistence:** Window size, position, and maximized states persist to localStorage automatically.

**URL loading:** Supports `/?url=` and `/?app=` query parameters. IPFS protocol supported in the built-in browser.

### What DaedalOS Got Right

- CSS `contain: strict` on every window: proven 80% rendering time reduction vs. no containment
- Dynamic imports per app: initial bundle is minimal regardless of app count
- Process-as-state model: clean conceptual model, easy to extend
- BrowserFS abstraction: swap backends without changing app code
- The Web Worker strategy for non-interactive rendering (clocks, wallpapers)

### What DaedalOS Got Wrong / Limitations

- Built as a showcase, not a platform — apps are embedded, not third-party-sandboxed
- No iframe isolation for apps: a buggy app can crash the whole OS
- react-rnd has known lag on drag/resize start (Chrome spends time recomputing styles) — see [#598](https://github.com/bokuweb/react-rnd/issues/598)
- No real multi-user story
- Framer Motion adds bundle weight that may not be necessary

### Sources

- [DaedalOS GitHub](https://github.com/DustinBrett/daedalOS)
- [How I Made a Desktop Environment in the Browser (Part 1)](https://dev.to/dustinbrett/how-i-made-a-desktop-environment-in-the-browser-part-1-window-manager-197k)
- [How I Made a Desktop Environment in the Browser (Overview)](https://dev.to/dustinbrett/how-i-made-a-desktop-environment-in-the-browser-15oi)

---

## 2. Puter (puter.com)

**Status:** Active, open source (GitHub: HeyPuter/puter, AGPL-3.0). 40,000+ stars, 3,600+ forks, 359 contributors.
**Represents:** The most mature production browser OS. Privacy-first cloud storage + desktop environment.

### Tech Stack

| Layer | Technology |
|---|---|
| Primary language | JavaScript (85.9%), TypeScript (7.9%) |
| Runtime | Node.js 24+ |
| Architecture | Vanilla JS + jQuery (by design — avoids heavy abstractions) |
| Backend | Node.js |
| Containerization | Docker |
| Rust integration | `rust-toolchain.toml` present — for WASM modules |
| SDK | Puter.js (their own library) |
| Caching | kvjs (IndexedDB/localStorage wrapper) |
| Storage (prod) | S3-backed |
| Storage (dev) | Local filesystem |

### File System Architecture

Puter implements the most architecturally sophisticated filesystem of any browser OS:

**Two-layer operation model:**
- **High-Level (HL) operations** — business logic: quota enforcement, name conflict resolution (`HLWrite`, etc.)
- **Low-Level (LL) operations** — locking, ACL checks, provider interaction (`LLCWrite` for create-with-write-lock, `LLOWrite` for overwrite, `LLReadDir` for directory listing)

**Core components:**
- `FSNodeContext` — facade that caches node info (UUID, path, DB ID), lazy-loads metadata, maintains multiple selectors with priority ordering
- `FilesystemService` — central coordinator managing mountpoints, creates `FSNodeContext` instances
- `PuterFSProvider` — primary implementation; capabilities declared via symbols (`THUMBNAIL`, `UUID`, `OPERATION_TRACE`, `CASE_SENSITIVE`)
- `LocalDiskStorageController` — abstracts physical storage; delegates `upload()`, `copy()`, `delete()` to backing store

**Database schema:** `fsentries` table with `uuid`, `parent_uid`, `name`, `path`, `is_dir`, `size`, `metadata`, timestamps.

**Files stored as UUIDs** in a flat directory structure. No hierarchical storage paths — the database is the hierarchy.

**Request deduplication:** Multiple concurrent requests for the same resource within a 2-second window get the same Promise. Not duplicate API calls.

**WebSocket real-time sync:** Cache invalidation via `item.added` and `item.removed` WebSocket events. Timestamp-based validation using `last_valid_ts`.

### Window Management

`UIWindow` is the core windowing component:
- Window chrome: minimize, maximize, close
- **iframe containers for app isolation** — each app runs in its own iframe, sandboxed
- Z-index management for stacking
- Drag/resize handlers
- `postMessage` API for app–OS communication
- Taskbar integration for switching

The iframe model is Puter's most important architectural distinction from DaedalOS. A broken app cannot crash the OS.

### SDK Architecture (Puter.js)

The SDK initializes via `new Puter()` and detects runtime environment:
- `'gui'` — running in Puter's main desktop
- `'app'` — running in app iframe
- `'web'` — third-party website
- `'web-worker'` — Web Worker context
- `'nodejs'` — Node.js environment

Modules: `puter.fs`, `puter.ui`, `puter.ai`, `puter.apps`, `puter.kv` (key-value store).

The SDK also exposes AI through: GPT-4o, o1, o3-mini, Claude 3.7 Sonnet, DALL-E 3, and Ollama (local models).

### What Puter Got Right

- iframe isolation per app — the correct security model for a real platform
- Two-layer FS model separating business logic from storage mechanics — very clean
- UUID-keyed flat storage — rename/move without changing physical files
- WebSocket-driven cache invalidation — real-time across tabs
- Vanilla JS by choice — no framework overhead for core OS
- Self-hostable: Docker Compose, 2GB RAM minimum

### What Puter Got Wrong / Limitations

- Vanilla JS + jQuery codebase is harder to maintain at scale vs. TypeScript React
- AGPL license means self-hosted commercial uses must open-source derivatives
- Server required even for single-user — not local-first
- iframe communication via `postMessage` is verbose to program against

### Sources

- [Puter GitHub](https://github.com/HeyPuter/puter)
- [Puter Filesystem Architecture — DeepWiki](https://deepwiki.com/HeyPuter/puter/3-puter-sdk-(puter.js))
- [Puter OS Review (XDA)](https://www.xda-developers.com/puter-browser-based-operating-system/)
- [Puter Developer Docs](https://developer.puter.com/)

---

## 3. Windows 93 (windows93.net)

**Status:** Still online, not actively developed. Art project by Jankenpopp and Zombectro (French).
**Represents:** Browser OS as art / cultural artifact. First major viral browser OS.

### Tech Stack

| Layer | Technology |
|---|---|
| Core framework | Sys42 (custom JS framework) |
| Architecture | JavaScript DOM manipulation |
| UI model | Web Components + DOM manipulation |
| State | Reactive state updates + action handlers |
| Task scheduling | Event-driven JS loops simulating multitasking |

### Architecture

Sys42 serves as the "kernel." It manages task scheduling through reactive state updates and action handlers, while the UI module provides a windowing system with drag-and-drop resizing and layering via Web Components and DOM manipulation.

Applications embedded: Cat Explorer (file browser), Piskel (pixel art editor), MIDI jukebox, Maze 3D, Poney Jockey.

### Architectural Lesson

Windows 93 proves the browser OS metaphor is emotionally resonant as an art statement, but its architecture (all OS logic in monolithic JS, no module system) is what made it unforkable and hard to maintain. Its virality came entirely from the aesthetic and humor, not the engineering.

**What to steal:** The willingness to be fully committed to the metaphor — every element, every interaction, every app stays in the fiction.

### Sources

- [Windows 93 Wikipedia](https://en.wikipedia.org/wiki/Windows_93)
- [Windows 93 HN Discussion](https://news.ycombinator.com/item?id=9162566)

---

## 4. Windows 96 (windows96.net)

**Status:** Active, not open source. Created by ctrlz and Dan. Inspired by Windows 93 and Ubuntu Online Tour.
**Represents:** Most polished retro browser OS; went through a painful v1→v2 rewrite.

### The v1 → v2 Architectural Failure and Rewrite

Windows 96 v1 is the canonical cautionary tale for browser OS development:

- All OS logic in a single file → spaghetti code
- Entirely synchronous operations → async was bolted on awkwardly
- WebFS's mixed async model → file limits and slowness
- Insufficient CSS normalization → browser inconsistencies
- Result: impossible to optimize, impossible for multiple devs to work on

The v1→v2 rewrite took approximately 6 months to reach basic usability. v2 apps are completely incompatible with v1 due to different architecture and API set.

### v2 Architecture Improvements

- ES6 module system throughout
- Async-first architecture
- Multiple developers can work simultaneously
- Developer documentation at windows96.gitbook.io

### Architectural Lesson

The single-file monolith anti-pattern kills browser OS projects. Modular architecture from day one is non-negotiable. The v1→v2 rewrite is evidence: you will rewrite if you don't plan the module system upfront.

### Sources

- [Windows 96 Wikipedia](https://en.wikipedia.org/wiki/Windows96.net)
- [Windows 96 v2 Wiki96](https://w96.wiki/wiki/Windows_96_v2)
- [Windows 96 v1 Wiki96](https://w96.wiki/wiki/Windows_96_v1)
- [Windows 96 Dev Docs](https://windows96.gitbook.io/)

---

## 5. OS.js (os-js.org)

**Status:** Open source, maintained. v4+ available.
**Represents:** The only purpose-built browser OS framework designed for third-party app development.

### Tech Stack

| Layer | Technology |
|---|---|
| Server | Node.js + Express |
| Frontend | Framework-agnostic (React, Vue, vanilla all work) |
| Window manager | Built-in |
| File system | VFS adapter layer (pluggable) |
| Auth | Adapter-based (custom, LDAP, etc.) |
| Settings | Adapter-based |

### Architecture

OS.js is explicitly a platform, not an OS. It provides:

- **Window manager** with drag/resize built in
- **VFS (Virtual File System)** as an abstraction — write an adapter, get any backend
- **Service providers** — reusable business logic modules
- **Authentication adapters** — swap auth backends
- **Settings adapters** — swap settings persistence
- **Middleware** via Express

Applications access the DOM directly via `proc.createWindow({})`. Any JS framework works inside that DOM access.

### What OS.js Got Right

- Separation of platform from applications — the cleanest boundary
- Pluggable VFS means you can use local disk, S3, SFTP, any backend
- Framework-agnostic window content — React or Vue apps work natively
- Server-side Node.js backend is real infrastructure

### What OS.js Got Wrong / Limitations

- Server required for real deployment — not browser-only
- Documentation is thin and often out of date
- Small community compared to Puter or DaedalOS
- No built-in app isolation model (iframes)
- Not production-hardened

### Sources

- [OS.js Homepage](https://www.os-js.org/)
- [OS.js Framework Guide](https://manual.os-js.org/guide/framework/)
- [OS.js HN Discussion](https://news.ycombinator.com/item?id=37257218)

---

## 6. ProzillaOS (os.prozilla.dev)

**Status:** Active, open source. 300+ stars. React + TypeScript.
**Represents:** Most architecturally clean modern browser OS built with React + Vite monorepo.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React + TypeScript |
| Build | Vite + pnpm workspaces |
| Window dragging | react-draggable |
| Icons | FontAwesome |
| Package management | Changesets (semantic versioning) |
| State | Manager classes with observer patterns (no Redux/Zustand) |
| Persistence | StorageManager abstraction (localStorage / IndexedDB) |

### Architecture: Monorepo with Strict Separation

```
@prozilla-os/core       — OS primitives, React components, managers
@prozilla-os/skins      — Theming system
applications/           — 9 built-in apps (file-explorer, terminal, text-editor, etc.)
prozilla-os             — Distribution package bundling everything
```

### Window Management

Controlled via `WindowsManager` and `WindowsConfig` classes:
- Opens/closes windows, manages z-order stacking
- `WindowsView` React component renders active windows
- **File association**: windows auto-open files based on extension matching and role constants

### File System

`VirtualDrive` system — pure virtual, no real storage:

| Class | Role |
|---|---|
| `VirtualBase` | Path resolution, permissions, event emission |
| `VirtualFile` | Inline content or external URL/`app://`/`external://` schemes |
| `VirtualFolder` | Hierarchical containers with navigation |
| `VirtualRoot` | Root + persistence + shortcut aliases |

Only user-modified items persist (tracked via `editedByUser` flag). JSON-serialized to browser storage.

### State Management

No Redux or Zustand. State lives in manager class instances:
- `SystemManager` — global coordinator
- `WindowsManager` — window stack
- `ModalsManager` — modal dialogs
- `StorageManager` — persistence abstraction
- `AppsConfig` — central app registry

Virtual entities emit change events → UI subscribes.

### What ProzillaOS Got Right

- Monorepo with strict `@prozilla-os/` namespacing — prevents coupling
- Manager-pattern state avoids React re-render storms
- VirtualDrive as first-class with event system — clean reactivity
- Role-based file dispatch (not just MIME) — flexible file association

### What ProzillaOS Got Wrong / Limitations

- VirtualFS is disconnected from real storage — no real file persistence
- react-draggable (not react-rnd) — no built-in resize
- Smaller ecosystem than DaedalOS or Puter

### Sources

- [ProzillaOS GitHub](https://github.com/prozilla-os/ProzillaOS)
- [ProzillaOS Docs](https://os.prozilla.dev/docs/about/introduction)
- [DeepWiki Architecture](https://deepwiki.com/prozilla-os/ProzillaOS)

---

## 7. ArozOS (os.aroz.org)

**Status:** Active, open source. 2,800+ stars. Go backend.
**Represents:** The only production-deployed browser OS for real NAS/Raspberry Pi hardware. 5+ years of development.

### Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go (rewritten from PHP) |
| Frontend | JavaScript |
| Extension system | ECMA5-based scriptable plugins |
| File system | Driver-based VFS abstraction |
| Protocols | SMB, WebDAV, SFTP, FTP, HTTP |
| Targets | Raspberry Pi 4B, Pi Zero W, Orange Pi, Debian Linux |

### Architecture Lessons (5 Years of Production)

From the developer's own retrospective:

1. **Driver-based VFS is the right model.** Mounting arbitrary backends (local disk, RAM disk, SMB, WebDAV, SFTP) via a common driver interface is what makes the system genuinely useful. Abstract the VFS early.

2. **Multi-protocol access is essential for adoption.** Users need WebDAV for Windows, SFTP for Linux, HTTP for browsers — one storage backend, many protocols.

3. **Low-power hardware forces real performance discipline.** The Go rewrite from PHP was about Raspberry Pi performance. Building for constrained hardware produces better architecture for all hardware.

4. **The desktop metaphor is a UX choice, not a technical necessity.** ArozOS looks like "Ubuntu 20.04 meets Windows" but runs on a NAS.

5. **v3 rewrite planned for distributed computing.** Distributed storage and authentication is the next frontier — confirms that multi-node architecture is where browser OS evolves.

### Sources

- [ArozOS GitHub](https://github.com/tobychui/arozos)
- [ArozOS 2.0 Announcement (DEV)](https://dev.to/tobychui/announcing-arozos-20-5-years-journey-into-my-own-web-desktop-os-5anp)

---

## 8. @maomaolabs/core — Modern React Window Manager Library

**Status:** Active npm package. React 18+ required.
**Represents:** The most modern purpose-built React window manager library. May supersede react-rnd for place.org.

### Architecture

**The critical innovation: split context for performance.**

```typescript
// Two separate contexts — this is the key insight
useWindowActions()  // action dispatch only — NEVER triggers re-renders on state change
useWindows()        // state subscription — re-renders on every drag/resize/focus
```

Components that only dispatch actions (open a window, close a window) never re-render during drag, resize, or focus operations. Only the `WindowManager` component (which renders windows) subscribes to the mutable state.

This solves react-rnd's lag-on-drag-start problem at the architecture level.

### Features

- Half-screen (edge) snap with real-time preview overlays
- Quarter-screen (corner) snap
- `layer` system: `'base' | 'normal' | 'alwaysOnTop' | 'modal'`
- Mouse and touch auto-detection
- 5 built-in themes: default, traffic, linux, yk2000, aero
- Custom themes via CSS attribute selectors on `[data-system-style="theme-name"]`
- Taskbar component with folder grouping

### Window Definition Shape

```typescript
interface WindowDefinition {
  id: string
  title: string
  component: React.ComponentType
  // optional:
  icon?: string
  initialSize?: { width: number; height: number }
  initialPosition?: { x: number; y: number }
  layer?: 'base' | 'normal' | 'alwaysOnTop' | 'modal'
  isMaximized?: boolean
  canMinimize?: boolean
  canMaximize?: boolean
  canClose?: boolean
  className?: string
  style?: React.CSSProperties
}
```

### Sources

- [@maomaolabs/core GitHub](https://github.com/maomaolabs/core)

---

## Cross-Cutting Research: Best Practices 2025-2026

### Window Manager Z-Index Strategy

The industry consensus (DaedalOS, ProzillaOS, @maomaolabs/core):

1. Maintain a `zIndexes` map in state: `{ [windowId]: number }`
2. Keep a global `highestZ` counter
3. On window click/focus: `highestZ++; zIndexes[id] = highestZ`
4. Window with highest z-index is visually "on top"
5. **Never** reset z-indexes (causes flash/jump); only increment

The @maomaolabs/core improvement: split this into a separate non-reactive context so focus changes don't re-render every window.

### CSS Compositor Optimization for Many Windows

From benchmarks (Chrome 125, 6x CPU throttle, M2 MacBook):
- Without `contain: strict`: 825ms rendering
- With `contain: strict`: 172ms rendering — **80% reduction**

Rules for many simultaneous windows:

| Rule | Reasoning |
|---|---|
| `contain: strict` on every window | Isolates layout/paint/size from document — browser doesn't reflow others when one changes |
| Animate only `transform` and `opacity` | Only compositor-only properties — no layout/paint triggered |
| Do not blanket-apply `will-change: transform` | GPU memory cost per promoted layer; use only on actively animating elements |
| Use `transform: translate(x, y)` for position | Never `left`/`top` — those trigger layout; transform does not |
| `will-change: transform` only during drag | Add on `dragstart`, remove on `dragend` — scoped promotion |
| Target 4-5ms compositing time | Chrome DevTools Paint Profiler shows this; above 16ms = visible jank |
| Monitor layer count | Each layer = GPU memory + management overhead; 20+ layers on mobile may exceed budget |

### Window Snapping Implementation

The canonical approach (from interact.js docs and DaedalOS patterns):

1. Listen to `mousemove` on `document` (not `element`) during drag
2. Calculate proximity: `event.clientX` vs. screen edge using `getBoundingClientRect()`
3. Show ghost/preview overlay when within snap threshold (typically 20-40px)
4. On `mouseup` while in snap zone: animate window to snap target with CSS transition
5. Store snap state in window process context

**interact.js** has three snap modifiers: coordinate snap (best for drag), `snapSize` (resize only), `snapEdges` (edge targeting). Supports inertia and multi-touch.

**Magnet.js** is a lighter option for single-element snapping.

The @maomaolabs/core built-in snap is the simplest path for React.

### Multi-Monitor: Window Management API

The Window Management API (`window.getScreenDetails()`) is available in Chrome 100+ and Chromium-based browsers. Status: **not cross-browser** — Firefox and Safari do not support it as of 2026.

```javascript
// Permission check
const status = await navigator.permissions.query({ name: 'window-management' })

// Enumerate screens
const screens = await window.getScreenDetails()
screens.screens  // Array<ScreenDetailed>

// Each screen has: left, top, width, height, availWidth, availHeight, devicePixelRatio, isPrimary, isInternal

// Place a popup on a specific screen
const screen = screens.screens[1]
window.open(url, 'name', `left=${screen.left + 50},top=${screen.top + 50},width=800,height=600`)
```

**For place.org:** Multi-monitor is Chromium-only. Treat as progressive enhancement. The more important pattern is managing virtual desktops within the browser viewport — the Window Management API is for actual OS-level multi-display use cases (slideshow on projector, trading desks).

### App Isolation Models Compared

| Model | Used By | Pros | Cons |
|---|---|---|---|
| Direct React component in window | DaedalOS, ProzillaOS | Simple, fast, full React integration | Crash propagation, no third-party apps |
| iframe + postMessage | Puter | Full isolation, third-party apps possible | Verbose API, no shared React context |
| Web Worker + SharedArrayBuffer | (emerging) | Parallel execution, no main thread impact | Complex communication, browser compat |

For place.org: if apps are all first-party, direct components are fine. If third-party apps are on the roadmap, iframe isolation is the correct architecture from the start.

---

## Comparison Matrix

| Project | Stars | Tech | Window Mgmt | File System | Isolation | Self-Hostable | License |
|---|---|---|---|---|---|---|---|
| DaedalOS | 12k+ | React/TS/Next.js | react-rnd + Context | BrowserFS/IndexedDB | None (direct components) | Static host | MIT |
| Puter | 40k+ | Vanilla JS/Node.js | UIWindow + iframe | HL/LL FS + S3/local | iframe + postMessage | Docker/Node | AGPL-3.0 |
| OS.js | ~3k | Node.js + any | Custom WM | VFS adapters | None | Node.js server | MIT |
| ProzillaOS | 300+ | React/TS/Vite | WindowsManager | VirtualDrive | None | Static host | MIT |
| ArozOS | 2.8k | Go + JS | Custom | Driver VFS | None | Binary + Go | MIT |
| Windows 93 | N/A | Vanilla JS | Sys42/DOM | None | None | Static host | N/A |
| Windows 96 | N/A | ES6 JS | Custom | Custom | None | Static host | Proprietary |

---

## Concrete Takeaways for place.org

### Architecture Decisions

**1. Split action context from state context (adopt @maomaolabs/core pattern)**
The two-context split (actions vs. state) is the most important performance insight from this research. DaedalOS, ProzillaOS, and @maomaolabs/core have all converged on this. Components that open/close windows should not re-render on every drag frame.

**2. `contain: strict` on every window, no exceptions**
The 80% rendering time reduction is validated by Chrome benchmarks. This is the single most impactful CSS rule for a multi-window UI.

**3. Process model over component model**
Represent open apps as a process state map, not as React component trees. Opening = add to map. Closing = remove from map. React's reconciler handles the rest. DaedalOS proved this is clean and extensible.

**4. Dynamic import every app**
Each app (window content component) is a `dynamic()` import. The desktop shell loads instantly; apps load on first open. At 10 apps, this saves ~500KB of initial parse.

**5. Decide iframe isolation now, not later**
If place.org will ever allow third-party apps or untrusted content in windows, build the `postMessage` bridge from the start. Retrofitting iframe isolation is a breaking architectural change (Puter did it right from the start; Windows 96 v1→v2 rewrite is the counter-example).

**6. Modular architecture before feature work**
Windows 96's 6-month rewrite is the data point. Monorepo with strict package boundaries, like ProzillaOS's `@prozilla-os/` namespace approach, prevents the spaghetti-code failure mode.

### File System Decisions

**7. Driver/adapter-based VFS**
ArozOS (5 years) and OS.js both prove this. Define a VFS interface (`stat`, `readdir`, `read`, `write`, `mkdir`, `delete`), then implement adapters: `IndexedDBAdapter`, `OPFSAdapter`, `S3Adapter`, `InMemoryAdapter`. Swap backends without changing app code.

**8. OPFS + SQLite WASM for local-first** (from [[Research - Modern Browser Capabilities 2025-2026]])
Puter uses S3-backed server storage. For a local-first place.org, OPFS + SQLite WASM (`wa-sqlite`) is the equivalent — 3-4x faster than IndexedDB, full SQL, persistent across sessions.

**9. UUID-keyed flat storage (Puter model)**
Store files as UUIDs. The database holds the tree structure. Rename/move = database update only, no file moves. This eliminates a class of consistency bugs.

### Performance Decisions

**10. Web Workers for non-interactive rendering**
DaedalOS's approach: clock, wallpaper, and other non-interactive rendering goes to Web Workers with OffscreenCanvas. Main thread is reserved for interaction.

**11. Snap logic without a library is achievable**
The canonical snap implementation is ~50 lines: `mousemove` on document, proximity check, show overlay, `mouseup` in zone → CSS transition to snap target. @maomaolabs/core provides this if staying in React; interact.js if going framework-agnostic.

**12. Window Management API for multi-monitor is Chromium-only**
Treat as progressive enhancement. Check `'getScreenDetails' in window` before using. The primary multi-monitor story for place.org should be virtual workspaces within the viewport, not OS-level display management.

### What place.org Can Uniquely Do

The existing systems are all simulations of Windows/Mac/Linux metaphors. The unexploited space:

- A window system that is **not** Windows-flavored — no title bars, no taskbars, no minimize/maximize — but still a window system
- Windows as **spatial objects** with physics, gravity, stacking like cards on a desk
- A file system where **files are visual objects**, not filenames in a tree
- The **fixed-point teleportation** pattern (from [[Research - place.org Experimental UI Inspiration Deep Dive]]) applied to workspaces — a small number of "places" you jump between, rather than infinite free-roam

---

## Confidence Assessment

| Claim | Confidence | Sources |
|---|---|---|
| DaedalOS uses react-rnd + React Context | High | GitHub README + dev.to article |
| CSS contain: strict gives 80% render reduction | High | Chrome benchmark (Speed Kit) |
| Puter uses iframe isolation per app | High | DeepWiki architecture doc |
| Puter HL/LL filesystem model | High | DeepWiki architecture doc |
| Windows 96 v1 was spaghetti code | High | Wiki96 official documentation |
| @maomaolabs/core two-context pattern | High | GitHub README |
| Window Management API Chromium-only | High | MDN + Chrome dev docs |
| ArozOS 5+ years of lessons | High | Developer's own retrospective |
| react-rnd has lag-on-drag-start known issue | High | GitHub issue #598 |

---

## Sources

- [DaedalOS GitHub](https://github.com/DustinBrett/daedalOS)
- [DaedalOS Dev.to Article (Overview)](https://dev.to/dustinbrett/how-i-made-a-desktop-environment-in-the-browser-15oi)
- [DaedalOS Dev.to Article (Window Manager)](https://dev.to/dustinbrett/how-i-made-a-desktop-environment-in-the-browser-part-1-window-manager-197k)
- [Puter GitHub](https://github.com/HeyPuter/puter)
- [Puter DeepWiki Architecture](https://deepwiki.com/HeyPuter/puter/3-puter-sdk-(puter.js))
- [Puter Developer Docs](https://developer.puter.com/)
- [Puter XDA Review](https://www.xda-developers.com/puter-browser-based-operating-system/)
- [OS.js Homepage](https://www.os-js.org/)
- [OS.js Framework Guide](https://manual.os-js.org/guide/framework/)
- [OS.js HN Discussion](https://news.ycombinator.com/item?id=37257218)
- [ProzillaOS GitHub](https://github.com/prozilla-os/ProzillaOS)
- [ProzillaOS Docs](https://os.prozilla.dev/docs/about/introduction)
- [ProzillaOS DeepWiki](https://deepwiki.com/prozilla-os/ProzillaOS)
- [ArozOS GitHub](https://github.com/tobychui/arozos)
- [ArozOS 2.0 Retrospective](https://dev.to/tobychui/announcing-arozos-20-5-years-journey-into-my-own-web-desktop-os-5anp)
- [Windows 93 Wikipedia](https://en.wikipedia.org/wiki/Windows_93)
- [Windows 96 Wikipedia](https://en.wikipedia.org/wiki/Windows96.net)
- [Windows 96 v2 Wiki96](https://w96.wiki/wiki/Windows_96_v2)
- [@maomaolabs/core GitHub](https://github.com/maomaolabs/core)
- [Window Management API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API)
- [Window Management API — Chrome Developers](https://developer.chrome.com/docs/capabilities/web-apis/window-management)
- [Stick to Compositor-Only Properties — web.dev](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- [CSS Containment Field Test — Speed Kit](https://www.speedkit.com/blog/field-testing-css-containment-for-web-performance-optimization)
- [interact.js Snapping Docs](https://interactjs.io/docs/snapping/)
- [react-rnd GitHub](https://github.com/bokuweb/react-rnd)
- [GitHub web-os topic](https://github.com/topics/web-os)
- [Awesome Web Desktops (curated list)](https://github.com/syxanash/awesome-web-desktops)

#research #place-org #web-os #window-manager #browser-desktop #architecture #daedalos #puter #performance
