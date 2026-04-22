---
tags: [prompt-engineering, qa, security, owasp, penetration-testing]
summary: "Extracted security testing prompts covering OWASP Top 10, penetration testing, and vulnerability assessment. See also [[QA Prompt Library]]."
source: https://github.com/qa-prompt-library/qa-prompt-library
category: QA Testing Prompts - Security
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
updated: 2026-03-14
created: 2026-03-14
title: "QA Prompts - Security Testing"
---

# QA Prompts - Security Testing

Extracted security testing prompts covering OWASP Top 10, penetration testing, and vulnerability assessment. See also [[QA Prompt Library]].

## Security Testing Specialist Persona

```
You are an expert Security Test Engineer specializing in application security (AppSec), penetration testing, and vulnerability assessment.

Core Competencies:
- Security Standards: OWASP Top 10, CWE/SANS Top 25
- Tools: Burp Suite, OWASP ZAP, Nmap, Metasploit, Wireshark
- SAST/DAST: SonarQube, Checkmarx, Veracode
- Scripting: Python (Scapy, requests), Bash for security automation
- Protocols: HTTPS, OAuth 2.0, OIDC, JWT, SAML
- DevSecOps: Pipeline integration, security-as-code
- Container Security: Trivy, Grype scanning

Principles:
- Shift Left: Identify security requirements during design
- Verify First: Don't assume; validate every input and header
- Defense in Depth: Multiple layers (WAF + Input Validation + DB Permissions)
- Risk-Based: Prioritize critical vulnerabilities with known exploits
- Zero Trust: Never trust, always verify
```

## OWASP Top 10 Testing Prompts

### A01:2021 - Broken Access Control

```
Generate test cases for Broken Access Control vulnerabilities:

Application: [APPLICATION_NAME]
Authentication Type: [SESSION/JWT/OAUTH]
User Roles: [LIST_ROLES]

Test scenarios:
1. Horizontal Privilege Escalation
   - User A accessing User B's resources
   - Manipulating user ID in URL/API
   - Direct object reference manipulation
   - Session token swapping

   Test cases:
   - Login as User A (user_id=123)
   - Try to access User B's profile (user_id=456)
     * GET /api/users/456/profile
     * GET /users/456/orders
   - Expected: Access denied (403 Forbidden)
   - Vulnerable: Returns User B's data

2. Vertical Privilege Escalation
   - Regular user accessing admin functions
   - Bypassing role checks
   - Parameter tampering (isAdmin=true)

   Test cases:
   - Login as regular user
   - Attempt admin operations:
     * GET /admin/dashboard
     * POST /admin/users/delete
     * PUT /admin/settings
   - Try role parameter manipulation:
     * POST /api/update-profile {role: "admin"}

3. Missing Function Level Access Control
   - Hidden admin endpoints
   - API endpoints without authorization
   - Unprotected sensitive operations

4. Insecure Direct Object References (IDOR)
   - Sequential ID enumeration
   - UUID/GUID prediction
   - Reference manipulation in requests

5. CORS Misconfiguration
   - Check Access-Control-Allow-Origin: *
   - Credential sharing with untrusted origins
   - Wildcard subdomain access

Generate:
- Automated test scripts
- Manual testing checklist
- Expected vs actual behavior
- Remediation recommendations
```

### A02:2021 - Cryptographic Failures

```
Create test cases for Cryptographic Failures:

Application: [APPLICATION_NAME]
Data Types: [SENSITIVE_DATA_TYPES]

Test scenarios:
1. Data in Transit
   - HTTPS enforcement
   - TLS/SSL version check (should be TLS 1.2+)
   - Certificate validation
   - Weak cipher suite detection
   - HSTS header verification

   Tests:
   - Access application via HTTP (should redirect to HTTPS)
   - Check certificate: openssl s_client -connect [HOST]:443
   - Scan for weak ciphers: nmap --script ssl-enum-ciphers
   - Verify HSTS header: Strict-Transport-Security: max-age=31536000

2. Data at Rest
   - Database encryption status
   - File storage encryption
   - Key management practices
   - Encryption algorithm strength

3. Password Storage
   - Hashing algorithm (bcrypt, Argon2, PBKDF2)
   - Salt usage and uniqueness
   - Verify no plaintext passwords in logs
   - Check for MD5/SHA1 (weak algorithms)

4. Sensitive Data Exposure
   - API responses containing sensitive data
   - Error messages revealing system info
   - Debug pages enabled in production
   - Sensitive data in URLs/GET parameters
```

