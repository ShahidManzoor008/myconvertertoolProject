require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');
const connectDB = require('./config/db');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});
