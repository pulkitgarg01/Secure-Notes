import cron from 'node-cron';
import AcademicTask from '../models/AcademicTask.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export function startDeadlineCron() {
  // Run daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[DeadlineService] Running daily deadline check...');
      
      const now = new Date();
      // Find active tasks that are due in the future
      const tasks = await AcademicTask.find({ status: 'Active', due_date: { $gt: now } }).populate('subject_id');
      
      for (const task of tasks) {
        if (!task.subject_id) continue;
        
        // Calculate days remaining
        const diffTime = task.due_date.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // We only trigger on exactly 7, 3, or 1 days before
        if (![7, 3, 1].includes(daysRemaining)) continue;
        
        // Unique reference key to prevent duplicate notifications for the same day marker
        const refKey = `${task._id}_reminder_${daysRemaining}d`;
        
        // Check if we already created this exact reminder
        const existing = await Notification.findOne({ reference_key: refKey });
        if (existing) continue;
        
        // Find enrolled students for this subject
        const students = await User.find({
          role: 'student',
          branch_id: task.subject_id.branch_id,
          semester_id: task.subject_id.semester_id,
          status: 'active'
        });
        
        if (students.length === 0) continue;
        
        const dayWord = daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`;
        const title = `Upcoming Deadline: ${task.title}`;
        const description = `${task.subject_id.name} assignment is due ${dayWord}.`;
        
        // Insert notifications for all students
        const notifications = students.map(student => ({
          user_id: student._id,
          title,
          description,
          type: 'assignment',
          source_reference: task._id,
          reference_key: refKey,
          is_read: false
        }));
        
        await Notification.insertMany(notifications);
        console.log(`[DeadlineService] Sent ${daysRemaining}d reminder for task: ${task.title} to ${students.length} students.`);
      }
    } catch (err) {
      console.error('[DeadlineService] Error running cron:', err);
    }
  });
  
  console.log('[DeadlineService] Deadline cron job scheduled (runs at 00:00 daily).');
}
