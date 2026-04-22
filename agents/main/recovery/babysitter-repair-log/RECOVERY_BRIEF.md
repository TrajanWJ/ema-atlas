# Babysitter Repair Log Recovery Brief

Date: 2026-04-17 UTC  
Channel: `#babysitter-repair-log` (`1489841292627152916`)

## Executive summary

This lane became the incident log for rebuilding Discord self-nudge and continuation after the system drifted into a split-brain between old EMA-era automation and the live OpenClaw runtime. The most important finding is that the current failure is not just a missing cron or missing binding. The live OpenClaw config is still being rewritten into an invalid schema by old EMA-era watchdog automation, especially `/home/trajan/bin/gateway-watchdog.sh`, which runs every 2 minutes from `/home/trajan/config/crons.conf` and applies `EMA doctor --fix` against `/home/trajan/data/agent-state/.env.discord` instead of the live `~/.openclaw/openclaw.json` runtime.

The lane shows repeated cycles of: restore self-nudge cron wiring, prove one alert path, hit config drift again, repair `openclaw.json`, discover session-store drift, recover one missing lane binding, then fail again because invalid `channels.{discord,telegram}.streaming` objects reappear as `{"mode":"partial"}`. This is strong evidence of an external writer/regenerator, not a one-off misedit.

A second major pattern is execution-history drift. The lane records contradictory states like "self-nudge verified" and then "still blocked" within the same night. Those contradictions are explainable: one path was proved once, but the underlying runtime remained unstable, so later scheduled runs regressed. The session store also drifted, with at least `agent:main:discord:channel:1490610977736097792` (`orchestrator-implementation`) disappearing while sibling lane bindings remained.

The repair-log lane then became its own recovery launcher. At 06:15 UTC on 2026-04-17, the operator explicitly asked for full-channel ingest plus five recovery lanes. The crontab now contains five new recovery continuations (`recovery-chronology`, `recovery-config-runtime`, `recovery-session-lineage`, `recovery-lost-threads`, `recovery-rebuild-plan`), which is useful, but it also means the archaeology itself is now layered on top of the same unstable continuation substrate unless the old watchdog loop is neutralized.

## Chronology

### Earlier baseline carried into this lane
- Workspace docs already described babysitter/orchestrator restart as a control-plane problem, not just channel chatter (`babysitter-orchestrator-continuous-progress-plan.md`).
- `DISCORD_LANE_ACTIVATION_TABLE.md` marked `babysitter-repair-log` as a temporary incident lane with self-nudge enabled while the incident is active.
- Automation registry already flagged `cron.gateway-watchdog` as a high-risk canonical mutator touching config.

### 2026-04-14, continuity failure becomes visible
- The lane captured that managed self-nudge crons had fallen out of user crontab, so the wrapper scripts existed but continuous operation did not.
- Work restored session-based self-nudge crons and added `scripts/babysitter_signal_check.sh` to alert `#babysitter-sprint` when lane crons disappear or gateway churn rises.
- A real alert to `#babysitter-sprint` was delivered, proving at least one signal-backed alert path.
- Gateway durability issues also surfaced: the service was running but disabled, Discord socket churn existed, and enable/restart work was partially interrupted.

### 2026-04-15 to 2026-04-16, heartbeat pressure without durable resolution
- Session summaries show repeated heartbeat complaints that lane self-nudge was not truly installed or not end-to-end verified.
- `#babysitter-sprint` later recorded a successful scheduled delivery (`lastHeartbeatText` references message `1494069128246333572`), which explains why some later messages claim verification.
- But the repair lane kept moving because the verified path was not durable across runtime drift.

### 2026-04-17 00:41-00:46 UTC, topology expansion during unstable runtime
- The operator approved creating the `🧠 mah brain` category and six initial brain lanes, then four more brain lanes and two stale-lane cleanup renames.
- First-pass bindings and continuation jobs were added for several brain lanes in `/home/trajan/config/crons.conf`.
- This expanded topology while the control plane was still unstable, increasing the number of lanes depending on the same drifting continuation stack.

### 2026-04-17 00:55-01:55 UTC, failure signature sharpens
- Repeated repair-log posts narrowed the blocker to invalid `~/.openclaw/openclaw.json` values for `channels.telegram.streaming` and `channels.discord.streaming`.
- The invalid shape was repeatedly described as object form (`{"mode":"partial"}`) where current OpenClaw expects a scalar (`"partial"`, `true`, `false`, `off`, `block`, or `progress`).
- `orchestrator-implementation` was identified as missing its session binding while neighboring orchestrator lanes still had bindings.

