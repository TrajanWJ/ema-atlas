# 16 — Google identity and browser access

Status: active implementation note, canonized 2026-04-24.

EMA has two authority systems that must stay separate:

1. Google identity proves the human.
2. EMA machine trust proves a durable p2p peer.

The web surface may be fast, portable, and phone-friendly. It must not imply
that the browser or phone joined the EMA machine network.

## Identity stack

```txt
Google Account
  proves the person through Google Identity Services / OpenID Connect

EMA User
  maps google_sub + verified email to an EMA user id

EMA Membership
  grants org/space/project role authority

EMA Browser Access Session
  grants temporary scoped browser access for that user

EMA Machine Peer
  grants durable device-key authority and p2p replication
```

## Non-stub implementation requirement

Google OAuth is not a mock button. The web app must use the real Google
authorization-code flow:

- `EMA_GOOGLE_CLIENT_ID`
- `EMA_GOOGLE_CLIENT_SECRET`
- optional `EMA_GOOGLE_REDIRECT_URI`
- `EMA_SESSION_SECRET`
- optional `EMA_AUTH_STORE_PATH`

The server must verify Google ID tokens before creating an EMA browser
session. It must validate issuer, audience, expiry, nonce, and signature.

Google Authenticator is also not a mock. It uses standard TOTP:

- a real base32 secret;
- an `otpauth://totp/...` enrollment URI;
- 6-digit SHA-1 TOTP verification with clock-window tolerance.

The first web implementation stores browser sessions in signed HTTP-only
cookies and persists Google user/TOTP enrollment records in an ignored local
server-side auth store at `apps/web/.ema-dev/web-auth-store.json` unless
`EMA_AUTH_STORE_PATH` is set. This is a real verification bridge, not a UI
stub. The next backend step is moving those records under `ema_identity` daemon
compact persistence / OS secret storage. Auth secrets never belong in
localStorage.

## What Google grants

Google sign-in may create or resume:

- EMA user identity;
- org membership lookup by verified email / google_sub;
- browser access-session eligibility;
- Google Authenticator enrollment and verification.

Google sign-in must not create:

- `device.registered`;
- `peer.trust_established`;
- replication placement;
- machine approval authority.

Machine trust now has a daemon path independent of Google: a trusted EMA
surface can call `device.register` with an org id, device id, user id, human
device name, public key, and `bootstrap: "paired"`. That creates the canonical
device record and `device.registry` projection. A local native surface can call
`device.local_register` to generate a real Ed25519 keypair, store the private
key in macOS Keychain, and register the public key. This is still not a complete
pairing ceremony, but `peer.trust_establish` can now record the org-scoped peer
trust event once a ceremony supplies the peer/local public keys; it can either
accept a supplied lineage proof or sign one from the local device key in macOS
Keychain. The QR challenge UI and daemon-to-daemon stream still need to land.

## Phone/browser posture

A phone browser can be a good EMA access surface:

```txt
Signed in with Google
Google Authenticator verified
Browser access session active
Machine peer: none
Replication: no
Connected through: trusted EMA org gateway
```

That phone still cannot become infrastructure merely by authenticating.

## High-risk actions

These actions require a trusted EMA machine peer or an equivalent future
capability ceremony:

- enrolling a new machine peer;
- approving another machine;
- exporting secrets;
- changing owner/admin roles;
- enabling replication placement;
- issuing long-lived agent/tool capabilities.

## OIDC callback wiring — host-node DERP-stable identity

Locked 2026-05-10 by
[`../decisions/2026-05-10-host-node-doctrine.md`](../decisions/2026-05-10-host-node-doctrine.md).
The Google authorization-code callback URL is served by a host node, not
by a per-user DNS deployment. The browser is told the redirect URI at
login start; that redirect URI is rooted on a host node's DERP-stable
identity (the Iroh/DERP node id derived from the host's Ed25519 pubkey).

Practical shape:

1. The web surface asks the daemon: "for org X, give me the OIDC start
   URL." The daemon's `ema_access_sessions` writer picks an online host
   node from the org's host set.
2. The host node serves the callback over an HTTP-over-DERP shim,
   addressed by its DERP node id. No bring-your-own-DNS is required.
3. After Google returns the auth code, the host completes the
   authorization-code exchange, verifies the ID token, and writes the
   `access_session.created` event on the canonical log.
4. If the org's host set goes dark mid-flow, the callback is unreachable
   and the browser sees a transport-level failure — surfaced as
   "organization is currently dark, try again when a host is online."

Self-host DERP and bring-your-own-DNS remain later opt-ins. The default
path uses the Iroh public DERP mesh
([`../decisions/2026-04-24-transport-and-auth.md`](../decisions/2026-04-24-transport-and-auth.md))
and requires no DNS provisioning per org.

## References

- Google OpenID Connect: <https://developers.google.com/identity/openid-connect/openid-connect>
- Google Identity Services web authorization: <https://developers.google.com/identity/oauth2/web/guides/how-user-authz-works>
- Google passkeys: <https://developers.google.com/identity/passkeys>
- TOTP standard: <https://www.rfc-editor.org/rfc/rfc6238>
