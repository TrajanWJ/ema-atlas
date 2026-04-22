---
title: "OpenClaw Agent Performance"
type: reference
created: 2026-04-06
tags: [openclaw, archived, agents, performance, metrics, lessons]
summary: "Agent fitness scores, failure modes, dispatch heuristics, and cross-agent lessons from OpenClaw operations"
---

# OpenClaw Agent Performance

## Fitness Scoring Framework

Formula: `(success_rate x 0.6) + (speed_score x 0.2) + (quality_score x 0.2)`

## Agent Fitness Scores (Final)

| Agent | Success Rate | Fitness | Notes |
|-------|-------------|---------|-------|
| Prompt Engineer | 100% (1/1) | 1.00 | High performer |
| Ops | 100% (1/1) | 0.92 | Trust with complex tasks |
| Researcher | 90% (9/10) | ~0.85 | High performer, trust with complex tasks |
| Coder | 50% (1/2) | ~0.50 | Needs tighter scope |
| Vault Keeper | 33% (1/3) | 0.36 | Below 50% -- needs simpler tasks |

## Failure Mode Tracking

### Vault Keeper
- Max 50 files per task (consistently fails with larger scopes)
- Needs tighter, simpler task definitions
- 4 later proactive tasks all succeeded after scope reduction

### Researcher
- Needs 8+ minute timeouts for complex research
- 90% success rate but some vault-improve and vault-poll batch tasks failed
- Most failures were exit code 0/1 from batch operations

### Coder
- 50% success rate
- One session failed on ema-brain-backend-sessions task (exit 0 but incomplete)
- Later tars-config task succeeded

## Dispatch Heuristics

| Task Type | Best Agent | Timeout | Notes |
|-----------|-----------|---------|-------|
| Deep research | Researcher | 8+ min | High success rate |
| Quick coding | Coder | 5 min | Tighter scope helps |
| Vault operations | Vault Keeper | 3 min | Max 50 files |
| Prompt work | Prompt Engineer | 5 min | Perfect record |
| Infrastructure | Ops | 5 min | Reliable |

## Cross-Agent Lessons

### From Daily Operations (March 14 - April 5)

1. **Auto-resume is critical** -- restart on March 16 lost 5 spawned agents' work. Added CONTINUE.md protocol.
2. **Engine starvation is a pattern** -- harvesters create seeds without schedules, proposal engine stalls. Must watch for this.
3. **Gateway restart storms** -- 40+ restarts in one incident (March 17). Root causes: wrong model IDs, duplicate crons.
4. **Autonomous overnight work architecturally impossible** without session persistence layer.
5. **Budget unlocking** -- discovering two OAuth accounts = 2x capacity was a game changer (March 16).
6. **Trajan gets frustrated by repeated asks** -- pick up context quickly, don't re-ask what's in the files.
7. **neo4j-genome has broken config** -- crashes in loop, fixed by stopping it.
8. **SeedController clobbers fields** -- nil schedule values overwrite good data.
9. **Stream.Manager drift** -- references 8+ modules that don't exist, optional_apply/4 shim keeps alive but produces dishonest telemetry.
10. **Host repo dirt** -- 17 dirty entries on main, use worktrees for isolated patches.

### Performance History (March 16 Tasks)

6 historical tasks documented with specific lessons:
- Research tasks generally succeeded with clear deliverables
- Agent dispatch worked best with well-defined scope
- Multi-agent parallel dispatch effective for independent tasks
- Monitoring at 3/5/10 minute intervals prevented zombie tasks

## Accessing Raw Session Data

Per-agent session files contain the full interaction history that generated these performance metrics:

```bash
# Browse agent sessions by size (largest = most active)
du -sh /home/trajan/archive/openclaw/config/.openclaw/agents/*/sessions/ | sort -rh

# Read a specific agent's sessions
ls /home/trajan/archive/openclaw/config/.openclaw/agents/researcher/sessions/*.jsonl

# Extract messages from a session
cat session.jsonl | python3 -c "import json,sys; [print(json.loads(l).get('message',{}).get('content','')[:200]) for l in sys.stdin if '\"type\":\"message\"' in l]"
```

See [[OpenClaw Session Archive]] for full access guide.

## Related

- [[OpenClaw System Overview]]
- [[OpenClaw Protocols]]
- [[OpenClaw Daily Operations Log]]
- [[OpenClaw Session Archive]]
