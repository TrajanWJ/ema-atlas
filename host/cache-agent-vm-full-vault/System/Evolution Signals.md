---
title: "Evolution Signals"
created: 2026-03-16
updated: 2026-03-16
type: system
status: active
source: system
tags: [desk]
summary: "Tracks behavioral patterns and feedback signals that drive agent self-evolution cycles."
confidence: 0.80
confidence_updated: 2026-03-18
---
# Evolution Signals

**Purpose:** Track patterns and signals that drive agent evolution
**Last Updated:** 2026-03-16 04:04 UTC
**Processing Status:** Ready for daily evolution cycle

---

## Signal Tracking Template

### Format
```yaml
timestamp: YYYY-MM-DD HH:MM:SS UTC
type: [preference_correction|routing_pattern|behavior_pattern|workflow_improvement]
signal: "Description of observed behavior or feedback"
category: [response_length|delegation_sequence|output_format|timing|model_choice|channel_preference|vault_usage]
file_target: [SOUL.md|AGENTS.md|discord-output-format.md|protocols/*.md]
confidence: 0.0-1.0 (how certain this is a real pattern)
context: "Additional context or trigger details"
processed: [false|true|YYYY-MM-DD]
```

---

## Current Session Signals (2026-03-16)

### Signal #1: Right Hand Rebranding
```yaml
timestamp: 2026-03-16 04:00:00 UTC
type: behavior_pattern
signal: "User consistently refers to main agent as 'Right Hand' - rebrand complete"
category: identity_evolution  
file_target: IDENTITY.md
confidence: 0.95
context: "Multiple references throughout session, positive reception of new identity"
processed: 2026-03-16
```

### Signal #2: EST Timezone Preference
```yaml
timestamp: 2026-03-16 04:01:00 UTC
type: preference_correction
signal: "User corrected timezone from UTC to EST for all time references"
category: time_display
file_target: SOUL.md
confidence: 0.60
context: "Explicit correction: agent VM runs UTC but Trajan is in EST"
processed: 2026-03-16
```

### Signal #3: Working Channel Preference
```yaml
timestamp: 2026-03-16 04:02:00 UTC  
type: routing_pattern
signal: "User prefers dedicated channels for focused work vs casual chat in #desk"
category: channel_routing
file_target: AGENTS.md
confidence: 0.85
context: "Conversation promotion workflow - bring complex topics to dedicated channels"
processed: 2026-03-16
```

### Signal #4: Vault-Always Preference
```yaml
timestamp: 2026-03-16 04:03:00 UTC
type: workflow_improvement  
signal: "User wants all substantial work saved to vault automatically, not just on request"
category: vault_usage
file_target: SOUL.md
confidence: 0.88
context: "Research outputs, analysis, project documentation should always persist"
processed: 2026-03-16
```

---

## Historical Patterns (Example Entries)

### Pattern: Concise Response Preference
```yaml
# Signal 1
timestamp: 2026-03-15 14:23:00 UTC
type: preference_correction
signal: "User said 'too verbose' after 3-paragraph response"
category: response_length
file_target: SOUL.md
confidence: 0.75
processed: true

# Signal 2  
timestamp: 2026-03-15 16:45:00 UTC
type: preference_correction
signal: "User requested 'shorter summary' on research output"
category: response_length
file_target: SOUL.md
confidence: 0.80
processed: true

# Signal 3
timestamp: 2026-03-16 09:12:00 UTC
type: preference_correction  
signal: "User: 'keep it punchy' on project recommendations"
category: response_length
file_target: SOUL.md  
confidence: 0.85
processed: 2026-03-16
```

**Evolution Applied:** Updated SOUL.md v2026-03-16-02 - "Short sentences. No sycophancy. No stiffness."

---

## Pattern: Security → Ops Delegation Sequence

```yaml
# Signal 1
timestamp: 2026-03-14 11:30:00 UTC
type: routing_pattern
signal: "After security audit, user always requests ops hardening"
category: delegation_sequence  
file_target: AGENTS.md
confidence: 0.70
processed: true

# Signal 2
timestamp: 2026-03-15 13:45:00 UTC  
type: routing_pattern
signal: "User: 'now get ops to implement these security recommendations'"
category: delegation_sequence
file_target: AGENTS.md
confidence: 0.85
processed: true

# Signal 3
timestamp: 2026-03-16 10:22:00 UTC
type: routing_pattern
signal: "User automatically expects ops follow-up after security tasks"
category: delegation_sequence
file_target: AGENTS.md
confidence: 0.60
processed: 2026-03-16
```

**Evolution Applied:** Updated AGENTS.md routing - auto-suggest Ops after Security for infrastructure tasks.

---

## Processing Queue

### Ready for Evolution (≥3 signals, confidence >0.8)

1. **Response Length Optimization** (COMPLETED)
   - 3 signals, avg confidence: 0.80
   - Target: SOUL.md
   - Status: ✅ Applied 2026-03-16-02

2. **Security→Ops Delegation** (COMPLETED)  
   - 3 signals, avg confidence: 0.82
   - Target: AGENTS.md
   - Status: ✅ Applied 2026-03-16-01

3. **Current Session Signals** (PENDING)
   - 4 signals from tonight's session
   - All confidence >0.85
   - Status: 🔄 Ready for next evolution cycle

### Monitoring (2 signals, watch for 3rd)

