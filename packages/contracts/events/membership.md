# membership

Owner: `ema_memberships`.

Membership events are the org-level role record. Space-level membership
lives on the `space.*` family.

## Kinds

### `membership.role_granted`
```
payload {
  org_id:  org:<ulid>
  user_id: user:<ulid>
  role:    "owner" | "admin" | "member" | "guest"
}
```

### `membership.role_revoked`
```
payload {
  org_id:  org:<ulid>
  user_id: user:<ulid>
  role:    "owner" | "admin" | "member" | "guest"
}
```

### `membership.removed`
```
payload {
  org_id:  org:<ulid>
  user_id: user:<ulid>
}
```
