// ema/control_plane/event_log.gleam — single-writer event_log actor
//
// Types mirror research/build-steps/01-control-plane-skeleton.md
// exactly. The loop body is stubbed; the type surface is real so the
// rest of the scaffold can import it.

import gleam/dynamic.{type Dynamic}
import gleam/erlang/process.{type Subject}
import gleam/otp/actor
import gleam/otp/supervision

// ---------------------------------------------------------------------
// Opaque ID types (six + one). See build-step 01 §"Type sketches".
// ---------------------------------------------------------------------

pub opaque type ExecutionId {
  ExecutionId(String)
}

pub opaque type SessionId {
  SessionId(String)
}

pub opaque type ProviderSessionId {
  ProviderSessionId(String)
}

pub opaque type MemberId {
  MemberId(String)
}

pub opaque type ProjectId {
  ProjectId(String)
}

pub opaque type WorkspaceArtifactId {
  WorkspaceArtifactId(String)
}

pub opaque type PeerId {
  PeerId(String)
}

// ---------------------------------------------------------------------
// Domain sums — Placement, Actor, DispatchKind, Severity, IncidentRef
// ---------------------------------------------------------------------

pub type Placement {
  Local
  Daemon
  Peer(PeerId)
  HostAffinity(String)
}

pub type Actor {
  HumanActor(MemberId)
  AgentActor(MemberId)
  System
}

pub type DispatchKind {
  Queued
  Running
  Stalled
  Completed
  Failed
}

pub type Severity {
  Info
  Warn
  ErrorSev
  Critical
}

pub type IncidentRef {
  IncidentRef(String)
}

// ---------------------------------------------------------------------
// Event / EventBody — persisted records
// ---------------------------------------------------------------------

pub type EventBody {
  ProposalProposed(execution: ExecutionId, project: ProjectId)
  ExecutionStarted(execution: ExecutionId, placement: Placement)
  DispatchUpdate(execution: ExecutionId, kind: DispatchKind)
  IncidentOpened(incident: IncidentRef, severity: Severity)
  HostTransition(from_host: String, to_host: String)
}

pub type Event {
  Event(seq: Int, at_ms: Int, by: Actor, body: EventBody, payload: Dynamic)
}

pub type AppendError {
  PersistenceFailed(reason: String)
  Deferred(reason: String)
}

// ---------------------------------------------------------------------
// Actor mailbox — Subject(EventLogMsg)
// ---------------------------------------------------------------------

pub type EventLogMsg {
  Append(event: Event, reply_to: Subject(Result(Int, AppendError)))
  Recent(limit: Int, reply_to: Subject(List(Event)))
  ReplayFrom(seq: Int, reply_to: Subject(List(Event)))
}

pub type State {
  State(last_seq: Int)
}

// ---------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------

pub fn start() -> Result(actor.Started(Subject(EventLogMsg)), actor.StartError) {
  todo as "wired in step 01 — owns sqlight handle via persistence.gleam"
}

pub fn supervised() -> supervision.ChildSpecification(Subject(EventLogMsg)) {
  todo as "wired in step 01 — wrap start() with supervision.worker"
}

fn handle_message(
  _state: State,
  _msg: EventLogMsg,
) -> actor.Next(State, EventLogMsg) {
  todo as "wired in step 01 — dispatch Append/Recent/ReplayFrom to persistence"
}
