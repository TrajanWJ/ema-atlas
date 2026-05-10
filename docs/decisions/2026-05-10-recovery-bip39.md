<!-- wiki-id: ema:recovery-bip39 -->
# Recovery packet format = BIP-39 — 2026-05-10

> Status: **accepted, doctrine lock**.
> Codifies the §1.2 recovery row and §2.4 ceremony of
> `~/.claude/plans/your-missing-many-pieces-dazzling-tulip.md`.
> Closes the wave-open question listed in
> [`../WORKSPACE-ENTRYPOINT.md`](../WORKSPACE-ENTRYPOINT.md) and in §5 of
> [`2026-04-24-transport-and-auth.md`](./2026-04-24-transport-and-auth.md).

## Context

Both the transport-and-auth survey (2026-04-24) and the workspace entrypoint
listed "recovery packet format" as a wave-open question — BIP-39 seed words
vs Shamir-split words vs both. The plan file's §1.2 locks BIP-39 as the
default; this ADR records that choice as durable canon so the question stops
re-opening every replication / pairing discussion.

EMA's identity model has three layers:

| Layer | Primitive | Stored | Signs |
|---|---|---|---|
| Device | Ed25519 keypair | OS keychain | machine-level facts |
| User | Passkey (WebAuthn / FIDO2) | OS platform passkey store | user-level facts |
| Recovery | **BIP-39 seed words (locked)** | Out-of-band, user-controlled | regenerates user identity if device + passkey both lost |

The recovery layer is the ladder out when the user has lost every device and
every passkey simultaneously. Without it, an org without a recoverable
founding user becomes permanently stranded the moment the founder loses
their device.

## Decision

The EMA recovery packet format is **BIP-39 seed words**.

- 12-word default; 24-word offered for users who want extra entropy.
- The seed deterministically derives the user's recovery keypair.
- The recovery packet ALSO includes an **opaque list of org IDs** the user
  is in, so a fresh device knows where to find DERP-discoverable hosts to
  rejoin.
- The seed itself is stored **out of band, user-controlled** — paper / safe
  / password manager. Never in the canonical log. Never in OS keychain.
  Never in EMA storage of any kind.

### Why BIP-39 over Shamir-split

- **Maturity** — every well-known crypto wallet supports BIP-39; users have
  external infrastructure (steel plates, etched cards, hardware wallets) to
  store it.
- **Single-recoverer assumption is correct for personal orgs** — EMA's
  default org is personal; sharding the seed across "trusted parties" is
  the wrong default for a single-user recovery ladder.
- **Shamir is later-wave optional** — for shared / org-level recovery
  (e.g. an org that needs an admin-quorum recovery), Shamir-split BIP-39
  remains an additive opt-in, not a replacement.

## Recovery flow (locked)

1. **First boot.** User generates a BIP-39 12 or 24 word seed; daemon
   displays it once.
2. **Out-of-band record.** User records to paper / safe / password
   manager. Daemon does not retain it.
3. **Derivation.** The seed deterministically derives the user's recovery
   keypair.
4. **Opaque org list.** Recovery packet metadata includes the list of org
   IDs the user belongs to (so a fresh device can reach DERP and find the
   right host set).
5. **Total loss.** User enters seed on a fresh device → derives recovery
   keypair → broadcasts `user.recovery_initiated` over DERP → org hosts
   verify the recovery proof against each org's pubkey ledger → user is
   restored on the new device.
6. **Old-device revocation.** Once restored, user signs `device.revoked`
   for every old device the new device has knowledge of; org hosts
   propagate the revocation.

## Out of scope

- Shamir-split or social-recovery flows. May be added later as additive
  opt-in for org-level recovery; do not block on them.
- Encrypted seed-on-cloud variants (e.g. iCloud Keychain seed sync). Not
  default; the seed stays out of EMA storage.
- BIP-39 vs SLIP-39. SLIP-39 (Shamir) is a separate later question; this
  ADR locks the BIP-39 default.

## Consequences

- The "Recovery: signed recovery packet — either BIP-39 or
  Shamir-split words. Format is the wave-open question…" line in
  [`2026-04-24-transport-and-auth.md`](./2026-04-24-transport-and-auth.md)
  and the recovery-format bullet under the **Open** list in
  [`../WORKSPACE-ENTRYPOINT.md`](../WORKSPACE-ENTRYPOINT.md) are now
  CLOSED. Doctrine is BIP-39.
- New event: `user.recovery_initiated`. Belongs in the `user.*` family.
  `device.revoked` already exists in the `device.*` family per
  `03-event-catalog-v0.md`.
- Daemon module: `ema_identity` owns BIP-39 derivation (`6I` in the
  strategic stack). Implementation is independent — does not depend on
  Iroh sidecar or pairing ceremony.

## Implementation anchors

- `6I` — BIP-39 recovery packet implementation. Independent track.
- New event `user.recovery_initiated` in `packages/contracts/events/user.md`.
- The opaque org-id list is metadata on the recovery proof, NOT the seed
  derivation; loss of the org list is recoverable via a manual user prompt
  ("which orgs were you in?") on the fresh device.

## See also

- [`2026-05-10-host-node-doctrine.md`](./2026-05-10-host-node-doctrine.md)
- [`2026-05-10-multi-host-conflict-policy.md`](./2026-05-10-multi-host-conflict-policy.md)
- [`2026-04-24-transport-and-auth.md`](./2026-04-24-transport-and-auth.md)
- [`../architecture/16-google-identity-and-browser-access.md`](../architecture/16-google-identity-and-browser-access.md)
- [`../WORKSPACE-ENTRYPOINT.md`](../WORKSPACE-ENTRYPOINT.md)
