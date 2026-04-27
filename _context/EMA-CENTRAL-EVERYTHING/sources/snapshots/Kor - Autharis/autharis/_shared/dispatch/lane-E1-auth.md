# Dispatch: Lane E1 — Auth and identity

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane E1 — Auth and identity**.

## Read first

1. `/Users/tawj/Desktop/Kor - Autharis/autharis/AGENTS.md`
2. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/README.md`
3. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`
4. `node_modules/next/dist/docs/` for any Next 16 APIs you touch (middleware, route handlers, cookies)
5. `/Users/tawj/Desktop/Kor - Autharis/autharis/lib/data.ts` (read-only reference — existing user/talent shapes)

## Claim the lane

Edit `_shared/lanes.md`: change Lane E1 `Holder` to your session id and `Status` to `held`. If already held, stop.

## File scope

- `components/auth/**`
- `app/(auth)/**`
- `lib/auth/**`
- `middleware.ts`

## Mission

Stand up a prototype auth + identity layer that the client/talent/admin surfaces can later plug into:

- email + magic-link style sign-in UI (stubbed — no real email sending)
- role model: `client`, `talent`, `admin`
- session cookie read/write helpers (`lib/auth/session.ts`)
- `middleware.ts` that gates `(client)`, `(talent)`, `(admin)` route groups
- sign-in / sign-out / role-switcher dev affordance (the prototype needs a way to impersonate any role)

All persistence is cookie + localStorage only. No database integration in this lane — that is E2.

## Forbidden

- anything in the protected-file list (see `_shared/README.md`)
- `app/api/**` outside `app/api/auth/**` (E2 owns the rest)
- root prototype files under `/Users/tawj/Desktop/Kor - Autharis/src/**`

## Done definition

- role-gated routes work end-to-end with the dev impersonator
- no protected files changed
- lane flipped to `in-review`
- one short entry appended to `_shared/decisions.md`

--- DISPATCH PROMPT END ---
