# ClaudeForge WebSocket Protocol

## Connection

**URL:** `ws://localhost:3001/ws`

- Path: `/ws` (configurable via `DEFAULT_WS_PATH`)
- Port: `3001` (configurable via `DEFAULT_SERVER_PORT`)
- No authentication required (planned for future)
- Clients receive a unique 8-character ID on connection

## Subscription Model

By default, new clients receive **all** events (legacy mode). To filter events by session, use the subscribe/unsubscribe commands.

When a client has at least one subscription, it only receives:
- **Global events** (system.health, system.status, system.error, project.*, task.*) — always delivered
- **Session-scoped events** — only for subscribed session IDs

---

## Client → Server Messages

### subscribe

Subscribe to events for a specific session.

```json
{
  "type": "subscribe",
  "sessionId": "sess_abc123"
}
```

### unsubscribe

Stop receiving events for a session.

```json
{
  "type": "unsubscribe",
  "sessionId": "sess_abc123"
}
```

### session.message

Send a chat message to a Claude session. Response streams back as `session.output` events.

```json
{
  "type": "session.message",
  "sessionId": "sess_abc123",
  "content": "Fix the login bug in auth.ts"
}
```

### session.create

Create a new session with an optional provider and model.

```json
{
  "type": "session.create",
  "directory": "/home/user/projects/my-app",
  "name": "fix-auth",
  "provider": "claude",
  "model": "claude-sonnet-4-5-20250514"
}
```

Auto-creates the project if the directory isn't registered yet. Emits `session.created`.

### session.stop

Stop a running session.

```json
{
  "type": "session.stop",
  "sessionId": "sess_abc123"
}
```

### session.resume

Resume a stopped session.

```json
{
  "type": "session.resume",
  "sessionId": "sess_abc123"
}
```

### shell.run

Execute a shell command in the session's working directory.

```json
{
  "type": "shell.run",
  "sessionId": "sess_abc123",
  "command": "git status"
}
```

**Safety:** Blocked commands (rm -rf /, mkfs, fork bombs) return an error via `session.output`. 30s timeout, 1MB max output.

### task.create

Create a new task.

```json
{
  "type": "task.create",
  "data": {
    "title": "Fix authentication flow",
    "description": "Users can't log in after password reset",
    "priority": "high",
    "projectName": "my-app"
  }
}
```

### task.update

Update an existing task.

```json
{
  "type": "task.update",
  "taskId": "task_xyz",
  "data": {
    "status": "in_progress",
    "sessionId": "sess_abc123"
  }
}
```

---

## Server → Client Events

### Session Events

#### session.created

A new session was created.

```json
{
  "type": "session.created",
  "session": {
    "id": "sess_abc123",
    "name": "fix-auth",
    "projectId": "proj_xyz",
    "projectName": "my-app",
    "directory": "/home/user/projects/my-app",
    "channelId": null,
    "provider": "claude",
    "providerSessionId": null,
    "tmuxName": "claudeforge-fix-auth-abc123",
    "model": null,
    "mode": "auto",
    "agentPersona": null,
    "systemPrompt": null,
    "status": "active",
    "verbose": false,
    "createdAt": 1710900000000,
    "lastActivity": 1710900000000,
    "messageCount": 0,
    "totalTokens": 0,
    "totalCost": 0
  }
}
```

**Scope:** Session-scoped

#### session.updated

Session configuration changed (model, system prompt).

```json
{
  "type": "session.updated",
  "session": { /* SessionRecord */ }
}
```

**Scope:** Session-scoped

#### session.status

Session status changed.

```json
{
  "type": "session.status",
  "sessionId": "sess_abc123",
  "status": "active"
}
```

**Values:** `"active"` | `"idle"` | `"stopped"` | `"error"`

**Scope:** Session-scoped

#### session.closed

Session was terminated.

```json
{
  "type": "session.closed",
  "sessionId": "sess_abc123"
}
```

**Scope:** Session-scoped

#### session.output

Streamed data from the AI provider. The `data` field contains a `ProviderEvent`.

