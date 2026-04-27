# Dispatch: Lane C1 — App integration and route handoff

--- DISPATCH PROMPT BEGIN ---

You are dispatched to the Autharis swarm as session `<your-harness>-s<n>`. Your lane is **Lane C1 — App integration and route handoff**.

Do not start this lane until `U0` is unblocked and the isolated build lanes are ready.

## Read first

1. `/Users/tawj/Desktop/Kor - Autharis/autharis/AGENTS.md`
2. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/README.md`
3. `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`
4. every landed handoff in `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/handoffs/`
5. the protected files:
   - `/Users/tawj/Desktop/Kor - Autharis/autharis/app/page.tsx`
   - `/Users/tawj/Desktop/Kor - Autharis/autharis/app/layout.tsx`
   - `/Users/tawj/Desktop/Kor - Autharis/autharis/app/globals.css`
   - `/Users/tawj/Desktop/Kor - Autharis/autharis/styles/**`
   - `/Users/tawj/Desktop/Kor - Autharis/autharis/lib/data.ts`

## Claim the lane

Only claim this lane if `U0` is no longer blocked.

## File scope

- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `styles/**`
- `lib/data.ts`
- `components/app-shell/**`

## Mission

Integrate the isolated Autharis surfaces into the real app shell, reconcile the protected foundation files, and make the actual homepage/app entrypoints point at the new implementation.

## Done definition

- integrated app entrypoints are live
- protected files are reconciled, not overwritten blindly
- lane flipped to `in-review`
- one short entry appended to `_shared/decisions.md`

--- DISPATCH PROMPT END ---
