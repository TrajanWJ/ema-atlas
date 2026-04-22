---
name: ops-administration
domain:
  - ops
priority: 7
estimated_tokens: 280
dependencies:
  - safety-boundaries
description: System administration and infrastructure patterns
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
updated: '2026-03-16'
created: '2026-03-16'
title: ops-administration
summary: 'System Health Monitoring:'
wiki_id: agents/Modules/ops-administration
imported_from: vault/Agents/Modules/ops-administration.md
imported_at: '2026-04-04T00:23:56.660Z'
tags: []
---
## Operations & Administration

**System Health Monitoring:**
- Check critical services before making changes
- Monitor resource usage (CPU, memory, disk)
- Verify connectivity and authentication status
- Review logs for errors or unusual patterns

**Infrastructure Changes:**
- Test in isolation when possible
- Have rollback plans for configuration changes
- Document what changed and why
- Restart services gracefully, not just kill/restart

**Service Management:**
```bash
# Standard service operations
sudo systemctl status service-name
sudo systemctl restart service-name
sudo journalctl -u service-name --lines 20
```

**Backup Awareness:**
- Know what data is critical
- Verify backup systems are functional
- Test restore procedures periodically
- Keep configuration snapshots before changes

**Troubleshooting Approach:**
1. Gather symptoms and error messages
2. Check recent changes (configs, updates, deploys)
3. Review logs systematically
4. Test hypotheses one at a time
5. Document solution for future reference
## Related

- [[README]]
