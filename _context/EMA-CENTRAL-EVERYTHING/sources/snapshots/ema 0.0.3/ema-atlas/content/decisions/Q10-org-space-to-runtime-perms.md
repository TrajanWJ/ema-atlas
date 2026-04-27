# Decision matrix — Q10 (Org/Space → runtime/tool perms)

Per-question decision matrix for resolving Q10 in
[`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md). Follows the shape laid
out in [`content/decision-matrix-template.md`](../decision-matrix-template.md)
verbatim.

> Q10 resolution depends on Q1 (agent identity). A matrix value for
> Q10 that assumes `agents-first-class` may not be valid if Q1
> resolves to `agents-as-proxies`. Cite the assumption.

## Question

`Q10` — `How org/space permissions map onto runtime/tool permissions`

(Restated verbatim from [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q10.)

The question's stated **blast radius** is "depends on agent identity
model; affects every driver dispatch, every tool invocation, every
cross-surface action." It surfaces in
[`graph/edges/identity.md`](../../graph/edges/identity.md),
[`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md) A3, and build-step 02.

`OPEN_QUESTIONS.md` frames the tension as: *simple inheritance vs
explicit policy bundles*.

Build-step 02
([`research/build-steps/02-identity-registry-skeleton.md`](../../research/build-steps/02-identity-registry-skeleton.md))
codes against a flat `Rule` list: `Rule(member, action, scope)` with
`policy.evaluate/3` returning `Allow | Deny`. That's close to Option A
but doesn't commit.

## Options being weighed

| Option | Short name | One-line description |
|---|---|---|
| Option A | `simple-inheritance` | Org → Project → Space → Member hierarchy; permissions flow down. Member inherits everything Org grants unless overridden at a lower level. Matches LDAP/traditional-RBAC intuition. |
| Option B | `explicit-policy-bundles` | Each (Org, Project, Space, Member) gets an explicit list of Policies. No implicit inheritance; permissions are only what the bundles explicitly grant. Matches AWS IAM intuition. |
| Option C | `per-execution-capability-grant` | Every `Dispatch` carries an explicit capability token with `project_id`, `member_id`, scope set, and TTL (per `SECURITY_PRIVACY.md` A3). Nothing happens without a valid token; org/space policy only shapes *which* tokens get minted. |
| Option D | `hybrid-static-policy-plus-dynamic-token` | Policies live as bundles on Org/Space (Option B shape). At dispatch time, the policy engine mints a short-lived capability token (Option C shape) for that specific dispatch. Static policy = authorship; dynamic token = enforcement. |

## Criteria

