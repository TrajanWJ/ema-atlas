# invite

Owner: `ema_invites`.

## Kinds

### `invite.created`
```
payload {
  invite_id:  invite:<ulid>
  scope:      { org_id } | { space_id }
  target:     { kind: "email", email } | { kind: "user_id", user_id }
  role:       "owner" | "admin" | "member" | "guest"
  created_by: user:<ulid>
  expires_at: ISO-8601 UTC
}
```

### `invite.accepted`
```
payload {
  invite_id: invite:<ulid>
  accepted_by: user:<ulid>
  accepted_device: device:<ulid>
}
```

### `invite.revoked`
```
payload { invite_id, revoked_by: user:<ulid>, reason? }
```

### `invite.expired`
```
payload { invite_id }
```
