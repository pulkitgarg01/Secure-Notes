# Secure Notes Platform - Complete Technical Explanation
## For Demonstration Day

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Authentication & Authorization](#authentication--authorization)
4. [PDF Security Implementation (CRITICAL)](#pdf-security-implementation-critical)
5. [Watermarking System](#watermarking-system)
6. [Database Structure](#database-structure)
7. [API Endpoints Flow](#api-endpoints-flow)
8. [Frontend Components](#frontend-components)
9. [Key Security Features](#key-security-features)
10. [Demonstration Talking Points](#demonstration-talking-points)

---

## 🎯 Project Overview

**What is this?**
A web application that allows teachers to upload educational PDF notes and share them securely with assigned students. The core challenge: **prevent unauthorized downloads while allowing viewing**.

**Why is this hard?**
- Browsers naturally allow downloading PDFs
- Users can screenshot, inspect elements, or use browser dev tools
- We need to balance security with usability

**Our Solution:**
- Custom PDF viewer (not browser's native viewer)
- Server-side authentication for every PDF request
- Dynamic watermarking with student identity
- Multiple layers of download prevention

---

## 🏗️ Architecture & Tech Stack

### **Backend (Node.js + Express)**
```
Why Node.js?
- JavaScript everywhere (same language as frontend)
- Fast, non-blocking I/O for file streaming
- Rich ecosystem (MongoDB, JWT, file handling)
```

**Key Libraries:**
- **Express**: Web server framework
- **Mongoose**: MongoDB database driver
- **JWT (jsonwebtoken)**: Token-based authentication
- **Multer**: File upload handling
- **Bcrypt**: Password hashing
- **PDF.js**: PDF rendering (bundled in frontend)

### **Frontend (React + Vite)**
```
Why React?
- Component-based architecture
- State management for user sessions
- Easy to build interactive UIs

Why Vite?
- Fast development server
- Modern build tool
- Hot module replacement
```

### **Database (MongoDB)**
```
Why MongoDB?
- Flexible schema (easy to add fields)
- JSON-like documents (matches our data)
- Good for rapid development
```

**Collections:**
- `users` - All users (admin, teachers, students)
- `notes` - PDF metadata (title, subject, file path)
- `assignments` - Links students to teachers

---

## 🔐 Authentication & Authorization

### **How Login Works:**

1. **User submits email/password** → Frontend sends to `/api/auth/login`

2. **Backend validates:**
   ```javascript
   // backend/routes/auth.js
   - Finds user by email in MongoDB
   - Compares password hash using bcrypt
   - If valid: Creates JWT token
   ```

3. **JWT Token Structure:**
   ```json
   {
     "id": "user_id_here",
     "role": "student",
     "email": "student@example.com",
     "name": "Student One"
   }
   ```
   - Signed with secret key (stored in `.env`)
   - Expires in 8 hours
   - Cannot be tampered with (cryptographically signed)

4. **Frontend stores token** in `localStorage`

5. **Every API request includes token:**
   ```javascript
   headers: {
     'Authorization': 'Bearer <token>'
   }
   ```

### **Authorization (Role-Based Access Control):**

**Middleware Chain:**
```javascript
// backend/middleware/auth.js
requireAuth → Checks if token is valid
    ↓
// backend/middleware/roleCheck.js
requireRole('student') → Checks if user role matches
    ↓
Route handler executes
```

**Example:**
- Student tries to access `/api/teacher/notes`
- `requireAuth` passes (token valid)
- `requireRole('teacher')` fails (user is student)
- Returns 403 Forbidden

---

## 🔒 PDF Security Implementation (CRITICAL)

### **Problem:**
- Browsers have native PDF viewers that allow easy download
- Users can right-click → Save As
- Users can use Ctrl+S or Print
- Direct file URLs can be shared

### **Our Multi-Layer Solution:**

#### **Layer 1: No Direct File URLs**

**What we DON'T do:**
```javascript
// ❌ BAD - Direct file URL
<img src="/uploads/file123.pdf" />
// Anyone with this URL can download it
```

**What we DO:**
```javascript
// ✅ GOOD - Authenticated API endpoint
GET /api/student/notes/:id/view
// Requires valid JWT token
// Checks if student is assigned to teacher
// Streams file through server
```

**Implementation:**
```javascript
// backend/routes/student.js (lines 39-62)
router.get('/notes/:id/view', async (req, res) => {
  // 1. Extract user from JWT token (already validated by middleware)
  const userId = req.user.id;
  
  // 2. Find the note in database
  const note = await Note.findById(id);
  
  // 3. CRITICAL: Verify student is assigned to this teacher
  const isAllowed = await Assignment.exists({
    student_id: userId,
    teacher_id: note.teacher_id
  });
  if (!isAllowed) return res.status(403).json({ error: 'Forbidden' });
  
  // 4. Set security headers (prevent caching, force inline display)
  res.setHeader('Content-Disposition', 'inline; filename="note.pdf"');
  res.setHeader('Cache-Control', 'no-store, no-cache');
  
  // 5. Stream file (never expose file path)
  const stream = fs.createReadStream(note.file_path);
  stream.pipe(res);
});
```

**Why this works:**
- File path is never exposed to frontend
- Every request requires authentication
- Server validates permissions before streaming
- Even if URL is copied, it won't work without valid token

---

#### **Layer 2: Custom PDF Viewer (Not Browser's Native Viewer)**

**The Problem with Native Browser Viewer:**
- Browser's PDF viewer has built-in download button
- Right-click menu allows saving
- Print dialog allows PDF export

**Our Solution: PDF.js**

**What is PDF.js?**
- Mozilla's JavaScript library for rendering PDFs
- Renders PDFs as HTML5 Canvas elements
- Gives us full control over the viewer

**How it works:**
```javascript
// frontend/src/components/SecurePDFViewer.jsx (lines 32-81)

// 1. Fetch PDF as binary data (not as a file URL)
const res = await fetch(srcUrl, {
  headers: { Authorization: `Bearer ${token}` }
});
const buf = await res.arrayBuffer(); // PDF as raw bytes

// 2. Parse PDF with PDF.js
const pdf = await getDocument({ data: buf }).promise;

// 3. Render each page as Canvas
for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.2 });
  
  // Create HTML5 Canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Render PDF page onto canvas
  await page.render({ canvasContext: ctx, viewport }).promise;
  
  // Add canvas to page (not a PDF file!)
  container.appendChild(canvas);
}
```

**Why Canvas instead of PDF?**
- Canvas is just pixels (like an image)
- No native download button
- No PDF context menu
- We control what happens on right-click

---

#### **Layer 3: Disable Download Shortcuts**

**Implementation:**
```javascript
// frontend/src/components/SecurePDFViewer.jsx (lines 10-29)

// Disable right-click
document.addEventListener('contextmenu', (e) => {
  e.preventDefault(); // Blocks right-click menu
});

// Disable keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  const ctrl = e.ctrlKey || e.metaKey; // Ctrl (Windows) or Cmd (Mac)
  
  // Block Ctrl+P (Print), Ctrl+S (Save), PrintScreen
  if ((ctrl && (key === 'p' || key === 's')) || key === 'printscreen') {
    e.preventDefault();
    e.stopPropagation();
    alert('Printing and saving are disabled.');
  }
}, true); // true = capture phase (catches before browser handles it)
```

**What this blocks:**
- ✅ Right-click → Save As
- ✅ Ctrl+S / Cmd+S (Save)
- ✅ Ctrl+P / Cmd+P (Print)
- ✅ PrintScreen key
- ✅ Browser's print dialog

**What it CAN'T block:**
- ❌ Screenshot tools (OS-level, can't prevent)
- ❌ Screen recording software
- ❌ Browser DevTools inspection (can see canvas data)
- ❌ Advanced users with technical knowledge

**Why we accept this limitation:**
- Most users won't bypass these protections
- Watermark provides traceability (if someone leaks, we know who)
- Perfect security is impossible; we focus on practical deterrence

---

#### **Layer 4: Security Headers**

**Backend Response Headers:**
```javascript
res.setHeader('Content-Disposition', 'inline; filename="note.pdf"');
// "inline" = display in browser, not download
// But since we use Canvas, browser never sees this

res.setHeader('Cache-Control', 'no-store, no-cache');
// Prevents browser from caching PDF
// Forces fresh request every time (with auth check)

res.setHeader('X-Content-Type-Options', 'nosniff');
// Prevents MIME type sniffing attacks
```

---

## 💧 Watermarking System

### **Purpose:**
- Traceability: If PDF is leaked, we know which student viewed it
- Deterrence: Visible watermark discourages sharing
- Accountability: Timestamp shows when it was viewed

### **How it Works:**

**1. Dynamic Watermark Generation:**
```javascript
// frontend/src/components/StudentDashboard.jsx (lines 19-21)
const ts = new Date().toLocaleString(); // Current timestamp
const teacherEmail = activeNote?.teacher?.email || 'Unknown';
const watermarkText = `
  ${auth.user.name} (${auth.user.email})
  Shared by: ${teacherEmail}
  ${ts}
`;
```

**2. Overlay Rendering:**
```javascript
// frontend/src/components/SecurePDFViewer.jsx (lines 83-99)

// Create fixed overlay div
<div ref={overlayRef} style={{
  position: 'fixed',      // Fixed to viewport
  inset: 0,              // Covers entire screen
  pointerEvents: 'none',  // Doesn't block clicks on PDF
  fontSize: '32px',
  color: 'rgba(0,0,0,0.18)', // Semi-transparent
  transform: 'rotate(-25deg)', // Diagonal
  zIndex: 1000,          // Above PDF canvas
  userSelect: 'none'     // Can't select/copy text
}} />
```

**3. Why This Approach:**
- **Overlay, not embedded**: Watermark is added in browser, not on original PDF
- **Dynamic**: Changes based on who's viewing and when
- **Non-intrusive**: Semi-transparent, doesn't block reading
- **Always visible**: Fixed position means it's always on screen

**4. Limitations:**
- Advanced users could inspect element and hide overlay
- Screenshots won't have watermark if taken before overlay loads
- But for 99% of users, it's effective

---

## 🗄️ Database Structure

### **Users Collection:**
```javascript
{
  _id: ObjectId("..."),
  email: "teacher1@example.com",
  password: "$2a$10$hashed...", // bcrypt hash
  role: "teacher", // or "student" or "admin"
  name: "Teacher One",
  created_at: ISODate("2025-01-01T10:00:00Z")
}
```

### **Notes Collection:**
```javascript
{
  _id: ObjectId("..."),
  teacher_id: ObjectId("teacher_id"), // Reference to User
  title: "Math Chapter 5",
  subject: "Mathematics",
  description: "Algebra basics",
  file_path: "uploads/1234567890-123456789.pdf", // Server path
  uploaded_at: ISODate("2025-01-01T10:00:00Z")
}
```

**Important:** `file_path` is server-side only. Frontend never sees it.

### **Assignments Collection:**
```javascript
{
  _id: ObjectId("..."),
  student_id: ObjectId("student_id"), // Reference to User
  teacher_id: ObjectId("teacher_id"), // Reference to User
  createdAt: ISODate("2025-01-01T10:00:00Z")
}
```

**Purpose:** Links students to teachers. Only assigned students can see teacher's notes.

---

## 🔄 API Endpoints Flow

### **Student Viewing a PDF:**

```
1. Student clicks "View" button
   ↓
2. Frontend: StudentDashboard.jsx
   - Sets activeNote state
   - Renders SecurePDFViewer component
   ↓
3. SecurePDFViewer mounts
   - Calls: GET /api/student/notes/:id/view
   - Includes: Authorization: Bearer <token>
   ↓
4. Backend: routes/student.js
   - Middleware: requireAuth → Validates JWT token
   - Middleware: requireRole('student') → Checks role
   - Handler: Verifies Assignment exists
   - Handler: Reads file from disk
   - Handler: Streams PDF bytes to frontend
   ↓
5. Frontend: SecurePDFViewer.jsx
   - Receives PDF as ArrayBuffer
   - Parses with PDF.js
   - Renders each page as Canvas
   - Applies watermark overlay
   - Disables right-click and shortcuts
```

### **Teacher Uploading PDF:**

```
1. Teacher fills form (title, subject, file)
   ↓
2. Frontend: TeacherDashboard.jsx
   - Creates FormData with file
   - POST /api/teacher/notes
   ↓
3. Backend: routes/teacher.js
   - Middleware: requireAuth + requireRole('teacher')
   - Multer: Validates file is PDF
   - Multer: Saves to uploads/ folder
   - Creates Note document in MongoDB
   - Returns note metadata
```

---

## 🎨 Frontend Components

### **App.jsx (Root Component)**
- Manages authentication state (logged in user)
- Routes to appropriate dashboard based on role
- Handles login/logout

### **Login.jsx**
- Simple form (email, password)
- Calls `/api/auth/login`
- Stores token in localStorage on success

### **AdminDashboard.jsx**
- User management (create, delete users)
- View system stats
- Assign students to teachers

### **TeacherDashboard.jsx**
- Upload PDF form
- List of uploaded notes
- Delete notes

### **StudentDashboard.jsx**
- Search/filter notes
- List of available notes
- Toggle View/Close button
- Renders SecurePDFViewer when note selected

### **SecurePDFViewer.jsx** (Most Important!)
- Fetches PDF via authenticated endpoint
- Renders PDF with PDF.js as Canvas
- Applies watermark overlay
- Disables download/print shortcuts

---

## 🛡️ Key Security Features Summary

### **1. Authentication**
- ✅ JWT tokens (stateless, secure)
- ✅ Password hashing (bcrypt)
- ✅ Token expiration (8 hours)

### **2. Authorization**
- ✅ Role-based access control (RBAC)
- ✅ Middleware chain (auth → role check)
- ✅ Assignment verification (student must be assigned to teacher)

### **3. PDF Protection**
- ✅ No direct file URLs (all via authenticated API)
- ✅ Custom viewer (PDF.js Canvas, not browser viewer)
- ✅ Disabled right-click
- ✅ Disabled keyboard shortcuts (Ctrl+S, Ctrl+P)
- ✅ Security headers (no caching, inline display)

### **4. Watermarking**
- ✅ Dynamic watermark (student name, email, timestamp, teacher email)
- ✅ Overlay approach (not embedded in PDF)
- ✅ Semi-transparent, diagonal, always visible

### **5. File Security**
- ✅ PDF-only validation (Multer file filter)
- ✅ File size limits (configurable via env)
- ✅ Server-side file storage (paths never exposed)

---

## 🎤 Demonstration Talking Points

### **Opening (30 seconds):**
"Today I'll demonstrate a secure notes sharing platform. The challenge: allow students to view educational PDFs while preventing unauthorized downloads. I'll show you how we solved this with a multi-layer security approach."

### **Show Login (30 seconds):**
"Users authenticate with email and password. The backend validates credentials and issues a JWT token. This token is required for every API request."

### **Show Admin Dashboard (1 minute):**
"As admin, I can create users and assign students to teachers. This assignment is critical—only assigned students can view a teacher's notes."

### **Show Teacher Upload (1 minute):**
"Teachers upload PDFs with metadata. The file is stored server-side, and only metadata is stored in the database. The file path is never exposed to the frontend."

### **Show Student Viewing (2 minutes - MOST IMPORTANT):**
"When a student clicks View, here's what happens:

1. **No Direct URL**: The frontend requests `/api/student/notes/:id/view`—an authenticated endpoint, not a direct file URL.

2. **Permission Check**: The backend verifies:
   - Is the token valid? (Authentication)
   - Is the user a student? (Authorization)
   - Is this student assigned to the teacher who owns this note? (Access control)

3. **Custom Viewer**: Instead of the browser's native PDF viewer, we use PDF.js to render the PDF as HTML5 Canvas elements. This gives us full control.

4. **Download Prevention**: 
   - Right-click is disabled
   - Ctrl+S and Ctrl+P are blocked
   - There's no download button because it's not a PDF file—it's rendered pixels

5. **Watermark**: Notice the watermark showing the student's name, email, teacher's email, and timestamp. This is dynamically generated and overlaid on the viewer.

6. **Security Headers**: The backend sends headers preventing caching, ensuring every view requires fresh authentication."

### **Address Limitations (30 seconds):**
"Perfect security is impossible—advanced users could screenshot or use dev tools. But we've implemented practical deterrence and traceability. The watermark ensures if content is leaked, we know who viewed it and when."

### **Closing (30 seconds):**
"This demonstrates a multi-layer security approach: authentication, authorization, custom rendering, and watermarking. The combination makes unauthorized distribution difficult while maintaining usability for legitimate users."

---

## 🔍 Technical Deep Dives (If Asked)

### **Q: Why Canvas instead of iframe?**
**A:** Iframe would still use browser's PDF viewer. Canvas gives us pixel-level control and no native download options.

### **Q: Can users inspect element and see the PDF?**
**A:** Yes, but they'd see base64-encoded canvas data, not the original PDF. Reconstructing a PDF from canvas is non-trivial.

### **Q: What if someone copies the API URL?**
**A:** The URL requires a valid JWT token. Tokens expire in 8 hours and are tied to specific users. Even if copied, it won't work without authentication.

### **Q: Why not embed watermark in PDF server-side?**
**A:** Dynamic watermarks (different per student, per view) require server-side PDF manipulation, which is computationally expensive. Overlay is faster and still effective.

### **Q: How do you prevent screenshot tools?**
**A:** We can't—that's OS-level. But watermarking provides traceability, and most users won't go to that effort.

### **Q: Why JavaScript instead of TypeScript?**
**A:** For this MVP, JavaScript was chosen for faster development and simplicity. TypeScript would add type safety and better IDE support, which are valuable for larger teams and long-term maintenance. However, for a focused MVP with clear, simple data structures (users, notes, assignments), JavaScript's flexibility allowed rapid iteration. The codebase is structured to be easily migrated to TypeScript later if needed—the modular architecture (routes, models, middleware) makes adding type definitions straightforward. In a production environment with a larger team, TypeScript would be the better choice for catching errors at compile-time and improving code maintainability.

---

## 📝 Quick Reference

**Backend Port:** 4000
**Frontend Port:** 5173
**Database:** MongoDB (localhost:27017)
**JWT Secret:** Stored in `.env` file
**Upload Directory:** `backend/uploads/`

**Key Files:**
- `backend/routes/student.js` - PDF serving endpoint
- `frontend/src/components/SecurePDFViewer.jsx` - Custom viewer
- `backend/middleware/auth.js` - JWT validation
- `backend/models/Assignment.js` - Student-teacher links

---

**Good luck with your demonstration! 🚀**

