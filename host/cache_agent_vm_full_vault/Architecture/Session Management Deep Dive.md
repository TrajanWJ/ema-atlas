---
title: "Session Management Deep Dive"
created: 2026-03-16
updated: 2026-03-16
type: architecture
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: architecture-doc
tags: [knowledge, openclaw, ops, prompts, research, security]
summary: "[[OpenClaw]] implements a sophisticated session management system with:"
---
# Session Management Deep Dive

**Date:** 2026-03-16
**Status:** Complete Research Report
**Sources:** [[OpenClaw]] documentation analysis, [[session architecture proposal]], [[anti-staleness strategy]]
**Research Scope:** Session lifecycle, context limits, LCM compaction, Discord channel routing, config optimization

## Overview

[[OpenClaw]] implements a sophisticated session management system with:
- **Deterministic routing** based on channel/peer identifiers
- **Per-session context isolation** with automatic compaction
- **Lossless Context Management (LCM)** for long-term conversation history
- **Flexible reset policies** (daily, idle, per-channel, per-type)
- **Cross-session state** via workspace files (MEMORY.md, daily notes, vault)

The key insight: **Sessions are isolated by design**. Rather than fighting this, we should optimize per-session behavior and leverage cross-session state mechanisms.

## Session Keys & Lifecycle

### How Session Keys Work
Session keys determine conversation isolation. Pattern examples:
- **Direct messages**: `agent:main:main` (default, all DMs share one session)
- **Discord channels**: `agent:main:discord:channel:<id>`
- **Discord threads**: `agent:main:discord:channel:<id>:thread:<threadId>`
- **Telegram groups**: `agent:main:telegram:group:<id>`
- **Forum topics**: `agent:main:discord:channel:<forumId>:thread:<threadId>`
- **Cron jobs**: `cron:<job.id>` (always fresh)

### Session Lifecycle Events
1. **Creation**: New sessionKey creates entry in `sessions.json` + fresh `<sessionId>.jsonl`
2. **Activity**: Updates `updatedAt` timestamp in session entry
3. **Reset**: Creates new sessionId, preserves sessionKey, archives old transcript
4. **Compaction**: Summarizes old context, keeps recent messages
5. **Cleanup**: Removes old entries/transcripts based on maintenance policy

### Reset Triggers
- **Daily reset**: Default 4:00 AM UTC (gateway local time)
- **Idle reset**: Optional sliding window (e.g., 120 minutes)
- **Manual reset**: `/new` or `/reset` commands
- **Per-channel overrides**: `session.resetByChannel`
- **Per-type overrides**: `session.resetByType` (direct, group, thread)
- **Whichever expires first wins** when multiple policies apply

## Context Limits & LCM Compaction

### Context Window Management
- **Model-specific limits** from provider catalog (e.g., 200K tokens for Claude)
- **Reserve tokens** for prompts + next output (default 16K+)
- **Soft threshold** triggers memory flush before compaction
- **Hard limit** triggers auto-compaction + retry

### LCM Compaction Process
1. **Pre-compaction memory flush**: Silent turn writes to MEMORY.md/daily notes
2. **Summarization**: Older messages → compact summary entry in transcript
3. **Persistence**: Summary stored in `<sessionId>.jsonl` as `compaction` entry
4. **Continuation**: New messages append after `firstKeptEntryId`
5. **Future runs see**: compaction summary + recent messages

### Memory Flush (Critical Feature)
```json5
{
  agents: {
    defaults: {
      compaction: {
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store."
        }
      }
    }
  }
}
```

**Why this matters**: Without memory flush, compaction can erase important context. The flush runs a silent turn that prompts the agent to write durable state to disk before summarization.

## Discord Channel Configuration

### Per-Channel Activation Controls
Discord channels support granular activation control via `guilds.<guildId>.channels`:

```json5
{
  channels: {
    discord: {
      guilds: {
        "123456789012345678": {
          requireMention: false,  // Global guild setting
          channels: {
            "general": { allow: true },
            "feed-channel": { 
              allow: true, 
              requireMention: true  // Override: require @mention
            },
            "private": { allow: false }  // Block this channel
          }
        }
      }
    }
  }
}
```

### Channel-Level Configuration Options
- **requireMention**: Whether @mention is required for responses
- **ignoreOtherMentions**: Drop messages mentioning others (not the bot)
- **allow**: Boolean to enable/disable specific channels
- **Per-channel model overrides**: `channels.modelByChannel`
- **Thread behavior**: Inherits parent channel config unless overridden

## Session Cleanup Strategy

### Maintenance Configuration
```json5
{
  session: {
    maintenance: {
      mode: "enforce",           // vs "warn"
      pruneAfter: "7d",         // Remove sessions older than 7 days
      maxEntries: 200,          // Cap total sessions
      resetArchiveRetention: "3d", // Cleanup archived transcripts
      maxDiskBytes: "1gb",      // Hard disk limit
      highWaterBytes: "800mb"   // Target after cleanup
    }
  }
}
```

### Cleanup Order (Enforcement Mode)
1. Prune stale entries older than `pruneAfter`
2. Cap entry count to `maxEntries` (oldest first)
3. Archive transcript files for removed entries
4. Purge old `*.deleted.<timestamp>` and `*.reset.<timestamp>` archives
5. Rotate `sessions.json` when it exceeds `rotateBytes`
6. Enforce disk budget: oldest artifacts first, then oldest sessions

