//// Canonical event envelope helpers.
////
//// The daemon is the only canonical writer. Every bounded-context writer
//// should emit one of these envelopes, then append it through the bus.

pub type Option(a) {
  None
  Some(a)
}

pub type Envelope {
  Envelope(
    event_id: String,
    kind: String,
    ts: String,
    actor: String,
    org_id: String,
    space_id: Option(String),
    project_id: Option(String),
    dispatch_id: Option(String),
    execution_id: Option(String),
    payload_json: String,
  )
}

pub type ValidationError {
  EmptyEventId
  EmptyKind
  EmptyTimestamp
  EmptyActor
  EmptyOrg
  EmptyPayload
  NotInCatalog(kind: String)
}

pub fn some(value: a) -> Option(a) {
  Some(value)
}

pub fn none() -> Option(a) {
  None
}

pub fn validate(env: Envelope) -> Result(Nil, ValidationError) {
  case env.event_id == "" {
    True -> Error(EmptyEventId)
    False -> validate_kind(env)
  }
}

fn validate_kind(env: Envelope) -> Result(Nil, ValidationError) {
  case env.kind == "" {
    True -> Error(EmptyKind)
    False -> validate_catalog(env)
  }
}

fn validate_catalog(env: Envelope) -> Result(Nil, ValidationError) {
  case kind_in_catalog(env.kind) {
    False -> Error(NotInCatalog(env.kind))
    True -> validate_ts(env)
  }
}

fn validate_ts(env: Envelope) -> Result(Nil, ValidationError) {
  case env.ts == "" {
    True -> Error(EmptyTimestamp)
    False -> validate_actor(env)
  }
}

fn validate_actor(env: Envelope) -> Result(Nil, ValidationError) {
  case env.actor == "" {
    True -> Error(EmptyActor)
    False -> validate_org(env)
  }
}

fn validate_org(env: Envelope) -> Result(Nil, ValidationError) {
  case env.org_id == "" {
    True -> Error(EmptyOrg)
    False -> validate_payload(env)
  }
}

fn validate_payload(env: Envelope) -> Result(Nil, ValidationError) {
  case env.payload_json == "" {
    True -> Error(EmptyPayload)
    False -> Ok(Nil)
  }
}

