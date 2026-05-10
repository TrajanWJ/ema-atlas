--- docs/sprints/SPRINT-B1-IROH/before.md	2026-05-10 01:44:36
+++ docs/sprints/SPRINT-B1-IROH/after.md	2026-05-10 01:56:52
@@ -1,12 +1,12 @@
-# Sprint B1 Iroh Reconnaissance Before
+# Sprint B1 Iroh Reconnaissance After
 
-Generated: 2026-05-10T05:44:35Z
+Generated: 2026-05-10T05:56:52Z
 
 ## supervisor.gleam
 
-- Invocation: `cat apps/daemon/src/ema_daemon/supervisor.gleam `
+- Invocation: `cat apps/daemon/src/ema_daemon/supervisor.gleam`
 - Exit code: `0`
-- Matches expectation: yes - file should exist and show mounted children
+- Matches expectation: yes - file exists; sidecar is now reported/mounted, but top-level is still manual start
 
 First 30 lines of stdout/stderr:
 
@@ -30,6 +30,8 @@
 import ema_daemon/bus
 import ema_daemon/ema_env
 import ema_daemon/registry
+import ema_exec/restart_recovery
+import ema_replication/sidecar
 import ema_shell_ipc/ema_shell_ipc
 import ema_swarm_coordination/first_boot
 import gleam/erlang/process.{type Subject}
