# Autoresearch Parallel Dispatch Pattern

*Adapted from Karpathy's autoresearch + SkyPilot GPU cluster scaling*
*Installed: 2026-03-19*

---

## Original: Karpathy + SkyPilot (nanoGPT experiments)

**Loop:**
1. Edit `train.py` with a hypothesis
2. `sky launch --detach` (fire-and-forget to cloud cluster)
3. Monitor `val_bpb` (validation bits-per-byte)
4. Commit winners, discard losers
5. Repeat indefinitely

**Key mechanics:**
- **Parallel:** Max N clusters running simultaneously; workdir isolation per experiment
- **Pipeline:** New experiments start on cluster before previous finishes checkpointing
- **Results tracking:** `results.tsv` with `keep / discard / crash` status
- **Scale achieved:** 910 experiments in 8h vs 72h sequential = **9x throughput**

**Emergent behavior (not programmed):**
The agent self-discovered a heterogeneous hardware strategy:
- Screen hypotheses on H100s (fast/cheap)
- Validate promising ones on H200s (expensive)
- This was NOT hardcoded — the agent learned when to escalate

---

## Our Adaptation: Research → Implement Pipeline

### Loop
```
generate hypothesis → check vault cache → if novel: research → if valuable: implement → track results
```

### Scripts
- `~/bin/parallel-dispatch.sh` — bounded parallel task runner (generic)
- `~/bin/autoresearch-loop.sh` — research-specific loop with vault screening
- Queue: `~/dispatch/research-queue.txt` (one topic per line)
- Results: `~/dispatch/autoresearch-results.tsv`

### Parallel Mechanics
- Max 3-4 concurrent research tasks (not CPU-bound, API-rate-bound)
- Workdir isolation: separate `/tmp/research-XXXXX` per task
- Results append-only TSV: `cached / researched / implemented / discarded`

### Cheap → Expensive Split (3 stages)

| Stage | Tool | Cost | When |
|-------|------|------|------|
| Screen | `qmd search "topic"` | Free | Always first |
| Research | `claude --print` subagent | Medium | If vault ≥3 hits → skip |
| Implement | Full coder agent | High | Only if recommendation=implement |

### The NEVER STOP Principle
`autoresearch-loop.sh` loops indefinitely by default. Run as background daemon:
```bash
nohup ~/bin/autoresearch-loop.sh > ~/dispatch/autoresearch.log 2>&1 &
```
Stop with: `kill %1` or `pkill -f autoresearch-loop.sh`

One-shot mode (for cron):
```bash
~/bin/autoresearch-loop.sh ~/dispatch/research-queue.txt 3 --once
```

---

## StackMemory Frame Model Applied

Each research task maps to StackMemory concepts:

| StackMemory | Our system |
|-------------|------------|
| **Frame** | A single research task (scoped work unit) |
| **Anchor** | Decisions/constraints that survive `/clear` (e.g., "never implement X") |
| **Digest** | Task close output: findings + confidence + recommendation |
| **Conductor** | `autoresearch-loop.sh` pulling from queue and spawning agents |
| **Desire path** | Frequently researched topics → auto-elevate to "implement" |

### On Task Close (digest format)
Each research subagent should return:
```
Recommendation: implement | monitor | discard
Confidence: high | medium | low
Key findings: <3-5 bullets>
Sources: <list>
```

---

## Emergent Escalation (Don't Hardcode)

**Key insight from SkyPilot run:** The agent emergently discovered heterogeneous hardware strategy without being told.

**For us:** Don't hardcode cheap/expensive thresholds. Let the research agent decide when to escalate:
- Start: fast Sonnet for screening
- If finding is significant: agent says "implement" → spawn full Opus coder
- Very expensive (full implementation): only on confirmed value

The split should be **learned**, not programmed. Monitor `autoresearch-results.tsv` over time to see which topics the agent escalates.

---

## Operations

### Add topics to research queue
```bash
echo "Model Context Protocol extensions for multi-agent routing" >> ~/dispatch/research-queue.txt
```

### Check results
```bash
cat ~/dispatch/autoresearch-results.tsv | column -t -s $'\t'
```

### View research logs
```bash
ls ~/dispatch/research-logs/
cat ~/dispatch/research-logs/research-20260319-000.log
```

### Integrate with parallel-dispatch.sh (generic tasks)
```bash
cat tasks.txt | ~/bin/parallel-dispatch.sh /dev/stdin 4
```

---

## Related
- [[StackMemory]] — MCP memory runtime (57 tools, frame/call-stack model)
- [[Operations/stackmemory-autoresearch-install-2026-03-19]] — install log
- `~/dispatch/` — runtime artifacts
