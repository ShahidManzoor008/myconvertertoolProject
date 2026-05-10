import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

await mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
userSchema.index({ email: 1 }); // Add index

const conversionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileName: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
});

mongoose.model('User', userSchema);
mongoose.model('Conversion', conversionSchema);

console.log('Schemas initialized');
process.exit(0);