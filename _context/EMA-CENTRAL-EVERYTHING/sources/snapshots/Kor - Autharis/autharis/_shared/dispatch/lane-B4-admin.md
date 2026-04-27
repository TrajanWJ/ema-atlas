# Dispatch: Lane B4 — Admin product surface

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane B4 — Admin product surface**.

## Read first

1. `/Users/tawj/Desktop/Kor - Autharis/autharis/AGENTS.md`
2. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/README.md`
3. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`
4. `/Users/tawj/Desktop/Kor - Autharis/src/admin.jsx`
5. `/Users/tawj/Desktop/Kor - Autharis/src/app.css`
6. `/Users/tawj/Desktop/Kor - Autharis/autharis/lib/data.ts`

## Claim the lane

Edit `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`:
- change Lane B4 `Holder` to your session id
- change Lane B4 `Status` to `held`

If it is already held, stop.

## File scope

- `components/admin/**`
- `app/(admin)/**`
- `lib/admin/**`
- `styles/admin.css`

## Mission

Build the isolated admin console: activation queue, matching review, disputes, and reporting views. Keep it parallel-safe and integration-ready.

## Forbidden

- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `components/AppContext.tsx`
- `components/Icons.tsx`
- `styles/**`
- `lib/tweaks.ts`
- `lib/data.ts`

## Done definition

- isolated admin surface exists
- no protected files changed
- lane flipped to `in-review`
- one short entry appended to `_shared/decisions.md`

--- DISPATCH PROMPT END ---
