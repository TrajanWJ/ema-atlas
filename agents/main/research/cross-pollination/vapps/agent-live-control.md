# Agent Live / Control Surfaces — Cross-Pollination Seed

## Why this area matters
This includes Agent Live View, Agent Hub, Agent Plans/Status, Agent Scratchpads, Agent Comms, and Terminal.

## Relevant source seeds

### Overstory
- Core reference for orchestration/delegation topology.
- Potential imports:
  - supervisor model
  - runtime adapters
  - multi-agent control patterns

### OpenASE
- Core reference for delegated execution on real machines with traceability.
- Potential imports:
  - execution control plane patterns
  - traceability UX
  - human oversight over delegated machine work

### sshx
- Primitive for live shared session visibility.
- Potential imports:
  - operator sees what agent sees
  - collaborative intervention

### claude-view
- Operator visibility / mission-control reference.
- Potential imports:
  - subagent trees
  - approvals-needed
  - session health overview

### wish / ttyd / OxideTerm
- Host/operator remote surface references.
- Potential imports:
  - SSH-native UI surfaces
  - terminal-over-web mirrors
  - reconnect/resume patterns

## Questions to pursue
- Which live-control primitives belong as vApps vs shell-level overlays?
- How should terminal mirroring, replay, and intervention be unified?
