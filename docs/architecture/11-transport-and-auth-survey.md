<!-- wiki-id: ema:transport-auth-survey -->
<!-- see-also: ema:transport-auth-decision, ema:host-node-doctrine, ema:recovery-bip39, ema:source-intake-source-inventory-2026-05-10 -->

# 11 — Transport, auth, and remote-surface survey

Forward-looking decision survey. Not locked in wave 1 — replication bytes
don't fly yet (per `08-vanilla-workspace.md` out-of-scope list). This doc
exists so the replication, auth-hardening, and remote-surface waves start
from a pre-agreed shortlist rather than re-opening the whole field.

> **2026-05-10 locks** layered on top of this survey:
>
> - Q3' (DERP relay default) — **Iroh public mesh**; self-host as later opt-in.
> - Q4 (Web auth gate addressing) — **DERP-stable identity** (no DNS provisioning).
> - Recovery packet format — **BIP-39 seed words**. See
>   [`../decisions/2026-05-10-recovery-bip39.md`](../decisions/2026-05-10-recovery-bip39.md).
> - Host nodes — see
>   [`../decisions/2026-05-10-host-node-doctrine.md`](../decisions/2026-05-10-host-node-doctrine.md).
>   The earlier "always-on node" framing has evolved into "host node" with
>   binary org accessibility and three load-bearing roles (state availability,
>   per-entity concurrency arbitration, auth + web access gate).
> - Multi-host write topology — all hosts accept writes; per-entity merge.
>   Per-entity classification in
>   [`../decisions/2026-05-10-multi-host-conflict-policy.md`](../decisions/2026-05-10-multi-host-conflict-policy.md).

It covers three concerns that all touch the same wire:

1. **Cross-device replication transport** — how two EMA daemons on different
   machines exchange canonical events (and later, CRDT prose updates).
2. **Auth** — device identity, user identity, peer pairing, signed events,
   capability-scoped delegation to agents/connectors.
3. **Remote surfaces (later waves)** — screenshare, remote terminal, shared
   prompting, RDP-class "drive my EMA" flows.

The daemon is Gleam on BEAM (`02-daemon-supervision.md`), runs as a
user-level system service, and today only listens on
`ws://127.0.0.1:49555` for local surfaces. Everything below is about what
happens when EMA grows past one machine.

---

## 1. Replication transport

Requirements:

- **NAT traversal** — most users' devices are behind CGNAT / home routers.
  A transport that requires manual port forwarding is disqualified.
- **Bidirectional streams** — the event bus is append-then-fan-out; peers
  subscribe to each other's tails.
- **Resumable** — devices go offline. Reconnect must pick up from the last
  `txid` without a full replay.
- **BEAM-friendly** — either a BEAM-native implementation, a well-behaved
  NIF, or a sidecar process on a separate port with a tiny local protocol.
  No embedding JS runtimes (same rule as the CRDT choice).
- **Encrypted by default** — no plaintext replication, ever.
- **Relay-optional** — if NAT traversal fails, there is a fallback path
  that does not require standing up dedicated infrastructure per user.

### Candidates (ranked)

| #  | Option                              | NAT    | BEAM fit            | Relay story                  | Recommendation                          |
| -- | ----------------------------------- | ------ | ------------------- | ---------------------------- | --------------------------------------- |
| 1  | **Iroh** (Rust, QUIC + magicsock)   | Yes    | Sidecar on port     | Public DERP mesh, self-host  | **Preferred.** Best NAT story; DERP is free and self-hostable; QUIC gives us resumable streams out of the box. |
| 2  | **Hyperswarm / HyperDHT**           | Yes    | Sidecar (Node/Bare) | Built into DHT               | Strong P2P pedigree (Dat/Holepunch); sidecar cost similar to Iroh. Second choice if Iroh sidecar is fragile. |
| 3  | **libp2p** (`go-libp2p`)            | Yes    | Sidecar             | Public relays, self-host     | Well understood but heavier than Iroh; multi-transport is overkill for our one-wire need. |
| 4  | **quicer** BEAM NIF (QUIC direct)   | Yes*   | Native NIF          | None built-in                | BEAM-native and tempting, but no built-in hole-punching — we'd have to build NAT traversal + relay ourselves. Reconsider if Iroh doesn't embed cleanly. |
| 5  | **Tailscale / WireGuard overlay**   | Yes    | OS-level            | Tailscale DERP               | Works, but pushes identity to Tailscale's ACLs and couples users to an external mesh. Good for "power user" opt-in, not default. |
| 6  | **WebRTC data channels**            | Yes    | Sidecar (browser or pion)    | STUN + TURN                  | Fine for browser-to-browser; painful server-side. Use only if the web surface ever needs direct P2P to another browser. |
| 7  | **Syncthing BEP**                   | Yes    | Sidecar             | Public introducers           | Proven, but file-centric — we'd pay the cost of its block model for little benefit since we replicate events, not files. |
| 8  | **Matrix federation**               | Yes    | Homeserver sidecar  | Per-homeserver               | Heavyweight. Useful lineage for room-based auth; not the transport. |
| 9  | **Plain TCP + Noise + STUN/TURN**   | Manual | Native              | We build it                  | Only if every option above is rejected. Do not underestimate the tail of re-implementing hole-punching. |

