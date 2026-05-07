# device

Owner: `ema_identity`.

## Kinds

### `device.registered`
```
payload {
  device_id:    device:<ulid>
  user_id:      user:<ulid>
  name:         string             // human label ("Tawj MBP")
  pubkey:       hex                // Ed25519 public key
  bootstrap:    "genesis" | "paired"
  attested_by?: device:<ulid> | null
  capabilities: string[]           // e.g. "runs_agents", "serves_files"
}
```

### `device.renamed`
```
payload {
  device_id: device:<ulid>
  from:      string
  to:        string
}
```

### `device.revoked`
```
payload {
  device_id: device:<ulid>
  revoked_by: user:<ulid> | device:<ulid>
  reason?: string
}
```

### `device.key_rotated`
```
payload {
  device_id: device:<ulid>
  old_pubkey: hex
  new_pubkey: hex
}
```
