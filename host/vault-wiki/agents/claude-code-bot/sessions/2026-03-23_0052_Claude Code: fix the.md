---
type: knowledge
wiki_id: agents/claude-code-bot/sessions/2026-03-23_0052_Claude_Code__fix_the
imported_from: 'vault/Claude-Code-Bot/sessions/2026-03-23_0052_Claude Code: fix the.md'
imported_at: '2026-04-04T00:23:56.805Z'
tags: []
summary: ''
---
# Claude Code Session — 2026-03-23_0052

**Channel:** #Claude Code: fix the Claude code tokens on account
**Prompt:** ⚠️ Agent failed before reply: All models failed (3): anthropic/claude-sonnet-4-6: OAuth token refresh failed for anthropic: Failed to refresh OAuth token for anthropic. Please try again or re-authenti
**Duration:** 303s
**Tools used:** 43

## Tool calls
- Bash: {"command": "openclaw logs --tail 20 2>&1 | tail -30", "description": "Check recent OpenClaw logs fo
- Bash: {"command": "cat /home/trajan/.openclaw/litellm_config.yaml 2>/dev/null | head -80", "description": 
- Bash: {"command": "claude auth status 2>&1", "description": "Check Claude CLI auth status"}
- Bash: {"command": "openclaw logs 2>&1 | tail -30", "description": "Check OpenClaw logs"}
- Bash: {"command": "ls /home/trajan/.openclaw/ 2>/dev/null", "description": "List openclaw directory conten
- Bash: {"command": "which openclaw && openclaw --help 2>&1 | head -20", "description": "Check openclaw CLI 
- Bash: {"command": "openclaw provider list 2>&1 || openclaw model list 2>&1 || openclaw config show 2>&1 | 
- Bash: {"command": "cat /home/trajan/.openclaw/openclaw.json | python3 -c \"import sys,json; d=json.load(sy
- Bash: {"command": "openclaw models 2>&1 | head -40", "description": "List available models"}
- Bash: {"command": "cat /home/trajan/.openclaw/openclaw.json | python3 -c \"\nimport sys, json\nd = json.lo
- Bash: {"command": "openclaw models test 2>&1 | head -30", "description": "Test model connectivity"}
- Bash: {"command": "# Quick test: hit the anthropic API with the token to verify it works\ncurl -s -o /dev/
- Bash: {"command": "# Check the token type - it's an OAuth token (oat), let's test with correct model name\
- Bash: {"command": "# Try with correct model ID\ncurl -s -w \"\\n%{http_code}\" -H \"x-api-key: $(cat /home
- Bash: {"command": "# Just test auth with a known model\ncurl -s -w \"\\n%{http_code}\" -H \"x-api-key: $(c
- Bash: {"command": "# Check the actual models.json to see what's configured\ncat /home/trajan/.openclaw/age
- Bash: {"command": "cat /home/trajan/.openclaw/agents/main/agent/models.json 2>&1 | python3 -c \"\nimport s
- Bash: {"command": "# Check the OAuth profiles\ncat /home/trajan/.openclaw/agents/main/agent/auth-profiles.
- Bash: {"command": "cat /home/trajan/.openclaw/agents/main/agent/auth-profiles.json 2>&1 | python3 -c \"\ni
- Bash: {"command": "cat /home/trajan/.openclaw/agents/main/agent/auth-profiles.json | python3 -c \"\nimport
- ... and 23 more

## Result
Done. The OAuth tokens have been fixed across all 12 OpenClaw agents. The root cause was that only `main` had its tokens refreshed earlier — the other 11 agents were still running with expired OAuth tokens (60-155 hours old) and revoked static API keys.
