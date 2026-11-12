import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import request from 'supertest';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import spreadsheetRouter from '../routes/spreadsheetConversion.js';

const run = promisify(execFile);
const python = process.env.SPREADSHEET_PYTHON || fileURLToPath(new URL('../../.venv-spreadsheet/bin/python', import.meta.url));
const app = express();
app.use('/api/convert', spreadsheetRouter);
let fixtures;
const upload = async (mode, filename, fields = {}) => {
  let call = request(app).post(`/api/convert/${mode}`);
  for (const [key, value] of Object.entries(fields)) call = call.field(key, value);
  return call.attach('file', await fs.readFile(path.join(fixtures, filename)), filename);
};
before(async () => {
  fixtures = await fs.mkdtemp(path.join(os.tmpdir(), 'spreadsheet-test-'));
  await run(python, [fileURLToPath(new URL('./fixtures/generate_spreadsheet_fixtures.py', import.meta.url)), fixtures]);
});
after(async () => { await fs.rm(fixtures, { recursive: true, force: true }); });

test('XLSX exports merged headings, calculated values, dates and multiple sheets to landscape A4', { timeout: 90000 }, async () => {
  const response = await upload('excel-to-pdf', 'sales.xlsx');
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const buffer = Buffer.from(response.body.base64, 'base64');
  const document = await PDFDocument.load(buffer);
  assert.equal(document.getPageCount(), 2);
  assert.ok(document.getPage(0).getWidth() > document.getPage(0).getHeight());
  const output = path.join(fixtures, 'sales.pdf');
  await fs.writeFile(output, buffer);
  const { stdout } = await run(python, ['-c', 'import pdfplumber,sys; p=pdfplumber.open(sys.argv[1]); print("\\n".join(page.extract_text() or "" for page in p.pages))', output]);
  for (const text of ['Quarterly sales', 'Widget', '19', '225.45', '2026-01-15', '00123']) assert.ok(stdout.includes(text), stdout);
  assert.equal(response.body.filename, 'sales.pdf');
});

test('portrait Letter and original scale options are applied', { timeout: 90000 }, async () => {
  const response = await upload('excel-to-pdf', 'sales.xlsx', { orientation: 'portrait', paperSize: 'Letter', fitToWidth: 'false' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const pdf = await PDFDocument.load(Buffer.from(response.body.base64, 'base64'));
  const page = pdf.getPage(0);
  assert.ok(Math.abs(page.getWidth() - 612) < 1);
  assert.ok(Math.abs(page.getHeight() - 792) < 1);
});

test('legacy XLS uploads convert to PDF', { timeout: 150000 }, async () => {
  const response = await upload('excel-to-pdf', 'legacy.xls');
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const pdf = await PDFDocument.load(Buffer.from(response.body.base64, 'base64'));
  assert.ok(pdf.getPageCount() >= 1);
});

test('fit to width keeps all columns of a wide worksheet on one page', { timeout: 90000 }, async () => {
  const response = await upload('excel-to-pdf', 'wide.xlsx');
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const buffer = Buffer.from(response.body.base64, 'base64');
  const pdf = await PDFDocument.load(buffer);
  assert.equal(pdf.getPageCount(), 1);
  const output = path.join(fixtures, 'wide.pdf');
  await fs.writeFile(output, buffer);
  const { stdout } = await run(python, ['-c', 'import pdfplumber,sys; p=pdfplumber.open(sys.argv[1]); print(p.pages[0].extract_text())', output]);
  assert.ok(stdout.includes('Column 20'), stdout);
  assert.ok(stdout.includes('Last column'), stdout);
});

test('multipage PDF tables become worksheets with numeric cells and formula text preserved safely', async () => {
  const response = await upload('pdf-to-excel', 'tables.pdf');
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.preview.length, 2);
  assert.equal(response.body.preview[0].rows, 4);
  assert.deepEqual(response.body.preview[0].sample[1], ['Widget', 12, '00123']);
  assert.deepEqual(response.body.preview[0].sample[2], ['=1+1', -4, '2026-01-15']);
  const zip = await JSZip.loadAsync(Buffer.from(response.body.base64, 'base64'));
  const xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  assert.ok(xml.includes('=1+1'));
  assert.ok(!xml.includes('<f>'));
  assert.ok(xml.includes('t="n"><v>125.5</v>'));
  assert.equal(response.body.mimeType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

test('borderless detection extracts aligned text tables', async () => {
  const response = await upload('pdf-to-excel', 'borderless.pdf', { tableMode: 'text' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.preview.length, 2);
  assert.ok(response.body.preview[0].sample.flat().includes('Widget'));
});

test('scanned, locked, prose-only and oversized-page PDFs have actionable errors', async () => {
  for (const [filename, message] of [['scanned.pdf', /OCR/], ['locked.pdf', /password/], ['prose.pdf', /No tables/], ['too-many-pages.pdf', /50 pages/]]) {
    const response = await upload('pdf-to-excel', filename);
    assert.equal(response.status, 422, JSON.stringify(response.body));
    assert.match(response.body.error, message);
  }
});

test('missing files, spoofed types, invalid options and excessive upload size are rejected', async () => {
  assert.equal((await request(app).post('/api/convert/excel-to-pdf')).status, 400);
  const spoofed = await request(app).post('/api/convert/excel-to-pdf').attach('file', Buffer.from('%PDF-1.7\n'), 'fake.xlsx');
  assert.equal(spoofed.status, 400);
  const options = await upload('excel-to-pdf', 'sales.xlsx', { orientation: 'diagonal' });
  assert.equal(options.status, 400);
  const huge = await request(app).post('/api/convert/pdf-to-excel').attach('file', Buffer.alloc(20 * 1024 * 1024 + 1), 'large.pdf');
  assert.equal(huge.status, 400);
  assert.match(huge.body.error, /20 MB/);
});

test('worker directories are cleaned after conversions', async () => {
  const entries = await fs.readdir(os.tmpdir());
  assert.equal(entries.filter(name => name.startsWith('myconvertertool-sheet-')).length, 0);
});

test('identifiers and high precision PDF numbers retain their exact text', async () => {
  const { stdout } = await run(python, ['-c',
    'import sys,json; sys.path.insert(0,sys.argv[1]); from spreadsheet_worker import cell_value; print(json.dumps([cell_value(x) for x in ["00123", "1234567890123456", "1.1234567890123456789", "12.50"]]))',
    fileURLToPath(new URL('../utils', import.meta.url))]);
  assert.deepEqual(JSON.parse(stdout), ['00123', '1234567890123456', '1.1234567890123456789', 12.5]);
});