### A03:2021 - Injection

```
Generate injection vulnerability test cases:

Application: [APPLICATION_NAME]
Input Fields: [LIST_INPUT_FIELDS]
Technologies: [DATABASE/LDAP/OS/NOSQL]

Test scenarios:
1. SQL Injection
   Classic SQLi:
   - ' OR '1'='1
   - ' OR '1'='1' --
   - admin' --
   - ' UNION SELECT NULL, NULL, NULL--

   Time-based blind SQLi:
   - '; WAITFOR DELAY '00:00:05'--
   - ' OR SLEEP(5)--
   - ' OR pg_sleep(5)--

   Test locations:
   - Login forms (username, password)
   - Search boxes
   - URL parameters
   - Headers (User-Agent, X-Forwarded-For)
   - Cookies

2. NoSQL Injection (MongoDB)
   - {"$ne": null}
   - {"$gt": ""}
   - {"username": {"$ne": null}, "password": {"$ne": null}}

3. OS Command Injection
   - ; ls
   - | ls
   - && cat /etc/passwd
   - $(whoami)

4. XML Injection (XXE)
   <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>

5. XPath Injection
   - ' or '1'='1
   - x' or 1=1 or 'x'='y
```

### A04:2021 - Insecure Design

```
Create test cases for Insecure Design vulnerabilities:

Application: [APPLICATION_NAME]
Critical Workflows: [LIST_WORKFLOWS]

Test scenarios:
1. Business Logic Flaws
   - Price manipulation in e-commerce
   - Negative quantity orders
   - Discount code abuse
   - Race conditions in transactions

2. Insufficient Rate Limiting
   - Send 1000 login attempts
   - Make 10000 API calls in 1 minute
   - Generate 100 OTPs consecutively
   - Expected: Rate limit error after threshold

3. Trust Boundary Violations
   - Bypass client-side validation
   - Manipulate JavaScript variables
   - Intercept and modify requests

4. Workflow Bypass
   - Skip payment step in checkout
   - Access restricted features without subscription
   - Bypass multi-factor authentication
```

### A05:2021 - Security Misconfiguration

```
Generate security misconfiguration test cases:

Application: [APPLICATION_NAME]
Infrastructure: [SERVERS/CONTAINERS/CLOUD]

Test scenarios:
1. Default Credentials (admin/admin, root/root, sa/sa)
2. Directory Listing (/backup, /admin, /.git, /.env)
3. Information Disclosure
   - Server headers revealing versions
   - Error stack traces
   - Comments in HTML source
   - robots.txt revealing sensitive paths
4. Missing Security Headers
   - X-Frame-Options (Clickjacking)
   - X-Content-Type-Options (MIME sniffing)
   - Content-Security-Policy
   - Strict-Transport-Security

   Verify: curl -I [URL] | grep -i "X-Frame-Options"
```

### A07:2021 - Authentication Failures

```
Generate authentication testing scenarios:

Application: [APPLICATION_NAME]
Auth Mechanism: [PASSWORD/MFA/SSO/OAUTH]

Test scenarios:
1. Weak Password Policy - short passwords, common passwords
2. Brute Force - no lockout, no CAPTCHA, no rate limiting
3. Session Management
   - Session fixation
   - Session not invalidated after logout
   - Concurrent sessions allowed
   - Session timeout too long
4. MFA Bypass
   - Try to bypass MFA page directly
   - Brute force 6-digit OTP
   - Reuse same OTP
5. JWT Token Manipulation
   - Algorithm confusion (none, HS256 vs RS256)
   - Token expiration bypass
   - Payload tampering
```

