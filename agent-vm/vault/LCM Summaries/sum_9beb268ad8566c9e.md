# LCM Summary sum_9beb268ad8566c9e

Created: 2026-03-19 04:53:55
Kind: leaf
Depth: 0
Conversation: 4
Tokens: 1215
Descendants: 0
Earliest: 2026-03-19T04:30:07.000Z
Latest: 2026-03-19T04:48:51.000Z

## Content

[2026-03-19 04:30 UTC]
19634 /home/trajan/.openclaw/agents/main/workspace/agent-cards.json
{
  "version": "1.1.0",
  "updated_at": "2026-03-18T06:21:00Z",
  "description": "Agent capability cards for the Auto Delegator. Queryable roster for routing decisions.",
  "agents": [
    {
      "id": "prompt-engineer",
      "name": "🎯 Prompt Engineer",
      "capabilities": [
        "soul-editing",
        "agents-editing",
        "prompt-optimization",
        "metaprompting",
        "personality-tuning",
        "context-evolution",
        "skill-evolution"
      ],
      "skills": [
        "soulcraft",
        "context-evolution",
        "prompt-compiler",
        "agent-tester",
        "self-improving-agent",
        "personality-dynamics",
        "feedback-loop",
        "skill-self-evolution-enhancer"
      ],
      "avg_runtime_sec": 110,
      "default_timeout_sec": 180,
      "success_rate": 1.0,
      "fitness": 1.0,
      "cost_tier": "low",
      "tasks_completed": 1,
      "tasks_total": 1,
      "failure_modes": [],
      "best_for": [
        "SOUL/AGENTS edits",
        "prompt patterns",
        "personality tuning"
      ],

[2026-03-19 04:30 UTC]


[2026-03-19 04:30 UTC]
# === OpenClaw Cron Configuration (cleaned 2026-03-19) ===
# Canonical source: ~/config/crons.conf
# Restored at boot by cron-restore.sh. Edit HERE, not crontab directly.
# Previous: 40 crons. Now: 25.

# === Core System Health ===
*/2 * * * * /home/trajan/bin/gateway-watchdog.sh >> /var/log/gateway-watchdog.log 2>&1
*/2 * * * * /home/trajan/bin/session-watchdog.sh
*/5 * * * * /home/trajan/bin/system-watchdog.sh >> /tmp/watchdog.log 2>&1

# === Session Resilience ===
# auto-resume checks for CONTINUE.md and triggers resume after gateway restarts
# (session-guardian REMOVED — redundant with session-watchdog + auto-resume)
*/10 * * * * /home/trajan/bin/auto-resume.sh >> /var/log/auto-resume.log 2>&1
*/20 * * * * /home/trajan/bin/session-health.sh >> /home/trajan/.openclaw/logs/session-health.log 2>&1

# === Memory & Knowledge ===
*/30 * * * * /home/trajan/bin/memory-pressure.sh --quiet >> /tmp/memory-pressure.log 2>&1
*/30 * * * * cd /home/trajan && flock -n /tmp/qmd.lock timeout 300 bash -c "/usr/bin/qmd update && /usr/bin/qmd embed" 2>&1 | tail -5 >> /tmp/qmd-cron.log
0 */2 * * * /home/trajan/scripts/vault-autocommit.sh >> /home/trajan/logs/vault-autocommit.log 2>&1
0 */3 * * * bash /home/trajan/bin/auto-knowledge-gated.sh
0 */3 * * * flock -n /tmp/ontology-sync.lock python3 /home/trajan/skills/obsidian-ontology-sync/scripts/sync.py --config /home/trajan/skills/obsidian-ontology-sync/config.yaml extract >> /tmp/ontology-sync.log 2>&1
15 */2 * * * /home/trajan/bin/correction-tracker.sh >> /tmp/correction-tracker.log 2>&1

# === Research & Intel ===
30 */4 * * * /home/trajan/bin/reddit-intel.sh >> /tmp/reddit-intel.log 2>&1
0 */6 * * * /home/trajan/bin/research-implement-pipeline.sh >> /home/trajan/.openclaw/logs/research-pipeline.log 2>&1
30 */6 * * * bash /home/trajan/skills/evolution-loop/scripts/run-loop.sh --all >> /tmp/evolution-loop.log 2>&1
30 */6 * * * flock -n /tmp/pattern-detector.lock python3 /home/trajan/skills/auto-knowledge/scripts/pattern-detector.py >> /tmp/pattern-detector.log 2>&1

# === Daily ===
0 4 * * * /home/trajan/bin/memory-promote.sh --dry-run >> /tmp/memory-promote.log 2>&1
0 4 * * * /home/trajan/bin/vault-frontmatter-enforce.sh >> /tmp/vault-frontmatter.log 2>&1
0 4 * * * /home/trajan/scripts/session-janitor.sh >> /home/trajan/logs/session-janitor.log 2>&1
0 9 * * * bash /home/trajan/bin/vault-janitor.sh >> /tmp/vault-janitor.log 2>&1
0 12 * * * bash /home/trajan/bin/overnight-digest.sh >> /tmp/overnight-digest.log 2>&1
0 14 * * * bash /home/trajan/bin/morning-briefing-v2.sh 2>&1 | head -200 >> /tmp/morning-briefing.log

# === Weekly ===
0 3 * * 0 /home/trajan/bin/weekly-synthesis.sh >> /tmp/weekly-synthesis.log 2>&1
0 3 * * 5 /home/trajan/bin/vault-backlink.sh >> /tmp/vault-backlink.log 2>&1
0 5 * * 1 /home/trajan/bin/vault-staleness-scan.sh >> /tmp/vault-staleness.log 2>&1
0 6 * * 1 /home/trajan/bin/vault-quality-score.sh >> /tmp/vault-quality.log 2>&1

# === Backup & Boot ===
0 */6 * * * crontab -l > /home/trajan/vault/System/cron-backup.txt
@reboot sleep 30 && /home/trajan/bin/cron-restore.sh >> /tmp/cron-restore.log 2>&1

[2026-03-19 04:30 UTC]
Now I have the full picture. Let me do the pruning directly and spawn coders for the two build tasks.

[2026-03-19 04:30 UTC]
Successfully wrote 4539 bytes to /home/trajan/.openclaw/agents/main/workspace/agent-cards.json

[2026-03-19 04:30 UTC]


[2026-03-19 04:30 UTC]
Mailbox removed
Removed dispatch/warmup-cache
Removed dispatch/token-efficiency
Removed dispatch/model-routing
Removed dispatch/costs
Removed dispatch/archived-pipelines
Removed dispatch
[LCM fallback summary; truncated for context management]