**Text chunk:**
```json
{
  "type": "session.output",
  "sessionId": "sess_abc123",
  "data": {
    "type": "text",
    "content": "I'll fix the login bug. Let me read the file first."
  }
}
```

**Thinking:**
```json
{
  "type": "session.output",
  "sessionId": "sess_abc123",
  "data": {
    "type": "thinking",
    "content": "The user wants me to fix auth.ts. Let me check what's there..."
  }
}
```

**Tool use:**
```json
{
  "type": "session.output",
  "sessionId": "sess_abc123",
  "data": {
    "type": "tool_use",
    "tool": "Read",
    "input": "src/auth.ts",
    "toolCall": {
      "id": "tc_001",
      "kind": "read",
      "tool": "Read",
      "title": "Read src/auth.ts",
      "filePath": "src/auth.ts"
    }
  }
}
```

**Tool result:**
```json
{
  "type": "session.output",
  "sessionId": "sess_abc123",
  "data": {
    "type": "tool_result",
    "tool": "Read",
    "output": "import express from 'express';\n...",
    "toolCall": {
      "id": "tc_001",
      "kind": "read",
      "tool": "Read",
      "title": "Read src/auth.ts",
      "output": "import express from 'express';\n..."
    }
  }
}
```

**Image:**
```json
{
  "type": "session.output",
  "sessionId": "sess_abc123",
  "data": {
    "type": "image",
    "mediaType": "image/png",
    "data": "iVBORw0KGgo..."
  }
}
```

**Done (turn complete):**
```json
{
  "type": "session.output",
  "sessionId": "sess_abc123",
  "data": {
    "type": "done",
    "sessionId": "sess_abc123",
    "cost": 0.045,
    "inputTokens": 1200,
    "outputTokens": 800,
    "providerSessionId": "uuid-from-claude"
  }
}
```

**Error:**
```json
{
  "type": "session.output",
  "sessionId": "sess_abc123",
  "data": {
    "type": "error",
    "message": "Process timed out after 300000ms"
  }
}
```

**Input request:**
```json
{
  "type": "session.output",
  "sessionId": "sess_abc123",
  "data": {
    "type": "input_request",
    "question": "Should I proceed with the destructive operation?",
    "options": ["yes", "no"]
  }
}
```

**Scope:** Session-scoped

### Message Events

#### message.created

A new message was persisted (user or assistant).

```json
{
  "type": "message.created",
  "message": {
    "id": "msg_abc123",
    "sessionId": "sess_abc123",
    "role": "user",
    "content": "Fix the login bug",
    "createdAt": 1710900000000,
    "toolCall": null
  }
}
```

**Scope:** Session-scoped

### Project Events

#### project.created

```json
{
  "type": "project.created",
  "project": {
    "id": "proj_xyz",
    "name": "my-app",
    "directory": "/home/user/projects/my-app",
    "categoryId": null,
    "logChannelId": null,
    "personality": null,
    "config": {},
    "isArchived": false,
    "createdAt": 1710900000000,
    "updatedAt": 1710900000000
  }
}
```

**Scope:** Global (all clients)

#### project.updated

```json
{
  "type": "project.updated",
  "project": { /* ProjectLocation */ }
}
```

**Scope:** Global

### Task Events

#### task.created

```json
{
  "type": "task.created",
  "task": {
    "id": "task_xyz",
    "title": "Fix authentication flow",
    "description": "Users can't log in after password reset",
    "status": "backlog",
    "priority": "high",
    "agent": null,
    "sessionId": null,
    "projectName": "my-app",
    "output": null,
    "createdAt": 1710900000000,
    "startedAt": null,
    "completedAt": null,
    "updatedAt": 1710900000000
  }
}
```

**Scope:** Global

#### task.updated

```json
{
  "type": "task.updated",
  "task": { /* TaskRecord */ }
}
```

**Scope:** Global

### System Events

#### system.health

Resource utilization snapshot. Broadcast every 15 seconds.

