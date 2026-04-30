# Browser Capabilities Reference

See the full reference document provided in the system prompt. This is the implementation status tracker.

## Implemented

| API | Status | Where |
|-----|--------|-------|
| PWA Manifest | Done | `public/manifest.json` |
| Capabilities Detection | Done | `src/stores/capabilities-store.ts` |
| Persistent Storage | Done | `src/lib/storage-persist.ts`, called on desktop mount |
| Screen Wake Lock | Done | `src/lib/wake-lock.ts`, `src/hooks/use-wake-lock.ts` |
| Idle Detection | Done | `src/lib/idle-detection.ts`, `src/hooks/use-idle-events.ts` |
| Notifications API | Done | `src/stores/notification-store.ts` |
| Badge API | Done | Wired in notification store |
| Document PiP | Done | `src/lib/doc-pip.ts`, Float button in Focus app |
| App Shortcuts | Done | In manifest.json, handled by `src/hooks/use-shortcut-actions.ts` |
| View Transitions | Partial | Ready to use, not yet wired into view switches |

## Not Yet Implemented

| API | Phase | Notes |
|-----|-------|-------|
| Window Controls Overlay | Phase 2 | Top bar needs WCO CSS env() values |
| Service Worker | Phase 2 | Need next-pwa or @serwist/next setup |
| Web Share | Phase 3 | Share buttons in Notes, Bookmarks |
| Share Target | Phase 3 | Service worker intercept for incoming shares |
| File Handling | Phase 3 | Notes opens .md files |
| File System Access | Phase 3 | Notes save-as to real files |
| Window Management API | Phase 3 | Multi-monitor workspace layouts |
| Protocol Handler | Phase 4 | Deep links from outside browser |
| Keyboard Lock | Phase 4 | Fullscreen mode polish |

## Icon Assets Needed

Still need actual PNG files in `public/icons/`:
- icon-192.png
- icon-512.png
- icon-maskable-512.png
- shortcut-note.png (96x96)
- shortcut-timer.png (96x96)
- shortcut-dump.png (96x96)
- badge-72.png
