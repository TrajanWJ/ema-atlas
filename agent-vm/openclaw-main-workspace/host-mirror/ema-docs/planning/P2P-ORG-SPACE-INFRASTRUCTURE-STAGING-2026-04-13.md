# P2P / Organizations / Invites / Spaces Infrastructure Staging

Status: active planning architecture  
Date: 2026-04-13
Plane: planning

## Purpose

Make the infrastructure layer around **spaces**, **organizations**, **invites**, and later **P2P federation** concrete enough to build incrementally without pretending the whole Genesis collaboration model already exists.

This document is intentionally **not canon** and **not runtime truth**. It is a planning bridge between:

- Canon ambition in `ema-genesis/`
- Current TypeScript/Electron reality in `services/`, `shared/`, `apps/renderer/`
- The explicit gap between them

---

## Plane declaration

### Canon

Canonical target still includes:
- multi-human / multi-agent collaboration
- spaces as major workspace boundaries
- organizations/teams as collaboration containers
- invites / membership flows
- P2P / federated multi-device and multi-peer infrastructure

Primary canon references:
- `ema-genesis/EMA-GENESIS-PROMPT.md`
- `ema-genesis/_meta/CANON-STATUS.md`
- `ema-genesis/intents/GAC-007/README.md`
- `ema-genesis/intents/INT-P2P-FEDERATED-SYNC/README.md`
- `ema-genesis/canon/decisions/DEC-002-crdt-filesync-split.md`

### Reality

Implemented today:
- `services/core/spaces/*` exists and is live
- spaces are **flat**, not nested
- default `personal` space cold-boots correctly
- shared schemas exist for spaces and space-scoped entities
- renderer has an org/invite UI/store shape, but there is no equivalent TS backend domain yet
- P2P federation is not an active runtime subsystem

Primary reality references:
- `docs/OPERATING-REALITY.md`
- `docs/GROUND-TRUTH.md`
- `shared/schemas/spaces.ts`
- `services/core/spaces/*`
- `apps/renderer/src/types/org.ts`
- `apps/renderer/src/stores/org-store.ts`

### Gap

The core gap is not "EMA lacks collaboration" in the abstract. The actual gap is more specific:

1. **Spaces exist without org ownership semantics**
2. **Org/invite flows have UI assumptions without backend authority**
3. **Membership is local-and-flat, not identity-backed**
4. **P2P exists as canon direction and research, not a near-term implementation lane**
5. **No explicit staged model currently tells future sessions what to build first**

---

## Executive decision for staging

EMA should build this infrastructure in **four layers**, each with different truth claims:

1. **Local workspace isolation** — already started via spaces
2. **Local collaboration scaffolding** — organizations + invites on one host
3. **Portable identity and membership receipts** — cross-host-safe object model without full federation yet
4. **Actual P2P federation** — sync, peer trust, remote membership propagation, convergence

This avoids the common failure mode of trying to solve orgs, permissions, identity, and distributed sync simultaneously.

---

## Core definitions

### 1. Space

A **space** is EMA's primary local work container.


Operational meaning for the current era:
- contains work context
- scopes intents / proposals / executions / layouts / future policies
- may be personal or collaborative
- remains **flat in v1**
- should not require P2P to exist

Near-term rule:
- A space is where work happens.
- An organization is who governs a set of spaces.

### 2. Organization

An **organization** is a governance and membership container, not the primary content container.

It should own:
- membership roster
- invite issuance and revocation
- default policy templates
- optional grouping of spaces
- future peer trust boundary metadata

It should not initially own:
- nested workspace topology
- distributed sync mechanics
- deep ACL inheritance chains

Near-term rule:
- orgs group spaces; spaces hold work.

### 3. Invite

An **invite** is a time-bound capability grant into an organization, and only indirectly into spaces.

Near-term meaning:
- an invite targets one org
- an invite proposes an initial org role
- an invite may optionally pre-bind a starter set of space memberships
- invite acceptance produces a durable membership receipt

Important constraint:
- do not model invites as raw “join a space directly” primitives first. That couples onboarding, permissions, and topology too early.

### 4. Membership receipt

A **membership receipt** is the durable record produced when an invite is accepted or a member is added manually.

It should capture:
- who granted access
- which org the membership belongs to
- what role was granted
- which spaces were auto-attached at issuance time
- when it was accepted / activated / revoked

Why this matters:
- it gives future P2P sync something durable to replicate
- it preserves provenance instead of mutating membership silently
- it separates "how access was granted" from "current effective membership"

### 5. Peer

A **peer** is a runtime node/device/host participating in EMA sync.

Not a near-term object of record for the local collaboration layer.

Near-term rule:
- peers should be treated as a later infrastructure layer that consumes org/membership primitives, not the primitive that defines them.

---

## Staged model

## Stage 0 — current verified reality

What exists now:
- flat spaces domain
- simple member arrays on space rows
- no org backend domain
- no invite backend domain
- no peer identity domain
- no federated sync runtime

What this means:
- EMA already has a valid local workspace boundary
- EMA does **not** yet have a durable collaboration authority model


## Stage 1 — local organization authority

Goal:
Introduce a local-only org authority layer on a single host/runtime.

Deliverables:
- `organization` entity
- `organization_member` entity
- `organization_invitation` entity
- invite preview / accept / revoke semantics
- space optionally linked to `organization_id`
- effective rule: personal spaces may have `organization_id = null`

Non-goals:
- public-key identity
- remote peers
- CRDT sync
- distributed trust

Why first:
- renderer already assumes this model
- it creates a single host truth before federation
- it makes spaces and orgs composable instead of conflated

## Stage 2 — space governance binding

Goal:
Make space membership derive cleanly from org membership plus explicit space roles.