## Hybrid Channel Strategy Implementation

Based on the session architecture analysis, here's the concrete config for implementing the hybrid primary/feed approach:

### Phase 1: Aggressive Feed Channel Cleanup
```json5
{
  session: {
    // Global daily reset at 4 AM UTC
    reset: { mode: "daily", atHour: 4 },
    
    // Per-channel overrides for feed channels
    resetByChannel: {
      discord: {
        // Feed channels: very aggressive reset (1 hour idle)
        mode: "idle",
        idleMinutes: 60
      }
    },
    
    // Aggressive maintenance
    maintenance: {
      mode: "enforce",
      pruneAfter: "7d",
      maxEntries: 200,
      resetArchiveRetention: "3d"
    }
  },
  
  channels: {
    discord: {
      guilds: {
        "YOUR_GUILD_ID": {
          requireMention: false,  // Global setting
          channels: {
            // Primary conversation channels - default behavior
            "chat": { allow: true },
            "trajans-office": { allow: true },
            "overview": { allow: true },
            
            // Feed channels - write-only behavior via requireMention
            "agent-feed": { 
              allow: true, 
              requireMention: true  // Forces intentional engagement
            },
            "evolution-log": { 
              allow: true, 
              requireMention: true 
            },
            "alerts": { 
              allow: true, 
              requireMention: true 
            }
          }
        }
      }
    }
  }
}
```

### Phase 2: Send Policy for Dead Forum Threads
```json5
{
  session: {
    sendPolicy: {
      rules: [
        // Block delivery to old forum threads (example pattern)
        { 
          action: "deny", 
          match: { 
            rawKeyPrefix: "agent:main:discord:channel:FORUM_ID:thread:" 
          }
        }
      ],
      default: "allow"
    }
  }
}
```

## Undocumented Features Found

### Thread Binding for Subagents
Discord supports binding threads to specific session targets:
- `/focus <target>` bind current thread to subagent session
- `/unfocus` remove binding
- Automatic thread creation for `sessions_spawn({ thread: true })`
- Configurable idle timeout and max age for bindings

### Context Pruning (Tool Result Trimming)
Session pruning removes old tool results without rewriting transcripts:
- **cache-ttl mode**: Only prune when Anthropic cache expires (5m default)
- **Smart defaults**: Auto-enabled for Anthropic with appropriate TTL
- **Tool selection**: Allow/deny specific tools with wildcards
- **Soft vs hard pruning**: Truncate vs completely replace tool results

### Session Routing Edge Cases
- **DM scope security**: Multiple users sharing sessions is a privacy risk
- **Main session pinning**: Prevents non-owner DMs from corrupting `lastRoute`
- **Identity linking**: Map provider-specific IDs to canonical identities
- **Broadcast groups**: Run multiple agents for same peer simultaneously

### Memory System Integration
- **QMD backend**: Alternative to SQLite using local-first search sidecar
- **Hybrid search**: BM25 + vector for exact tokens + semantic similarity
- **Temporal decay**: Recent memories naturally rank higher
- **MMR re-ranking**: Reduce redundant results from similar notes
- **Multimodal memory**: Index images/audio with Gemini embeddings

### Configuration Resolution Hierarchy
For Discord channels specifically:
1. Thread-specific config (if exists)
2. Channel-specific config in `guilds.<id>.channels.<channelId>`
3. Guild-level config in `guilds.<id>`
4. Global Discord config in `channels.discord`
5. Channel defaults in `channels.defaults`

## Recommendations

### Immediate Changes
1. **Enable memory flush** if not already active (default: enabled)
2. **Set aggressive maintenance** for feed channels via `resetByChannel`
3. **Use requireMention=true** for feed channels to prevent accidental engagement
4. **Enable session pruning** for Anthropic models to optimize cache usage

### Architecture Alignment
1. **Accept per-channel isolation** as the design, don't fight it
2. **Minimize feed channel context** via write-only behavior patterns
3. **Maximize cross-session state** via MEMORY.md, vault, and daily notes
4. **Leverage compaction + LCM** for sessions that do accumulate context

### Monitoring & Maintenance
1. Use `openclaw sessions cleanup --dry-run` to preview cleanup impact
2. Monitor context usage with `/status` and `/context detail`
3. Track compaction frequency for high-traffic channels
4. Regular memory flush verification via daily notes review

## Technical Implementation Notes

### Session Store Locations
- **Store**: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripts**: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
- **Memory index**: `~/.openclaw/memory/<agentId>.sqlite`
- **QMD state**: `~/.openclaw/agents/<agentId>/qmd/` (if using QMD backend)

### Key Configuration Files
- **Main config**: `~/.openclaw/openclaw.json`
- **Agent workspace**: `~/.openclaw/agents/main/workspace/`
- **Session metadata**: Via `/status` and `openclaw sessions` CLI

### Debugging Session Issues
- **Session routing**: Check `sessionKey` in `/status` output
- **Context usage**: Use `/context detail` for breakdown
- **Reset verification**: Monitor `updatedAt` in sessions.json
- **Compaction tracking**: Watch for `🧹 Auto-compaction complete` messages
- **Memory flush**: Verify `NO_REPLY` turns in transcript

This deep dive provides a complete picture of [[OpenClaw]]'s session management architecture and concrete steps for optimizing the hybrid primary/feed channel approach.
## Related

- [[2026-03-16]]
- [[Gateway Resilience Protocol]]
