# apps/web

Browser-hosted EMA vDesktop. Also embedded by `apps/desktop` via Tauri v2
webview, so a single UI codebase runs in both.

## Canon Stack

As of 2026-04-24, the canonical web surface stack is:

- Next.js app router in `app/`
- React
- Motion
- Zustand
- copied place.org donor source under `src/place-donor/place-org/`

This is canon because the product target is the original place.org desktop
system reflected into EMA, and that donor code assumes the Next/Motion/Zustand
shape. Do not quietly revert `@ema/web` to a Vite SPA. The old `src/` tree may
remain as reference material, but the runnable surface is `app/`.

## Place.org Reflection

Wave 2 ports the donor desktop mechanics into the active shell:

- right-click desktop, file, and window menus
- simulated desktop filesystem plus Finder
- expanded place.org app catalog in Launchpad
- resizable, maximizable, snappable, detachable windows
- companion-bridge intent documented in `docs/architecture/14-companion-bridge.md`

## Organization Access Point

The browser is not a machine peer and is not added to the user's machine
network. It is a Google-authenticated, optionally Google-Authenticator-hardened
access point into an EMA organization instance. QR approval is still available
for trusted EMA machine surfaces and higher-risk ceremonies. Zustand stores in
`app/page.tsx` are split by responsibility:

- access session store: org id, Google user, Authenticator state, QR/session
  state, visible peer machines
- desktop store: UI-only windows, menus, wallpaper, and projected files

Durable truth belongs to the organization and its p2p peer machines. Browser
state is only the interactive desktop projection over that organization.

## Auth Environment

Google OAuth and Google Authenticator support are real routes, not stubs. Set:

```
EMA_GOOGLE_CLIENT_ID=...
EMA_GOOGLE_CLIENT_SECRET=...
EMA_SESSION_SECRET=at-least-32-random-bytes
EMA_GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback
EMA_AUTH_ISSUER_NAME=EMA
EMA_AUTH_STORE_PATH=/absolute/path/to/.ema-dev/web-auth-store.json
```

`EMA_GOOGLE_REDIRECT_URI` is optional in local dev if the request origin is
correct, but it should be explicit in deployed environments. Authenticator uses
standard TOTP and emits an `otpauth://` URI that Google Authenticator can scan
or import. `EMA_AUTH_STORE_PATH` is optional; by default the web server writes
to the ignored local `apps/web/.ema-dev/web-auth-store.json` bridge until
`ema_identity` owns durable daemon-side user records.

## Run (dev)

```
cd apps/web
pnpm dev
```

Dev runs Next on `http://localhost:5173`.

The local dev server is only an app host. Product semantics should treat the
web desktop as connected to an EMA organization access session, not to a local
server datastore.

## Route

| Path | Renders |
| --- | --- |
| `/` | Next-hosted place.org-style vDesktop with Launchpad as the first window |

## Structure

```
app/                    Canonical Next app surface
src/place-donor/        Copied place.org donor payload; excluded from build
src/                    Vite-era reference tree; not the canonical runtime
```

## Anti-drift rule

Surfaces never write durable truth. Any mutation eventually flows as a command
to the organization instance and then through its p2p machine network.
Surface-local state is UI-only: windows, focus, menus, scroll, and optimistic
desktop projection.
