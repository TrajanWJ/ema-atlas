---
date: 2026-03-20
tags: [pwa, browser, place-org, manifest, research]
status: active
---

# Research - PWA Capabilities Deep Dive (place.org)

> Research question: What PWA APIs can place.org leverage right now to close the gap between "web app" and "native desktop OS"? Concrete manifest.json additions and implementation patterns for each.

Related: [[Research - Modern Browser Capabilities 2025-2026]] (high-level overview, Section 7)

---

## Browser Support Key

| Symbol | Meaning |
|--------|---------|
| FULL | Stable, production-ready |
| PARTIAL | Supported with limitations |
| NO | Not supported |
| EXP | Experimental / behind flag |

---

## 1. Window Controls Overlay

### What It Does

Removes the browser's title bar from an installed PWA and lets web content render into that space. The OS window controls (close/minimize/maximize) become a floating overlay. Result: the app looks exactly like VS Code or Electron without Electron. Full window surface is yours.

### Browser Support

| Chrome | Edge | Firefox | Safari |
|--------|------|---------|--------|
| FULL (104+) | FULL | NO | NO |

Only fires on desktop. On mobile, falls back to `standalone`. The user can also toggle the title bar on/off via a button the browser injects — your code must handle both states.

### Manifest Addition

```json
{
  "display_override": ["window-controls-overlay"],
  "display": "standalone"
}
```

The `display_override` array is a fallback chain. The browser picks the first value it supports. Always include `display: "standalone"` as the base fallback.

### CSS

Four environment variables describe the title bar region:

```css
.ambient-bar {
  position: fixed;
  left: env(titlebar-area-x, 0);
  top: env(titlebar-area-y, 0);
  width: env(titlebar-area-width, 100%);
  height: env(titlebar-area-height, 33px);

  /* Must be fixed — not sticky — so it doesn't scroll */
  /* The second argument is the fallback when WCO is off */
}
```

