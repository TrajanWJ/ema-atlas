---
name: Auto-find or create session
description: When a conversation starts without an active session, find the most recent session or create a new one automatically
type: feedback
last_used: 2026-03-20
---

Always ensure there's an active session. If a chat starts with no session context, find the most recent existing session or create a new one — don't wait for the user to ask.

**Why:** The user wants seamless session continuity without having to manually manage session lifecycle every time.

**How to apply:** At conversation start, check for existing sessions (e.g., via engram or session files). If one exists and is recent, resume it. If not, create a new one. Never operate session-less.
