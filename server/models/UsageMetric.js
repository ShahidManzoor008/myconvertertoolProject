import mongoose from 'mongoose';

const usageMetricSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  day: { type: Date, required: true },
  toolName: { type: String, required: true },
  action: { type: String, enum: ['page-view', 'conversion'], required: true },
  outcome: { type: String, enum: ['success', 'failure', 'unique'], required: true },
  reason: { type: String, default: 'none' },
  audience: { type: String, enum: ['anonymous', 'registered'], required: true },
  count: { type: Number, default: 0 },
}, { timestamps: true });

usageMetricSchema.index({ day: 1, toolName: 1, action: 1 });

export default mongoose.model('UsageMetric', usageMetricSchema);
