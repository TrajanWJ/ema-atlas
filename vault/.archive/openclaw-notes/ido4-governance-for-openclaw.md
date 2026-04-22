---
title: "ido4-governance-for-openclaw"
created: 2026-03-19
updated: 2026-03-19
type: architecture
status: active
source: unknown
tags: []
---
# ido4 Governance Patterns Applied to OpenClaw

**Source**: https://github.com/ido4-dev/ido4  
**Date applied**: 2026-03-18

## What We Stole

ido4's core insight: **governance through tool enforcement, not LLM trust**. Rules that cannot be bypassed because they run as code in the agent's own tool environment.

Applied to OpenClaw: rules enforced in dispatch-engine.sh and agent constraints, not hoped-for via SOUL.md text.

## Governance Primitives Mapped

### Task Locking → Dispatch Lock Files
```bash
# Before spawning any agent task:
LOCK_DIR=~/dispatch/locks
mkdir -p $LOCK_DIR

acquire_lock() {
    local task_id=$1
    local agent_id=$2
    local lockfile="$LOCK_DIR/${task_id}.lock"
    
    if [ -f "$lockfile" ]; then
        existing=$(cat "$lockfile")
        echo "BLOCKED: Task $task_id already locked by $existing"
        return 1
    fi
    echo "$agent_id $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$lockfile"
    return 0
}

release_lock() {
    local task_id=$1
    rm -f "$LOCK_DIR/${task_id}.lock"
}
```

### Dependency Coherence → Pre-dispatch Validation
```bash
validate_dependencies() {
    local task_file=$1
    local deps=$(jq -r '.dependencies[]?' "$task_file" 2>/dev/null)
    
    for dep in $deps; do
        # Check if dependency is in done/
        if ! ls ~/dispatch/done/ | grep -q "^${dep}"; then
            echo "BLOCKED: Dependency $dep not completed"
            return 1
        fi
    done
    return 0
}
```

### Work Distribution Scoring → Task Priority Algorithm
```bash
# Score = cascade_value + epic_momentum + capability_match + dependency_freshness
score_task() {
    local task_file=$1
    local agent_capabilities=$2
    
    cascade=$(jq -r '.cascade_value // 0' "$task_file")  # 0-40
    epic=$(jq -r '.epic_completion // 0' "$task_file")    # 0-25  
    cap=$(capability_match "$task_file" "$agent_capabilities")  # 0-20
    fresh=$(dependency_freshness "$task_file")             # 0-15
    
    echo $((cascade + epic + cap + fresh))
}
```

### Audit Trail → Dispatch Event Log
Already exists at ~/dispatch/done/ and ~/dispatch/failed/ — enhance with:
- `agent_id` attribution on every event
- `duration_ms` 
- `principles_validated` (which checks passed)

## Governance Principles Applied

### Principle 1: Epic Integrity → Project Phase Coherence
All dispatch tasks for a given project phase must complete before starting next phase.
Implementation: `phase` field in task JSON, validate phase is active before dispatch.

### Principle 2: Active Wave Singularity → Single Active Phase
Only one project phase active at a time.
Implementation: Check `~/dispatch/active-phase` file before accepting new phase tasks.

### Principle 3: Dependency Coherence → Already handled by task deps field
Enhance: enforce wave ordering (task's phase ≥ its dependencies' phases).

### Principle 4: Self-Contained Execution → Phase is completable
Before starting a phase, validate all dep tasks are either in same phase or already done.

### Principle 5: Atomic Completion → Phase done when ALL tasks done
`validate_phase_completion` returns FAIL if any task in phase not in done/.

## Implementation Status

| Feature | Status | Notes |
|---|---|---|
| Task locking | NOT IMPLEMENTED | Add lock files to dispatch-engine.sh |
| Dependency validation | PARTIAL | `dependencies` field exists, not enforced |
| Work scoring | BASIC | `priority` field only, no cascade/epic/fresh |
| Agent attribution | PARTIAL | agent_id logged but not enforced |
| Phase/wave system | NOT IMPLEMENTED | No phase concept currently |
| Audit trail | PARTIAL | done/failed dirs exist, no structured events |

## Next Steps

1. Add `acquire_lock` / `release_lock` to dispatch-engine.sh
2. Add `validate_dependencies` before any task spawn
3. Add `cascade_value` field to task JSON schema
4. Enhance task scoring with 4-dimension algorithm
5. Add `phase` field and enforce singularity
