# P2P Dev Updates

EMA dev builds can update from another peer without a central release server.
This is intentionally a development loop, not a production updater.

## Model

- A source peer packs the current EMA runtime workspace into a tarball.
- The source peer serves `manifest.json` and the tarball over LAN HTTP.
- A target peer checks the manifest, downloads the archive, verifies SHA-256,
  creates a rollback tarball, and extracts the update into its workspace.
- The target peer restarts its daemon/web/desktop process after apply.

The updater accepts `channel: "dev"` by default and refuses targets that do not
look like an EMA dev workspace unless `--allow-non-dev` is passed explicitly.

## Source Peer

```sh
cd runtime/EMA-0.0.5--4-24
node tooling/p2p-dev-update.mjs serve --pack --host 0.0.0.0 --port 49666
```

The manifest is available at:

```text
http://<source-peer-ip>:49666/ema-dev-update/manifest.json
```

## Target Peer

Check what the source peer is offering:

```sh
cd runtime/EMA-0.0.5--4-24
node tooling/p2p-dev-update.mjs check --peer http://<source-peer-ip>:49666
```

Run a dry apply. This downloads, verifies, and creates a rollback tarball, but
does not extract:

```sh
node tooling/p2p-dev-update.mjs apply --peer http://<source-peer-ip>:49666
```

Apply for real:

```sh
node tooling/p2p-dev-update.mjs apply --peer http://<source-peer-ip>:49666 --yes
```

Rollback archives live under:

```text
.ema-dev-updates/backups/
```

## Boundaries

This is file-level dev-build replacement. It does not solve event-log
replication, multi-writer truth, authority leases, or secure device pairing.
Those stay in `ema_replication` and the daemon protocol. This tool only gives
the development fleet a way to move the runtime bits peer-to-peer while that
transport is being built.