Make the bar draggable (required — otherwise the user can't move the window):

```css
.ambient-bar {
  -webkit-app-region: drag;
  app-region: drag;
}

/* Interactive children must opt out */
.ambient-bar button,
.ambient-bar input,
.ambient-bar a {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}
```

### JavaScript API

```typescript
// Feature detect
const hasWCO = 'windowControlsOverlay' in navigator;

// Get current rect
if (hasWCO && navigator.windowControlsOverlay.visible) {
  const rect = navigator.windowControlsOverlay.getTitlebarAreaRect();
  // rect: { x, y, width, height }
}

// React to changes (debounce — fires on every resize)
const debounce = (fn: (...args: unknown[]) => void, ms: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

if (hasWCO) {
  navigator.windowControlsOverlay.addEventListener(
    'geometrychange',
    debounce((e: Event) => {
      const ev = e as WindowControlsOverlayGeometryChangeEvent;
      const isVisible = navigator.windowControlsOverlay.visible;
      const rect = ev.titlebarAreaRect;
      // Update layout based on new rect
    }, 200)
  );
}
```

### macOS vs Windows Positioning

- **Windows**: controls on the right. `titlebar-area-x` starts at 0 (left), `titlebar-area-width` leaves space on the right for the controls.
- **macOS**: controls on the left. `titlebar-area-x` will be ~72px (past the traffic lights), `titlebar-area-width` covers to the right edge.

The CSS env() variables account for this automatically — your content fills the available title bar space regardless of platform.

### place.org Application

place.org's ambient status bar (time, focus mode, system state) is a perfect fit for this space. The ambient bar already lives at the top of the app. With WCO enabled:
- The ambient bar fills the title bar area on both Windows and macOS
- The OS controls float over the right (or left) side
- The app looks indistinguishable from a native Electron desktop app
- Interactive elements in the bar (focus toggle, clock, status icons) need `app-region: no-drag`

### DevTools Preview

In Chrome DevTools, Application tab → Manifest → "Emulate Window Controls Overlay" — lets you preview without installing the PWA.

### Sources

- [MDN — Window Controls Overlay API](https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API)
- [Microsoft Edge Docs — WCO](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/window-controls-overlay)
- [1DIV Demo App](https://microsoftedge.github.io/Demos/1DIV/dist/) — live WCO example

**Verdict for place.org: DO THIS FIRST. Highest visual impact, matches the ambient bar concept exactly.**

---

## 2. App Shortcuts

### What It Does

Adds items to the right-click context menu on the installed PWA icon (taskbar, dock, Start menu). Like native app jump lists.

### Browser Support

| Chrome | Edge | Firefox | Safari |
|--------|------|---------|--------|
| FULL | FULL | NO | PARTIAL (macOS) |

Max 10 shortcuts on Windows/macOS Chrome, max 3 on Android Chrome.

### Manifest Addition

```json
{
  "shortcuts": [
    {
      "name": "Brain Dump",
      "short_name": "Dump",
      "description": "Capture a raw thought immediately",
      "url": "/capture?mode=brain-dump",
      "icons": [{ "src": "/icons/brain-dump.png", "sizes": "192x192" }]
    },
    {
      "name": "Journal",
      "short_name": "Journal",
      "description": "Open today's journal entry",
      "url": "/journal/today",
      "icons": [{ "src": "/icons/journal.png", "sizes": "192x192" }]
    },
    {
      "name": "Focus Mode",
      "short_name": "Focus",
      "description": "Start a focus session",
      "url": "/focus",
      "icons": [{ "src": "/icons/focus.png", "sizes": "192x192" }]
    }
  ]
}
```

### Icon Requirements

- PNG format (SVG not supported)
- At least 96x96, recommended 192x192
- These are separate from the app's main icons — purpose-built for shortcut items

### URL Handling in Next.js

Each shortcut URL must be within the app's `scope`. In `app/capture/page.tsx`, read the `mode` param:

```typescript
// app/capture/page.tsx
export default function CapturePage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const mode = searchParams.mode ?? 'default';
  // Render different capture UI based on mode
}
```

### place.org Application

Recommended shortcuts for place.org:
1. **Brain Dump** — `/?capture=brain-dump` — immediate capture modal
2. **Journal** — `/journal` — today's entry
3. **Focus** — `/focus` — start focus session
4. **Command Bar** — `/?cmd=1` — open command palette

### Sources

- [MDN — App Shortcuts](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_shortcuts)
- [web.dev — App Shortcuts](https://web.dev/articles/app-shortcuts)

**Verdict for place.org: Implement. Zero code cost, pure manifest config, high UX value for power users.**

---

## 3. Badging API

### What It Does

Puts a numeric badge on the installed PWA icon (taskbar, dock, home screen). Works exactly like unread mail badges on native apps.

### Browser Support

| Chrome | Edge | Firefox | Safari iOS | Safari macOS |
|--------|------|---------|------------|-------------|
| FULL (81+) | FULL (81+) | NO | FULL (16.4+) | FULL (17+) |

Global usage: ~47% of browsers. Notably absent: Firefox and Android Chrome (though Android PWAs on Chrome for Android don't show taskbar badges the same way).

### API

```typescript
// Set a number badge
await navigator.setAppBadge(count);

// Set a dot badge (no number)
await navigator.setAppBadge();

// Clear the badge
await navigator.clearAppBadge();
```

### Feature-Detected Hook for place.org

```typescript
// lib/badging.ts
export async function updateBadge(count: number): Promise<void> {
  if (!('setAppBadge' in navigator)) return;
  try {
    if (count === 0) {
      await navigator.clearAppBadge();
    } else {
      await navigator.setAppBadge(count);
    }
  } catch {
    // Silently fail — badge is an enhancement, not required
  }
}
```

### place.org Application

Use the badge for inbox count (unprocessed captures), overdue items, or notification count. Call `updateBadge()` when the relevant count changes. Integrates cleanly with a TanStack Query subscription or Zustand store effect.

### Sources

- [MDN — Badging API](https://developer.mozilla.org/en-US/docs/Web/API/Badging_API)
- [caniuse — setAppBadge](https://caniuse.com/mdn-api_navigator_setappbadge)

**Verdict for place.org: Implement. 3 lines of feature-detected code, real UX value for inbox-heavy workflows.**

---

## 4. File Handling API

### What It Does

Registers the PWA as the OS handler for specific file types. Double-clicking a `.md` file in Finder or Explorer opens place.org directly, with the file loaded.

### Browser Support

| Chrome | Edge | Firefox | Safari |
|--------|------|---------|--------|
| FULL (102+, desktop only) | FULL (102+, desktop only) | NO | NO |

Desktop only. Mobile not supported.

### Manifest Addition

```json
{
  "file_handlers": [
    {
      "action": "/open",
      "accept": {
        "text/markdown": [".md", ".markdown"],
        "text/plain": [".txt"]
      },
      "icons": [
        { "src": "/icons/md-file.png", "sizes": "256x256" }
      ],
      "launch_type": "single-client"
    }
  ]
}
```

`launch_type` options:
- `"single-client"` (default) — reuses existing app window, queues file via `launchQueue`
- `"multiple-clients"` — opens a new window per file

### JavaScript — LaunchQueue Consumer

```typescript
// app/layout.tsx or a client component that mounts once
'use client';
import { useEffect } from 'react';

export function FileHandlerRegistrar() {
  useEffect(() => {
    if (!('launchQueue' in window)) return;

    window.launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams.files.length) return;

      for (const fileHandle of launchParams.files) {
        const file = await fileHandle.getFile();
        const text = await file.text();
        // Route to journal or note editor with content
        // e.g., router.push('/journal/import') + store text in state
      }
    });
  }, []);

  return null;
}
```

The consumer fires exactly once per launch with all the files, regardless of timing.

### place.org Application

Register `.md` files so that a user's existing markdown notes open directly in place.org's journal. This makes place.org a native-feeling markdown OS component, not just a web app.

### Sources

- [Chrome Developers — File Handling API](https://developer.chrome.com/docs/capabilities/web-apis/file-handling)
- [MDN — Associate files with your PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Associate_files_with_your_PWA)

**Verdict for place.org: Implement. Creates an OS-level integration point. Only 20 lines of code after manifest changes.**

---

## 5. Share Target API

### What It Does

Registers the PWA as a destination in the OS share sheet. When the user shares a URL, text, or image from any other app (browser, Notion, Twitter), place.org appears as a target. Shared content lands in Brain Dump / capture flow.

### Browser Support

| Chrome Android | Chrome Desktop | Edge | Firefox | Safari |
|---------------|---------------|------|---------|--------|
| FULL (76+) | FULL (89+) | FULL | NO | PARTIAL |

App must be installed to appear as a share target.

### Manifest Addition

```json
{
  "share_target": {
    "action": "/capture",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

For GET method, shared data arrives as query params on the `action` URL.

### Next.js Handler

```typescript
// app/capture/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function CapturePage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const title = searchParams.get('title') ?? '';
    const text = searchParams.get('text') ?? '';
    const url = searchParams.get('url') ?? '';

    if (title || text || url) {
      const content = [title, text, url].filter(Boolean).join('\n\n');
      // Pre-populate the brain dump capture area with `content`
    }
  }, [searchParams]);

  // Render capture UI
}
```

### Gotchas

Per the spec, there is no guarantee which field other apps use. A shared URL may arrive in `text`, `url`, or even `title` depending on the sharing app. Always check all three fields.

For sharing files (images, PDFs), use `method: "POST"` with `enctype: "multipart/form-data"` — requires a service worker to intercept the POST.

### place.org Application

User is reading an article in Chrome → shares it → place.org appears in the share sheet → article URL + title land in the Brain Dump capture area. Zero friction knowledge capture from any app.

### Sources

- [Chrome Developers — Web Share Target](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target)
- [MDN — Share Target](https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target)

**Verdict for place.org: Implement. The Brain Dump use case is a perfect match. GET method is simple — no service worker needed.**

---

## 6. Protocol Handlers

### What It Does

Registers a custom URL scheme (`web+place://`) so that links in other documents, apps, or terminals can deep-link directly into place.org. Clicking `web+place://journal/2026-03-20` opens that journal entry.

### Browser Support

| Chrome | Edge | Firefox | Safari |
|--------|------|---------|--------|
| FULL | FULL | PARTIAL | NO |

Custom protocols must use the `web+` prefix. Standard protocols (`mailto`, `tel`) can also be registered.

### Manifest Addition

```json
{
  "protocol_handlers": [
    {
      "protocol": "web+place",
      "url": "/handle?uri=%s"
    }
  ]
}
```

The `%s` token is replaced with the full protocol URL (`web+place://journal/2026-03-20`).

### Next.js Handler

```typescript
// app/handle/page.tsx
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtocolHandlerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const uri = searchParams.get('uri');
    if (!uri) return;

    // Parse: web+place://journal/2026-03-20
    // uri = "web+place://journal/2026-03-20"
    const path = uri.replace(/^web\+place:\/\//, '/');
    router.replace(path);
  }, [searchParams, router]);

  return null; // Redirect page
}
```

### place.org Deep Link Scheme

```
web+place://journal/YYYY-MM-DD     → journal entry
web+place://capture/brain-dump     → brain dump
web+place://focus                  → focus mode
web+place://note/NOTE_ID           → specific note
```

These links can live in Obsidian notes, Alfred workflows, CLI scripts, or any other tool in the user's stack.

### Sources

- [MDN — protocol_handlers manifest field](https://developer.mozilla.org/en-US/docs/Web/Manifest/protocol_handlers)

**Verdict for place.org: Implement when the app has stable routes. High value for power users who link into it from other tools (Obsidian, terminal, Alfred).**

---

## 7. Display Override (Manifest Field)

### What It Does

`display_override` is a priority-ordered array of display modes. The browser picks the first mode it supports.

### All Valid Values

| Value | Behavior | Support |
|-------|---------|---------|
| `browser` | Normal browser tab | All |
| `minimal-ui` | Standalone window + minimal browser nav | Most |
| `standalone` | Standalone window, no browser UI | All |
| `fullscreen` | Full screen, no OS chrome | Most |
| `window-controls-overlay` | Standalone + content in title bar | Chrome/Edge desktop |
| `tabbed` | Multiple tabs in one PWA window | Chrome experimental |

### Recommended manifest for place.org

```json
{
  "display_override": ["window-controls-overlay", "standalone"],
  "display": "standalone"
}
```

Fallback chain: WCO (Chrome/Edge desktop) → standalone (everything else). The `display` field is the ultimate fallback for browsers that don't support `display_override` at all.

### Tabbed Mode (Experimental)

`tabbed` display mode (Chrome experimental, behind flag as of early 2026) would let place.org have native browser-like tabs within the PWA window — each "space" or "window" in the OS metaphor could be a tab. Worth watching but not production-ready.

### Sources

- [MDN — display_override](https://developer.mozilla.org/en-US/docs/Web/Manifest/display_override)

**Verdict for place.org: Already needed for WCO. Set `display_override` immediately — zero downside, works as a no-op if WCO isn't supported.**

---

## 8. Periodic Background Sync

### What It Does

Runs a service worker task on a schedule even when the app is closed. Use case: refresh journal data, sync remote sources, pre-fetch content.

### Browser Support

| Chrome | Edge | Firefox | Safari |
|--------|------|---------|--------|
| FULL (80+) | FULL (80+) | NO | NO |

Global coverage: ~78% (Chromium browsers). **Chromium-only.** Firefox and Safari not supported.

Requires:
- PWA must be installed
- User must have a "sufficient engagement score" with the app (Chrome determines this heuristically — generally means the user has actively used the PWA)
- App must have been used on the current network before
- `periodic-background-sync` permission must be granted (Chrome grants automatically for installed PWAs with sufficient engagement)

The `minInterval` is a hint — Chrome aligns actual sync frequency with user engagement. If the user opens the app daily, syncs run daily. The browser will never sync more frequently than `minInterval`.

### Registration

```typescript
// In the main app, after install
async function registerPeriodicSync() {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;

  if (!('periodicSync' in registration)) return;

  const status = await navigator.permissions.query({
    name: 'periodic-background-sync' as PermissionName,
  });

  if (status.state !== 'granted') return;

  try {
    await registration.periodicSync.register('journal-refresh', {
      minInterval: 24 * 60 * 60 * 1000, // 1 day minimum
    });
  } catch {
    // Not available or insufficient engagement — fail silently
  }
}
```

### Service Worker Handler

```typescript
// service-worker.ts
self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
  if (event.tag === 'journal-refresh') {
    event.waitUntil(refreshJournalData());
  }
});

async function refreshJournalData() {
  // Fetch latest data from any remote sources
  // Update cache for offline use
  // Can trigger a notification if something important changed
}
```

### place.org Application

Not a primary feature — the app is local-first so there is less data to sync. Useful if place.org adds optional cloud sync or external integrations (e.g., pulling in calendar events, syncing with an external API). Implement with graceful degradation: the app works perfectly without it.

### Sources

- [Chrome Developers — Periodic Background Sync](https://developer.chrome.com/docs/capabilities/periodic-background-sync)
- [MDN — Periodic Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Periodic_Background_Synchronization_API)

**Verdict for place.org: Defer until cloud sync is a feature. Low priority for a local-first app. Implement as enhancement later.**

---

## 9. Content Indexing API

### What It Does

Registers app content (journal entries, notes) with the browser so they appear in browser-native search surfaces. On Android, indexed content can appear in Chrome's "Articles for You" offline content feed.

### Browser Support

| Chrome | Edge | Firefox | Safari |
|--------|------|---------|--------|
| Chrome Android only | NO | NO | NO |

**Very limited support** — Chrome for Android only as of early 2026. Desktop Chrome does not expose any UI surface for the content index. The API exists but the practical user-visible surface is Android Chrome's Explore/Articles feed.

### API

```typescript
const registration = await navigator.serviceWorker.ready;

if (!('index' in registration)) return; // Feature detect

await registration.index.add({
  id: `journal-${entry.date}`,
  url: `/journal/${entry.date}`,
  title: `Journal — ${entry.date}`,
  description: entry.excerpt,
  icons: [{ src: '/icons/journal.png', sizes: '128x128', type: 'image/png' }],
  category: 'article',
});
```

### place.org Application

Minimal value for a desktop OS concept. The target user is not discovering content from the Android Chrome feed. The API is not mature enough on desktop to justify implementation now.

### Sources

- [MDN — Content Index API](https://developer.mozilla.org/en-US/docs/Web/API/Content_Index_API)

**Verdict for place.org: Skip. Android Chrome only, no desktop surface. Revisit if browser support broadens.**

---

## 10. Launch Handler API

### What It Does

Controls what happens when the user clicks the installed PWA icon (or a shortcut) while the app is already open. Without this, the browser opens a second window.

### Browser Support

| Chrome | Edge | Firefox | Safari |
|--------|------|---------|--------|
| FULL (98+) | FULL | NO | NO |

### Manifest Addition

```json
{
  "launch_handler": {
    "client_mode": "focus-existing"
  }
}
```

### client_mode Values

| Value | Behavior |
|-------|---------|
| `focus-existing` | Focuses the most recently used window. The launch URL is NOT navigated — it's provided via `launchQueue` for custom handling |
| `navigate-existing` | Focuses most recent window AND navigates it to the launch URL |
| `navigate-new` | Always opens a new window |
| `auto` | Default. Browser decides (usually `navigate-existing` on mobile, `navigate-new` on desktop) |

### With LaunchQueue

`focus-existing` is the best mode for an OS-like app — you handle the navigation yourself:

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function LaunchHandlerRegistrar() {
  const router = useRouter();

  useEffect(() => {
    if (!('launchQueue' in window)) return;

    window.launchQueue.setConsumer((launchParams: LaunchParams) => {
      if (!launchParams.targetURL) return;

      const url = new URL(launchParams.targetURL);
      // Handle the incoming URL — e.g., route to the right app section
      // or show a "you're already running" banner
      router.push(url.pathname + url.search);
    });
  }, [router]);

  return null;
}
```

### place.org Application

For a desktop OS metaphor, `focus-existing` is correct. Clicking the icon when place.org is already open should bring the existing window to focus, not spawn a second instance. This matches how native apps behave.

### Sources

- [MDN — Launch Handler API](https://developer.mozilla.org/en-US/docs/Web/API/Launch_Handler_API)

**Verdict for place.org: Implement. Single-instance behavior is table stakes for a "desktop OS" app. Two-line manifest change.**

---

## Summary: Complete manifest.json Additions

The combined manifest additions for everything recommended above:

```json
{
  "name": "place.org",
  "short_name": "place",
  "display_override": ["window-controls-overlay", "standalone"],
  "display": "standalone",

  "launch_handler": {
    "client_mode": "focus-existing"
  },

  "shortcuts": [
    {
      "name": "Brain Dump",
      "short_name": "Dump",
      "url": "/capture?mode=brain-dump",
      "icons": [{ "src": "/icons/shortcut-dump.png", "sizes": "192x192" }]
    },
    {
      "name": "Journal",
      "short_name": "Journal",
      "url": "/journal/today",
      "icons": [{ "src": "/icons/shortcut-journal.png", "sizes": "192x192" }]
    },
    {
      "name": "Focus Mode",
      "short_name": "Focus",
      "url": "/focus",
      "icons": [{ "src": "/icons/shortcut-focus.png", "sizes": "192x192" }]
    }
  ],

  "share_target": {
    "action": "/capture",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  },

  "file_handlers": [
    {
      "action": "/open",
      "accept": {
        "text/markdown": [".md", ".markdown"],
        "text/plain": [".txt"]
      },
      "icons": [{ "src": "/icons/md-file.png", "sizes": "256x256" }],
      "launch_type": "single-client"
    }
  ],

  "protocol_handlers": [
    {
      "protocol": "web+place",
      "url": "/handle?uri=%s"
    }
  ]
}
```

---

## Priority Stack Rank for place.org

| Rank | Feature | Effort | Impact | Browser Coverage | Do When |
|------|---------|--------|--------|-----------------|---------|
| 1 | Window Controls Overlay | Medium | Critical | Chrome/Edge desktop | Now |
| 2 | Launch Handler | Trivial | High | Chrome/Edge | Now (manifest only) |
| 3 | App Shortcuts | Trivial | High | Chrome/Edge/Safari partial | Now (manifest only) |
| 4 | Badging API | Low | Medium | Chrome/Edge/Safari | Now (10 lines) |
| 5 | Share Target | Low | High | Chrome/Edge + Android | Now (manifest + 1 page) |
| 6 | File Handling | Low | Medium | Chrome/Edge desktop | Near-term |
| 7 | Protocol Handlers | Low | Medium | Chrome/Edge | Near-term (need stable routes) |
| 8 | Periodic Background Sync | Medium | Low | Chromium-only | Defer to cloud sync phase |
| 9 | Content Indexing | Medium | Low | Android Chrome only | Skip for now |

### Tier 1 — Do Now (manifest-heavy, low code cost)

Items 1–5 collectively require ~50 lines of code + manifest additions + icon assets. They transform the app from a browser tab into something that feels like a first-class OS citizen.

### Tier 2 — Near-Term (stable routes required)

File Handling and Protocol Handlers both need stable URL routes for their action endpoints. Implement once the app's routing architecture is locked.

### Tier 3 — Defer or Skip

Periodic Background Sync is only meaningful once place.org has data to sync from a remote source. Content Indexing has no viable desktop surface.

---

## Related Notes

- [[Research - Modern Browser Capabilities 2025-2026]] — broader browser capabilities (WCO covered in Section 7)
- [[My Stack Decisions]]

#pwa #browser #place-org #manifest #research
