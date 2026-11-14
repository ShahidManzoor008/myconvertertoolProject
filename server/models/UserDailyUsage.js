import mongoose from 'mongoose';

const userDailyUsageSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  toolName: { type: String, required: true },
  action: { type: String, enum: ['page-view', 'conversion'], required: true },
  outcome: { type: String, enum: ['success', 'failure'], required: true },
  reason: { type: String, default: 'none' },
  count: { type: Number, default: 0 },
}, { timestamps: true });

userDailyUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
userDailyUsageSchema.index({ userId: 1, day: -1 });

export default mongoose.model('UserDailyUsage', userDailyUsageSchema);
