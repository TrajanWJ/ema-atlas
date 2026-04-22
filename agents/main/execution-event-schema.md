# Execution Event Schema

**Status**: Draft v0
**Date**: 2026-04-06 UTC

## Purpose

Provide a compact canonical event schema for execution lifecycle publishing, websocket streaming, and event-store append.

## Event Envelope

```ts
interface ExecutionEventEnvelope {
  eventId: string
  executionId: string
  sequence: number
  occurredAt: string
  type: ExecutionEventType
  status?: ExecutionStatus
  phase?: ExecutionPhase
  actor?: {
    type: 'user' | 'agent' | 'system' | 'cron' | 'tool'
    id?: string
    label?: string
  }
  summaryLine?: string
  payload?: Record<string, unknown>
}
```

## Event Types

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

## Status and Phase Enums

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

## Required Payload Shapes

### Progress event
```ts
payload: {
  current?: number
  total?: number
  percent?: number
  label?: string
}
```

### Artifact attached event
```ts
payload: {
  kind: 'plan' | 'diff' | 'log' | 'report' | 'result' | 'test_output' | 'context_bundle'
  path?: string
  uri?: string
  label?: string
}
```

### Completion event
```ts
payload: {
  outcome: 'success' | 'partial' | 'failure'
  verificationStatus?: 'pending' | 'passed' | 'failed' | 'not_run'
  artifactRefs?: Array<{ kind: string; path?: string; uri?: string; label?: string }>
}
```

### Failure event
```ts
payload: {
  code: string
  category?: 'input' | 'tool' | 'runtime' | 'network' | 'verification' | 'unknown'
  retryable?: boolean
}
```

## Ordering Rules

- sequence must be monotonic per execution
- consumers must ignore duplicate envelopes with same `eventId`
- reconnecting stream consumers should resume from last seen sequence

## Acceptance Criteria

- one compact schema works for append-only event store and websocket stream
- UI can reconstruct execution timeline from envelopes alone
- terminal events carry enough information for outcome tracking
- duplicate delivery does not corrupt downstream projection