pub fn kind_in_catalog(kind: String) -> Bool {
  case kind {
    "install.initialized" -> True
    "actor.created" -> True
    "actor.assigned_to_project" -> True
    "identity.user_upserted" -> True
    "identity.google_linked" -> True
    "identity.authenticator_enabled" -> True
    "org.created" -> True
    "org.renamed" -> True
    "org.settings_updated" -> True
    "org.archived" -> True
    "space.created" -> True
    "space.renamed" -> True
    "space.settings_updated" -> True
    "space.archived" -> True
    "space.member_added" -> True
    "space.member_removed" -> True
    "project.created" -> True
    "project.materialized" -> True
    "project.materialization_failed" -> True
    "project.renamed" -> True
    "project.archived" -> True
    "project.moved" -> True
    "membership.role_granted" -> True
    "membership.role_revoked" -> True
    "membership.removed" -> True
    "invite.created" -> True
    "invite.accepted" -> True
    "invite.revoked" -> True
    "invite.expired" -> True
    "access_session.challenge_created" -> True
    "access_session.approved" -> True
    "access_session.revoked" -> True
    "access_session.expired" -> True
    "device.registered" -> True
    "device.renamed" -> True
    "device.revoked" -> True
    "device.key_rotated" -> True
    "peer.seen" -> True
    "peer.unreachable" -> True
    "peer.trust_established" -> True
    "peer.trust_revoked" -> True
    "lease.issued" -> True
    "lease.renewed" -> True
    "lease.released" -> True
    "lease.expired" -> True
    "lease.superseded" -> True
    "replication.batch_sent" -> True
    "replication.batch_applied" -> True
    "replication.diverged" -> True
    "replication.resynced" -> True
    "lane.opened" -> True
    "lane.claimed" -> True
    "lane.moved" -> True
    "lane.released" -> True
    "lane.blocked" -> True
    "lane.closed" -> True
    "queue_item.added" -> True
    "queue_item.ready" -> True
    "queue_item.blocked" -> True
    "queue_item.closed" -> True
    "campaign.created" -> True
    "campaign.archived" -> True
    "mission.created" -> True
    "mission.started" -> True
    "mission.paused" -> True
    "mission.completed" -> True
    "handoff.requested" -> True
    "handoff.accepted" -> True
    "handoff.rejected" -> True
    "handoff.completed" -> True
    "problem.logged" -> True
    "problem.solution_added" -> True
    "problem.linked" -> True
    "swarm.created" -> True
    "swarm.started" -> True
    "swarm.paused" -> True
    "swarm.stopped" -> True
    "swarm.report_generated" -> True
    "agent.reported" -> True
    "intent.created" -> True
    "intent.updated" -> True
    "proposal.drafted" -> True
    "proposal.created" -> True
    "proposal.approved" -> True
    "proposal.submitted" -> True
    "proposal.accepted" -> True
    "proposal.rejected" -> True
    "proposal.superseded" -> True
    "incident.opened" -> True
    "incident.noted" -> True
    "incident.resolved" -> True
    "artifact.created" -> True
    "artifact.updated" -> True
    "artifact.linked" -> True
    "artifact.archived" -> True
    "canon.written" -> True
    "canon.superseded" -> True
    "dispatch.started" -> True
    "dispatch.scope_granted" -> True
    "dispatch.ended" -> True
    "execution.started" -> True
    "execution.completed" -> True
    "execution.ended" -> True
    "execution.failed" -> True
    "execution.timeout" -> True
    "execution.interrupted_by_restart" -> True
    "tool.invoked" -> True
    "tool.returned" -> True
    "tool.errored" -> True
    "blueprint.document.created" -> True
    "blueprint.document.renamed" -> True
    "blueprint.document.archived" -> True
    "blueprint.section.added" -> True
    "blueprint.section.renamed" -> True
    "blueprint.section.moved" -> True
    "blueprint.section.removed" -> True
    "blueprint.section.promoted_to_proposal" -> True
    "blueprint.comment.added" -> True
    "blueprint.comment.resolved" -> True
    "blueprint.attachment.linked" -> True
    "blueprint.attachment.unlinked" -> True
    "blueprint.gac.created" -> True
    "blueprint.gac.answered" -> True
    "blueprint.gac.deferred" -> True
    "blueprint.gac.promoted" -> True
    "blueprint.blocker.opened" -> True
    "blueprint.blocker.resolved" -> True
    "blueprint.blocker.promoted" -> True
    "blueprint.aspiration.captured" -> True
    "blueprint.aspiration.promoted" -> True
    "blueprint.aspiration.archived" -> True
    "blueprint.decision.locked" -> True
    "blueprint.decision.superseded" -> True
    "blueprint.mine.requested" -> True
    "blueprint.section.proposed" -> True
    "blueprint.mine.completed" -> True
    "blueprint.mine.failed" -> True
    "intention.reviewed" -> True
    "intention.backfeed.requested" -> True
    "intention.backfeed.completed" -> True
    "intention.backfeed.failed" -> True
    "attachment.created" -> True
    "attachment.renamed" -> True
    "attachment.deleted" -> True
    "attachment.linked" -> True
    "attachment.unlinked" -> True
    "connector.connected" -> True
    "connector.disconnected" -> True
    "connector.linked_resource_imported" -> True
    "vcalendar.created" -> True
    "vcalendar.phase_set" -> True
    "calendar_block.added" -> True
    "calendar_block.moved" -> True
    "checkup.scheduled" -> True
    "checkup.completed" -> True
    _ -> False
  }
}
