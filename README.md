# Acadence — Academic Content Distribution Platform

A role-based platform for managing and distributing academic resources across Admin, Teacher, and Student workflows. Resources, assignments, and communication channels are scoped to academic relationships — students only access content from the subjects they are enrolled in, and PDFs are delivered through authenticated backend endpoints with user-specific watermarking applied server-side before delivery.

## Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Configure the academic structure (branches, semesters, sections, subjects); create and manage user accounts; assign subjects to teachers; view system activity |
| **Teacher** | Manage PDF resources within module folders for assigned subjects; create and manage assignments; post announcements; message students |
| **Student** | Access subjects based on academic enrollment; view watermarked PDFs; submit assignments; track resource completion; communicate with faculty |

## Features

- **Role-based authentication and authorization** — JWT-based auth with separate middleware for role enforcement. Each role has its own API routes and dashboard.
- **Subject-based access control** — Students see only subjects matching their branch, semester, and section. Teacher routes verify subject ownership via `SubjectAssignment` records before allowing any write operations.
- **Module-based content organization** — Academic content follows a Branch → Semester → Section → Subject → Module → Resource hierarchy. Teachers organize resources into module folders.
- **PDF resource management** — Upload, publish, archive, and delete PDF resources. Each resource tracks status (`draft`, `published`, `archived`), version, view count, and file size. Only published resources are visible to students.
- **Authenticated PDF delivery** — PDFs are served through a streaming endpoint that requires a valid JWT. Files are stored with randomised names and are never exposed via a static file URL.
- **Server-side PDF watermarking** — Before a PDF is streamed to the client, `pdf-lib` applies a diagonal watermark to every page containing the viewer's name, email, role, and a UTC timestamp. This is applied at request time, not stored permanently. The client-side viewer also disables right-click and intercepts print shortcuts as a deterrent, though these are not a strong access control mechanism.
- **Assignment creation and submission** — Teachers create tasks with a title, description, and due date. Students submit PDFs. Submission history is tracked. A background `node-cron` job checks deadlines and triggers notifications.
- **Announcements** — Teachers can post announcements visible to students in their subjects.
- **Faculty–student messaging** — Conversation threads between teachers and students with read/unread state.
- **In-app notifications** — Notifications for new messages, assignment deadlines, and announcements.
- **Progress tracking** — Records which resources a student has viewed and whether they marked it complete. Students can see per-subject completion percentages.
- **Command Palette** — ⌘K / Ctrl+K opens a searchable command palette for navigating across the app.
- **Dark/light mode** — Theme toggle with persistent preference stored locally.

## Tech Stack

**Frontend**

- React 18, Vite, React Router v7
- Tailwind CSS, tailwind-merge, clsx
- PDF.js (`pdfjs-dist`) for in-browser PDF rendering
- Framer Motion, Recharts
- cmdk (command palette), Sonner (toasts), Lucide React (icons)
- `@radix-ui/react-context-menu`, `date-fns`

**Backend**

- Node.js, Express 4
- MongoDB, Mongoose 8
- `jsonwebtoken`, bcryptjs
- Multer 2.x (file uploads), pdf-lib (server-side watermarking)
- Helmet, express-rate-limit, morgan
- node-cron (deadline notifications), cors, dotenv, mime-types

## Project Structure

```
Acadence/
├── backend/
│   ├── config/            # Environment variable validation
│   ├── middleware/         # requireAuth, requireRole
│   ├── models/            # Mongoose schemas
│   ├── routes/            # auth, admin, academic, teacher, student, communication
│   ├── services/          # WatermarkService, StorageService, DeadlineService
│   ├── sample-resources/  # Sample PDFs for development and seeding
│   ├── seed.js            # Dev/demo data script
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/    # admin/, teacher/, student/, communication/, ui/, layout/
│       ├── contexts/      # AuthContext, ThemeContext
│       ├── lib/           # api.js, utils.js
│       └── utils/
└── package.json           # Root workspace — runs both servers via concurrently
```

## Local Setup

**Prerequisites:** Node.js 18+, MongoDB running locally

```bash
git clone https://github.com/pulkitgarg01/Acadence.git
cd Acadence
npm install
npm run install:all

cp backend/.env.example backend/.env
# Edit backend/.env before starting
```

The server will not start if `JWT_SECRET` is missing or shorter than 32 characters. Set all required values in `backend/.env` before running:

```bash
npm run dev
# Backend:  http://localhost:4000
# Frontend: http://localhost:5173
```

**Create the first admin account** (the `/bootstrap-admin` endpoint auto-disables after the first admin exists):

```bash
curl -X POST http://localhost:4000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: <your-BOOTSTRAP_TOKEN>" \
  -d '{"email": "admin@example.com", "password": "YourPassword!", "name": "Admin"}'
```

**Or load demo data** (seeds the database with admin, 6 teachers, 175 students, and sample resources from `backend/sample-resources/`):

```bash
cd backend && node seed.js
```

Demo credentials (development only — do not use these in any deployed instance):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@acadence.edu` | `admin123` |
| Teacher | `sarah.chen@acadence.edu` | `admin123` |
| Student | `<firstname>.<lastname><n>@student.acadence.edu` | `student123` |

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | Yes | Minimum 32 characters. Server exits on startup if absent or too short. |
| `BOOTSTRAP_TOKEN` | First run | Required to call `POST /api/auth/bootstrap-admin`. |
| `MONGO_URI` | No | Defaults to `mongodb://127.0.0.1:27017/acadence`. |
| `PORT` | No | Defaults to `4000`. |
| `CORS_ORIGIN` | No | Defaults to `http://localhost:5173`. |
| `UPLOAD_DIR` | No | Defaults to `uploads`. |
| `MAX_UPLOAD_MB` | No | Defaults to `20`. |
| `VITE_API_BASE` | No | Frontend only. Defaults to `http://localhost:4000/api`. |

## Sample Resources

`backend/sample-resources/` contains sample PDF files organised by subject (Cloud Computing, Cyber Security, DBMS, Distributed Systems, Machine Learning, Operating Systems, Software Engineering). These are used by `seed.js` to populate the database with realistic content for development and demonstration purposes.
