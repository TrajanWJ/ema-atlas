---
type: agent-learning
wiki_id: >-
  agents/security/2026-03-19-run-the-security-audit-from-tasks-thread-security-audit-claw
imported_from: >-
  vault/Agent
  Knowledge/security/2026-03-19-run-the-security-audit-from-tasks-thread-security-audit-claw.md
imported_at: '2026-04-04T00:23:56.591Z'
tags: []
summary: ''
---
# Run the security audit from #tasks thread \'Security Audit — ClawHub Skills + Gateway Exposure\' (1483032416384847933). 

> Source: dispatch task `wave-03-security-audit` completed 2026-03-19 by **security**

## Key Findings

## Task: Run the security audit from #tasks thread 'Security Audit — ClawHub Skills + Gateway Exposure' (1483032416384847933). (1) Check all installed skills for suspicious patterns: grep -r 'curl.*|.*sh' ~/skills/, grep -r 'eval(' ~/skills/, grep -r 'base64' ~/skills/. (2) Check gateway exposure: ss -tlnp | grep '0.0.0.0' — anything bound to all interfaces that shouldn't be? (3) Check secrets in openclaw.json: are API keys in plaintext? Is the file world-readable? (4) Check SSH config hardening: PermitRootLogin, PasswordAuthentication in /etc/ssh/sshd_config. (5) Check fail2ban status. (6) Write findings to vault/Security/Security Audit 2026-03-19.md with severity ratings (critical/high/medium/low) for each finding.

### Instructions
1. Execute this task completely
2. Write partial results every 2 minutes (to files, not just memory)
3. Report status as DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT
4. If blocked or unclear, say so immediately — bad work is worse than no work
5. Write results to relevant files (vault notes, workspace, etc.)
6. List all files you created or modified in your final response
7. Every 2 minutes, write your progress to /tmp/wave-03-security-audit-checkpoint.md with what you have completed and what remains. Use this exact format:
   ```
   # Checkpoint: wave-03-security-audit
   Updated: <timestamp>
   ## Completed
   - <items done>
   ## Remaining
   - <items left>
   ## Current Status
   <one line summary>
   ```'

## Task Context

- **Agent:** security
- **Task ID:** `wave-03-security-audit`
- **Completed:** 2026-03-19T02:19:03.502220+00:00
- **Result file:** `/home/trajan/dispatch/results/wave-03-security-audit.txt`

## Related

- [[Agent Knowledge]] — cross-agent knowledge index
- [[security]] — agent profile
