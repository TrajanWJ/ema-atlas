# Dispatch: Lane B1 — Marketing surface

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane B1 — Marketing surface**.

## Read first

1. `/Users/tawj/Desktop/Kor - Autharis/autharis/AGENTS.md`
2. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/README.md`
3. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`
4. `/Users/tawj/Desktop/Kor - Autharis/index.html`
5. `/Users/tawj/Desktop/Kor - Autharis/src/marketing.jsx`
6. `/Users/tawj/Desktop/Kor - Autharis/src/app.css`
7. Load skill: `frontend-design`

## Claim the lane

Edit `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`:
- change Lane B1 `Holder` to your session id
- change Lane B1 `Status` to `held`

If it is already held, stop.

## File scope

- `components/marketing/**`
- `app/(marketing)/**`
- `lib/marketing/**`
- `public/marketing/**`

## Mission

Rebuild the Autharis editorial marketing experience inside isolated Next route-group files. Match the bolder second-pass direction from the prototype: stronger brand, more color, confident typography, and the timecard-led hero system.

Build in isolation so C1 can later wire it into the protected app entrypoints.

## Forbidden

- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `components/Marketing.tsx`
- `components/AppContext.tsx`
- `components/TweaksPanel.tsx`
- `components/Icons.tsx`
- `styles/**`
- `lib/tweaks.ts`
- `lib/data.ts`

## Done definition

- the marketing surface exists in isolated Next files
- it reads from shared primitives if they exist, but does not block on them
- no protected files changed
- lane flipped to `in-review`
- one short entry appended to `_shared/decisions.md`

--- DISPATCH PROMPT END ---
