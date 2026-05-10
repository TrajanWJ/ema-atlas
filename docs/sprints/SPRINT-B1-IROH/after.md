# Sprint B1 Iroh Reconnaissance After

Generated: 2026-05-10T05:56:52Z

## supervisor.gleam

- Invocation: `cat apps/daemon/src/ema_daemon/supervisor.gleam`
- Exit code: `0`
- Matches expectation: yes - file exists; sidecar is now reported/mounted, but top-level is still manual start

First 30 lines of stdout/stderr:

```text
//// Top-level supervision tree for the EMA daemon.
////
//// M1 shape:
////
////   ema_daemon_sup (one_for_one)
////   ├── bus              (singleton, opens canonical.db)
////   ├── registry         (named-actor registry)
////   └── shell_ipc        (mist WS acceptor bound to the bus)
////
//// Context writers (identity/orgs/spaces/...) come online in M2+. For
//// M1 we start the three children directly and link them to the
//// entrypoint process; the top-level process is the supervisor of
//// record. A real `gleam/otp/static_supervisor` wrapper lands in M2
//// once there are more children to manage.

import ema_collab/ema_collab
import ema_daemon/bus
import ema_daemon/ema_env
import ema_daemon/registry
import ema_exec/restart_recovery
import ema_replication/sidecar
import ema_shell_ipc/ema_shell_ipc
import ema_swarm_coordination/first_boot
import gleam/erlang/process.{type Subject}
import gleam/int
import gleam/otp/actor
import gleam/result

pub type StartedTree {
  StartedTree(

```

## ema_replication.gleam

- Invocation: `cat apps/daemon/src/ema_replication/ema_replication.gleam`
- Exit code: `0`
- Matches expectation: yes - replication remains gated false and peer placement deferred

First 30 lines of stdout/stderr:

```text
//// ema_replication — lease, peer state, replication transport.
////
//// Wave 1 records the daemon contract shape while real daemon↔daemon
//// replication remains disabled. See `docs/architecture/04-lease-authority.md`
//// and `docs/architecture/11-transport-and-auth-survey.md`.

pub type NodeState {
  HomeCurrent
  ReplicaCurrent
  ReplicaProvisional
  ReplicaStale
  LocalDraft
  OfflineReadonly
}

pub type Placement {
  Local
  Daemon
  Peer(String)
  HostAffinity(String)
}

pub type ReplicableKind {
  EventLogTail
  WorkspaceArtifact
  BlueprintProse
}

pub type PeerStatus {
  PeerStatus(

```

## ema_collab_sync.gleam

- Invocation: `cat apps/daemon/src/ema_replication/ema_collab_sync.gleam`
- Exit code: `0`
- Matches expectation: yes - trust-gated routes remain unchanged

First 30 lines of stdout/stderr:

```text
//// Trust-gated live-collab replication boundary.
////
//// The future Iroh sidecar should call this layer after it receives a stream
//// packet. Transport moves bytes; this module decides whether the peer may
//// read or apply collab frames for an org.

import ema_collab/ema_collab
import ema_daemon/bus
import gleam/erlang/process.{type Subject}
import gleam/string

pub type CollabSyncError {
  EmptyOrg
  EmptyPeer
  PeerNotTrusted
  CollabFailed(ema_collab.CollabError)
}

pub fn frames_since_for_peer(
  bus_subject: Subject(bus.Msg),
  collab_subject: Subject(ema_collab.Msg),
  org_id: String,
  peer_device: String,
  document_id: String,
  after_revision: Int,
) -> Result(ema_collab.FrameBacklog, CollabSyncError) {
  case ensure_trusted(bus_subject, org_id, peer_device) {
    Error(e) -> Error(e)
    Ok(Nil) ->
      case

```

## ema_peers.gleam

- Invocation: `cat apps/daemon/src/ema_replication/ema_peers.gleam`
- Exit code: `0`
- Matches expectation: yes - establish_trust writer remains unchanged

First 30 lines of stdout/stderr:

