#!/bin/bash
# Cron recreation script — run after gateway restart if crons disappear
# Last updated: 2026-03-16

# vault-feed: posts new vault activity to #vault-feed every 30min
openclaw cron add \
  --name vault-feed \
  --schedule "every 30m" \
  --agent main \
  --to "discord:channel:1483018390015709315" \
  --prompt "Check for new or updated vault files in the last 30 minutes. Post a brief summary of changes to this channel. If nothing changed, reply HEARTBEAT_OK." \
  --timeout-seconds 120

# github-interesting: discovers repos aligned with interests every 30min
openclaw cron add \
  --name github-interesting \
  --schedule "every 30m" \
  --agent main \
  --model anthropic/claude-sonnet-4-20250514 \
  --to "discord:channel:1482258431997116531" \
  --prompt "Search GitHub trending and discover repos related to: prompt engineering, agent system prompts, meta-prompting, QA automation, AI prompts, agent architecture, OpenClaw skills. Post one interesting find with a brief analysis. If usage pace > 1.5x, reply HEARTBEAT_OK instead." \
  --timeout-seconds 300

# transcript-scanner: scans transcripts every 6h
openclaw cron add \
  --name transcript-scanner \
  --schedule "every 6h" \
  --agent main \
  --prompt "Run ~/skills/auto-knowledge/scripts/capture.sh and review the output. If there are daily notes with topics not in vault, create a vault note for the most important one. Keep it lightweight." \
  --timeout-seconds 300

# morning-briefing: daily at 9AM EST (14:00 UTC)
openclaw cron add \
  --name morning-briefing \
  --schedule "cron 0 14 * * *" \
  --agent main \
  --to "discord:channel:1482955597765935258" \
  --prompt "Generate morning briefing: system health, overnight activity, pending tasks, usage stats. Post to worklog channel." \
  --timeout-seconds 300

echo "All crons recreated."
