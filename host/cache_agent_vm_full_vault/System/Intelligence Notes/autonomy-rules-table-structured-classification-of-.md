---
title: Autonomy Rules Table — Structured Classification of What Auto-Approves vs Requires Human Review
type: reference
status: active
created: 2026-03-20
updated: 2026-04-06
source: intelligence extraction + governance cross-reference + local operator policy patterns
confidence: 0.87
tags: [autonomy, governance, safety, dispatch, approvals, policy]
summary: Reference policy for deciding which agent actions may auto-execute and which must pause for human review. The core principle is simple: low-reversibility or external-impact actions require tighter approval, while bounded internal work can often auto-run.
related:
  - [[ido4-governance]]
  - [[System Data Flow]]
  - [[Research - Claude Code Ecosystem March 2026]]
---

# Autonomy Rules Table — Structured Classification of What Auto-Approves vs Requires Human Review

> The point of autonomy rules is not to make agents timid. It is to let them move fast on safe work and slow down on irreversible work.

This note expands a previously extracted best-practice into a usable governance reference.

---

## Executive Summary

A good autonomy policy should answer one question quickly:

> **Can the agent do this now, or should a human review it first?**

The best decision boundary is not “simple vs complex.” It is:
- **reversibility**
- **blast radius**
- **external impact**
- **sensitivity of the target system**
- **confidence / ambiguity**

That yields four practical autonomy classes:

1. **AUTO** — safe to execute without asking.
2. **AUTO-WITH-GUARDS** — safe if bounded by explicit checks/logging.
3. **REVIEW-FIRST** — propose/prepare, but wait for human approval.
4. **NEVER-AUTO** — do not execute autonomously except under extremely explicit user instruction.

---

## Core Decision Principle

Autonomy should increase as actions become:
- internal
- reversible
- low-blast-radius
- observable
- easy to diff or undo
- low-stakes if wrong

Autonomy should decrease as actions become:
- external
- destructive
- hard to reverse
- security-sensitive
- user-facing/public
- financially/operationally consequential

This is the actual logic underneath a good rules table.

---

## The Four Autonomy Classes

## 1. AUTO

These are actions agents should usually perform without friction.

### Typical characteristics
- internal to workspace or vault
- reversible via git or file edit
- low-stakes if mistaken
- no external side effect
- minimal security or privacy risk

### Examples
- read files
- search code/docs/web pages
- write or improve internal research notes
- update vault notes/frontmatter/index references
- create non-executable drafts/specs/plans
- generate analysis artifacts
- run safe inspection commands (`ls`, `grep`, `git status`, tests, read-only diagnostics)

### Why these can auto-run
Because the cost of waiting for approval is often greater than the cost of a mistaken action.

---

## 2. AUTO-WITH-GUARDS

These are actions that can auto-run, but only with explicit boundaries, logging, or narrow scope.

### Typical characteristics
- mostly internal
- still reversible, but more consequential
- can create real operational churn if sloppy
- may touch executable/configurable surfaces
- need policy checks or scope limits

### Examples
- creating new scripts in internal repos
- editing automation/config files in non-production contexts
- dispatching low-risk internal tasks
- bulk note cleanup in bounded paths
- auto-post-processing after writes (formatting, indexing, validation)
- running controlled maintenance tasks (archive rotation, cache cleanup, health scans)
- generating PRs/commits in isolated branches when the system explicitly allows it

### Required safeguards
- path/scope restrictions
- dry-run or preview modes when possible
- audit logging
- rollback path
- clear ownership of where the action is allowed

### Why this class matters
Many systems fail by collapsing everything into either:
- “safe” or
- “dangerous”

The middle class is where most useful automation lives.

---

## 3. REVIEW-FIRST

These are actions the agent can prepare, but should not execute without a person signing off.

### Typical characteristics
- medium or high blast radius
- materially changes a live system or its public behavior
- affects production, money, credentials, or people
- can cause damage even if technically reversible

