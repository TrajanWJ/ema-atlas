# Worker and Context Contract Spec

**Status**: Draft v0
**Date**: 2026-04-06 UTC

## Purpose

Define what a worker receives, what it is allowed to do, and what it must return so proposal → worker → result becomes deterministic and auditable.

## Principles

- Narrow scope beats vague autonomy
- Inputs should be explicit, bounded, and reproducible
- Output must be structured, not prose-only
- Validation and acceptance criteria must be known before execution starts
- Workers should not rediscover basic repo/tool context if a bootstrap pack can provide it

## Worker Assignment Contract

```ts
interface WorkerAssignment {
  assignmentId: string
  executionId: string
  workerRole: string
  objective: string
  scope: {
    includedPaths?: string[]
    excludedPaths?: string[]
    allowedSystems?: string[]
    forbiddenSystems?: string[]
  }
  constraints: {
    deadline?: string
    budget?: {
      maxTurns?: number
      maxRuntimeMs?: number
      maxToolCalls?: number
    }
    writePolicy?: 'none' | 'workspace_only' | 'scoped_paths'
    approvalRequired?: boolean
  }
  successCriteria: string[]
  validationPlan: string[]
  contextBundleRef: string
  outputSchemaVersion: string
}
```

## Context Bundle Schema

Workers should receive a prepared context bundle rather than unlimited ambient context.

```ts
interface ContextBundle {
  contextBundleId: string
  generatedAt: string
  project: {
    projectId?: string
    name?: string
    repoRoot?: string
    defaultBranch?: string
  }
  task: {
    objective: string
    background?: string
    dependencies?: string[]
    relatedTasks?: string[]
  }
  repo: {
    languages?: string[]
    packageManagers?: string[]
    testCommands?: string[]
    lintCommands?: string[]
    buildCommands?: string[]
    ciHints?: string[]
  }
  docs: {
    required: string[]
    optional?: string[]
  }
  environment: {
    availableTools?: string[]
    availableIntegrations?: string[]
    riskZones?: string[]
  }
  priorArtifacts?: Array<{
    kind: string
    path?: string
    uri?: string
    label?: string
  }>
}
```

## Required Context Sections

Every worker context bundle should, where applicable, include:
- objective and success criteria
- relevant repo map
- known validation commands
- must-read docs
- relevant prior artifacts/results
- constraints and approval boundaries
- paths the worker may change

## Allowed Docs Bundle Rules

### Required before execution
- current task/plan doc if present
- relevant architecture/runbook docs
- repo-local agent guidance files
- validation/test instructions if known

### Optional
- adjacent design docs
- prior incident docs
- earlier result artifacts

### Exclusions
Do not stuff the bundle with unrelated repo-wide noise.
Large bundles increase cost and reduce determinism.

## Worker Output Contract

```ts
interface WorkerResult {
  assignmentId: string
  executionId: string
  status: 'completed' | 'blocked' | 'failed' | 'cancelled'
  summary: string
  assumptions: string[]
  changes?: Array<{
    path: string
    kind: 'created' | 'updated' | 'deleted' | 'proposed'
    note?: string
  }>
  artifacts?: Array<{
    kind: 'diff' | 'log' | 'report' | 'test_output' | 'doc' | 'plan'
    path?: string
    uri?: string
    label?: string
  }>
  evidence?: string[]
  risks?: string[]
  blockers?: string[]
  confidence?: number
  nextSuggestedActions?: string[]
}
```

## Acceptance / Result Schema

Acceptance should be checked against explicit criteria, not just “looks good.”

```ts
interface AcceptanceRecord {
  executionId: string
  assignmentId?: string
  accepted: boolean
  acceptanceChecks: Array<{
    name: string
    status: 'passed' | 'failed' | 'not_run'
    notes?: string
  }>
  verifier?: {
    type: 'human' | 'agent' | 'tool'
    id?: string
  }
  recordedAt: string
}
```

## Bootstrap Expectations

A project bootstrap/ingester should precompute as much stable context as possible:
- repo fingerprint
- tool inventory
- branch/base branch
- validation commands
- CI hints
- style/risk constraints
- known docs and templates

Workers should not repeatedly rediscover these unless bootstrap is stale.

## Failure Modes to Avoid

- worker gets vague objective and improvises scope
- worker edits outside allowed paths
- worker returns prose with no structured artifact references
- verifier lacks the original success criteria
- merge step receives incompatible result formats from different workers

## Minimum Acceptance Tests

- worker can execute from bundle without extra manual clarification for common tasks
- two workers on same assignment produce schema-compatible outputs
- verifier can evaluate result from assignment + result artifact alone
- bootstrap pack reduces redundant discovery across repeated tasks
