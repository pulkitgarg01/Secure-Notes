import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

AnnouncementSchema.index({ subject_id: 1, created_at: -1 });

export default mongoose.model('Announcement', AnnouncementSchema);
