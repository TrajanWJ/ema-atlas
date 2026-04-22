---
title: "Restore the lost intent→execution cascade"
intent_level: 1
intent_kind: goal
intent_status: planned
intent_priority: 3
project: ema
tags: ["goal", "auto-projected"]
---
# Restore the lost intent→execution cascade
Intent tree exists (53 intents) but is fragmented. No parent_id cascade from vision→goals→tasks→executions. Wire all goals to root vision intents. Wire all tasks to goals. Wire proposals to intents via intent_links. Make the intent graph queryable via ema intent tree --project ema. Add Intent Graph navigation API + CLI + HQ visualization. Timeframe: next month (May 2026).
