# EMA Governance

`Ema.Claude.Governance` is the safety and quality control layer — ensuring AI outputs meet standards, costs stay within budget, and high-stakes actions get appropriate oversight.

## Components

### 1. Quality Gate (`Ema.Claude.QualityGate`)

Post-run checks on AI outputs with a regeneration loop (max 3 iterations):

```elixir
def evaluate(result, context) do
  case check_quality(result, context) do
    :accept -> {:accept, result}
    :accept_with_warnings -> {:accept, result, warnings}
    {:regenerate, feedback} ->
      if context.iteration < 3 do
        {:regenerate, feedback}
      else
        {:accept_with_warnings, result}
      end
  end
end
```

**Quality checks:**
- Completeness — does the output address the full prompt?
- Coherence — is the output internally consistent?
- Safety — no harmful content, no secrets leaked
- Format compliance — matches expected output structure

### 2. Proposal Quality Pipeline

The ProposalEngine runs every proposal through a multi-stage quality pipeline:

```
Generator → Refiner → Debater → Scorer → Tagger
```

Each stage can reject or request regeneration:
- **Scorer** computes 4 dimensions: codebase coverage, architectural coherence, impact, prompt specificity
- **Debater** challenges proposals with counter-arguments
- **Tagger** classifies and routes to the appropriate queue

### 3. Trust Scoring (`Ema.Intelligence.TrustScorer`)

Tracks trust scores per provider and per task type based on historical outcomes:

- High trust (>0.8) → more autonomy, auto-approve proposals
- Medium trust (0.5-0.8) → require confirmation
- Low trust (<0.5) → block, notify user

### 4. Cost Governance (`Ema.Intelligence.CostForecaster`)

Monitors AI spending and enforces budget constraints:

- **Token tracking:** Every AI call records input/output tokens and cost
- **Spike detection:** Alerts when hourly cost exceeds 2x rolling average
- **Budget caps:** Hard limits per provider, per day, per project
- **SmartRouter feedback:** Budget spikes temporarily shift routing to cheaper providers

## Escalation Path

```
AI output
  → QualityGate.evaluate()
    → :accept → persist
    → :regenerate → retry (max 3)
    → :reject → escalate to human review queue

High-stakes action detected
  → Governance.review()
    → Trust score > 0.8 → auto-approve with logging
    → Trust score 0.5-0.8 → require confirmation
    → Trust score < 0.5 → block, notify user
```

## What Counts as High-Stakes

Actions flagged for governance review:
- **Financial:** Invoicing, payment, contract actions
- **Destructive:** File deletion, database drops, service restarts
- **External:** Sending emails, posting to APIs, deploying code
- **Irreversible:** Published commits, sent messages, credential changes

These are detected by task tags in the dispatch system and by Governance GenServer pattern matching on action types.
