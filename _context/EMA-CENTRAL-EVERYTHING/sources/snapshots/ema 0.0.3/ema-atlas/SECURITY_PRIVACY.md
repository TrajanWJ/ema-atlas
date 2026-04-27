# Security & Privacy framing

A first-pass framing of the security and privacy questions EMA's
identity model and Personal AI semantics force. **Not** a policy doc —
the user owns those decisions. This file surfaces what has to be
decided so the questions don't slip past the v0.0.3 build.

> **Status:** framing. Promote to a hardened policy file
> (`SECURITY.md` + `PRIVACY.md`) once Q1, Q4, Q10 settle.

## Scope this file holds open

- **Authorization** — who can read/write what, scoped by Org/Space/Project
- **Authentication** — how humans and agents prove identity
- **Audit** — what control-plane records must record about every
  consequential action
- **Data residency** — where each data plane physically lives, especially
  under future P2P
- **Personal AI scope** — what a personal AI sees by default vs what
  requires explicit grant
- **Secret handling** — credentials, API keys, OAuth tokens
- **Capability locality** — what tools/auth a node has vs what it
  exposes

## Open questions this depends on

The questions below all live in [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md);
their resolutions shape what this doc can ever say definitively.

| Question | Why security/privacy can't be decided without it |
|---|---|
| **Q1** — Are agents first-class members? | If yes, agent identities need their own auth/secrets handling, distinct from human identity. If no, every agent action attributes to a human and inherits that human's permissions. |
| **Q3** — Project ↔ Space cardinality | Determines the permission tree shape (project-as-leaf vs space-spanning-projects). |
| **Q4** — Where does Personal AI execute? | If on user's machine, secrets stay local. If on daemon, daemon needs scoped access. If per-project placement, both. |
| **Q9** — Replication boundary | Anything that replicates must travel under encryption + with permission metadata; anything central can rely on a single auth gate. |
| **Q10** — Org/space → runtime/tool perms | Determines whether tool access is inherited from org policy, granted per-execution, or both. |

Until those settle, treat any "this is how we'll do auth" claim as a
working assumption, not a commitment.

## Working assumptions (subject to revision)

These are the assumptions current code/docs implicitly make. Each is a
candidate for promotion to formal policy when ready, or revision when
the relevant Q settles.

### A1 — Identity layers stay separate (P4)

`execution_id`, `session_id`, `provider_session_id`, `member_id`,
`agent_id`, `peer_id`, `workspace_artifact_id` are distinct types.
None substitutes for another in any control-plane record. Conflation
is one of the named architecture mistakes
([`MACBOOK_AGENT_HANDOFF_MASTER.md`](MACBOOK_AGENT_HANDOFF_MASTER.md) §20).

### A2 — Per-Project event_log shards

Every `event_log` row carries `project_id`. There is no global event_log
across projects. Cross-project queries require explicit elevated
membership, recorded as a control-plane event.

### A3 — Surfaces never see raw secrets

Surfaces receive scoped capability tokens, never raw API keys. Tokens
have explicit `project_id`, `member_id`, optional `agent_id`, scope
set, and TTL. Recorded on issue and on use.

### A4 — Personal AI scope is gated, not implicit

Personal AI sees the union of (user's projects ∪ user's spaces) but
each Org may downgrade Personal AI rights to read-only. The default for
a new Org is read-only; promotion to write requires explicit Org admin
action recorded in control_plane.

### A5 — Vault candidate "Auto-Resolve Gate" applies

Per the vault candidate term in [`GLOSSARY.md`](GLOSSARY.md): an agent
may resolve silently (no human review) only when:
- vault precedent exists
- user preferences match
- prior corrections don't contradict
- model confidence ≥ 0.85
Otherwise the action escalates to a human approval queue.

### A6 — Distributed AI Delegation requires opt-in

Per the vault candidate term: a peer may route inference through
another peer's credentials only when both peers have an active
delegation grant recorded in control_plane. Default is no.

### A7 — Capability locality is real (P8)

Every `Dispatch` carries an explicit `placement` field
(`Local | Daemon | Peer | HostAffinity`). The driver registry refuses
to route a dispatch to a placement that doesn't have the required
capability. Refusal is itself a control-plane event.

### A8 — Audit defaults to "everything"

Every consequential action lands in `event_log` with:
- the actor (`member_id` or `agent_id`)
- the project + space scope
- the intent
- the placement chosen
- the outcome (or pending status)
Surface-only events (a UI render, a tab change) do not need audit;
mutations always do.

## Threat surfaces this file is NOT yet addressing

These need their own future docs once Q1/Q9/Q10 settle:

- **Sybil attacks in mesh** — a peer claiming many identities
- **Replay attacks against the event_log** — same record applied twice
- **Personal AI prompt injection** — a doc/wiki edit that tries to
  exfiltrate context from the personal AI's ambient scope
- **Agent collusion** — two agent identities coordinating to bypass an
  Auto-Resolve Gate's confidence threshold
- **Secret leakage through driver event streams** — an agent that
  prints an API key into its DispatchUpdate
- **Audit log tampering** — append-only is necessary but not sufficient;
  needs hash chains or external anchoring

## How to extend this file

When you make a security or privacy decision, do not edit this file
silently. Use the [`howto/resolve-an-open-question.md`](howto/resolve-an-open-question.md)
workflow:

1. Mark the relevant open question resolved (Q1/Q4/Q9/Q10).
2. Move the affected working assumption (A1–A8) into a hardened
   `SECURITY.md` (or `PRIVACY.md`) file, confidence-styled rather than
   "subject to revision".
3. Add a CHANGELOG entry under the current wave.
4. Update DESIGN_PRINCIPLES.md if a new principle emerged.

## Cross-references

- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) — Q1, Q3, Q4, Q9, Q10
- [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) — P4, P8, P10
- [`GLOSSARY.md`](GLOSSARY.md) — Auto-Resolve Gate, Distributed AI Delegation,
  Honcho, Scope Advisor (vault candidates)
- [`graph/edges/identity.md`](graph/edges/identity.md)
- [`graph/edges/transport.md`](graph/edges/transport.md)
- [`research/parts/identity-project-space.md`](research/parts/identity-project-space.md)
