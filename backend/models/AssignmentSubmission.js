import mongoose from 'mongoose';

const AssignmentSubmissionSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicTask', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file_name: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number, default: 0 },
  submitted_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['Submitted', 'Late'], required: true },
  version: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
