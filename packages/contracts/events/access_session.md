# access_session

Owner: `ema_access_sessions`.

Access sessions are the browser ceremony. They are deliberately separate from
organization invites and machine/peer pairing:

- an invite grants a person membership in an organization/scope;
- an access session grants a browser temporary access for a user;
- peer pairing grants a durable machine access to the p2p network.

Raw bearer tokens MUST NOT be written into canonical events. Events record
metadata and status. Token hashes or secret refs belong in compact persistence.

## Kinds

### `access_session.challenge_created`
```
payload {
  challenge_id: access_challenge:<ulid>
  org_id:       org:<ulid>
  access_point: string              // browser/tab/device hint, not a machine id
  user_code:    string              // QR/display challenge, not a bearer token
  scopes:       string[]            // e.g. ["surface.read", "command.submit"]
  expires_at:   ISO-8601 UTC
}
```

### `access_session.approved`
```
payload {
  challenge_id:       access_challenge:<ulid>
  session_id:         access_session:<ulid>
  org_id:             org:<ulid>
  user_id:            user:<ulid>
  approved_by_device: device:<ulid>
  scopes:             string[]
  token_hash_ref:     secret_ref | string
  expires_at:         ISO-8601 UTC
}
```

### `access_session.revoked`
```
payload {
  session_id: access_session:<ulid>
  org_id:     org:<ulid>
  revoked_by: user:<ulid> | device:<ulid> | system:<component>
  reason?:    string
}
```

### `access_session.expired`
```
payload {
  session_id: access_session:<ulid>
  org_id:     org:<ulid>
}
```
