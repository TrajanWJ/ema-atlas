# Web Organization Access Point

Status: draft, canonized 2026-04-24.

Implementation anchor:

- Event family: `packages/contracts/events/access_session.md`
- Daemon bounded context: `apps/daemon/src/ema_access_sessions/`
- Compact read model: `access_session_challenges` and `access_sessions`
- IPC projection: `access_session.current`

The browser is an access point into an EMA organization, not a durable machine
peer. Opening `apps/web` should not imply that the browser, laptop, or tab has
joined the p2p machine network. It is a user-authenticated session that can
read projections and issue commands against an organization instance.

## Cohesive Model

- Organization: the durable boundary for projects, files, canon, events, and
  permissions.
- User: authenticates into the organization through Google Identity Services
  and optional Google Authenticator/TOTP. QR approval from an already-trusted
  EMA surface is reserved for higher-trust browser sessions and machine-adjacent
  actions.
- Browser access point: a temporary UI session with no machine identity and no
  durable storage authority.
- Machine peer: a trusted daemon/native node that participates in p2p sync,
  stores durable state, and may run agents or native capabilities.
- Tauri companion: machine capability surface for native windows and local OS
  affordances. It is separate from browser access authority.

## Store Rule

The web app may keep Zustand stores for interaction, but those stores must be
split by authority:

- `access session`: org id, user id, auth state, QR nonce, visible peer machines.
- `desktop projection`: windows, menus, wallpaper, selected projected files.
- `optimistic edits`: temporary UI state awaiting org command acceptance.

No browser store should become the canonical source for organization files,
membership, peer machines, or project truth.

## Google + Authenticator Shape

1. Browser starts the Google authorization-code flow.
2. Server verifies the Google ID token signature, issuer, audience, expiry, and
   nonce.
3. EMA maps Google `sub` + verified email to an EMA user.
4. EMA checks org membership.
5. Optional Google Authenticator enrollment/verificaton hardens the browser
   session with standard TOTP.
6. The browser receives only a scoped access session. It still has no machine
   identity.

## QR Approval Shape

1. Browser shows an org access challenge.
2. A trusted EMA surface scans or approves it.
3. Organization grants a scoped access token/session.
4. Browser receives projections and can issue commands.
5. Session expiry removes access without removing any peer machine.

This lets the browser be everywhere without pretending every browser is part of
the trusted machine mesh.

## OIDC callback addressing — DERP-stable identity

Locked 2026-05-10 by
[`../decisions/2026-05-10-host-node-doctrine.md`](../decisions/2026-05-10-host-node-doctrine.md).
The browser logs in via Google Identity Services / OIDC. The OAuth
authorization-code callback redirects to a URL bound to a **host node's
DERP-stable identity**, not a per-user DNS name. Concretely:

- Each org has at least one host node (≥1 required); the host node's
  Iroh/DERP node id is the stable rendezvous point.
- The OIDC callback URL is served by an HTTP-over-DERP shim on the host
  node, addressed by the host's DERP identity. There is no DNS
  provisioning step per user or per org — DERP plus the host's Ed25519
  pubkey are the addressing primitives.
- If an org's host set is dark (zero hosts online), the OIDC callback path
  is unreachable. This matches the binary accessibility rule: a dark org
  cannot authenticate browser users.

Rationale: this keeps `Q3'` (Iroh public DERP mesh as default) and `Q4`
(web auth gate addressed via DERP-stable identity) co-decided. We do not
require DNS, ACME, or per-user TLS certs in the default path; self-host
DERP and bring-your-own-DNS remain later opt-ins.

## Ceremonies Stay Separate

- Organization invites add people to organizations, spaces, or projects.
- Browser access sessions authenticate a browser as a temporary access point.
- Machine pairing admits durable device peers into the replication network.

These paths can reference the same `org_id` and `user_id`, but they must not
share token semantics or imply one another. A browser session can command the
daemon because a user approved it; only a paired machine can replicate or hold
native companion authority.