### 2026-04-17 01:56-02:07 UTC, direct repair exposes external rewriter
- The operator ordered a direct fix.
- Config fields were manually repaired, stale plugin entries corrected, and the missing `orchestrator-implementation` session entry restored.
- Forced continuation still failed because the bad streaming values reappeared before the run completed.
- Live watch attempts with `inotifywait` failed to catch a write during the watch window, but stronger evidence was found: old EMA watchdog scripts actively run `EMA doctor --fix` and point at obsolete EMA-era paths.
- The lane explicitly identifies the split-brain: old EMA watchdog stack uses `~/dispatch/...` and `.env.discord`, while live OpenClaw uses `~/.openclaw/...`.
- The operator was asked to approve disabling `gateway-watchdog.sh` in `/home/trajan/config/crons.conf`, but the cron line is still present in the current file.

### 2026-04-17 02:25-06:10 UTC, noisy oscillation between “verified” and “blocked”
- The lane alternates between saying self-nudge is verified and saying it is still blocked.
- Evidence indicates both statements were locally true at different times:
  - `#babysitter-sprint` session state includes a successful delivered heartbeat.
  - Current live `~/.openclaw/openclaw.json` still contains invalid object-shaped streaming fields.
  - Current `crons.conf` still contains the old EMA watchdog line plus new continuation jobs.
- This is not just sloppy reporting. It is the observable symptom of unstable runtime authority.

### 2026-04-17 06:15 UTC onward, recovery archaeology becomes its own workstream
- The operator requested a full ingest of this lane and the OpenClaw install archaeology plus five recovery lanes that self-nudge themselves.
- Current `crons.conf` now contains:
  - `recovery-chronology`
  - `recovery-config-runtime`
  - `recovery-session-lineage`
  - `recovery-lost-threads`
  - `recovery-rebuild-plan`
- That means the system is now trying to recover its own recovery context while the underlying config/session drift is still live.

## Active blockers

1. **Old EMA watchdog still active in crontab**
   - Evidence: `/home/trajan/config/crons.conf` still contains `*/2 * * * * /home/trajan/bin/gateway-watchdog.sh >> /var/log/gateway-watchdog.log 2>&1`.
   - Why it matters: `gateway-watchdog.sh` proactively runs `EMA doctor` and `EMA doctor --fix` against EMA-era config paths.

2. **Live OpenClaw config remains invalid right now**
   - Evidence: current targeted read shows:
     - `channels.discord.streaming => {'mode': 'partial'}`
     - `channels.telegram.streaming => {'mode': 'partial'}`
   - Why it matters: current OpenClaw validates these fields as scalar values, so scheduled continuation can fail before lane logic runs.

3. **Runtime/version mismatch across authority layers**
   - Evidence: repair output in session summary said `Config was last written by a newer OpenClaw (2026.4.14); current version is 2026.3.13.`
   - Why it matters: even without EMA drift, version/schema mismatch can reintroduce incompatible shapes or plugin structures.

4. **Session-store drift remains a real risk**
   - Evidence: `agent:main:discord:channel:1490610977736097792` was missing while sibling orchestrator lane keys existed.
   - Why it matters: `scripts/discord_lane_continue.sh` hard-fails when a session binding is absent and only then posts a recovery alert.

5. **Too many new lanes depend on an unstable continuation substrate**
   - Evidence: current crons now include brain lanes plus five recovery lanes in addition to original orchestrator/control jobs.
   - Why it matters: topology expansion amplifies noise and failure surface before authority is stabilized.

## Inferred root causes

1. **Primary root cause: split-brain automation authority**
   - Old EMA automation still believes it owns recovery and config repair.
   - Live OpenClaw runtime now expects authority under `~/.openclaw/...`.
   - Both are acting on overlapping concerns with different schemas and paths.

2. **Secondary root cause: schema drift across versions and eras**
   - EMA-era or older/newer-generated config shapes are incompatible with the currently running OpenClaw build.
   - The clearest example is streaming fields shifting between scalar and object representation.

3. **Tertiary root cause: session binding treated as mutable implementation detail instead of protected control-plane state**
   - Lane continuation assumes session keys will remain present.
   - Missing keys create silent or semi-silent degradation until a wrapper surfaces the problem.

