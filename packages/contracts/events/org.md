# org

Owner: `ema_orgs`.

## Kinds

### `org.created`
```
payload {
  org_id: org:<ulid>
  name: string
  personal: bool              // true for user-personal orgs
  owner_user_id: user:<ulid>
}
```

The org writer MUST append a same-name `space.created` event immediately after
`org.created` unless a migration explicitly says otherwise. This default space
is renamable and does not prevent additional spaces.

### `org.renamed`
```
payload {
  org_id: org:<ulid>
  from: string
  to: string
}
```

### `org.settings_updated`
```
payload {
  org_id: org:<ulid>
  changes: { <key>: <value> }
}
```

### `org.archived`
```
payload {
  org_id: org:<ulid>
  reason?: string
}
```
