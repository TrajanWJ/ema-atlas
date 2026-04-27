# Dispatch: Lane A1 — Shell primitives and shared app chrome

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane A1 — Shell primitives and shared app chrome**.

## Read first

1. `/Users/tawj/Desktop/Kor - Autharis/autharis/AGENTS.md`
2. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/README.md`
3. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`
4. `/Users/tawj/Desktop/Kor - Autharis/autharis/app/layout.tsx`
5. `/Users/tawj/Desktop/Kor - Autharis/autharis/app/globals.css`
6. `/Users/tawj/Desktop/Kor - Autharis/autharis/index.html` does not exist; use `/Users/tawj/Desktop/Kor - Autharis/index.html` plus `/Users/tawj/Desktop/Kor - Autharis/src/**` as design reference
7. Load skill: `frontend-design`

## Claim the lane

Edit `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`:
- change Lane A1 `Holder` to your session id
- change Lane A1 `Status` to `held`

If it is already held, stop.

## File scope

- `components/chrome/**`
- `components/ui/**`
- `components/icons/**`
- `lib/tweaks.ts`
- `lib/surfaces.ts`
- `lib/storage.ts`

## Mission

Build the reusable app shell primitives that other Autharis lanes can consume without touching the protected foundation files. That includes:

- top surface-switch chrome
- shared wordmark/logo primitives
- reusable segmented controls, badges, pills, and shell-level navigation helpers
- local-storage helpers for surface/tweak persistence
- any lightweight icon wrappers needed by downstream lanes

## Forbidden

- `app/layout.tsx`
- `app/globals.css`
- `styles/**`
- `lib/data.ts`
- any root-level prototype files under `/Users/tawj/Desktop/Kor - Autharis/src/**`

## Done definition

- primitives are reusable by marketing/client/talent/admin lanes
- no protected files changed
- lane flipped to `in-review`
- one short entry appended to `_shared/decisions.md`

--- DISPATCH PROMPT END ---