### Examples
- production config changes
- restarting important services without prior standing approval
- deleting or force-rewriting large bodies of data
- changing firewall/network/auth settings
- modifying secrets handling or credential stores
- sending messages/emails/posts on behalf of the user
- merging to main / deploying to production
- bulk deletions or schema migrations

### What the agent should do instead
- prepare diff/plan/command
- explain impact
- identify rollback path
- ask for explicit approval

This is where agents should be helpful, not passive — but still not self-authorizing.

---

## 4. NEVER-AUTO

These are actions that should not be autonomous by default, even if technically possible.

### Typical characteristics
- irreversible or near-irreversible
- high legal/privacy/security risk
- strong human-accountability requirement
- user identity / public representation involved

### Examples
- sending public posts or external announcements without explicit ask
- deleting user data without explicit approval
- destructive system wipe / mass delete operations
- credential rotation or secret disclosure actions without approval
- actions intended to bypass safeguards, policies, or human oversight
- impersonation / deceptive user-facing actions

### Why keep this class explicit
Without a “never auto” class, every future pressure for efficiency tends to erode boundaries.

---

## Structured Rules Table

| Action Category | Examples | Default Class | Why |
|---|---|---|---|
| Internal reading/search | read files, grep, docs lookup, repo inspection | AUTO | low risk, no side effects |
| Internal note writing | research notes, frontmatter fixes, documentation cleanup | AUTO | reversible, auditable, low blast radius |
| Bounded analysis scripts | health scans, stats, non-destructive reports | AUTO | internal + inspectable |
| Low-risk dispatch/proposals | queueing non-destructive internal work | AUTO-WITH-GUARDS | useful automation, but requires scope rules |
| New internal scripts | helper scripts in local repos/workspaces | AUTO-WITH-GUARDS | useful but executable surface increases risk |
| Non-prod config tweaks | local/dev automation settings | AUTO-WITH-GUARDS | can be reversed but still needs constraints |
| Bulk internal cleanup | cache pruning, archive moves, note refactors | AUTO-WITH-GUARDS | high volume increases chance of accidental damage |
| Production config/service changes | daemon settings, live service changes | REVIEW-FIRST | affects live behavior |
| External communication | emails, posts, outward messages as the user | REVIEW-FIRST or NEVER-AUTO depending on context | identity/public impact |
| Destructive data ops | mass deletes, force rewrites, dropping tables | REVIEW-FIRST or NEVER-AUTO depending on scale | low reversibility |
| Security/auth/secrets changes | tokens, auth rules, key rotation | REVIEW-FIRST | high sensitivity |
| Safeguard bypass / policy changes | disabling approvals, weakening controls | NEVER-AUTO | violates governance purpose |

---

## A Better Mental Model: Score by Risk Dimensions

Instead of only using hardcoded categories, a system can evaluate actions across dimensions.

### Useful dimensions

#### 1. Reversibility
Can the action be undone quickly and cleanly?

#### 2. Scope / blast radius
How much of the system or user environment can it affect?

#### 3. Externality
Does this action leave the machine or alter external systems/people?

#### 4. Sensitivity
Does it touch secrets, auth, production systems, or private data?

#### 5. Ambiguity
How likely is it that the user meant something narrower than the action implies?

### Example heuristic
- low on all five → AUTO
- moderate on one or two → AUTO-WITH-GUARDS
- high on any critical dimension → REVIEW-FIRST
- extreme on identity/destruction/safeguard bypass → NEVER-AUTO

This allows a policy engine to be principled rather than ad hoc.

---

## How This Applies to Dispatch / Proposal Executors

The original extracted note specifically said:

> add autonomy gate logic to the dispatch engine's proposal executor

That is still the right implementation target.

### What the executor should do
For every proposed action, classify it by:
- action type
- target path/system
- environment (local/dev/prod)
- whether it is external
- whether it is destructive
- whether rollback exists

### Then route accordingly

```text
if class == AUTO:
    execute + log
elif class == AUTO-WITH-GUARDS:
    enforce checks + execute + log
elif class == REVIEW-FIRST:
    stage proposal for approval queue
elif class == NEVER-AUTO:
    refuse autonomous execution
```

