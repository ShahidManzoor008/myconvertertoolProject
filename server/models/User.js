import mongoose from 'mongoose';
import argon2 from 'argon2';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  avatar: {
    type: String,
    default: null
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await argon2.hash(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch (err) {
    return false;
  }
};

// Add indexes
// Note: `email` already declares `unique: true` in the field definition above.
// Creating the same index via `schema.index()` results in duplicate-index warnings
// from Mongoose. Rely on the field-level unique constraint and remove the extra index.
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ resetToken: 1 }, { sparse: true });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });

// Add a method to generate password reset token
userSchema.methods.createPasswordResetToken = async function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetToken = resetToken;
  this.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await this.save();
  return resetToken;
};

// Add instance method to check if reset token is valid
userSchema.methods.isResetTokenValid = function() {
  return this.resetToken && this.resetTokenExpiry && this.resetTokenExpiry > Date.now();
};

const User = mongoose.model('User', userSchema);

export default User;