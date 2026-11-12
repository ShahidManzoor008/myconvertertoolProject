import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { setupMiddleware } from '../middleware/index.js';
import { errorHandler } from '../utils/errorHandler.js';

test('production rate limits API requests while allowing assets, fonts, and approved origins', async context => {
  process.env.NODE_ENV = 'production';
  const app = express();
  setupMiddleware(app, ['https://myconvertertool.com']);
  app.get('/asset', (_req, res) => res.send('asset'));
  app.get('/api/check', (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  context.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (let i = 0; i < 35; i++) {
    const response = await fetch(base + '/asset');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-security-policy'), /fonts.googleapis.com/);
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.match(response.headers.get('content-security-policy'), /fonts.gstatic.com/);
    assert.match(response.headers.get('content-security-policy'), /https:\/\/accounts.google.com\/gsi\/style/);
    await response.text();
  }
  for (let i = 0; i < 30; i++) {
    const response = await fetch(base + '/api/check', { headers: { Origin: 'https://myconvertertool.com' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://myconvertertool.com');
    await response.text();
  }
  const limited = await fetch(base + '/api/check');
  assert.equal(limited.status, 429); await limited.text();
  const rejected = await fetch(base + '/asset', { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(rejected.status, 403); await rejected.text();
});

test('public auth configuration does not consume credential attempt limits', async context => {
  process.env.NODE_ENV = 'production';
  const app = express();
  setupMiddleware(app, []);
  app.get('/api/auth/config', (_req, res) => res.json({ googleClientId: 'public-client-id' }));
  app.post('/api/auth/login', (_req, res) => res.json({ ok: true }));
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  context.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (let i = 0; i < 7; i++) {
    const response = await fetch(base + '/api/auth/config');
    assert.equal(response.status, 200); await response.text();
  }
  for (let i = 0; i < 5; i++) {
    const response = await fetch(base + '/api/auth/login', { method: 'POST' });
    assert.equal(response.status, 200); await response.text();
  }
  const limited = await fetch(base + '/api/auth/login', { method: 'POST' });
  assert.equal(limited.status, 429); await limited.text();
});
