# Dependency Audit Prompt

Sources: [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), [npm audit docs](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/)

**When to use**: Before releases, periodically (biweekly recommended), after adding new dependencies, when evaluating a new library.

---

## Prompt

Audit the dependencies of this project for security, maintainability, and supply chain risks.

**Project**: `[project path or description]`

### Step 1: Security Scan

**Node.js/npm (primary):**
```bash
# Basic vulnerability scan
pnpm audit --audit-level=moderate

# JSON output for automation
pnpm audit --json

# Auto-fix where possible
pnpm audit --fix

# Deep scan with Snyk (if available)
npx snyk test

# Check against deps.dev for broader CVE coverage
# (npm audit only catches reported vulnerabilities — misses zero-days,
#  abandoned packages, and recently compromised legitimate packages)
```

**Other ecosystems:**
- Python: `pip-audit`, `uv pip audit`
- Rust: `cargo deny check`
- Go: `govulncheck ./...`

Flag all HIGH and CRITICAL vulnerabilities. Note: `npm audit` has known limitations — it won't detect newly published malicious packages or maintainer account compromises.

### Step 2: License Audit

```bash
# Check all dependency licenses
npx license-checker --summary
npx license-checker --failOn 'GPL-3.0;AGPL-3.0'

# Alternative: more detailed output
npx license-checker --csv --out licenses.csv
```

**License compatibility quick reference:**
| License | Commercial Use | Copyleft Risk | Action |
|---------|---------------|---------------|--------|
| MIT, BSD, ISC | Safe | None | Accept |
| Apache-2.0 | Safe | None (patent clause) | Accept |
| LGPL-2.1/3.0 | Conditional | Weak copyleft | Review usage |
| GPL-2.0/3.0 | Restricted | Strong copyleft | Block or isolate |
| AGPL-3.0 | Restricted | Network copyleft | Block |
| Unlicensed | Unknown | Unknown | Investigate |

### Step 3: Maintenance Assessment
For each direct dependency, evaluate:
- **Last release**: When was it last updated? (>12 months = warning, >24 months = critical)
- **Maintainer activity**: Are issues being responded to?
- **Download trends**: Growing, stable, or declining?
- **Bus factor**: Single maintainer = risk (check GitHub contributors)
- **Ecosystem adoption**: Is the broader ecosystem moving away from this library?

```bash
# Check package age and versions
npm view [package] time --json

# Check download trends
npm view [package] --json | jq '.dist-tags, .time'
```

### Step 4: Supply Chain Risks
- [ ] All versions pinned exactly in lock file (no `^` or `~` in production)
- [ ] Lock file (`pnpm-lock.yaml`, `package-lock.json`) committed and up to date
- [ ] No postinstall scripts from untrusted packages (`npm config set ignore-scripts true` as default)
- [ ] Hash verification enabled where supported
- [ ] New packages have a cooldown window before adoption (24h minimum after publish)
- [ ] No typosquatting risks (review names of recently added packages)
- [ ] `npm` lifecycle scripts audited (`preinstall`, `postinstall`, `prepare`)
- [ ] No packages with `node-gyp` compilation unless explicitly justified

**2025 Context**: The npm ecosystem has seen major supply chain attacks (debug, chalk compromise Sep 2025 affecting 20M+ weekly downloads). Treat the package manager as an untrusted execution engine.

### Step 5: Dependency Justification
For each dependency, answer:
- Could this be replaced with stdlib or a smaller library?
- Is the API surface we use proportional to the library size?
- What happens if this dependency is abandoned?
- Is there a maintained fork or successor?

### Step 6: Transitive Dependency Review
```bash
# Show full dependency tree
pnpm ls --depth=10

# Find duplicate packages
npx depcheck

# Identify unused dependencies
npx depcheck --ignores="@types/*"
```

### Output Format
| Dependency | Version | Last Update | CVEs | License | Risk Level | Action |
|------------|---------|-------------|------|---------|------------|--------|
| ... | ... | ... | ... | ... | ... | ... |

Top 3 actions to take immediately, plus a schedule for ongoing monitoring.

### Ongoing Monitoring Cadence
| Check | Frequency | Tool |
|-------|-----------|------|
| `pnpm audit` | Every CI run | CI pipeline |
| License check | Monthly | `license-checker` |
| Maintenance review | Quarterly | Manual + npm stats |
| Full supply chain audit | Before each release | This prompt |
