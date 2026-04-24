# 10 — First-boot flow

The first time an EMA daemon runs on a device, it must land the primary
user into a usable workspace without any user action beyond launching
the app. This doc defines the canonical sequence for device 1 of the
founding operator.

The founding user is **Trajan**. On first-boot, the daemon seeds **two**
organizations: a personal org for Trajan and the project-building org
`Founding-Fathers-EMA`. Trajan owns both. Later devices (paired in) skip
this sequence — they replay the existing log.

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
| 1  | `device.registered`        | `system:ema_identity`    | `bootstrap: "genesis"`; device pubkey generated locally             |
| 2  | `org.created`              | `system:ema_orgs`        | `kind: "personal"`; name = `"Trajan's Organization"`                |
| 3  | `membership.role_granted`  | `system:ema_memberships` | role `"owner"` for user `trajan` on the personal org                |
| 4  | `space.created`            | `system:ema_spaces`      | same name as personal org; becomes its default space                |
| 5  | `org.created`              | `system:ema_orgs`        | `kind: "team"`; name = `"Founding-Fathers-EMA"`                     |
| 6  | `membership.role_granted`  | `system:ema_memberships` | role `"owner"` for user `trajan` on Founding-Fathers-EMA            |
| 7  | `space.created`            | `system:ema_spaces`      | name = `"Founding-Fathers-EMA"`; default space of that org          |
| 8  | `project.created`          | `system:ema_projects`    | name = `"EMA 0.0.5"` under the Founding-Fathers-EMA default space   |

The shell boots with the current selection pointed at events 5/7/8
(Founding-Fathers-EMA → Founding-Fathers-EMA → EMA 0.0.5). The personal
org exists from day one but is not the default context; Trajan switches
into it via the topbar org selector.

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

Founding-Fathers-EMA is a regular `kind: "team"` org — none of the
personal-org invariants apply. Trajan is its `owner` and can invite
other operators as `admin` / `member` later.

## Where this lives in code

- `ema_identity.register_device/1` emits event (1).
- `ema_orgs.bootstrap_personal/1` emits events (2)–(4) in one writer call.
- `ema_orgs.bootstrap_team/2` (called with `"Founding-Fathers-EMA"`)
  emits events (5)–(7).
- `ema_projects.seed_vanilla_workspace/1` emits event (8) once the
  Founding-Fathers-EMA default space is visible on the bus.

Cross-context calls flow through the registry (`ema_orgs` subscribes to
`device.registered`; `ema_spaces` subscribes to `org.created`; etc.).
No context reaches into another's modules directly.

## Replication note

Device 1 runs this full sequence. Device 2 (post-pairing) does **not**
run it — device 2 instead receives the existing log from its peer and
projects the same state. The pairing ceremony appends only
`device.registered` with `bootstrap: "paired"`, and the existing
org/space/project events are replayed from the replicated log.

## Open questions (deferred)

- Exact content of the initial seed attachments for `EMA 0.0.5`
  (doctrine folder, runtime repo, atlas snapshot). Covered in
  `08-vanilla-workspace.md` — requires a bootstrap script beyond this
  event sequence.
- Whether the default Blueprint document for `EMA 0.0.5` is emitted as
  part of this sequence (event #9: `blueprint.document.created`) or
  deferred to first visit. Current default: emit at #9, with a fixed
  title `"EMA 0.0.5 — Master Blueprint"`, same writer call as #8.
