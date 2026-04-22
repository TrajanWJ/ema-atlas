// ema/collab.gleam — collab subtree supervisor (substrate TBD)
//
// Per ARCHITECTURE.md and research/COLLAB_PLANE_OPTIONS.md, the
// CRDT/collab substrate is an OPEN_QUESTIONS Q2/Q8 deferral. Three
// candidates from GLEAM_BEAM_FIT.md "CRDT / collaboration substrate":
//   1. y_ex via glixir (Yjs/Rust through Elixir)
//   2. riak_dt via FFI (state-based BEAM-native)
//   3. centralized event log + per-doc actor (no CRDT)
//
// This module ships an empty supervisor today. When Q2/Q8 settles, a
// per-doc factory_supervisor lands here.

import gleam/otp/static_supervisor as sup
import gleam/otp/supervision

pub fn supervised() -> supervision.ChildSpecification(sup.Supervisor) {
  sup.new(sup.OneForOne)
  // No children yet. Q2/Q8 will populate this with either:
  //   - factory_supervisor of per-doc y_ex actors, or
  //   - factory_supervisor of per-object riak_dt holders, or
  //   - a single per-doc-log writer + reconciler pair.
  |> sup.supervised
}
