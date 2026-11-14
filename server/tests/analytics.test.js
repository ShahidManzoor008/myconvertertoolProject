import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import UsageMetric from '../models/UsageMetric.js';
import UserDailyUsage from '../models/UserDailyUsage.js';
import AnonymousVisitorDay from '../models/AnonymousVisitorDay.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { logConversion, getUsageAnalytics } from '../utils/statsUtils.js';

beforeAll(async () => { await Promise.all([UsageMetric.init(), UserDailyUsage.init(), AnonymousVisitorDay.init()]); });
afterEach(async () => {
  await Promise.all([UsageMetric.deleteMany({}), UserDailyUsage.deleteMany({}), AnonymousVisitorDay.deleteMany({}), Session.deleteMany({}), User.deleteMany({})]);
});

test('rejected or absent consent stores no analytics and clears the visitor cookie', async () => {
  await request(app).post('/api/stats/increment').send({ toolName: 'json-formatter' }).expect(200);
  await request(app).post('/api/stats/analytics/visit').send({ toolName: 'site' }).expect(204);
  expect(await UsageMetric.countDocuments()).toBe(0);
  const response = await request(app).post('/api/stats/analytics/consent').send({ analytics: false }).expect(200);
  expect(response.headers['set-cookie'].join(';')).toContain('mct_analytics_consent=rejected');
  expect(response.headers['set-cookie'].join(';')).toContain('HttpOnly');
  expect(await AnonymousVisitorDay.countDocuments()).toBe(0);
});

test('consented browser deduplication, coarse failures and account rollups discard file details', async () => {
  const browser = request.agent(app);
  await browser.post('/api/stats/analytics/consent').send({ analytics: true }).expect(200);
  for (let i = 0; i < 2; i++) await browser.post('/api/stats/analytics/visit').send({ toolName: 'site' }).expect(204);
  expect(await AnonymousVisitorDay.countDocuments()).toBe(1);
  expect((await getUsageAnalytics({ days: 7 })).anonymousUniqueVisitors).toBe(1);
  await browser.post('/api/stats/increment').send({ toolName: 'json-formatter', fileName: 'private.json', fileSize: 123 }).expect(200);
  const user = await User.create({ name: 'Analytics fixture', email: 'audit@example.com', password: 'test-password' });
  await logConversion({ toolName: 'pdf-to-excel', userId: user._id, analyticsAllowed: true, status: 'failure', reason: 'timeout with private filename' });
  const rollup = await UserDailyUsage.findOne({ userId: user._id }).lean();
  expect(rollup.reason).toBe('timeout');
  expect(rollup.expiresAt.getTime() - Date.now()).toBeGreaterThan(89 * 86400000);
  expect(JSON.stringify(await UsageMetric.find().lean())).not.toMatch(/private/);
});

test('conversion totals include more than twenty tools', async () => {
  await UsageMetric.insertMany(Array.from({ length: 25 }, (_, i) => ({ key: `tool-${i}`, day: new Date(), toolName: `tool-${i}`, action: 'conversion', outcome: 'success', audience: 'anonymous', count: 1 })));
  const data = await getUsageAnalytics({ days: 7 });
  expect(data.byTool.reduce((sum, row) => sum + row.successes, 0)).toBe(25);
});

test('cleanup and analytics require a current admin session; cookie writes require an approved origin', async () => {
  await request(app).get('/api/admin/analytics').expect(401);
  await request(app).post('/api/admin/maintenance/cleanup').send({ confirm: true }).expect(401);
  const user = await User.create({ name: 'Ordinary user', email: 'member@example.com', password: 'test-password' });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  await Session.create({ user: user._id, token });
  await request(app).get('/api/admin/maintenance/preview').set('Cookie', `mct_session=${token}`).expect(403);
  await request(app).post('/api/stats/analytics/consent').set('Cookie', `mct_session=${token}`).send({ analytics: true }).expect(403);
  user.role = 'admin'; await user.save();
  const preview = await request(app).get('/api/admin/maintenance/preview').set('Cookie', `mct_session=${token}`).expect(200);
  expect(preview.body.system.database).toBe('connected');
  await request(app).get('/api/admin/analytics').set('Cookie', `mct_session=${token}`).expect(200);
});

test('visitor and account detail indexes enforce thirty/ninety day expiry timestamps', () => {
  for (const model of [AnonymousVisitorDay, UserDailyUsage]) {
    expect(model.schema.indexes().some(([keys, options]) => keys.expiresAt === 1 && options.expireAfterSeconds === 0)).toBe(true);
  }
});
