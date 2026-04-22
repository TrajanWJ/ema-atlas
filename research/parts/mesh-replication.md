# Mesh / Replication / Presence — Gleam mapping

## Part summary

This is the strategic P2P direction: replication boundaries, authority
leases, peer placement, presence between humans and agents. The
constraint from `graph/edges/transport.md` is loud — distributed
semantics must not precede single-node clarity. EMA_V0_0_3_PREP.md
gate #6 is the concrete commitment: ship `Placement` as a typed value
on every dispatch, but reject `peer-remote` at runtime with a clear
"deferred" error. The Gleam port encodes mesh primitives (placement,
peer id, lease, ghost space, MCP gateway) at the type level today and
leaves the runtime stubs explicit.

## Type sketch

```gleam
import gleam/option.{type Option}

pub opaque type PeerId { PeerId(String) }
pub opaque type LeaseId { LeaseId(String) }

pub type Placement {
  Local
  Daemon
  Peer(PeerId)
  HostAffinity(String)
}

pub type Lease {
  Lease(
    id: LeaseId,
    holder: PeerId,
    target: LeaseTarget,
    granted_at_ms: Int,
    expires_at_ms: Int,
  )
}

pub type LeaseTarget {
  WorkstreamLease(project: ProjectId)
  SpaceLease(space: SpaceId)
  ToolLease(tool: String)
}

pub type ReplicableKind {
  WorkspaceArtifactRepl
  WikiNodeRepl
  EventLogTail
}

pub type SignedEnvelope(payload) {
  SignedEnvelope(
    origin_peer: PeerId,
    seq: Int,
    payload: payload,
    signature: BitArray,
  )
}

pub type PresencePing {
  PresencePing(member: MemberId, surface: SurfaceKind,
               at_peer: PeerId, at_ms: Int)
}

pub type DelegationToken {
  DelegationToken(
    granted_by: OrgId,
    granted_to: PeerId,
    capability: String,
    expires_at_ms: Int,
    signature: BitArray,
  )
}
```

## Actor sketch

```gleam
pub type LeaseManagerMsg {
  Acquire(target: LeaseTarget, requester: PeerId, ttl_ms: Int,
          reply_to: Subject(Result(Lease, LeaseError)))
  Release(lease: LeaseId)
  HolderOf(target: LeaseTarget, reply_to: Subject(Option(PeerId)))
}

pub type ReplicationMsg {
  Publish(kind: ReplicableKind, env: SignedEnvelope(BitArray))
  Subscribe(peer: PeerId, kinds: List(ReplicableKind))
  IncomingFromPeer(env: SignedEnvelope(BitArray))
}

pub type PresenceMsg {
  Heartbeat(ping: PresencePing)
  WhoIsIn(space: SpaceId, reply_to: Subject(List(PresencePing)))
}

pub type McpGatewayMsg {
  ExposeTool(name: String, scope: ToolScope)
  IncomingCall(from_peer: PeerId, tool: String, payload: BitArray,
               reply_to: Subject(Result(BitArray, GatewayError)))
}

pub type PlacementGuardMsg {
  Permit(p: Placement, reply_to: Subject(Result(Nil, PlacementError)))
}
```

- `ema/mesh/lease_manager` — `Subject(LeaseManagerMsg)`. New for
  v0.0.3 as a stub; only `Local` and `Daemon` placements actually
  exercise it.
- `ema/mesh/replication` — `Subject(ReplicationMsg)`. Stub today;
  every `Publish` for `Peer(_)` placement returns `Deferred`.
- `ema/mesh/presence` — `Subject(PresenceMsg)`. New; only single-node
  presence (members in a Space on this daemon) is real today.
- `ema/mesh/mcp_gateway` — `Subject(McpGatewayMsg)`. Stub; the
  outbound MCP-gateway shape is documented but not built.
- `ema/mesh/placement_guard` — `Subject(PlacementGuardMsg)`. The
  *required* gate per EMA_V0_0_3_PREP.md #6: rejects `Peer(_)` at
  runtime, accepts `Local`/`Daemon`/`HostAffinity(_)`.

## Supervision tree fragment

```text
root_supervisor
└── mesh/supervisor (one_for_one)
    ├── mesh/placement_guard       (REAL; rejects Peer(_) loudly)
    ├── mesh/lease_manager         (stub; only Local/Daemon paths)
    ├── mesh/replication           (stub; deferred for v0.0.3)
    ├── mesh/presence              (single-node only)
    └── mesh/mcp_gateway           (stub; ExposeTool no-op)
```

`mesh/supervisor` boots after `identity/supervisor` (peers and leases
both reference `OrgId` / `MemberId`) and after `control_plane/supervisor`
(replication piggy-backs on `event_log` semantics). It boots before
`http/supervisor` so external callers can never hit a missing guard.

