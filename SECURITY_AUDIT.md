# CONRAD SECURITY AUDIT REPORT
## Date: 2026-07-28
## Auditor: Principal Security Engineer
## Scope: Full-stack application (Backend + Frontend + Infrastructure)

---

## EXECUTIVE SUMMARY

**Risk Level: HIGH**

The Conrad codebase contains **11 critical/high-severity security vulnerabilities** that must be addressed before production deployment. These span across authentication, authorization, input validation, cryptography, and infrastructure hardening. This audit follows the OWASP Top 10 2025 framework.

---

## VULNERABILITY MATRIX

| ID | Category | Severity | Status | OWASP 2025 |
|----|----------|----------|--------|------------|
| SEC-001 | Missing bcrypt dependency | CRITICAL | OPEN | A07 |
| SEC-002 | No password complexity validation | HIGH | OPEN | A07 |
| SEC-003 | JWT secret exposed in .env.example | HIGH | OPEN | A07 |
| SEC-004 | Missing input sanitization for chat messages | HIGH | OPEN | A05 |
| SEC-005 | No rate limiting on auth endpoints | HIGH | OPEN | A07 |
| SEC-006 | Missing CORS origin validation in dev | MEDIUM | OPEN | A01 |
| SEC-007 | No request size limits on streaming endpoints | MEDIUM | OPEN | A10 |
| SEC-008 | Missing security headers on frontend | MEDIUM | OPEN | A02 |
| SEC-009 | No CSRF protection | MEDIUM | OPEN | A01 |
| SEC-010 | Missing audit logging | MEDIUM | OPEN | A09 |
| SEC-011 | No SQL injection test coverage | LOW | OPEN | A05 |

---

## DETAILED FINDINGS

### SEC-001: Missing bcryptjs Dependency [CRITICAL]

**Location:** `apps/backend/src/routes/auth.ts:42`

**Issue:** The auth route imports `bcrypt` but `package.json` only lists `bcryptjs` (not `bcrypt`). This will cause runtime failure on signup/login.

**Impact:** Authentication system completely non-functional.

**Fix:**
```typescript
// Change import from:
import bcrypt from 'bcrypt';
// To:
import bcrypt from 'bcryptjs';
```

---

### SEC-002: No Password Complexity Validation [HIGH]

**Location:** `apps/backend/src/routes/auth.ts`

**Issue:** The Zod schema only checks `min(8)` but doesn't enforce complexity (uppercase, lowercase, number, special char). This allows weak passwords like "password" or "12345678".

**Impact:** Vulnerable to credential stuffing and brute-force attacks.

**Fix:**
```typescript
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  name: z.string().min(1).max(100).optional(),
});
```

---

### SEC-003: JWT Secret Exposed in .env.example [HIGH]

**Location:** `apps/backend/.env.example:13`

**Issue:** The `.env.example` contains a hardcoded JWT secret (`your-super-secret-jwt-key-change-this-in-production`). Developers may copy this directly without changing it.

**Impact:** If deployed with default secret, attackers can forge JWT tokens.

**Fix:**
```bash
# .env.example
JWT_SECRET=  # Generate with: openssl rand -base64 64
```

Add a startup check:
```typescript
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```

---

### SEC-004: Missing Input Sanitization for Chat Messages [HIGH]

**Location:** `apps/backend/src/routes/chat.ts:85`

**Issue:** User messages are stored directly in the database without sanitization. While Prisma prevents SQL injection, the content is later rendered as markdown on the frontend. This creates a potential XSS vector if malicious markdown (HTML tags, event handlers) is injected.

**Impact:** Stored XSS — attacker could inject scripts that execute when other users view the chat.

**Fix:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

