// Ad-hoc smoke test. Not part of the library entry; included only so
// `tsc --noEmit` exercises a few representative imports during build.
//
// We deliberately don't export anything from this file; if the assertions
// below pass type-checking, the codegen is sound.

import type {
  ClientAddedPayload,
  ClientArchivedPayload,
  ResponsibilityCadenceChangedPayload,
  ProjectCreatedPayload,
  QueueItemAddedPayload,
  Event,
  EventKind,
  EnvelopeFields,
  ClientId,
  ProjectId,
  ResponsibilityId,
  OrgId,
  SpaceId,
  UserId,
  ActorId,
  EventOf,
  PayloadOf,
} from "./generated/index.ts";

// 1. ULID branded types reject untyped strings.
const _clientId: ClientId = "client:01J0000000000000000000000A";
const _projectId: ProjectId = "project:01J0000000000000000000000B";
const _responsibilityId: ResponsibilityId =
  "responsibility:01J0000000000000000000000C";

// 2. Each payload interface has the right shape.
const _addedPayload: ClientAddedPayload = {
  client_id: _clientId,
  org_id: "org:01J0000000000000000000000D" as OrgId,
  space_id: "space:01J0000000000000000000000E" as SpaceId,
  name: "Acme",
  status: "active",
  added_by: "user:01J0000000000000000000000F" as UserId,
};

// 3. Optional fields are optional.
const _archivedPayload: ClientArchivedPayload = {
  client_id: _clientId,
  archived_by: "actor:01J0000000000000000000000G" as ActorId,
};

// 4. Closed-set unions are literal-typed.
const _cadenceChange: ResponsibilityCadenceChangedPayload = {
  responsibility_id: _responsibilityId,
  from: "weekly",
  to: "daily",
  changed_by: "user:01J0000000000000000000000H" as UserId,
};

// 5. Project creation
const _projectCreated: ProjectCreatedPayload = {
  project_id: _projectId,
  space_id: "space:01J0000000000000000000000I" as SpaceId,
  name: "Locked-In iOS",
  created_by: "user:01J0000000000000000000000J" as UserId,
};

// 6. Discriminated union narrows correctly.
function exampleHandler(ev: Event): string {
  if (ev.kind === "client.added") {
    // ev.payload is narrowed to ClientAddedPayload.
    return ev.payload.name;
  }
  if (ev.kind === "responsibility.cadence_changed") {
    return ev.payload.to;
  }
  return ev.kind;
}

// 7. Helper types resolve.
type _AddedEv = EventOf<"client.added">;
type _AddedPayloadAlias = PayloadOf<"client.added">;
const _aliasCheck: _AddedPayloadAlias = _addedPayload;
const _addedEvCheck: _AddedEv | null = null;

// 8. EventKind is a closed union.
const _kindOk: EventKind = "queue_item.added";

// 9. Envelope fields are typed.
declare const _envelope: EnvelopeFields;
const _evidence: string = _envelope.event_id;

// 10. QueueItemAddedPayload includes the optional blueprint cross-refs.
declare const _queueItem: QueueItemAddedPayload;
const _maybeSection = _queueItem.blueprint_section_id;

// Reference everything to silence noUnusedLocals.
void [
  _clientId,
  _projectId,
  _responsibilityId,
  _addedPayload,
  _archivedPayload,
  _cadenceChange,
  _projectCreated,
  exampleHandler,
  _aliasCheck,
  _addedEvCheck,
  _kindOk,
  _evidence,
  _maybeSection,
];