```text
//// EMA peer trust writers.
////
//// This records org-scoped trust between device keys. It is not yet the
//// daemon-to-daemon transport; Iroh will consume this trust root later.

import ema_daemon/bus
import ema_daemon/event_envelope.{type Envelope, Envelope}
import gleam/erlang/process.{type Subject}
import gleam/json
import gleam/string

pub type PeerTrust {
  PeerTrust(event_id: String)
}

pub type PeerTrustError {
  EmptyOrg
  EmptyPeerDevice
  EmptyPeerPubkey
  EmptyLocalPubkey
  EmptyCeremony
  EmptyLineageProof
  InvalidCeremony(String)
  AppendFailed(String)
}

pub fn establish_trust(
  bus_subject: Subject(bus.Msg),
  org_id: String,
  peer_device: String,

```

## ema_collab.gleam head

- Invocation: `head -150 apps/daemon/src/ema_collab/ema_collab.gleam`
- Exit code: `0`
- Matches expectation: yes - collab still owns serialized revision frames

First 30 lines of stdout/stderr:

```text
//// BEAM-native live collaboration room for the first single-document slice.
////
//// The room is the high-frequency document authority: edits are serialized
//// through this actor and persisted to SQLite update-frame tables. The coarse
//// canonical event log is deliberately not used for every prose edit.

import ema_daemon/sqlite_ffi
import gleam/dynamic.{type Dynamic}
import gleam/erlang/process.{type Subject}
import gleam/list
import gleam/otp/actor
import gleam/otp/supervision.{type ChildSpecification}

pub const default_document_id: String = "blueprint_sec:01J00000000000000000000008"

pub type Msg {
  Open(
    document_id: String,
    actor_id: String,
    reply: Subject(Result(Snapshot, CollabError)),
  )
  ReplaceBody(
    document_id: String,
    body: String,
    actor_id: String,
    reply: Subject(Result(Snapshot, CollabError)),
  )
  UpdateBody(
    document_id: String,
    body: String,

```

## transport ADR

- Invocation: `cat docs/decisions/2026-04-24-transport-and-auth.md`
- Exit code: `0`
- Matches expectation: yes - authoritative ADR exists

First 30 lines of stdout/stderr:

```text
# 2026-04-24 — Transport, auth, and remote-surface decisions

**Status:** decided 2026-04-24. Recorded as a decision (rather than a survey)
2026-05-07 to match `WORKSPACE-ENTRYPOINT.md`, which already calls Iroh "the
default."

**Decision summary:**

- **Replication transport:** Iroh sidecar (QUIC + magicsock + DERP relay).
  Hyperswarm is the documented fallback if Iroh sidecar fails acceptance
  testing.
- **Device identity:** Ed25519 keypair stored in OS keychain (macOS
  Keychain / Secret Service / Windows DPAPI).
- **User identity:** Browser = Google Identity Services / OIDC; native =
  passkeys / WebAuthn.
- **Event authorship:** Signed events once replication ships. Unsigned
  accepted on replay of pre-replication logs.
- **Delegated capability:** Biscuit tokens (UCAN as fallback if browser-native
  issuance ever becomes a first-class need).
- **Screenshare:** WebRTC via LiveKit when remote surfaces land.
- **Remote terminal:** tmate / upterm-class relayed SSH, integrated via
  `dispatch.*` events.

The full shortlist, ranking matrix, and design rationale follow below as
reference material from the original 2026-04-24 survey. Do not re-open the
above decisions without an explicit superseding decision record.

---

## Original survey context

```

## first boot

- Invocation: `cat docs/architecture/10-first-boot.md`
- Exit code: `0`
- Matches expectation: yes - manual pairing docs exist

First 30 lines of stdout/stderr:

```text
# 10 — First-boot flow

The first time an EMA daemon runs on a device, it must land the primary
user into a usable workspace without any user action beyond launching
the app. This doc defines the canonical sequence for device 1 of the
founding operator.

The founding user is **Trajan**. On first-boot, the daemon seeds **two**
organizations: a personal org for Trajan and the EMA development org. Trajan
owns both. Later devices (paired in) skip this sequence — they replay the
existing log.

All events below are appended by the daemon to the canonical SQLite log
in the order shown. They are replayable: starting a fresh daemon on an
empty `canonical.db` and re-running this sequence yields identical
projections.

## Preconditions

- Daemon is started (launchd / systemd --user / manual dev script).
- `canonical.db` does not exist, or exists but has zero events.
- No `device:<ulid>` is registered.
- No `org:<ulid>` exists.

## Sequence

| #  | Event                      | Actor                    | Notes                                                               |
| -- | -------------------------- | ------------------------ | ------------------------------------------------------------------- |
| 1  | `install.initialized`      | `system:ema_identity`    | root install record; captures genesis device and install pubkey     |
| 2  | `identity.user_upserted`   | `system:ema_identity`    | creates the install-local founding user before device projection    |

```

