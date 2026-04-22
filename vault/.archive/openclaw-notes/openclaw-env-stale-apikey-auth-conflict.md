---
title: "Stale ANTHROPIC_API_KEY in ~/.openclaw/.env Overrides Claude CLI OAuth"
created: 2026-03-27
updated: 2026-03-27
type: bug-pattern
status: resolved
severity: high
tags: [dispatch, auth, oauth, api-key, claude-cli, openclaw, debugging]
---

# Stale ANTHROPIC_API_KEY in ~/.openclaw/.env Overrides Claude CLI OAuth

> **Impact:** All dispatched agent tasks fail with `{"type":"authentication_error","message":"invalid x-api-key"}` despite oauth-guardian running and tokens looking valid.

## The Bug

`~/.openclaw/.env` contains a hardcoded `ANTHROPIC_API_KEY`. When OpenClaw loads this file into the shell environment, the Claude CLI sees `ANTHROPIC_API_KEY` in the env and uses it **instead of** its own fresh OAuth token from `~/.claude/.credentials.json`.

The stale env key expires. oauth-guardian refreshes tokens into `.claude/.credentials.json` and `~/.dispatch-env`, but it does **not** touch `~/.openclaw/.env`. That file becomes an unmanaged, unsynchronized auth source that silently poisons every Claude CLI invocation.

### Symptoms

- Dispatch tasks fail with `401 authentication_error` / `invalid x-api-key`
- `claude --print ...` calls inside scripts fail even though `openclaw` itself is working fine
- oauth-guardian logs show successful refreshes, but agents still can't auth
- The error appears in batches after token expiry window

### Diagnosis

```bash
# Check if openclaw/.env has a hardcoded key
grep ANTHROPIC_API_KEY ~/.openclaw/.env

# Check what key Claude CLI is actually using
echo $ANTHROPIC_API_KEY

# Compare to what oauth-guardian last wrote
cat ~/.dispatch-env | grep ANTHROPIC_API_KEY
```

If `$ANTHROPIC_API_KEY` in the env doesn't match `~/.dispatch-env`, the `.env` file has overridden it.

## The Fix

Comment out or remove Anthropic API keys from `~/.openclaw/.env`:

```bash
# In ~/.openclaw/.env, change:
# ANTHROPIC_API_KEY=sk-ant-...   (old, stale, unmanaged)
# to:
# # ANTHROPIC_API_KEY=sk-ant-...  (commented out — managed by oauth-guardian)
```

**Auth source ownership:**
| Source | Managed By | Used By |
|---|---|---|
| `~/.claude/.credentials.json` | Claude CLI / oauth-guardian | `claude` CLI directly |
| `~/.dispatch-env` | oauth-guardian | Shell scripts, dispatch engine |
| `~/.openclaw/.env` | **Nobody** — do not store API keys here | Everything OpenClaw loads |

## Why This Happens

oauth-guardian was written to sync tokens to OpenClaw configs and `~/.dispatch-env`. `~/.openclaw/.env` was added separately at some point to provide env vars to OpenClaw's shell context. When an API key landed there (possibly from a wizard or manual setup), it became a third auth source with no manager.

Token rotation doesn't help because the env var takes precedence over the credential file.

## Prevention

- Never store `ANTHROPIC_API_KEY` in `~/.openclaw/.env`
- If dispatch tasks start failing with auth errors, check this file first
- After any OpenClaw wizard or doctor run, verify `~/.openclaw/.env` doesn't have newly-written API keys

## Session Reference

- Session `11f44e7b` (2026-03-18) — root cause identified and resolved during batch dispatch failure debugging

## Related

- [[oauth-guardian]] — Token refresh and sync manager
- [[dispatch-engine]] — Uses Claude CLI for agent tasks
- [[Agent-Learnings/patterns]] — Other operational patterns
