# Security Model

This document describes the security posture of Secure Notes, including implemented controls, honest limitations, and the rationale behind each design decision.

---

## Philosophy

Secure Notes implements **deterrence and traceability**, not cryptographic DRM. The goal is:

1. **Prevent casual redistribution** of academic PDFs
2. **Enforce role-based access** so only enrolled students see content for their branch and semester
3. **Log access** so admins can audit who viewed what and when

This is appropriate for an internal academic platform where users are authenticated members of an institution — not a substitute for document-level encryption.

---

## Implemented Controls

### Authentication

| Control | Implementation |
|---------|---------------|
| Password hashing | `bcryptjs` with cost factor 10 |
| JWT signing | `jsonwebtoken`, HS256, 8-hour expiry |
| JWT secret validation | Startup fails if `JWT_SECRET` is absent or < 32 chars (`backend/config/env.js`) |
| No public registration | `POST /api/auth/register` removed; users created only by authenticated admins |
| Bootstrap protection | `POST /api/auth/bootstrap-admin` requires `X-Bootstrap-Token` header matching `BOOTSTRAP_TOKEN` env var; disabled after first user exists |

### Authorization

| Control | Implementation |
|---------|---------------|
| Role-based access | `requireRole(role)` middleware on every protected router |
| Teacher scope | Teachers access only subjects assigned via `SubjectAssignment` (Branch+Semester+Section) |
| Student scope | Students access subjects matching their Branch+Semester |
| PDF access check | Every `/student/notes/:id/view` request verifies the note's subject is in the student's scope before streaming |

### Rate Limiting

| Limiter | Scope | Limit |
|---------|-------|-------|
| Global | All `/api/*` routes | 100 req / 15 min / IP |
| Login | `POST /api/auth/login` only | 5 req / 15 min / IP |

Login limiter is layered on top of the global limiter. On exhaustion, returns HTTP 429 with `RateLimit-*` headers (RFC 6585).

> **Limitation:** Rate limiting uses in-process memory (express-rate-limit default). In a multi-instance deployment, use the `ioredis` store adapter.

### Input Security

| Control | Implementation |
|---------|---------------|
| Regex escaping | `escapeRegex()` applied to all MongoDB `$regex` search queries (SEC-08) |
| Query length cap | Search queries clamped to 100 characters before escaping |
| PDF MIME validation | Multer `fileFilter` checks `file.mimetype === 'application/pdf'` |
| Upload rate limit | 10 uploads/min/IP on teacher upload endpoint |
| Upload size cap | Configurable via `MAX_UPLOAD_MB` env var (default: 20 MB) |

### HTTP Headers (via Helmet)

Helmet defaults applied, including:

- `X-Frame-Options: DENY` (anti-embedding)
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (when served over HTTPS)
- `X-XSS-Protection: 0` (modern browsers; CSP preferred)

> **Not yet configured:** Content-Security-Policy. Required before deploying with cookie-based auth.

### PDF Deterrence

| Measure | How It Works |
|---------|-------------|
| No direct URL | PDFs are never served at a guessable static path |
| Authenticated streaming | All PDF access goes through a JWT-authenticated route that verifies scope |
| No-cache headers | `Cache-Control: no-store` prevents browser/proxy caching |
| Watermark overlay | DOM overlay with student name + timestamp rendered over the PDF viewer |
| Keyboard blocking | Print (`Ctrl+P`) and save (`Ctrl+S`) keyboard shortcuts intercepted in viewer |
| Right-click disabled | Contextmenu event suppressed on PDF canvas |
| Progress tracking | Every view is logged in the `Progress` collection |

---

## Honest Limitations

> These are known and intentional — be prepared to discuss them in interviews.

| Limitation | Explanation |
|-----------|-------------|
| PDF is in browser memory | `SecurePDFViewer` fetches the full PDF into `ArrayBuffer`. A determined user can extract it from the Network tab or browser memory. |
| Watermark is DOM-only | The watermark overlay can be removed with browser DevTools. It is a deterrent, not a cryptographic control. |
| JWT in localStorage | Tokens are stored in `localStorage` and accessible to JavaScript. An XSS vulnerability (if one existed) could steal tokens. Production should use `httpOnly` cookies. |
| No password policy | Currently no minimum length or complexity enforcement. (Planned: SEC-05) |
| No CSRF protection | Not needed for JWT + Authorization header auth. Would be required if switching to cookies. |
| No audit log collection | Admin actions and PDF uploads are not logged to a persistent audit trail. Progress tracks student views only. |

---

## Environment Variable Security Requirements

| Variable | Requirement |
|----------|------------|
| `JWT_SECRET` | **Required.** Minimum 32 characters. Server refuses to start without it. |
| `BOOTSTRAP_TOKEN` | Required to use the bootstrap endpoint. Should be a random 32+ char string. Rotate after first use. |
| `MONGO_URI` | Should use TLS in production (MongoDB Atlas connection strings include TLS by default). |

Generate a secure `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Interview Talking Points

**"How secure is the PDF protection?"**
> "It's deterrence-layer security — authenticated streaming, no direct URLs, watermarking, and keyboard blocking. A technically sophisticated user can still extract the PDF from browser memory. I chose not to oversell this and instead documented the limitations honestly. For stronger protection, server-side page rasterization (rendering each page to an image server-side before sending) would prevent client-side extraction."

**"Why not httpOnly cookies?"**
> "localStorage with JWT is simpler for a portfolio project and avoids CSRF complexity. The trade-off is XSS vulnerability — if an XSS attack succeeded, the token would be accessible. I'm aware of the trade-off and have it documented. For production, I'd move to httpOnly + SameSite=Strict cookies with CSRF double-submit tokens."

**"How do you prevent brute-force?"**
> "The login endpoint has a dedicated rate limiter: 5 attempts per 15 minutes per IP, returning 429 with RateLimit-* headers. This is layered on top of a global 100 req/15 min limiter. It's in-process memory, so for multi-instance deployments I'd use a Redis-backed store."
