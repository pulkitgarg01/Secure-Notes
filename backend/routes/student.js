import express from 'express';
import StorageService from '../services/StorageService.js';
import WatermarkService from '../services/WatermarkService.js';
import mime from 'mime-types';
import Note from '../models/Note.js';
import Module from '../models/Module.js';
import Subject from '../models/Subject.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import AcademicTask from '../models/AcademicTask.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

function assignmentFileFilter(_req, file, cb) {
  const allowed = [
    'application/pdf', 
    'application/zip', 
    'application/x-zip-compressed',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only PDF, ZIP, and DOCX are allowed'));
  }
  cb(null, true);
}

const submissionUpload = StorageService.getUploader({ maxMb: 10, fileFilter: assignmentFileFilter });
const submitLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

/**
 * Escapes all regex metacharacters in a user-supplied string.
 * Prevents ReDoS via crafted $regex queries (SEC-08).
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes a search query parameter: clamps to 100 chars and escapes regex
 * metacharacters. Returns null if the input is absent or not a string.
 */
function sanitizeSearchQuery(q) {
  if (!q || typeof q !== 'string') return null;
  return escapeRegex(q.slice(0, 100));
}

router.use(requireAuth, requireRole('student'));

// Get student's subjects (based on B-S-S) — enriched with faculty and resource count
router.get('/subjects', async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate('branch_id semester_id section_id');
    if (!student.branch_id || !student.semester_id) {
      return res.json([]);
    }
    const subjects = await Subject.find({
      branch_id: student.branch_id._id,
      semester_id: student.semester_id._id
    }).populate('branch_id', 'name code').populate('semester_id', 'number').sort({ code: 1 });

    // Enrich each subject with faculty name and resource count
    const enriched = await Promise.all(subjects.map(async (sub) => {
      const subObj = sub.toObject();

      // Faculty assigned to this subject
      const SubjectAssignment = (await import('../models/SubjectAssignment.js')).default;
      const assignment = await SubjectAssignment.findOne({ subject_id: sub._id }).populate('teacher_id', 'name email');
      subObj.faculty = assignment?.teacher_id || null;

      // Count published notes for this subject
      const modules = await Module.find({ subject_id: sub._id });
      const moduleIds = modules.map(m => m._id);
      subObj.resource_count = await Note.countDocuments({ module_id: { $in: moduleIds }, status: 'published' });

      // Last updated note date
      const latestNote = await Note.findOne({ module_id: { $in: moduleIds } }).sort({ updated_at: -1 }).select('updated_at');
      subObj.last_updated = latestNote?.updated_at || null;

      return subObj;
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student Stats
router.get('/stats', async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student.branch_id || !student.semester_id) {
      return res.json({ subjects: 0, completed: 0, total: 0 });
    }
    const subjects = await Subject.find({
      branch_id: student.branch_id,
      semester_id: student.semester_id
    });
    const subjectIds = subjects.map(s => s._id);
    const modules = await Module.find({ subject_id: { $in: subjectIds } });
    const moduleIds = modules.map(m => m._id);
    const notes = await Note.find({ module_id: { $in: moduleIds }, status: 'published' });
    const noteIds = notes.map(n => n._id);
    
    const progresses = await Progress.find({ student_id: req.user.id, note_id: { $in: noteIds } });
    const completed = progresses.filter(p => p.completed).length;
    
    // Add task metrics
    const now = new Date();
    const upcomingTasks = await AcademicTask.countDocuments({
      subject_id: { $in: subjectIds },
      status: 'Active',
      due_date: { $gte: now }
    });
    
    res.json({ subjects: subjects.length, completed, total: noteIds.length, upcomingTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ACADEMIC TASKS
// ==========================================

router.get('/tasks', async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student.branch_id || !student.semester_id) {
      return res.json([]);
    }
    const subjects = await Subject.find({
      branch_id: student.branch_id,
      semester_id: student.semester_id
    });
    const subjectIds = subjects.map(s => s._id);
    
    const tasks = await AcademicTask.find({
      subject_id: { $in: subjectIds },
      status: 'Active'
    })
      .populate('subject_id', 'name code')
      .populate('created_by', 'name')
      .sort({ due_date: 1 });
      
    const taskIds = tasks.map(t => t._id);
    const submissions = await AssignmentSubmission.find({
      assignment_id: { $in: taskIds },
      student_id: req.user.id
    });
    const subMap = {};
    for (let sub of submissions) {
      if (!subMap[sub.assignment_id] || sub.version > subMap[sub.assignment_id].version) {
        subMap[sub.assignment_id] = sub;
      }
    }
    
    const enrichedTasks = tasks.map(t => {
      const tObj = t.toObject();
      tObj.submission = subMap[t._id] || null;
      return tObj;
    });

    res.json(enrichedTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks/:id/submit', submitLimiter, submissionUpload.single('file'), async (req, res) => {
  try {
    const task = await AcademicTask.findById(req.params.id);
    if (!task || task.status !== 'Active') {
      return res.status(400).json({ error: 'Task is no longer active or does not exist' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File upload is required' });
    }

    const previousSubmissions = await AssignmentSubmission.countDocuments({
      assignment_id: task._id,
      student_id: req.user.id
    });

    const isLate = Date.now() > new Date(task.due_date).getTime();

    const submission = await AssignmentSubmission.create({
      assignment_id: task._id,
      student_id: req.user.id,
      file_name: req.file.originalname,
      file_path: req.file.filename,
      file_size: req.file.size,
      status: isLate ? 'Late' : 'Submitted',
      version: previousSubmissions + 1
    });

    // Notify the teacher
    const student = await User.findById(req.user.id);
    await Notification.create({
      user_id: task.created_by,
      title: 'New Assignment Submission',
      description: `${student.name} submitted "${req.file.originalname}" for "${task.title}".`,
      type: 'assignment',
      source_reference: task._id,
      // Create a unique key per student per assignment to prevent spamming if they resubmit immediately
      reference_key: `submission_${task._id}_${req.user.id}_v${previousSubmissions + 1}`
    });

    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tasks/:id/submissions', async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({
      assignment_id: req.params.id,
      student_id: req.user.id
    }).sort({ version: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get modules/folders for a subject
router.get('/subjects/:subject_id/modules', async (req, res) => {
  try {
    const { subject_id } = req.params;
    const student = await User.findById(req.user.id);
    
    // Verify student has access to this subject (same B-S)
    const subject = await Subject.findById(subject_id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    if (subject.branch_id.toString() !== student.branch_id?.toString() || 
        subject.semester_id.toString() !== student.semester_id?.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const modules = await Module.find({ subject_id })
      .populate('subject_id', 'name code')
      .populate('created_by', 'name email')
      .sort({ order: 1, createdAt: 1 });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get notes for a module
router.get('/modules/:module_id/notes', async (req, res) => {
  try {
    const { module_id } = req.params;
    const student = await User.findById(req.user.id);
    
    // Verify module belongs to student's subject
    const module = await Module.findById(module_id).populate('subject_id');
    if (!module) return res.status(404).json({ error: 'Module not found' });
    const subject = await Subject.findById(module.subject_id._id);
    if (subject.branch_id.toString() !== student.branch_id?.toString() || 
        subject.semester_id.toString() !== student.semester_id?.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const notes = await Note.find({ module_id, status: 'published' })
      .populate('teacher_id', 'name email')
      .populate('module_id', 'title')
      .sort({ order: 1, uploaded_at: -1 });
    
    // Get progress for each note
    const noteIds = notes.map(n => n._id);
    const progressMap = {};
    const progresses = await Progress.find({ student_id: req.user.id, note_id: { $in: noteIds } });
    progresses.forEach(p => {
      progressMap[p.note_id.toString()] = p;
    });
    
    const notesWithProgress = notes.map(note => ({
      ...note.toObject(),
      progress: progressMap[note._id.toString()] || null
    }));
    
    res.json(notesWithProgress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Secure view endpoint – stream without exposing direct path
router.get('/notes/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findById(req.user.id);
    
    const note = await Note.findById(id).populate('module_id');
    if (!note) return res.status(404).json({ error: 'Not found' });
    if (note.status !== 'published') return res.status(403).json({ error: 'Access denied: Note is not published' });
    
    // Verify access: module's subject matches student's B-S
    const module = await Module.findById(note.module_id._id).populate('subject_id');
    const subject = await Subject.findById(module.subject_id._id);
    if (subject.branch_id.toString() !== student.branch_id?.toString() || 
        subject.semester_id.toString() !== student.semester_id?.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Record view and increment view counter
    await Promise.all([
      Progress.findOneAndUpdate(
        { student_id: req.user.id, note_id: id },
        { student_id: req.user.id, note_id: id, viewed_at: new Date() },
        { upsert: true, new: true }
      ),
      Note.findByIdAndUpdate(id, { $inc: { views: 1 }, last_accessed: new Date() })
    ]);
    
    const exists = await StorageService.fileExists(note.file_path);
    if (!note.file_path || !exists) return res.status(404).json({ error: 'File not found' });
    
    // Read original PDF, generate watermark
    const pdfBuffer = await StorageService.getFileBuffer(note.file_path);
    const watermarkedBuffer = await WatermarkService.applyWatermark(pdfBuffer, student, { name: note.title });

    // Log the watermark generation event
    await Activity.create({
      actor_id: student._id,
      actor_name: student.name,
      action: 'watermark_generated',
      target_name: note.title,
      target_type: 'Note',
      metadata: {
        userId: student._id,
        resourceId: note._id,
        watermarkGeneratedAt: new Date(),
        accessTimestamp: new Date(),
      }
    });
    
    res.setHeader('Content-Type', mime.lookup('pdf') || 'application/pdf');
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

// Mark note as complete
router.post('/notes/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.status !== 'published') return res.status(403).json({ error: 'Access denied: Note is not published' });
    
    // Verify access
    const module = await Module.findById(note.module_id).populate('subject_id');
    const subject = await Subject.findById(module.subject_id._id);
    const student = await User.findById(req.user.id);
    if (subject.branch_id.toString() !== student.branch_id?.toString() || 
        subject.semester_id.toString() !== student.semester_id?.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const progress = await Progress.findOneAndUpdate(
      { student_id: req.user.id, note_id: id },
      { 
        student_id: req.user.id, 
        note_id: id, 
        completed: completed !== false,
        completed_at: completed !== false ? new Date() : null
      },
      { upsert: true, new: true }
    );
    res.json(progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get progress summary — with per-subject breakdown
router.get('/progress', async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    const subjects = await Subject.find({
      branch_id: student.branch_id,
      semester_id: student.semester_id
    }).populate('branch_id', 'name code').populate('semester_id', 'number');

    // Per-subject progress
    const subjectBreakdown = await Promise.all(subjects.map(async (sub) => {
      const mods = await Module.find({ subject_id: sub._id });
      const modIds = mods.map(m => m._id);
      const notes = await Note.find({ module_id: { $in: modIds }, status: 'published' }).select('_id');
      const noteIds = notes.map(n => n._id);
      const progresses = await Progress.find({ student_id: req.user.id, note_id: { $in: noteIds } });
      const completed = progresses.filter(p => p.completed).length;
      const total = noteIds.length;
      return {
        subject: { _id: sub._id, name: sub.name, code: sub.code },
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }));

    const totalCompleted = subjectBreakdown.reduce((acc, s) => acc + s.completed, 0);
    const totalNotes = subjectBreakdown.reduce((acc, s) => acc + s.total, 0);

    res.json({
      completed: totalCompleted,
      total: totalNotes,
      percentage: totalNotes > 0 ? Math.round((totalCompleted / totalNotes) * 100) : 0,
      bySubject: subjectBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recently viewed notes// Recommended Notes
router.get('/notes/recommended', async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student.branch_id || !student.semester_id) {
      return res.json([]);
    }

    const subjects = await Subject.find({
      branch_id: student.branch_id,
      semester_id: student.semester_id
    });
    const subjectIds = subjects.map(s => s._id);

    const modules = await Module.find({ subject_id: { $in: subjectIds } });
    const moduleIds = modules.map(m => m._id);

    const publishedNotes = await Note.find({ 
      module_id: { $in: moduleIds },
      status: 'published'
    })
    .populate('module_id', 'title subject_id')
    .sort({ created_at: -1 });

    const progresses = await Progress.find({ student_id: req.user.id });
    const viewedNoteIds = new Set(progresses.map(p => p.note_id.toString()));

    const unreadNotes = publishedNotes.filter(n => !viewedNoteIds.has(n._id.toString())).slice(0, 3);
    
    const enrichedNotes = unreadNotes.map(n => {
      const obj = n.toObject();
      if (obj.module_id && obj.module_id.subject_id) {
         const subject = subjects.find(s => s._id.toString() === obj.module_id.subject_id.toString());
         obj.subject_name = subject ? subject.name : 'Unknown Subject';
      }
      return obj;
    });

    res.json(enrichedNotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notes/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const progresses = await Progress.find({ student_id: req.user.id })
      .populate({
        path: 'note_id',
        match: { status: 'published' },
        populate: {
          path: 'module_id',
          select: 'title'
        }
      })
      .sort({ viewed_at: -1 })
      .limit(limit * 3);
    
    const notes = progresses
      .map(p => p.note_id)
      .filter(Boolean)
      .slice(0, limit);
    
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const safeQ = sanitizeSearchQuery(q);
    if (!safeQ) return res.json({ subjects: [], modules: [], notes: [] });
    
    const student = await User.findById(req.user.id);
    const subjects = await Subject.find({
      branch_id: student.branch_id,
      semester_id: student.semester_id,
      $or: [
        { name: { $regex: safeQ, $options: 'i' } },
        { code: { $regex: safeQ, $options: 'i' } }
      ]
    });
    const subjectIds = subjects.map(s => s._id);
    
    const modules = await Module.find({
      subject_id: { $in: subjectIds },
      $or: [
        { title: { $regex: safeQ, $options: 'i' } },
        { description: { $regex: safeQ, $options: 'i' } }
      ]
    }).populate('subject_id', 'name code');
    
    const moduleIds = modules.map(m => m._id);
    const notes = await Note.find({
      module_id: { $in: moduleIds },
      $or: [
        { title: { $regex: safeQ, $options: 'i' } },
        { description: { $regex: safeQ, $options: 'i' } }
      ]
    }).populate('module_id', 'title').populate('teacher_id', 'name email');
    
    res.json({ subjects, modules, notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
