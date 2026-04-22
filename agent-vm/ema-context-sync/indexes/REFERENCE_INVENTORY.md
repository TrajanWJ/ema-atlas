# Reference Inventory — EMA / place.org / OpenClaw / ClaudeForge

Generated on agent-vm from VM-visible files.

## Boundary statement

This inventory is grounded in what is visible on **agent-vm** (`/home/trajan`).

That matters because:
- some docs describe **host-machine** state that is not fully visible here
- the original `place.org` repo appears to be **missing from this VM**
- the visible EMA repo still shows the **Elixir/Phoenix daemon-first** structure
- a reconciled EMA decision doc claims a later **TS-first host runtime**, but the corresponding code is not visible in the VM snapshot inspected so far

## High-confidence reference roots

### 1. EMA repo
- Path: `/home/trajan/Projects/ema`
- Git: yes
- Branch: `codex/surface-governor-refactor`
- Recent commits:
  - `e47ca6a feat: bootstrap EMA intents, context packages, and CLI jumpstarter`
  - `1e32801 Harden incident authority for generic execution events`
  - `238e38d Extend execution events across runtime paths`
  - `50b2d1c Repair control plane store and validate recovery tests`
  - `0608fa4 feat: Ema.Config control plane — registry, scanner, collision detector, snapshot`
- Role: primary orchestration/control-plane repo visible on VM

Important subroots:
- `/home/trajan/Projects/ema/daemon` — Elixir/Phoenix daemon
- `/home/trajan/Projects/ema/cli` — EMA CLI harness
- `/home/trajan/Projects/ema/wiki-engine`
- `/home/trajan/Projects/ema/docs`
- `/home/trajan/Projects/ema/claudeforge`

### 2. ClaudeForge / TypeScript remote-agent rewrite
- Path: `/home/trajan/Desktop/Coding/Projects/claude-remote-discord`
- Git: yes
- Branch: `master`
- Recent commit:
  - `86ba746 initial: spec, claude.md, mockup, env`
- Role: TS/Discord/web-based remote agent system; likely one of the major rewrite/experimentation branches of intent

Related embedded copy:
- `/home/trajan/Projects/ema/claudeforge`

### 3. EMA-v1.1 design artifact bundle
- Path: `/home/trajan/Desktop/EMA-v1.1`
- Git: no
- Role: design/rendered artifact pack; likely useful for intent extraction and UI/system-map recovery

Key visible contents:
- `Track-F-UI-Representations/diagrams/*.mmd`
- `Track-F-UI-Representations/rendered/*.png`

### 4. OpenClaw archive
- Path: `/home/trajan/archive/openclaw`
- Git: no (at archive root)
- Role: archived reference material and legacy runtime/config ecosystem

Important visible subroots:
- `/home/trajan/archive/openclaw/control-ui/openclaw-control-ui-source`
- `/home/trajan/archive/openclaw/mcp-server/openclaw-mcp-server`
- `/home/trajan/archive/openclaw/skills/openclaw-claude-code-skill`
- `/home/trajan/archive/openclaw/skills/openclaw-guardian-ultra`

### 5. OpenClaw local config/runtime residue
- Path: `/home/trajan/.openclaw`
- Role: runtime/config residue, extension inventory, useful for recovering actual historical usage patterns

### 6. Vault / wiki / staging mirrors
These are not source repos, but they are core context stores.

Main roots:
- `/home/trajan/vault`
- `/home/trajan/wiki`
- `/home/trajan/staging/host-vault`

Why they matter:
- they contain project notes, session logs, architecture notes, and imported host-vault mirrors
- they capture intent that may never have been committed cleanly into code

---

## place.org context roots

### VM-visible docs
- `/home/trajan/vault/Projects/place.org.md`
- `/home/trajan/wiki/spaces/default/projects/place.org.md`
- `/home/trajan/wiki/spaces/default/system/architecture/place-org-openclaw-fork-architecture.md`
- `/home/trajan/staging/host-vault/Session Log/2026-03-20 - place.org v0.1 through v0.5 Build Session.md`
- related research under:
  - `/home/trajan/vault/Research/AI-Knowledge/`
  - `/home/trajan/wiki/spaces/default/research/AI-Knowledge/`
  - `/home/trajan/staging/host-vault/AI Knowledge/`

