# Acadence

Acadence is a role-based academic content management platform that enables administrators, faculty, and students to securely manage, distribute, organize, and access academic resources.

## Key Features

- **Role-Based Access Control**: Separate portals for Administrators, Faculty, and Students.
- **Academic Hierarchy**: Organize by Branch, Semester, Section, and Subject.
- **Secure Content Delivery**: PDFs are streamed securely with dynamic watermarking (identity and timestamp).
- **Progress Tracking**: Students can track completion of their assigned resources.
- **Modern UI**: Clean, professional interface built with React, Tailwind CSS, and Lucide icons.

## Architecture

- **Frontend**: React (Vite), React Router, Tailwind CSS, PDF.js for secure viewing
- **Backend**: Node.js, Express, MongoDB
- **Security**: JWT authentication, rate limiting, IP tracking, secure headers (Helmet), regex validation

## Setup

Please see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for local setup and deployment instructions.

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design and database schema
- [SECURITY.md](docs/SECURITY.md) - Security mechanisms and threat models
- [INTERVIEW_GUIDE.md](docs/INTERVIEW_GUIDE.md) - Talking points for interviews

## License

Private repository. All rights reserved.
