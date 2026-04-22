---
title: "Claude-Code-2026-March-Sonnet46-System-Prompt"
created: 2026-03-16
updated: 2026-03-16
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: reference
tags: [architecture, auth, claude, knowledge, prompts]
summary: "The prompt is organized into logical XML sections:"
---
# Claude Code Production System Prompt - Sonnet 4.6 (March 2026)

> **Source**: EliFuzz/awesome-system-prompts → Production leak from Claude Code
> **Date**: March 2026
> **Model**: Claude Sonnet 4.6

## Key Architecture Patterns **[IMPLEMENT]**

### 1. Structured Behavior Modules
The prompt is organized into logical XML sections:
- `<product_information>` - Self-awareness and product details
- `<refusal_handling>` - Safety boundaries and nuanced refusals  
- `<tone_and_formatting>` - Precise style guidelines
- `<knowledge_cutoff>` - Handling time-sensitive information
- `<user_wellbeing>` - Mental health awareness and crisis handling

**Takeaway**: Modular prompt architecture makes it easier to update specific behaviors without affecting others.

### 2. Tool Integration Patterns
- **Web Search**: Auto-triggered for current events without asking permission
- **Memory System**: Contextual memory that can be toggled by users
- **Persistent Storage**: Key-value store for artifacts with personal/shared data scoping
- **API-in-API**: Artifacts can call Anthropic API directly for "Claude in Claude" functionality

**Takeaway**: Modern AI systems integrate multiple tools seamlessly with clear scoping rules.

### 3. Formatting Philosophy **[IMPLEMENT]**
```
"Claude avoids over-formatting responses with elements like bold emphasis, headers, lists, and bullet points. It uses the minimum formatting appropriate to make the response clear and readable."
```

**Specific Rules**:
- Default to natural prose, not bullet points
- Only use formatting when explicitly requested or when essential for clarity
- In casual conversation, keep responses short (few sentences)
- Write lists in natural language: "some things include: x, y, and z"

### 4. Context Window Management
For API-powered artifacts:
- Always include full conversation history in each request
- For games/stateful apps, include complete state in each call
- Strip ```json fences before parsing responses

### 5. User Wellbeing Framework **[IMPLEMENT]**
- Proactive mental health awareness without being invasive
- Crisis detection without amateur psychological assessment
- Resource provision without categorical confidentiality claims
- Avoid fostering over-reliance on AI

### 6. Knowledge Cutoff Strategy
- Clear cutoff date communication (August 2025)
- Auto-search for current events without permission
- Careful handling of time-sensitive binary events (deaths, elections)
- Present search findings evenhandedly without overconfident claims

## Production Implementation Patterns

### Memory System Integration
```xml
<memory_system>
- Claude has a memory system which provides Claude with access to derived information (memories) from past conversations with the user
- Claude has no memories of the user because the user has not enabled Claude's memory in Settings
</memory_system>
```

### Persistent Storage API (for artifacts)
```javascript
await window.storage.get(key, shared?)     // Retrieve
await window.storage.set(key, value, shared?) // Store  
await window.storage.delete(key, shared?)  // Delete
await window.storage.list(prefix?, shared?) // List keys
```

**Key Design**: 
- Hierarchical keys under 200 chars (table_name:record_id)
- Personal vs shared data scoping
- Rate limiting consideration - batch related data

### API Integration in Artifacts
```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: "Your prompt here" }]
  })
});
```

## Actionable Takeaways **[IMPLEMENT]**

1. **Adopt modular prompt architecture** - Separate concerns into XML sections
2. **Implement minimal formatting philosophy** - Default to natural prose over bullet points
3. **Build tool integration patterns** - Auto-search, memory systems, persistent storage
4. **Create user wellbeing framework** - Proactive but not intrusive mental health awareness
5. **Establish clear knowledge boundaries** - Cutoff dates and search triggers
6. **Design context-aware responses** - Adjust depth and formality based on conversation type

This represents a mature production AI system with sophisticated user experience patterns.

## Related Notes

- [[Cursor-2025-November-System-Prompt]] — comparable leaked system prompt from a competing coding agent
- [[prompts/System Prompt Patterns]] — reusable patterns extracted from production system prompts like this one
- [[Prompt Engineering/EliFuzz Awesome System Prompts]] — source repository where this prompt was sourced