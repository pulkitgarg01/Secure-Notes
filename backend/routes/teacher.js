import express from 'express';
import StorageService from '../services/StorageService.js';
import Note from '../models/Note.js';
import Module from '../models/Module.js';
import SubjectAssignment from '../models/SubjectAssignment.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Activity from '../models/Activity.js';
import AcademicTask from '../models/AcademicTask.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import WatermarkService from '../services/WatermarkService.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import rateLimit from 'express-rate-limit';
import mime from 'mime-types';

const router = express.Router();



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

function pdfFileFilter(_req, file, cb) {
  if (file.mimetype !== 'application/pdf') return cb(new Error('PDF only'));
  cb(null, true);
}

const upload = StorageService.getUploader({ maxMb: 10, fileFilter: pdfFileFilter });
const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 }); // 10 uploads per minute

router.use(requireAuth, requireRole('teacher'));

// Teacher Stats
router.get('/stats', async (req, res) => {
  try {
    const [assignments, notes, activeTasks, dueThisWeekTasks] = await Promise.all([
      SubjectAssignment.countDocuments({ teacher_id: req.user.id }),
      Note.countDocuments({ teacher_id: req.user.id }),
      AcademicTask.countDocuments({ created_by: req.user.id, status: 'Active' }),
      AcademicTask.countDocuments({ 
        created_by: req.user.id, 
        status: 'Active',
        due_date: { 
          $gte: new Date(), 
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        } 
      })
    ]);
    res.json({ subjects: assignments, notes, activeTasks, dueThisWeekTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ACADEMIC TASKS
// ==========================================

router.get('/tasks', async (req, res) => {
  try {
    const query = { created_by: req.user.id };
    if (req.query.subject_id) query.subject_id = req.query.subject_id;
    if (req.query.status) query.status = req.query.status;
    
    const tasks = await AcademicTask.find(query)
      .populate('subject_id', 'name code branch_id semester_id')
      .sort({ due_date: 1 });
      
    // Fetch submission counts
    const taskIds = tasks.map(t => t._id);
    const submissions = await AssignmentSubmission.find({ assignment_id: { $in: taskIds } });
    
    // Calculate unique students who submitted per task
    const counts = {};
    for (let sub of submissions) {
      if (!counts[sub.assignment_id]) counts[sub.assignment_id] = new Set();
      counts[sub.assignment_id].add(sub.student_id.toString());
    }
    
    const enrichedTasks = await Promise.all(tasks.map(async t => {
      const tObj = t.toObject();
      tObj.submissionCount = counts[t._id] ? counts[t._id].size : 0;
      
      // Calculate enrolled count
      if (t.subject_id) {
        tObj.enrolledCount = await User.countDocuments({
          role: 'student',
          branch_id: t.subject_id.branch_id,
          semester_id: t.subject_id.semester_id,
          status: 'active'
        });
      } else {
        tObj.enrolledCount = 0;
      }
      
      return tObj;
    }));

    res.json(enrichedTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const task = new AcademicTask({
      ...req.body,
      created_by: req.user.id
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const task = await AcademicTask.findOneAndUpdate(
      { _id: req.params.id, created_by: req.user.id },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tasks/:id/submissions', async (req, res) => {
  try {
    const task = await AcademicTask.findOne({ _id: req.params.id, created_by: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const submissions = await AssignmentSubmission.find({ assignment_id: task._id })
      .populate('student_id', 'name email usn')
      .sort({ submitted_at: -1 });

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tasks/submissions/:id/download', async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findById(req.params.id).populate('assignment_id');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    
    // Authorization check
    if (submission.assignment_id.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const exists = await StorageService.fileExists(submission.file_path);
    if (!exists) return res.status(404).json({ error: 'File not found on disk' });

    const buffer = await StorageService.getFileBuffer(submission.file_path);
    const contentType = mime.lookup(submission.file_name) || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${submission.file_name}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tasks/submissions/:id/view', async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findById(req.params.id).populate('assignment_id');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    
    if (submission.assignment_id.created_by.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const exists = await StorageService.fileExists(submission.file_path);
    if (!exists) return res.status(404).json({ error: 'File not found on disk' });

    const buffer = await StorageService.getFileBuffer(submission.file_path);
    const contentType = mime.lookup(submission.file_name) || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${submission.file_name}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await AcademicTask.findOneAndDelete({ _id: req.params.id, created_by: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get assigned subjects — enriched with student count and resource count
router.get('/subjects', async (req, res) => {
  try {
    const assignments = await SubjectAssignment.find({ teacher_id: req.user.id })
      .populate({
        path: 'subject_id',
        populate: [
          { path: 'branch_id', select: 'name code' },
          { path: 'semester_id', select: 'number name' }
        ]
      });
    const subjects = assignments.map(a => a.subject_id).filter(Boolean);

    // Enrich each subject
    const enriched = await Promise.all(subjects.map(async (sub) => {
      const subObj = sub.toObject ? sub.toObject() : sub;
      const modules = await Module.find({ subject_id: sub._id });
      const moduleIds = modules.map(m => m._id);
      subObj.resource_count = await Note.countDocuments({ module_id: { $in: moduleIds } });

      // Student count in same branch-semester
      subObj.student_count = await User.countDocuments({
        role: 'student',
        branch_id: sub.branch_id?._id || sub.branch_id,
        semester_id: sub.semester_id?._id || sub.semester_id
      });
      return subObj;
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get students under teacher's assigned subjects — enriched with progress data
router.get('/students', async (req, res) => {
  try {
    // Gather all subjects assigned to this teacher
    const assignments = await SubjectAssignment.find({ teacher_id: req.user.id });
    const subjectIds = assignments.map(a => a.subject_id).filter(Boolean);

    // Find all modules/notes for teacher's subjects
    const modules = await Module.find({ subject_id: { $in: subjectIds } });
    const moduleIds = modules.map(m => m._id);
    const teacherNotes = await Note.find({ module_id: { $in: moduleIds } }).select('_id');
    const teacherNoteIds = teacherNotes.map(n => n._id);

    // Find all students in same branch-semester as teacher
    const teacher = await User.findById(req.user.id).populate('branch_id semester_id section_id');
    let studentFilter = { role: 'student' };
    if (teacher.branch_id && teacher.semester_id) {
      studentFilter.branch_id = teacher.branch_id._id;
      studentFilter.semester_id = teacher.semester_id._id;
    }
    const students = await User.find(studentFilter, '-password')
      .populate('branch_id', 'name code')
      .populate('semester_id', 'number')
      .populate('section_id', 'name')
      .sort({ name: 1 });

    // Enrich each student with their progress on teacher's resources
    const enriched = await Promise.all(students.map(async (stu) => {
      const stuObj = stu.toObject();
      const progresses = await Progress.find({
        student_id: stu._id,
        note_id: { $in: teacherNoteIds }
      });
      stuObj.resources_viewed = progresses.length;
      stuObj.resources_completed = progresses.filter(p => p.completed).length;
      stuObj.completion_pct = teacherNoteIds.length > 0
        ? Math.round((stuObj.resources_completed / teacherNoteIds.length) * 100)
        : 0;
      stuObj.last_activity = progresses.sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at))[0]?.viewed_at || null;
      return stuObj;
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher Analytics
router.get('/analytics', async (req, res) => {
  try {
    const assignments = await SubjectAssignment.find({ teacher_id: req.user.id });
    const subjectIds = assignments.map(a => a.subject_id).filter(Boolean);
    const modules = await Module.find({ subject_id: { $in: subjectIds } });
    const moduleIds = modules.map(m => m._id);

    const notes = await Note.find({ teacher_id: req.user.id }).sort({ views: -1 });

    // Most and least viewed
    const published = notes.filter(n => n.status === 'published');
    const mostViewed = published[0] || null;
    const leastViewed = published.length > 1 ? published[published.length - 1] : null;

    // Recent student activity (last 10 progress entries on teacher's notes)
    const recentProgress = await Progress.find({ note_id: { $in: notes.map(n => n._id) } })
      .sort({ viewed_at: -1 })
      .limit(10)
      .populate('student_id', 'name email')
      .populate('note_id', 'title');

    res.json({
      mostViewed: mostViewed ? { title: mostViewed.title, views: mostViewed.views, id: mostViewed._id } : null,
      leastViewed: leastViewed ? { title: leastViewed.title, views: leastViewed.views, id: leastViewed._id } : null,
      totalViews: notes.reduce((acc, n) => acc + (n.views || 0), 0),
      recentActivity: recentProgress.map(p => ({
        student: p.student_id?.name || 'Unknown',
        resource: p.note_id?.title || 'Unknown',
        viewed_at: p.viewed_at,
        completed: p.completed
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Module/Folder CRUD
router.get('/modules', async (req, res) => {
  try {
    const { subject_id, parent_id } = req.query;
    const filter = {};
    
    // Only show modules created by this teacher or in their assigned subjects
    const assignments = await SubjectAssignment.find({ teacher_id: req.user.id });
    const subjectIds = assignments.map(a => a.subject_id ? a.subject_id.toString() : null).filter(Boolean);
    
    if (subject_id) {
      if (!subjectIds.includes(subject_id)) {
        return res.status(403).json({ error: 'Not assigned to this subject' });
      }
      filter.subject_id = subject_id;
    } else {
      filter.subject_id = { $in: subjectIds };
    }

    if (parent_id !== undefined) {
      filter.parent_id = parent_id || null;
    }

    const modules = await Module.find(filter)
      .populate('subject_id', 'name code')
      .populate('created_by', 'name email')
      .sort({ order: 1, createdAt: 1 });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/modules', async (req, res) => {
  try {
    const { subject_id, title, description, parent_id, order } = req.body;
    if (!subject_id || !title) return res.status(400).json({ error: 'subject_id and title required' });
    
    // Verify teacher is assigned to this subject
    const assignment = await SubjectAssignment.findOne({ teacher_id: req.user.id, subject_id });
    if (!assignment) return res.status(403).json({ error: 'Not assigned to this subject' });
    
    const module = await Module.create({
      subject_id,
      title,
      description: description || '',
      parent_id: parent_id || null,
      order: order || 0,
      created_by: req.user.id
    });
    await module.populate('subject_id', 'name code');
    res.json(module);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/modules/:id', async (req, res) => {
  try {
    const { title, description, order } = req.body;
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    if (module.created_by.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (title) module.title = title;
    if (description !== undefined) module.description = description;
    if (order !== undefined) module.order = order;
    await module.save();
    await module.populate('subject_id', 'name code');
    res.json(module);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/modules/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    if (module.created_by.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    // Check for child modules
    const children = await Module.countDocuments({ parent_id: module._id });
    if (children > 0) return res.status(400).json({ error: 'Cannot delete module with sub-modules' });
    // Check for notes
    const notes = await Note.countDocuments({ module_id: module._id });
    if (notes > 0) return res.status(400).json({ error: 'Cannot delete module with notes' });
    await Module.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notes CRUD
router.get('/notes/:id/view', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, teacher_id: req.user.id });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    
    const exists = await StorageService.fileExists(note.file_path);
    if (!note.file_path || !exists) return res.status(404).json({ error: 'File not found' });
    
    const teacher = await User.findById(req.user.id);
    const pdfBuffer = await StorageService.getFileBuffer(note.file_path);
    const watermarkedBuffer = await WatermarkService.applyWatermark(pdfBuffer, teacher, { name: note.title });

    await Activity.create({
      actor_id: teacher._id,
      actor_name: teacher.name,
      action: 'watermark_generated',
      target_name: note.title,
      target_type: 'Note',
      metadata: {
        userId: teacher._id,
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

router.post('/notes', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    const { title, module_id, description, order, status } = req.body;
    if (!req.file) return res.status(400).json({ error: 'File required (PDF)' });
    if (!title || !module_id) return res.status(400).json({ error: 'title and module_id required' });
    
    // Verify module belongs to teacher's assigned subject
    const module = await Module.findById(module_id).populate('subject_id');
    if (!module) return res.status(404).json({ error: 'Module not found' });
    const assignment = await SubjectAssignment.findOne({ 
      teacher_id: req.user.id, 
      subject_id: module.subject_id._id 
    });
    if (!assignment) return res.status(403).json({ error: 'Not assigned to this subject' });
    
    const note = await Note.create({
      teacher_id: req.user.id,
      module_id,
      title,
      description: description || '',
      file_path: req.file.path,
      file_size: req.file.size,
      order: order || 0,
      status: status || 'draft',
    });
    await note.populate('module_id', 'title');
    res.json(note);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
});

router.get('/notes', async (req, res) => {
  try {
    const { module_id, subject_id, q } = req.query;
    const safeQ = sanitizeSearchQuery(q);
    const filter = { teacher_id: req.user.id };
    if (module_id) filter.module_id = module_id;
    if (safeQ) {
      filter.$or = [
        { title: { $regex: safeQ, $options: 'i' } },
        { description: { $regex: safeQ, $options: 'i' } }
      ];
    }
    
    let notes = await Note.find(filter)
      .populate({
        path: 'module_id',
        select: 'title subject_id',
        populate: {
          path: 'subject_id',
          select: 'name code branch_id semester_id',
          populate: [
            { path: 'branch_id', select: 'name code' },
            { path: 'semester_id', select: 'number' }
          ]
        }
      })
      .sort({ order: 1, uploaded_at: -1 });
    
    // Filter by subject if specified
    if (subject_id) {
      notes = notes.filter(n => n.module_id?.subject_id?._id?.toString() === subject_id || n.module_id?.subject_id?.toString() === subject_id);
    }
    
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notes/:id', async (req, res) => {
  try {
    const { title, description, order, status } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.teacher_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (title) note.title = title;
    if (description !== undefined) note.description = description;
    if (order !== undefined) note.order = order;
    if (status !== undefined) note.status = status;
    await note.save();
    await note.populate('module_id', 'title');
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, teacher_id: req.user.id });
    if (!note) return res.status(404).json({ error: 'Not found' });
      if (note.file_path) await StorageService.deleteFile(note.file_path);
    await Note.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
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
    
    const assignments = await SubjectAssignment.find({ teacher_id: req.user.id });
    const subjectIds = assignments.map(a => a.subject_id ? a.subject_id.toString() : null).filter(Boolean);
    
    const [subjects, modules, notes] = await Promise.all([
      Subject.find({ _id: { $in: subjectIds }, $or: [
        { name: { $regex: safeQ, $options: 'i' } },
        { code: { $regex: safeQ, $options: 'i' } }
      ]}),
      Module.find({ subject_id: { $in: subjectIds }, $or: [
        { title: { $regex: safeQ, $options: 'i' } },
        { description: { $regex: safeQ, $options: 'i' } }
      ]}).populate('subject_id', 'name code'),
      Note.find({ teacher_id: req.user.id, $or: [
        { title: { $regex: safeQ, $options: 'i' } },
        { description: { $regex: safeQ, $options: 'i' } }
      ]}).populate('module_id', 'title')
    ]);
    
    res.json({ subjects, modules, notes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
