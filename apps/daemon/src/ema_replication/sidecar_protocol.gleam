//// B1 daemon-side protocol for the external Iroh sidecar.
////
//// The sidecar moves opaque bytes. EMA keeps frame semantics, trust, and
//// revision policy inside the daemon.

import gleam/bit_array
import gleam/dynamic/decode
import gleam/int
import gleam/json
import gleam/list
import gleam/string

pub const protocol_version: Int = 1

pub type Message {
  Message(v: Int, id: String, body: Body)
}

pub type Body {
  HealthPing
  HealthPong(sidecar_version: String, node_id: String)
  PeerDial(peer_node_id: String, stream_purpose: String)
  PeerDialed(stream_id: String, peer_node_id: String)
  PeerClose(peer_node_id: String, stream_id: String)
  PeerDisconnected(stream_id: String, peer_node_id: String, reason: String)
  FrameSend(peer_node_id: String, stream_id: String, payload_b64: String)
  FrameReceived(peer_node_id: String, stream_id: String, payload_b64: String)
  SidecarError(correlate_id: String, error_kind: String, message: String)
}

pub type Parser {
  Parser(buffer: BitArray)
}

pub type ParseResult {
  ParseResult(parser: Parser, messages: List(Message))
}

pub type ParseError {
  MalformedJson(reason: String)
  MalformedFrame(reason: String)
}

pub fn new_parser() -> Parser {
  Parser(buffer: <<>>)
}

pub fn encode_frame(message: Message) -> BitArray {
  let payload = encode_message(message) |> bit_array.from_string
  let length = bit_array.byte_size(payload)
  <<length:size(32), payload:bits>>
}

pub fn encode_message(message: Message) -> String {
  let Message(v, id, body) = message
  json.to_string(
    json.object([
      #("v", json.int(v)),
      #("id", json.string(id)),
      #("kind", json.string(kind(body))),
      #("body", body_json(body)),
    ]),
  )
}

pub fn decode_message(raw: String) -> Result(Message, ParseError) {
  case json.parse(raw, message_decoder()) {
    Ok(message) -> Ok(message)
    Error(e) -> Error(MalformedJson(string.inspect(e)))
  }
}

pub fn push(
  parser: Parser,
  chunk: BitArray,
) -> Result(ParseResult, ParseError) {
  let Parser(buffer) = parser
  let buffer = bit_array.append(to: buffer, suffix: chunk)
  parse_available(buffer, [])
}

fn parse_available(
  buffer: BitArray,
  messages: List(Message),
) -> Result(ParseResult, ParseError) {
  case buffer {
    <<length:size(32), rest:bytes>> -> {
      let available = bit_array.byte_size(rest)
      case available < length {
        True ->
          Ok(ParseResult(
            parser: Parser(buffer: buffer),
            messages: list.reverse(messages),
          ))
        False -> {
          let assert Ok(payload) = bit_array.slice(rest, at: 0, take: length)
          let assert Ok(remaining) =
            bit_array.slice(rest, at: length, take: available - length)
          case bit_array.to_string(payload) {
            Error(_) -> Error(MalformedFrame("payload is not valid utf-8 json"))
            Ok(raw) ->
              case decode_message(raw) {
                Error(e) -> Error(e)
                Ok(message) -> parse_available(remaining, [message, ..messages])
              }
          }
        }
      }
    }
    _ ->
      Ok(ParseResult(
        parser: Parser(buffer: buffer),
        messages: list.reverse(messages),
      ))
  }
}

fn message_decoder() -> decode.Decoder(Message) {
  use v <- decode.field("v", decode.int)
  use id <- decode.field("id", decode.string)
  use kind <- decode.field("kind", decode.string)
  case kind {
    "health.ping" -> decode.success(Message(v, id, HealthPing))
    "health.pong" -> {
      use body <- decode.field("body", health_pong_decoder())
      decode.success(Message(v, id, body))
    }
    "peer.dial" -> {
      use body <- decode.field("body", peer_dial_decoder())
      decode.success(Message(v, id, body))
    }
    "peer.dialed" -> {
      use body <- decode.field("body", peer_dialed_decoder())
      decode.success(Message(v, id, body))
    }
    "peer.close" -> {
      use body <- decode.field("body", peer_close_decoder())
      decode.success(Message(v, id, body))
    }
    "peer.disconnected" -> {
      use body <- decode.field("body", peer_disconnected_decoder())
      decode.success(Message(v, id, body))
    }
    "frame.send" -> {
      use body <- decode.field("body", frame_send_decoder())
      decode.success(Message(v, id, body))
    }
    "frame.received" -> {
      use body <- decode.field("body", frame_received_decoder())
      decode.success(Message(v, id, body))
    }
    "error" -> {
      use body <- decode.field("body", sidecar_error_decoder())
      decode.success(Message(v, id, body))
    }
    _ ->
      decode.failure(
        Message(0, "", HealthPing),
        expected: "known B1 sidecar message kind",
      )
  }
}

fn health_pong_decoder() -> decode.Decoder(Body) {
  use sidecar_version <- decode.field("sidecar_version", decode.string)
  use node_id <- decode.field("node_id", decode.string)
  decode.success(HealthPong(sidecar_version:, node_id:))
}

