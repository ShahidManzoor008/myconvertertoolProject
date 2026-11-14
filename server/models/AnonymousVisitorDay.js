import mongoose from 'mongoose';

const anonymousVisitorDaySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  day: { type: Date, required: true },
  visitorHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

anonymousVisitorDaySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AnonymousVisitorDay', anonymousVisitorDaySchema);