## transport survey

- Invocation: `cat docs/architecture/11-transport-and-auth-survey.md`
- Exit code: `0`
- Matches expectation: yes - transport survey exists

First 30 lines of stdout/stderr:

```text
# 11 — Transport, auth, and remote-surface survey

Forward-looking decision survey. Not locked in wave 1 — replication bytes
don't fly yet (per `08-vanilla-workspace.md` out-of-scope list). This doc
exists so the replication, auth-hardening, and remote-surface waves start
from a pre-agreed shortlist rather than re-opening the whole field.

It covers three concerns that all touch the same wire:

1. **Cross-device replication transport** — how two EMA daemons on different
   machines exchange canonical events (and later, CRDT prose updates).
2. **Auth** — device identity, user identity, peer pairing, signed events,
   capability-scoped delegation to agents/connectors.
3. **Remote surfaces (later waves)** — screenshare, remote terminal, shared
   prompting, RDP-class "drive my EMA" flows.

The daemon is Gleam on BEAM (`02-daemon-supervision.md`), runs as a
user-level system service, and today only listens on
`ws://127.0.0.1:49555` for local surfaces. Everything below is about what
happens when EMA grows past one machine.

---

## 1. Replication transport

Requirements:

- **NAT traversal** — most users' devices are behind CGNAT / home routers.
  A transport that requires manual port forwarding is disqualified.
- **Bidirectional streams** — the event bus is append-then-fan-out; peers

```

## peer computer access

- Invocation: `cat docs/operations/peer-computer-access.md`
- Exit code: `0`
- Matches expectation: yes if file exists; tree wins if absent

First 30 lines of stdout/stderr:

```text
# 13 — Peer Computer Access

Status: proposed dev/operator rail
Date: 2026-04-24

This note answers the practical onboarding question: if EMA needs two trusted
machines to work together now, without Tailscale, what should we actually use?

## Decision

Use **OS-native SSH as the first trusted peer rail**.

Do not use the unauthenticated dev-update HTTP server as the main peer model.
It remains a throwaway file-transfer helper. The first real peer should be
onboarded as a trusted operating-system account with SSH key access, admin
membership where appropriate, and auditable sudo escalation.

Longer term, EMA-native peer transport still wants Iroh for daemon-to-daemon
streams. SSH is the bootstrap/operator rail; Iroh is the product rail.

## Why not Tailscale

Tailscale works, but it makes an external overlay's identity and ACL system sit
above EMA's own device trust model. That is acceptable as an optional power-user
path later, not as the default.

For the first peer, EMA needs to learn its own primitives:

- device identity;
- peer trust;

```

## which iroh

- Invocation: `which iroh`
- Exit code: `1`
- Matches expectation: no - iroh still absent on PATH

First 30 lines of stdout/stderr:

```text
iroh not found

```

## iroh version

- Invocation: `iroh --version`
- Exit code: `127`
- Matches expectation: no - iroh still absent on PATH

First 30 lines of stdout/stderr:

```text
(eval):1: command not found: iroh

```

## existing protocol artifacts

- Invocation: `rg -l 'iroh|sidecar|peer.transport|stream_open|stream_close' apps/daemon/`
- Exit code: `0`
- Matches expectation: yes - new sidecar modules now appear

First 30 lines of stdout/stderr:

```text
apps/daemon/test/ema_daemon_test.gleam
apps/daemon/test/b1_two_daemon_smoke.sh
apps/daemon/src/ema_replication/ema_collab_sync.gleam
apps/daemon/src/ema_daemon/supervisor.gleam
apps/daemon/src/ema_replication/sidecar.gleam
apps/daemon/src/ema_replication/sidecar_protocol.gleam
apps/daemon/src/ema_replication/sidecar_port.erl
apps/daemon/src/ema_replication/inbound_router.gleam

```

## external process patterns

- Invocation: `rg -l 'Port.open|Port.command|os.Process|System.cmd|open_port' apps/daemon/`
- Exit code: `0`
- Matches expectation: yes - Erlang open_port helpers plus new sidecar port helper appear

First 30 lines of stdout/stderr:

```text
apps/daemon/src/ema_projects/ema_project_fs.erl
apps/daemon/src/ema_identity/ema_device_keychain.erl
apps/daemon/src/ema_replication/sidecar_port.erl