fn peer_dial_decoder() -> decode.Decoder(Body) {
  use peer_node_id <- decode.field("peer_node_id", decode.string)
  use stream_purpose <- decode.field("stream_purpose", decode.string)
  decode.success(PeerDial(peer_node_id:, stream_purpose:))
}

fn peer_dialed_decoder() -> decode.Decoder(Body) {
  use stream_id <- decode.field("stream_id", decode.string)
  use peer_node_id <- decode.field("peer_node_id", decode.string)
  decode.success(PeerDialed(stream_id:, peer_node_id:))
}

fn peer_close_decoder() -> decode.Decoder(Body) {
  use peer_node_id <- decode.field("peer_node_id", decode.string)
  use stream_id <- decode.field("stream_id", decode.string)
  decode.success(PeerClose(peer_node_id:, stream_id:))
}

fn peer_disconnected_decoder() -> decode.Decoder(Body) {
  use stream_id <- decode.field("stream_id", decode.string)
  use peer_node_id <- decode.field("peer_node_id", decode.string)
  use reason <- decode.field("reason", decode.string)
  decode.success(PeerDisconnected(stream_id:, peer_node_id:, reason:))
}

fn frame_send_decoder() -> decode.Decoder(Body) {
  use peer_node_id <- decode.field("peer_node_id", decode.string)
  use stream_id <- decode.field("stream_id", decode.string)
  use payload_b64 <- decode.field("payload_b64", decode.string)
  decode.success(FrameSend(peer_node_id:, stream_id:, payload_b64:))
}

fn frame_received_decoder() -> decode.Decoder(Body) {
  use peer_node_id <- decode.field("peer_node_id", decode.string)
  use stream_id <- decode.field("stream_id", decode.string)
  use payload_b64 <- decode.field("payload_b64", decode.string)
  decode.success(FrameReceived(peer_node_id:, stream_id:, payload_b64:))
}

fn sidecar_error_decoder() -> decode.Decoder(Body) {
  use correlate_id <- decode.field("correlate_id", decode.string)
  use error_kind <- decode.field("kind", decode.string)
  use message <- decode.field("message", decode.string)
  decode.success(SidecarError(correlate_id:, error_kind:, message:))
}

fn kind(body: Body) -> String {
  case body {
    HealthPing -> "health.ping"
    HealthPong(_, _) -> "health.pong"
    PeerDial(_, _) -> "peer.dial"
    PeerDialed(_, _) -> "peer.dialed"
    PeerClose(_, _) -> "peer.close"
    PeerDisconnected(_, _, _) -> "peer.disconnected"
    FrameSend(_, _, _) -> "frame.send"
    FrameReceived(_, _, _) -> "frame.received"
    SidecarError(_, _, _) -> "error"
  }
}

fn body_json(body: Body) -> json.Json {
  case body {
    HealthPing -> json.object([])
    HealthPong(sidecar_version, node_id) ->
      json.object([
        #("sidecar_version", json.string(sidecar_version)),
        #("node_id", json.string(node_id)),
      ])
    PeerDial(peer_node_id, stream_purpose) ->
      json.object([
        #("peer_node_id", json.string(peer_node_id)),
        #("stream_purpose", json.string(stream_purpose)),
      ])
    PeerDialed(stream_id, peer_node_id) ->
      json.object([
        #("stream_id", json.string(stream_id)),
        #("peer_node_id", json.string(peer_node_id)),
      ])
    PeerClose(peer_node_id, stream_id) ->
      json.object([
        #("peer_node_id", json.string(peer_node_id)),
        #("stream_id", json.string(stream_id)),
      ])
    PeerDisconnected(stream_id, peer_node_id, reason) ->
      json.object([
        #("stream_id", json.string(stream_id)),
        #("peer_node_id", json.string(peer_node_id)),
        #("reason", json.string(reason)),
      ])
    FrameSend(peer_node_id, stream_id, payload_b64) ->
      frame_body(peer_node_id, stream_id, payload_b64)
    FrameReceived(peer_node_id, stream_id, payload_b64) ->
      frame_body(peer_node_id, stream_id, payload_b64)
    SidecarError(correlate_id, error_kind, message) ->
      json.object([
        #("correlate_id", json.string(correlate_id)),
        #("kind", json.string(error_kind)),
        #("message", json.string(message)),
      ])
  }
}

fn frame_body(
  peer_node_id: String,
  stream_id: String,
  payload_b64: String,
) -> json.Json {
  json.object([
    #("peer_node_id", json.string(peer_node_id)),
    #("stream_id", json.string(stream_id)),
    #("payload_b64", json.string(payload_b64)),
  ])
}

pub fn payload_to_b64(payload: BitArray) -> String {
  bit_array.base64_encode(payload, True)
}

pub fn payload_from_b64(payload: String) -> Result(BitArray, Nil) {
  bit_array.base64_decode(payload)
}

pub fn message_id(sequence: Int) -> String {
  "sidecar_msg:" <> int.to_string(sequence)
}
