# High-Stakes Routing — Consensus & Safety for Consequential Tasks

High-stakes tasks require a dual-routing consensus before execution to prevent misroutes
with irreversible, financial, or external consequences.

## What Counts as High-Stakes

### By Agent Tag
Agents tagged `high_stakes: true` in the roster:
- `finance` — financial transactions, invoice creation, payment actions
- `ops` — deploys, system restarts, config changes in production
- `security` — access revocation, permission changes, credential rotation
- Any agent invoked with explicit destructive task metadata

### By Task Tags (Applied by routing layer)
Tasks tagged with any of:
- `irreversible` — cannot be undone (file deletion, sent email, deployed code)
- `external` — sends data or actions outside the system (email, API, webhook)
- `financial` — money movement, invoices, contracts
- `destructive` — drops, deletes, wipes, removes

## Consensus Protocol

```
Primary router → selects agent A (with confidence score)
  If A is high-stakes OR task has high-stakes tags:
    Secondary router (different method) → selects agent B (with confidence score)

    A == B AND both confidence > 0.7
      → PROCEED (consensus reached)

    A != B OR either confidence < 0.5
      → ESCALATE (human review queue or safe acknowledgement)

    A != B AND both confidence 0.5–0.7
      → FALLBACK to safe general-purpose agent with explanation
```

## Router Asymmetry (Required)

The secondary router MUST use a different method than the primary:
- Primary: embedding-based → secondary: LLM-as-router (Haiku)
- Primary: LLM → secondary: embedding-based OR different model tier
- Never: primary and secondary using the same model or method

This ensures the secondary catches systematic errors the primary cannot self-detect.

## Joint Confidence Threshold

Even when both routers agree, require:
```
primary.confidence × secondary.confidence > 0.60
```
Both agreeing at 0.6 each = 0.36 joint → FALLBACK (both uncertain).
Both agreeing at 0.85 each = 0.72 joint → PROCEED.

## Escalation Handling

On `ESCALATE`:
1. Queue task in `~/dispatch/inter-agent/right-hand/` with `requires_human_review: true`
2. Acknowledge to user: "This action requires confirmation before proceeding."
3. Present both routing candidates and their confidence scores
4. Wait for explicit user approval before proceeding

On `FALLBACK`:
1. Route to `concierge` or `researcher` (safe, read-only agents)
2. Explain what was attempted and why confidence was insufficient
3. Ask user to clarify intent

## High-Stakes Task Tags — How to Apply

Any agent or orchestrator that receives a task should tag it if it matches:
```
# In task dispatch context:
task.tags = ["financial"]  # if involves money
task.tags = ["irreversible"]  # if action cannot be undone
task.tags = ["external"]  # if sending outside system
```

Right Hand applies tags at intake based on:
- Verb detection: "send", "deploy", "delete", "pay", "invoice" → check for high-stakes
- Agent target: `finance`, `ops`, `security` → always high-stakes

## Audit Log

All consensus decisions are logged:
```
event: consensus_routing
primary_agent: finance
secondary_agent: finance
agreement: true
primary_confidence: 0.91
secondary_confidence: 0.88
joint_confidence: 0.80
action: proceed
task_tags: ["financial"]
timestamp: <ISO8601>
```

High disagreement rate (>20%) between primary and secondary is a signal to improve the primary router.

## Configuration

```yaml
consensus_routing:
  enabled: true
  high_stakes_agents:
    - finance
    - ops
    - security
  high_stakes_tags:
    - irreversible
    - external
    - financial
    - destructive
  joint_confidence_threshold: 0.60
  on_escalate: human_queue
  on_fallback: concierge
```
