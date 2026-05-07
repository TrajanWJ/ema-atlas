# Event catalog — v0

Authoritative list of every event kind. One row per kind. Sorted by
family, then by kind.

Contract check: every `<family>.<verb>` string that appears in daemon
or surface code must appear in this list.

## org

- `org.created`
- `org.renamed`
- `org.settings_updated`
- `org.archived`

## install

- `install.initialized`

## actor

- `actor.created`
- `actor.assigned_to_project`

## identity

- `identity.user_upserted`
- `identity.google_linked`
- `identity.authenticator_enabled`

## space

- `space.created`
- `space.renamed`
- `space.settings_updated`
- `space.archived`
- `space.member_added`
- `space.member_removed`

## project

- `project.created`
- `project.materialized`
- `project.materialization_failed`
- `project.renamed`
- `project.archived`
- `project.moved`               (cross-space move, preserves lineage)

## membership

- `membership.role_granted`
- `membership.role_revoked`
- `membership.removed`

## invite

- `invite.created`
- `invite.accepted`
- `invite.revoked`
- `invite.expired`

## access_session

- `access_session.challenge_created`
- `access_session.approved`
- `access_session.revoked`
- `access_session.expired`

## device

- `device.registered`
- `device.renamed`
- `device.revoked`
- `device.key_rotated`

## peer

- `peer.seen`
- `peer.unreachable`
- `peer.trust_established`
- `peer.trust_revoked`

## lease

- `lease.issued`
- `lease.renewed`
- `lease.released`
- `lease.expired`
- `lease.superseded`            (split-brain resolution)

## replication

- `replication.batch_sent`
- `replication.batch_applied`
- `replication.diverged`
- `replication.resynced`

## lane

- `lane.opened`
- `lane.claimed`
- `lane.moved`
- `lane.released`
- `lane.blocked`
- `lane.closed`

## queue_item

- `queue_item.added`
- `queue_item.ready`
- `queue_item.blocked`
- `queue_item.closed`

## campaign

- `campaign.created`
- `campaign.archived`

## mission

- `mission.created`
- `mission.started`
- `mission.paused`
- `mission.completed`

## handoff

- `handoff.requested`
- `handoff.accepted`
- `handoff.rejected`
- `handoff.completed`

## problem

- `problem.logged`
- `problem.solution_added`
- `problem.linked`

## agent

- `agent.reported`

## proposal

- `proposal.drafted`
- `proposal.submitted`
- `proposal.accepted`
- `proposal.rejected`
- `proposal.superseded`

## incident

- `incident.opened`
- `incident.noted`
- `incident.resolved`

## dispatch

- `dispatch.started`             (Hermes seam)
- `dispatch.scope_granted`
- `dispatch.ended`

## execution

- `execution.started`            (Hermes seam)
- `execution.ended`
- `execution.failed`

## tool

- `tool.invoked`                 (Hermes seam)
- `tool.returned`
- `tool.errored`

## blueprint

- `blueprint.document.created`
- `blueprint.document.renamed`
- `blueprint.document.archived`
- `blueprint.section.added`
- `blueprint.section.renamed`
- `blueprint.section.moved`
- `blueprint.section.removed`
- `blueprint.section.promoted_to_proposal`
- `blueprint.comment.added`
- `blueprint.comment.resolved`
- `blueprint.attachment.linked`
- `blueprint.attachment.unlinked`
- `blueprint.gac.created`
- `blueprint.gac.answered`
- `blueprint.gac.deferred`
- `blueprint.gac.promoted`
- `blueprint.blocker.opened`
- `blueprint.blocker.resolved`
- `blueprint.blocker.promoted`
- `blueprint.aspiration.captured`
- `blueprint.aspiration.promoted`
- `blueprint.aspiration.archived`
- `blueprint.decision.locked`
- `blueprint.decision.superseded`

## collab

- `collab.document.checkpointed`

## attachment

- `attachment.created`
- `attachment.renamed`
- `attachment.deleted`
- `attachment.linked`
- `attachment.unlinked`

## connector

- `connector.connected`
- `connector.disconnected`
- `connector.linked_resource_imported`

## vcalendar

- `vcalendar.created`
- `vcalendar.phase_set`
- `calendar_block.added`
- `calendar_block.moved`

## checkup

- `checkup.scheduled`
- `checkup.completed`
