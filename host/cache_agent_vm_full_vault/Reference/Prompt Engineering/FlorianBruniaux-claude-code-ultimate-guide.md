---
tags: [prompt-engineering, claude-code, education, security, comprehensive-guide]
summary: "⭐ **Comprehensive Production Guide** — 6 months of daily practice distilled into a guide that teaches you the WHY, not just the what."
source: https://github.com/FlorianBruniaux/claude-code-ultimate-guide
category: Educational Resources
date: 2026-03-16
status: active
confidence: 0.80
confidence_updated: 2026-03-18
stars: High (22k+ lines documentation)
type: reference
updated: 2026-03-16
created: 2026-03-16
title: "FlorianBruniaux-claude-code-ultimate-guide"
---

# FlorianBruniaux/claude-code-ultimate-guide

⭐ **Comprehensive Production Guide** — "6 months of daily practice distilled into a guide that teaches you the WHY, not just the what."

## Overview

The most thorough Claude Code educational resource available. Unlike config-focused repos, this guide emphasizes understanding trade-offs, mental models, and security-first development.

### Key Differentiators

- **Educational Depth** — 22K+ lines across 16 specialized guides
- **Security-First** — Only guide with systematic threat tracking (24 CVEs, 655 malicious skills)
- **Interactive Learning** — 271-question quiz with skill profiles
- **Visual Architecture** — 41 Mermaid diagrams covering internal mechanics
- **Methodology Integration** — Complete TDD/SDD/BDD workflows

## Repository Structure

```
📦 claude-code-ultimate-guide/
├─ 📖 guide/               # Core documentation (22K+ lines)
│  ├─ ultimate-guide.md    # Complete reference
│  ├─ cheatsheet.md        # 1-page printable
│  ├─ architecture.md      # Internal mechanics
│  ├─ methodologies.md     # TDD/SDD/BDD workflows
│  └─ diagrams/           # 41 Mermaid diagrams
├─ 📋 examples/            # 218 production templates
│  ├─ agents/             # 9 custom personas
│  ├─ commands/           # 26 slash commands
│  ├─ hooks/              # 31 hooks (security-focused)
│  └─ skills/             # 14 skills
├─ 🧠 quiz/                # 271 questions, 4 profiles
├─ 🔧 tools/               # Interactive utilities
├─ 🤖 machine-readable/    # AI-optimized index
└─ 📚 docs/               # 115 resource evaluations
```

## Extracted Patterns & Templates

### 1. Agent Templates
- **Code Reviewer** — 6-aspect deep analysis with security focus
- **Test Writer** — TDD-driven test generation
- **Security Auditor** — OWASP compliance checking
- **Refactoring Specialist** — Code restructuring with complexity reduction
- **Output Evaluator** — Self-critique and confidence gates
- **DevOps SRE** — Infrastructure monitoring and incident response

### 2. Security-First Patterns
- **Threat Database** — 24 CVE-mapped vulnerabilities
- **Malicious Skill Detection** — 655 catalogued attack patterns
- **Production [[Hardening]]** — MCP vetting workflows
- **Unicode Injection Scanner** — Hidden character detection
- **Secrets Scanner** — API key/token prevention
- **Dangerous Actions Blocker** — rm -rf, force-push protection

### 3. Orchestration Strategies
- **Progressive Disclosure** — Skills-as-context layers
- **Context Engineering** — 4-layer context model
- **Multi-Agent Coordination** — 3 topologies (parallel, sequential, hierarchical)
- **Master Loop Architecture** — Tool orchestration flow
- **Permission Modes** — Security boundary management

### 4. Methodology Workflows
- **TDD with Claude** — Red-Green-Refactor + AI collaboration
- **Specification-Driven Development** — Design-before-code approach
- **Behavior-Driven Development** — User stories → tests
- **Get Shit Done (GSD)** — Pragmatic delivery mode

### 5. Production Deployment Patterns
- **CI/CD Integration** — Pipeline automation
- **Observability Setup** — Cost tracking, session monitoring
- **Agent Teams** — Multi-instance coordination
- **Trinity Pattern** — Advanced workflows for complex projects

## Security Intelligence Database

### CVE Categories (24 total)
- **Code/Command Injection** (5 CVEs) — CLI bypass, exec vulnerabilities
- **Path Traversal** (4 CVEs) — Symlink escape, prefix bypass
- **RCE & Prompt Hijacking** (4 CVEs) — MCP RCE, session hijacking
- **SSRF & DNS Rebinding** (4 CVEs) — WebFetch attacks, DNS manipulation

### Malicious Skill Patterns (655 catalogued)
- Unicode injection (zero-width, RTL override)
- Hidden instructions in comments
- Auto-execute patterns
- Data exfiltration attempts

### Production Safety Hooks
- `dangerous-actions-blocker.sh` — Block destructive commands
- `prompt-injection-detector.sh` — Scan for injection patterns
- `unicode-injection-scanner.sh` — Detect hidden Unicode
- `output-secrets-scanner.sh` — Prevent credential leakage

## Interactive Learning System

### Quiz Structure (271 questions)
- **Profiles**: Junior, Senior, Power User, Product Manager
- **Categories**: Setup, Agents, MCP, Trust, Advanced Patterns
- **Features**: Instant feedback, doc links, weak area identification

### Assessment Framework
Systematic 5-point scoring of external resources:
- Technical accuracy validation
- Challenge phase for objectivity
- Integration recommendations with trade-offs
- Evidence-based recommendations

## Key Insights for Our System

### 1. Context Management Principles
```
0-50%:  Work freely
50-70%: Pay attention
70-90%: /compact required
90%+:   /clear mandatory
```

### 2. Agent Delegation Rules
- **Single domain task** → Spawn specialist
- **Two domains** → Coordinate directly  
- **3+ domains** → Escalate to orchestrator
- **Complex orchestration** → Multi-agent coordination

### 3. Security Hardening Checklist
```bash
# 5-minute MCP audit
1. Provenance check (GitHub verified, 100+ stars)
2. Code review (minimal privileges, no obfuscation)
3. Permission audit (whitelist-only filesystem)
4. Sandbox testing (Docker isolation first)
5. Monitoring setup (session logs, error tracking)
```

### 4. Self-Learning Protocol
- Track preferences → Update vault
- Pattern recognition (3+ signals) → Update prompts
- Context evolution → Bake learnings into SOUL.md
- Evidence-based adaptation → Not just memory

## Integration Opportunities

### For Our Agent Templates
- LangGPT structure + security patterns from this guide
- Progressive disclosure for context management
- Self-critique patterns for output quality
- Multi-agent handoff protocols

### For Security System
- Import threat database patterns
- Implement MCP vetting workflow
- Add Unicode injection scanning
- Deploy production safety hooks

### For Orchestration
- Adopt Trinity pattern for complex workflows
- Implement context compression strategies
- Use agent coordination topologies
- Deploy systematic delegation rules

## Production Readiness Score: 9/10

**Strengths**: Comprehensive, security-focused, educational depth, production-tested patterns
**Gaps**: Repository size can be overwhelming, need to extract specific patterns for our context
**Recommendation**: Extract key patterns into our agent templates and security systems
## Related

- [[README]]
