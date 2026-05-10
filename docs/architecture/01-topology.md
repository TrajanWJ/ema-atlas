# 01 — Topology

EMA is shaped as a fixed three-level hierarchy:

```
Organization → Space → Project
```

- **Organization** — the outermost authority boundary. Membership, billing,
  global roles, device registration. Every user has one personal organization
  created at first-boot.
- **Space** — a working context inside an organization. Own set of members
  (subset of org members), own invite surface, own settings. Projects live
  inside spaces.
- **Project** — the smallest unit of coordinated work. Owns blueprint
  documents, lanes, proposals, attachments, runs.

Topology is non-negotiable: there is no "flat project", no
"organization-less space", no "project spanning multiple spaces". A project
that needs to move between spaces is represented as a `project.moved` event
with lineage preserved.

## Personal organization

Every user has one personal org with identical surface shape as a real org
(same settings, invites, roles, device list). The difference is policy:

- Personal org cannot be renamed to impersonate a brand (enforced at
  invite time).
- Personal org billing plane is user-scoped.
- Personal org members default to {owner = user, others = invited guests}.

The shell should never branch UI by "is-personal-org"; it should branch by
policy flags exposed on the org record.

## Default space

Every organization starts with one default space that has the same name as the
organization. The default space is renamable, and the organization can contain
additional spaces.

On org creation, the daemon should append:

```text
org.created
space.created
```

in that order. The `space.created.name` should initially equal the
`org.created.name`.

The current EMA 0.0.6 deterministic seed creates Trajan's personal organization
with `Personal Workspace`, plus an EMA development workspace. The durable
Desktop project record agents address through the CLI is `EMA`; use
`--project EMA` for current workspace commands. Historical Founding-Fathers
seed names only belong in archive/provenance material.

## Identifiers

Every entity uses a ULID under a typed prefix: `org:<ulid>`, `space:<ulid>`,
`project:<ulid>`, `user:<ulid>`, `device:<ulid>`, `attachment:<ulid>`,
`connector:<ulid>`, etc. Registry keys use the same prefix form.

Path addressability (`<org>/<space>/<project>/…`) is a **query concern**,
not a registry key.

## Org → HostingEnabledNodes (≥1 required)

Locked 2026-05-10 by [`../decisions/2026-05-10-host-node-doctrine.md`](../decisions/2026-05-10-host-node-doctrine.md).

Every org has a one-to-many relation to **host nodes** (one or more
hosting-enabled devices). The cardinality is `≥1 required`: an org with
zero host nodes online is not accessible — operations halt at the boundary.
Org accessibility is **binary**, not a uptime gradient:

- **Accessible** — ≥1 host node online. All operations available;
  per-entity merge handles concurrency (see
  [`../decisions/2026-05-10-multi-host-conflict-policy.md`](../decisions/2026-05-10-multi-host-conflict-policy.md)).
- **Dark** — 0 host nodes online. Org is unreachable; no reads, no writes,
  no auth.

The host flag is per-(device, org), recorded as
`device.hosting_enabled {device, org_id}`. A device may host any number of
orgs; an org may have any number of host nodes. There is no "primary
host" — every host accepts writes for its connected clients and conflicts
resolve per entity family.

`ema org create` MUST designate at least one hosting-enabled node before
the org becomes accessible; `ema device demote-from-host --org <id>` is
rejected if the device is the only host (would push the org dark).

Topology stays non-negotiable: there is no "flat project", no
"organization-less space", no "project spanning multiple spaces", and no
"org without a host node."
