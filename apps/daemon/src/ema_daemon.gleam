//// EMA daemon entrypoint.
////
//// Boots the top-level supervisor and blocks forever. All actual work
//// happens inside the tree — see `ema_daemon/supervisor.gleam`.

import ema_daemon/supervisor
import gleam/erlang/process
import gleam/io
import gleam/string

pub fn main() {
  io.println("ema_daemon: starting 0.0.5")

  case supervisor.start() {
    Ok(_sup) -> {
      io.println("daemon up")
      process.sleep_forever()
    }
    Error(err) -> {
      io.println("ema_daemon: supervisor failed to start")
      io.println(string.inspect(err))
      Nil
    }
  }
}