```

## test directory

- Invocation: `ls apps/daemon/test/`
- Exit code: `0`
- Matches expectation: yes - daemon tests and smoke harness are present

First 30 lines of stdout/stderr:

```text
b1_two_daemon_smoke.sh
ema_clients_test.exs
ema_daemon_test.gleam
ema_dispatch_test.gleam
ema_exec_test.gleam
ema_intention_farmer_test.exs
ema_responsibilities_test.exs
ema_test_helpers.erl
test_helper.exs

```

## daemon test head

- Invocation: `head -80 apps/daemon/test/ema_daemon_test.gleam`
- Exit code: `0`
- Matches expectation: yes - Gleam tests include sidecar imports now

First 30 lines of stdout/stderr:

```text
import gleeunit
import gleeunit/should

import ema_access_sessions/ema_access_sessions
import ema_blueprint/ema_blueprint
import ema_blueprint/planner_nodes
import ema_collab/ema_collab
import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}
import ema_daemon/supervisor
import ema_identity/ema_device_keys
import ema_identity/ema_identity
import ema_identity/ema_pairing
import ema_invites/ema_invites
import ema_orgs/ema_orgs
import ema_replication/ema_collab_sync
import ema_replication/ema_peers
import ema_replication/ema_replication
import ema_replication/inbound_router
import ema_replication/sidecar
import ema_replication/sidecar_protocol
import ema_swarm_coordination/agent_workspace
import ema_swarm_coordination/first_boot
import ema_vcalendar/ema_vcalendar
import gleam/bit_array
import gleam/erlang/process
import gleam/json
import gleam/list
import gleam/option.{None, Some}
import gleam/string

```

## git status

- Invocation: `git status --short --branch`
- Exit code: `0`
- Matches expectation: yes - records dirty tree state

First 30 lines of stdout/stderr:

```text
## bootstrap/m2-m3-shell-port
 M AGENTS.md
 M CLAUDE.md
 M apps/cli/dist/bin.js
 M apps/cli/src/bin.ts
 M apps/cli/src/commands/agent.ts
 M apps/cli/src/commands/cockpit.ts
 M apps/cli/src/commands/doctor.ts
 M apps/cli/src/commands/events.ts
 M apps/cli/src/commands/harness.ts
 M apps/cli/src/commands/help.ts
 M apps/cli/src/commands/intention.ts
 M apps/cli/src/commands/lane.ts
 M apps/cli/src/commands/next.ts
 M apps/cli/src/commands/project.ts
 M apps/cli/src/commands/queue.ts
 M apps/cli/src/commands/recovery.ts
 M apps/cli/src/commands/vcalendar.ts
 M apps/cli/src/commands/wiki.ts
 M apps/cli/src/commands/workspace-daemon.ts
 M apps/cli/src/workspace-state.ts
 M apps/cli/tsconfig.tsbuildinfo
 M apps/daemon/src/ema_daemon/event_envelope.gleam
 M apps/daemon/src/ema_daemon/sqlite_ffi.gleam
 M apps/daemon/src/ema_daemon/supervisor.gleam
 M apps/daemon/src/ema_exec/ema_exec.gleam
 M apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam
 M apps/daemon/src/ema_sqlite_helpers.erl
 M apps/daemon/test/ema_daemon_test.gleam
 M apps/daemon/test/ema_exec_test.gleam

```

## gleam test help

- Invocation: `cd apps/daemon && gleam test --help`
- Exit code: `0`
- Matches expectation: yes - Gleam test runner available

First 30 lines of stdout/stderr:

```text
Run the project tests

This command runs the `main` function from the `<PROJECT_NAME>_test` module.

Usage: gleam test [OPTIONS] [ARGUMENTS]...

Arguments:
  [ARGUMENTS]...
          

Options:
  -t, --target <TARGET>
          The platform to target
          
          [possible values: erlang, javascript]

      --runtime <RUNTIME>
          The JavaScript runtime to target. This is only available on the JavaScript target
          
          [possible values: nodejs, deno, bun]

  -h, --help
          Print help (see a summary with '-h')

```

