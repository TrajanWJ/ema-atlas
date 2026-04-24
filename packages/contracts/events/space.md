# space

Owner: `ema_spaces`.

## Kinds

### `space.created`
```
payload {
  space_id: space:<ulid>
  org_id:   org:<ulid>
  name:     string
  created_by: user:<ulid>
}
```

For the default space created with an organization, `name` initially matches
the organization name.

### `space.renamed`
```
payload {
  space_id: space:<ulid>
  from:     string
  to:       string
}
```

### `space.settings_updated`
```
payload {
  space_id: space:<ulid>
  changes:  { [key: string]: string | int | bool | null }
}
```

`changes` is a flat patch map: each key is a top-level settings field
name; each value is its new value. Writers MUST NOT include unchanged
keys. The canonical list of settings keys lives next to
`ema_spaces` (future `docs/architecture/XX-space-settings.md`).

### `space.archived`
```
payload {
  space_id: space:<ulid>
  reason?:  string
}
```

### `space.member_added`
```
payload {
  space_id: space:<ulid>
  user_id:  user:<ulid>
  role:     "owner" | "admin" | "member" | "guest"
}
```

### `space.member_removed`
```
payload {
  space_id: space:<ulid>
  user_id:  user:<ulid>
}
```
