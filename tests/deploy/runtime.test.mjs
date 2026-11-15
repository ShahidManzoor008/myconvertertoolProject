import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { isActiveRelease, readinessHandler } from '../../server/utils/deployment.js';

test('only the active release may run scheduled jobs, including missing/broken configuration', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mct-runtime-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const old = path.join(root, 'old'), next = path.join(root, 'next'), active = path.join(root, 'scheduler-current');
  await fs.mkdir(old); await fs.mkdir(next); await fs.symlink(old, active);
  assert.equal(isActiveRelease({}), true);
  assert.equal(isActiveRelease({ DEPLOY_ACTIVE_LINK: active }), false);
  assert.equal(isActiveRelease({ DEPLOY_ACTIVE_LINK: active, DEPLOY_RELEASE_DIR: old }), true);
  assert.equal(isActiveRelease({ DEPLOY_ACTIVE_LINK: active, DEPLOY_RELEASE_DIR: next }), false);
  await fs.unlink(active); await fs.symlink(next, active);
  assert.equal(isActiveRelease({ DEPLOY_ACTIVE_LINK: active, DEPLOY_RELEASE_DIR: old }), false);
  assert.equal(isActiveRelease({ DEPLOY_ACTIVE_LINK: active, DEPLOY_RELEASE_DIR: next }), true);
});

function response() {
  return { statusCode: 200, headers: {}, set(name, value) { this.headers[name] = value; return this; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('readiness requires MongoDB, frontend output and a server accepting work', async () => {
  const env = { DEPLOY_RELEASE_ID: 'release-123' };
  for (const state of ['ready', 'disconnected', 'ping-failed', 'build-missing', 'stopping']) {
    const res = response(); let pings = 0;
    await readinessHandler({
      env,
      connection: { readyState: state === 'disconnected' ? 0 : 1, db: { async command(_value, options) { pings++; assert.equal(options.timeoutMS, 1500); if (state === 'ping-failed') throw new Error('private database details'); } } },
      checkBuild: async () => { if (state === 'build-missing') throw new Error('private filesystem details'); },
      isStopping: () => state === 'stopping',
    })({}, res);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.equal(res.statusCode, state === 'ready' ? 200 : 503);
    assert.deepEqual(res.body, state === 'ready' ? { status: 'ready', release: 'release-123' } : { status: 'unavailable' });
    if (state === 'disconnected' || state === 'stopping') assert.equal(pings, 0);
  }
});
