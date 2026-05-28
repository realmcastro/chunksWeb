Perform a security audit of the codebase or specified area.

Scope: $ARGUMENTS (if provided), otherwise full application.

## Audit Areas

### Authentication & Session
- Session cookie flags: httpOnly, sameSite, secure (in production)
- Session expiry validation
- Password hashing (bcrypt, adequate rounds)
- Auth bypass: routes missing `getUserIdFromCookie()` guard
- Session fixation: cookie regeneration on login

### Input Validation
- All API routes validate request body/params
- SQL injection: all queries use parameterized statements (better-sqlite3 `.prepare()`)
- XSS: user input sanitized before rendering
- Path traversal: file operations validate paths
- Type coercion: numeric IDs parsed and validated

### Data Exposure
- Error responses don't leak stack traces, SQL, or internal paths
- No secrets in client-side code (check `'use client'` files for env vars)
- No sensitive data in localStorage/sessionStorage
- API responses don't over-fetch (return only needed fields)
- Database file permissions appropriate

### OWASP Top 10 Quick Check
- [ ] Injection (SQL, command)
- [ ] Broken Authentication
- [ ] Sensitive Data Exposure
- [ ] XML External Entities (N/A for JSON APIs)
- [ ] Broken Access Control
- [ ] Security Misconfiguration
- [ ] XSS
- [ ] Insecure Deserialization
- [ ] Using Components with Known Vulnerabilities
- [ ] Insufficient Logging

### Headers & Config
- CSP headers configured (or missing)
- CORS configuration
- Rate limiting (present/absent)
- next.config.js security headers

## Output Format

```
[SEVERITY] category — file:line — finding. Risk: impact. Fix: recommendation.
```

Severities: CRITICAL, HIGH, MEDIUM, LOW, INFO.

End with: findings count by severity, top 3 priority fixes.
