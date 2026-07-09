#!/usr/bin/env node
/**
 * Phase A regression test suite for security-hardening-phase-1
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:4000/api';
const BOOTSTRAP_TOKEN = 'regression-bootstrap-token-secret';
const PDF_PATH = path.join(__dirname, '..', 'test-fixtures', 'sample.pdf');

const results = [];

function record(id, name, pass, details = '') {
  results.push({ id, name, pass, details });
  const icon = pass ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${id}: ${name}${details ? ` — ${details}` : ''}`);
}

async function request(method, endpoint, { token, bootstrapToken, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (bootstrapToken) headers['X-Bootstrap-Token'] = bootstrapToken;
  const opts = { method, headers };
  if (formData) {
    opts.body = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${endpoint}`, opts);
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, data, headers: res.headers };
}

async function run() {
  console.log('=== Phase A Regression Tests ===\n');

  // Pre-check: health
  const health = await request('GET', '/health');
  if (health.status !== 200) {
    console.error('Server not healthy. Aborting.');
    process.exit(1);
  }

  // 1. Bootstrap admin flow
  const regRemoved = await request('POST', '/auth/register', {
    body: { email: 'x@test.com', password: 'pass', role: 'admin', name: 'X' },
  });
  record(
    '1a',
    'Public register endpoint removed',
    regRemoved.status === 404,
    `status=${regRemoved.status}`
  );

  const noToken = await request('POST', '/auth/bootstrap-admin', {
    body: { email: 'admin@test.com', password: 'AdminPass123!', name: 'Admin User' },
  });
  record('1b', 'Bootstrap rejects missing token', noToken.status === 403, `status=${noToken.status}`);

  const badToken = await request('POST', '/auth/bootstrap-admin', {
    bootstrapToken: 'wrong-token',
    body: { email: 'admin@test.com', password: 'AdminPass123!', name: 'Admin User' },
  });
  record('1c', 'Bootstrap rejects invalid token', badToken.status === 403, `status=${badToken.status}`);

  const bootstrap = await request('POST', '/auth/bootstrap-admin', {
    bootstrapToken: BOOTSTRAP_TOKEN,
    body: { email: 'admin@test.com', password: 'AdminPass123!', name: 'Admin User' },
  });
  record(
    '1d',
    'Bootstrap admin with valid token',
    bootstrap.status === 200 && bootstrap.data?.id,
    `status=${bootstrap.status}`
  );

  const bootstrapAgain = await request('POST', '/auth/bootstrap-admin', {
    bootstrapToken: BOOTSTRAP_TOKEN,
    body: { email: 'other@test.com', password: 'OtherPass123!', name: 'Other' },
  });
  record(
    '1e',
    'Bootstrap blocked after initialization',
    bootstrapAgain.status === 403,
    `status=${bootstrapAgain.status}`
  );

  // 2. Admin login
  const adminLogin = await request('POST', '/auth/login', {
    body: { email: 'admin@test.com', password: 'AdminPass123!' },
  });
  const adminToken = adminLogin.data?.token;
  record(
    '2',
    'Admin login',
    adminLogin.status === 200 && adminToken && adminLogin.data?.user?.role === 'admin',
    `status=${adminLogin.status}`
  );

  // 5 & 6. Admin user creation + password hashing
  const teacherCreate = await request('POST', '/admin/users', {
    token: adminToken,
    body: {
      email: 'teacher@test.com',
      password: 'TeacherPass123!',
      role: 'teacher',
      name: 'Test Teacher',
    },
  });
  record(
    '5',
    'Admin can create teacher user',
    teacherCreate.status === 201 && teacherCreate.data?.email === 'teacher@test.com',
    `status=${teacherCreate.status}`
  );

  const studentCreate = await request('POST', '/admin/users', {
    token: adminToken,
    body: {
      email: 'student@test.com',
      password: 'StudentPass123!',
      role: 'student',
      name: 'Test Student',
    },
  });
  record(
    '5b',
    'Admin can create student user',
    studentCreate.status === 201 && studentCreate.data?.email === 'student@test.com',
    `status=${studentCreate.status}`
  );

  // Check password hashing via MongoDB
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure_notes_regression_test');
  const User = mongoose.connection.collection('users');
  const teacherDoc = await User.findOne({ email: 'teacher@test.com' });
  const isHashed =
    teacherDoc?.password &&
    teacherDoc.password.startsWith('$2') &&
    teacherDoc.password !== 'TeacherPass123!';
  record(
    '6',
    'User creation passwords are hashed',
    isHashed,
    isHashed ? 'bcrypt hash confirmed' : `stored=${teacherDoc?.password?.slice(0, 20)}`
  );

  // 3. Teacher login
  const teacherLogin = await request('POST', '/auth/login', {
    body: { email: 'teacher@test.com', password: 'TeacherPass123!' },
  });
  const teacherToken = teacherLogin.data?.token;
  record(
    '3',
    'Teacher login',
    teacherLogin.status === 200 && teacherToken && teacherLogin.data?.user?.role === 'teacher',
    `status=${teacherLogin.status}`
  );

  // 4. Student login
  const studentLogin = await request('POST', '/auth/login', {
    body: { email: 'student@test.com', password: 'StudentPass123!' },
  });
  const studentToken = studentLogin.data?.token;
  record(
    '4',
    'Student login',
    studentLogin.status === 200 && studentToken && studentLogin.data?.user?.role === 'student',
    `status=${studentLogin.status}`
  );

  // 7. JWT authentication
  const noAuth = await request('GET', '/admin/stats');
  record('7a', 'JWT rejects missing token', noAuth.status === 401, `status=${noAuth.status}`);

  const badJwt = await request('GET', '/admin/stats', { token: 'invalid.jwt.token' });
  record('7b', 'JWT rejects invalid token', badJwt.status === 401, `status=${badJwt.status}`);

  const goodJwt = await request('GET', '/admin/stats', { token: adminToken });
  record('7c', 'JWT accepts valid admin token', goodJwt.status === 200, `status=${goodJwt.status}`);

  // 8. Protected routes (role-based)
  const studentAdmin = await request('GET', '/admin/stats', { token: studentToken });
  record(
    '8a',
    'Protected route blocks student from admin endpoint',
    studentAdmin.status === 403,
    `status=${studentAdmin.status}`
  );

  const teacherAdmin = await request('GET', '/admin/stats', { token: teacherToken });
  record(
    '8b',
    'Protected route blocks teacher from admin endpoint',
    teacherAdmin.status === 403,
    `status=${teacherAdmin.status}`
  );

  const adminTeacherRoute = await request('GET', '/teacher/subjects', { token: adminToken });
  record(
    '8c',
    'Protected route blocks admin from teacher endpoint',
    adminTeacherRoute.status === 403,
    `status=${adminTeacherRoute.status}`
  );

  // Setup academic structure for PDF tests
  const branch = await request('POST', '/academic/branches', {
    token: adminToken,
    body: { name: 'Computer Science', code: 'CS' },
  });
  const semester = await request('POST', '/academic/semesters', {
    token: adminToken,
    body: { number: 1 },
  });
  const section = await request('POST', '/academic/sections', {
    token: adminToken,
    body: {
      name: 'A',
      branch_id: branch.data._id,
      semester_id: semester.data._id,
    },
  });
  const subject = await request('POST', '/academic/subjects', {
    token: adminToken,
    body: {
      name: 'Data Structures',
      code: 'CS101',
      branch_id: branch.data._id,
      semester_id: semester.data._id,
    },
  });

  const teacherId = teacherCreate.data._id;
  const studentId = studentCreate.data._id;

  await request('PUT', `/admin/users/${teacherId}`, {
    token: adminToken,
    body: {
      branch_id: branch.data._id,
      semester_id: semester.data._id,
      section_id: section.data._id,
    },
  });
  await request('PUT', `/admin/users/${studentId}`, {
    token: adminToken,
    body: {
      branch_id: branch.data._id,
      semester_id: semester.data._id,
      section_id: section.data._id,
    },
  });
  await request('POST', '/admin/assign-subject', {
    token: adminToken,
    body: { teacher_id: teacherId, subject_id: subject.data._id },
  });

  const moduleRes = await request('POST', '/teacher/modules', {
    token: teacherToken,
    body: { subject_id: subject.data._id, title: 'Module 1', description: 'Intro' },
  });

  // 9. PDF upload
  const form = new FormData();
  form.append('title', 'Sample Note');
  form.append('module_id', moduleRes.data._id);
  form.append('description', 'Regression test PDF');
  form.append('file', new Blob([fs.readFileSync(PDF_PATH)], { type: 'application/pdf' }), 'sample.pdf');

  const upload = await request('POST', '/teacher/notes', {
    token: teacherToken,
    formData: form,
  });
  record(
    '9',
    'PDF upload',
    upload.status === 200 && upload.data?.title === 'Sample Note',
    `status=${upload.status}`
  );

  // 10. PDF viewing
  const noteId = upload.data?._id;
  const viewRes = await fetch(`${BASE}/student/notes/${noteId}/view`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const viewContentType = viewRes.headers.get('content-type') || '';
  const viewBody = await viewRes.arrayBuffer();
  const isPdf =
    viewRes.status === 200 &&
    viewContentType.includes('pdf') &&
    Buffer.from(viewBody).slice(0, 5).toString() === '%PDF-';
  record(
    '10',
    'PDF viewing',
    isPdf,
    `status=${viewRes.status}, content-type=${viewContentType}`
  );

  await mongoose.disconnect();

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
  return { results, passed, failed };
}

run()
  .then(({ results, passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
