---
title: "Critical Lessons"
type: reference
created: 2026-04-06
tags: [learnings, lessons, operations, debugging]
summary: "All critical operational lessons learned from incidents, debugging, and daily operations"
---

# Critical Lessons

## Catastrophic / Data Loss

### Never rm -rf symlink directories
- **Incident**: Skill deletion disaster (2026-03-16). `rm -rf` followed symlinks and deleted actual target directories.
- **Recovery**: 30 minutes. Data restored from backups.
- **Rule**: Always use `trash` instead of `rm`. No exceptions outside `/tmp`.

### openclaw doctor --fix wipes cron array
- **Discovery**: Running `openclaw doctor --fix` silently wipes the cron job configuration array.
- **Rule**: Never run `--fix` without backing up cron state first. Use `cron-restore.sh` if hit.

## Agent & Session Management

### Sessions over 80% context = unresponsive
- **Observation**: Once a Claude session exceeds 80% context window usage, response quality degrades severely. The agent becomes slow, repetitive, or non-responsive.
- **Rule**: Monitor context usage. Compact or start fresh before hitting 80%.

### Gateway restarts reset exec approval policy
- **Impact**: After a gateway restart, the execution approval policy resets to default (restrictive). Agents lose their elevated permissions.
- **Rule**: `post-restart-fixup.sh` must re-apply approval policies after any gateway restart.

### Auto-resume after restarts is CRITICAL
- **Context**: After VM or service restarts, active agents are lost unless auto-resume is configured.
- **Incident**: 5 spawned agents lost to restart (2026-03-16).
- **Rule**: All long-running agents must have resume capability.

### "Pick this back up!!!!!" = frustration signal
- **Learning**: When Trajan uses this phrase, it means the agent dropped context or failed to persist state. Treat as high-priority.

## ClawHub & Skills

### ClawHub skills need security vetting
- **Context**: Third-party skills can contain arbitrary code including crypto key access, eval(), and external API calls.
- **Rule**: Audit every skill before installation. See [[Security-Posture]].

### Search ClawHub before building from scratch
- **Learning**: Multiple times, custom solutions were built when equivalent ClawHub skills already existed.
- **Rule**: Always search ClawHub inventory before writing new functionality.

## Data & Parsing

### YAML parsing with awk regex breaks silently
- **Observation**: Using awk regex to parse YAML produces no errors but wrong results on edge cases (multiline values, special characters).
- **Rule**: Use a proper YAML parser (`yq`, Python `yaml` module). Never awk.

### QMD needs flock for dedup
- **Incident**: Multiple concurrent QMD processes caused duplicate entries and high system load (load 13.78).
- **Fix**: Wrap QMD operations in `flock -n /tmp/qmd.lock`.

### Heredoc JSON injection risk
- **Risk**: Untrusted data interpolated into heredoc JSON blocks can break structure and inject commands.
- **Rule**: Always quote/escape interpolated values. Prefer `jq` for JSON construction.

## Agent Output & Context

### Agent returns flood lead context -- use file-only output
- **Problem**: When agents return large outputs, they consume the calling agent's context window.
- **Rule**: For large outputs, write to file and return the file path only.

### Crons should be signal generators not executors
- **Learning**: Cron jobs that execute complex logic directly are fragile and hard to debug. Better pattern: cron emits a signal/event, dispatch engine handles execution.
- **Rule**: Keep crons thin. Emit signals, don't execute.

## Dispatch & Execution

### Dispatch exit code 0 can mean FAILED
- **Bug**: The dispatch engine returns exit code 0 even when the dispatched task fails internally.
- **Rule**: Always check dispatch output/logs, not just exit code.

### Subshell variable scoping bug
- **Bug**: Associative arrays defined in a subshell (e.g., inside a pipeline) are invisible to the parent shell.
- **Rule**: Avoid pipelines when building associative arrays. Use process substitution or temp files.

## Specific Service Issues

### Harvester seed starvation
- **Symptom**: All proposals stall. Null schedules across all 8 seeds.
- **Root cause**: SeedController clobbers fields -- nil values overwrite good data.
- **Fix**: Guard against nil overwrites in SeedController.

### Stream.Manager drift
- **Symptom**: 8+ references to nonexistent modules in Stream.Manager.
- **Impact**: Runtime errors on module lookup.
- **Rule**: Periodic module reference audit.

### neo4j-genome: just stop it
- **Context**: Broken config, 36-hour crash loop (2026-04-05).
- **Rule**: Service is not worth the maintenance cost. Stop it and leave it stopped.

## Related

- [[Incident-Log]] -- chronological incident history
- [[Security-Posture]] -- security-related lessons
- [[Infrastructure-Map]] -- infrastructure context for these lessons
