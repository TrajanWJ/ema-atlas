---
title: README
created: '2026-03-14'
updated: '2026-03-16'
type: project
status: active
confidence: 0.4
confidence_updated: 2026-03-18T00:00:00.000Z
source: auto-capture
tags:
  - overview
  - tasks
  - worklog
summary: Active and planned projects tracked in the vault.
wiki_id: projects/README
imported_from: vault/Projects/README.md
imported_at: '2026-04-04T00:23:56.889Z'
---
# Projects

Active and planned projects tracked in the vault.

## Active Projects

### System Buildout
The core agent infrastructure project. Multi-agent collaboration engine with self-critique, auto-evolution, and dynamic agent ecosystem.
- **Status:** 🔨 Active
- **Location:** `vault/Projects/System Buildout/`
- **Discord:** #tasks, #overview, #worklog (🔧 System Buildout category)

### Claude Code Bot v2
Standalone Discord bot for code execution tasks.
- **Status:** ✅ Shipped (operational)
- **Bot:** `claudecode_seedofarsonVM` (ID: 1482938994022158430)
- **Service:** `claude-code-bot.service`

### Host-VM Bridge
Bidirectional shared folder + host-claude dispatch system.
- **Status:** ✅ Shipped (operational)
- **Components:** bridge-sync timer, host-claude.sh, host-notify.sh

### Session Architecture
Smarter session lifecycle, write-only feeds, cross-session state.
- **Status:** 💡 Proposal (vault/Research/[[Session Architecture Research]].md)
- **Key decision:** Implement resetByChannel + write-only feed routing

### Vault Knowledge System
Self-organizing knowledge base with [[auto-knowledge]], ontology sync, QMD search.
- **Status:** 🔨 Active (365 files, growing)
- **Automation:** capture.sh, ontology-sync, vault-refresh, QMD embed (all cron'd)

## Completed
- Discord server restructure (4 categories, 22 channels)
- 48 ClawHub skills installed
- 5 custom skills built
- Security audit
- Cron system (10 automated jobs)

## Related
- [[System Overview]]
- [[Agent Roster]]
- [[System Buildout/README]]
