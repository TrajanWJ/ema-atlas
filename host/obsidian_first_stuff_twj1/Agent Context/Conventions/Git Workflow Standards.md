# Git Workflow Standards

Sources: [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), [Angular Commit Convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)

---

## Conventional Commits Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Use | Triggers Version Bump |
|------|-----|-----------------------|
| `feat` | New feature | Minor (0.X.0) |
| `fix` | Bug fix | Patch (0.0.X) |
| `refactor` | Code restructuring (no behavior change) | — |
| `docs` | Documentation only | — |
| `test` | Adding or fixing tests | — |
| `chore` | Build, tooling, dependencies | — |
| `perf` | Performance improvement | Patch |
| `ci` | CI/CD configuration | — |
| `style` | Formatting, whitespace (no logic change) | — |
| `build` | Build system or external dependencies | — |

### Breaking Changes
Append `!` after type/scope or add `BREAKING CHANGE:` footer:
```
feat(api)!: remove deprecated /v1/users endpoint

BREAKING CHANGE: The /v1/users endpoint has been removed. Use /v2/users instead.
```

### Rules
- **Imperative mood**: "add feature" not "added feature" or "adds feature"
- **72 character max** subject line
- **Lowercase** first word of description
- **No period** at end of subject line
- One logical change per commit
- Body section for additional context when needed
- Blank line between subject and body

### Commit Message Examples

```
feat(auth): add OAuth2 login with Google provider

fix(ui): correct button alignment on mobile viewport

refactor(api): extract validation logic into shared middleware

docs(readme): update environment setup instructions

test(users): add edge case tests for duplicate email handling

chore(deps): upgrade Next.js to 15.1.0

perf(queries): add database index for user lookup by email

ci: add Playwright E2E tests to GitHub Actions pipeline

feat(payments)!: switch from Stripe Charges to Payment Intents API

BREAKING CHANGE: Payment processing now uses Payment Intents.
Existing integrations must update their webhook handlers.
```

---

## Branch Naming Convention

Pattern: `{initials}/{type}-{description}`

| Pattern | Example | Use |
|---------|---------|-----|
| `tw/feat-*` | `tw/feat-user-auth` | New feature |
| `tw/fix-*` | `tw/fix-login-button` | Bug fix |
| `tw/refactor-*` | `tw/refactor-api-layer` | Restructuring |
| `tw/chore-*` | `tw/chore-upgrade-deps` | Maintenance |
| `tw/docs-*` | `tw/docs-api-reference` | Documentation |
| `tw/test-*` | `tw/test-payment-flow` | Test additions |

### Rules
- Use `kebab-case` for the description
- Keep descriptions short (2-4 words)
- Include ticket number if applicable: `tw/feat-AUTH-123-oauth-login`
- Delete branches after merge

---

## PR Template / Checklist

Use this structure for every pull request:

```markdown
## Summary
<!-- 1-3 bullet points describing WHAT changed and WHY -->

## Changes
<!-- List of specific changes, grouped by area -->

## Test Plan
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases covered

## Checklist
- [ ] Types are correct (no `any`, no assertions without justification)
- [ ] No hardcoded secrets or credentials
- [ ] Error handling is comprehensive
- [ ] Changes are backward-compatible (or breaking change is documented)
- [ ] Documentation updated (if API or behavior changed)
```

### PR Rules
- Title mirrors commit convention: `type: description`
- Describe what code does now, not discarded approaches
- Use plain factual language — avoid marketing adjectives ("critical", "crucial", "comprehensive", "robust", "elegant")
- Keep PRs small — under 400 lines changed when possible
- One concern per PR — don't mix features with refactors

---

## When to Squash vs Merge vs Rebase

| Strategy | When to Use | Result |
|----------|-------------|--------|
| **Squash merge** | Feature branches with messy/WIP commits | Single clean commit on main |
| **Merge commit** | Feature branches with clean, meaningful commit history | Preserves full history with merge commit |
| **Rebase** | Updating feature branch from main (local only) | Linear history, no merge commits |

### Rules
- **Default: Squash merge** for feature branches — keeps main history clean
- **Merge commit** when the branch has commits worth preserving individually
- **Rebase** only on local/unpushed branches — never rebase pushed commits on shared branches
- **Never force push to main/master**
- **Never rebase public branches** — it rewrites history others depend on

---

## Pre-Commit Hook Recommendations

### Recommended Hooks
```bash
# .husky/pre-commit (using Husky)
pnpm lint-staged
```

```json
// package.json — lint-staged configuration
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "oxlint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### What to Run in Pre-Commit
| Check | Tool | Purpose |
|-------|------|---------|
| Linting | oxlint | Catch code issues |
| Formatting | Prettier | Consistent style |
| Type checking | `tsc --noEmit` | Type safety (optional — can be slow) |
| Secret scanning | gitleaks | Prevent credential commits |
| Commit message | commitlint | Enforce conventional commits |

### Commit Message Linting
```bash
# .husky/commit-msg
npx --no-install commitlint --edit "$1"
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

---

## Before Committing

1. Re-read changes for unnecessary complexity, redundancy, unclear naming
2. Run relevant tests (not full suite for small changes)
3. Run linters and type checker — fix everything before committing
4. Never commit secrets, API keys, credentials
5. Ensure commit message follows conventional format

## Safety Rules

- Never push directly to main/master — use feature branches and PRs
- Never force push to shared branches
- Never skip pre-commit hooks without explicit reason
- Create NEW commits rather than amending (amend can destroy previous work after hook failures)

## Multi-Agent Git Workflow

When using parallel sub-agents, each agent MUST work in its own worktree or branch. Never have multiple agents writing to the same branch simultaneously.
