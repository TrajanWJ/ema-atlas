# Pomodoro (FlexiFocus Tracker)

> Soft-boundary focus/break timer — awareness-based, not rigid enforcement. Session analytics, PWA, Chrome extension.

## Quick Info

| Field | Value |
|---|---|
| **Location** | `/home/trajan/Desktop/Coding/Projects/pomodoro/` |
| **Stack** | Preact, Vite, TypeScript, Preact Signals |
| **Storage** | IndexedDB (idb) |
| **Charts** | Chart.js |
| **PWA** | vite-plugin-pwa |
| **Status** | Active development (v2) |

## Architecture

```
pomodoro/
├── main_app/          → Preact + Vite PWA
├── chrome-extension/  → Browser extension (tab tracking)
└── conception/        → Product spec, domain model, UX flows, mockups
```

Key patterns:
- BroadcastChannel sync between tabs
- Document Picture-in-Picture support
- Configurable audio notifications
- Session-based time tracking (actual vs target)

## Docs

Comprehensive specs in `conception/`:
- `PRODUCT-SPEC.md` — Full product specification
- `DOMAIN-MODEL.md` — Data model
- `UX-FLOW.md` — User experience flows
- `TECHNICAL-ARCHITECTURE.md` — System design
- `NOTIFICATION-DESIGN.md` — Notification strategy

## Gotchas

_None captured yet._

## Related Notes

- [[Trajan's Projects]]

#project #pomodoro #productivity #active
