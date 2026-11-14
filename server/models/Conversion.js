import mongoose from 'mongoose';

const conversionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toolName: { type: String, required: true },
  fileName: String,
  fileSize: Number,
  status: { type: String, default: 'success' },
  createdAt: { type: Date, default: Date.now },
});

// Legacy per-conversion rows contain filenames; expire them after 90 days.
conversionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('Conversion', conversionSchema);
