# EMA state demo

## live read
Pulled from the host EMA CLI wrapper/escalation path.

## current state
- status: degraded compat mode
- active projects: 0
- pending tasks: 0
- open proposals: 2
- running agents: 2

## interpretation
This is a partially alive EMA surface.

What is working:
- basic compatibility endpoints
- proposals/task/executions/project reads

What is not cleanly working:
- `/api/status`
- `/api/control-plane`
- likely some richer surfaces endpoints

## why this is a good demo for toomanytools
This proves the new agent can:
1. inspect live EMA state
2. turn it into structured artifacts
3. convert runtime truth into visuals and summaries
4. keep building higher-fidelity monitoring outputs from imperfect control-plane data

## next honing moves
- add trend snapshots over time
- chart EMA counts historically
- render status cards automatically
- create Mermaid/graph views of EMA surface health
- compare wrapper claims vs host-truth more aggressively
