# Hermes API Contract for Alfred / ClaudeForge

**Generated**: 2026-04-20
**Purpose**: Exact request/response contract examples for wiring ClaudeForge's Discord bot and server to Hermes backend
**Mode**: Spec contract document

## Scope

This document defines the HTTP and streaming contract Alfred / ClaudeForge should use when talking to Hermes as a backend provider.

It assumes:
- ClaudeForge remains the Discord-facing bot
- Hermes runs as backend API server
- provider session continuity is tracked with `X-Hermes-Session-Id`

---

## 1. Base transport assumptions

### Endpoint family
Hermes API server exposes OpenAI-compatible chat endpoints, including:
- `POST /v1/chat/completions`

### Recommended base URL
```text
http://127.0.0.1:<port>
```

### Recommended env on ClaudeForge side
```env
HERMES_BASE_URL=http://127.0.0.1:8000
HERMES_API_KEY=
```

Adjust port to your actual Hermes API server config.

---

## 2. Session identity model

ClaudeForge must track two session identities:

### Local identity
- `SessionRecord.id`
- owned by ClaudeForge
- bound to Discord channel / project routing

### Remote identity
- `SessionRecord.providerSessionId`
- owned by Hermes
- read from `X-Hermes-Session-Id`
- sent back on follow-up calls for continuity

### Rule
Never replace ClaudeForge local session ID with Hermes provider session ID.

---

## 3. First request contract

## Request

### HTTP
```http
POST /v1/chat/completions HTTP/1.1
Content-Type: application/json
Authorization: Bearer <HERMES_API_KEY>   # if configured
```

### Body
```json
{
  "model": "gpt-5.4",
  "stream": true,
  "messages": [
    {
      "role": "system",
      "content": "You are operating inside ClaudeForge. Respond for Discord. Keep answers chunk-safe and tool-driven."
    },
    {
      "role": "user",
      "content": "Review the auth flow in this repo and tell me what's broken."
    }
  ]
}
```

### Notes
- ClaudeForge may choose the model or omit it and let Hermes defaults win.
- System prompt here is ephemeral and should layer on top of Hermes core system behavior.
- `stream: true` is recommended for Discord UX.

## Response

### HTTP headers
Hermes should return:
```http
X-Hermes-Session-Id: hermes-session-abc123
Content-Type: text/event-stream
```

### ClaudeForge action
- read `X-Hermes-Session-Id`
- store it in `session.providerSessionId`
- emit local provider event:
```ts
{ type: "session_init", providerSessionId: "hermes-session-abc123" }
```

---

## 4. Follow-up request contract

## Request

### HTTP
```http
POST /v1/chat/completions HTTP/1.1
Content-Type: application/json
Authorization: Bearer <HERMES_API_KEY>
X-Hermes-Session-Id: hermes-session-abc123
```

### Body
```json
{
  "model": "gpt-5.4",
  "stream": true,
  "messages": [
    {
      "role": "user",
      "content": "Now fix it with the smallest safe patch."
    }
  ]
}
```

### Notes
- On continuation requests, ClaudeForge can send only the latest user turn.
- Hermes will recover conversation state from its own session storage using the header.
- This is better than replaying the full chat history every time.

---

## 5. Streaming content contract

Hermes emits SSE.

### Example text chunk
```text
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"content":"I found the issue in the refresh-token path."},"finish_reason":null}]}
```

### ClaudeForge mapping
Convert to:
```ts
{ type: "text", content: "I found the issue in the refresh-token path." }
```

### Rule
Every non-empty `delta.content` becomes a `text` provider event.

---

## 6. Tool progress contract

Hermes API server may emit custom SSE event type:

```text
event: hermes.tool.progress
data: {"tool":"read_file","emoji":"📖","label":"read_file: src/auth.ts"}
```

### ClaudeForge v1 mapping
Map this to synthetic `tool_use`:

```ts
{
  type: "tool_use",
  tool: "read_file",
  input: "",
  toolCall: {
    id: "synthetic-read_file-1",
    kind: "read",
    tool: "read_file",
    title: "read_file: src/auth.ts",
    input: ""
  }
}
```

### Kind inference rule
Suggested mapping:
- `read_*`, `search_*`, `browser_snapshot` -> `read` or `search`
- `write_*`, `patch`, `edit_*` -> `edit` or `write`
- `terminal`, `process`, `execute_code` -> `bash`
- unknown -> `generic`

### v1 limitation
This event is progress-only. It should not be treated as a guaranteed completed tool result.

