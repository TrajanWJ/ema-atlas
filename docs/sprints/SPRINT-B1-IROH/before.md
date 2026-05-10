# Sprint B1 Iroh Reconnaissance Before

Generated: 2026-05-10T05:44:35Z

## supervisor.gleam

- Invocation: `cat apps/daemon/src/ema_daemon/supervisor.gleam `
- Exit code: `0`
- Matches expectation: yes - file should exist and show mounted children

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
import ema_shell_ipc/ema_shell_ipc
import ema_swarm_coordination/first_boot
import gleam/erlang/process.{type Subject}
import gleam/int
import gleam/otp/actor
import gleam/result

pub type StartedTree {
  StartedTree(
    bus: Subject(bus.Msg),
    collab: Subject(ema_collab.Msg),

```

## ema_replication.gleam

- Invocation: `cat apps/daemon/src/ema_replication/ema_replication.gleam `
- Exit code: `0`
- Matches expectation: yes - file should exist and keep replication gated

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

- Invocation: `cat apps/daemon/src/ema_replication/ema_collab_sync.gleam `
- Exit code: `0`
- Matches expectation: yes - file should exist and show trust-gated routes

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

- Invocation: `cat apps/daemon/src/ema_replication/ema_peers.gleam `
- Exit code: `0`
- Matches expectation: yes - file should exist and show peer trust writer

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

- Invocation: `head -150 apps/daemon/src/ema_collab/ema_collab.gleam `
- Exit code: `0`
- Matches expectation: yes - file should exist; only first 150 lines requested

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

## transport decision ADR

- Invocation: `cat docs/decisions/2026-04-24-transport-and-auth.md `
- Exit code: `0`
- Matches expectation: yes - ADR should confirm Iroh sidecar doctrine

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

## first boot architecture

- Invocation: `cat docs/architecture/10-first-boot.md `
- Exit code: `0`
- Matches expectation: yes - doc should include manual pairing v0 note

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

## transport/auth survey

- Invocation: `cat docs/architecture/11-transport-and-auth-survey.md `
- Exit code: `0`
- Matches expectation: yes - survey should match ADR and mention Iroh sidecar

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

- Invocation: `cat docs/operations/peer-computer-access.md `
- Exit code: `0`
- Matches expectation: yes - doc should distinguish SSH operator rail from Iroh product rail

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
- Matches expectation: recorded below - zero means installed; nonzero means install method needed

First 30 lines of stdout/stderr:

```text
[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).

```

## iroh --version

- Invocation: `iroh --version`
- Exit code: `127`
- Matches expectation: no - Iroh is not installed yet; record install method

First 30 lines of stdout/stderr:

```text
[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
bash: command not found: iroh

```

## existing Iroh/sidecar artifacts

- Invocation: `rg -l 'iroh|sidecar|peer.transport|stream_open|stream_close' apps/daemon/`
- Exit code: `0`
- Matches expectation: yes if empty or matching docs; confirms no existing implementation to preserve

First 30 lines of stdout/stderr:

```text
[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
apps/daemon/src/ema_replication/ema_collab_sync.gleam

```

## existing external-process patterns

- Invocation: `rg -l 'Port.open|Port.command|os.Process|System.cmd|open_port' apps/daemon/`
- Exit code: `0`
- Matches expectation: yes - finds Erlang Port patterns to mirror

First 30 lines of stdout/stderr:

```text
[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
apps/daemon/src/ema_projects/ema_project_fs.erl
apps/daemon/src/ema_identity/ema_device_keychain.erl

```

## daemon test directory

- Invocation: `ls apps/daemon/test/ `
- Exit code: `0`
- Matches expectation: yes - should list existing Gleam/ExUnit tests

First 30 lines of stdout/stderr:

```text
ema_clients_test.exs
ema_daemon_test.gleam
ema_dispatch_test.gleam
ema_exec_test.gleam
ema_intention_farmer_test.exs
ema_responsibilities_test.exs
ema_test_helpers.erl
test_helper.exs

```

## ema_daemon_test.gleam head

- Invocation: `head -80 apps/daemon/test/ema_daemon_test.gleam`
- Exit code: `0`
- Matches expectation: yes - establishes current Gleam test style

First 30 lines of stdout/stderr:

```text
[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
import gleeunit
import gleeunit/should

import ema_access_sessions/ema_access_sessions
import ema_blueprint/ema_blueprint
import ema_blueprint/planner_nodes
import ema_collab/ema_collab
import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}
import ema_identity/ema_device_keys
import ema_identity/ema_identity
import ema_identity/ema_pairing
import ema_invites/ema_invites
import ema_orgs/ema_orgs
import ema_replication/ema_collab_sync
import ema_replication/ema_peers
import ema_replication/ema_replication
import ema_swarm_coordination/agent_workspace
import ema_swarm_coordination/first_boot
import ema_vcalendar/ema_vcalendar
import gleam/erlang/process
import gleam/list
import gleam/option.{None, Some}
import gleam/string

pub fn main() {
  gleeunit.main()
}


```

## git status before

- Invocation: `git status --short --branch`
- Exit code: `0`
- Matches expectation: yes - records pre-existing dirty worktree to protect user work

First 30 lines of stdout/stderr:

```text
[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
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
 M apps/web/next-env.d.ts
 M docs/WORKSPACE-ENTRYPOINT.md
 M docs/agents/see-agent-work-agent-usage.md
 M docs/architecture/01-topology.md
 M docs/architecture/10-first-boot.md
 M docs/cli/agent-workspace.md
 M docs/cli/see-agent-work.md

```

## gleam test help

- Invocation: `cd apps/daemon && gleam test --help`
- Exit code: `0`
- Matches expectation: yes - establishes available test runner; multi-node support likely external smoke

First 30 lines of stdout/stderr:

```text
[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
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

## Iroh install/subcommand decision

- Installed at recon time: see `which iroh` and `iroh --version` sections above.
- If absent, B1 will use a dev/mock sidecar process for local protocol and supervisor tests, and the manifest will record the real Iroh installation as a blocker unless an installable `iroh` CLI is found during implementation.
- Sidecar invocation target for the sprint: external Iroh-compatible sidecar process speaking the B1 length-prefixed JSON protocol over local UDS/TCP. The tree documents Iroh as product transport, but no current daemon-side sidecar implementation exists.

## Test infrastructure finding

- Existing daemon tests are Gleam tests under `apps/daemon/test/ema_daemon_test.gleam` plus some ExUnit files. Multi-daemon network smoke is not represented in the current Gleam test style from this first-pass recon, so B1 smoke will likely be a script/harness unless further tree evidence says otherwise.

## Sprint-1 readiness contradiction

- `ema doctor --json` returned `health_ok: true` but `readiness_ok: false` before B1. This contradicts the prompt's "Sprint 1 must be complete" precondition if interpreted as full readiness. Proceeding because the user explicitly said "Go" and daemon health/IPC are reachable; recording this as a contradiction for the manifest.
