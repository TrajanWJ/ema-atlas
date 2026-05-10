<!-- wiki-id: ema:host-node-doctrine -->
# Host-node doctrine — 2026-05-10

> Status: **accepted, doctrine lock**.
> Codifies sections §1.3 ("Org accessibility — binary, presence-based") and
> §1.4 ("The host node — three load-bearing roles") of
> `~/.claude/plans/your-missing-many-pieces-dazzling-tulip.md`.

## Context

EMA's earlier doctrine talked about "always-on nodes" and implied a graded
uptime model — a hosting role that could be more or less available, with
quality-of-service degrading as availability dropped. That framing leaked into
the writer-topology, lease-authority, and replication discussions and made
every downstream conversation harder than it needed to be.

The plan file's §1 reset the model around two crisper questions:

1. When is an organization actually reachable?
2. What does a host node do that a non-host device cannot?

Locking those answers as ADR-grade canon prevents the model drifting back
toward an uptime-gradient or a "primary tier" of host nodes.

## Decision

### 1. Org accessibility is binary

| State | Condition | Operations |
|---|---|---|
| **Accessible** | ≥1 hosting-enabled node online | All operations available; per-entity merge handles concurrency. |
| **Dark** | 0 hosting-enabled nodes online | Org is unreachable; no reads, no writes, no auth. |

There is **no uptime gradient**. An org is either accessible (one or more host
nodes are online and reachable) or dark (zero are). Surfaces, projections,
replication, and cockpit must treat the boundary as binary.

The Org → HostingEnabledNodes relation is **one-to-many with ≥1 required**.
An org with zero designated host nodes is a configuration error caught at
ceremony time, not a runtime state.

### 2. Host nodes carry three load-bearing roles

| Role | Why hosting is required |
|---|---|
| **State availability** | Host nodes hold the canonical event tail; new devices catch up FROM them. |
| **Concurrency arbitration (per-entity)** | Each host serializes its connected clients' writes for an entity; cross-host conflicts resolve per entity family. See [`2026-05-10-multi-host-conflict-policy.md`](./2026-05-10-multi-host-conflict-policy.md). |
| **Auth + web access gate** | Hosts bind to DERP-stable identities + serve OIDC callbacks; browser users log in to a host and get brokered into org state. |

A host node is not a "primary." There is no primary tier. Every host node
accepts writes for its connected clients, and conflicts resolve via the
per-entity policy in the conflict-policy ADR.

### 3. No primary tier

Q5 (multi-host write topology) collapses into peer-multi-write. Doctrine never
distinguishes a "primary host" from "follower hosts." Every host is a peer of
every other host within an org's host set.

### 4. Multi-org device support

A device can be hosting-enabled for any number of orgs. The host flag is
per-(device, org) — `device.hosting_enabled {device, org_id}` — not a global
device property. One physical Mac can be a host for the user's personal org
plus an external org plus a project org without the orgs becoming aware of
each other.

## Ceremonies (recap from §2 of the plan file)

- **Designate at first founding** — `ema org create --name <X>` MUST prompt
  for at least one hosting-enabled node before the org is accessible.
- **Promote** — `ema device promote-to-host --org <id>` writes
  `device.hosting_enabled {device, org_id}` and adjusts uptime monitoring +
  DERP-presence broadcast.
- **Demote** — `ema device demote-from-host --org <id>` is rejected if the
  device is the only hosting-enabled node for that org (would push the org
  dark). Otherwise emits `device.hosting_disabled`.

## What this replaces

- The "always-on node" terminology from earlier drafts. Replace
  occurrences inside the eight doctrine docs in this campaign's scope with
  "host node." The term "always-on" is still acceptable for non-EMA
  concepts (e.g. "always-on peer reachability later" referring to NAT
  traversal), but a node-as-role is a "host node."
- Any reading of `02-daemon-supervision.md` /
  `04-lease-authority.md` /
  `05-writer-topology.md` that implied a primary host or single-writer-per-org.
  Daemons that are hosting-enabled all accept writes; conflicts resolve per
  entity family.

## Consequences

- The accessibility check inside cockpit and surfaces becomes a **presence
  ping** ("is any host node responding for this org's mesh address?"), not
  a quality-of-service estimate.
- Org founding cannot complete until at least one host node is designated —
  this is enforced at the writer, not at the surface.
- Replication, OIDC callback addressing, and recovery packet broadcast all
  target "the org's host set," which is always non-empty for any reachable
  org.

## Implementation anchors

- §6E in the strategic stack (`Host-node ceremonies (designate, promote,
  demote)`) is the implementation track.
- New events: `device.hosting_enabled`, `device.hosting_disabled`. Belongs
  in `device.*` family, NOT a new family.
- Daemon module: `ema_identity` owns the host-flag ceremonies. The org
  accessibility check (binary) lives in the cockpit projection consumer.

## See also

- [`2026-05-10-multi-host-conflict-policy.md`](./2026-05-10-multi-host-conflict-policy.md)
- [`2026-05-10-recovery-bip39.md`](./2026-05-10-recovery-bip39.md)
- [`2026-04-24-transport-and-auth.md`](./2026-04-24-transport-and-auth.md)
- [`../architecture/01-topology.md`](../architecture/01-topology.md)
- [`../architecture/15-web-org-access-point.md`](../architecture/15-web-org-access-point.md)
