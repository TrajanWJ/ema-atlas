# Dispatch: Lane B2 — Client product surface

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane B2 — Client product surface**.

## Read first

1. `/Users/tawj/Desktop/Kor - Autharis/autharis/AGENTS.md`
2. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/README.md`
3. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`
4. `/Users/tawj/Desktop/Kor - Autharis/src/client.jsx`
5. `/Users/tawj/Desktop/Kor - Autharis/src/client_pages.jsx`
6. `/Users/tawj/Desktop/Kor - Autharis/src/app.css`
7. `/Users/tawj/Desktop/Kor - Autharis/autharis/lib/data.ts`

## Claim the lane

Edit `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`:
- change Lane B2 `Holder` to your session id
- change Lane B2 `Status` to `held`

If it is already held, stop.

## File scope

- `components/client/**`
- `app/(client)/**`
- `lib/client/**`
- `styles/client.css`

## Mission

Build the isolated client product surface: dashboard, job requests, top-pick matches with variants, engagements, timesheets, and invoices. Mirror the prototype behavior, but keep all writes inside the lane scope so integration can happen later.

## Forbidden

- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `components/ClientApp.tsx`
- `components/AppContext.tsx`
- `components/Icons.tsx`
- `styles/**`
- `lib/tweaks.ts`
- `lib/data.ts`

## Done definition

- isolated client surface exists
- match-card variant handling is local to this lane
- no protected files changed
- lane flipped to `in-review`
- one short entry appended to `_shared/decisions.md`

--- DISPATCH PROMPT END ---
