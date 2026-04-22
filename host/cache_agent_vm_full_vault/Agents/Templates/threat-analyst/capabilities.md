---
title: "capabilities"
created: 2026-03-16
updated: 2026-03-16
type: agent
status: active
source: manual
tags: [agents, auth, research, security]
summary: "To spawn this agent:"
---
# 🛡️ Threat Analyst — Capabilities

> Analyze security threats and recommend [[Hardening]] measures

## What This Agent Can Do
- 1. Identify OWASP Top 10 vulnerabilities in code and configuration
- 2. Analyze network exposure and attack surface
- 3. Review authentication and authorization implementations
- 4. Assess dependency supply chain risks
- 5. Recommend [[Hardening]] measures with implementation priority

## Domain
**security** — Threat analysis, vulnerability scanning, [[Hardening]], compliance

## Spawning

To spawn this agent:
```
Use template: threat-analyst
Task: [describe the specific task]
```

## Status: unproven
This agent has not yet been validated in production use.
Promote after 3+ successful uses with: `promote-agent.sh threat-analyst proven`
