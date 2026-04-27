// ema/drivers/registry.gleam — typed driver registry actor
//
// Mirrors research/build-steps/03-driver-registry-skeleton.md. The
// five DriverKind variants are the typed contract above providers
// (cf. EMA_V0_0_3_PREP.md "What changes" #1).

import gleam/erlang/process.{type Subject}
import gleam/option.{type Option}
import gleam/otp/actor
import gleam/otp/supervision

import ema/control_plane/event_log.{
  type Actor, type ExecutionId, type Placement, type ProjectId,
}

// ---------------------------------------------------------------------
// DriverKind sum (from HERMES_HARNESS_DRIVER_REGISTRY.md §4)
// ---------------------------------------------------------------------

pub type DriverKind {
  HermesNative
  ClaudeCli
  CodexCli
  PeerRemote
  SimulatedTui
}

// ---------------------------------------------------------------------
// Envelope, prompt, run handle
// ---------------------------------------------------------------------

pub type ToolRef {
  ToolRef(name: String, version: String)
}

pub type Prompt {
  Prompt(text: String, system: Option(String), tools: List(ToolRef))
}

pub opaque type RunHandle {
  RunHandle(execution: ExecutionId, driver: DriverKind, pid_ref: String)
}

pub type DispatchEnvelope {
  DispatchEnvelope(
    execution: ExecutionId,
    project: ProjectId,
    placement: Placement,
    driver: DriverKind,
    prompt: Prompt,
    by: Actor,
  )
}

// ---------------------------------------------------------------------
// Events / outcomes
// ---------------------------------------------------------------------

pub type ChunkKind {
  Stdout
  Stderr
  Reasoning
  Final
}

pub type Outcome {
  Completed
  Cancelled
  Errored(reason: String)
}

pub type DriverEvent {
  DriverStarted(handle: RunHandle, at_ms: Int)
  DriverChunk(handle: RunHandle, kind: ChunkKind, text: String)
  DriverToolCall(handle: RunHandle, tool: ToolRef, payload: String)
  DriverToolResult(
    handle: RunHandle,
    tool: ToolRef,
    ok: Bool,
    payload: String,
  )
  DriverEnded(handle: RunHandle, outcome: Outcome)
  DriverHeartbeat(handle: RunHandle, at_ms: Int)
}

pub type StartError {
  Deferred(reason: String)
  Rejected(reason: String)
  Crashed(reason: String)
}

pub type CancelError {
  NotFound
  AlreadyEnded
}

pub type DriverInfo {
  DriverInfo(kind: DriverKind, version: String, supports_streaming: Bool)
}

// ---------------------------------------------------------------------
// Driver record-of-functions (Gleam's behaviour-substitute)
// ---------------------------------------------------------------------

pub type Driver {
  Driver(
    kind: DriverKind,
    start: fn(DispatchEnvelope, Subject(DriverEvent)) ->
      Result(RunHandle, StartError),
    cancel: fn(RunHandle) -> Result(Nil, CancelError),
    describe: fn() -> DriverInfo,
  )
}

// ---------------------------------------------------------------------
// Registry mailbox
// ---------------------------------------------------------------------

pub type RegisterError {
  DuplicateKind(DriverKind)
}

pub type RegistryMsg {
  Register(driver: Driver, reply_to: Subject(Result(Nil, RegisterError)))
  Lookup(kind: DriverKind, reply_to: Subject(Result(Driver, Nil)))
  ListAll(reply_to: Subject(List(DriverInfo)))
}

pub type State {
  State(drivers: List(Driver))
}

pub fn start() -> Result(actor.Started(Subject(RegistryMsg)), actor.StartError) {
  todo as "wired in step 03 — register the five built-in drivers at boot"
}

pub fn supervised() -> supervision.ChildSpecification(Subject(RegistryMsg)) {
  todo as "wired in step 03"
}