| Criterion | Why it matters | A inheritance | B bundles | C per-execution | D hybrid |
|---|---|---|---|---|---|
| Aligns with canonical rule (P1 + P4 + P10) | Identity layers distinct; surfaces don't decide perms | 0 (inheritance evaluation lives where?) | + (daemon owns policy) | + (daemon mints tokens) | + (daemon owns both) |
| Compatible with Q1 open | Agent-member attribution | 0 (works for either, but agent inheritance feels odd) | + (agent-member gets its own bundle) | + (agents get their own tokens) | + (both layers handle agents) |
| Smallest provable slice | 2-week vertical | + (flat Rule list evaluated; build-step 02's default) | 0 (bundle schema is non-trivial to ship) | – (token issuer + validator + expiry handling) | – (full two-layer system) |
| Reversible | Can migrate off cleanly | – (inheritance assumptions get baked into callers) | + (bundles are data; swap them) | + (tokens are stateless; swap issuer) | + (data-only migration per layer) |
| Auditability | Control-plane-visible | 0 (only the decision lands; the reasoning is implicit) | + (which bundle granted what) | + (every token issue + use is a row) | + (both) |
| Tests writable in v0.0.3 | Property tests | + (rule evaluation is pure) | + (bundle evaluation is pure) | 0 (token TTL + replay prevention tests) | 0 (both plus interaction) |
| Permission-creep resistance | Accidental over-grant | – (inheritance is the classic over-grant vector) | + (explicit is explicit) | + (per-execution forces fresh decisions) | + (static + dynamic both add friction) |
| Gleam-native | Typed end-to-end | + (flat Rule list is a record) | + (Bundle is a record) | + (Token is a typed record) | + (typed end-to-end, just more types) |
| Compatible with Q9 (mesh) | Cross-peer perm story | – (inheritance needs global org tree — doesn't partition) | + (bundles travel with the object) | + (tokens are self-contained) | + (tokens with bundle provenance) |
| Agent-as-delegated-actor | Distributed AI Delegation | – (inheritance can't easily model "agent X acts on behalf of member Y") | 0 (bundle per delegation needed) | + (token carries the delegation chain) | + (token + bundle together) |

## Costs and bets

### Option A — `simple-inheritance`
- **Bet:** It's the simplest thing that could work. Flat Rule list in
  build-step 02 already codes against this. Users understand
  inheritance from every other system they've touched.
- **Cost:** Inheritance becomes the implicit contract for every caller.
  When it breaks (and it will — mesh partition, delegated agents,
  personal-AI edge cases), refactoring it out means touching every
  evaluation site. Inheritance-based systems also accumulate
  exceptions; the exceptions become the real policy and nobody can
  read them.

### Option B — `explicit-policy-bundles`
- **Bet:** Explicit beats implicit. Every grant is visible and
  auditable. Adding a new permission dimension (new driver, new
  vApp, new Space type) means adding a new bundle shape, not hacking
  inheritance.
- **Cost:** More up-front schema work. Bundle authorship UX needs to
  exist — writing bundles by hand in JSON is no fun. Users have to
  learn the bundle language.

### Option C — `per-execution-capability-grant`
- **Bet:** Perms live as tokens, issued per dispatch. The token is
  the only thing that grants access; nothing works by position or
  membership. Clean cross-peer story, clean delegation story, clean
  revocation story (expire the token).
- **Cost:** Every action goes through a token issuance path. Token
  issuance and validation are performance-critical and security-
  critical code; getting them wrong breaks everything. No static
  "what can this member do?" answer without running the issuer.

### Option D — `hybrid-static-policy-plus-dynamic-token`
- **Bet:** Authorship lives in bundles (readable, auditable). Enforcement
  lives in tokens (fresh per dispatch, short-lived, carries
  delegation). We get the best of B and C; the daemon mediates.
- **Cost:** Two layers to keep in sync. Bundles can drift from what the
  issuer actually issues if the issuer has its own logic. More code,
  more tests, more places to get it wrong.

## Open questions this decision creates

- **How is a Policy Bundle authored?** By hand? By a generator? By a
  UI inside HQ vApp?
- **What's the revocation story?** For A: remove the rule. For B:
  remove the bundle. For C: TTL expiry. For D: both.
- **Does Personal AI get its own bundle/token shape, or does it
  inherit from the user?** (Depends on Q4 resolution.)
- **Cross-org delegation** — if Org-A's member grants Org-B's agent
  access to an Org-A Project, who owns the Policy/Token for that?

## Reversibility plan

- **A → B/C/D:** Hard. Inheritance assumptions land in every caller.
  Refactor cost is proportional to the number of permission-check
  call sites.
- **B → A:** Easy. Take the bundles, compute a transitive closure,
  express as inheritance. (Lossy for explicit denies.)
- **B → C:** Moderate. Bundles become the input to the token issuer;
  callers migrate from "check the bundle" to "get a token."
- **C → B:** Moderate. Token issuance path logs enough to reconstruct
  bundles.
- **D → B/C:** Easy. D contains both; you just stop using one layer.

## Provenance

- [`OPEN_QUESTIONS.md`](../../OPEN_QUESTIONS.md) Q10 (and Q1 dependency)
- [`research/build-steps/02-identity-registry-skeleton.md`](../../research/build-steps/02-identity-registry-skeleton.md)
  — currently codes against flat Rule list.
- [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md) A1 (identity layer
  separation), A3 (scoped capability tokens), A4 (personal AI gated),
  A7 (capability locality).
- [`graph/edges/identity.md`](../../graph/edges/identity.md)
- [`content/decisions/Q1-agents-as-first-class-members.md`](Q1-agents-as-first-class-members.md)
  — Q10's resolution depends on which Q1 option lands.
- [`DESIGN_PRINCIPLES.md`](../../DESIGN_PRINCIPLES.md) P4 (identity
  layer separation), P10 (org/space first-class).
- [`GLOSSARY.md`](../../GLOSSARY.md) — Auto-Resolve Gate (a
  specialized permission-deferral), Distributed AI Delegation (cross-
  peer delegation that Option C handles natively).

## Decision

> **Resolution:** _[leave blank — user fills in when decided]_
> Recorded in: _[link to commit or decision doc]_
> Affects: Q1 (agent-member permission story); Q4 (personal AI
> boundary); Q6 (per-Space Discord mirror policy); Q9 (mesh perm
> semantics).

Once the Decision is filled in, follow
[`howto/resolve-an-open-question.md`](../../howto/resolve-an-open-question.md):
mark Q10 resolved in `OPEN_QUESTIONS.md`, update the `Rule`/`Bundle`/
`Token` types in build-step 02 to match, propagate working assumptions
in `SECURITY_PRIVACY.md` A1-A8.

## Cross-references

- [`content/decision-matrix-template.md`](../decision-matrix-template.md)
- [`content/decisions/PRIORITY.md`](PRIORITY.md) — Q10 is Tier 3 (gate mesh)
- [`content/decisions/Q1-agents-as-first-class-members.md`](Q1-agents-as-first-class-members.md)
- [`content/decisions/Q4-personal-ai-execution-locus.md`](Q4-personal-ai-execution-locus.md)
- [`research/parts/identity-project-space.md`](../../research/parts/identity-project-space.md)
- [`SECURITY_PRIVACY.md`](../../SECURITY_PRIVACY.md)
