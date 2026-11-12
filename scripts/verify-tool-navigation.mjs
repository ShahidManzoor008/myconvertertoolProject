// Browser checks use the candidate bundle and mocked read-only API data, never production APIs.
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const root = path.resolve(import.meta.dirname, '..');
const build = path.resolve(process.env.FRONTEND_BUILD_DIR || '/tmp/myconvertertool-ui-build');
const output = path.resolve(process.env.UI_CHECK_OUTPUT || '/tmp/myconvertertool-ui-checks');
await fs.mkdir(output, { recursive: true });
const app = await fs.readFile(path.join(build, 'index.html'));
const routes = JSON.parse(await fs.readFile(path.join(root, 'client/src/data/publicRoutes.json'), 'utf8')).filter(route => route.type === 'tool' && !process.env.UI_HOME_ONLY && (!process.env.UI_ROUTE_FILTER || route.path.includes(process.env.UI_ROUTE_FILTER)));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(build, '.' + decodeURIComponent(url.pathname));
    if (file !== build && !file.startsWith(build + path.sep)) { res.writeHead(400).end(); return; }
    let body = app;
    let type = 'text/html';
    try { if ((await fs.stat(file)).isFile()) { body = await fs.readFile(file); type = types[path.extname(file)] || 'application/octet-stream'; } } catch { /* SPA fallback */ }
    res.writeHead(200, { 'Content-Type': type }); res.end(body);
  } catch { res.writeHead(500).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const results = [];
try {
  browser = await puppeteer.launch({ headless: true, timeout: 60000, protocolTimeout: 60000, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/')) {
      let data = {};
      if (url.pathname.includes('/blog/posts')) data = { posts: [] };
      if (url.pathname.includes('/stats/')) data = { total: 0, success: true };
      request.respond({ status: url.pathname.includes('/auth/') ? 401 : 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true' }, body: JSON.stringify(data) });
    } else if (request.url().startsWith(base) || /^(data:|blob:|about:)/.test(request.url())) request.continue();
    else request.abort();
  });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }, { name: 'prefers-color-scheme', value: 'light' }]);
  const home = async () => {
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#all-tools .tool-card', { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
  };
  const checkWorkspace = async route => {
    await page.waitForSelector('#tool-workspace', { timeout: 30000 });
    await page.waitForFunction(() => Math.abs(document.querySelector('#tool-workspace').getBoundingClientRect().top - 96) < 5, { timeout: 10000 });
    const state = await page.evaluate(() => {
      const region = document.querySelector('#tool-workspace');
      const input = [...region.querySelectorAll('textarea, input:not([type="hidden"]), [role="button"], [tabindex="0"]')].find(element => element.getClientRects().length);
      return {
        top: region.getBoundingClientRect().top,
        focused: document.activeElement === region,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        inputVisible: input && input.getBoundingClientRect().top < innerHeight - 40,
      };
    });
    assert.equal(state.focused, true, `${route}: workspace focus`);
    assert.equal(state.overflow, false, `${route}: horizontal overflow`);
    assert.equal(Boolean(state.inputVisible), true, `${route}: input is below the fold`);
    results.push({ route, viewport: page.viewport(), ...state });
    console.log(`Verified ${route} at ${page.viewport().width}px`);
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
  };

  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: width === 1440 ? 1000 : 844 });
    await home();
    await page.screenshot({ path: path.join(output, `home-${width}.png`), fullPage: true });
    await page.screenshot({ path: path.join(output, `home-fold-${width}.png`) });
  }
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: width === 1440 ? 1000 : 844 });
    for (const route of routes) {
      await home();
      const selector = `#all-tools a[href="${route.path}"]`;
      await page.$eval(selector, element => element.scrollIntoView({ block: 'center' }));
      await page.click(selector);
      await checkWorkspace(route.path);
      if (route.path === '/tools/pdf-converter' || route.path === '/tools/markdown-to-docx') {
        await page.screenshot({ path: path.join(output, `${route.path.split('/').pop()}-${width}.png`) });
        if (width === 390) {
          if (route.path === '/tools/markdown-to-docx') {
            await page.$$eval('button', buttons => buttons.find(button => button.getAttribute('aria-label') === 'Upload File').click());
            await page.waitForSelector('input[aria-label="Choose Markdown file"]');
            await page.screenshot({ path: path.join(output, 'markdown-upload-390.png') });
          }
          const fixture = path.join(output, 'navigation-fixture.md');
          await fs.writeFile(fixture, '# Upload check\n\nEquation: $E=mc^2$.');
          const input = await page.$('#tool-workspace input[type="file"]');
          await input.uploadFile(fixture);
          await page.waitForFunction(() => document.querySelector('#tool-workspace').textContent.includes('navigation-fixture.md'));
          assert.equal(await page.$$eval('#tool-workspace button', buttons => buttons.some(button => /Convert|Generate/.test(button.textContent) && !button.disabled)), true, 'Upload enables conversion');
          console.log(`Verified file selection for ${route.path}`);
        }
      }
    }
    await home();
    assert.equal(await page.evaluate(() => document.querySelector('#all-tools').compareDocumentPosition(document.querySelector('[aria-labelledby="categories-heading"]')) & Node.DOCUMENT_POSITION_FOLLOWING), 4);
    await page.type('#tool-search', 'markdown');
    assert.equal(await page.$$eval('#all-tools .tool-card', elements => elements.length), 1);
    await page.$eval('#tool-search', input => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, ''); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForFunction(() => document.querySelectorAll('#all-tools .tool-card').length === 10);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, `home-${width}.png`), fullPage: true });
  }
  // Direct visits must work as well as links, including narrow phones and dark mode.
  if (!process.env.UI_HOME_ONLY) {
    await page.setViewport({ width: 320, height: 740 });
    await page.goto(base + '/tools/pdf-converter', { waitUntil: 'domcontentloaded' });
    await checkWorkspace('direct PDF at 320px');
    await page.screenshot({ path: path.join(output, 'pdf-converter-320.png') });
  }
  await page.setViewport({ width: 1440, height: 1000 });
  await home();
  await page.evaluate(() => { localStorage.setItem('theme', 'dark'); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.dark #all-tools .tool-card');
  await page.screenshot({ path: path.join(output, 'home-dark.png'), fullPage: true });
  assert.deepEqual(errors, [], `Browser errors: ${errors.join('; ')}`);
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`Passed ${results.length} workspace navigation checks, home search/order, and dark mode. Screenshots: ${output}`);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
