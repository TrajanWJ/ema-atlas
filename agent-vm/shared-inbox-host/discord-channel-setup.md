# Discord Channel Setup: Wiki/Superman Knowledge Channel

## Create Channel

In Discord, in the **#🤖-agent-os-frontend** category:

1. Right-click category → "Create Channel"
2. **Name:** `📚-wiki-superman-knowledge`
3. **Topic:** `Vault indexing, Superman intent folders, knowledge graph, semantic memory. Architecture & implementation for EMA's knowledge substrate.`
4. **Category:** #🤖-agent-os-frontend
5. Click Create

---

## Channel Purpose

**This channel is for:**
- Vault/Wiki architecture discussion
- Superman indexing logic + semantic search
- Knowledge graph design
- Intent folder structure
- Semantic memory + reasoning

**This channel is NOT for:**
- General agent dispatches (use #dispatch)
- Task tracking (use #desk)
- Daily worklog (use #worklog)

---

## Initial Posts (Pinned)

**Post 1: Vault → Wiki Transition**
```
📚 **EMA Wiki: What Changed**

The Vault is now the Wiki. Same data, new integration:

- **Vault app** in EMA reads from ~/vault/
- **Wiki server** at localhost:8090 (Quartz)
- **Superman** indexes for semantic search
- **Intent folders** (`.superman/intents/`) are semantic memory

Key files:
- /home/trajan/vault/System/Superman-Indexing-Strategy.md
- /home/trajan/vault/System/Knowledge-Graph-Design.md
- /home/trajan/vault/Projects/EMA/Wiki-Architecture.md

Questions? Reply in thread.
```

**Post 2: Superman Brainstorm Schedule**
```
🧠 **Superman Deep-Dive Session**

We're designing Superman integration for Trajan-network this week.

Session 7 (Sunday 04-09):
- What data should Superman index?
- How often? (real-time, hourly, daily?)
- Embedding model selection
- Semantic search UI design
- Knowledge graph visualization

Artifacts from brainstorm will be pinned here.
```

**Post 3: Knowledge Graph Work**
```
📊 **Knowledge Graph: Current State**

The Vault has 2,915 notes with backlinks. Superman should index:
- File relationships (backlinks)
- Semantic relationships (similar intent)
- Project tagging
- Author + timestamp

Visualization options:
1. Force-directed (D3.js)
2. Hierarchical (parent-child)
3. Custom (project-centric)

What matters most to you? Discuss in thread.
```

**Post 4: Vault Sync Strategy**
```
🔄 **Vault Sync: EMA ↔ Filesystem**

Vault files live on disk (git-backed). EMA indexes them.

Sync flow:
1. Human edits file in VS Code or Obsidian
2. File watcher picks up change
3. EMA re-indexes (Superman, backlinks, metadata)
4. Dashboard/Vault app show new state
5. Intent folders (`.superman/`) are canonical for projects

See: /home/trajan/vault/System/Trajan-Network-Architecture.md (Vault sync section)
```

---

## Threading Convention

When posting a question or update:

1. **New topic:** Post in main channel, let it form a thread
2. **Reply:** Use thread replies to keep organized
3. **Decision:** Pin the decision summary after discussion

Example:
```
📍 **[DECISION] Superman Index Frequency**

Consensus from brainstorm:
- Full re-index once daily (midnight)
- Incremental index on file save (3s debounce)
- Impact: ~500KB index file, <2s search latency

Decided by: Session 7 brainstorm (04-09)
See: /vault/System/Superman-Decision-Log.md
```

---

## Use This Channel For

✅ Superman/indexing questions
✅ Knowledge graph design
✅ Intent folder structure
✅ Semantic search behavior
✅ Vault/Wiki architecture
✅ Honcho context integration
✅ Vault sync strategy

❌ Not for task dispatch (→ #dispatch)
❌ Not for project updates (→ project channels)
❌ Not for agent status (→ #agent-feed)

---

## Key Documents to Familiarize

1. `/home/trajan/vault/System/Trajan-Network-Architecture.md` — Full architecture including Vault
2. `/home/trajan/vault/System/EMA-Multi-Agent-Brainstorm-Sessions.md` — Session 7 (Superman)
3. `/home/trajan/vault/System/EMA-Unified-Spec-With-Integrations.md` — Vault/Wiki app spec (section "APP 9: Vault / SecondBrain")
4. Existing: `/home/trajan/vault/System/Superman-Architecture.md` (if exists, or create it)

---

Done. Post this to the channel and you're good to go.
