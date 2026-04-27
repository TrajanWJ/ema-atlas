# HQ

A top-level surface (not a vApp proper) — the per-user, per-project
dashboard. Personal HQ aggregates across all Projects/Orgs the user
belongs to; project HQs focus on one project's live state. HQ is the
"what is happening" surface, distinct from Launchpad's "what can I open".

## What it owns

Nothing canonical. HQ is a **shell surface** that consumes
control-plane projections, workspace summaries, and external integration
feeds (GitHub repos, client links, uptime probes). It is read-mostly by
design.

## What it renders

- Live project pulse: running executions, recent dispatches, open
  incidents, queue depth, last 24h chronicle
- External feeds: GitHub PRs / commits / CI, client portal links, uptime
  status for hosted services
- Open-questions snapshot for the project
- Workstream cards (active workstreams with ETA / blockers)
- For Personal HQ: aggregated cards across all member projects, with
  per-org grouping

## What humans can do

- Drill from any pulse card into the underlying control-plane records
- Acknowledge / triage incidents inline
- Approve / reject pending control-plane proposals queued for the user
- Pin / reorder cards
- Switch between Personal HQ and any Project HQ

## What agents can do via CLI

- `ema hq pulse --project` (get the same pulse data the UI renders)
- `ema hq incident ack <id> --note`
- `ema hq proposal list --pending --for-user <id>`
- `ema hq proposal decide <id> --approve | --reject --reason`
- `ema hq feed register --kind github | uptime | client --config`

## Chronicle / review / memory links

- Approval / rejection of proposals from HQ writes a control-plane
  `Decision` event with the user as actor.
- Incident acknowledgements link to the underlying `Incident` record
  and any related `ExecutionId`.
- Feed registrations are workspace artifacts so Personal HQ can mirror
  them across projects.

## How it satisfies the canonical rule

HQ is the most read-heavy surface in the system; that's the point.
Every external feed lands as a typed projection in the control plane
(via a feed adapter), and HQ reads from the projection — not from the
feed directly. HQ code never holds incident state, never owns the
proposal queue, never stores feed credentials.

## v0.0.3 question

**After v0.0.3.** HQ becomes valuable in proportion to how much real
control-plane traffic exists. Pre-v0.0.3 it would render mostly empty
cards. The smallest provable slice (post-v0.0.3) is a Personal HQ that
shows running Hermes sessions across projects + GitHub PR status — two
feeds, one user. Build outward from there.
