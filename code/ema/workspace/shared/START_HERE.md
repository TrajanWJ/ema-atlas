# START HERE — EMA Shared Workspace

If you are an agent landing in EMA on the agent VM, start here.

## Read in this order
1. `workspace/shared/README.md`
2. `workspace/shared/WORKSPACE_CONTRACT.md`
3. `docs/AGENT_SHARED_WORKSPACE_ARCHITECTURE.md`
4. the current dispatch doc in `workspace/shared/swarm/`
5. your actor file in `workspace/shared/actors/`

## 5-minute startup checklist
1. Open the current swarm/dispatch note.
2. Open your actor file or create one from `workspace/shared/templates/actor.md`.
3. Check `workspace/shared/handoffs/` for anything addressed to you.
4. Check `workspace/shared/sessions/` for active breadcrumbs you may need to resume.
5. Check `workspace/shared/schedules/` for current/next blocks.
6. Write output only to the declared location for your assignment.

## Folder quick map
- `actors/` — agent identity + current assignment records
- `handoffs/` — directed transfers between agents
- `plans/` — decomposition and architecture notes
- `schedules/` — time blocks and agenda-oriented planning
- `tasks/` — view definitions and generated exports, not canonical truth
- `sessions/` — breadcrumbs for active/resumable work
- `swarm/` — dispatches, maps, summaries, coordination docs
- `exports/` — material staged for promotion elsewhere
- `scratch/` — disposable working area

## Rules that matter most
- Shared workspace is a collaboration surface, not canon.
- Runtime truth lives in daemon/control-plane/session state.
- Durable semantic truth gets promoted into canon/docs later.
- Use repo-relative paths in notes.
- Use ISO-8601 UTC timestamps.
- Do not create random folders elsewhere on the VM when this workspace fits.

## Lifecycle rule
- Active work lives in active/current folders.
- Stale/closed work gets archived.
- Generated exports are non-authoritative.
- If something becomes durable truth, promote it instead of leaving it here forever.
