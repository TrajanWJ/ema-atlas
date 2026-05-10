//// Supervised actor boundary for the external Iroh sidecar.
////
//// B1 keeps transport lifecycle separate from collab semantics. Incoming
//// frames are routed through inbound_router, which calls ema_collab_sync.

import ema_collab/ema_collab
import ema_daemon/bus
import ema_replication/inbound_router
import ema_replication/sidecar_protocol
import gleam/dict.{type Dict}
import gleam/erlang/process.{type Subject}
import gleam/int
import gleam/option.{type Option, None, Some}
import gleam/otp/actor
import gleam/otp/supervision.{type ChildSpecification}
import gleam/string

pub type Config {
  Config(
    daemon_id: String,
    runtime_dir: String,
    mode: Mode,
    bus_subject: Subject(bus.Msg),
    collab_subject: Subject(ema_collab.Msg),
    heartbeat_interval_ms: Int,
  )
}

pub type Mode {
  External(command: String, args: List(String))
  DevLoopback(node_id: String)
}

pub type PeerHealth {
  Reachable
  Unreachable
  Unknown
}

pub type Health {
  Health(
    status: PeerHealth,
    sidecar_version: String,
    node_id: String,
    socket_path: String,
    process_status: String,
  )
}

pub type SidecarError {
  StreamNotFound(stream_id: String)
  SidecarUnavailable(reason: String)
}

pub type Msg {
  HealthRequest(reply: Subject(Result(Health, SidecarError)))
  DialPeer(
    peer_node_id: String,
    stream_purpose: String,
    reply: Subject(Result(String, SidecarError)),
  )
  RegisterStreamContext(
    stream_id: String,
    context: inbound_router.StreamContext,
    reply: Subject(Result(Nil, SidecarError)),
  )
  SendFrame(
    peer_node_id: String,
    stream_id: String,
    payload: BitArray,
    reply: Subject(Result(Nil, SidecarError)),
  )
  ReceiveFrame(
    message: sidecar_protocol.Message,
    reply: Subject(inbound_router.RouteResult),
  )
  CloseStream(stream_id: String, reply: Subject(Result(Nil, SidecarError)))
  PeerHealth(peer_node_id: String, reply: Subject(PeerHealth))
}

type Stream {
  Stream(
    stream_id: String,
    peer_node_id: String,
    stream_purpose: String,
    context: Option(inbound_router.StreamContext),
  )
}

type ProcessState {
  DevProcess
  ExternalProcess(port: ExternalPort)
  ExternalMissing(reason: String)
}

type State {
  State(
    config: Config,
    node_id: String,
    process: ProcessState,
    streams: Dict(String, Stream),
    peers: Dict(String, PeerHealth),
    next_stream: Int,
  )
}

pub type ExternalPort

pub fn start_link(
  config: Config,
) -> Result(actor.Started(Subject(Msg)), actor.StartError) {
  actor.new(initial_state(config))
  |> actor.on_message(handle)
  |> actor.start
}

pub fn supervised(config: Config) -> ChildSpecification(Subject(Msg)) {
  supervision.worker(fn() { start_link(config) })
}

pub fn health(sidecar: Subject(Msg)) -> Result(Health, SidecarError) {
  process.call(sidecar, 5000, fn(reply) { HealthRequest(reply) })
}

pub fn dial_peer(
  sidecar: Subject(Msg),
  peer_node_id: String,
  stream_purpose: String,
) -> Result(String, SidecarError) {
  process.call(sidecar, 5000, fn(reply) {
    DialPeer(peer_node_id, stream_purpose, reply)
  })
}

pub fn register_stream_context(
  sidecar: Subject(Msg),
  stream_id: String,
  context: inbound_router.StreamContext,
) -> Result(Nil, SidecarError) {
  process.call(sidecar, 5000, fn(reply) {
    RegisterStreamContext(stream_id, context, reply)
  })
}

pub fn send_frame(
  sidecar: Subject(Msg),
  peer_node_id: String,
  stream_id: String,
  payload: BitArray,
) -> Result(Nil, SidecarError) {
  process.call(sidecar, 5000, fn(reply) {
    SendFrame(peer_node_id, stream_id, payload, reply)
  })
}

pub fn receive_frame(
  sidecar: Subject(Msg),
  message: sidecar_protocol.Message,
) -> inbound_router.RouteResult {
  process.call(sidecar, 5000, fn(reply) { ReceiveFrame(message, reply) })
}

pub fn close_stream(
  sidecar: Subject(Msg),
  stream_id: String,
) -> Result(Nil, SidecarError) {
  process.call(sidecar, 5000, fn(reply) { CloseStream(stream_id, reply) })
}

pub fn peer_health(sidecar: Subject(Msg), peer_node_id: String) -> PeerHealth {
  process.call(sidecar, 5000, fn(reply) { PeerHealth(peer_node_id, reply) })
}

fn initial_state(config: Config) -> State {
  let #(process, node_id) = start_process(config)
  State(
    config: config,
    node_id: node_id,
    process: process,
    streams: dict.new(),
    peers: dict.new(),
    next_stream: 1,
  )
}