4. **Process root cause: verification was local, not durability-based**
   - The system repeatedly accepted "one message delivered" as proof, while the underlying state was still being reverted.
   - This created contradictory narratives in-channel.

5. **Topology root cause: new lane creation outran control-plane stabilization**
   - Brain lane rollout and now recovery-lane rollout added more dependencies on the same drifting substrate.

## Lost threads to resume

1. **Disable or quarantine old EMA watchdog authority**
   - The lane reached the correct diagnosis and even drafted the exact cron-line disable, but the current cron file still shows the line active.

2. **Trace actual writer lineage for `openclaw.json` and `sessions.json`**
   - `inotifywait` did not catch it during one watch window, but the writer is still unresolved at the process lineage level.

3. **Stabilize `orchestrator-implementation` lineage**
   - It was the canonical missing-session example and should be treated as the sentinel lane for session-store integrity.

4. **Reconcile contradictory “verified” vs “blocked” history into durability criteria**
   - Recovery needs a new definition: verified means it survives cron cycles and watchdog cycles, not just one delivery.

5. **Assess whether the new brain lanes and recovery lanes should remain enabled during repair**
   - They may be increasing blast radius and narrative noise.

## Recommended recovery lanes (5)

### 1. Recovery chronology
Goal: rebuild a durable incident timeline across Discord, session summaries, logs, and workspace docs.  
Key outputs: incident timeline, proof ledger, contradiction map.  
Sentinel questions: what changed, what only seemed fixed, what regressed after seeming fixed?

### 2. Recovery config/runtime authority
Goal: identify and reduce all config-mutating authorities touching gateway/runtime state.  
Key outputs: authority map, cron/process map, schema compatibility matrix.  
Sentinel questions: who can write live config, under what schema, and which one is canonical?

### 3. Recovery session lineage
Goal: protect session bindings as first-class control-plane state.  
Key outputs: lane-to-session registry, drift detector, missing-binding sentinel list.  
Sentinel questions: which canonical lanes are bound, which are stale, and what recreates or deletes them?

### 4. Recovery lost threads
Goal: resume abandoned operator and implementation threads that were eclipsed by drift-chasing.  
Key outputs: backlog of interrupted fixes, unresolved approvals, blocked validations.  
Sentinel questions: what were we actually trying to build before the system started fighting itself?

### 5. Recovery rebuild plan
Goal: turn findings into a staged repair sequence that reduces risk before re-expanding topology.  
Key outputs: freeze plan, validation gates, re-enable order, rollback notes.  
Sentinel questions: what must be turned off, repaired, and proven in order?

## Suggested artifacts and graphs to maintain

1. **Authority graph**
   - Nodes: OpenClaw runtime, EMA watchdogs, cron entries, config files, session store, Discord lanes.
   - Edges: reads, writes, restarts, resume triggers.

2. **Lane lineage table**
   - lane name, channel id, session key, session id, owner, last known good delivery, continuation cron, current status.

3. **Config schema drift ledger**
   - file path, field, expected shape, observed bad shape, suspected writer, first-seen time, last-seen time.

4. **Verification ladder**
   - wrapper exists -> cron installed -> session bound -> manual run clean -> scheduled run clean -> survives watchdog cycle -> survives restart -> promoted to durable.

5. **Lost-thread queue**
   - thread, last meaningful progress, interruption cause, evidence pointer, next resumption move.

## Evidence highlights

- `scripts/discord_lane_continue.sh` resolves session from `~/.openclaw/agents/main/sessions/sessions.json` and fails loudly when missing.
- `scripts/babysitter_signal_check.sh` watches for missing lane crons and recent gateway churn, then nudges `#babysitter-sprint`.
- `gateway-watchdog.sh` is explicitly EMA-oriented and mutates config through `EMA doctor --fix` against `/home/trajan/data/agent-state/.env.discord`.
- `bootstrap/automation-registry.curated.json` already classifies `cron.gateway-watchdog` as a high-risk canonical mutator touching config.
- Current `crons.conf` still contains both the old watchdog and the newer lane-continuation jobs, including the new five recovery lanes.
- Current `~/.openclaw/openclaw.json` still shows invalid object-shaped streaming fields.
- Current sessions store contains `#babysitter-repair-log` and `#babysitter-sprint`, but the lane history documented real disappearance of `orchestrator-implementation` binding.
