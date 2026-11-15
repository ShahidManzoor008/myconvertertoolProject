import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { createDeployer, run } from '../../scripts/deploy/host.mjs';

const oldID = 'a'.repeat(40) + '-1-1';
const nextID = 'b'.repeat(40) + '-2-1';

async function fixture(t, options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mct-deploy-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const old = path.join(root, 'releases', oldID);
  const staging = path.join(root, 'staging');
  for (const dir of [path.join(old, 'server'), path.join(old, 'client/dist/assets'), path.join(root, 'incoming'), path.join(root, 'uploads'), path.join(staging, 'server'), path.join(staging, 'client/dist/assets')]) await fs.mkdir(dir, { recursive: true });
  const envFile = path.join(root, '.env');
  await fs.writeFile(envFile, 'MONGODB_URI=mongodb://secret.invalid/production\nJWT_SECRET=not-for-artifacts\n', { mode: 0o600 });
  await fs.writeFile(path.join(root, 'host-config.json'), JSON.stringify({ origin: 'https://example.com', envFile, uploadsDirectory: path.join(root, 'uploads'), spreadsheetPython: '/usr/bin/python3', ports: [5100, 5101], drainSeconds: 190 }));
  await fs.writeFile(path.join(old, '.deployment.json'), JSON.stringify({ id: oldID, port: 5100 }));
  await fs.writeFile(path.join(old, 'release.json'), JSON.stringify({ id: oldID, commit: 'a'.repeat(40) }));
  await fs.writeFile(path.join(old, 'server/index.js'), '// previous source');
  for (const file of ['index.html', 'routes-manifest.json', '404.html']) await fs.writeFile(path.join(old, 'client/dist', file), 'previous build');
  if (!options.bootstrap) {
    await fs.symlink(old, path.join(root, 'current'));
    await fs.symlink(old, path.join(root, 'scheduler-current'));
  }
  for (const file of ['index.html', 'routes-manifest.json', '404.html']) await fs.writeFile(path.join(staging, 'client/dist', file), file === 'routes-manifest.json' ? '[]' : 'tested build');
  await fs.writeFile(path.join(staging, 'client/dist/assets/app-hash1234.js'), 'tested JavaScript');
  await fs.writeFile(path.join(staging, 'server/index.js'), '// tested server source');
  await fs.writeFile(path.join(staging, 'release.json'), JSON.stringify({ id: nextID, commit: 'b'.repeat(40) }));
  const archive = path.join(root, 'incoming', nextID + '.tar.gz');
  await run('tar', ['-czf', archive, '-C', staging, '.'], { stdio: 'pipe' });
  const digest = createHash('sha256').update(await fs.readFile(archive)).digest('hex');
  const events = [];
  let candidateWasRouted = false;
  let candidateConfigChecks = 0;
  const hooks = {
    async run(command, args, opts) {
      events.push([command, ...args]);
      if (command === 'tar') return run(command, args, { ...opts, stdio: 'pipe' });
      if (command === 'sudo' && args.includes('-t')) {
        const active = await fs.realpath(path.join(root, 'current'));
        if (active.endsWith(nextID)) {
          candidateConfigChecks++;
          assert.equal(await fs.realpath(path.join(root, 'scheduler-current')), old);
          if (options.configFailure) throw new Error('nginx config rejected');
        } else if (options.rollbackFailure && candidateWasRouted) throw new Error('rollback reload failed');
      }
    },
    async probe(url, id) {
      events.push(['probe', url, id]);
      if (url.startsWith('http:') && id === nextID) {
        if (!options.bootstrap) assert.equal(await fs.realpath(path.join(root, 'current')), old);
        if (options.unhealthy) throw new Error('candidate cannot reach database');
      }
      if (url.startsWith('https:') && id === nextID) {
        candidateWasRouted = true;
        assert.equal(await fs.realpath(path.join(root, 'current')), path.join(root, 'releases', nextID));
        assert.equal(await fs.realpath(path.join(root, 'scheduler-current')), old);
        if (options.publicFailure) throw new Error('wrong release served by proxy');
      }
    },
    async sleep(ms) { events.push(['sleep', ms]); },
    async smoke(url) { events.push(['smoke', url]); },
  };
  const deployer = await createDeployer(root, hooks);
  return { root, old, deployer, digest, events, configChecks: () => candidateConfigChecks };
}

