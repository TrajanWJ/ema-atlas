# T3 Code Fork Borrow Analysis

## Source
`~/Projects/t3code-fork`

## Main conclusion
`t3code-fork` is highly relevant for a future EMA code vApp because it already embodies a modern coding-agent product stack with:
- desktop + web + server split
- contracts/shared packages
- client-runtime package
- explicit plans folder
- observability/provider/runtime docs
- xterm in web app
- provider-neutral runtime direction
- typed IPC / shared-model normalization plans

## Strong borrow candidates
### Architecture
- monorepo split across:
  - `apps/desktop`
  - `apps/web`
  - `apps/server`
  - `packages/client-runtime`
  - `packages/contracts`
  - `packages/shared`
- This is very close to a code-vApp-friendly shape.

### Planning discipline
The `.plans/` folder is rich and especially relevant. Notable plan themes include:
- shared model normalization
- typed IPC boundaries
- split app/server/manager responsibilities
- persisted state validation
- provider logstream lifecycle
- process/session abstraction unification
- provider-neutral runtime determinism
- server-authoritative event sourcing cleanup
- auth model

EMA should borrow this style of:
- explicit implementation plans close to code
- architecture refactor checklists
- plan-per-convergence-problem

### Technology/product patterns
- xterm in web UI
- contracts package as shared truth boundary
- client-runtime abstraction
- provider-neutral runtime posture
- desktop + web parity thinking
- observability documentation as first-class design artifact

## Likely future EMA code vApp imports
- provider-neutral runtime abstraction
- typed contracts package between UI/server/runtime
- process/session abstraction for coding agents
- event-sourced or server-authoritative execution state
- desktop/web mirrored code-work surface
- xterm-backed live coding session surface

## Why this matters
EMA wants a code vApp that does the same class of thing.
`t3code-fork` is not just inspiration; it is close to a sibling architecture for that subproduct.
