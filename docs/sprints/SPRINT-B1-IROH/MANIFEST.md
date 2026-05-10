# Sprint B1 Iroh Manifest

## Commit Ledger

No commits were created. The tree had pre-existing dirty work, including files
touched by this sprint (`apps/daemon/src/ema_daemon/supervisor.gleam` and
`apps/daemon/test/ema_daemon_test.gleam`), so the B1 work is left unstaged for
review rather than mixing unrelated prior edits into `b1(N): ...` commits.

Implemented slices:

- B1.1 sidecar protocol: `ema_replication/sidecar_protocol.gleam`.
- B1.2 sidecar lifecycle actor: `ema_replication/sidecar.gleam` plus
  `ema_replication/sidecar_port.erl`.
- B1.3 inbound frame routing: `ema_replication/inbound_router.gleam`.
- B1.4 supervisor reporter/mount: `ema_daemon/supervisor.gleam`.
- B1.5 wave-start ADR: `docs/sprints/SPRINT-B1-IROH/WAVE-START.md`.
- B1.6 smoke harness: `apps/daemon/test/b1_two_daemon_smoke.sh`.

## Verification

- `cd apps/daemon && gleam test`: pass, 60 tests.
- `cd apps/daemon && gleam format --check ...`: pass.
- Trust-gate scan: pass. The only `ema_collab.apply_frame` call under
  `apps/daemon/src/ema_replication` remains in `ema_collab_sync.gleam`.
- Gate scan: pass. `replication_enabled()` still returns `False`, and
  `Placement.Peer(_)` still returns `Deferred(...)`.
- Full B1 two-daemon smoke: fail, exit code 2. Reason: no `iroh` binary is
  installed on PATH, so the real sidecar/network acceptance path cannot run.
  Full output is in `smoke.log`.

## Iroh Substrate

- Installed binary: none. `which iroh` exits 1.
- Version: unavailable.
- Candidate install path/method observed during recon: Cargo has
  `iroh-cli 0.28.1` and `iroh 1.0.0-rc.0`; Homebrew search did not show an
  `iroh` formula. No install was performed.
- Sidecar invocation pattern used in the supervisor config: `iroh start`, with
  `EMA_IROH_COMMAND` as the command override. The actor records
  `${XDG_RUNTIME_DIR:-/tmp}/ema-iroh-${daemon_id}.sock` as the local socket
  path, but no real Iroh process speaks the B1 length-prefixed JSON protocol
  yet.

## Protocol Decisions

No extra protocol decisions were made beyond B1.1. The frozen daemon-side
protocol is length-prefixed JSON with versioned envelopes and opaque
base64-encoded frame payloads. Payload semantics stay daemon-owned.

## Tree Contradictions

- Sprint 1 was not fully green by `ema doctor`: readiness remained blocked, and
  a later doctor check reported the daemon websocket unreachable.
- The prompt referenced a top-level supervisor restart strategy
  `max_restarts=10, max_seconds=60`; the current tree still starts children
  manually and explicitly says a real static supervisor is future work.
- The Iroh transport decision exists in docs, but no Iroh sidecar binary or
  wrapper exists in the tree or on PATH.
- B1 can prove the protocol/parser/router/trust-gate path in-process, but it
  cannot prove real LAN byte movement without the sidecar binary/protocol
  implementation.

## Adjacent Lies Surfaced

- The sidecar is reported as a daemon child, but crash/restart semantics are
  actor-local/manual-start semantics, not a real OS-process restart under a
  top-level supervisor.
- The smoke harness is intentionally honest: it runs guarded local tests and
  fails before claiming two-daemon Iroh acceptance.

## Surprise

The cleanest part was the trust boundary: the receiver can stay small because
`ema_collab_sync.apply_frame_from_peer` already owns peer trust and revision
policy.

## B2 Readiness

B2 is not tractable yet as a gate-flip sprint. The next groundwork is a real
Iroh-compatible sidecar process that speaks this local protocol and a real
supervision story for sidecar crash/restart.