fn handle(state: State, msg: Msg) -> actor.Next(State, Msg) {
  case msg {
    HealthRequest(reply) -> {
      process.send(reply, Ok(current_health(state)))
      actor.continue(state)
    }
    DialPeer(peer_node_id, stream_purpose, reply) ->
      case sidecar_available(state.process) {
        Error(e) -> {
          process.send(reply, Error(e))
          actor.continue(state)
        }
        Ok(Nil) -> {
          let stream_id = "stream:" <> int.to_string(state.next_stream)
          let stream =
            Stream(
              stream_id: stream_id,
              peer_node_id: peer_node_id,
              stream_purpose: stream_purpose,
              context: None,
            )
          let state =
            State(
              ..state,
              streams: dict.insert(state.streams, stream_id, stream),
              peers: dict.insert(state.peers, peer_node_id, Reachable),
              next_stream: state.next_stream + 1,
            )
          process.send(reply, Ok(stream_id))
          actor.continue(state)
        }
      }

    RegisterStreamContext(stream_id, context, reply) -> {
      case dict.get(state.streams, stream_id) {
        Error(_) -> {
          process.send(reply, Error(StreamNotFound(stream_id)))
          actor.continue(state)
        }
        Ok(stream) -> {
          let stream = Stream(..stream, context: Some(context))
          let streams = dict.insert(state.streams, stream_id, stream)
          process.send(reply, Ok(Nil))
          actor.continue(State(..state, streams: streams))
        }
      }
    }

    SendFrame(_peer_node_id, stream_id, _payload, reply) -> {
      case dict.get(state.streams, stream_id) {
        Error(_) -> process.send(reply, Error(StreamNotFound(stream_id)))
        Ok(_) -> process.send(reply, Ok(Nil))
      }
      actor.continue(state)
    }

    ReceiveFrame(message, reply) -> {
      let result = route_inbound(state, message)
      process.send(reply, result)
      actor.continue(state)
    }

    CloseStream(stream_id, reply) -> {
      case dict.get(state.streams, stream_id) {
        Error(_) -> {
          process.send(reply, Error(StreamNotFound(stream_id)))
          actor.continue(state)
        }
        Ok(stream) -> {
          let streams = dict.delete(state.streams, stream_id)
          let peers = dict.insert(state.peers, stream.peer_node_id, Unreachable)
          process.send(reply, Ok(Nil))
          actor.continue(State(..state, streams: streams, peers: peers))
        }
      }
    }

    PeerHealth(peer_node_id, reply) -> {
      case dict.get(state.peers, peer_node_id) {
        Ok(health) -> process.send(reply, health)
        Error(_) -> process.send(reply, Unknown)
      }
      actor.continue(state)
    }
  }
}

fn route_inbound(
  state: State,
  message: sidecar_protocol.Message,
) -> inbound_router.RouteResult {
  case message {
    sidecar_protocol.Message(
      _,
      _,
      sidecar_protocol.FrameReceived(stream_id: stream_id, ..),
    ) ->
      case dict.get(state.streams, stream_id) {
        Error(_) -> inbound_router.DroppedUnexpectedMessage
        Ok(stream) ->
          case stream.context {
            Some(context) ->
              inbound_router.route_received_frame(
                state.config.bus_subject,
                state.config.collab_subject,
                context,
                message,
              )
            None -> inbound_router.DroppedCollabError("stream has no context")
          }
      }
    _ -> inbound_router.DroppedUnexpectedMessage
  }
}

fn current_health(state: State) -> Health {
  Health(
    status: process_health(state.process),
    sidecar_version: sidecar_version(state.process),
    node_id: state.node_id,
    socket_path: socket_path(state.config),
    process_status: process_status(state.process),
  )
}

fn start_process(config: Config) -> #(ProcessState, String) {
  case config.mode {
    DevLoopback(node_id) -> #(DevProcess, node_id)
    External(command, args) ->
      case open_external(command, args) {
        Ok(port) -> #(ExternalProcess(port: port), "unknown")
        Error(reason) -> #(ExternalMissing(reason: reason), "unknown")
      }
  }
}

fn sidecar_available(process: ProcessState) -> Result(Nil, SidecarError) {
  case process {
    ExternalMissing(reason) -> Error(SidecarUnavailable(reason))
    DevProcess | ExternalProcess(_) -> Ok(Nil)
  }
}

fn process_health(process: ProcessState) -> PeerHealth {
  case process {
    DevProcess -> Reachable
    ExternalProcess(_) -> Unknown
    ExternalMissing(_) -> Unreachable
  }
}

fn sidecar_version(process: ProcessState) -> String {
  case process {
    DevProcess -> "dev-loopback"
    ExternalProcess(_) -> "external-unknown"
    ExternalMissing(_) -> "unavailable"
  }
}

fn process_status(process: ProcessState) -> String {
  case process {
    DevProcess -> "dev_loopback"
    ExternalProcess(_) -> "external_started"
    ExternalMissing(reason) -> "external_missing:" <> reason
  }
}

fn socket_path(config: Config) -> String {
  config.runtime_dir
  <> "/ema-iroh-"
  <> string.replace(string.replace(config.daemon_id, ":", "_"), "/", "_")
  <> ".sock"
}

@external(erlang, "ema_sidecar_port", "open")
fn open_external(
  command: String,
  args: List(String),
) -> Result(ExternalPort, String)