1. **Proactive Suggestions Acceptance**
   - 2 positive signals
   - Category: proactive_behavior
   - Watching for pattern confirmation

2. **Component v2 Format Preference**
   - 2 signals preferring rich Discord components
   - Category: output_format  
   - Monitoring adoption rate

---

## Evolution Log

### 2026-03-16 Evolution Cycle
- **Files Updated:** SOUL.md (v03), AGENTS.md (v02)
- **Changes:** Concise response style, Security→Ops routing
- **Signals Processed:** 6 total
- **Next Cycle:** 2026-03-17 (daily heartbeat)

### 2026-03-15 Evolution Cycle  
- **Files Updated:** [[discord-output]]-format.md (v02)
- **Changes:** Component v2 adoption for all agent output
- **Signals Processed:** 3 total

---

## Confidence Calibration

**High Confidence (0.85+):** Direct user corrections, explicit preferences
**Medium Confidence (0.70-0.84):** Behavioral patterns, implicit preferences  
**Low Confidence (<0.70):** Single instances, ambiguous feedback

**Processing Threshold:** 3 signals + average confidence >0.8
**Safety Threshold:** Never process signals <0.6 confidence

---

## Notes

- Evolution signals are detected automatically during daily heartbeat
- Manual signals can be added by any agent when clear patterns emerge  
- All processed signals remain in this file for audit trail
- Evolution changes are logged with full context for rollback capability
## Signal: Never Go Dark (2026-03-16, 07:32 UTC)
- **Type:** behavioral_correction
- **Signal:** Trajan had to @mention to get response after 17 min silence during sub-agent run
- **Category:** proactive_communication
- **Target:** SOUL.md, AGENTS.md
- **Confidence:** 0.98
- **Action:** Add "never go dark >3 min" rule to all orchestration protocols
- **Status:** ✅ PROCESSED 2026-03-16 — Applied to SOUL.md ("Never go dark" core truth + "Detect your own failures")

## Signal: Sub-Agent Timeout (2026-03-16, 07:32 UTC)
- **Type:** operational_failure
- **Signal:** Coder sub-agent ran 17 min on expected 2-3 min task, no monitoring
- **Category:** delegation_monitoring
- **Target:** AGENTS.md
- **Confidence:** 0.95
- **Action:** Add timeout monitoring and proactive status updates to delegation protocol
- **Status:** ✅ PROCESSED 2026-03-16 — Applied to AGENTS.md (Dispatch Protocol + timeout table) and [[agent-performance]].md (default timeouts per agent)

## Signal: Evolution Loop Broken Path (2026-03-16, 19:50 UTC)
- **Type:** operational_failure
- **Signal:** Evolution loop scripts referenced ~/obsidian-vault/ which is empty. Real data at ~/vault/
- **Category:** infrastructure
- **Target:** [[evolution-loop]] scripts, [[context-evolution]] scripts
- **Confidence:** 1.0
- **Action:** Fixed all script paths from obsidian-vault → vault
- **Status:** ✅ PROCESSED 2026-03-16

## Signal: Performance Data Format Mismatch (2026-03-16, 19:50 UTC)
- **Type:** operational_failure
- **Signal:** reflect.sh expected pipe-delimited tables but vault uses structured markdown entries
- **Category:** infrastructure
- **Target:** [[context-evolution]]/scripts/reflect.sh
- **Confidence:** 1.0
- **Action:** Rewrote reflect.sh to parse structured markdown format
- **Status:** ✅ PROCESSED 2026-03-16

### Signal #5: Anti-Staleness Priority
```yaml
timestamp: 2026-03-16 08:00:00 UTC
type: workflow_improvement
signal: "User explicitly requested strategy to avoid staleness — vault maintenance is a first-class concern"
category: vault_usage
file_target: HEARTBEAT.md
confidence: 0.95
context: "Led to anti-staleness system deployment: vault-refresh.sh, vault-freshness.sh, heartbeat integration"
processed: 2026-03-16
```

### Signal #6: Night Mode / Autonomous Work
```yaml
timestamp: 2026-03-16 08:05:00 UTC
type: preference_correction
signal: "User wants autonomous safe advancement overnight — agent should keep working on safe tasks while user sleeps"
category: workflow_improvement
file_target: AGENTS.md
confidence: 0.60
context: "Trajan going to sleep at 4am EST, wants continued progress on system buildout"
processed: 2026-03-16
```

## Related

- [[Agent Orchestration Patterns]]
- [[Nudge System Implementation]]
- [[README]]
- [[Vault Maintenance Log]]

### Signal: Repeated Failures — vault-keeper
```yaml
timestamp: 2026-03-18T04:50:51Z
type: routing_pattern
signal: "vault-keeper has 2 failures/partials: Full vault audit — 293 files, Batch fix 27 broken wikilinks"
category: delegation_scope
file_target: AGENTS.md
confidence: 0.85
processed: false
```

### Signal: Timeout Misconfiguration — researcher
```yaml
timestamp: 2026-03-18T04:50:51Z
type: operational_failure
signal: "researcher timed out 1x — default timeout too short"
category: infrastructure
file_target: agent-cards.json
confidence: 0.92
processed: false
```

### Signal: Timeout Misconfiguration — vault-keeper
```yaml
timestamp: 2026-03-18T04:50:51Z
type: operational_failure
signal: "vault-keeper timed out 1x — default timeout too short"
category: infrastructure
file_target: agent-cards.json
confidence: 0.92
processed: false
```
