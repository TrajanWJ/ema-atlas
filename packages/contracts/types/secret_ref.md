# secret_ref

Opaque pointer to a secret (OAuth token, API key, passphrase-derived
key, etc.) held by the daemon. Surfaces and event payloads reference
secrets by `secret_ref`; they never see the raw material.

## Format

```
secret_ref = "secret:" <ulid>
```

## Storage

- Lives in the daemon's in-memory secret store only.
- **Never** written to the canonical SQLite log.
- **Never** written to the projections database.
- **Never** sent to surfaces on IPC.
- May be persisted via the OS keychain (macOS Keychain, Windows DPAPI,
  Linux kwallet/libsecret) or a Tauri Stronghold vault on device 1.
  Wave-1 demo flows don't persist anything — all `secret_ref` values
  are synthetic and live only for the process lifetime.

## Keying

Each secret is keyed by `(org_id, holder, purpose)`:

- `org_id: org:<ulid>` — the org authority the secret belongs to.
- `holder: user:<ulid> | device:<ulid>` — who is authorized to use it.
- `purpose: string` — opaque label (`"google_drive_oauth"`,
  `"github_pat"`, `"peer_handshake_key"`), matched by the consuming
  writer.

Looking up a `secret_ref` requires presenting the matching triple.
Writers that try to use a secret outside their declared purpose receive
a `forbidden` error.

## Lifecycle

- Created when a connector completes (or, in the demo, when the stub
  `connector.connect` flow fires): writer emits a new
  `secret:<ulid>`, stashes the raw bytes under the in-memory key, and
  publishes the `secret_ref` on a dispatch envelope.
- Rotated on connector re-auth or manual refresh. Rotation generates a
  new `secret_ref`; the old ref is invalidated synchronously.
- Revoked on `connector.disconnected` or `device.revoked` — raw bytes
  are zeroed and the key is deleted from the store.

TTL policy is deferred to wave 2: tokens that carry an expiry will have
a monitoring job that rotates or invalidates before expiry. Wave 1
`fake: true` connectors emit no real secrets; `secret_ref` is reserved
format only.

## Hermes seam use

`ema_control` grants a `secret_ref` on `dispatch.started` payloads when
a dispatched unit of work needs access to an external resource.
`ema_exec` presents `(org_id, holder, secret_ref)` to the secret store
at tool invocation time; if the triple doesn't match, the invocation
fails with a `tool.errored` event of class `denied`.

## Surface rules

Surfaces MAY render a display label for a connected credential
(e.g. "Google Drive — demo@example.com") but MUST NOT receive or log
the `secret_ref` value itself. Connector projections carry a
`connected: bool` flag and a `display_label: string`, never a ref.