### Wave direction

**Default:** Iroh as a sidecar spawned by the daemon supervisor, exposing a
tiny local UDS or TCP socket; the daemon speaks a length-prefixed JSON
framing to it (same shape as `shell-protocol.md` but for peer traffic).
Iroh handles:

- node identity (Ed25519 pubkey — maps to our `device:<ulid>`),
- hole-punching and DERP relay fallback,
- encrypted QUIC streams,
- per-stream resumability.

The daemon's `ema_replication` context owns one stream per peer device, and
reads/writes event envelopes on it. If Iroh fails acceptance testing (e.g.
the sidecar footprint is too large for mobile later), fall to Hyperswarm.

Event-catalog-side: the `peer.*` and `replication.*` families already exist
(`03-event-catalog-v0.md`). No new families needed — the transport lives
under the family, not alongside it.

---

## 2. Auth

Three distinct concerns, frequently conflated:

| Concern               | What it proves                                          |
| --------------------- | ------------------------------------------------------- |
| **Device identity**   | "This daemon instance is the device I paired"           |
| **User identity**     | "A human authorized this action on this device"         |
| **Peer pairing**      | "These two devices belong to the same trust root"       |
| **Event authorship**  | "This canonical event was written by a known actor"     |
| **Delegated capability** | "This agent / connector may do X, scoped to Y, until Z" |

### Device identity

- Ed25519 keypair generated at first boot, stored in OS keychain
  (macOS Keychain / Secret Service / Windows DPAPI). Public key is the
  device's stable identity; `device:<ulid>` is the human-facing id, the
  pubkey is the cryptographic one.
- First-boot ceremony emits `device.registered` with the pubkey; no
  further device auth is needed for local IPC.
- Current daemon status: `device.registered` is compacted into the local
  `devices` registry and exposed as `device.registry`; `device.register`
  can write a paired-machine record; `device.local_register` generates a
  real Ed25519 keypair and stores the private key in macOS Keychain before
  registering the public key. The pairing challenge and transport streams
  are still separate slices before friend-MacBook p2p testing is honest.
- Pairing: QR+BLE hybrid inspired by WebAuthn hybrid transport (already
  the noted wave-open question in `WORKSPACE-ENTRYPOINT.md`). Ceremony
  emits `device.paired` on both sides; each device signs a lineage proof
  the other can verify.

### User identity

- **Immediate browser base: Google Identity Services / OpenID Connect.**
  Browser access uses a real Google authorization-code flow and verified ID
  tokens to prove the human. Google Authenticator/TOTP may harden that browser
  session, but neither Google OAuth nor TOTP creates an EMA machine peer.
- **Local/native primary: passkeys (WebAuthn / FIDO2).** Platform passkeys on
  macOS / iOS / Windows give us per-user, per-device credentials with built-in
  biometric gating. The daemon validates passkey assertions locally.
- **Recovery: BIP-39 seed words (locked 2026-05-10).** 12 or 24 word
  phrase, derived deterministically into a recovery keypair, stored
  out-of-band by the user. Recovery packet metadata also carries an opaque
  list of org IDs the user belongs to so a fresh device can find DERP
  hosts. Shamir-split is not the default; it stays a later additive
  opt-in for org-level recovery. See
  [`../decisions/2026-05-10-recovery-bip39.md`](../decisions/2026-05-10-recovery-bip39.md).
