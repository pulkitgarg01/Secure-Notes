import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  subject: { type: String, required: true },
  started_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  last_message_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

ConversationSchema.index({ participants: 1, last_message_at: -1 });

export default mongoose.model('Conversation', ConversationSchema);
