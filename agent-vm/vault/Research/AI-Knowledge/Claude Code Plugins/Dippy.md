# Dippy

> Smart auto-approve for Claude Code — eliminates permission fatigue without disabling safety.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [ldayton/Dippy](https://github.com/ldayton/Dippy) |
| **Stars** | 59 |
| **Version** | v0.2.6 (Mar 2026) |
| **License** | MIT |
| **Parser** | Parable (custom recursive descent, pure Python, zero deps, 14,000+ tests) |

## Why This Matters

Every permission prompt breaks Claude's flow and costs tokens on the re-prompt. Dippy auto-approves safe, read-only operations while blocking destructive ones — without using `--dangerously-skip-permissions`.

## How It Works

AST-based parsing via Parable that actually understands shell:
- Knows `awk '{print $2}'` is safe but `awk '{print > "file"}'` writes files (unsafe)
- Correctly handles pipelines, subshells, command substitution, here-docs, redirects
- **Deny messages steer Claude:** e.g., `deny python "Use uv run python"` blocks AND tells Claude why, so it self-corrects without wasting turns

## Install

**Homebrew (recommended):**
```bash
brew tap ldayton/dippy
brew install dippy
```

**Manual:**
```bash
git clone https://github.com/ldayton/Dippy.git
```

### Configure as PreToolUse hook (`~/.claude/settings.json`)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "dippy" }]
      }
    ]
  }
}
```

For manual installations, use full path: `/path/to/Dippy/bin/dippy-hook`

## Configuration

Dippy reads rules from two locations:
- `~/.dippy/config` — global settings
- `.dippy` — project-specific rules

### Rule Syntax

```
deny python "Use uv run python, which runs in project environment"
deny rm -rf "Use trash instead"
deny-redirect **/.env* "Never write secrets, ask me to do it"
```

| Rule Type | Purpose |
|---|---|
| `deny [command] "[message]"` | Block specific commands with guidance text |
| `deny-redirect [pattern] "[message]"` | Prevent file writes matching a pattern |

## Uninstall

Remove the hook from `~/.claude/settings.json`, then:
```bash
brew uninstall dippy
```

## Installation Status (verified 2026-04-13)

**NOT INSTALLED.** `~/Dippy/` directory does not exist. `dippy` binary not on PATH.

**Functional replacement:** `~/bin/chop hook` (PreToolUse[Bash]) handles command safety/monitoring. The `deny-redirect` and `deny` semantics from Dippy are partially covered by `~/.claude/hooks/safety-check.sh` (blocks destructive `rm` patterns).

To install Dippy and replace `chop`, follow the Install section above and update `~/.claude/settings.json` hooks.

## Gotchas

- **7 open issues** — small but actively maintained project
- Full docs on the [Dippy Wiki](https://github.com/ldayton/Dippy/wiki)

## Priority

**HIGH** — Immediate quality-of-life improvement, zero risk. Install first.

## See Also

- [[Lasso claude-hooks]] — security scanning (complementary)
- [[Claude Code Configuration]]

#claude-code #hooks #safety #auto-approve #essential
