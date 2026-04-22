# EMA status note

Current state on `agent-vm`:
- EMA is inoperable right now.
- The EMA daemon is not responding at `localhost:4488`.

Operational rule until recovered:
- do not assume live EMA control-plane availability
- treat EMA-backed actions as blocked unless the daemon is explicitly verified reachable
- use recovered files / Discord / Hermes runtime state carefully, but do not claim EMA live state is authoritative until this is fixed
