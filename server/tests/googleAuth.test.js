import { jest } from '@jest/globals';
import request from 'supertest';
import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../routes/auth.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
import User from '../models/User.js';
import Session from '../models/Session.js';

const clientId = '123456789-test-client.apps.googleusercontent.com';
const originalClientId = process.env.GOOGLE_CLIENT_ID;
const payload = { sub: 'google-subject', email: 'google-auth@example.com', email_verified: true, name: 'Google User' };
let verify;
beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = clientId;
  verify = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
});
afterEach(async () => {
  jest.restoreAllMocks();
  await Session.deleteMany({});
  await User.deleteMany({});
  if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
  else process.env.GOOGLE_CLIENT_ID = originalClientId;
});

test('public configuration returns only the verifier client ID without caching', async () => {
  const res = await request(app).get('/api/auth/config');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ googleClientId: clientId });
  expect(res.headers['cache-control']).toBe('no-store');
});

test.each(['', 'your-google-client-id'])('invalid configuration disables Google sign-in (%s)', async value => {
  process.env.GOOGLE_CLIENT_ID = value;
  expect((await request(app).get('/api/auth/config')).status).toBe(503);
  expect((await request(app).post('/api/auth/google').send({ token: 'credential' })).status).toBe(503);
  expect(verify).not.toHaveBeenCalled();
});

test.each([{}, { token: 123 }, { token: '' }])('invalid input never reaches Google (%j)', async body => {
  expect((await request(app).post('/api/auth/google').send(body)).status).toBe(400);
  expect(verify).not.toHaveBeenCalled();
});

test('wrong-audience credentials are rejected using the configured audience', async () => {
  verify.mockRejectedValue(new Error('Wrong recipient, payload audience != requiredAudience'));
  const res = await request(app).post('/api/auth/google').send({ token: 'wrong-audience' });
  expect(res.status).toBe(401);
  expect(verify).toHaveBeenCalledWith({ idToken: 'wrong-audience', audience: clientId });
});

test('unverified Google email cannot create or access an account', async () => {
  verify.mockResolvedValue({ getPayload: () => ({ ...payload, email_verified: false }) });
  expect((await request(app).post('/api/auth/google').send({ token: 'unverified' })).status).toBe(401);
  expect(await User.countDocuments({ email: payload.email })).toBe(0);
});

test('verified Google credentials create a valid session and inactive accounts remain blocked', async () => {
  const user = await User.create({ name: payload.name, email: payload.email, password: 'test-password' });
  verify.mockResolvedValue({ getPayload: () => payload });
  const res = await request(app).post('/api/auth/google').send({ token: 'valid-credential' });
  expect(res.status).toBe(200);
  expect(res.body.user.email).toBe(payload.email);
  const cookie = res.headers['set-cookie'][0].split(';')[0];
  const sessionToken = decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1));
  expect(await Session.findOne({ token: sessionToken, isValid: true })).not.toBeNull();
  expect((await request(app).get('/api/auth/verify').set('Cookie', cookie)).status).toBe(200);
  user.status = 'inactive';
  await user.save();
  expect((await request(app).post('/api/auth/google').send({ token: 'valid-credential' })).status).toBe(403);
});


test('database failures are reported as service errors rather than invalid credentials', async () => {
  verify.mockResolvedValue({ getPayload: () => payload });
  jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('database unavailable'));
  expect((await request(app).post('/api/auth/google').send({ token: 'valid-credential' })).status).toBe(500);
});


test('password login remains available without Google configuration', async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  await User.create({ name: 'Password User', email: 'password-auth@example.com', password: 'test-password' });
  const res = await request(app).post('/api/auth/login').send({ email: 'password-auth@example.com', password: 'test-password' });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeUndefined();
  expect(res.headers['set-cookie'].join(';')).toContain('mct_session=');
});