### Why this is better than gut-feel autonomy
Because it makes the system:
- auditable
- tunable
- testable
- explainable to humans

---

## Guardrails That Make Auto-Approval Safer

If you allow autonomy, the system should also require supporting controls.

### 1. Audit logging
Every auto-executed action should record:
- what ran
- why it was classified safe
- what files/systems it touched
- result / failure

### 2. Scope limits
Examples:
- only inside certain directories
- only non-production envs
- only whitelisted commands or file types

### 3. Rollback strategy
If an action is autonomous, there should usually be a rollback story.

### 4. Dry-run or preview when possible
Especially for bulk or generated operations.

### 5. Idempotency preference
Prefer actions that are safe if retried.

### 6. Human escalation on ambiguity
If classification confidence is low, route upward.

---

## Failure Modes of Bad Autonomy Policy

### 1. Too permissive
Agents make fast progress until they eventually do something embarrassing, destructive, or trust-damaging.

### 2. Too restrictive
Everything needs approval, so the system becomes slow and users stop benefiting from automation.

### 3. Category drift
Rules exist, but nobody updates them as the system grows.

### 4. Hidden exceptions
The real behavior depends on scattered prompt clauses and shell if-statements instead of one policy layer.

### 5. No distinction between internal and external work
This is one of the worst mistakes. Internal edits and public/external actions should not live under the same approval threshold.

---

## Relationship to Governance Research

This note aligns with the same basic lesson described in governance-oriented systems like [[ido4-governance]]:

> don’t rely on vibes; encode the rules.

The useful connection is that governance should be:
- deterministic where possible
- explicit
- enforced at transition points
- observable

Likewise, the context-governance framing in the “Context Cartography” paper reinforces that governance is not just about content — it is about how system decisions are structured and bounded.

---

## Practical Defaults for a System Like This One

For a vault-centered, automation-heavy, agentic local system, good defaults are roughly:

### AUTO
- research
- reading/searching
- vault note improvements
- frontmatter fixes
- local summaries and analyses
- non-destructive project exploration

### AUTO-WITH-GUARDS
- new local scripts
- bounded refactors
- cron/setup changes in non-prod contexts
- queueing internal maintenance tasks
- cache/archive cleanup with explicit scope

### REVIEW-FIRST
- production/service changes
- deleting nontrivial data
- touching credentials/auth/live infra
- external comms
- big repo-wide destructive changes

### NEVER-AUTO
- bypassing safeguards
- irreversible destructive actions without clear approval
- public representation as the user without explicit ask

These defaults feel consistent with how the broader system already wants to behave.

---

## Recommended Implementation Shape

### Option A — Simple static rules file
A YAML/JSON policy file mapping action classes.

Good for:
- transparency
- easy edits
- low implementation complexity

### Option B — Rules + scoring hybrid
Static policy categories plus risk scoring for ambiguous cases.

Good for:
- richer routing
- fewer brittle edge cases

### Option C — Full policy engine
Deterministic evaluator with audit log and explicit approvals queue.

Good for:
- mature dispatch systems
- production multi-agent orchestration
- environments with multiple operators/agents

### Best practical recommendation
Start with **static categories + a small risk-scoring overlay**, not a giant policy engine.

---

## Bottom Line

The autonomy rules table is a simple but powerful idea:

- let agents move fast on safe internal work
- add guardrails around medium-risk automation
- require humans for high-impact actions
- explicitly forbid self-authorizing on the worst classes of action

That is how you get **useful autonomy without reckless autonomy**.

The real test of a good policy is not whether it sounds smart. It is whether, under pressure, it gives the same sensible answer every time.

---

## Source Lineage

### Direct origin
- extracted from `task-35de59aa.txt` into the intelligence layer on 2026-03-20

### Supporting references
- [[ido4-governance]]
- governance/context research notes in the vault
- local dispatch and proposal-engine patterns that already distinguish low-risk auto-dispatch from human-review queues

#autonomy #governance #safety #dispatch #approvals #policy
