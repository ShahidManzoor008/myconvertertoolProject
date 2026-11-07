import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { stopInMemoryMongo } from './config/db.js';

// Test URI must explicitly name a local test database; ignore production env.
const uri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/myconvertertool_test';
const parsed = new URL(uri);
if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || !/^\/[a-zA-Z0-9_]+_test$/.test(parsed.pathname)) {
  throw new Error('Tests require a local database with a name ending in _test');
}
process.env.MONGODB_URI = uri;
process.env.NODE_ENV = 'test';
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
