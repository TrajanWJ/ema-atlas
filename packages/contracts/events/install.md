# install

Owner: `ema_identity`.

Install events define the root identity for a self-hosted EMA deployment.
An install is local to one self-hosted deployment and is not a global SaaS
account.

## Kinds

### `install.initialized`
```
payload {
  install_id:        install:<ulid>
  genesis_device_id: device:<ulid>
  install_pubkey:    hex | string
  display_name:      string
}
```

This is the first identity event for a fresh install. In wave 1 it still uses
the shared event envelope; later signed-envelope work makes this event
self-signed by the genesis device.
