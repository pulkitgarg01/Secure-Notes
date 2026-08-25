import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import Note from '../models/Note.js';
import Module from '../models/Module.js';
import StorageService from '../services/StorageService.js';
import SubjectAssignment from '../models/SubjectAssignment.js';
import Subject from '../models/Subject.js';
import Activity from '../models/Activity.js';
import WatermarkService from '../services/WatermarkService.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// Stats
router.get('/stats', async (_req, res) => {
  const [teachers, students, notes, recentUsers, recentSubjects, recentActivities, publishedNotes, draftNotes, totalSubjects] = await Promise.all([
    User.countDocuments({ role: 'teacher', status: 'active' }),
    User.countDocuments({ role: 'student', status: 'active' }),
    Note.countDocuments(),
    User.find({ role: 'teacher' }, '-password').sort({ _id: -1 }).limit(5),
    Subject.find().sort({ _id: -1 }).limit(5),
    Activity.find().sort({ created_at: -1 }).limit(15),
    Note.countDocuments({ status: 'published' }),
    Note.countDocuments({ status: 'draft' }),
    Subject.countDocuments()
  ]);
  res.json({ teachers, students, notes, recentFaculty: recentUsers, recentSubjects, recentActivities, publishedNotes, draftNotes, totalSubjects });
});

// All Files (Notes)
router.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find()
      .populate('teacher_id', 'name email')
      .populate({
        path: 'module_id',
        select: 'title subject_id',
        populate: {
          path: 'subject_id',
          select: 'name code'
        }
      })
      .sort({ uploaded_at: -1 })
      .limit(500);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.file_path) {
      await StorageService.deleteFile(note.file_path).catch(() => {});
    }
    await Note.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notes/:id/view', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    const exists = await StorageService.fileExists(note.file_path);
    if (!note.file_path || !exists) return res.status(404).json({ error: 'File not found' });
    
    const adminUser = await User.findById(req.user.id);
    const pdfBuffer = await StorageService.getFileBuffer(note.file_path);
    const watermarkedBuffer = await WatermarkService.applyWatermark(pdfBuffer, adminUser, { name: note.title });

    await Activity.create({
      actor_id: adminUser._id,
      actor_name: adminUser.name,
      action: 'watermark_generated',
      target_name: note.title,
      target_type: 'Note',
      metadata: {
        userId: adminUser._id,
        resourceId: note._id,
        watermarkGeneratedAt: new Date(),
        accessTimestamp: new Date(),
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${note.title}.pdf"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Length', watermarkedBuffer.length);
    
    res.end(watermarkedBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Users CRUD (with academic structure)
router.get('/users', async (req, res) => {
  try {
    const { role, branch_id, semester_id, section_id } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (branch_id) filter.branch_id = branch_id;
    if (semester_id) filter.semester_id = semester_id;
    if (section_id) filter.section_id = section_id;
    
    const users = await User.find(filter, '-password')
      .populate('branch_id', 'name code')
      .populate('semester_id', 'number')
      .populate('section_id', 'name')
      .sort({ created_at: -1 })
      .limit(500);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, branch_id, semester_id, section_id } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (branch_id !== undefined) update.branch_id = branch_id || null;
    if (semester_id !== undefined) update.semester_id = semester_id || null;
    if (section_id !== undefined) update.section_id = section_id || null;
    
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('-password')
      .populate('branch_id', 'name code')
      .populate('semester_id', 'number')
      .populate('section_id', 'name');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { email, password, role, name, branch_id, semester_id, section_id } = req.body;
    if (!email || !password || !role || !name) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already used' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hash,
      role,
      name,
      branch_id: branch_id || null,
      semester_id: semester_id || null,
      section_id: section_id || null,
    });

    const created = await User.findById(user._id)
      .select('-password')
      .populate('branch_id', 'name code')
      .populate('semester_id', 'number')
      .populate('section_id', 'name');
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  await Assignment.deleteMany({ $or: [{ student_id: id }, { teacher_id: id }] });
  await User.deleteOne({ _id: id });
  res.json({ ok: true });
});

// Assignments
router.post('/assign', async (req, res) => {
  const { studentId, teacherId } = req.body;
  if (!studentId || !teacherId) return res.status(400).json({ error: 'Missing fields' });
  const student = await User.findOne({ _id: studentId, role: 'student' });
  const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
  if (!student || !teacher) return res.status(404).json({ error: 'Not found' });
  await Assignment.updateOne({ student_id: studentId, teacher_id: teacherId }, { $setOnInsert: { student_id: studentId, teacher_id: teacherId } }, { upsert: true });
  res.json({ ok: true });
});

router.post('/assign/batch', async (req, res) => {
  const { studentIds, teacherId } = req.body;
  if (!Array.isArray(studentIds) || !teacherId) return res.status(400).json({ error: 'Invalid payload' });
  const ops = studentIds.map((sid) => ({ updateOne: { filter: { student_id: sid, teacher_id: teacherId }, update: { $setOnInsert: { student_id: sid, teacher_id: teacherId } }, upsert: true } }));
  if (ops.length) await Assignment.bulkWrite(ops);
  res.json({ ok: true, count: ops.length });
});

// Subject Assignment to Teachers
router.post('/assign-subject', async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.body;
    if (!teacher_id || !subject_id) return res.status(400).json({ error: 'teacher_id and subject_id required' });
    const assignment = await SubjectAssignment.findOneAndUpdate(
      { teacher_id, subject_id },
      { teacher_id, subject_id },
      { upsert: true, new: true }
    ).populate('teacher_id', 'name email').populate('subject_id', 'name code');
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/assign-subject', async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.query;
    const filter = {};
    if (teacher_id) filter.teacher_id = teacher_id;
    if (subject_id) filter.subject_id = subject_id;
    const assignments = await SubjectAssignment.find(filter)
      .populate('teacher_id', 'name email')
      .populate('subject_id', 'name code');
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/assign-subject/:id', async (req, res) => {
  try {
    await SubjectAssignment.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;



