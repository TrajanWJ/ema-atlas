# Guardrails — Pre-Routing Safety Layer

Pre-routing guardrails run **before** any agent sees a query. They fire in priority order,
short-circuit on BLOCK, and pass transformed queries to the next guard.

## Guardrail Chain (Priority Order)

| Guard | Method | Target latency | What it catches |
|---|---|---|---|
| Scope check | Keyword/embedding vs. known agent domains | <5ms | Completely off-topic requests |
| Prompt injection | Pattern matching on injection signatures | <20ms | Jailbreaks, instruction overrides |
| PII scrubbing | Regex entity replacement before logging | <10ms | Email, SSN, phone in routing logs |
| Content policy | Keyword blocklist + optional moderation API | <50ms | Harmful/disallowed content |
| Rate limit by intent | Sliding window per user+intent | <1ms | Abuse patterns, flooding |

## Actions

- **PASS** — route normally
- **BLOCK** — return error immediately; never reaches an agent
- **TRANSFORM** — sanitized version passes through (PII scrubbing)

## Scope Check Rules

Block when query has zero keyword overlap with known domains AND:
- Does not mention any agent capability keyword (see routing-rules.md)
- Has no match to any orchestrator trigger keyword

Known in-scope domains: `technical, business, life, quality, knowledge, research, writing, analysis, ops, security`

## Prompt Injection Patterns (Block)

Flag and block queries containing:
- `ignore previous instructions`
- `you are now` / `pretend you are` / `act as if`
- `system prompt` / `reveal your instructions`
- `forget everything above`
- `[INST]` / `<|system|>` / `<|im_start|>` (token injection attempts)
- Repeated instruction-override phrases across 3+ turns from same user

Action: Log attempt (without query content), block with generic `"Invalid request"`.
Do not hint at detection method in the error response.

## PII Scrubbing (Transform)

Replace before logging routing events (forward original to agent):
- Email addresses → `[EMAIL]`
- Phone numbers → `[PHONE]`
- SSNs (XXX-XX-XXXX) → `[SSN]`
- Credit card numbers → `[CARD]`
- IP addresses in context → `[IP]`

The unscrubbed query is forwarded to the agent but never written to logs.

## Content Policy (Block)

Block requests explicitly asking for:
- Content that violates safety boundaries (see safety-boundaries.md)
- Instructions for physical harm
- Bulk data exfiltration or mass targeting

Configured in `safety-boundaries.md`; guardrails enforce at routing layer.

## Rate Limiting (Block)

Sliding window: max 20 requests per intent-class per minute per user context.
Burst allowance: 5 over limit before hard block.
Reset: 60s sliding window.

## Configuration

To disable a guard for a specific deployment context, override in agent's system prompt:
```
guardrails_override:
  - name: scope_check
    enabled: false   # Only if routing to a truly general-purpose agent
```

## Logging

Every non-PASS result emits a `GuardrailEvent`:
```
guard_name: <which guard triggered>
action: BLOCK | TRANSFORM
reason: <category, no PII>
timestamp: <ISO8601>
```

Feeds into routing observability. High BLOCK rates indicate abuse or misconfigured scope.
