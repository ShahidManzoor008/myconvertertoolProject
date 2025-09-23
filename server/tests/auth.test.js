import request from 'supertest';
import app from '../index.js';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

describe('Auth API', () => {
  afterEach(async () => {
    // clean users between tests
    await User.deleteMany({});
  });

  test('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
    .send({
      name: 'testuser',
        email: 'register@example.com',
        password: 'password123',
      });

    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('message');
    const user = await User.findOne({ email: 'register@example.com' });
    expect(user).not.toBeNull();
  });

  test('should not register a user with existing email', async () => {
    // create user with plain password; model will hash it via pre-save
    await User.create({ name: 'existing', email: 'duplicate@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'anotheruser',
        email: 'duplicate@example.com',
        password: 'password456',
      });

    expect(res.status).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });

  test('should login an existing user', async () => {
  await User.create({ name: 'loginuser', email: 'login@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });

    expect(res.status).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  test('should not login with incorrect password', async () => {
  await User.create({ name: 'badpassuser', email: 'badpass@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'badpass@example.com',
        password: 'wrongpassword',
      });

    expect(res.status).toEqual(401);
    expect(res.body).toHaveProperty('error');
  });

  test('should not login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

    expect(res.status).toEqual(401);
    expect(res.body).toHaveProperty('error');
  });
});
