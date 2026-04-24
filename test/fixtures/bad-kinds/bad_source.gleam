// Fixture source file used by `scripts/contract-check.sh --test-fixture`.
//
// This file is deliberately wrong in three ways so the upgraded contract-check
// raises all three error classes:
//
//   1. `org.greated` is a Levenshtein-1 typo of `org.created` → misspelled-kind.
//   2. `dispatch.teleported` is far from every known kind → missing-from-catalog.
//   3. `"orgx:01J0000000000000000000000X"` uses an unregistered prefix → unknown-id-prefix.
//
// This file is NOT compiled. It is scanned by the contract-check regex.

pub fn emit_typo_kind() {
  let kind = "org.greated"
  kind
}

pub fn emit_unknown_kind() {
  let event_kind = "dispatch.teleported"
  event_kind
}

pub fn emit_bad_prefix() {
  let id = "orgx:01J0000000000000000000000X"
  id
}
