# 10 — First-boot flow

The first time an EMA daemon runs on a device, it must land the primary
user into a usable workspace without any user action beyond launching
the app. This doc defines the canonical sequence for device 1 of the
founding operator.

The founding user is **Trajan**. On first-boot, the daemon seeds **two**
organizations: a personal org for Trajan and the EMA development org. Trajan
owns both. Later devices (paired in) skip this sequence — they replay the
existing log.

All events below are appended by the daemon to the canonical SQLite log
in the order shown. They are replayable: starting a fresh daemon on an
empty `canonical.db` and re-running this sequence yields identical
projections.

## Preconditions

- Daemon is started (launchd / systemd --user / manual dev script).
- `canonical.db` does not exist, or exists but has zero events.
- No `device:<ulid>` is registered.
- No `org:<ulid>` exists.

## Sequence

| #  | Event                      | Actor                    | Notes                                                               |
| -- | -------------------------- | ------------------------ | ------------------------------------------------------------------- |
| 1  | `install.initialized`      | `system:ema_identity`    | root install record; captures genesis device and install pubkey     |
| 2  | `identity.user_upserted`   | `system:ema_identity`    | creates the install-local founding user before device projection    |
| 3  | `device.registered`        | `system:ema_identity`    | `bootstrap: "genesis"`; `attested_by: null`; local capabilities     |
| 4  | `actor.created`            | `actor:<trajan>`         | human actor record for Trajan                                       |
| 5  | `actor.created`            | `actor:<trajan>`         | Codex implementation actor                                          |
| 6  | `actor.created`            | `actor:<trajan>`         | Claude docs/synthesis actor                                         |
| 7  | `org.created`              | `system:ema_orgs`        | `kind: "personal"`; name = `"Trajan's Organization"`                |
| 8  | `membership.role_granted`  | `system:ema_memberships` | role `"owner"` for user `trajan` on the personal org                |
| 9  | `space.created`            | `system:ema_spaces`      | `"Personal Workspace"`; default space of the personal org           |
| 10 | `org.created`              | `system:ema_orgs`        | `kind: "team"`; name = `"Trajan's Organization"`                   |
| 11 | `membership.role_granted`  | `system:ema_memberships` | role `"owner"` for user `trajan` on the EMA development org         |
| 12 | `space.created`            | `system:ema_spaces`      | name = `"EMA Development"`; default space of that org               |
| 13 | `project.created`          | `system:ema_projects`    | name = `"EMA 0.0.6"` under the EMA development default space        |
| 14 | `blueprint.document.created` | `system:ema_blueprint` | creates the default EMA 0.0.6 Blueprint document                    |
| 15 | `blueprint.section.added`  | `system:ema_blueprint`   | root section                                                        |
| 16 | `blueprint.section.added`  | `system:ema_blueprint`   | runtime/source evidence section                                     |
| 17 | `attachment.created`       | `system:ema_attachments` | local EMA 0.0.6 runtime codebase attachment                         |
| 18 | `attachment.linked`        | `system:ema_attachments` | links runtime attachment to the Blueprint evidence section          |
| 19 | `blueprint.attachment.linked` | `system:ema_blueprint` | Blueprint-level attachment link                                     |

A fresh deterministic seed starts with the EMA development workspace available.
Existing daemon logs may have `home_current` moved by user work; use
`ema status --json` to inspect the live topbar selection. Agents should use the
durable Desktop project record with `--project EMA` for current EMA work.

## User label

`user_label` for the founding user is `trajan`. Stored once on
`device.registered.payload.name` as the device's human label
("Trajan MBP" is a later user-chosen override). The personal-org name
template is `"{user_label}'s Organization"` with first letter
capitalised. Rename is allowed later, subject to personal-org
invariants.

## Personal-org invariants

Per `01-topology.md`:

- Personal org has `kind: "personal"`. Rename cannot move away from the
  owning user's label in a way that impersonates a brand (enforced by
  `ema_orgs` writer: rejects `org.renamed` with `conflict` error class
  if the new name doesn't contain the owning user's label).
- Exactly one `membership.role_granted` of role `owner` on the personal
  org, targeting the sole user.
- Additional members on a personal org are only `guest`.

The EMA development org is a regular `kind: "team"` org — none of the
personal-org invariants apply. Trajan is its `owner` and can invite other
operators as `admin` / `member` later.

## Where this lives in code

- `ema_swarm_coordination.first_boot.seed_if_needed/1` owns the deterministic
  dev seed and emits the whole first-boot chain above.
- `install.initialized` is projected into the compact `install` table.
- `identity.user_upserted` is projected into the compact `users` table.
- `device.registered` is projected into the compact `devices` table with
  `attested_by` and `capabilities`.
- `ema_identity.register_device_with_attestation/9` is the shared writer for
  genesis and paired devices outside the deterministic seed.

Cross-context calls flow through the registry (`ema_orgs` subscribes to
`device.registered`; `ema_spaces` subscribes to `org.created`; etc.).
No context reaches into another's modules directly.

## Replication note

Device 1 runs this full sequence. Device 2 (post-pairing) does **not**
run it — device 2 instead receives the existing log from its peer and
projects the same state. In v0/dev, pairing uses manual JSON copy-paste:
`device.pairing_offer.create` returns the new device offer and short code,
then `device.pairing_offer.approve` appends a single `device.registered`
event with `bootstrap: "paired"` and `attested_by` set to the approving
trusted device. The existing org/space/project events are replayed from
the replicated log once replication is enabled.

## Open questions (deferred)

- Exact content of the initial seed attachments for `EMA 0.0.6`
  (doctrine folder, runtime repo, atlas snapshot). Covered in
  `08-vanilla-workspace.md` — requires a bootstrap script beyond this
  event sequence.
- Whether the default Blueprint document for `EMA 0.0.6` is emitted as
  part of this sequence (event #14: `blueprint.document.created`) or
  deferred to first visit. Current default: emit at #14, with a fixed
  title `"EMA 0.0.6 Blueprint"`.
