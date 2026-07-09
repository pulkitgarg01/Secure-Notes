# Deployment Guide

---

## Local Development (Quickstart)

**Prerequisites:** Node.js 18+, MongoDB 7+ running locally

```bash
# 1. Clone and install
git clone <repo-url>
cd secure-notes
npm install          # installs concurrently at root
npm run install:all  # installs backend + frontend deps

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — set JWT_SECRET (min 32 chars), BOOTSTRAP_TOKEN

# 3. Start both servers
npm run dev
```

Both servers start:
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

### Bootstrapping the First Admin

With the backend running and `BOOTSTRAP_TOKEN` set:

```bash
curl -X POST http://localhost:4000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: <your-BOOTSTRAP_TOKEN>" \
  -d '{"email": "admin@example.com", "password": "YourSecurePassword!", "name": "Admin"}'
```

The endpoint auto-disables after the first user exists.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `PORT` | No | `4000` | HTTP port |
| `MONGO_URI` | No | `mongodb://127.0.0.1:27017/secure_notes` | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | Min 32 chars; server exits if absent/short |
| `UPLOAD_DIR` | No | `uploads` | Relative path for PDF storage |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed origin for CORS |
| `MAX_UPLOAD_MB` | No | `20` | Max PDF upload size in MB |
| `BOOTSTRAP_TOKEN` | Yes (first run) | — | Required to call `/api/auth/bootstrap-admin` |

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `VITE_API_BASE` | No | `http://localhost:4000/api` | Backend API base URL |

---

## Target Production Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Vercel     │     │   Railway    │     │  MongoDB Atlas   │
│  (Frontend)  │────▶│  (Backend)   │────▶│   (Database)     │
│  React SPA   │     │  Express API │     │                  │
└──────────────┘     └──────┬───────┘     └──────────────────┘
                            │
                     ┌──────▼───────┐
                     │  Persistent  │
                     │   Volume /   │
                     │  Cloud Store │
                     └──────────────┘
```

**Estimated cost on free tiers:** $0–15/month

---

## Railway (Backend)

1. Create a new Railway project and connect your GitHub repo.
2. Set the **Root Directory** to `backend/`.
3. Add environment variables (PORT, MONGO_URI, JWT_SECRET, BOOTSTRAP_TOKEN, CORS_ORIGIN, MAX_UPLOAD_MB).
4. Railway auto-detects `npm run start` from `package.json`.

> ⚠️ Railway's ephemeral filesystem means uploaded PDFs will be lost on redeploy. For production, migrate storage to an S3-compatible service (Cloudflare R2 recommended — generous free tier).

## Vercel (Frontend)

1. Import your GitHub repo to Vercel.
2. Set **Root Directory** to `frontend/`.
3. Set `VITE_API_BASE` to your Railway backend URL (e.g. `https://my-app.railway.app/api`).
4. Vercel auto-detects Vite and runs `npm run build`.

## MongoDB Atlas

1. Create a free M0 cluster at https://cloud.mongodb.com.
2. Create a database user with read/write on `secure_notes`.
3. Whitelist Railway's egress IPs (or use 0.0.0.0/0 for dev).
4. Use the connection string as `MONGO_URI` (includes TLS by default).

---

## PDF Storage in Production

Local disk storage (`backend/uploads/`) is suitable for development only. For production:

**Option A: Cloudflare R2 (recommended)**
- S3-compatible API, generous free tier (10 GB storage, no egress fees)
- Replace Multer `diskStorage` with `multer-s3` pointed at R2

**Option B: AWS S3**
- Well-documented, higher cost at scale
- Use `@aws-sdk/client-s3` with pre-signed URLs for streaming

The storage adapter swap would be in `backend/routes/teacher.js` (Multer config) and `backend/routes/student.js` (file streaming logic).

---

## Health Check

```
GET /api/health
→ { status: 'ok' }
```

Returns 200 when the server is up. Does not currently verify MongoDB connectivity (enhancement planned).

---

## HTTPS

**Development:** HTTP only.

**Production:** Terminate TLS at the reverse proxy (Vercel/Railway handles this automatically). Helmet's `Strict-Transport-Security` header is set when `NODE_ENV=production`.