test('successful deployment routes tested output only after readiness, then drains old backend', async t => {
  const f = await fixture(t);
  await f.deployer.deploy(nextID, f.digest);
  const candidate = path.join(f.root, 'releases', nextID);
  assert.equal(await fs.realpath(path.join(f.root, 'current')), candidate);
  assert.equal(await fs.realpath(path.join(f.root, 'scheduler-current')), candidate);
  assert.equal(await fs.realpath(path.join(candidate, 'server/uploads')), path.join(f.root, 'uploads'));
  assert.equal(await fs.readFile(path.join(candidate, 'client/dist/index.html'), 'utf8'), 'tested build');
  const snippet = await fs.readFile(path.join(candidate, 'nginx.conf'), 'utf8');
  assert.ok(snippet.includes('127.0.0.1:5101'));
  assert.ok(snippet.includes(candidate + '/client/dist'));
  const ecosystem = await fs.readFile(path.join(candidate, 'ecosystem.config.cjs'), 'utf8');
  assert.ok(!ecosystem.includes('not-for-artifacts'));
  const app = createRequire(import.meta.url)(path.join(candidate, 'ecosystem.config.cjs')).apps[0];
  assert.equal(app.env.JWT_SECRET, 'not-for-artifacts');
  assert.equal(app.env.PORT, '5101');
  assert.equal(app.env.DEPLOY_ACTIVE_LINK, path.join(f.root, 'scheduler-current'));
  assert.equal(app.cwd, path.join(candidate, 'server'));
  const publicCheck = f.events.findIndex(event => event[0] === 'probe' && event[1].startsWith('https:') && event[2] === nextID);
  const drain = f.events.findIndex(event => event[0] === 'sleep' && event[1] === 190000);
  const retire = f.events.findIndex(event => event[0] === 'pm2' && event[1] === 'delete');
  assert.ok(publicCheck < drain && drain < retire);
  assert.deepEqual(f.events[retire], ['pm2', 'delete', `mct-${oldID}`]);
  assert.ok(f.events.some(event => event[0] === 'npm' && event.includes('--omit=dev') && event.includes('server')));
});

test('unhealthy candidate never changes Nginx or stops the live backend', async t => {
  const f = await fixture(t, { unhealthy: true });
  await assert.rejects(f.deployer.deploy(nextID, f.digest), /candidate cannot reach database/);
  assert.equal(await fs.realpath(path.join(f.root, 'current')), f.old);
  assert.equal(f.configChecks(), 0);
  assert.deepEqual(f.events.filter(event => event[0] === 'pm2' && event[1] === 'delete'), [['pm2', 'delete', `mct-${nextID}`]]);
});

for (const failure of ['publicFailure', 'configFailure']) {
  test(`${failure} restores routing and drains candidate before removing it`, async t => {
    const f = await fixture(t, { [failure]: true });
    await assert.rejects(f.deployer.deploy(nextID, f.digest));
    assert.equal(await fs.realpath(path.join(f.root, 'current')), f.old);
    assert.equal(await fs.realpath(path.join(f.root, 'scheduler-current')), f.old);
    const drain = f.events.findIndex(event => event[0] === 'sleep' && event[1] === 190000);
    const retire = f.events.findIndex(event => event[0] === 'pm2' && event[1] === 'delete');
    assert.ok(drain >= 0 && drain < retire);
    assert.deepEqual(f.events[retire], ['pm2', 'delete', `mct-${nextID}`]);
    assert.ok(f.events.some(event => event[0] === 'probe' && event[1].startsWith('https:') && event[2] === oldID));
  });
}

test('failed rollback retains both backends for Nginx workers still using either version', async t => {
  const f = await fixture(t, { publicFailure: true, rollbackFailure: true });
  await assert.rejects(f.deployer.deploy(nextID, f.digest), /ROLLBACK FAILED/);
  assert.equal(f.events.some(event => event[0] === 'pm2' && event[1] === 'delete'), false);
});

test('checksum and path validation reject invalid artifacts before executing release code', async t => {
  const f = await fixture(t);
  await assert.rejects(f.deployer.deploy('../escape', f.digest), /Invalid release ID/);
  await assert.rejects(f.deployer.deploy(nextID, '0'.repeat(64)), /checksum mismatch/);
  assert.equal(f.events.some(event => ['tar', 'npm', 'pm2', 'sudo'].includes(event[0])), false);
  assert.equal(await fs.realpath(path.join(f.root, 'current')), f.old);
});

test('bootstrap stages a healthy release without reloading Nginx or enabling its scheduler', async t => {
  const f = await fixture(t, { bootstrap: true });
  await f.deployer.bootstrap(nextID, f.digest);
  assert.equal((await f.deployer.current()).id, nextID);
  await assert.rejects(fs.access(path.join(f.root, 'scheduler-current')));
  assert.equal(f.events.some(event => event[0] === 'sudo'), false);
  assert.equal(f.events.some(event => event[0] === 'pm2' && event[1] === 'delete'), false);
  await assert.rejects(f.deployer.bootstrap(nextID, f.digest), /Already bootstrapped/);
});

test('manual rollback restarts a retained release and retires the outgoing process', async t => {
  const f = await fixture(t);
  await f.deployer.deploy(nextID, f.digest);
  f.events.length = 0;
  await f.deployer.rollback(oldID);
  assert.equal((await f.deployer.current()).id, oldID);
  assert.equal(await fs.realpath(path.join(f.root, 'scheduler-current')), f.old);
  assert.deepEqual(f.events.filter(event => event[0] === 'pm2' && event[1] === 'delete'), [['pm2', 'delete', `mct-${nextID}`]]);
});