- **No passwords in the canonical log ever.** Auth proofs are verified,
  not stored.

### Event authorship

- Every canonical event carries `actor` (`user:<ulid>` / `device:<ulid>` /
  `system:<component>`). Once replication turns on, the writer MUST sign
  the event with the actor's key (user passkey or device key, depending
  on actor kind). Verification is cheap; replay tolerates unsigned
  events from pre-replication logs.
- Signature field is additive on the envelope (`event_envelope.gleam`),
  not inside payload — keeps payload schema stable.

### Peer pairing / trust

- Two paired devices share an org-scoped trust root. Both sign a peering
  event (`peer.trust_established`, registered in `events/peer.md` and the
  daemon catalog). Current daemon status: `peer.trust_establish` writes this
  trust root into the compact `peer_trust` registry and exposes
  `peer.trust`; when given `device_id` instead of a supplied
  `lineage_proof`, the daemon signs the lineage proof from that local device's
  macOS Keychain private key. The ceremony still needs the QR exchange and
  signature verification UI before it is a friendly two-Mac pairing flow.
- Cross-org trust stays compositional, not transitive: each org is its own
  trust domain, but a single device can be hosting-enabled for any number
  of orgs (`device.hosting_enabled {device, org_id}` is per-(device, org)).
  Trust roots are per-org; one device participating in multiple orgs holds
  multiple independent peer-trust records, never a merged super-root.

## Host nodes

Locked 2026-05-10 by
[`../decisions/2026-05-10-host-node-doctrine.md`](../decisions/2026-05-10-host-node-doctrine.md).
The earlier "always-on node" framing has been replaced by **host node**.
Three load-bearing roles:

1. **State availability** — host nodes hold the canonical event tail; new
   devices catch up FROM them.
2. **Per-entity concurrency arbitration** — each host serializes its
   connected clients' writes for an entity; cross-host conflicts resolve
   per the entity-family table in
   [`../decisions/2026-05-10-multi-host-conflict-policy.md`](../decisions/2026-05-10-multi-host-conflict-policy.md).
3. **Auth + web access gate** — hosts bind to DERP-stable identities and
   serve OIDC callbacks; browser users log in to a host and get brokered
   into org state.

Org accessibility is binary: ≥1 host online → accessible; 0 hosts online
→ dark. There is no primary-host tier and no uptime gradient.

### Delegated capability (agents + connectors)

- `secret_ref` format already defined (`types/secret_ref.md`) handles
  OAuth tokens for connectors.
- For agent / tool grants (Hermes seam), prefer **Biscuit** tokens:
  - Rust origin but has an Erlang binding path via Rustler or a small
    NIF; also has a JSON-representable attenuated form;
  - attenuable (a grant can be narrowed without issuing a new one);
  - offline-verifiable (no round-trip to a central authority);
  - structurally close to UCAN but with better implementation maturity
    in non-JS ecosystems.
- Alternative: **UCAN** — JS-first but has a Rust impl. Pick UCAN only if
  browser-native issuance becomes a first-class need. Default: Biscuit.

### Auth doctrine summary

- Ed25519 device keys in OS keychain.
- Passkeys for user auth.
- Signed events once replication ships; unsigned accepted on replay of
  older logs.
- Biscuit tokens for scoped agent/tool grants (Hermes seam).
- OAuth via `secret_ref` for connectors (already doctrine).
- Peer pairing via a QR+BLE hybrid ceremony; details still open.

---

## 3. Remote surfaces (later waves)

These are not wave-1 features. This section pins the *protocol shortlist*
so a later wave doesn't drag us into bespoke reinvention.

### Screenshare / "watch another operator's EMA"

- **WebRTC via LiveKit** (or mediasoup SFU) — preferred. LiveKit has a
  Rust SDK and a well-documented server; SFU model scales past 1:1;
  bindings from BEAM via HTTP+JWT room tokens. Issues LiveKit room
  tokens with Biscuit-derived scopes.
- **Moonlight / Sunshine** (NVIDIA GameStream) — lower latency, but
  GPU-native and heavy to integrate. Reserve for "remote-desktop into
  my workstation" use cases, not EMA surface sharing.
- **Reject:** RDP (Windows-coupled, heavy), VNC/RFB (insecure by
  default, no multi-party).

