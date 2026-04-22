---
title: "crontab-backup"
created: 2026-03-16
updated: 2026-03-18
type: operations
status: active
confidence: 0.40
confidence_updated: 2026-03-18
source: auto-capture
tags: [obsidian, openclaw, ops, prompts, research, skills]
summary: "0 */2 * * * /home/trajan/bin/message-harvester.sh >> /tmp/message-harvester.log 2>&1"
---
# Self-Learning System (2026-03-16)
*/10 * * * * /home/trajan/bin/auto-resume.sh >> /var/log/auto-resume.log 2>&1
*/2 * * * * /home/trajan/bin/gateway-watchdog.sh >> /var/log/gateway-watchdog.log 2>&1
*/20 * * * * /home/trajan/bin/session-health.sh >> /home/trajan/.openclaw/logs/session-health.log 2>&1
*/30 * * * * cd /home/trajan && flock -n /tmp/qmd.lock timeout 300 bash -c "/usr/bin/qmd update && /usr/bin/qmd embed" 2>&1 | tail -5 >> /tmp/qmd-cron.log
*/5 * * * * /home/trajan/bin/system-watchdog.sh >> /tmp/watchdog.log 2>&1
0 */2 * * * /home/trajan/bin/message-harvester.sh >> /tmp/message-harvester.log 2>&1
0 */2 * * * /home/trajan/scripts/vault-autocommit.sh >> /home/trajan/logs/vault-autocommit.log 2>&1
0 */3 * * * bash /home/trajan/bin/auto-knowledge-gated.sh
0 */3 * * * python3 /home/trajan/skills/obsidian-ontology-sync/scripts/sync.py --config /home/trajan/skills/obsidian-ontology-sync/config.yaml extract >> /tmp/ontology-sync.log 2>&1
0 12 * * * bash /home/trajan/bin/overnight-digest.sh >> /tmp/overnight-digest.log 2>&1  # 7 AM EST daily
0 14 * * * bash /home/trajan/bin/morning-briefing.sh 2>&1 | head -200 >> /tmp/morning-briefing.log  # 9 AM EST daily
0 3 * * 0 /home/trajan/bin/weekly-synthesis.sh >> /tmp/weekly-synthesis.log 2>&1
0 4 * * * /home/trajan/scripts/session-janitor.sh >> /home/trajan/logs/session-janitor.log 2>&1
0 4 * * 1 /home/trajan/bin/prompt-archaeologist.sh >> /tmp/prompt-archaeologist.log 2>&1
0 9 * * * bash /home/trajan/bin/vault-janitor.sh >> /tmp/vault-janitor.log 2>&1  # 4 AM EST daily
15 */2 * * * /home/trajan/bin/correction-tracker.sh >> /tmp/correction-tracker.log 2>&1
30 */4 * * * /home/trajan/bin/reddit-intel.sh >> /tmp/reddit-intel.log 2>&1  # Reddit research feed every 4h
30 */6 * * * bash /home/trajan/skills/evolution-loop/scripts/run-loop.sh >> /tmp/evolution-loop.log 2>&1  # Evolution loop every 6h
@reboot sleep 30 && /home/trajan/bin/cron-restore.sh >> /tmp/cron-restore.log 2>&1
*/10 * * * * /home/trajan/bin/session-guardian.sh

## Related
- [[Memory Architecture]]
- [[System Overview]]
