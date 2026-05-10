//// Boot recovery scanner for mid-flight executions.
////
//// EMA does not yet track provider PIDs per execution. On daemon boot,
//// any execution whose latest status event is still `execution.started`
//// is treated as interrupted because the previous daemon process is gone.

import ema_daemon/bus
import ema_daemon/sqlite_ffi
import ema_exec/ema_exec
import gleam/erlang/process.{type Subject}
import gleam/int
import gleam/io
import gleam/list

pub type ScanResult {
  ScanResult(recovered_count: Int, execution_ids: List(String))
}

pub type RestartRecoveryError {
  QueryFailed(reason: String)
  AppendFailed(reason: String)
}

pub fn scan(
  db_path: String,
  bus_subject: Subject(bus.Msg),
) -> Result(ScanResult, RestartRecoveryError) {
  case sqlite_ffi.open(db_path) {
    Error(sqlite_ffi.SqliteError(reason)) -> Error(QueryFailed(reason))
    Ok(db) -> {
      let rows = sqlite_ffi.running_executions(db)
      sqlite_ffi.close(db)
      case rows {
        Error(sqlite_ffi.SqliteError(reason)) -> Error(QueryFailed(reason))
        Ok(running) -> recover_rows(running, bus_subject, 0, [])
      }
    }
  }
}

fn recover_rows(
  rows: List(#(String, String, String, String, String, String)),
  bus_subject: Subject(bus.Msg),
  count: Int,
  execution_ids: List(String),
) -> Result(ScanResult, RestartRecoveryError) {
  case rows {
    [] -> {
      io.println(
        "ema restart recovery: recovered "
        <> int.to_string(count)
        <> " running execution(s)",
      )
      Ok(ScanResult(count, list.reverse(execution_ids)))
    }
    [#(org_id, dispatch_id, execution_id, last_event_kind, last_event_ts, prior_dispatch_state), ..rest] ->
      case
        ema_exec.interrupt_by_restart(
          bus_subject,
          org_id,
          "actor:boot_recovery_scanner",
          dispatch_id,
          execution_id,
          "running",
          last_event_kind,
          last_event_ts,
          prior_dispatch_state,
        )
      {
        Ok(_) ->
          recover_rows(rest, bus_subject, count + 1, [
            execution_id,
            ..execution_ids
          ])
        Error(e) -> Error(AppendFailed(ema_exec.describe_error(e)))
      }
  }
}

pub fn describe_error(error: RestartRecoveryError) -> String {
  case error {
    QueryFailed(reason) -> "query failed: " <> reason
    AppendFailed(reason) -> "append failed: " <> reason
  }
}