### Remote EMA control ("drive my EMA from another device")

- Not a separate protocol — it's just an additional WS client to the
  same daemon, over an authenticated tunnel.
- Tunnel preference (in order):
  1. **Iroh stream** — reuse the replication transport. A paired device
     already has an encrypted channel; open a second stream multiplexed
     onto it and speak `shell-protocol.md` over it.
  2. **Tailscale tailnet** — if user opts into an overlay mesh.
  3. **SSH port-forward** — dev ergonomics only.
- Authorization: Biscuit token scoped to `{org_id, surface, ttl}` issued
  by the controlling device; daemon verifies on incoming connection.

### Remote terminal / pair-on-shell

- **tmate / upterm-style** relayed SSH sessions. Do NOT reinvent.
- Use for "show me what you're running" demos, debugging, and swarm
  operators joining a running process.
- Integrate by emitting a `dispatch.*` event when a shared session
  opens, so it appears in See Agent Work like any other agent dispatch.

### Remote collaborative prompting

- Already a first-class EMA concept (See Agent Work). The
  "collaborative prompting" surface is just a Blueprint document with
  live CRDT prose — same CRDT decision as `06-blueprint-boundaries.md`.
- No separate protocol needed. If two operators are in the same
  Blueprint doc and both connected to paired daemons, their edits
  converge via whichever CRDT we land on.
- Agent turns are events (`dispatch.started`, `tool.called`,
  `dispatch.ended`); the "prompt" is a section in the Blueprint doc;
  the "reply" is an attachment or another section. Nothing new on the
  wire.

### Remote screenshare summary

- LiveKit (WebRTC SFU) for video / screen / audio.
- Iroh streams for data and control.
- tmate/upterm-class for shared terminal.
- Biscuit tokens to scope every remote grant.
- Shared Blueprint + See Agent Work for "collaborative prompting" — not
  a separate channel.

---

## 4. How this lands in the code (when its wave comes)

All of the above fits cleanly under the existing topology. No new
bounded contexts, no new event families.

- `ema_replication/` owns the Iroh sidecar lifecycle and the per-peer
  event-stream actor.
- `ema_identity/` owns Ed25519 device key generation, passkey
  assertion verification, and pairing ceremony writers.
- `ema_attachments/` gains a new `SourceRef` variant for
  remote-session references (e.g. `{ source: "livekit_room", room_id,
  token_ref }`) when screenshare surfaces land.
- `ema_shell_ipc/` stays localhost-only in wave 1; remote surfaces
  connect over an Iroh-tunnelled second WS instance, not by opening the
  local port.
- `ema_swarm_coordination/` (swarm / vCalendar) consumes
  `dispatch.*` events from remote sessions the same way it consumes
  local ones.

For the trusted-dev bootstrap rail before Iroh lands, see
`../operations/peer-computer-access.md`. That rail uses OS-native SSH/admin
access for operator work and does not replace the EMA-native Iroh plan.

Three capabilities that should exist in `secret_ref`-adjacent
storage by the time this wave starts:

- device keypair → OS keychain, not canonical DB.
- passkey credential IDs → canonical DB, public side only.
- Biscuit root key → OS keychain, per-org.

---

## 5. Out of scope for this survey

- Exact Iroh sidecar wire framing (wave-start decision).
- LiveKit vs mediasoup pick (later).
- Biscuit vs UCAN final lock (Biscuit preferred; not locked).
- ~~Recovery packet format (already a wave-open question elsewhere).~~
  **CLOSED 2026-05-10:** BIP-39 seed words. See
  [`../decisions/2026-05-10-recovery-bip39.md`](../decisions/2026-05-10-recovery-bip39.md).
- Whether RDP / Moonlight support is ever in scope (currently: no).

## 6. Status

- Wave 1: none of the above is wired. Replication bytes do not fly; auth
  is local-only; no remote surfaces.
- Dev/operator bootstrap: SSH peer access is the practical path for the first
  trusted peer; Tailscale remains optional and non-default.
- Wave N (replication): Iroh sidecar + signed events + peer pairing.
- Wave N+1 (delegation): Biscuit tokens for Hermes seam + connectors.
- Wave N+2 (remote surfaces): LiveKit + tmate-class tunnels on top of
  Iroh.
