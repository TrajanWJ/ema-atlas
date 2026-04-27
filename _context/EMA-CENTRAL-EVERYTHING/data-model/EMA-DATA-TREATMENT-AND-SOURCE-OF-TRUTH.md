# EMA Data Treatment And Source Of Truth

This document defines how EMA should treat data at a system level so the app,
runtime, and docs do not collapse into one another again.

## Core rule

EMA is not "one database and some UI."

EMA has multiple data planes, and each plane has a different owner, durability
requirement, and sync rule.

If these planes get mixed, the product becomes incoherent.

## The six data planes

### 1. Canonical control-plane truth

What it is:
- organizations
- spaces
- projects
- actors
- memberships
- invites
- approvals
- proposals
- plans
- specs
- executions
- lanes
- handoffs
- blueprint structure

Owner:
- EMA daemon

Durability:
- durable
- auditable
- attributable
- replayable

Sync posture:
- replicated deliberately
- authority-aware
- position-aware

Rule:
- surfaces never write this directly
- agents never bypass workflow to mutate this directly

### 2. Shared collaboration state

What it is:
- live prose editing
- transient cursor/presence state
- collaborative document operations
- temporary shared drafting state

Owner:
- collaboration layer, mediated by EMA

Durability:
- partially durable
- eventually checkpointed into EMA-owned objects where needed

Sync posture:
- live multi-user sync
- may use CRDT/document-update protocols

Rule:
- collaboration is not canon by default
- presence is not product truth

### 3. Runtime and execution state

What it is:
- active runs
- task sessions
- harness state
- worker supervision state
- process health
- current peer health
- pending queues

Owner:
- runtime / harness / daemon supervisors

Durability:
- partially durable
- some events promoted into canonical audit lineage

Sync posture:
- fast-changing
- replicated only where needed for observability and recovery

Rule:
- runtime state is not the long-term record of the organization

### 4. Surface projections and caches

What it is:
- HQ views
- topbar selections
- launchpad summaries
- local window state
- filtered views
- client caches

Owner:
- surfaces and client-side shells

Durability:
- disposable or reconstructible

Sync posture:
- local-first where appropriate
- refreshed from daemon projections

Rule:
- projection is not authority

### 5. Imported knowledge and datasets

What it is:
- uploaded files
- imported prompts
- notes
- datasets
- external records
- raw source materials

Owner:
- EMA workspace object layer

Durability:
- durable when intentionally stored

Sync posture:
- replicated based on object policy and storage strategy

Rule:
- imported material is not canon until promoted into EMA workflow or linked as a
  recognized workspace object

### 6. Secrets and identity material

What it is:
- device keys
- org membership credentials
- signing material
- provider secrets
- SSH credentials
- restricted execution grants

Owner:
- native secure storage and daemon identity services

Durability:
- durable
- tightly scoped
- highly protected

Sync posture:
- never treated like ordinary workspace data

Rule:
- secrets should not live in plain project files, casual JSON blobs, or random
  surface state

## How Blueprint should fit

Blueprint is the first vApp, so it is the most important place to keep the
planes separate.

Blueprint should contain:

- canonical Blueprint object structure in EMA truth
- collaborative section text in the collaboration plane
- comments/suggestions with explicit promotion rules
- surface rendering in desktop/web shells

Blueprint should not become:

- a giant doc that secretly owns the project
- the only place where meaning lives
- an unbounded notes dump

## What the app should do with data

The app should always know which category a thing belongs to:

- canon
- collaboration
- runtime
- projection
- imported knowledge
- secret

That classification should determine:

- who can write it
- how it syncs
- how it is stored
- whether it is audit logged
- whether it is replicated
- whether it is safe to cache
- whether it can be promoted into canon

## Source-of-truth rules for 0.0.5

1. `Organization -> Space -> Project` is canonical topology.
2. The daemon owns canonical truth.
3. Blueprint structure belongs to canonical truth.
4. Blueprint live text can use a collaboration substrate, but that substrate is
   not canon by itself.
5. Invites, membership, approvals, and authority boundaries are canonical EMA
   objects.
6. Surface state is disposable unless explicitly promoted.
7. Runtime state is observable and attributable, but not the final historical
   truth by default.
8. Secrets and key material live outside ordinary workspace object storage.

## Practical result for the folder layout

- `doctrine/` explains the system
- `runtime/EMA-0.0.5--4-24/` builds the system
- `atlas/` informs the system
- `donors/` contributes patterns to the system
- `sources/snapshots/` preserves prior worlds without dictating the new one
