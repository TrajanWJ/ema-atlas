# Agent Handoff Protocol

## Overview

File-based handoff system enabling direct agent-to-agent context passing without Right Hand as middleman. Agents create, claim, and complete handoffs via CLI tools in `~/handoff/bin/`.

## Directory Structure

```
~/handoff/
├── active/          # Pending and in-progress handoffs (JSON)
├── completed/       # Finished handoffs (JSON, kept for chaining)
└── bin/             # CLI tools
    ├── handoff-create    # Create a new handoff
    ├── handoff-claim     # Claim a pending handoff
    ├── handoff-complete  # Mark handoff done with result
    ├── handoff-chain     # Chain completed handoff → next agent
    └── handoff-list      # List handoffs by status/agent
```

## Handoff Lifecycle

```
Agent A: handoff-create --from A --to B --task "..." --context "..."
   ↓
Agent B: handoff-claim --agent B
   ↓  (receives full context, continuation token)
Agent B: handoff-complete <id> --result "..."
   ↓  (optional chaining)
Agent B: handoff-chain <id> --to C --task "next step..."
```

## CLI Reference

### Create a Handoff
```bash
handoff-create --from researcher --to coder \
  --task "Implement the auth fix" \
  --context "Found the bug in auth.ts:42, session token not refreshed" \
  --priority high
# Returns: handoff ID (continuation token)
```

### Claim a Handoff
```bash
# Claim by ID
handoff-claim 1710583200-a1b2c3d4

# Claim next pending for your role
handoff-claim --agent coder
# Outputs: full task + context + continuation token
```

### Complete a Handoff
```bash
handoff-complete 1710583200-a1b2c3d4 \
  --result "Fixed auth.ts, added token refresh on 401"
# Optionally attach a file:
  --output-file /tmp/patch.diff
```

### Chain to Next Agent
```bash
handoff-chain 1710583200-a1b2c3d4 \
  --to reviewer \
  --task "Review the auth fix in auth.ts"
# Automatically carries forward previous result as context
```

### List Handoffs
```bash
handoff-list                        # Active only
handoff-list --agent coder          # For specific agent
handoff-list --status pending       # By status
handoff-list --all                  # Include completed
```

## Patterns

### Direct Handoff (No Middleman)
Researcher → Coder without Right Hand:
```bash
# Researcher creates:
ID=$(handoff-create --from researcher --to coder --task "Build X" --context "findings...")

# Coder picks up:
handoff-claim --agent coder

# Coder completes:
handoff-complete $ID --result "Built X, tests pass"
```

### Pipeline Chain
```bash
ID1=$(handoff-create --from user --to researcher --task "Research options for X")
# ... researcher claims, completes ...
ID2=$(handoff-chain $ID1 --to coder --task "Implement chosen option")
# ... coder claims, completes ...
ID3=$(handoff-chain $ID2 --to reviewer --task "Review implementation")
```

### Continuation Tokens
Every handoff ID doubles as a continuation token. Any agent can read `~/handoff/active/<token>.json` or `~/handoff/completed/<token>.json` to resume context from a previous step.

## Integration with Right Hand

Right Hand can still orchestrate when needed, but simple A→B handoffs no longer require mediation. Right Hand monitors `~/handoff/active/` and can intervene if handoffs stall.