### A10:2021 - Server-Side Request Forgery (SSRF)

```
Generate SSRF vulnerability test cases:

Application: [APPLICATION_NAME]
Features: [URL_PROCESSING_FEATURES]

Test URLs:
- http://localhost / http://127.0.0.1 / http://[::1]
- http://169.254.169.254/latest/meta-data/ (AWS)
- http://metadata.google.internal/computeMetadata/v1/ (GCP)

Protocol Smuggling:
- file:///etc/passwd
- gopher://internal-service
- dict://localhost:11211/stats

Bypass Techniques:
- http://2130706433 (127.0.0.1 in decimal)
- http://0x7f000001 (hex)
- http://127.1 (short form)
- URL encoding: http://%31%32%37%2e%30%2e%30%2e%31

Test in features:
- Import from URL, Webhook registration
- PDF generators, Image processors
- RSS feed readers, Proxy services
```

## DAST Automation with OWASP ZAP

```python
import time
from zapv2 import ZAPv2

target = 'http://localhost:3000'
zap = ZAPv2(apikey='your_api_key',
            proxies={'http': 'http://127.0.0.1:8080',
                     'https': 'http://127.0.0.1:8080'})

print(f'Accessing target {target}')
zap.urlopen(target)
time.sleep(2)

print('Spidering target...')
scanid = zap.spider.scan(target)
while int(zap.spider.status(scanid)) < 100:
    print(f'Spider progress: {zap.spider.status(scanid)}%')
    time.sleep(2)

print('Active Scanning target...')
scanid = zap.ascan.scan(target)
while int(zap.ascan.status(scanid)) < 100:
    print(f'Scan progress: {zap.ascan.status(scanid)}%')
    time.sleep(5)

print('Alerts:')
alerts = zap.core.alerts(baseurl=target, start=0, count=1000)
for alert in alerts:
    print(f"{alert['alert']} - {alert['risk']}")
```

## Security Headers Validation

```python
import requests

def check_security_headers(url):
    response = requests.get(url)
    headers = response.headers

    required = {
        'Strict-Transport-Security': 'HSTS',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY/SAMEORIGIN',
        'Content-Security-Policy': 'CSP'
    }

    for header, name in required.items():
        status = "Present" if header in headers else "Missing"
        print(f"{name}: {status}")

check_security_headers('https://example.com')
```

## Hardcoded Secrets Pre-Commit Hook

```bash
#!/bin/bash
SECRETS_PATTERN="(API_KEY|SECRET_KEY|PASSWORD|TOKEN)\s*=\s*['\"][a-zA-Z0-9]+['\"]"

echo "Running safety check..."
grep -rE "$SECRETS_PATTERN" ./src

if [ $? -eq 0 ]; then
    echo "FATAL: Potential hardcoded secrets found!"
    exit 1
else
    echo "No obvious secrets found."
    exit 0
fi
```

## Security Testing Checklist

- [ ] Tested all OWASP Top 10 categories
- [ ] Automated security scans completed (ZAP/Burp)
- [ ] Manual testing performed
- [ ] Findings documented with severity (Critical/High/Medium/Low)
- [ ] Remediation recommendations provided
- [ ] Re-testing completed after fixes
- [ ] Security sign-off obtained

## Tools Reference

| Tool | Purpose |
|------|---------|
| OWASP ZAP | Web application security scanner |
| Burp Suite | Security testing platform |
| SQLMap | SQL injection automation |
| Nikto | Web server scanner |
| Nmap | Port scanner |
| Nuclei | Vulnerability scanner |
| Trivy | Container security |
| Snyk | Dependency scanning |

## Related Notes
- [[QA Prompt Library]]
- [[QA Prompts - Playwright]]
- **8 Core Principles of Agentic Prompts**
- [[README]]
