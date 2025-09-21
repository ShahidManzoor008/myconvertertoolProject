import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  userAgent: {
    type: String,
    required: true
  },
  isValid: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for token lookups
sessionSchema.index({ token: 1 });

// Index for user session lookups
sessionSchema.index({ user: 1, isValid: 1 });

// Index for token expiry cleanup
sessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days

const Session = mongoose.model('Session', sessionSchema);

export default Session;