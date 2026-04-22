// ema/drivers/simulated_tui.gleam — pure-Gleam test-double driver
//
// Per build-step 03, this is the conformance driver: produces a
// DriverStarted -> (some chunks) -> DriverEnded(Completed) sequence
// with monotonic at_ms timestamps. No external dependencies.

import gleam/erlang/process.{type Subject}

import ema/drivers/registry.{
  type CancelError, type DispatchEnvelope, type Driver, type DriverEvent,
  type DriverInfo, type RunHandle, type StartError, Driver, DriverInfo,
  SimulatedTui,
}

pub fn driver() -> Driver {
  Driver(
    kind: SimulatedTui,
    start: start,
    cancel: cancel,
    describe: describe,
  )
}

fn start(
  _env: DispatchEnvelope,
  _sink: Subject(DriverEvent),
) -> Result(RunHandle, StartError) {
  todo as "step 03 — emit DriverStarted, a few DriverChunks, DriverEnded(Completed)"
}

fn cancel(_handle: RunHandle) -> Result(Nil, CancelError) {
  todo as "step 03 — signal the run loop to emit DriverEnded(Cancelled) within 1s"
}

fn describe() -> DriverInfo {
  DriverInfo(kind: SimulatedTui, version: "0.0.3-scaffold", supports_streaming: True)
}