@@ -39,16 +41,14 @@
 
 pub type StartedTree {
   StartedTree(
-    bus: Subject(bus.Msg),
-    collab: Subject(ema_collab.Msg),
 
 ```
 
 ## ema_replication.gleam
 
-- Invocation: `cat apps/daemon/src/ema_replication/ema_replication.gleam `
+- Invocation: `cat apps/daemon/src/ema_replication/ema_replication.gleam`
 - Exit code: `0`
-- Matches expectation: yes - file should exist and keep replication gated
+- Matches expectation: yes - replication remains gated false and peer placement deferred
 
 First 30 lines of stdout/stderr:
 
@@ -88,9 +88,9 @@
 
 ## ema_collab_sync.gleam
 
-- Invocation: `cat apps/daemon/src/ema_replication/ema_collab_sync.gleam `
+- Invocation: `cat apps/daemon/src/ema_replication/ema_collab_sync.gleam`
 - Exit code: `0`
-- Matches expectation: yes - file should exist and show trust-gated routes
+- Matches expectation: yes - trust-gated routes remain unchanged
 
 First 30 lines of stdout/stderr:
 
@@ -130,9 +130,9 @@
 
 ## ema_peers.gleam
 
-- Invocation: `cat apps/daemon/src/ema_replication/ema_peers.gleam `
+- Invocation: `cat apps/daemon/src/ema_replication/ema_peers.gleam`
 - Exit code: `0`
-- Matches expectation: yes - file should exist and show peer trust writer
+- Matches expectation: yes - establish_trust writer remains unchanged
 
 First 30 lines of stdout/stderr:
 
@@ -172,9 +172,9 @@
 
 ## ema_collab.gleam head
 
-- Invocation: `head -150 apps/daemon/src/ema_collab/ema_collab.gleam `
+- Invocation: `head -150 apps/daemon/src/ema_collab/ema_collab.gleam`
 - Exit code: `0`
-- Matches expectation: yes - file should exist; only first 150 lines requested
+- Matches expectation: yes - collab still owns serialized revision frames
 
 First 30 lines of stdout/stderr:
 
@@ -212,11 +212,11 @@
 
 ```
 
-## transport decision ADR
+## transport ADR
 
-- Invocation: `cat docs/decisions/2026-04-24-transport-and-auth.md `
+- Invocation: `cat docs/decisions/2026-04-24-transport-and-auth.md`
 - Exit code: `0`
-- Matches expectation: yes - ADR should confirm Iroh sidecar doctrine
+- Matches expectation: yes - authoritative ADR exists
 
 First 30 lines of stdout/stderr:
 
@@ -254,11 +254,11 @@
 
 ```
 
-## first boot architecture
+## first boot
 
-- Invocation: `cat docs/architecture/10-first-boot.md `
+- Invocation: `cat docs/architecture/10-first-boot.md`
 - Exit code: `0`
-- Matches expectation: yes - doc should include manual pairing v0 note
+- Matches expectation: yes - manual pairing docs exist
 
 First 30 lines of stdout/stderr:
 
@@ -296,11 +296,11 @@
 
 ```
 
-## transport/auth survey
+## transport survey
 
-- Invocation: `cat docs/architecture/11-transport-and-auth-survey.md `
+- Invocation: `cat docs/architecture/11-transport-and-auth-survey.md`
 - Exit code: `0`
-- Matches expectation: yes - survey should match ADR and mention Iroh sidecar
+- Matches expectation: yes - transport survey exists
 
 First 30 lines of stdout/stderr:
 
@@ -340,9 +340,9 @@
 
 ## peer computer access
 
-- Invocation: `cat docs/operations/peer-computer-access.md `
+- Invocation: `cat docs/operations/peer-computer-access.md`
 - Exit code: `0`
-- Matches expectation: yes - doc should distinguish SSH operator rail from Iroh product rail
+- Matches expectation: yes if file exists; tree wins if absent
 
 First 30 lines of stdout/stderr:
 
@@ -384,67 +384,73 @@
 
 - Invocation: `which iroh`
 - Exit code: `1`
-- Matches expectation: recorded below - zero means installed; nonzero means install method needed
+- Matches expectation: no - iroh still absent on PATH
 
 First 30 lines of stdout/stderr:
 
 ```text
-[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
+iroh not found
 
 ```
 
-## iroh --version
+## iroh version
 
 - Invocation: `iroh --version`
 - Exit code: `127`
-- Matches expectation: no - Iroh is not installed yet; record install method
+- Matches expectation: no - iroh still absent on PATH
 
 First 30 lines of stdout/stderr:
 
 ```text
-[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
-bash: command not found: iroh
+(eval):1: command not found: iroh
 
 ```
 
-## existing Iroh/sidecar artifacts
+## existing protocol artifacts
 
 - Invocation: `rg -l 'iroh|sidecar|peer.transport|stream_open|stream_close' apps/daemon/`
 - Exit code: `0`
-- Matches expectation: yes if empty or matching docs; confirms no existing implementation to preserve
+- Matches expectation: yes - new sidecar modules now appear
 
 First 30 lines of stdout/stderr:
 
 ```text
-[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
+apps/daemon/test/ema_daemon_test.gleam
+apps/daemon/test/b1_two_daemon_smoke.sh
 apps/daemon/src/ema_replication/ema_collab_sync.gleam
+apps/daemon/src/ema_daemon/supervisor.gleam
+apps/daemon/src/ema_replication/sidecar.gleam
+apps/daemon/src/ema_replication/sidecar_protocol.gleam
+apps/daemon/src/ema_replication/sidecar_port.erl
+apps/daemon/src/ema_replication/inbound_router.gleam
 
 ```
 
-## existing external-process patterns
+## external process patterns
 
 - Invocation: `rg -l 'Port.open|Port.command|os.Process|System.cmd|open_port' apps/daemon/`
 - Exit code: `0`
-- Matches expectation: yes - finds Erlang Port patterns to mirror
+- Matches expectation: yes - Erlang open_port helpers plus new sidecar port helper appear
 
 First 30 lines of stdout/stderr:
 
 ```text
-[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
 apps/daemon/src/ema_projects/ema_project_fs.erl
 apps/daemon/src/ema_identity/ema_device_keychain.erl
+apps/daemon/src/ema_replication/sidecar_port.erl
 
 ```
 
-## daemon test directory
+## test directory
 
-- Invocation: `ls apps/daemon/test/ `
+- Invocation: `ls apps/daemon/test/`
 - Exit code: `0`
-- Matches expectation: yes - should list existing Gleam/ExUnit tests
+- Matches expectation: yes - daemon tests and smoke harness are present
 
 First 30 lines of stdout/stderr:
 
 ```text
+b1_two_daemon_smoke.sh
 ema_clients_test.exs
 ema_daemon_test.gleam
 ema_dispatch_test.gleam
@@ -456,16 +462,15 @@
 
 ```
 
-## ema_daemon_test.gleam head
+## daemon test head
 
 - Invocation: `head -80 apps/daemon/test/ema_daemon_test.gleam`
 - Exit code: `0`
-- Matches expectation: yes - establishes current Gleam test style
+- Matches expectation: yes - Gleam tests include sidecar imports now
 
 First 30 lines of stdout/stderr:
 
 ```text
-[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
 import gleeunit
 import gleeunit/should
 
@@ -475,6 +480,7 @@
 import ema_collab/ema_collab
 import ema_daemon/bus
 import ema_daemon/event_envelope.{Envelope}
+import ema_daemon/supervisor
 import ema_identity/ema_device_keys
 import ema_identity/ema_identity
 import ema_identity/ema_pairing
@@ -483,31 +489,30 @@
 import ema_replication/ema_collab_sync
 import ema_replication/ema_peers
 import ema_replication/ema_replication
+import ema_replication/inbound_router
+import ema_replication/sidecar
+import ema_replication/sidecar_protocol
 import ema_swarm_coordination/agent_workspace
 import ema_swarm_coordination/first_boot
 import ema_vcalendar/ema_vcalendar
+import gleam/bit_array
 import gleam/erlang/process
+import gleam/json
 import gleam/list
 import gleam/option.{None, Some}
 import gleam/string
 
-pub fn main() {
-  gleeunit.main()
-}
-
-
 ```
 
-## git status before
+## git status
 
 - Invocation: `git status --short --branch`
 - Exit code: `0`
-- Matches expectation: yes - records pre-existing dirty worktree to protect user work
+- Matches expectation: yes - records dirty tree state
 
 First 30 lines of stdout/stderr:
 
 ```text
-[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
 ## bootstrap/m2-m3-shell-port
  M AGENTS.md
  M CLAUDE.md
@@ -530,13 +535,14 @@
  M apps/cli/src/commands/workspace-daemon.ts
  M apps/cli/src/workspace-state.ts
  M apps/cli/tsconfig.tsbuildinfo
- M apps/web/next-env.d.ts
- M docs/WORKSPACE-ENTRYPOINT.md
- M docs/agents/see-agent-work-agent-usage.md
- M docs/architecture/01-topology.md
- M docs/architecture/10-first-boot.md
- M docs/cli/agent-workspace.md
- M docs/cli/see-agent-work.md
+ M apps/daemon/src/ema_daemon/event_envelope.gleam
+ M apps/daemon/src/ema_daemon/sqlite_ffi.gleam
+ M apps/daemon/src/ema_daemon/supervisor.gleam
+ M apps/daemon/src/ema_exec/ema_exec.gleam
+ M apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam
+ M apps/daemon/src/ema_sqlite_helpers.erl
+ M apps/daemon/test/ema_daemon_test.gleam
+ M apps/daemon/test/ema_exec_test.gleam
 
 ```
 
@@ -544,12 +550,11 @@
 
 - Invocation: `cd apps/daemon && gleam test --help`
 - Exit code: `0`
-- Matches expectation: yes - establishes available test runner; multi-node support likely external smoke
+- Matches expectation: yes - Gleam test runner available
 
 First 30 lines of stdout/stderr:
 
 ```text
-[[31mERROR[0m] - (starship::print): Under a 'dumb' terminal (TERM=dumb).
 Run the project tests
 
 This command runs the `main` function from the `<PROJECT_NAME>_test` module.
@@ -576,16 +581,3 @@
 
 ```
 
-## Iroh install/subcommand decision
-
-- Installed at recon time: see `which iroh` and `iroh --version` sections above.
-- If absent, B1 will use a dev/mock sidecar process for local protocol and supervisor tests, and the manifest will record the real Iroh installation as a blocker unless an installable `iroh` CLI is found during implementation.
-- Sidecar invocation target for the sprint: external Iroh-compatible sidecar process speaking the B1 length-prefixed JSON protocol over local UDS/TCP. The tree documents Iroh as product transport, but no current daemon-side sidecar implementation exists.
-
-## Test infrastructure finding
-
-- Existing daemon tests are Gleam tests under `apps/daemon/test/ema_daemon_test.gleam` plus some ExUnit files. Multi-daemon network smoke is not represented in the current Gleam test style from this first-pass recon, so B1 smoke will likely be a script/harness unless further tree evidence says otherwise.
-
-## Sprint-1 readiness contradiction
-
-- `ema doctor --json` returned `health_ok: true` but `readiness_ok: false` before B1. This contradicts the prompt's "Sprint 1 must be complete" precondition if interpreted as full readiness. Proceeding because the user explicitly said "Go" and daemon health/IPC are reachable; recording this as a contradiction for the manifest.
