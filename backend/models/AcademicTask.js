import mongoose from 'mongoose';

const AcademicTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  due_date: { type: Date, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Active', 'Archived'], default: 'Active' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Indexes for faster dashboard filtering
AcademicTaskSchema.index({ subject_id: 1, due_date: 1 });
AcademicTaskSchema.index({ created_by: 1 });

export default mongoose.model('AcademicTask', AcademicTaskSchema);
