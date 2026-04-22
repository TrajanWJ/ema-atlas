# Drift Audit — EMA / place.org / TS rewrite / current p2p direction

Generated on agent-vm from visible code, notes, session logs, and the user's direct instruction.

## Executive summary

The drift is not just code drift. It is **story drift**:
- multiple eras of the same underlying ambition exist across different repos and note systems
- implementation stacks changed, but intent partially survived each rewrite
- source-of-truth moved around between repo code, vault notes, session logs, and host-only artifacts
- the current task is therefore not "pick the right repo" yet
- it is to **reconstruct one coherent lineage of intent and reality**

## The coherent storyline so far

### Era 1 — place.org
This appears to be the first fully-shaped mockup/world-model.

Core intent:
- browser-based desktop OS / personal workspace
- portfolio + productivity tools + ambient system identity
- highly opinionated visual/design language
- local-first storage and personal operating-system feel

Why it matters now:
- it holds the earliest complete product and UX intent
- it likely contains the emotional/interaction model the later systems kept chasing under different names

Current drift:
- repo itself is not visible on this VM
- intent survives mostly in project notes, research notes, and a major session log

### Era 2 — EMA (Elixir/Phoenix)
This is where the ambition became explicit as a control plane / executive OS / orchestration runtime.

Core intent:
- unify sessions, tasks, proposals, executions, vault, surfaces, and agents
- make runtime truth explicit
- separate semantic truth from execution/runtime truth
- support durable orchestration rather than one-off chatbot flows

Why it matters now:
- the strongest architecture language and control-plane concepts are here
- the existing daemon code already contains useful provider/session/peer/discovery ideas

Current drift:
- docs and repo are partially honest, partially aspirational
- some docs say Elixir daemon is canonical
- another reconciled doc says active host implementation later moved to TS-first services/electron
- this VM still only shows the older daemon-first repo snapshot

### Era 3 — TypeScript rewrite / ClaudeForge / TS-first detour
Per the user, this was a strategic misstep, but not wasted work.

Core recovered intent:
- richer operator surfaces
- Discord + web + terminal mirror of one underlying session space
- explicit provider/session abstraction
- more productized UX
- stronger surface routing ideas

Why it matters now:
- even if the stack choice was wrong, the session/surface model and UX intent are still valuable
- this era likely contains a lot of practical operator affordances that the earlier EMA architecture lacked

Current drift:
- there may be more than one TS-era artifact:
  - visible ClaudeForge repo on VM
  - host-reconciled doc describing a later TS-first EMA runtime not visible here
- intent is split across code, session logs, and host-only references

### Era 4 — current direction: p2p-first BEAM-family rebuild
This is the new strategic correction the user just stated directly.

Core intent:
- eliminate drift
- reconstruct agent organizational state cleanly
- prepare a working space on agent-vm to sync with an EMA client later
- reimplement from scratch to be p2p-first and actually reliable
- use Gleam / BEAM / Erlang / Elixir as the base instead of forcing everything into TypeScript

Why it matters now:
- this is the present-tense target architecture direction
- collection work should be organized around feeding this rebuild, not around preserving every old stack equally

---

## What is drifting right now

### 1. Runtime reality vs doc reality
Observed mismatch:
- VM-visible repo says Elixir/Phoenix EMA daemon is canonical
- host-reconciled doc claims a newer TS-first EMA runtime became active

Interpretation:
- we cannot treat either claim as globally true without host verification
- for collection, we should preserve both as **separate historical layers**

### 2. Repo truth vs session-truth vs vault-truth
Examples:
- place.org repo missing, but rich intent survives in notes/session logs
- ClaudeForge code exists, but its role in the broader system story is mostly explained in notes/sessions and the user's current framing
- EMA specs contain both concrete architecture and speculative future layers

Interpretation:
- code alone will not recover the whole story
- notes alone will over-idealize the story
- both must be indexed together

### 3. Product identity drift
The same core ambition has been expressed as:
- browser OS / workspace
- executive OS / personal operating system
- orchestration control plane
- Discord remote coding environment
- p2p organization mesh

Interpretation:
- these are not separate projects so much as different partial manifestations of one evolving system
- the collection workspace should capture that as a **lineage**, not a bag of unrelated repos

### 4. Surface drift
Surfaces changed repeatedly:
- place.org desktop/browser UI
- EMA daemon/API/CLI/Tauri-like concepts
- OpenClaw gateway/control-ui/runtime fabric
- ClaudeForge Discord + web UI
- Hermes Discord/gateway/API model

Interpretation:
- the future system should treat surfaces as replaceable bindings over one underlying runtime truth model

---

## Reality-grounded conclusions

1. **The first job is collection, not implementation.**
   The user is right. There is too much story drift to scaffold the new system responsibly yet.

2. **The collection workspace belongs on the agent VM now.**
   Created at:
   - `/home/trajan/workspaces/ema-context-sync`

3. **We should organize by eras, not just by repos.**
   Repos are incomplete proxies for the actual story.

4. **The TS era should be preserved as intent, not treated as trash.**
   The user explicitly said it contains good ideas despite being the wrong stack decision.

5. **The new p2p/BEAM direction should become the filter for collection.**
   We are not collecting everything forever; we are collecting what matters for the rebuild.

---

## Working collection structure proposed

Under `/home/trajan/workspaces/ema-context-sync/`:

- `indexes/`
  - master inventories, drift audits, source maps
- `notes/`
  - per-era summaries and extracted intent
- `exports/`
  - copied snippets, git logs, structured extracts, session extracts

Recommended era files to create next:
- `notes/01-place-org-era.md`
- `notes/02-ema-elixir-era.md`
- `notes/03-typescript-rewrite-era.md`
- `notes/04-current-p2p-beam-direction.md`

---

## Next evidence to collect

### place.org
- project note
- build session log
- research bundle
- locate host-side git repo if possible later

### EMA Elixir era
- README + master spec + full context
- provider/session/discovery/peer code
- git history emphasizing control-plane/p2p/provider/session commits

### TS rewrite era
- ClaudeForge spec + CLAUDE.md
- supporting session summaries in vault
- any host notes describing the TS-first EMA attempt

### current direction
- the user's explicit statements in this thread
- P2P mesh notes already in vault
- future Gleam/BEAM repo once created or located

---

## Current state of the collection effort

Complete:
- boundary verified: current machine is `agent-vm`
- collection workspace created
- initial reference inventory written
- initial drift audit written
- major visible roots identified

Not complete:
- per-era intent extraction docs
- git-history extraction per era
- host-only artifact reconciliation
- place.org repo recovery
- newer TS EMA runtime recovery (if it exists outside the VM-visible repo)
