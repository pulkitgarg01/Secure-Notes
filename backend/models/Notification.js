import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['message', 'announcement', 'resource', 'assignment'], required: true },
  source_reference: { type: mongoose.Schema.Types.ObjectId },
  reference_key: { type: String, index: true }, // For duplicate protection (e.g., assignmentId_7days)
  is_read: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Notification', NotificationSchema);