## Where it leans on Erlang/Elixir interop

- BEAM distribution itself: `:erlang.set_cookie/2`,
  `:net_kernel.start/1`, `:erlang.nodes/0`. The Gleam daemon stays
  un-distributed for v0.0.3 but the API exists for later.
- `:rpc.call(node, mod, fun, args)` for the eventual peer-remote
  driver. Today the placement_guard rejects this path at the
  `Placement` type before it reaches `:rpc`.
- `:public_key` and `:crypto` for `SignedEnvelope.signature` and
  `DelegationToken.signature`. Gleam's `gleam/crypto` covers some of
  this; for Ed25519 we FFI directly.
- `:gen_tcp` / `:ssl` for raw peer transport if HTTP/2 over `:gun`
  proves too heavy.
- For CRDT convergence on replicable kinds: with no Gleam-native CRDT
  lib, FFI to Riak DT (`:riak_dt`) or build a minimal append-only log
  under `sqlight` and reconcile at read time.
- `:pg` (process groups) for fan-out of `PresencePing`.
- `:disk_log` is an option for the durable replication outbox if
  `sqlight` proves too slow.

## Tests this part needs at v0.0.3

- Placement-guard test (per gate #6 of EMA_V0_0_3_PREP.md): every
  `Permit(Peer(_))` returns `Error(PlacementError(Deferred))`;
  `Local`, `Daemon`, `HostAffinity(_)` all return `Ok(Nil)`.
- Lease-acquire test: two requests for the same `WorkstreamLease`
  succeed only for the first; second returns
  `Error(LeaseError(AlreadyHeld))` until expiry.
- Lease expiry test: a lease with `ttl_ms: 100` is released
  automatically; `HolderOf` returns `None` after expiry without
  explicit `Release`.
- Signed-envelope round-trip test: sign a `SignedEnvelope(BitArray)`
  with a known key, transmit through `replication.IncomingFromPeer`,
  verify signature succeeds; tampered payload fails verification.
- MCP gateway exposure test: `ExposeTool("vault.search",
  ReadOnlyScope)` registers; `IncomingCall(from_peer, "vault.search",
  ...)` is rejected today with `Deferred`.
- Property test (`gleam_qcheck`): for any sequence of `Heartbeat`
  pings, `WhoIsIn` returns deduplicated `MemberId`s and respects an
  age cutoff (no zombie members).

## Open questions specific to Gleam mapping

- **Q9** — replication boundary is *deliberately* deferred. Concrete
  Gleam pressure: `Placement.Peer(PeerId)` is a typed value with no
  legal runtime path; every test currently asserts the rejection.
  The day Q9 lands, `placement_guard` flips from "always reject" to
  "consult policy," which changes its message protocol.
- **Q1, Q2, Q3** gate Q9 by the OPEN_QUESTIONS rule. Concretely,
  `SignedEnvelope.origin_peer` cannot be checked against any membership
  model until Q1/Q3 settle, so `replication.IncomingFromPeer` would
  accept any signed payload from any peer.
- **Q8** — without a sync model, `ReplicableKind.WikiNodeRepl` cannot
  pick its convergence substrate. With no Gleam-native CRDT lib, we
  pick between FFI to Riak DT, FFI to a Yjs/Automerge sidecar, or a
  minimal append-only log under `sqlight`. Each choice changes the
  shape of `Publish` payloads. Q2/Q8 still open.
- **Distributed AI Delegation (vault candidate)** — `DelegationToken`
  compiles today but no actor consumes it. Until Q9 + Q10 land, this
  type is decorative; the pressure is whether to keep it in the
  Gleam tree at all.
- **MCP Gateway** — `mcp_gateway` is typed but stub. The pressure is
  whether to build it as a real `mist` HTTP endpoint mounted at
  `/mcp/*` (and which MCP wire version) before any peer consumes it.

## Read next

- `graph/edges/transport.md`
- `content/briefs/mesh-replication.md`
- `MACBOOK_AGENT_HANDOFF_MASTER.md` §10, §14
- `02-project-transfer-brief.md` §8, §11, §12 q5
- `docs-host-obsidian-vault/.../EMA Mesh Architecture.md`
- `docs-host-obsidian-vault/.../Intelligence-Integrations/MCP-GATEWAY-ARCH.md`
- `EMA_V0_0_3_PREP.md` gate #6
- `OPEN_QUESTIONS.md` Q1, Q2, Q3, Q8, Q9, Q10
- Erlang `:rpc`: https://www.erlang.org/doc/man/rpc.html
- Riak DT: https://github.com/basho/riak_dt
