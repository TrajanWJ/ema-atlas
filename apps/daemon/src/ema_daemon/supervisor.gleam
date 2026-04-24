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

import ema_daemon/bus
import ema_daemon/ema_env
import ema_daemon/registry
import ema_shell_ipc/ema_shell_ipc
import gleam/erlang/process.{type Subject}
import gleam/otp/actor

pub type StartedTree {
  StartedTree(bus: Subject(bus.Msg), registry: Subject(registry.Msg))
}

pub type SupervisorError {
  ChildFailedToStart(child: String, reason: String)
}

/// Start bus + registry + IPC, wire them together.
pub fn start() -> Result(StartedTree, SupervisorError) {
  let db_path = ema_env.getenv_or("EMA_CANONICAL_DB", "./canonical.db")
  let bind_addr = ema_env.getenv_or("EMA_IPC_BIND", "127.0.0.1")
  let port = 49_555

  case bus.start(db_path) {
    Error(e) -> Error(ChildFailedToStart("bus", describe_start_error(e)))
    Ok(bus_started) -> {
      let bus_subject = bus_started.data
      case registry.start() {
        Error(e) ->
          Error(ChildFailedToStart("registry", describe_start_error(e)))
        Ok(registry_started) -> {
          let registry_subject = registry_started.data
          case ema_shell_ipc.start(bus_subject, bind_addr, port) {
            Error(reason) -> Error(ChildFailedToStart("shell_ipc", reason))
            Ok(_ipc) ->
              Ok(StartedTree(bus: bus_subject, registry: registry_subject))
          }
        }
      }
    }
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
  ["bus", "registry", "shell_ipc"]
}
