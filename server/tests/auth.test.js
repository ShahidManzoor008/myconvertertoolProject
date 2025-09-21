const request = require('supertest');
const app = require('../index'); // Assuming your Express app is exported from index.js
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Use a separate test database
const dbUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/myconvertertool_test';

describe('Auth API', () => {
  beforeAll(async () => {
    await mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'register@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
    const user = await User.findOne({ email: 'register@example.com' });
    expect(user).not.toBeNull();
  });

  test('should not register a user with existing email', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({ username: 'existing', email: 'duplicate@example.com', password: hashedPassword });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'anotheruser',
        email: 'duplicate@example.com',
        password: 'password456',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'User with this email already exists');
  });

  test('should login an existing user', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({ username: 'loginuser', email: 'login@example.com', password: hashedPassword });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('should not login with incorrect password', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({ username: 'badpassuser', email: 'badpass@example.com', password: hashedPassword });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'badpass@example.com',
        password: 'wrongpassword',
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });

  test('should not login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });
});
