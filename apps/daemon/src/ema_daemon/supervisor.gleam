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
import ema_replication/sidecar
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
    registry: Subject(registry.Msg),
    sidecar: Subject(sidecar.Msg),
  )
}

pub type SupervisorError {
  ChildFailedToStart(child: String, reason: String)
}

/// Start bus + registry + IPC, wire them together.
pub fn start() -> Result(StartedTree, SupervisorError) {
  let db_path = ema_env.getenv_or("EMA_CANONICAL_DB", "./canonical.db")
  let bind_addr = ema_env.getenv_or("EMA_IPC_BIND", "127.0.0.1")
  let port =
    ema_env.getenv_or("EMA_IPC_PORT", "49555")
    |> int.parse
    |> result.unwrap(49_555)

  case bus.start(db_path) {
    Error(e) -> Error(ChildFailedToStart("bus", describe_start_error(e)))
    Ok(bus_started) -> {
      let bus_subject = bus_started.data
      case first_boot.seed_if_needed(bus_subject) {
        Error(first_boot.AppendFailed(reason)) ->
          Error(ChildFailedToStart("first_boot", reason))
        Ok(_) ->
          case ema_collab.start(db_path) {
            Error(e) ->
              Error(ChildFailedToStart("collab", describe_start_error(e)))
            Ok(collab_started) -> {
              let collab_subject = collab_started.data
              case registry.start() {
                Error(e) ->
                  Error(ChildFailedToStart("registry", describe_start_error(e)))
                Ok(registry_started) -> {
                  let registry_subject = registry_started.data
                  case
                    ema_shell_ipc.start(
                      bus_subject,
                      collab_subject,
                      bind_addr,
                      port,
                    )
                  {
                    Error(reason) ->
                      Error(ChildFailedToStart("shell_ipc", reason))
                    Ok(_ipc) -> {
                      let config =
                        sidecar_config(bus_subject, collab_subject)
                      case sidecar.start_link(config) {
                        Error(e) ->
                          Error(ChildFailedToStart(
                            "sidecar",
                            describe_start_error(e),
                          ))
                        Ok(sidecar_started) ->
                          Ok(StartedTree(
                            bus: bus_subject,
                            collab: collab_subject,
                            registry: registry_subject,
                            sidecar: sidecar_started.data,
                          ))
                      }
                    }
                  }
                }
              }
            }
          }
      }
    }
  }
}

fn sidecar_config(
  bus_subject: Subject(bus.Msg),
  collab_subject: Subject(ema_collab.Msg),
) -> sidecar.Config {
  let heartbeat_interval_ms =
    ema_env.getenv_or("EMA_IROH_HEARTBEAT_MS", "5000")
    |> int.parse
    |> result.unwrap(5000)

  sidecar.Config(
    daemon_id: ema_env.getenv_or("EMA_DAEMON_ID", "daemon:dev-local"),
    runtime_dir: ema_env.getenv_or("XDG_RUNTIME_DIR", "/tmp"),
    mode: sidecar_mode(),
    bus_subject: bus_subject,
    collab_subject: collab_subject,
    heartbeat_interval_ms: heartbeat_interval_ms,
  )
}

fn sidecar_mode() -> sidecar.Mode {
  case ema_env.getenv_or("EMA_IROH_MODE", "external") {
    "dev-loopback" | "loopback" ->
      sidecar.DevLoopback(node_id: ema_env.getenv_or(
        "EMA_IROH_NODE_ID",
        "iroh-node:dev-local",
      ))
    _ ->
      sidecar.External(
        command: ema_env.getenv_or("EMA_IROH_COMMAND", "iroh"),
        args: ["start"],
      )
  }
}

fn describe_start_error(e: actor.StartError) -> String {
  case e {
    actor.InitTimeout -> "init timeout"
    actor.InitFailed(m) -> "init failed: " <> m
    actor.InitExited(_) -> "init exited"
  }
}

pub fn children() -> List(String) {
  ["bus", "collab", "registry", "shell_ipc", "sidecar"]
}
