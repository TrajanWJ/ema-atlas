# Playbook — add a harness driver

Use this when you're adding a new harness driver to EMA: `claude-cli`,
`codex-cli`, `peer-remote`, `simulated-tui`, or another. Drivers sit
**above providers** and below dispatch — they are not interchangeable with
either.

> **Open question dependency:** the driver contract surface is
> [Q5 in `OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md). If Q5 is still open,
> your driver must implement *some* contract; document the assumed shape in
> the driver's docstring so it can be migrated when Q5 settles.

## Steps

1. **Read the existing seam first.**
   - `codebase-ema/code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md` — the plan
   - `codebase-ema/code/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md` — the contract
   - `codebase-ema/code/ema/daemon/lib/ema/surfaces/hermes_client.ex` — the working `hermes-native` reference
   - `codebase-claudeforge/packages/server/src/providers/hermes-provider.ts` — the surface-side contract that already works

2. **Sketch the driver in `simulated-tui` first** if it doesn't already exist,
   so you have a fast deterministic baseline for tests.

3. **Add the driver under** `code/ema/daemon/lib/ema/drivers/<name>.ex`
   (or wherever the registry currently lives — verify against the latest
   spec). Implement at minimum:
   - `dispatch/1` — accept a `Dispatch{execution_id, project_id, intent,
     placement_hint, capability_set, continuation_id}`
   - `cancel/1` — by `execution_id`
   - `stream_events/1` — emit `DispatchUpdate*` records into
     `control_plane/event_log`

4. **Register the driver** in the harness registry. Targets currently named
   in the docs: `hermes-native`, `claude-cli`, `codex-cli`, `peer-remote`,
   `simulated-tui`. Use the exact spelling.

5. **Write tests** that exercise:
   - dispatch → emits at least one `DispatchUpdate`
   - cancel → terminates without leaking sessions
   - capability mismatch → rejects with a clear reason (do not silently fall
     through to another driver)

6. **Document the driver** under `docs/drivers/<name>.md` with:
   - capability set it accepts
   - placement hints it honors
   - failure modes
   - any auth/credential requirements (cross-link to
     `docs-clis-mcps-integrations` if the auth pattern came from OpenClaw's
     gateway)

7. **Update the transfer pack:**
   - Add the driver to `graph/edges/execution.md` under "Driver targets".
   - If the driver introduces a new vocabulary tag (e.g. `mcp-driver`), add
     it to `graph/SCHEMA.md` first.

## Verification

```bash
mix test test/ema/drivers/<name>_test.exs
./scripts/check-graph.sh
```

Then exercise end-to-end against the daemon:
```bash
iex -S mix
iex> Ema.ControlPlane.propose(%{intent: ..., placement_hint: :local, driver: :<name>})
```

You should see `DispatchUpdate*` records in the event_log; surfaces
subscribed to projections should observe them; **no surface should call the
driver directly**.

## Commit message template

```
ema: add <name> driver to harness registry

- code/ema/daemon/lib/ema/drivers/<name>.ex: dispatch/cancel/stream_events
- code/ema/docs/drivers/<name>.md: capability set, placement, failure modes
- transfer-pack/graph/edges/execution.md: list under Driver targets

Driver contract assumed: <one-line description>. See OPEN_QUESTIONS.md Q5.
```

## Cross-references

- [`graph/edges/execution.md`](../graph/edges/execution.md)
- [`GLOSSARY.md`](../GLOSSARY.md) — Driver vs Provider vs Harness
- [`OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md) Q5
- [`graph/nodes/codebase-ema.qmd`](../graph/nodes/codebase-ema.qmd)
- [`graph/nodes/codebase-claudeforge.qmd`](../graph/nodes/codebase-claudeforge.qmd)
- [`graph/nodes/docs-clis-mcps-integrations.qmd`](../graph/nodes/docs-clis-mcps-integrations.qmd)