---

## 7. Tool result contract (future-friendly)

### Current reality
Hermes API server does not currently expose a structured tool-result SSE event in the same shape ClaudeForge expects.

### v1 rule
ClaudeForge should:
- render tool-progress as tool-use cards
- allow final assistant text to communicate actual outcome
- skip `tool_result` if no structured tool-completion event exists

### Future desired event
If Hermes is extended later, a good shape would be:

```text
event: hermes.tool.result
data: {
  "tool":"read_file",
  "label":"read_file: src/auth.ts",
  "output":"lines 12-50 read",
  "is_error":false
}
```

Which ClaudeForge could map to:

```ts
{
  type: "tool_result",
  tool: "read_file",
  output: "lines 12-50 read",
  toolCall: { ... },
  isError: false
}
```

---

## 8. Finish contract

### Example finish chunk
```text
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}
```

### Then terminal marker
```text
data: [DONE]
```

### ClaudeForge mapping
Emit:
```ts
{ type: "done", sessionId: "<local-session-id>" }
```

Optionally include cost later if Hermes exposes it at this layer.

---

## 9. Non-streaming fallback contract

If ClaudeForge ever needs non-streaming fallback:

## Request
```http
POST /v1/chat/completions
Content-Type: application/json
Authorization: Bearer <HERMES_API_KEY>
X-Hermes-Session-Id: hermes-session-abc123
```

```json
{
  "model": "gpt-5.4",
  "stream": false,
  "messages": [
    { "role": "user", "content": "Summarize what you changed." }
  ]
}
```

## Response
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "model": "gpt-5.4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I updated the refresh-token validation path and added a null guard."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

### ClaudeForge mapping
- emit one `text` event with full content
- then emit `done`

---

## 10. Error contract

### HTTP error example
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "error": {
    "message": "Internal server error: backend unavailable",
    "type": "server_error"
  }
}
```

### ClaudeForge mapping
```ts
{ type: "error", message: "Internal server error: backend unavailable" }
```

### Rule
All HTTP non-2xx, parse errors, and SSE transport failures must become explicit `error` events, never silent session stalls.

---

## 11. Abort contract

### v1 behavior
ClaudeForge abort should cancel the active HTTP request using `AbortController`.

### Important limitation
That only guarantees the ClaudeForge-side request stops listening. It may not hard-stop the Hermes backend unless Hermes exposes dedicated cancellation.

### UI rule
Present abort as:
- "stop current response"

not as:
- "kill backend session forever"

until stronger backend semantics exist.

---

## 12. Minimal provider event mapping summary

ClaudeForge provider layer should produce exactly this mapping in v1:

| Hermes API thing | ClaudeForge event |
|---|---|
| `X-Hermes-Session-Id` | `session_init` |
| `delta.content` SSE chunk | `text` |
| `event: hermes.tool.progress` | synthetic `tool_use` |
| stream end | `done` |
| HTTP/SSE failure | `error` |

---

## 13. Example full flow

## Step 1 — Discord user sends message
```text
please inspect the failing auth refresh logic
```

## Step 2 — ClaudeForge session exists locally
```ts
session.id = "local-123"
session.provider = "hermes"
session.providerSessionId = null
```

## Step 3 — ClaudeForge sends first Hermes request
```http
POST /v1/chat/completions
```

## Step 4 — Hermes responds with header
```http
X-Hermes-Session-Id: hermes-abc
```

## Step 5 — ClaudeForge stores it
```ts
session.providerSessionId = "hermes-abc"
```

## Step 6 — Hermes streams
```text
event: hermes.tool.progress
data: {"tool":"read_file","emoji":"📖","label":"read_file: src/auth.ts"}

data: {"id":"...","choices":[{"delta":{"content":"The bug is in the null refresh token path."},"finish_reason":null}]}

data: [DONE]
```

## Step 7 — ClaudeForge emits provider events
```ts
{ type: "session_init", providerSessionId: "hermes-abc" }
{ type: "tool_use", ...synthetic tool card... }
{ type: "text", content: "The bug is in the null refresh token path." }
{ type: "done", sessionId: "local-123" }
```

## Step 8 — Next Discord message reuses remote session
```http
X-Hermes-Session-Id: hermes-abc
```

---

## 14. Final boundary rule

The contract only stays sane if this remains true:

> ClaudeForge owns Discord session topology and local session identity.
> Hermes owns backend conversational/runtime continuity.

That is the entire trick.