# @ema/contracts

Language-neutral contracts shared by daemon and surfaces.

This package is the **single source of truth** for:

- event kinds (`events/`)
- canonical record shapes (`types/`)
- IPC protocol between daemon and surfaces (`ipc/`)

Everything here is documentation-first. Each doc is the authoritative
spec; generated Gleam and TypeScript bindings live alongside when the
generator wave ships. Until then, daemon code and surface code both refer
to these docs by path + anchor.

## Rules

1. No code depends on something that is not in this package.
2. Additive changes to contracts do not require version bumps.
3. Breaking changes ship a new versioned file (`catalog.v1.md`,
   `shell-protocol.v1.md`) and a migration note; the old file is never
   edited.
4. Event kinds used anywhere in the codebase MUST be listed in
   `events/catalog.v0.md` (enforced by `tooling/contract-check.sh`).

## Layout

```
events/
  catalog.v0.md          list of every kind in every family
  <family>.md            per-family definitions, payload shapes
types/
  ids.md                 ULID + typed prefix + registry key conventions
  attachment.md          attachment record schema
  cwt_shared_files.md    current-work-tracker shared-files projection schema
  collab.md              BEAM live document projection/frame schema
  connector.md           connector record schema
ipc/
  shell-protocol.md      daemon↔surface websocket protocol
```

## Conventions

These rules are enforced by `scripts/contract-check.sh` and/or reviewer
discipline. Every swarm agent MUST follow them.

### Event kind naming
- Lowercase, dot-separated: `<family>.<verb>[.<subverb>]`.
- Family names are lowercase singular nouns (`org`, `project`, `lease`).
  Exception: `membership` and `replication` are already uncountable.
- Verbs are past-tense ( `created`, `renamed`, `linked`, `issued`).
  Never present-tense (`create`), never gerund (`creating`).
- Subverbs are allowed for mirror events only
  (`blueprint.attachment.linked`) or for scoped subtypes
  (`blueprint.section.added`).

### Payload field naming
- `snake_case`. Never `camelCase` or `PascalCase`.
- Typed ULIDs carry their prefix (`project:<ulid>`, `attachment:<ulid>`).
- Timestamps are `ISO-8601 UTC` strings, field name ends in `_at`
  (`expires_at`, `seen_at`).
- Optional fields end with `?` in the doc; on the wire they are omitted
  rather than sent as `null`, unless stated otherwise in the family file.

### Actor grammar (envelope)
```
actor =
  | user:<ulid>
  | device:<ulid>
  | system:<component>
```
Where `<component>` is one of the enumerated daemon sub-systems:
`ema_orgs`, `ema_spaces`, `ema_projects`, `ema_memberships`,
`ema_invites`, `ema_identity`, `ema_blueprint`, `ema_collab`,
`ema_attachments`, `ema_replication`, `ema_control`, `ema_exec`.

New components require a PR to this list. Typos in `<component>` are
caught by `contract-check.sh`.

### Module naming (Gleam daemon)
- One bounded context per top-level module folder under
  `apps/daemon/src/ema_<plural_noun>/`.
- Writer file is `<context>.gleam` (e.g. `ema_attachments/attachments.gleam`);
  writer message type is `Msg`; writer error type is `<Context>Error`.
- Cross-context calls MUST go through the registry
  (`<kind>:<ulid>` lookup); never import another context's modules
  directly.

### Command ops (IPC)
- Same shape as event kinds (`<family>.<verb>`) but verbs are imperative
  present-tense: `org.create`, `connector.connect`,
  `attachment.link`.
- Queries (no side-effect) use an imperative verb with a clear read
  connotation (`connector.list_picker_items`) and return data inline on
  `command_result` rather than appending events.
- Live collaboration commands use the same imperative form:
  `collab.document.open` opens/subscribes to a BEAM-owned room, and
  `collab.document.replace` writes a whole-body replacement frame.

### Error classes
See `ipc/shell-protocol.md` (**Error classes** section). That table is
the authoritative enumeration. Family files and writers MUST NOT invent
new `error.class` values.

### Contract-check coverage
`scripts/contract-check.sh` fails CI if:
- An event kind appears in code but is not in `events/catalog.v0.md`.
- An event kind is in `catalog.v0.md` but has no family-file entry.
- An actor string in a test fixture does not match the actor grammar.
- A command op appears in surface code but is not in the shell-protocol
  v0 commands table.
