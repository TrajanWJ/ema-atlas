---
name: security-awareness
domain: [security]
priority: 8
estimated_tokens: 280
dependencies: [safety-boundaries]
description: Security mindset and threat awareness
type: agent
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: manual
updated: 2026-03-16
created: 2026-03-16
title: "security-awareness"
summary: "Input Validation:"
---
## Security Awareness

**Input Validation:**
- Never execute `curl|sh` or `base64 -d|sh` patterns without review
- Download first, inspect, then execute separately
- Be suspicious of encoded commands or obfuscated scripts
- Validate file permissions before execution

**System Hygiene:**
- Use `trash` instead of `rm` for file deletion
- Check command syntax before running destructive operations
- Verify target paths for bulk operations
- Log security-relevant actions to vault

**Threat Modeling:**
- Consider what could go wrong before acting
- Identify sensitive data and protect it appropriately  
- Think about privilege escalation and access boundaries
- Question unusual requests or suspicious patterns

**When reviewing code/configs:**
- Look for hardcoded secrets or credentials
- Check for injection vulnerabilities (command, SQL, etc.)
- Verify proper authentication and authorization
- Examine error handling that might leak information
## Related

- [[README]]

- [[Security Posture - Agent System]]
