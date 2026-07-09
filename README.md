# Secure Notes

**Access-controlled academic content delivery with view-only PDF distribution, identity watermarking, and progress analytics.**

A full-stack portfolio project demonstrating role-based access control, secure file streaming, and a production-oriented security posture in a Node.js + React application.

---

## Features

| Feature | Details |
|---------|---------|
| **Role-based access** | Three roles: Admin, Teacher, Student with separate dashboards and API scopes |
| **Academic hierarchy** | Branch → Semester → Section → Subject → Module → Note |
| **Secure PDF streaming** | PDFs served through authenticated routes — no direct file URLs |
| **Identity watermark** | Student name and timestamp overlaid on every PDF page |
| **Access scope enforcement** | Teachers scoped to assigned subjects; students scoped to branch+semester |
| **Progress tracking** | Per-student view and completion tracking on each note |
| **Rate-limited login** | 5 attempts / 15 min / IP on the login endpoint |
| **Admin user management** | Admin-only user creation, editing, role assignment |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Backend | Node.js 18+, Express 4 |
| Database | MongoDB 7+ (Mongoose 8) |
| Auth | JWT (HS256, 8h expiry) + bcryptjs |
| PDF Viewer | PDF.js (pdfjs-dist 4.x) |
| File Upload | Multer 2.x |
| Security | Helmet, express-rate-limit, regex escaping |

---

## Quick Start

**Requirements:** Node.js 18+, MongoDB 7+ running locally

```bash
# 1. Clone & install
git clone <repo-url> && cd secure-notes
npm install && npm run install:all

# 2. Configure backend
cp backend/.env.example backend/.env
# Edit backend/.env — set JWT_SECRET and BOOTSTRAP_TOKEN

# 3. Run
npm run dev
```

- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

### First Admin Setup

```bash
curl -X POST http://localhost:4000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: <your-BOOTSTRAP_TOKEN-value>" \
  -d '{"email": "admin@example.com", "password": "YourStrongPassword!", "name": "Admin"}'
```

> The endpoint is disabled after the first user exists.

---

## Environment Variables

See [`backend/.env.example`](./backend/.env.example) for the full reference. Key variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | **Yes** | Min 32 characters — server exits on startup if absent or too short |
| `BOOTSTRAP_TOKEN` | Yes (first run) | Random secret required for initial admin creation |
| `MONGO_URI` | No | Defaults to `mongodb://127.0.0.1:27017/secure_notes` |

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Project Structure

```
secure-notes/
├── backend/
│   ├── config/         # Env validation (env.js)
│   ├── middleware/     # requireAuth, requireRole
│   ├── models/         # Mongoose models
│   ├── routes/         # auth, admin, academic, teacher, student
│   └── server.js       # Entry point
├── frontend/
│   └── src/
│       ├── components/ # admin/, teacher/, student/, shared/
│       ├── contexts/   # AuthContext
│       └── lib/        # api.js (centralized HTTP client)
└── docs/
    ├── ARCHITECTURE.md
    ├── SECURITY.md
    ├── DEPLOYMENT.md
    └── INTERVIEW_GUIDE.md
```

---

## Security Model

PDF access is **deterrence-layer security**: authenticated streaming, no direct file URLs, identity watermarking, and input sanitization. It is not cryptographic DRM.

Key controls:
- JWT secret validated at startup (≥ 32 chars required)
- No public registration endpoint — users created only by authenticated admins
- Bootstrap endpoint token-gated and auto-disabled after first admin
- Login rate-limited (5 req/15 min/IP)
- `$regex` search queries escaped to prevent ReDoS
- PDF upload validated by MIME type, capped at 20 MB

**Known limitations are documented in [`docs/SECURITY.md`](./docs/SECURITY.md)** — including JWT storage trade-offs and the limits of client-side PDF protection.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System design, data model, request flows |
| [`docs/SECURITY.md`](./docs/SECURITY.md) | Security controls, limitations, and interview talking points |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Local setup, production targets (Vercel + Railway + Atlas) |
| [`docs/INTERVIEW_GUIDE.md`](./docs/INTERVIEW_GUIDE.md) | Demo flow, anticipated questions, retrospective |

---

## Available Scripts

From the **repo root**:

| Command | Action |
|---------|--------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run install:all` | Install backend + frontend dependencies |
| `npm run build` | Build frontend production bundle |
| `npm run start` | Start backend in production mode |

---

## License

MIT
