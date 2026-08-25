import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import SubjectAssignment from '../models/SubjectAssignment.js';

const router = express.Router();
router.use(requireAuth);

// Helpers
const isTeacherAssignedToStudent = async (teacherId, studentId) => {
  const student = await User.findById(studentId);
  if (!student) return false;
  
  const assignments = await SubjectAssignment.find({ teacher_id: teacherId });
  const subjectIds = assignments.map(a => a.subject_id);
  
  const assignedSubjects = await Subject.find({
    _id: { $in: subjectIds },
    branch_id: student.branch_id,
    semester_id: student.semester_id
  });
  
  return assignedSubjects.length > 0;
};

// ----------------------------------------------------
// Conversations
// ----------------------------------------------------

// Get all conversations for current user
router.get('/conversations', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { participants: req.user.id };
    const conversations = await Conversation.find(query)
      .populate('participants', 'name email role')
      .populate('started_by', 'name role')
      .sort({ last_message_at: -1 });
    
    // Also fetch unread count for each conversation
    const result = await Promise.all(conversations.map(async conv => {
      const unreadCount = await Message.countDocuments({
        conversation_id: conv._id,
        read_by: { $ne: req.user.id }
      });
      return { ...conv.toObject(), unreadCount };
    }));
      
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search users for messaging (enforces roles)
router.get('/search-users', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    
    const regex = new RegExp(q, 'i');
    const matchQuery = { 
      $or: [{ name: regex }, { email: regex }],
      status: 'active',
      _id: { $ne: req.user.id }
    };

    let users = [];

    if (req.user.role === 'admin') {
      users = await User.find(matchQuery, 'name email role').limit(20);
    } 
    else if (req.user.role === 'teacher') {
      const assignments = await SubjectAssignment.find({ teacher_id: req.user.id });
      const subjectIds = assignments.map(a => a.subject_id);
      const subjects = await Subject.find({ _id: { $in: subjectIds } });
      
      const eligibleStudentQuery = {
        role: 'student',
        $or: subjects.length > 0 ? subjects.map(s => ({ branch_id: s.branch_id, semester_id: s.semester_id })) : [{ _id: null }]
      };
      
      const admins = await User.find({ ...matchQuery, role: 'admin' }, 'name email role');
      const students = subjects.length > 0 
        ? await User.find({ ...matchQuery, ...eligibleStudentQuery }, 'name email role').limit(20) 
        : [];
      users = [...admins, ...students].slice(0, 20);
    }
    else if (req.user.role === 'student') {
      const student = await User.findById(req.user.id);
      const subjects = await Subject.find({ branch_id: student.branch_id, semester_id: student.semester_id });
      const assignments = await SubjectAssignment.find({ subject_id: { $in: subjects.map(s => s._id) } });
      const teacherIds = assignments.map(a => a.teacher_id);
      
      users = await User.find({ ...matchQuery, _id: { $in: teacherIds } }, 'name email role').limit(20);
    }
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start new conversation
router.post('/conversations', async (req, res) => {
  try {
    const { recipient_id, subject, body } = req.body;
    if (!recipient_id) return res.status(400).json({ error: 'Recipient is required' });
    
    const recipient = await User.findById(recipient_id);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
    
    if (req.user.role === 'admin') {
      // allowed
    } 
    else if (req.user.role === 'teacher') {
      if (recipient.role === 'admin') {
        // allowed
      } else if (recipient.role === 'student') {
        const allowed = await isTeacherAssignedToStudent(req.user.id, recipient_id);
        if (!allowed) return res.status(403).json({ error: 'Student not assigned to your subjects' });
      } else {
        return res.status(403).json({ error: 'Teachers can only message assigned students or admins' });
      }
    }
    else if (req.user.role === 'student') {
      if (recipient.role === 'teacher') {
        const allowed = await isTeacherAssignedToStudent(recipient_id, req.user.id);
        if (!allowed) return res.status(403).json({ error: 'Teacher not assigned to your subjects' });
      } else {
        return res.status(403).json({ error: 'Students can only message assigned teachers' });
      }
    }
    
    const conversation = new Conversation({
      participants: [req.user.id, recipient_id],
      subject,
      started_by: req.user.id,
      last_message_at: new Date()
    });
    await conversation.save();
    
    const message = new Message({
      conversation_id: conversation._id,
      sender_id: req.user.id,
      body,
      read_by: [req.user.id]
    });
    await message.save();
    
    // Notify recipient
    await Notification.create({
      user_id: recipient_id,
      title: 'New Message',
      description: `You received a new message regarding: ${subject}`,
      type: 'message',
      source_reference: conversation._id
    });
    
    res.status(201).json({ conversation, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages for conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    
    if (!conversation.participants.includes(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const messages = await Message.find({ conversation_id: conversation._id })
      .populate('sender_id', 'name role')
      .sort({ created_at: 1 });
      
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reply to conversation
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { body } = req.body;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    
    if (!conversation.participants.includes(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const message = new Message({
      conversation_id: conversation._id,
      sender_id: req.user.id,
      body,
      read_by: [req.user.id]
    });
    await message.save();
    
    conversation.last_message_at = new Date();
    await conversation.save();
    
    // Notify other participants
    const otherParticipants = conversation.participants.filter(p => p.toString() !== req.user.id);
    for (const p of otherParticipants) {
      await Notification.create({
        user_id: p,
        title: 'New Reply',
        description: `You have a new reply in: ${conversation.subject}`,
        type: 'message',
        source_reference: conversation._id
      });
    }
    
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark conversation read
router.post('/conversations/:id/read', async (req, res) => {
  try {
    await Message.updateMany(
      { conversation_id: req.params.id, read_by: { $ne: req.user.id } },
      { $push: { read_by: req.user.id } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Announcements
// ----------------------------------------------------

router.post('/announcements', async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { subject_id, title, body } = req.body;
    
    const announcement = new Announcement({
      sender_id: req.user.id,
      subject_id,
      title,
      body
    });
    await announcement.save();
    
    // Notify all students in that subject (branch + semester)
    const subject = await Subject.findById(subject_id);
    const students = await User.find({
      role: 'student',
      branch_id: subject.branch_id,
      semester_id: subject.semester_id,
      status: 'active'
    });
    
    const notifications = students.map(s => ({
      user_id: s._id,
      title: 'New Announcement',
      description: title,
      type: 'announcement',
      source_reference: announcement._id
    }));
    await Notification.insertMany(notifications);
    
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/announcements', async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = await User.findById(req.user.id);
      const subjects = await Subject.find({ branch_id: student.branch_id, semester_id: student.semester_id });
      const subjectIds = subjects.map(s => s._id);
      
      const announcements = await Announcement.find({ subject_id: { $in: subjectIds } })
        .populate('sender_id', 'name')
        .populate('subject_id', 'name code')
        .sort({ created_at: -1 });
      return res.json(announcements);
    } else {
      // Teacher or admin (get announcements they sent)
      const announcements = await Announcement.find({ sender_id: req.user.id })
        .populate('subject_id', 'name code')
        .sort({ created_at: -1 });
      return res.json(announcements);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Notifications
// ----------------------------------------------------

router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { is_read: true },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { user_id: req.user.id, is_read: false },
      { is_read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
