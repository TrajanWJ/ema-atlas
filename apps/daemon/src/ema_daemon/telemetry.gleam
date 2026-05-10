//// In-process telemetry actor.
////
//// Subscribes to a 1Hz self-tick and samples every live BEAM process for
//// mailbox depth + cumulative reductions. Keeps a rolling window of the
//// last 60 samples per pid so observers can see hot mailboxes and
//// derive a CPU-time proxy from reductions deltas.
////
//// Snapshot is exposed via `Snapshot(reply)` and surfaced over IPC by
//// `bus.telemetry_snapshot_projection_json/1` on the bus, which simply
//// proxies to this actor by holding its Subject.
////
//// Option 1 of the strategic stack (observability-first). Reversible:
//// no schema, no persistence, no external deps. ETS-equivalent storage
//// is held inside the actor's state (List(Sample) per pid), capped at
//// `window_size` entries.

import gleam/dict.{type Dict}
import gleam/erlang/process.{type Subject}
import gleam/int
import gleam/list
import gleam/order
import gleam/otp/actor
import gleam/otp/supervision.{type ChildSpecification}
import gleam/string

// ---------------------------------------------------------------------------
// Public message + API types
// ---------------------------------------------------------------------------

pub type Msg {
  /// Internal: scheduled tick fires a sample sweep.
  Tick

  /// Snapshot reply: returns rendered JSON for the current rolling window.
  Snapshot(reply: Subject(String))
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

const tick_interval_ms: Int = 1000

const window_size: Int = 60

const top_n: Int = 10

type Sample {
  Sample(
    /// Monotonic millisecond timestamp at sample time.
    t_ms: Int,
    mailbox_len: Int,
    reductions: Int,
  )
}

type SeriesEntry {
  SeriesEntry(name: String, samples: List(Sample))
}

type State {
  State(self: Subject(Msg), series: Dict(String, SeriesEntry))
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

pub fn start() -> Result(actor.Started(Subject(Msg)), actor.StartError) {
  actor.new_with_initialiser(5000, fn(self) {
    // Schedule the first tick.
    let _timer = process.send_after(self, tick_interval_ms, Tick)
    State(self: self, series: dict.new())
    |> actor.initialised
    |> actor.returning(self)
    |> Ok
  })
  |> actor.on_message(handle)
  |> actor.start
}

pub fn supervised() -> ChildSpecification(Subject(Msg)) {
  supervision.worker(start)
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

fn handle(state: State, msg: Msg) -> actor.Next(State, Msg) {
  case msg {
    Tick -> {
      let now = monotonic_ms()
      let raw = processes_info()
      let new_series = ingest_samples(state.series, raw, now)
      let _timer = process.send_after(state.self, tick_interval_ms, Tick)
      actor.continue(State(..state, series: new_series))
    }

    Snapshot(reply) -> {
      process.send(reply, render_snapshot(state.series))
      actor.continue(state)
    }
  }
}

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------

fn ingest_samples(
  series: Dict(String, SeriesEntry),
  raw: List(#(String, String, Int, Int)),
  now: Int,
) -> Dict(String, SeriesEntry) {
  // Add the latest sample to each pid's series and prune to window_size.
  // Pids that disappeared between sweeps simply stop receiving new samples
  // and age out of the window naturally.
  list.fold(raw, series, fn(acc, row) {
    let #(pid_str, name, mailbox_len, reductions) = row
    let sample = Sample(t_ms: now, mailbox_len: mailbox_len, reductions: reductions)
    case dict.get(acc, pid_str) {
      Ok(entry) -> {
        let next = [sample, ..entry.samples] |> list.take(window_size)
        dict.insert(acc, pid_str, SeriesEntry(name: name, samples: next))
      }
      Error(_) ->
        dict.insert(acc, pid_str, SeriesEntry(name: name, samples: [sample]))
    }
  })
}

// ---------------------------------------------------------------------------
// Snapshot rendering (top-N hottest by mailbox depth p99)
// ---------------------------------------------------------------------------

type RankedRow {
  RankedRow(
    pid: String,
    name: String,
    mailbox_max: Int,
    mailbox_avg_x100: Int,
    reductions_per_sec: Int,
    sample_count: Int,
  )
}

fn render_snapshot(series: Dict(String, SeriesEntry)) -> String {
  let rows =
    dict.to_list(series)
    |> list.map(fn(pair) {
      let #(pid, entry) = pair
      rank_entry(pid, entry)
    })
    |> list.sort(fn(a, b) {
      // Sort descending by mailbox_max, tie-break by reductions_per_sec.
      case int.compare(b.mailbox_max, a.mailbox_max) {
        order.Eq -> int.compare(b.reductions_per_sec, a.reductions_per_sec)
        other -> other
      }
    })
    |> list.take(top_n)

  let total_pids = dict.size(series)
  let body = render_body(rows)
  "{\"window_seconds\":"
  <> int.to_string(window_size)
  <> ",\"sample_interval_ms\":"
  <> int.to_string(tick_interval_ms)
  <> ",\"tracked_pids\":"
  <> int.to_string(total_pids)
  <> ",\"top\":"
  <> body
  <> "}"
}

fn rank_entry(pid: String, entry: SeriesEntry) -> RankedRow {
  let samples = entry.samples
  let count = list.length(samples)
  let mailbox_max =
    list.fold(samples, 0, fn(acc, s) {
      case s.mailbox_len > acc {
        True -> s.mailbox_len
        False -> acc
      }
    })
  let mailbox_sum_x100 =
    list.fold(samples, 0, fn(acc, s) { acc + s.mailbox_len * 100 })
  let mailbox_avg_x100 = case count {
    0 -> 0
    _ -> mailbox_sum_x100 / count
  }
  let reductions_per_sec = compute_reductions_per_sec(samples)
  RankedRow(
    pid: pid,
    name: entry.name,
    mailbox_max: mailbox_max,
    mailbox_avg_x100: mailbox_avg_x100,
    reductions_per_sec: reductions_per_sec,
    sample_count: count,
  )
}

fn compute_reductions_per_sec(samples: List(Sample)) -> Int {
  case samples {
    [] -> 0
    [_only] -> 0
    [first, .._rest] -> {
      // samples are most-recent-first; oldest is the last element.
      case list.last(samples) {
        Error(_) -> 0
        Ok(oldest) -> {
          let dt_ms = first.t_ms - oldest.t_ms
          case dt_ms <= 0 {
            True -> 0
            False -> {
              let dr = first.reductions - oldest.reductions
              case dr < 0 {
                True -> 0
                False -> dr * 1000 / dt_ms
              }
            }
          }
        }
      }
    }
  }
}

fn render_body(rows: List(RankedRow)) -> String {
  case rows {
    [] -> "[]"
    _ -> "[" <> string.join(list.map(rows, render_row), ",") <> "]"
  }
}

fn render_row(row: RankedRow) -> String {
  let avg_int = row.mailbox_avg_x100 / 100
  let avg_frac = case row.mailbox_avg_x100 % 100 {
    f if f < 0 -> -1 * f
    f -> f
  }
  let avg_str = case avg_frac < 10 {
    True -> int.to_string(avg_int) <> ".0" <> int.to_string(avg_frac)
    False -> int.to_string(avg_int) <> "." <> int.to_string(avg_frac)
  }
  "{\"pid\":\""
  <> json_escape(row.pid)
  <> "\",\"name\":\""
  <> json_escape(row.name)
  <> "\",\"mailbox_max\":"
  <> int.to_string(row.mailbox_max)
  <> ",\"mailbox_avg\":"
  <> avg_str
  <> ",\"reductions_per_sec\":"
  <> int.to_string(row.reductions_per_sec)
  <> ",\"sample_count\":"
  <> int.to_string(row.sample_count)
  <> "}"
}

fn json_escape(s: String) -> String {
  s
  |> string.replace("\\", "\\\\")
  |> string.replace("\"", "\\\"")
  |> string.replace("\n", "\\n")
  |> string.replace("\r", "\\r")
  |> string.replace("\t", "\\t")
}

// ---------------------------------------------------------------------------
// Public API for the bus / IPC layer
// ---------------------------------------------------------------------------

pub fn snapshot_json(telemetry: Subject(Msg)) -> String {
  process.call(telemetry, 5000, fn(reply) { Snapshot(reply) })
}

// ---------------------------------------------------------------------------
// Erlang FFI
// ---------------------------------------------------------------------------

@external(erlang, "ema_telemetry_ffi", "processes_info")
fn processes_info() -> List(#(String, String, Int, Int))

@external(erlang, "ema_telemetry_ffi", "monotonic_ms")
fn monotonic_ms() -> Int
