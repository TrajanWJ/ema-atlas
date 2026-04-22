# Lasso claude-hooks

> Prompt injection defense — scans tool outputs for 50+ injection patterns in real-time.

## Quick Info

| Field | Value |
|---|---|
| **GitHub** | [lasso-security/claude-hooks](https://github.com/lasso-security/claude-hooks) |
| **By** | Lasso Security |
| **Hook** | PostToolUse |

## Why This Matters

Indirect prompt injection is the #1 attack vector against coding agents. Malicious READMEs, package docs, or web content can hijack Claude's behavior. This scans everything Claude reads.

## What It Detects (50+ patterns)

- Instruction overrides ("ignore previous instructions")
- Role-playing / DAN jailbreaks
- Encoding/obfuscation (Base64, leetspeak, homoglyphs)
- Context manipulation
- Instruction smuggling in HTML comments and code comments

## Design Philosophy

**Warns rather than blocks.** Claude with a warning makes better decisions than a blunt block. Reduces false positives.

## Install

```bash
git clone https://github.com/lasso-security/claude-hooks
cd claude-hooks
# Run installer — copies hook files to .claude/ directories
```

## Alternatives

| Tool | Approach |
|---|---|
| **NOVA Tracer** ([nova-claude-code-protector](https://github.com/fr0gger/nova-claude-code-protector)) | 3-tier scanning (keyword + ML + LLM), HTML reports |
| **Parry** | Early-stage, less mature |

## Priority

**HIGH** — Real security protection. Install alongside [[Dippy]].

## See Also

- [[Dippy]] — auto-approve (complementary)
- [[Claude Code Configuration]]

#claude-code #security #hooks #prompt-injection #essential
