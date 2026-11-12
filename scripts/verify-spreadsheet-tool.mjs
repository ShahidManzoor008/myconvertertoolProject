// Isolated browser QA: candidate bundle + spreadsheet API, no production service or database.
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import spreadsheetRouter from '../server/routes/spreadsheetConversion.js';
import { conversionCapacity } from '../server/middleware/conversionCapacity.js';

const root = path.resolve(import.meta.dirname, '..');
const build = path.resolve(process.env.FRONTEND_BUILD_DIR || path.join(root, 'client/dist'));
const fixtures = process.env.SPREADSHEET_FIXTURES || '/tmp/myconvertertool-spreadsheet-qa';
const output = process.env.SPREADSHEET_QA_OUTPUT || '/tmp/myconvertertool-spreadsheet-browser';
await fs.mkdir(output, { recursive: true });
const app = express();
app.use('/api/convert', conversionCapacity, spreadsheetRouter);
app.use('/api', (req, res) => res.status(req.path.startsWith('/auth') ? 401 : 200).json(
  req.path.includes('stats') ? { total: 0 } : req.path.includes('blog') ? { posts: [] } : {}));
app.use(express.static(build));
app.use((_req, res) => res.sendFile(path.join(build, 'index.html')));
const server = await new Promise(resolve => {
  const candidate = app.listen(0, '127.0.0.1', () => resolve(candidate));
});
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await puppeteer.launch({ headless: true, timeout: 60000, protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => request.url().startsWith(base) || /^(data:|blob:|about:)/.test(request.url())
    ? request.continue() : request.abort());
  for (const width of [1440, 390, 320]) {
    await page.setViewport({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const card = '#all-tools a[href="/tools/excel-pdf"]';
    await page.waitForSelector(card);
    await page.$eval(card, element => element.scrollIntoView({ block: 'center' }));
    await page.click(card);
    await page.waitForSelector('#tool-workspace');
    await page.waitForFunction(() => document.activeElement.id === 'tool-workspace');
    const state = await page.evaluate(() => ({
      top: document.querySelector('#tool-workspace').getBoundingClientRect().top,
      uploadTop: document.querySelector('#tool-workspace [role="presentation"]').getBoundingClientRect().top,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    }));
    assert.ok(Math.abs(state.top - 96) < 5, JSON.stringify(state));
    assert.ok(state.uploadTop < 600, JSON.stringify(state));
    assert.equal(state.overflow, false, `Horizontal overflow at ${width}px`);
    await page.screenshot({ path: path.join(output, `excel-pdf-${width}.png`), fullPage: true });
    console.log(`Verified homepage navigation and upload visibility at ${width}px`);
  }
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base + '/tools/excel-pdf', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="file"]');
  await page.locator('::-p-aria(PDF to Excel)').click();
  await (await page.$('input[type="file"]')).uploadFile(path.join(fixtures, 'tables.pdf'));
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Convert to Excel') && !b.disabled));
  const response = page.waitForResponse(res => res.url().endsWith('/api/convert/pdf-to-excel'));
  await page.locator('button[type="submit"]').click();
  assert.equal((await response).status(), 200);
  await page.waitForFunction(() => document.querySelector('table')?.textContent.includes('Widget'));
  console.log('Verified PDF upload, conversion and extracted table preview');
  await page.screenshot({ path: path.join(output, 'extracted-preview-desktop.png'), fullPage: true });
  await page.setViewport({ width: 320, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Preview mobile overflow');
  await page.screenshot({ path: path.join(output, 'extracted-preview-mobile.png'), fullPage: true });
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: output, eventsEnabled: true });
  const downloaded = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Download did not complete')), 30000);
    cdp.on('Browser.downloadProgress', event => {
      if (event.state === 'completed') { clearTimeout(timer); resolve(); }
    });
  });
  await page.locator('::-p-aria(Download Excel)').click();
  await downloaded;
  assert.ok((await fs.stat(path.join(output, 'tables.xlsx'))).size > 1000);
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.screenshot({ path: path.join(output, 'extracted-preview-dark.png'), fullPage: true });
  assert.deepEqual(errors, []);
  console.log(`Passed browser conversion, preview and download checks. Screenshots: ${output}`);
} finally {
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
