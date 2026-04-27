# identity

Owner: `ema_identity`.

Identity events bind externally verified human identity to EMA users. They do
not create machine peers and do not grant replication authority.

## Kinds

### `identity.user_upserted`
```
payload {
  user_id:        user:<ulid>
  display_name:   string
  email:          string
  email_verified: boolean
}
```

### `identity.google_linked`
```
payload {
  user_id:        user:<ulid>
  google_sub:     string
  email:          string
  email_verified: boolean
  linked_at:      ISO-8601 UTC
}
```

### `identity.authenticator_enabled`
```
payload {
  user_id:           user:<ulid>
  method:            "totp"
  secret_ref:        secret_ref | string
  verified_at:       ISO-8601 UTC
}
```

These events are canonical and replicate with the org event log. Raw TOTP
secrets and Google OAuth tokens must never be stored in event payloads.