```json
{
  "type": "system.health",
  "data": {
    "cpu": 25.4,
    "memory": 68.2,
    "disk": 45.0,
    "uptime": 86400
  }
}
```

**Scope:** Global | **Frequency:** Every 15s

#### system.status

Full application status. Broadcast every 60 seconds.

```json
{
  "type": "system.status",
  "data": {
    "projects": 10,
    "sessions": 50,
    "activeSessions": 3,
    "tasks": {
      "backlog": 5,
      "in_progress": 2,
      "review": 1,
      "done": 12
    },
    "health": {
      "cpu": 25.4,
      "memory": 68.2,
      "disk": 45.0,
      "uptime": 86400
    }
  }
}
```

**Scope:** Global | **Frequency:** Every 60s

#### system.error

System-level error.

```json
{
  "type": "system.error",
  "data": {
    "source": "claude-provider",
    "message": "Process crashed with exit code 1",
    "severity": "error"
  }
}
```

**Scope:** Global | **Frequency:** On error

---

## Example Message Flow

### Typical Chat Interaction

```
Client                              Server
  |                                    |
  |-- subscribe(sess_abc123) --------> |
  |                                    |
  |-- session.message ----------------> |
  |   { sessionId, content }           |
  |                                    |
  | <--- session.status (active) ----- |
  | <--- message.created (user) ------ |
  |                                    |
  | <--- session.output (thinking) --- |
  | <--- session.output (text) ------- |
  | <--- session.output (tool_use) --- |
  | <--- session.output (tool_result)  |
  | <--- session.output (text) ------- |
  | <--- session.output (done) ------- |
  |                                    |
  | <--- message.created (assistant) - |
  | <--- session.status (idle) ------- |
  |                                    |
```

### Session Creation Flow

```
Client                              Server
  |                                    |
  |-- session.create -----------------> |
  |   { directory, name, provider }    |
  |                                    |
  | <--- session.created ------------- |
  | <--- project.created ------------- |  (if new project)
  |                                    |
  |-- subscribe(new_session_id) -----> |
  |                                    |
  |-- session.message ----------------> |
  |   { sessionId, content }           |
  |                                    |
  | <--- session.output events ------> |
  |        ... streaming ...           |
```

---

## Reconnection Strategy

The web client implements exponential backoff with jitter:

```
Attempt 1: wait 1s  + random(0-500ms)
Attempt 2: wait 2s  + random(0-500ms)
Attempt 3: wait 4s  + random(0-500ms)
Attempt 4: wait 8s  + random(0-500ms)
Attempt 5: wait 16s + random(0-500ms)
...
Max wait: 30s + random(0-500ms)
```

On reconnect:
1. Re-establish WebSocket connection
2. Re-subscribe to previously tracked session IDs
3. Fetch latest state via REST API to sync any missed events

---

## Event Constants

```typescript
const WS_EVENTS = {
  SESSION_OUTPUT:  "session.output",
  SESSION_STATUS:  "session.status",
  SESSION_CREATED: "session.created",
  SESSION_UPDATED: "session.updated",
  SESSION_CLOSED:  "session.closed",
  MESSAGE_CREATED: "message.created",
  PROJECT_CREATED: "project.created",
  PROJECT_UPDATED: "project.updated",
  TASK_CREATED:    "task.created",
  TASK_UPDATED:    "task.updated",
  SYSTEM_HEALTH:   "system.health",
  SYSTEM_STATUS:   "system.status",
  SYSTEM_ERROR:    "system.error",
};
```

## ToolCall Kinds

Tool calls in `session.output` events use a `kind` field for styling:

| Kind | Color | Description |
|------|-------|-------------|
| `read` | Blue | File read operations |
| `edit` | Amber | File edit operations |
| `write` | Purple | File write operations |
| `bash` | Green | Shell command execution |
| `search` | Blue | Code search operations |
| `done` | Green | Task completion |
| `error` | Rose | Error occurred |
| `thinking` | Gray | Extended thinking |
| `generic` | Gray | Other tool types |