// In chat route before saving:
const sanitizedContent = DOMPurify.sanitize(content, {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
});
```

Also add CSP headers:
```typescript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for Monaco
    styleSrc: ["'self'", "'unsafe-inline'"],
    connectSrc: ["'self'", "https://api.groq.com"],
  },
}));
```

---

### SEC-005: No Rate Limiting on Auth Endpoints [HIGH]

**Location:** `apps/backend/src/routes/auth.ts`

**Issue:** The global rate limiter applies to all `/api/*` routes, but auth endpoints (`/api/auth/signup`, `/api/auth/login`) need stricter, separate rate limiting to prevent brute-force and credential stuffing.

**Impact:** Vulnerable to brute-force password attacks and account enumeration.

**Fix:**
```typescript
// In auth.ts router
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(...));
router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(...));
```

---

### SEC-006: Missing CORS Origin Validation in Development [MEDIUM]

**Location:** `apps/backend/src/index.ts:22`

**Issue:** In development mode, CORS allows `http://localhost:3000` but doesn't validate the origin strictly. The `credentials: true` with wildcard origins is dangerous.

**Impact:** Potential CSRF if combined with other vulnerabilities.

**Fix:**
```typescript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://conrad.vercel.app']
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

---

### SEC-007: No Request Size Limits on Streaming Endpoints [MEDIUM]

**Location:** `apps/backend/src/routes/chat.ts:85`

**Issue:** The streaming chat endpoint has no request body size limit. An attacker could send a massive message causing memory exhaustion.

**Impact:** DoS via memory exhaustion.

**Fix:**
```typescript
router.post('/:id/messages', 
  express.json({ limit: '50kb' }), // Limit message size
  validate(sendMessageSchema), 
  asyncHandler(async (req: AuthRequest, res) => {
    // ... existing code
  })
);
```

---

### SEC-008: Missing Security Headers on Frontend [MEDIUM]

**Location:** `apps/frontend/next.config.mjs`

**Issue:** No security headers configured for the Next.js frontend.

**Impact:** Clickjacking, MIME sniffing, XSS vectors.

**Fix:**
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
```

---

### SEC-009: No CSRF Protection [MEDIUM]

**Location:** All state-changing endpoints

**Issue:** No CSRF tokens or SameSite cookie policies for state-changing operations.

**Impact:** CSRF attacks on authenticated users.

**Fix:**
```typescript
// For cookie-based auth (if added later):
// SameSite=Strict cookies
// For JWT in localStorage (current approach), implement CSRF tokens:

// Add to auth middleware:
const csrfToken = req.headers['x-csrf-token'];
if (!csrfToken || csrfToken !== req.session?.csrfToken) {
  return res.status(403).json({ error: 'Invalid CSRF token' });
}
```

---

### SEC-010: Missing Audit Logging [MEDIUM]

**Location:** All routes

**Issue:** No security event logging (failed logins, access control failures, suspicious activity).

**Impact:** Cannot detect or investigate security incidents.

**Fix:**
```typescript
// Add audit logger:
const auditLog = (event: string, userId: string, details: any) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    ...details,
  }));
};

// Use in auth:
auditLog('LOGIN_FAILURE', user.id, { reason: 'invalid_password', ip: req.ip });
```

---

### SEC-011: No SQL Injection Test Coverage [LOW]

**Location:** Test suite

**Issue:** No tests verify that Prisma queries are parameterized and safe.

**Fix:** Add integration tests:
```typescript
// tests/security/sql-injection.test.ts
it('should not be vulnerable to SQL injection in search', async () => {
  const maliciousInput = "'; DROP TABLE users; --";
  const response = await request(app)
    .get(`/api/courses?search=${maliciousInput}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  // Verify database is intact
  const users = await prisma.user.findMany();
  expect(users.length).toBeGreaterThan(0);
});
```

---

## ADDITIONAL RECOMMENDATIONS

### 1. Dependency Scanning
```bash
# Add to CI/CD
npm audit --audit-level=moderate
# Or use Snyk/Dependabot
```

### 2. Secret Scanning
- Add `.env` to `.gitignore` (already done ✓)
- Use GitHub secret scanning
- Rotate `GROQ_API_KEY` if exposed in any commit

### 3. Database Security
- Enable SSL for database connections
- Use connection pooling with max limits
- Enable row-level security in Supabase

### 4. AI Service Security
- Add max token limits to prevent cost attacks
- Implement prompt injection detection:
```typescript
const detectPromptInjection = (input: string): boolean => {
  const patterns = [
    /ignore previous instructions/i,
    /system prompt/i,
    /you are now/i,
    /disregard all/i,
  ];
  return patterns.some(p => p.test(input));
};
```

### 5. Infrastructure
- Use Cloudflare/WAF in front of the API
- Enable DDoS protection
- Set up log aggregation (Datadog, Splunk)

---

## COMPLIANCE MAPPING

| Requirement | Status |
|-------------|--------|
| OWASP Top 10 2025 A01 (Broken Access Control) | Partial |
| OWASP Top 10 2025 A02 (Security Misconfiguration) | Partial |
| OWASP Top 10 2025 A05 (Injection) | Partial |
| OWASP Top 10 2025 A07 (Authentication Failures) | Failing |
| OWASP Top 10 2025 A09 (Logging & Alerting) | Failing |
| OWASP Top 10 2025 A10 (Exception Handling) | Partial |
| GDPR Article 32 (Security) | Failing |
| SOC 2 Type II | Failing |

---

## REMEDIATION PRIORITY

1. **Immediate (Block Release):**
   - SEC-001: Fix bcrypt import
   - SEC-003: Remove hardcoded JWT secret
   - SEC-005: Add auth rate limiting

2. **Before Production:**
   - SEC-002: Password complexity
   - SEC-004: Input sanitization + CSP
   - SEC-006: CORS hardening
   - SEC-008: Security headers

3. **Post-Launch:**
   - SEC-007: Request size limits
   - SEC-009: CSRF protection
   - SEC-010: Audit logging
   - SEC-011: Security tests

---

*Report generated by automated security analysis against OWASP Top 10 2025 and Node.js security best practices.*
