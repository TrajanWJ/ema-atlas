# EMA Ontology + Schema Pack

## Design principle
EMA models **catalog**, **flow**, **reality**, and **responsibility** in one system.

---

## Core domains

### 1. Catalog domain
Durable things that exist.

Entity kinds:
- Host
- Agent
- Session
- Repo
- Channel
- Workstream
- Policy
- Artifact
- Proposal
- Execution
- Operator
- Incident

### 2. Flow domain
Things that move through lifecycle.

Flow objects:
- Proposal
- Execution
- Stage
- Task
- Verification
- ActionItem
- ScheduleEntry
- Incident

### 3. Reality domain
Truth claims and evidence.

Truth objects:
- EvidenceEvent
- StateSnapshot
- Verification
- Reconciliation
- SourceClaim

### 4. Responsibility domain
Ownership and human obligation.

Responsibility objects:
- Responsibility
- ActionItem
- EscalationRule
- WatcherSubscription

---

## Primary object model

## Workstream
A bounded lane of purposeful work.

Fields:
- id
- slug
- title
- summary
- status: proposed|active|blocked|paused|completed|archived
- ownerOperatorId
- contributorIds[]
- tags[]
- goalIds[]
- riskLevel: low|medium|high|critical
- priority: low|medium|high|critical
- startsAt?
- targetAt?
- completedAt?
- linkedEntityIds[]
- linkedProposalIds[]
- linkedExecutionIds[]
- linkedArtifactIds[]
- notesPageId?

## Proposal
An intended change, decision, investigation, or operation.

Fields:
- id
- title
- summary
- kind: change|investigation|maintenance|migration|ui|policy|recovery
- status: draft|triage|awaiting_approval|approved|rejected|scheduled|in_progress|completed|rolled_back|failed|archived
- workstreamId?
- ownerOperatorId
- requestedBy?
- riskLevel
- confidence: observed|inferred|assumed|verified|disputed
- blastRadius: local|lane|service|host|org
- scheduledAt?
- dueAt?
- expectedArtifactIds[]
- affectedEntityIds[]
- approvalPolicyId?
- rollbackPlan?
- verificationPlan?
- relatedProposalIds[]

## Execution
An actual run of work against reality.

Fields:
- id
- proposalId?
- workstreamId?
- title
- status: queued|running|blocked|awaiting_input|succeeded|failed|cancelled|rolled_back|unknown
- targetEntityIds[]
- targetHostIds[]
- startedAt?
- endedAt?
- durationMs?
- initiatedBy: operator|system|schedule|automation
- initiatorId?
- strategy: immediate|scheduled|canary|phased|manual
- verificationStatus: pending|passed|failed|partial|waived
- artifactIds[]
- stageIds[]
- evidenceEventIds[]
- sourceClaimIds[]

## Stage
A meaningful phase inside an execution.

Fields:
- id
- executionId
- title
- status: pending|running|succeeded|failed|skipped|cancelled
- order
- startedAt?
- endedAt?
- taskIds[]

## Task
Atomic runtime step or decomposed unit within a stage.

Fields:
- id
- executionId
- stageId?
- title
- kind: command|api|agent|message|verification|fetch|transform|manual
- status: pending|running|succeeded|failed|skipped|cancelled
- targetRef?
- outputArtifactIds[]
- evidenceEventIds[]
- startedAt?
- endedAt?

## ActionItem
Universal operational work item.

Fields:
- id
- title
- summary?
- kind: verify|investigate|approve|fix|follow_up|document|reconcile|schedule|observe|escalate
- status: new|triaged|ready|in_progress|blocked|waiting|done|cancelled|archived
- ownerOperatorId?
- collaboratorIds[]
- workstreamId?
- dueAt?
- scheduledAt?
- recurrenceRule?
- priority: low|medium|high|critical
- riskLevel: low|medium|high|critical
- blockedByIds[]
- relatedEntityIds[]
- relatedProposalIds[]
- relatedExecutionIds[]
- relatedIncidentIds[]
- verificationRequired: boolean
- confidence

## Responsibility
Explicit ownership record.

Fields:
- id
- subjectType
- subjectId
- primaryOwnerOperatorId?
- collaboratorIds[]
- watcherIds[]
- escalationOwnerOperatorId?
- assignedAt
- acknowledgedAt?
- dueTouchAt?
- status: assigned|acknowledged|active|waiting|escalated|orphaned|closed

## ScheduleEntry
Time-bound planned thing.

Fields:
- id
- kind: maintenance_window|review|milestone|recurring_check|deadline|meeting|change_window
- title
- startsAt
- endsAt?
- linkedObjectType
- linkedObjectId
- workstreamId?
- operatorId?
- recurrenceRule?
- status: scheduled|active|missed|done|cancelled

## Artifact
A durable output or reference.

Fields:
- id
- kind: log|report|screenshot|patch|commit|message|doc|recording|dataset|diff
- title
- uri?
- workstreamId?
- proposalId?
- executionId?
- sourceEntityIds[]
- ownerOperatorId?
- createdAt
- verificationStatus: unknown|pending|verified|rejected

## EvidenceEvent
An event that supports claims about reality.

Fields:
- id
- timestamp
- type
- sourceType: system|host|agent|operator|channel|repo|api
- sourceId?
- severity: info|warn|error|critical
- linkedObjectType?
- linkedObjectId?
- summary
- payloadRef?
- trustLevel: raw|parsed|derived|human_confirmed

## SourceClaim
A claim about state from some source.

Fields:
- id
- subjectType
- subjectId
- claimType
- claimedValue
- sourceType
- sourceId?
- observedAt
- freshnessStatus: fresh|stale|unknown
- confidence: low|medium|high

## Verification
A result stating whether an expectation matched observed reality.

Fields:
- id
- subjectType
- subjectId
- expectedState
- observedState
- status: pending|passed|failed|partial|waived
- checkedAt?
- checkedByType: operator|system
- checkedById?
- evidenceEventIds[]
- notes?

## Reconciliation
An explicit response to drift/conflict.

Fields:
- id
- subjectType
- subjectId
- desiredState
- observedState
- status: detected|acknowledged|deferred|reconciling|resolved|suppressed
- actionProposalId?
- ownerOperatorId?
- createdAt
- resolvedAt?

## Incident
Structured operational issue object.

Fields:
- id
- title
- summary
- severity: sev4|sev3|sev2|sev1|sev0
- status: detected|investigating|mitigating|monitoring|resolved|learning|closed
- ownerOperatorId?
- workstreamId?
- affectedEntityIds[]
- relatedExecutionIds[]
- relatedArtifactIds[]
- startedAt
- resolvedAt?
- impactSummary?
- timelineEventIds[]

---

## Relationship types

- owns
- responsible_for
- affects
- targets
- produced
- verifies
- derived_from
- triggered_by
- blocked_by
- duplicates
- supersedes
- scheduled_in
- escalates_to
- reconciles
- attached_to
- contributes_to

---

## Shared status overlays

### Trust / truth state
- observed
- inferred
- stale
- verified
- disputed
- unknown

### Attention state
- needs_owner
- needs_approval
- blocked
- stale
- overdue
- needs_verification
- orphaned
- drifted

---

## Golden invariants

1. Every proposal may link to zero or more executions.
2. Every execution must have evidence events.
3. Any object can be orphaned if ownership is missing.
4. Any change can be unverified until explicit verification happens.
5. Summary state must preserve drilldown to evidence.
6. Same objects support multiple views; do not fork model by page.
