# Interview Guide

Talking points, demo flows, and anticipated technical questions for portfolio presentations.

---

## 30-Second Project Summary

> "Secure Notes is a role-based academic content delivery platform. Admins define the institution's academic hierarchy — branches, semesters, sections, subjects. Teachers upload PDFs organized into module folders. Students see only the content for their branch and semester, delivered through an authenticated streaming endpoint with an identity watermark. I built it to explore fine-grained RBAC, secure file delivery, and progressive access control in a full-stack Node.js + React application."

---

## Demo Flow (5 minutes)

### 1. Login & role switching (30s)
- Log in as admin → show dashboard overview
- Log in as teacher → show subject list, module tree
- Log in as student → show subjects scoped to their branch/semester

### 2. Academic hierarchy (1 min)
- As admin: create a branch → semester → section → subject
- Assign a teacher to that subject

### 3. Content upload (1 min)
- As teacher: create a module → upload a PDF note
- Show file size limit enforcement (try a non-PDF — rejected)

### 4. Secure viewer (1.5 min)
- As student: navigate to subject → module → note
- Open the PDF viewer
- Demonstrate: right-click blocked, print shortcut intercepted, watermark visible
- Open Network tab — show the authenticated streaming URL (no direct file path)

### 5. Access control proof (1 min)
- Try accessing a note via its ID as a different student (wrong branch/semester) → 403
- Show rate limiting: 5 failed logins → 429 with RateLimit headers

---

## Anticipated Technical Questions

### Architecture

**"Why a monolithic Express app? Would you use microservices?"**
> "For a single-developer portfolio project serving hundreds of concurrent users, a well-structured monolith is the correct choice. The academic hierarchy and role checks are deeply coupled — splitting them into microservices would add distributed transaction complexity without benefit at this scale. If it needed to scale to tens of thousands of concurrent users, I'd extract the PDF streaming into a separate service with CDN offload, since that's the bottleneck."

**"How does role-based access work?"**
> "There are two middleware functions — `requireAuth` and `requireRole`. `requireAuth` verifies the JWT and attaches `req.user`. `requireRole(role)` checks `req.user.role`. Every protected router calls both at the top of the file, so there's no per-route forget risk. Beyond role, teacher routes also verify SubjectAssignment records, and student routes cross-reference the user's branch+semester against the requested content."

**"How would you make this multi-tenant?"**
> "I'd add a `tenantId` field to all models and enforce it at the query level via middleware that automatically scopes all DB queries. The academic hierarchy would be duplicated per tenant. For PDF storage, each tenant would get a namespace prefix in S3/R2."

### Security

**"Is the PDF actually secure?"**
> "It's deterrence-layer security. The PDF is never served at a guessable URL — it streams through an authenticated endpoint that verifies the student's scope on every request. We block print, right-click, and add a watermark. But a motivated user can extract the ArrayBuffer from browser memory. I chose to document this honestly rather than oversell it. For stronger guarantees, server-side page rasterization would be the next step."

**"How do you prevent brute force?"**
> "There's a dedicated rate limiter on the login endpoint — 5 attempts per 15 minutes per IP. It's layered on top of a global 100 req/15 min limiter. Failed and successful attempts are both counted. The response includes standard RFC 6585 `RateLimit-*` headers so clients can self-throttle. For multi-instance deployments I'd switch to a Redis-backed store."

**"Why JWT in localStorage?"**
> "I made a deliberate trade-off: localStorage is simpler and avoids CSRF complexity. The risk is XSS token theft. React's default JSX escaping prevents most XSS, but defense-in-depth would use `httpOnly` + `SameSite=Strict` cookies. I've documented this limitation explicitly in SECURITY.md."

**"How do you prevent ReDoS in search?"**
> "Search queries go through `sanitizeSearchQuery()` before reaching MongoDB's `$regex`. It clamps input to 100 chars and runs `escapeRegex()` which escapes all 12 regex metacharacters. So `(a+)+` becomes `\\(a\\+\\)\\+` — a harmless literal string, not a catastrophically backtracking pattern."

### Database

**"Why MongoDB over SQL?"**
> "The academic hierarchy is naturally document-shaped and varies per institution. MongoDB's flexible schema let me iterate quickly on the Branch→Semester→Section→Subject→Module→Note hierarchy without migrations. A relational DB would work fine too — the schema is well-defined. The main advantage here is Mongoose's rich populate() for nested references."

**"How would you handle a million users?"**
> "Add compound indexes on the most common query patterns: `(branch_id, semester_id)` on subjects, `(teacher_id)` on subject_assignments. Move PDF storage to S3 with CloudFront. Add pagination on all list endpoints. Add a Redis layer for rate limiting and session invalidation. Horizontally scale the Express app behind a load balancer."

### Testing

**"How do you test this?"**
> "Currently manual testing with a regression script (`backend/scripts/regression-test.mjs`) that covers the critical auth flows — bootstrap, login, JWT validation, role-gated routes. For production I'd add Vitest + Supertest for API integration tests on all route handlers, focused on access control boundaries. E2E with Playwright for the complete upload → view flow."

---

## What I'd Do Differently

This is a strong interview signal — showing you can reflect critically on your own work.

1. **httpOnly cookies from day one** — localStorage JWT was expedient but wrong for production
2. **Service layer** — business logic in route handlers makes testing harder; a thin service layer would have paid off
3. **TypeScript** — caught a few type errors manually that TS would have caught at compile time
4. **Pagination from the start** — retrofitting pagination is more disruptive than building it in
5. **At least one test file before shipping** — even a single integration test for the login flow would have been worth the setup cost
