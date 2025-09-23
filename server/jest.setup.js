import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { stopInMemoryMongo } from './config/db.js';

// Load test environment and ensure MONGODB_URI points to a test DB
dotenv.config({ path: '.env.test' });
process.env.MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/myconvertertool_test';
// Ensure JWT secret and FRONTEND_URL are available during tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

beforeAll(async () => {
  // Connect to the test database (jest.setup runs before test suites)
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
  try {
    await stopInMemoryMongo();
  } catch (e) {
    // ignore
  }
});
