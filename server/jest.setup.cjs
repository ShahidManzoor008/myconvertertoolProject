// Jest setup file (CommonJS) — run before tests to initialize environment.
require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const connectDB = require('./config/db');

beforeAll(async () => {
  // Connect to test database
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});
