import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'writer' },
  enabled: { type: Boolean, default: false },
  paused: { type: Boolean, default: false },
  mode: { type: String, enum: ['draft', 'auto'], default: 'draft' },
  articlesPerDay: { type: Number, default: 1 },
  timezone: { type: String, default: 'UTC' },
  hour: { type: Number, default: 9 },
  topics: { type: String, default: 'AI, technology, document workflows, developer tools' },
  instructions: { type: String, default: 'Write clear, useful English articles for everyday users. Explain what changed, why it matters, and practical limitations. Prefer official sources.' },
  excludedTopics: { type: String, default: '' },
  primaryDomains: { type: [String], default: ['blog.google', 'ai.google.dev', 'openai.com', 'anthropic.com', 'microsoft.com', 'github.blog', 'github.com', 'research.google'] },
  monthlyRequestLimit: { type: Number, default: 90 },
  revision: { type: Number, default: 0 },
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  day: String,
  slot: Number,
  trigger: { type: String, enum: ['manual', 'schedule', 'test'] },
  forceDraft: { type: Boolean, default: false },
  providerVersion: String,
  brief: { type: String, default: '' },
  settings: { type: mongoose.Schema.Types.Mixed, required: true },
  state: { type: String, enum: ['queued', 'running', 'draft', 'published', 'failed', 'cancelled'], default: 'queued' },
  owner: String,
  leaseUntil: Date,
  attempts: { type: Number, default: 0 },
  topicKey: String,
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
  reasons: [String],
  usage: {
    requests: { type: Number, default: 0 }, tokens: { type: Number, default: 0 },
    promptTokens: { type: Number, default: 0 }, outputTokens: { type: Number, default: 0 },
    thinkingTokens: { type: Number, default: 0 }, cachedTokens: { type: Number, default: 0 }, detailedRequests: { type: Number, default: 0 },
  },
  model: String,
  completedAt: Date,
  expiresAt: Date,
}, { timestamps: true });
jobSchema.index({ state: 1, createdAt: 1 });
jobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const meterSchema = new mongoose.Schema({
  _id: String,
  requests: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  metadataRequests: { type: Number, default: 0 },
  promptTokens: { type: Number, default: 0 }, outputTokens: { type: Number, default: 0 },
  thinkingTokens: { type: Number, default: 0 }, cachedTokens: { type: Number, default: 0 }, detailedRequests: { type: Number, default: 0 },
  kind: String, model: String, period: String, keyFingerprint: String,
  failures: { type: Number, default: 0 }, rateLimited: { type: Number, default: 0 }, lastHttpStatus: Number, lastRequestAt: Date,
  expiresAt: Date,
});
meterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
meterSchema.index({ kind: 1, period: 1, keyFingerprint: 1 });

// One database-backed lock fences publications and prevents overlapping workers.
const lockSchema = new mongoose.Schema({ _id: String, owner: String, until: Date });
export const AIWriterSettings = mongoose.model('AIWriterSettings', settingsSchema);
export const AIWriterJob = mongoose.model('AIWriterJob', jobSchema);
export const AIWriterMeter = mongoose.model('AIWriterMeter', meterSchema);
export const AIWriterLock = mongoose.model('AIWriterLock', lockSchema);

const providerSchema = new mongoose.Schema({
  _id: { type: String, default: 'gemini' },
  encryptedKey: { type: String, select: false, default: '' },
  keyFingerprint: { type: String, default: '' },
  model: { type: String, default: '' },
  billingMode: { type: String, enum: ['free', 'paid'], default: 'free' },
  requestsEnabled: { type: Boolean, default: false },
  revision: { type: Number, default: 0 },
  lastTest: {
    ok: Boolean, message: String, checkedAt: Date, latencyMs: Number,
  },
}, { timestamps: true });
export const AIWriterProvider = mongoose.model('AIWriterProvider', providerSchema);
