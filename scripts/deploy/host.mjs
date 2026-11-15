import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const idPattern = /^[a-f0-9]{40}-[0-9]+-[0-9]+$/;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const exists = filename => fs.access(filename).then(() => true, () => false);
const json = async filename => JSON.parse(await fs.readFile(filename, 'utf8'));

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', timeout: 300000, ...options });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} failed (${signal || code})`)));
  });
}

export async function probe(url, release) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000), cache: 'no-store', redirect: 'error' });
  if (!response.ok) throw new Error(`Health check returned ${response.status}`);
  const body = await response.json();
  if (body.status !== 'ready' || body.release !== release) throw new Error('Health check release mismatch');
}

export async function createDeployer(root, hooks = {}) {
  root = path.resolve(root);
  // These paths enter an Nginx configuration; reject metacharacters and spaces.
  if (!/^\/[A-Za-z0-9_./-]+$/.test(root)) throw new Error('Unsupported deployment root');
  const execute = hooks.run || run;
  const check = hooks.probe || probe;
  const sleep = hooks.sleep || delay;
  const config = await json(path.join(root, 'host-config.json'));
  const origin = new URL(config.origin);
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/') throw new Error('Expected an HTTPS origin');
  if (!Array.isArray(config.ports) || config.ports.length !== 2 || new Set(config.ports).size !== 2 || config.ports.some(port => !Number.isInteger(port) || port < 1024 || port > 65535)) throw new Error('Configure two distinct unprivileged ports');
  if (!Number.isInteger(config.drainSeconds) || config.drainSeconds < 190) throw new Error('Drain time must be at least 190 seconds');
  for (const name of ['envFile', 'uploadsDirectory', 'spreadsheetPython']) {
    if (!path.isAbsolute(config[name] || '')) throw new Error(`${name} must be absolute`);
    await fs.access(config[name]);
  }
  const envStat = await fs.stat(config.envFile);
  if (!envStat.isFile() || (envStat.mode & 0o077)) throw new Error('Environment file must be private (chmod 600)');
  const currentLink = path.join(root, 'current');
  const schedulerLink = path.join(root, 'scheduler-current');
  const releases = path.join(root, 'releases');
  for (const name of ['releases', 'incoming', 'shared/assets', 'results', 'logs']) await fs.mkdir(path.join(root, name), { recursive: true, mode: 0o755 });

  function releasePath(id) {
    if (!idPattern.test(id)) throw new Error('Invalid release ID');
    return path.join(releases, id);
  }
  async function metadata(directory) {
    const value = await json(path.join(directory, '.deployment.json'));
    if (releasePath(value.id) !== directory || !config.ports.includes(value.port)) throw new Error('Invalid stored release metadata');
    return value;
  }
  async function current() {
    let directory;
    try { directory = await fs.realpath(currentLink); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    return { directory, ...await metadata(directory) };
  }
  async function point(directory, link = currentLink) {
    const temp = `${link}.next-${process.pid}`;
    await fs.rm(temp, { force: true });
    await fs.symlink(directory, temp);
    await fs.rename(temp, link);
  }
  async function reload() {
    await execute('sudo', ['-n', '/usr/sbin/nginx', '-t']);
    await execute('sudo', ['-n', '/bin/systemctl', 'reload', 'nginx']);
  }
  async function healthy(url, id, attempts = 30) {
    let last;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try { await check(url, id); return; }
      catch (error) { last = error; await sleep(2000); }
    }
    throw new Error(`Release readiness failed: ${last.message}`);
  }
  const localHealth = value => `http://127.0.0.1:${value.port}/api/health`;
  const publicHealth = () => `${origin.origin}/api/health`;
  const processName = value => `mct-${value.id}`;
  async function stop(value) {
    // An already missing process is safe; preserve errors for operational review.
    try { await execute('pm2', ['delete', processName(value)]); }
    catch { console.warn(`Could not delete ${processName(value)}; inspect PM2 before reusing its port.`); }
  }
  async function prepare(id, port) {
    const directory = releasePath(id);
    const manifest = await json(path.join(directory, 'release.json'));
    if (manifest.id !== id || manifest.commit !== id.slice(0, 40)) throw new Error('Artifact identity mismatch');
    for (const filename of ['client/dist/index.html', 'client/dist/routes-manifest.json', 'client/dist/404.html', 'server/index.js']) await fs.access(path.join(directory, filename));
    await fs.rm(path.join(directory, 'server/uploads'), { force: true, recursive: true });
    await fs.symlink(config.uploadsDirectory, path.join(directory, 'server/uploads'));
    // Keep hashed assets available for tabs opened before this release.
    await fs.cp(path.join(directory, 'client/dist/assets'), path.join(root, 'shared/assets'), { recursive: true, force: false, errorOnExist: false });
    const template = await fs.readFile(path.join(here, 'nginx-app.conf.template'), 'utf8');
    const snippet = template.replaceAll('@@RELEASE_ROOT@@', directory).replaceAll('@@SHARED_ROOT@@', path.join(root, 'shared')).replaceAll('@@PORT@@', String(port));
    await fs.writeFile(path.join(directory, 'nginx.conf'), snippet, { mode: 0o644 });
    const value = { id, port, commit: manifest.commit };
    await fs.writeFile(path.join(directory, '.deployment.json'), JSON.stringify(value));
    // Parse .env as data, never source it as a shell script or log its contents.
    const environment = {
      NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port),
      DEPLOY_RELEASE_ID: id, DEPLOY_ACTIVE_LINK: schedulerLink, DEPLOY_RELEASE_DIR: directory,
      FRONTEND_BUILD_DIR: path.join(directory, 'client/dist'),
      BLOG_MEDIA_DIR: path.join(config.uploadsDirectory, 'blog-images'),
      SPREADSHEET_PYTHON: config.spreadsheetPython,
    };
    const ecosystem = `const {readFileSync}=require('node:fs');\nconst {parseEnv}=require('node:util');\nmodule.exports={apps:[${JSON.stringify({
      name: processName(value), script: path.join(directory, 'server/index.js'), cwd: path.join(directory, 'server'),
      interpreter: process.execPath, exec_mode: 'fork', instances: 1, kill_timeout: 190000,
      min_uptime: 10000, max_restarts: 5, time: true,
    }).slice(0, -1)},env:{...parseEnv(readFileSync(${JSON.stringify(config.envFile)},'utf8')),...${JSON.stringify(environment)}}}]};\n`;
    await fs.writeFile(path.join(directory, 'ecosystem.config.cjs'), ecosystem, { mode: 0o600 });
    return { directory, ...value };
  }
  async function start(candidate) {
    await execute('pm2', ['start', path.join(candidate.directory, 'ecosystem.config.cjs')]);
    await healthy(localHealth(candidate), candidate.id);
  }
  async function verifyPublic(candidate) {
    // Identity is checked through TLS and the actual production proxy.
    await healthy(publicHealth(), candidate.id, 10);
    for (const suffix of ['/', '/blog', '/sitemap.xml']) {
      if (hooks.smoke) await hooks.smoke(`${origin.origin}${suffix}`);
      else {
        const response = await fetch(`${origin.origin}${suffix}`, { signal: AbortSignal.timeout(10000), redirect: 'error' });
        await response.body?.cancel();
        if (response.status !== 200) throw new Error(`Public smoke check failed: ${suffix} (${response.status})`);
      }
    }
  }
  async function switchRelease(candidate, previous) {
    let pointed = false;
    try {
      await start(candidate);
      await execute('pm2', ['save']);
      await point(candidate.directory);
      pointed = true;
      await reload();
      await verifyPublic(candidate);
      // Preserve both processes across a reboot during the drain period.
      await execute('pm2', ['save']);
      await point(candidate.directory, schedulerLink);
    } catch (error) {
      if (pointed) {
        try {
          await point(previous.directory);
          await reload();
          await healthy(publicHealth(), previous.id, 10);
          await point(previous.directory, schedulerLink);
        } catch (rollbackError) {
          // Keep BOTH processes: some Nginx workers may still use either port.
          throw new Error(`${error.message}; ROLLBACK FAILED: ${rollbackError.message}. Both backends retained; inspect Nginx immediately.`);
        }
      }
      // Nginx may have accepted the candidate before a failed smoke check.
      if (pointed) await sleep(config.drainSeconds * 1000);
      await stop(candidate);
      await execute('pm2', ['save']);
      throw error;
    }
    await fs.writeFile(path.join(root, 'previous'), previous.id + '\n', { mode: 0o600 });
    await sleep(config.drainSeconds * 1000);
    await stop(previous);
    await execute('pm2', ['save']);
    return candidate;
  }
  async function extract(id, digest) {
    const directory = releasePath(id);
    if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error('Invalid artifact checksum');
    if (await exists(directory)) throw new Error('Release already exists; use a new workflow attempt or explicit rollback');
    const archive = path.join(root, 'incoming', `${id}.tar.gz`);
    const hash = createHash('sha256');
    const handle = await fs.open(archive, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      for await (const chunk of handle.createReadStream({ autoClose: false })) hash.update(chunk);
    } finally { await handle.close(); }
    if (hash.digest('hex') !== digest) throw new Error('Artifact checksum mismatch');
    await fs.mkdir(directory, { mode: 0o755 });
    await execute('tar', ['--no-same-owner', '--no-same-permissions', '-xzf', archive, '-C', directory]);
    // Tar can overwrite the destination mode with an older archive's private root.
    // Only expose directory traversal; private runtime files retain their modes.
    await fs.chmod(directory, 0o755);
    // Install only backend runtime packages, with native binaries for THIS host.
    await execute('npm', ['ci', '--omit=dev', '--workspace', 'server', '--include-workspace-root', '--no-audit', '--no-fund'], {
      cwd: directory,
      env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'true', CYPRESS_INSTALL_BINARY: '0' },
    });
    return directory;
  }
  return {
    current,
    async deploy(id, digest) {
      const previous = await current();
      if (!previous) throw new Error('Bootstrap and verify Nginx before enabling auto deployment');
      await healthy(publicHealth(), previous.id, 1);
      await extract(id, digest);
      const port = config.ports.find(value => value !== previous.port);
      return switchRelease(await prepare(id, port), previous);
    },
    async bootstrap(id, digest) {
      if (await current()) throw new Error('Already bootstrapped');
      await extract(id, digest);
      const candidate = await prepare(id, config.ports[0]);
      try { await start(candidate); }
      catch (error) { await stop(candidate); throw error; }
      // The legacy service keeps serving until the documented one-time Nginx edit.
      await point(candidate.directory);
      await execute('pm2', ['save']);
      return candidate;
    },
    async rollback(id) {
      const previous = await current();
      if (!previous) throw new Error('No active deployment');
      if (id === previous.id) throw new Error('Release is already active');
      await metadata(releasePath(id));
      const port = config.ports.find(value => value !== previous.port);
      return switchRelease(await prepare(id, port), previous);
    },
    async verify() {
      const active = await current();
      if (!active) throw new Error('No active deployment');
      await verifyPublic(active);
      await point(active.directory, schedulerLink);
      return active;
    },
  };
}

async function main() {
  process.umask(0o022);
  if (process.versions.node.split('.')[0] !== '24') throw new Error('Use Node.js 24');
  const [command, id, digest] = process.argv.slice(2);
  const root = process.env.MCT_DEPLOY_ROOT || path.join(homedir(), '.local/share/myconvertertool-deploy');
  const deployer = await createDeployer(root);
  if (!['deploy', 'bootstrap', 'rollback', 'verify', 'current'].includes(command)) throw new Error('Usage: host.sh deploy|bootstrap ID SHA256 | rollback ID | verify | current');
  let result;
  try {
    const active = await deployer[command](id, digest);
    result = { status: 'success', release: active?.id || null };
    console.log(JSON.stringify(result));
  } catch (error) {
    result = { status: 'failure', release: id, message: error.message };
    throw error;
  } finally {
    if (command === 'deploy' && idPattern.test(id || '')) {
      const filename = path.join(root, 'results', `${id}.json`);
      await fs.writeFile(filename + '.tmp', JSON.stringify(result), { mode: 0o600 });
      await fs.rename(filename + '.tmp', filename);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
