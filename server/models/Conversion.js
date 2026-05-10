import mongoose from 'mongoose';

const conversionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toolName: { type: String, required: true },
  fileName: String,
  fileSize: Number,
  status: { type: String, default: 'success' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Conversion', conversionSchema);