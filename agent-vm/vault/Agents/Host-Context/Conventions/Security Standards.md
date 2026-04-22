# Security Standards

> Last verified: 2026-04-12 — OWASP Top 10 list and mitigations remain current. No changes needed.

Sources: [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [OWASP Top 10 2025](https://owasp.org/Top10/2025/en/), [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/), [Node.js Security Best Practices](https://www.nodejs-security.com/)

---

## Mandatory Pre-Commit Checks

Before committing any code, verify:

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML output)
- [ ] CSRF protection active
- [ ] Authentication and authorization verified
- [ ] Rate limiting on all public endpoints
- [ ] Error messages don't reveal sensitive information

---

## OWASP Top 10 Mapped to Next.js / React

| # | Risk | Next.js / React Mitigation |
|---|------|---------------------------|
| 1 | **Broken Access Control** | Middleware auth checks on every route; Server Actions validate session; never trust client-side route guards alone |
| 2 | **Cryptographic Failures** | HTTPS everywhere; use `bcrypt` for passwords; never store secrets in client bundles |
| 3 | **Injection** | React auto-escapes JSX by default; use parameterized queries (Prisma/Drizzle); validate with Zod |
| 4 | **Insecure Design** | Threat model during design; abuse case testing; rate limit Server Actions |
| 5 | **Security Misconfiguration** | Set security headers in `next.config.js`; remove default error pages in production; disable source maps |
| 6 | **Vulnerable Components** | `npm audit` / `pnpm audit`; pin exact versions; review before adding dependencies |
| 7 | **Auth Failures** | Use established auth libraries (NextAuth/Lucia); enforce MFA; secure session management |
| 8 | **Data Integrity Failures** | Validate all inputs server-side; sign JWTs properly; verify webhook signatures |
| 9 | **Logging Failures** | Log auth events, access control failures, input validation failures; never log secrets or PII |
| 10 | **SSRF** | Validate/allowlist URLs in server-side fetch; never pass user input directly to `fetch()` |

---

## XSS Prevention in React

React escapes all values rendered in JSX by default. XSS vulnerabilities come from bypassing this:

### Rules
- **Never use `dangerouslySetInnerHTML`** unless all of these are true:
  1. The content comes from a trusted source (your own CMS, not user input)
  2. The content is sanitized with DOMPurify before rendering
  3. A justification comment explains why it is necessary
- **Never construct HTML strings** from user input
- **Never use `javascript:` URLs** in `href` attributes — validate URL schemes
- **Sanitize URL parameters** before using them in the DOM
- **Use CSP headers** as defense-in-depth (see below)

```typescript
// BAD — direct user content
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// GOOD — sanitized with DOMPurify
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(trustedCmsContent) }} />
```

---

## CSRF Protection

Modern browsers mitigate most CSRF via `SameSite=Lax` cookies (now the default). Additional protection:

- **Server Actions**: Next.js Server Actions include built-in CSRF protection via the `Origin` header check
- **API Routes**: For cookie-authenticated API routes, verify the `Origin` or `Referer` header
- **Custom tokens**: If needed, use the double-submit cookie pattern:
  1. Server sets `XSRF-TOKEN` cookie (readable by JS, `SameSite=Lax`)
  2. Client reads cookie, sends value in `X-XSRF-TOKEN` header
  3. Server validates header matches cookie
- **SameSite cookies**: Always set `SameSite=Lax` or `Strict` — never `None` without a strong reason

---

## Environment Variable Management

### .env File Hierarchy (Next.js)
```
.env                  # Default values (committed — no secrets here)
.env.local            # Local overrides (git-ignored — secrets go here)
.env.development      # Development defaults (committed)
.env.production       # Production defaults (committed)
.env.development.local # Dev local overrides (git-ignored)
.env.production.local  # Prod local overrides (git-ignored)
```

### Rules
- **`.env.local` is gitignored** — This is where local secrets go
- **`.env.example`** — Committed file listing all required variables with placeholder values
- **`NEXT_PUBLIC_` prefix** — Only variables with this prefix are exposed to the browser. Everything else is server-only
- **Never commit real secrets** to any `.env` file
- **Validate at startup** — Use a Zod schema to parse `process.env` and fail fast on missing variables:
  ```typescript
  const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    NEXT_PUBLIC_API_URL: z.string().url(),
  });
  export const env = envSchema.parse(process.env);
  ```
- **Production**: Use a secrets manager (Vercel env vars, AWS Secrets Manager, Vault) — not `.env` files

### Access Pattern
- **Never access `process.env` directly** throughout the codebase
- Create a centralized `env.ts` that validates and exports typed values
- Import from `env.ts` everywhere — single source of truth

---

## Secret Scanning — What Must Never Be in Code

| Category | Examples | Detection |
|----------|----------|-----------|
| API keys | `sk_live_*`, `AKIA*`, `ghp_*` | Pre-commit hooks (gitleaks, trufflehog) |
| Passwords | Database credentials, admin passwords | `.env.local` only |
| Private keys | RSA keys, SSH keys, TLS certs | Secrets manager |
| Tokens | JWT secrets, OAuth client secrets | Environment variables |
| Connection strings | Database URLs with credentials | Environment variables |
| Internal URLs | Staging/internal service URLs | Environment variables |

### Pre-Commit Detection
Use [gitleaks](https://github.com/gitleaks/gitleaks) or [trufflehog](https://github.com/trufflesecurity/trufflehog) as a pre-commit hook to block accidental secret commits.

If a secret is committed:
1. **Rotate the secret immediately** — The old one is compromised, even if you force-push
2. Rewrite git history to remove the commit (if not yet pushed)
3. Add the pattern to `.gitignore` or secret scanning rules

---

## Content Security Policy (CSP)

CSP is a defense-in-depth layer — not your primary XSS defense, but an important safety net.

### Recommended Next.js CSP Headers
```typescript
// next.config.js — security headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // Tighten with nonces in production
      "style-src 'self' 'unsafe-inline'",   // Required for Tailwind
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

### CSP Rules
- Start with `default-src 'self'` and add exceptions explicitly
- Avoid `unsafe-eval` — it defeats the purpose of CSP
- Use nonces for inline scripts in production (Next.js supports this with `nonce` prop)
- Test with `Content-Security-Policy-Report-Only` before enforcing

---

## Dependency Security

### Audit Tools
| Tool | Purpose | When to Run |
|------|---------|-------------|
| `pnpm audit` / `npm audit` | Known vulnerability check | Every CI build |
| [Socket.dev](https://socket.dev/) | Supply chain risk analysis | PR review |
| [Snyk](https://snyk.io/) | Vulnerability DB + fix PRs | Continuous monitoring |
| Renovate / Dependabot | Automated dependency updates | Weekly |

### Dependency Rules
- **Pin exact versions** — No `^` or `~` in production dependencies
- **Review before adding** — Check download count, maintenance status, bundle size
- **Minimize dependencies** — Prefer native APIs and standard library over tiny packages
- **Block postinstall scripts** from untrusted packages
- **Lock file must be committed** (`pnpm-lock.yaml` / `package-lock.json`)

---

## Secret Management

- NEVER embed secrets in source code
- Use environment variables or a secret manager
- Verify required secrets are available at application startup
- Rotate any potentially compromised credentials immediately
- Keep `.env` files in `.gitignore`

## Security Response Protocol

When a vulnerability is discovered:

1. **Stop** all other work immediately
2. **Assess** severity (CRITICAL / HIGH / MEDIUM / LOW)
3. **Fix** CRITICAL vulnerabilities before resuming any other work
4. **Rotate** any exposed credentials
5. **Audit** the entire codebase for similar weaknesses

## Supply Chain Security

- Pin exact dependency versions (`==` not `>=`, no `^` or `~`)
- Run `pip-audit` / `pnpm audit` / `cargo deny check` before deploying
- Verify hashes where supported
- Enforce publish delay for new packages (24h minimum)
- Block postinstall scripts from untrusted packages

## Defense in Depth

- Never trust a single layer of protection
- Validate at every boundary (API gateway, service, database)
- Apply least privilege — grant minimum permissions needed
- Design for secure failure — deny by default
- Log security events for forensic analysis
