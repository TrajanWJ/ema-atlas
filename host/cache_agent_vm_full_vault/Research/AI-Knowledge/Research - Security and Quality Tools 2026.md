# Research - Security and Quality Tools 2026

> Comprehensive research into security scanning, testing, code quality, type safety, and performance monitoring tools for a Next.js 16 / React 19 / TypeScript stack. Conducted 2026-03-11.
> **Last reviewed:** 2026-04-12 — All tool recommendations and security advisories remain current. No major new CVEs or tool releases since original research.

Related: [[Tool Recommendations]], [[Security Standards]], [[Testing Philosophy]], [[Coding Standards]], [[My Stack Decisions]]

---

## 1. Security Scanning Landscape

### Claude Code Security (Anthropic, Feb 2026)

Anthropic launched **Claude Code Security** as a built-in capability that scans codebases for vulnerabilities. Unlike traditional SAST tools that match patterns, it reasons about code semantically — tracing data flows, understanding component interactions, and flagging issues that rule-based tools miss.

Key differentiators:
- Multi-stage verification process filters false positives
- Severity ratings for prioritization
- Available as a [GitHub Action](https://github.com/anthropics/claude-code-security-review) for PR-level scanning
- Caveat: not hardened against prompt injection in the PR content itself. Only review trusted PRs

Snyk's [analysis](https://snyk.io/articles/anthropic-launches-claude-code-security/) called this "great news for the industry" — AI-powered scanning complements rather than replaces traditional tools.

### Semgrep vs Snyk (2026 Comparison)

| Dimension | Semgrep | Snyk |
|-----------|---------|------|
| **Origin** | SAST pattern engine, expanded to SCA | SCA tool, added SAST later |
| **TypeScript support** | Strong. JS/TS-specific rulesets | Strong. Language-specific advisories |
| **Speed** | Fast local scans | Cloud-first, slower locally |
| **Pricing** | Generous free tier (Community) | Free tier limited, enterprise focus |
| **Rule authoring** | Write custom rules in YAML (powerful) | Less flexible custom rules |
| **CI integration** | GitHub Actions, GitLab CI, any CI | Deep GitHub/GitLab/Bitbucket integration |

**Recommendation**: Semgrep for SAST (custom rules, free tier, local speed). Snyk if you need SCA with vulnerability database depth. Both can run in CI.

### Socket.dev — Supply Chain Defense

The npm ecosystem faced major attacks in early 2026:
- **SANDWORM_MODE**: 19 typosquatting packages with worm-like self-propagation
- **UNC6426**: nx package compromise led to full cloud environment breach in 72 hours
- **AI-assisted supply chain abuse**: Malicious intent expressed in natural-language prompts rather than explicit code, complicating detection

Socket scores packages across five categories (Supply Chain Security, Vulnerability, Quality, Maintenance, License). It detects install scripts, obfuscated code, new maintainer accounts, and AI-assisted attacks. The npm registry now links to Socket analysis directly on package pages.

**Verdict**: Essential for any team using npm. The GitHub App provides automatic PR scanning when new dependencies are added.

### ESLint Security Plugins

- `eslint-plugin-security` — Detects common Node.js security anti-patterns
- Semgrep's registry includes ESLint-equivalent security rulesets, runnable without ESLint config

If using Biome as primary linter, Semgrep covers the security rules that Biome lacks.

---

## 2. Testing AI-Generated Code

### The Problem

AI-generated code introduces non-deterministic concerns. Teams must validate behavioral consistency and safety, not just syntactic correctness. Traditional "write test, write code" flips to "AI writes code, human validates with tests."

### Vitest in 2026

Vitest has emerged as the standard for new projects:
- 10-20x faster than Jest on large codebases
- Native ESM support (no transforms needed)
- Browser-native testing mode (experimental but maturing)
- Built-in coverage with v8 provider
- Vite-powered HMR for watch mode

Jest 30 is catching up with browser-native testing, but Vitest's Vite integration makes it the natural choice for Next.js/Vite projects.

### Testing Strategy for AI-Assisted Development

| Practice | Why It Matters |
|----------|---------------|
| Write behavior specs as comments first | Grounds AI output in intent |
| Treat AI-generated tests as first drafts | AI tests often test implementation, not behavior |
| Use `vitest related --run` in pre-commit | Only runs tests for changed files |
| Ask AI for missing edge cases, implement yourself | AI finds gaps, you ensure understanding |
| Mutation testing validates test quality | Confirms tests catch real failures, not just pass |
| Never trust AI-generated mocks blindly | Verify mocks match real API contracts |

### Playwright Component Testing (2026)

Playwright's component testing is still marked experimental but actively developed. Key patterns:
- Role-based selectors (accessibility tree, not DOM structure) for resilience
- Auto-waiting eliminates flaky tests
- Cross-browser by default
- Component isolation without full app bootstrap

Best for: Critical interactive components (forms, modals, data tables) that need cross-browser validation. Use Vitest + RTL for the bulk of component tests.

---

## 3. Code Quality Automation

### The Three Contenders

| Tool | Written In | Speed vs ESLint | Formatting | Type-Aware | Maturity |
|------|-----------|-----------------|------------|------------|----------|
| **ESLint v9** (flat config) | JS | 1x (baseline) | No (needs Prettier) | Yes (via typescript-eslint) | Mature, huge ecosystem |
| **Biome v2** | Rust | ~20x faster | Yes (Prettier-compatible) | Limited (~10 rules) | Stable, growing |
| **Oxlint v1** | Rust | 50-100x faster | No | Yes (via tsgo/TS7) | 1.0 released June 2025 |

### Recommended Combination

**Biome** as the primary tool (lint + format in one pass) with **Oxlint** for type-aware rules that Biome cannot yet perform.

Rationale:
- Biome handles 90% of linting + all formatting in a single binary
- Oxlint's tsgo integration gives type-aware rules at native speed (floating promises, unnecessary assertions)
- ESLint only if you need specific plugins with no Biome/Oxlint equivalent
- Single `biome.json` + `oxlintrc.json` replaces `eslint.config.js` + `.prettierrc` + multiple plugin configs

### Ultracite

[Ultracite](https://www.ultracite.ai/) is a zero-configuration preset that works across ESLint, Biome, and Oxlint. Worth watching if you want a single opinionated config that picks the best tool for each rule.

### What Runs When

| Trigger | Tool | Time Budget |
|---------|------|-------------|
| On save (IDE) | Biome format + Oxlint | < 100ms |
| Pre-commit (staged files) | Biome check + Vitest related | < 5s |
| CI (full repo) | Biome check + Oxlint + Vitest full + Semgrep | < 2min |

---

## 4. Type Safety Patterns

### TypeScript Strict Mode (Maximized)

Beyond `"strict": true`, enable these additional flags:
- `noUncheckedIndexedAccess` — Array/object indexing returns `T | undefined`
- `exactOptionalPropertyTypes` — Distinguishes `undefined` from missing
- `noPropertyAccessFromIndexSignature` — Forces bracket notation for dynamic keys

### ts-reset (Matt Pocock / Total TypeScript)

Fixes TypeScript's built-in types for application code:
- `JSON.parse` returns `unknown` instead of `any`
- `.filter(Boolean)` properly narrows types
- `fetch().json()` returns `unknown` instead of `any`
- `.includes()` works ergonomically on readonly arrays

Zero runtime cost. Just a `.d.ts` import. Should be in every app's `tsconfig`.

### Zod Best Practices for ExecuDeck

| Pattern | Use Case |
|---------|----------|
| `z.strictObject()` | Reject unknown fields at API boundaries |
| `z.safeParse()` over `z.parse()` | Graceful error handling, never throws |
| Colocate schema with route | Schema lives next to the Server Action / API route |
| `z.infer<typeof Schema>` | Single source of truth for types |
| Discriminated unions | `z.discriminatedUnion('type', [...])` for command patterns |
| Transform + default | `z.string().transform(s => s.trim()).default('')` |

### Effect v4 (Evaluate for Future)

Effect provides Rust-style typed error handling: `Effect<Success, Error, Requirements>`. The v4 beta (2026) has a rewritten runtime with smaller bundles and a unified package system.

**Recommendation**: Watch, don't adopt yet. Effect has a steep learning curve and adds significant conceptual overhead. Zod + strict TypeScript covers 90% of type safety needs. Consider Effect for complex async pipelines with many failure modes (e.g., multi-step API orchestration in ExecuDeck command processing).

---

## 5. Performance Monitoring

### Next.js 16.1 Built-in Tools

- **`next analyze`** — Built-in bundle analyzer for Turbopack. Shows server/client modules with full import tracing. No plugin needed
- **`useReportWebVitals`** — Hook for sending Core Web Vitals (LCP, CLS, INP) to any analytics provider
- **Turbopack production builds** — Default since Next.js 16. Faster builds, better tree-shaking, slightly smaller bundles than Webpack

### Lighthouse CI

Automate performance budgets in CI:
```yaml
# GitHub Actions
- name: Lighthouse CI
  run: |
    pnpm lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

Enforce minimum scores for performance (0.9) and accessibility (0.9) on every PR.

### Core Web Vitals (2026)

| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s |
| **INP** (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |

INP replaced FID in March 2024. It measures overall interaction responsiveness throughout the user journey, not just the first interaction.

### Bundle Size Strategy

1. Use `next analyze` to identify large dependencies
2. Dynamic import heavy components: `const Heavy = dynamic(() => import('./Heavy'))`
3. Move server-only code to Server Components (default in App Router)
4. Review Zustand store splitting — avoid importing entire store in components that need one slice

---

## 6. Prompt Injection Defense

### Threat Landscape (2026)

Research across 78 studies (2021-2026) shows attack success rates against state-of-the-art defenses exceed 85% when adaptive strategies are used. This is a hard problem.

### Known Claude Code Vulnerabilities

- **CVE-2026-21852**: Information disclosure in project-load flow. Malicious repos can exfiltrate API keys
- **CVE-2025-59536**: RCE through malicious Hooks, MCP servers, and environment variables in cloned repos

### Defense Layers

| Layer | Tool/Approach | Coverage |
|-------|--------------|----------|
| **Pattern detection** | [[Lasso claude-hooks]] | 50+ injection patterns. PostToolUse. Warns on detection |
| **Command gating** | [[Dippy]] | Auto-approve safe, block destructive |
| **Permission system** | Claude Code built-in | Explicit approval for sensitive operations |
| **Sandboxing** | Claude Code sandboxing | Isolates compromised sessions from system |
| **Deny rules** | Claude Code settings | Block `curl`, `wget`, raw fetch, `.env` access |
| **MCP audit** | Manual review | Treat each MCP connection as a trust boundary |
| **CI scanning** | Claude Code Security Review Action | Semantic security analysis on PRs |

### Configuration Hardening Checklist

- [ ] Never use `--dangerously-skip-permissions` without tight scoping
- [ ] Audit all MCP servers — know what data each can access
- [ ] Set deny rules for network commands (`curl`, `wget`) and sensitive files
- [ ] Enable Lasso for PostToolUse prompt injection scanning
- [ ] Enable Dippy for command approval gating
- [ ] Use PreToolUse hooks to block hardcoded secrets in Write/Edit operations
- [ ] Review untrusted repositories in a sandboxed environment
- [ ] Keep Claude Code updated (CVE patches)

### Beyond Lasso

Other approaches emerging in 2026:
- **Anthropic's built-in context-aware analysis** detects harmful instructions by analyzing full request context
- **Input sanitization** at the Claude Code level prevents command injection
- **StepSecurity Harden-Runner** for GitHub Actions — restricts network/process access for CI jobs using Claude Code
- **ClamAV file scanning** for malware in generated/downloaded files
- **Transcript scrubbing** removes credentials from session logs

---

## 7. Git Hooks & CI for AI-Assisted Development

### Recommended Pipeline

```
Developer writes prompt
    ↓
Claude generates code
    ↓
Pre-commit (< 5s):
  ├── Biome check (lint + format)
  ├── Oxlint (type-aware rules)
  ├── Secrets scan (grep hook)
  └── Vitest related (tests for changed files)
    ↓
Commit (commitlint validates message)
    ↓
Push → CI Pipeline (< 3min):
  ├── Full Vitest suite + coverage
  ├── Semgrep security scan
  ├── Lighthouse CI (performance budgets)
  ├── TypeScript strict compilation
  └── Claude Code Security Review (on PRs)
    ↓
Merge
```

### Claude Code Hooks as Pre-Commit

Claude Code's own hook system runs independently of Git hooks. Use both:
- **Claude Code hooks** (PreToolUse/PostToolUse): Catch issues as code is being written
- **Git hooks** (via Husky): Catch issues before they enter the repository

### lint-staged Configuration for AI Workflows

The key insight: when AI generates code across many files, `lint-staged` keeps pre-commit fast by only checking staged files. Without it, a full repo lint after AI-generated changes could take minutes.

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["biome check --write", "oxlint", "vitest related --run"],
    "*.{json,md,css}": ["biome format --write"]
  }
}
```

### GitHub Actions for AI-Assisted PRs

```yaml
name: AI Code Quality
on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm biome check .
      - run: pnpm vitest run --coverage
      - run: pnpm tsc --noEmit

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-security-review@main
        with:
          anthropic_api_key: ${{ secrets.CLAUDE_API_KEY }}

  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile && pnpm build
      - run: pnpm lhci autorun
```

---

## Summary: What to Adopt Now

| Priority | Tool | Action |
|----------|------|--------|
| **Immediate** | Biome | Replace ESLint + Prettier |
| **Immediate** | Husky + lint-staged | Pre-commit gates for AI-generated code |
| **Immediate** | ts-reset | Better built-in types, zero cost |
| **Immediate** | Strict tsconfig flags | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| **This week** | Semgrep | Add to CI for security scanning |
| **This week** | Claude Code Security Review | GitHub Action on PRs |
| **This week** | Socket.dev | GitHub App for supply chain scanning |
| **This sprint** | Lighthouse CI | Performance budgets in CI |
| **This sprint** | `next analyze` | Baseline bundle analysis |
| **This sprint** | Oxlint | Add type-aware lint rules |
| **Evaluate** | Effect v4 | Watch for ExecuDeck command processing use case |
| **Evaluate** | Playwright component testing | When it exits experimental |

#research #security #testing #quality #tools #2026
