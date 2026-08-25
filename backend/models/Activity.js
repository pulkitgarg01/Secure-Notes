import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actor_name: { type: String, required: true },
  action: { type: String, required: true }, // e.g., 'uploaded', 'archived', 'created'
  target_name: { type: String, required: true }, // e.g., 'Machine Learning Notes'
  target_type: { type: String, required: true }, // e.g., 'Note', 'Subject', 'User'
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Activity', ActivitySchema);
