# Readiness Checklist — Live Intent Bootstrap via MCP

## Docs/contracts
- [ ] `CANONICAL_ARCHITECTURE.md` exists
- [ ] `INTENT_SCHEMA.md` exists
- [ ] `CONTEXT_PACKAGE_SPEC.md` exists
- [ ] vault deprecation note exists
- [ ] OpenClaw parity note exists

## Wiki
- [ ] `projects/EMA` page exists
- [ ] `projects/Host CLI Integration` page exists
- [ ] `architecture/Canonical Architecture` page exists
- [ ] `architecture/Session Model` page exists
- [ ] `architecture/Context Contract` page exists
- [ ] wiki write conventions exist

## EMA runtime
- [ ] minimal intent storage exists
- [ ] project-state storage exists
- [ ] intent ↔ wiki refs supported
- [ ] intent ↔ execution/session refs supported
- [ ] canonical session registry path chosen

## MCP/API
- [ ] `intent.bootstrap_project`
- [ ] `intent.get_project`
- [ ] `intent.list`
- [ ] `intent.update`
- [ ] `intent.snapshot`
- [ ] `intent.propose_next_actions`
- [ ] `context.project_package`
- [ ] `context.operator_package`
- [ ] `context.session_evidence`
- [ ] `wiki.project_state_sync`
- [ ] `wiki.link_intent`

## Client alignment
- [ ] one MCP baseline manifest exists
- [ ] Claude config generated from baseline
- [ ] Codex config generated from baseline
- [ ] OpenClaw capability parity map documented
- [ ] Codex parity plan exists for session handling

## Bootstrap data
- [ ] root EMA intents seeded
- [ ] initial project-state record seeded
- [ ] current blockers populated
- [ ] current next actions populated

## Success checks
- [ ] Claude can recover same project state as OpenClaw
- [ ] Codex can recover same project state as Claude
- [ ] updating intent through MCP updates canonical state
- [ ] wiki durable summary can be refreshed from live state
- [ ] vault is no longer required for active continuation
