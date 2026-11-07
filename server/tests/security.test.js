import request from 'supertest';
import { PDFDocument } from 'pdf-lib';
import app from '../index.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { safeArchiveName } from '../controllers/batchDownloadController.js';
import { isPublicAddress, downloadPublicFile } from '../utils/safeDownload.js';

describe('Security regressions', () => {
  afterEach(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
  });
  test('password updates are hashed and revoke other sessions', async () => {
    await User.create({ name: 'Security Test', email: 'security@example.com', password: 'original-password' });
    const login = await request(app).post('/api/auth/login').send({ email: 'security@example.com', password: 'original-password' });
    expect(login.status).toBe(200);
    const user = await User.findOne({ email: 'security@example.com' });
    await Session.create({ user: user._id, token: 'other-session' });
    const response = await request(app).put('/api/auth/profile').set('Authorization', `Bearer ${login.body.token}`).send({ password: 'replacement-password' });
    expect(response.status).toBe(200);
    expect(response.body.password).toBeUndefined();
    const updated = await User.findById(user._id);
    expect(updated.password).not.toBe('replacement-password');
    expect(await updated.comparePassword('replacement-password')).toBe(true);
    expect(await updated.comparePassword('original-password')).toBe(false);
    expect((await Session.findOne({ token: 'other-session' })).isValid).toBe(false);
    await User.updateOne({ _id: user._id }, { status: 'inactive' });
    expect((await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${login.body.token}`)).status).toBe(401);
  });
  test.each(['../outside.pdf', '..\\outside.pdf', '.hidden', 'bad\u0000.pdf', '/absolute.pdf'])('rejects unsafe archive filename %s', name => {
    expect(safeArchiveName(name)).toBe(false);
  });
  test.each(['127.0.0.1', '10.0.0.1', '169.254.169.254', '::1', '::ffff:127.0.0.1', 'fc00::1', '192.168.1.1'])('blocks internal address %s', address => {
    expect(isPublicAddress(address)).toBe(false);
  });
  test('remote downloads require an explicit allowlist', async () => {
    const previous = process.env.ALLOWED_DOWNLOAD_DOMAINS;
    delete process.env.ALLOWED_DOWNLOAD_DOMAINS;
    try { await expect(downloadPublicFile('https://example.com/file.pdf')).rejects.toThrow('not allowed'); }
    finally { if (previous !== undefined) process.env.ALLOWED_DOWNLOAD_DOMAINS = previous; }
  });
  test('creates valid ZIP downloads and rejects traversal through HTTP', async () => {
    const pdf = await PDFDocument.create(); pdf.addPage();
    const url = `data:application/pdf;base64,${Buffer.from(await pdf.save()).toString('base64')}`;
    const result = await request(app).post('/api/batch').send({ files: [{ filename: 'valid.pdf', url }] }).buffer(true).parse((response, done) => {
      const chunks = []; response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => done(null, Buffer.concat(chunks)));
      response.on('error', done);
    });
    expect(result.status).toBe(200);
    expect(result.headers['content-type']).toContain('application/zip');
    expect(result.body.subarray(0, 2).toString()).toBe('PK');
    expect((await request(app).post('/api/batch').send({ files: [{ filename: '../outside.pdf', url }] })).status).toBe(400);
  });
  test('invalid input returns validation error rather than throwing in Zod middleware', async () => {
    const response = await request(app).post('/api/auth/register').send({ name: 'x', email: 'invalid', password: 'short' });
    expect(response.status).toBe(400);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });
});

// This check exercises a failed converter without starting Chrome or LibreOffice.
test('conversion failures identify the file rather than returning empty success', async () => {
  const { processFileConversion } = await import('../utils/pdfConversionUtils.js');
  await expect(processFileConversion([{ path: '/tmp/nonexistent-conversion-check', originalname: 'unsupported.xyz' }]))
    .rejects.toMatchObject({ conversionFailures: [{ filename: 'unsupported.xyz', error: 'File conversion failed' }] });
});

test('malformed JSON receives a client error', async () => {
  const response = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{not-json');
  expect(response.status).toBe(400);
});