Deliverables:
- `space.organization_id`
- `space_access_policy` or equivalent settings model
- explicit distinction between:
  - org membership
  - space membership
  - default space access
- starter-space assignment during invite issuance

Recommended operational rules:
- being in an org does **not** imply access to every space by default
- org role grants eligibility/governance; space membership grants workspace access
- personal spaces remain legal with no org link

## Stage 3 — portable identity foothold

Goal:
Prepare membership and invitation records for cross-host use without claiming full federation is ready.

Deliverables:
- optional `identity_pubkey` / identity handle fields on members
- signed or signable membership receipts as a future-compatible concept
- invite acceptance artifact shape that can later be mirrored across peers

Important boundary:
- this stage is about object-model readiness, not network transport

## Stage 4 — federation / P2P propagation

Goal:
Add actual multi-peer sync for the collaboration layer.

Deliverables:
- replicated org roster state
- replicated invite lifecycle state
- replicated membership receipts
- peer trust / verification / conflict rules
- offline acceptance + later reconciliation semantics

Hard dependency reminder:
`INT-P2P-FEDERATED-SYNC` is still long-horizon and explicitly blocked by broader system maturity. So this stage is later by design.

---

## Proposed authority model

## Authority stack

For the collaboration layer, authority should resolve in this order:

1. **Canon** says the target includes collaboration + P2P
2. **Local runtime authority** decides actual current org/space membership on one host
3. **Membership receipts** explain how a membership came to exist
4. **Future peer sync** mirrors or reconciles that authority

This means P2P does not invent truth from nowhere. It propagates already-shaped truth.

## Effective permissions principle

Use a deliberately simple initial model:

### Organization roles
- `owner`
- `admin`
- `member`
- `guest`

### Space roles
- `owner`
- `member`
- `viewer`


### Effective access rule
- org role determines governance capability
- space role determines workspace capability
- explicit space role beats org default
- no inheritance chains beyond this in the first iteration

---

## Data model direction

These are planning targets, not claims of present implementation.

### organization
- `id`
- `slug`
- `name`
- `description`
- `avatar_url?`
- `owner_id`
- `settings`
- `inserted_at`
- `updated_at`

### organization_member
- `id`
- `organization_id`
- `actor_id?`
- `display_name`
- `email?`
- `role`
- `status` (`invited | active | suspended | revoked`)
- `identity_pubkey?`
- `joined_at?`
- `invited_by?`
- `inserted_at`
- `updated_at`

### organization_invitation
- `id`
- `organization_id`
- `token` or token hash
- `role`
- `created_by`
- `expires_at?`
- `max_uses?`
- `use_count`
- `used_by[]`
- `starter_space_ids[]`
- `revoked`
- `inserted_at`
- `updated_at`

### membership_receipt
- `id`
- `organization_id`
- `organization_member_id`
- `source_kind` (`invite | manual | sync | migration`)
- `source_ref?`
- `granted_role`
- `starter_space_ids[]`
- `accepted_at?`
- `revoked_at?`
- `inserted_at`
- `updated_at`

### future peer_membership_assertion
Reserved for Stage 4+
- references receipt(s)
- adds peer provenance / signatures / sync metadata

---

## Recommended implementation order

### Slice A — contract foothold
Add shared TS schemas for:
- organizations
- organization members
- organization invitations
- membership receipts

Success condition:
- renderer/domain code can stop inventing ad-hoc shapes
- backend work gets a typed target

### Slice B — local backend authority
Add `services/core/organizations/*` with:
- list/get/create/update/delete org
- list/add/remove/update members
- create/revoke/preview/accept invite
- tests proving invite lifecycle

Success condition:
- renderer org flows point at a real backend
- org/invite state stops being UI-only assumption


### Slice C — spaces linkage
Extend spaces with optional `organization_id` and maybe `visibility`/policy settings.

Success condition:
- spaces can remain personal or become org-scoped without breaking flat-space semantics

### Slice D — provenance
Add membership receipt persistence and expose it in admin/debug surfaces.

Success condition:
- access grants become auditable and future-syncable

### Slice E — peer-ready prep
Only after the above: add identity and sync-specific metadata.

---

## Explicit non-goals for the next pass

Do **not** do these in the first org/invite implementation:
- nested spaces
- recursive org trees
- full RBAC matrix
- external identity provider integration
- CRDT sync for org state
- peer election / trust quorum / mesh failover
- org-level content replication policies

Those are real future topics, but bundling them now would blur planning and fantasy.

---

## Gap ledger entries implied by this doc

### Gap: canon → planning
Canon includes org/team/project and P2P ambition, but there was no concrete staged decomposition connecting flat spaces to local org authority and later federation.

### Gap: planning → reality
Renderer already carries org/invite assumptions; backend reality does not yet implement them.

### Gap: reality → canon
Current flat spaces reality partially conflicts with older Genesis wording around nested org > team > project spaces. GAC-007 already resolved the operational direction: flat first, optional nesting later.

### Gap: trace
No current durable record explains how an invite acceptance should later become federated membership truth. Membership receipts close this gap.

---

## Recommended next build move

**Build Stage 1 Slice B:** a local `organizations` backend domain with invite lifecycle, using shared schemas and no P2P claims.

Why this next:
- it matches existing renderer assumptions
- it strengthens collaboration without overreaching into federation
- it creates a clean authority source future P2P work can replicate
- it keeps spaces flat while still allowing org grouping

---

## Short version

- **Spaces are the work container**
- **Organizations are the governance container**
- **Invites grant org entry, optionally with starter spaces**
- **Membership receipts preserve access provenance**
- **P2P comes later and syncs these primitives instead of defining them**

That is the staged shape.
