# P1 Ops Remediation Recommendations — 2026-04-06

This is the first concrete adjudication pass over the **P1 ops remediation queue**.
It does **not** apply destructive changes.
It converts the queue into explicit recommendations.

---

## 1. `cron.oauth-auto-approve`

### Current classification
- decision: `demote`
- risk: `critical`
- status: `dangerous-convenience`

### Recommendation
**Keep installed, but treat as break-glass convenience only.**

### Why
- browser-coupled approval automation
- detects OAuth pages in Chrome
- tries to auto-click approval via CDP
- falls back to refresh flow
- this is exactly the kind of thing that is useful in a pinch and terrible as a normal-path dependency

### What should be true
- normal auth health should not depend on this script running
- docs/registry should continue to label it as dangerous convenience
- if touched later, prefer gating or explicit enable/disable control rather than silent ambient operation

### Next review question
- is this still needed often enough to justify minute-by-minute cron execution?

---

## 2. `cron.auto-resume`

### Current classification
- decision: `review`
- risk: `high`
- status: `active`

### Recommendation
**Review before changing. Keep for now.**

### Why
- it touches recovery behavior
- recovery automation is valuable, but hard to reason about if poorly scoped
- this likely overlaps conceptually with session continuity behaviors, even if not directly with session-watchdog

### What should be true
- it should have a clearly documented trigger model
- it should not create hidden loops or restart storms
- it should log enough to reconstruct what it resumed and why

### Next review question
- is `auto-resume.sh` a narrow recovery helper, or a second implicit control plane for session state?

---

## 3. `cron.dispatch-engine`

### Current classification
- decision: `review`
- risk: `high`
- status: `active`

### Recommendation
**Keep, but treat as core infrastructure and review carefully before edits.**

### Why
- this is effectively the execution heart of the dispatch substrate
- it moves tasks through queue → active → done/failed
- if this misbehaves, the whole orchestration layer gets weird fast

### What should be true
- it should be treated as canonical dispatch executor
- related feeders should be documented against it
- any future changes should consider task lifecycle invariants first

### Next review question
- what are the formal invariants of dispatch-engine around retries, partials, lock handling, and artifact emission?

---

## 4. `cron.host-oauth-sync`

### Current classification
- decision: `review`
- risk: `high`
- status: `compatibility`

### Recommendation
**Keep only if host→VM credential borrowing is intentional architecture. Otherwise plan demotion.**

### Why
- this script is not just sync; it imports credentials from another machine via SSH
- that may be exactly what you want, but if so it should be acknowledged as architecture, not accidental glue
- if not intentional, it is one of the best future deprecation targets

### What should be true
- there should be an explicit answer to: “Is host auth a source of truth for this VM?”
- if yes: keep as compatibility/cross-machine bridge
- if no: demote/deprecate later

### Next review question
- does the VM actually need borrowed host credentials for ongoing operation, or can local credential flows fully replace this?

---

## 5. `cron.integrity-scan-fix`

### Current classification
- decision: `review`
- risk: `high`
- status: `active`

### Recommendation
**Review urgently before trusting. Keep only if its `--fix` behavior is well understood.**

### Why
- automatic integrity repair sounds nice and can also be chaos in a suit
- any `--fix --quiet` cron is a strong candidate for hidden state mutation
- this is the kind of automation that should be explicitly explainable

### What should be true
- you should know what files/state it can modify
- you should know its fallback behavior on false positives
- logs should make its mutations reconstructable

### Next review question
- can this run in detect-only mode first, with fix mode elevated to a deliberate action or narrower cadence?

---

## 6. `service.openclaw-gateway`

### Current classification
- decision: `review`
- risk: `high`
- status: `active`

### Recommendation
**Keep. It is a foundational service, not a candidate for removal. Review only for operational posture.**

### Why
- this is core platform runtime
- the risk is not that it exists, but that it has broad blast radius and should be understood as foundational infra

### What should be true
- its config/env/log paths remain documented
- restart and doctor flows remain clear
- changes around it get treated as platform-level changes

### Next review question
- what is the minimum operational contract for “gateway healthy enough to trust the rest of the stack”?

---

## 7. `service.oauth-credentials-watcher`

### Current classification
- decision: `keep`
- risk: `high`
- status: `canonical`

### Recommendation
**Keep as the primary local auth sync path.**

### Why
- among the auth cluster, this is the cleanest source of truth
- it watches credential file changes and syncs them on mutation
- much better primary path than browser automation

### What should be true
- related auth scripts should defer to this as primary local propagation path
- it should remain clearly documented as canonical in registry/docs

### Next review question
- should other auth automation be explicitly documented as upstream/downstream relative to this watcher?

---

## Priority summary

### P1 keep-as-core
- `service.openclaw-gateway`
- `service.oauth-credentials-watcher`
- `cron.dispatch-engine`

### P1 keep-but-review-carefully
- `cron.auto-resume`
- `cron.integrity-scan-fix`
- `cron.host-oauth-sync`

### P1 demote / break-glass
- `cron.oauth-auto-approve`

---

## Best next reviews after this

1. inspect `auto-resume.sh`
2. inspect `system-integrity-scan.sh`
3. inspect `dispatch-engine.sh`
4. decide whether host credential borrowing is intentional architecture

---

## Bottom line

Not every scary P1 item should be removed.
Some are core infrastructure.
The real split is:
- foundational and must be understood
- dangerous convenience and should be demoted
- compatibility glue that needs an explicit architectural yes/no
