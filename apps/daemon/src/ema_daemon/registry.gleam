//// Named-actor registry.
////
//// Maps `<kind>:<ulid>` strings to a `Subject(Dynamic)`. When a
//// registered process dies the registry observes the DOWN and drops
//// the binding so stale lookups don't succeed.
////
//// M1 scope: runtime-only — no persistence. Entries are lost on
//// daemon restart and re-established lazily by each context.

import gleam/dict.{type Dict}
import gleam/dynamic.{type Dynamic}
import gleam/erlang/process.{type Pid, type Subject}
import gleam/list
import gleam/otp/actor
import gleam/otp/supervision.{type ChildSpecification}

pub type Key =
  String

pub type Msg {
  Register(
    key: Key,
    target: Subject(Dynamic),
    pid: Pid,
    reply: Subject(Result(Nil, RegistryError)),
  )
  Unregister(key: Key, reply: Subject(Nil))
  Lookup(key: Key, reply: Subject(Result(Subject(Dynamic), RegistryError)))
  List(reply: Subject(List(Key)))
  Down(pid: Pid)
}

pub type RegistryError {
  AlreadyRegistered(Key)
  NotFound(Key)
}

type Entry {
  Entry(target: Subject(Dynamic), pid: Pid)
}

type State {
  State(bindings: Dict(Key, Entry))
}

pub fn start() -> Result(actor.Started(Subject(Msg)), actor.StartError) {
  actor.new(State(bindings: dict.new()))
  |> actor.on_message(handle)
  |> actor.start
}

pub fn supervised() -> ChildSpecification(Subject(Msg)) {
  supervision.worker(start)
}

fn handle(state: State, msg: Msg) -> actor.Next(State, Msg) {
  case msg {
    Register(key, target, pid, reply) -> {
      case dict.get(state.bindings, key) {
        Ok(_) -> {
          process.send(reply, Error(AlreadyRegistered(key)))
          actor.continue(state)
        }
        Error(_) -> {
          // Monitor the pid so we know when to drop the entry.
          let _mon = process.monitor(pid)
          process.send(reply, Ok(Nil))
          let bindings = dict.insert(state.bindings, key, Entry(target, pid))
          actor.continue(State(bindings: bindings))
        }
      }
    }

    Unregister(key, reply) -> {
      let bindings = dict.delete(state.bindings, key)
      process.send(reply, Nil)
      actor.continue(State(bindings: bindings))
    }

    Lookup(key, reply) -> {
      case dict.get(state.bindings, key) {
        Ok(entry) -> process.send(reply, Ok(entry.target))
        Error(_) -> process.send(reply, Error(NotFound(key)))
      }
      actor.continue(state)
    }

    List(reply) -> {
      process.send(reply, dict.keys(state.bindings))
      actor.continue(state)
    }

    Down(dead_pid) -> {
      let bindings =
        dict.filter(state.bindings, fn(_k, entry) { entry.pid != dead_pid })
      actor.continue(State(bindings: bindings))
    }
  }
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

pub fn register(
  reg: Subject(Msg),
  key: Key,
  target: Subject(Dynamic),
  pid: Pid,
) -> Result(Nil, RegistryError) {
  process.call(reg, 5000, fn(reply) { Register(key, target, pid, reply) })
}

pub fn unregister(reg: Subject(Msg), key: Key) -> Nil {
  process.call(reg, 5000, fn(reply) { Unregister(key, reply) })
}

pub fn lookup(
  reg: Subject(Msg),
  key: Key,
) -> Result(Subject(Dynamic), RegistryError) {
  process.call(reg, 5000, fn(reply) { Lookup(key, reply) })
}

pub fn list_keys(reg: Subject(Msg)) -> List(Key) {
  process.call(reg, 5000, fn(reply) { List(reply) })
}

// Silence unused warnings while we're in M1.
fn unused_helper(x: List(Entry)) -> List(Entry) {
  list.reverse(x)
}

pub fn unused_keepalive() -> Nil {
  let _ = unused_helper([])
  Nil
}
