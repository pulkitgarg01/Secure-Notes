# Architecture

**Secure Notes** is a full-stack web application for access-controlled academic PDF distribution.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Backend | Node.js 18+ / Express 4 |
| Database | MongoDB 7+ via Mongoose 8 |
| PDF Rendering | PDF.js (pdfjs-dist 4.x) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Storage | Local filesystem via Multer 2.x |

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                    │
│  AuthContext → Role Dashboards → lib/api.js → SecurePDFViewer │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON + Bearer JWT
┌──────────────────────────▼──────────────────────────────────┐
│                   SERVER (Express Monolith)                  │
│  helmet → cors → rateLimit → auth → roleCheck → routes      │
│  /api/auth   /api/admin   /api/academic                      │
│  /api/teacher   /api/student   /api/health                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Mongoose ODM
┌──────────────────────────▼──────────────────────────────────┐
│                      MongoDB                                 │
│  users, branches, semesters, sections, subjects,            │
│  modules, notes, progress, subject_assignments              │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Local Filesystem (backend/uploads/)            │
│              PDF files stored by Multer                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Academic Hierarchy

```
Branch (e.g. "Computer Science")
  └── Semester (e.g. Semester 3)
       └── Section (e.g. "A")
            └── Subject (e.g. "Data Structures")
                 └── Module (e.g. "Unit 1: Arrays")
                      └── Note (PDF file)
```

Each entity in the hierarchy has its own Mongoose model. This allows fine-grained role-based access:

- **Admin**: full CRUD on all entities and users
- **Teacher**: manages modules and notes only for their assigned subjects (B-S-S scope)
- **Student**: read-only access to subjects/modules/notes matching their Branch+Semester

### Key Mongoose Models

| Model | Collection | Purpose |
|-------|-----------|---------|
| `User` | `users` | Stores admin/teacher/student accounts with role + B-S-S refs |
| `Branch` | `branches` | Academic branch/department |
| `Semester` | `semesters` | Semester within a branch |
| `Section` | `sections` | Class section within a semester |
| `Subject` | `subjects` | Course scoped to Branch+Semester |
| `Module` | `modules` | Folder within a subject (supports nesting via `parent_id`) |
| `Note` | `notes` | PDF file + metadata, linked to a module |
| `Progress` | `progress` | Student view and completion tracking per note |
| `SubjectAssignment` | `subject_assignments` | Teacher↔Subject mapping |

---

## Request Flow

### Authentication

```
POST /api/auth/login
  → loginLimiter (5 req/15 min/IP)
  → bcrypt.compare(password, stored_hash)
  → jwt.sign({ id, role, email, name }, JWT_SECRET, { expiresIn: '8h' })
  → { token, user }
```

### Protected Route

```
GET /api/student/subjects
  → requireAuth  (verifies JWT, sets req.user)
  → requireRole('student')  (checks req.user.role)
  → handler (queries MongoDB with req.user.id context)
```

### PDF Streaming

```
GET /api/student/notes/:id/view
  → auth + role check
  → verify note belongs to student's B-S scope
  → record Progress (upsert viewed_at)
  → createReadStream(file_path)
  → pipe to res with no-cache headers
```

The full PDF binary is streamed server-side. The frontend never receives a direct file URL — all access goes through the authenticated endpoint.

---

## Security Middleware Stack

Applied in this order for every `/api/` request:

1. `helmet()` — sets secure HTTP headers (HSTS, XFO, etc.)
2. `cors()` — restricts to `CORS_ORIGIN` env var
3. `express-rate-limit` (global, 100 req/15 min) — general throttle
4. `loginLimiter` (5 req/15 min/IP) — on `/api/auth/login` only
5. `requireAuth` — JWT verification on protected routes
6. `requireRole(role)` — role enforcement per router

---

## Frontend Architecture

```
src/
├── components/
│   ├── admin/          # Admin dashboard, users, academic management
│   ├── teacher/        # Teacher dashboard, modules, notes, students
│   ├── student/        # Student dashboard, subjects, PDF viewer
│   └── shared/         # MainLayout, ErrorBoundary, UI primitives
├── contexts/
│   └── AuthContext.jsx # JWT storage, user state, login/logout
└── lib/
    └── api.js          # Centralized fetch client (Bearer token injection)
```

All HTTP calls route through `lib/api.js` which automatically attaches the JWT from `AuthContext`.

---

## Known Architectural Limitations

| Limitation | Context |
|-----------|---------|
| Local filesystem for PDFs | Not deployable to ephemeral PaaS without persistent volumes. Migrate to S3/R2 for production. |
| JWT in localStorage | XSS-accessible. Acceptable for portfolio; production should use httpOnly cookies. |
| No service layer | Business logic lives in route handlers. Refactoring to services would improve testability. |
| No pagination | List endpoints return all documents. Add cursor-based pagination for production datasets. |
| Single-process rate limiting | `loginLimiter` uses in-process memory. Multi-instance deployments need Redis-backed rate limiting. |