### Missing from this VM
- `/home/trajan/Desktop/place.org` → **not present** on this VM

Implication:
- the original place.org repo likely exists on the **host machine** or another path not visible here
- for now, we can recover place.org intent from vault/wiki/session artifacts, but not from live repo history on this VM

---

## EMA context roots

### Core docs
- `/home/trajan/Projects/ema/README.md`
- `/home/trajan/Projects/ema/docs/EMA-FULL-CONTEXT.md`
- `/home/trajan/Projects/ema/docs/EMA-MASTER-SPEC.md`
- `/home/trajan/Projects/ema/docs/OPENCLAW-EMA-DECISIONS-2026-04-13-HOST-RECONCILED.md`
- `/home/trajan/Projects/ema/docs/AGENT-CONTRACT.md`

### Code areas with high context density
- `/home/trajan/Projects/ema/daemon/lib/ema/claude/provider_registry.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema/surfaces/discovery.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema/surfaces/peer_registry.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema/surfaces/session_pool.ex`
- `/home/trajan/Projects/ema/daemon/lib/ema/control_plane/`

### High-value vault/wiki EMA notes
- `/home/trajan/wiki/spaces/default/codebases/EMA.md`
- `/home/trajan/vault/Architecture/EMA P2P Organization Mesh.md`
- `/home/trajan/vault/Research/ema-systems-research-2026-04-04.md`
- `/home/trajan/vault/Claude-Code-Memory/project_ema_surfaces_architecture.md`

---

## ClaudeForge / TS rewrite context roots

### Repo docs
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord/CLAUDE.md`
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord/SPEC.md`

### Code roots
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord/packages/shared`
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord/packages/server`
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord/packages/bot`
- `/home/trajan/Desktop/Coding/Projects/claude-remote-discord/packages/web`

### Vault/wiki support context
- `/home/trajan/wiki/spaces/default/codebases/ClaudeForge.md`
- `/home/trajan/shared/inbox-host/course-claude-remote-discord/briefs/01-what-is-claudeforge.md`
- `/home/trajan/shared/inbox-host/claudeforge-mockup.html`

### Session history traces
- `/home/trajan/vault/Claude-Code-Sessions/application-projects.md`
- `/home/trajan/vault/Claude-Code-Sessions/core-home.md`

---

## User-story timeline currently reconstructed

From current user instruction + VM-visible docs:

1. **place.org first**
   - initial mockup / browser-OS / workspace / portfolio-productivity hybrid
   - major design and implementation burst captured in session logs and project notes

2. **EMA second (Elixir-based)**
   - moved into a more serious orchestration/control-plane architecture
   - strong daemon/control-plane/provider/session ideas emerged here

3. **TypeScript rewrite / detour**
   - likely represented by ClaudeForge and related host-reconciled TS runtime docs
   - user now considers this a bad decision overall, but says it contains a lot of useful intent and ideas that must be preserved

4. **current direction**
   - reimplement with a **p2p-first**, actually-reliable architecture
   - base stack preference now favors **Gleam / BEAM / Erlang / Elixir**

---

## Immediate collection gaps

1. **Original place.org repo history is not visible on this VM**
2. **Host-side newer TS EMA runtime code is not visible in the VM repo snapshot**
3. **OpenClaw archive needs a narrower inventory** to separate signal from huge dependency/vendor trees
4. **Need a per-era intent extraction doc**:
   - place.org era
   - EMA Elixir era
   - TS rewrite / ClaudeForge era
   - current p2p/BEAM era

---

## Recommended next collection passes

1. Extract intent from:
   - place.org session log + project note + research notes
2. Extract intent from:
   - EMA master spec + full context + p2p mesh note + git history
3. Extract intent from:
   - ClaudeForge spec + codebase note + session history
4. If host access becomes available, locate:
   - original `place.org` git repo
   - newer TS-first EMA host runtime repo mentioned in reconciled docs
