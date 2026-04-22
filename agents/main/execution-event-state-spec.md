# Execution Event and State Spec

**Status**: Draft v0
**Date**: 2026-04-06 UTC

## Purpose

Define the canonical execution lifecycle, state transitions, and event contract that HQ, Dispatch Board, outcome tracking, and live execution streams can rely on.

## Design Goals

- One canonical state model for execution lifecycle
- Clear separation between current state and append-only event history
- Stable contract for UI, websocket streams, logs, and downstream automations
- Explicit artifact/result links
- Robust handling for retries, cancellation, failure, and stale/orphaned runs

## Core Concepts

### ExecutionRecord
Current authoritative state for one execution.

```ts
interface ExecutionRecord {
  executionId: string
  parentExecutionId?: string
  projectId?: string
  campaignId?: string
  taskId?: string
  objective: string
  initiatedBy: 'user' | 'system' | 'cron' | 'agent'
  assignedAgent?: string
  status: ExecutionStatus
  phase: ExecutionPhase
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
  startedAt?: string
  endedAt?: string
  attempt: number
  queuePosition?: number
  progress?: {
    current?: number
    total?: number
    label?: string
    percent?: number
  }
  result?: ExecutionResultSummary
  artifacts?: ExecutionArtifactRef[]
  worktree?: WorktreeRef
  contextBundleRef?: string
  error?: ExecutionError
  metadata?: Record<string, unknown>
}
```

### ExecutionStatus

```ts
type ExecutionStatus =
  | 'queued'
  | 'planning'
  | 'ready'
  | 'running'
  | 'verifying'
  | 'blocked'
  | 'waiting_human'
  | 'retrying'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'timed_out'
  | 'orphaned'
```

### ExecutionPhase

```ts
type ExecutionPhase =
  | 'intake'
  | 'decomposition'
  | 'dispatch'
  | 'implementation'
  | 'verification'
  | 'merge'
  | 'reporting'
  | 'done'
```

### ExecutionEvent
Append-only event for lifecycle history and live stream projection.

```ts
interface ExecutionEvent {
  eventId: string
  executionId: string
  occurredAt: string
  sequence: number
  type: ExecutionEventType
  status?: ExecutionStatus
  phase?: ExecutionPhase
  actor?: {
    type: 'user' | 'agent' | 'system' | 'cron' | 'tool'
    id?: string
    label?: string
  }
  message?: string
  payload?: Record<string, unknown>
}
```

### ExecutionEventType

```ts
type ExecutionEventType =
  | 'execution.created'
  | 'execution.queued'
  | 'execution.planning_started'
  | 'execution.ready'
  | 'execution.started'
  | 'execution.progress'
  | 'execution.blocked'
  | 'execution.waiting_human'
  | 'execution.retry_scheduled'
  | 'execution.verification_started'
  | 'execution.merge_started'
  | 'execution.artifact_attached'
  | 'execution.completed'
  | 'execution.failed'
  | 'execution.cancelled'
  | 'execution.timed_out'
  | 'execution.orphaned'
  | 'execution.resumed'
```

## State Machine

### Allowed transitions
- `queued -> planning`
- `planning -> ready | blocked | failed`
- `ready -> running | cancelled`
- `running -> verifying | blocked | waiting_human | retrying | failed | timed_out | cancelled`
- `verifying -> merge | retrying | failed | waiting_human`
- `merge -> reporting | failed`
- `reporting -> succeeded | failed`
- `blocked -> running | cancelled | failed`
- `waiting_human -> running | cancelled | failed`
- `retrying -> queued | running | failed`
- terminal: `succeeded | failed | cancelled | timed_out | orphaned`

### Invalid behavior to prevent
- terminal state regressions without explicit `execution.resumed`
- silent mutation of completed result artifacts
- status changes without append-only event emission

## Result + Artifact Contract

```ts
interface ExecutionResultSummary {
  outcome: 'success' | 'partial' | 'failure'
  summary: string
  confidence?: number
  verificationStatus?: 'pending' | 'passed' | 'failed' | 'not_run'
}

interface ExecutionArtifactRef {
  kind: 'plan' | 'diff' | 'log' | 'report' | 'result' | 'test_output' | 'context_bundle'
  path?: string
  uri?: string
  label?: string
}

interface WorktreeRef {
  path: string
  baseBranch?: string
  branch?: string
  repoRoot?: string
}

interface ExecutionError {
  code: string
  message: string
  retryable?: boolean
  category?: 'input' | 'tool' | 'runtime' | 'network' | 'verification' | 'unknown'
}
```

## Canonical Store Model

Use two layers:
- **current-state store**: latest `ExecutionRecord`
- **append-only event store**: ordered `ExecutionEvent`s

HQ and Dispatch Board should render from the event/store projection, not from ad hoc logs.

## Websocket / Live Stream Projection

The live stream should publish normalized execution events only.

```ts
interface ExecutionStreamMessage {
  channel: 'execution-stream'
  generatedAt: string
  executionId: string
  sequence: number
  eventType: ExecutionEventType
  status?: ExecutionStatus
  phase?: ExecutionPhase
  summaryLine?: string
  progress?: ExecutionRecord['progress']
  artifact?: ExecutionArtifactRef
  error?: ExecutionError
}
```

### UI expectations
- UI can reconstruct timeline from ordered stream messages
- current cards can derive from latest projected state
- stale connection can replay from last sequence

## Completion Callback Contract

Executions must finalize through an explicit callback/update path.

Required completion payload:
- execution id
- terminal status
- endedAt
- result summary
- verification status if known
- artifact refs
- error if failed
- final sequence/event

No run should be considered complete based on process exit alone.

## Orphan / Timeout Handling

- `timed_out`: execution exceeded bounded deadline
- `orphaned`: runner disappeared or lifecycle lost ownership
- both require explicit terminal event and operator visibility
- orphan detection should be background-reconciled, not inferred silently

## Outcome Tracking Expectations

Outcome tracking depends on this spec and should consume canonical terminal events.

Minimum guarantees:
- terminal event is durable
- result summary exists for all terminal outcomes
- artifact refs remain accessible
- verification status is explicit rather than implied

## Minimum Acceptance Tests

- execution timeline can be reconstructed from events
- HQ view remains consistent after reconnect/replay
- completion callback populates canonical terminal state
- blocked/waiting/retrying states are visible and distinct
- orphaned execution is surfaced explicitly
- duplicate event publish does not corrupt projection
