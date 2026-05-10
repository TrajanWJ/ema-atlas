# Sprint B1 Iroh Wave Start

ADR confirms Iroh external sidecar.

B1 smoke uses manual pairing, not QR/BLE UI.

Revision gaps remain strict reject; B2 owns resync policy.

Q9 remains deferred; B1 only proves reachability and guarded frame movement.

B1 freezes the daemon-to-sidecar protocol as local UDS-first transport, with TCP
only as a platform fallback. Frames use a 4-byte big-endian unsigned length
prefix followed by a UTF-8 JSON envelope: `{"v":1,"id":"...","kind":"...","body":{...}}`.
Collab payload bytes are base64-encoded in `payload_b64`; the sidecar treats
them as opaque bytes, and the daemon owns all trust, document, revision, and
frame semantics. The daemon starts the sidecar actor last, after `bus`, `collab`,
`registry`, and `shell_ipc`.
