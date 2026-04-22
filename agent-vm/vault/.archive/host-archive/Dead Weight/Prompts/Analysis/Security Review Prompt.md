# Security Review Prompt

Sources: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code), [tayyabakmal1/qa-prompt-library](https://github.com/tayyabakmal1/qa-prompt-library), [trailofbits/claude-code-config](https://github.com/trailofbits/claude-code-config), [OWASP Top 10:2025](https://owasp.org/Top10/2025/), [Next.js Security Guide](https://nextjs.org/blog/security-nextjs-server-components-actions)

**When to use**: Before commits touching auth, API endpoints, user input handling. Immediately during production incidents or CVE discoveries.

---

## Prompt

Perform a security review of the following code changes or system component. Operate as a security specialist focused on preventing vulnerabilities before production deployment.

**Subject**: `[describe the code, PR diff, or system component]`

### Phase 1: Initial Scan
Identify high-risk areas:
- Authentication and session management
- API endpoints (especially public-facing)
- Database queries and data access
- File upload handling
- Payment processing
- User input processing points
- Server Actions and form handling

### Phase 2: OWASP Top 10:2025 Assessment

Systematically check each category (updated for 2025 ranking changes):

1. **A01 — Broken Access Control** — Can users access resources they shouldn't? Is RBAC enforced consistently? Are IDOR vulnerabilities possible? (SSRF now consolidated here)
2. **A02 — Security Misconfiguration** — Default credentials removed? Security headers set? Debug mode disabled? Error messages leaking internals? (Moved up from #5)
3. **A03 — Software Supply Chain Failures** — Dependencies audited? Known CVEs? Are transitive dependencies reviewed? Any recently compromised packages? (Expanded from "Vulnerable Components")
4. **A04 — Cryptographic Failures** — Is sensitive data encrypted at rest and in transit? Are algorithms current (no MD5/SHA1 for security)? Key management secure?
5. **A05 — Injection** — Are all queries parameterized? Any string concatenation with user input? Template injection risks? (SQL, NoSQL, OS command, LDAP)
6. **A06 — Insecure Design** — Are there threat models? Abuse cases considered? Rate limiting on sensitive operations? Business logic flaws?
7. **A07 — Identification and Authentication Failures** — Session management secure? Rate limiting on login? MFA available? Password policy enforced?
8. **A08 — Software and Data Integrity Failures** — Input validation? Signed updates? CI/CD pipeline integrity? Deserialization safety?
9. **A09 — Security Logging and Monitoring Failures** — Security events logged? Sensitive data excluded from logs? Alerting on anomalies? Audit trail sufficient?
10. **A10 — Mishandling of Exceptional Conditions** — Improper error handling? Failing open instead of closed? Logical errors under abnormal conditions? Resource exhaustion handled? (New for 2025)

### Phase 3: Next.js/React-Specific Security Patterns

**Server Components and Server Actions:**
- [ ] Server Actions validate ALL inputs (use Zod/Valibot, never trust client data)
- [ ] Server Actions re-authorize the user inside the action (don't rely on middleware alone)
- [ ] Server Components never perform side-effects (mutations)
- [ ] Sensitive data never serialized from Server to Client components
- [ ] Data Access Layer is isolated — `db`, `env` not imported outside DAL

**Client-Side:**
- [ ] No `dangerouslySetInnerHTML` without DOMPurify sanitization
- [ ] No sensitive data in client-side state, localStorage, or URL params
- [ ] CSP headers configured (`default-src 'self'` as baseline)
- [ ] CORS configuration restrictive (explicit allowlist, not `*`)

**Session and Auth:**
- [ ] Cookies set with `HttpOnly`, `Secure`, `SameSite=Strict` (or `Lax` for POST)
- [ ] Session tokens rotated after login/privilege escalation
- [ ] CSRF protection via Origin/Host header comparison (built into Server Actions)
- [ ] Auth middleware covers all protected routes (no gaps in matcher config)

**API Routes:**
- [ ] Rate limiting on all public endpoints
- [ ] Input validation with schema (Zod) on every route handler
- [ ] Response sanitization — no stack traces or internal errors in production
- [ ] Proper HTTP methods enforced (no GET for mutations)

### Phase 4: Code Pattern Review
Flag these patterns as CRITICAL:
- Hardcoded secrets (API keys, passwords, tokens)
- Shell commands with user input (`exec`, `spawn`, `system`)
- `eval()` or dynamic code execution
- Disabled security features (CSRF off, auth bypassed)
- Overly permissive CORS configuration (`Access-Control-Allow-Origin: *`)
- Sensitive data in client-side code or browser console
- Environment variables exposed to client (missing `NEXT_PUBLIC_` discipline)
- Unvalidated redirects (`redirect(userInput)`)

### Security Headers Checklist
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Severity Levels
- **CRITICAL**: Immediate exploitation possible, data breach risk — blocks merge
- **HIGH**: Exploitable with moderate effort, significant impact — blocks merge
- **MEDIUM**: Requires specific conditions, limited impact — fix before release
- **LOW**: Theoretical risk, defense-in-depth improvement — track as tech debt

### Output
Findings table with: Location (file:line), Severity, OWASP Category, Description, Remediation. CRITICAL and HIGH items must block merge.
