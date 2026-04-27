// ema_test.gleam — gleam_qcheck property-test scaffold
//
// One placeholder property per subsystem. These mirror the property
// tests called out in each build-step file's "Property tests
// (gleam_qcheck)" section. None compile end-to-end yet — they are
// shape-only stubs.

import gleeunit

pub fn main() -> Nil {
  gleeunit.main()
}

// ---------------------------------------------------------------------
// control_plane — monotonic seq on event_log.append
// ---------------------------------------------------------------------
// Source: research/build-steps/01-control-plane-skeleton.md §"Property
// tests (gleam_qcheck)" #1.

pub fn control_plane_event_log_monotonic_seq_property_test() -> Nil {
  todo as "qcheck: for any list of Event values, append returns strictly
           increasing, contiguous seq numbers"
}

// ---------------------------------------------------------------------
// identity — membership round-trip
// ---------------------------------------------------------------------
// Source: 02-identity-registry-skeleton.md §"Property tests" #1.

pub fn identity_registry_membership_roundtrip_property_test() -> Nil {
  todo as "qcheck: for any sequence of PutMember/PutProject calls,
           ListMembershipsFor(m) returns exactly the projects whose
           Member rows reference m"
}

// ---------------------------------------------------------------------
// drivers — order preservation through bridge_to_event_log
// ---------------------------------------------------------------------
// Source: 03-driver-registry-skeleton.md §"Property tests" #1.

pub fn drivers_bridge_order_preservation_property_test() -> Nil {
  todo as "qcheck: for any DriverEvent stream from simulated_tui, the
           resulting EventBody.DispatchUpdate sequence is a monotonic
           prefix-extension"
}

// ---------------------------------------------------------------------
// sessions — binding is one-to-one
// ---------------------------------------------------------------------
// Source: 04-sessions-and-babysitter.md §"Property tests" #3.

pub fn sessions_registry_one_to_one_binding_property_test() -> Nil {
  todo as "qcheck: for any Bind sequence, every SessionId resolves to
           at most one ExecutionId and vice versa"
}

// ---------------------------------------------------------------------
// babysitter — chain_scheduler no loss / no duplication
// ---------------------------------------------------------------------
// Source: 04-sessions-and-babysitter.md §"Property tests" #1.

pub fn babysitter_chain_scheduler_exactly_once_property_test() -> Nil {
  todo as "qcheck: for any Enqueue/NextFor interleaving, every enqueued
           (lane, task) pair is returned exactly once"
}

// ---------------------------------------------------------------------
// surfaces — request/response round-trip
// ---------------------------------------------------------------------
// Surfaces don't yet have a build-step file; placeholder shape only.

pub fn surfaces_agent_contract_roundtrip_property_test() -> Nil {
  todo as "qcheck: every AGENT-CONTRACT verb decodes to a typed Request
           and the typed Response encodes back to JSON without loss"
}

// ---------------------------------------------------------------------
// collab — placeholder (substrate TBD per Q2/Q8)
// ---------------------------------------------------------------------

pub fn collab_substrate_placeholder_property_test() -> Nil {
  todo as "qcheck: shape depends on Q2/Q8 resolution — Yjs convergence,
           CRDT merge associativity, or per-doc log linearizability"
}
