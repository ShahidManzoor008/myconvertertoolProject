import request from 'supertest';
import { PDFDocument } from 'pdf-lib';
import app from '../index.js';
import Blog from '../models/Blog.js';
import { presentPost } from '../utils/blogPresentation.js';
import corrections from '../utils/seededGuideCorrections.json' with { type: 'json' };

const binary = (response, done) => {
  const chunks = []; response.on('data', chunk => chunks.push(chunk));
  response.on('end', () => done(null, Buffer.concat(chunks))); response.on('error', done);
};
let pdf;
beforeAll(async () => { const document = await PDFDocument.create(); document.addPage(); document.addPage(); pdf = Buffer.from(await document.save()); });

test.each([['split', 'ranges', '[[0,99]]'], ['split', 'ranges', '[]'], ['rotate', 'rotations', '[{"pageIndex":0,"angle":45}]'], ['reorder', 'order', '[99]'], ['watermark', 'options', '{invalid}'], ['rotate', 'rotations', '[null]'], ['watermark', 'options', 'null']])('PDF %s rejects invalid options as a client error', async (operation, field, value) => {
  const response = await request(app).post('/api/pdf/' + operation).attach('file', pdf, 'fixture.pdf').field(field, value).field('watermarkText', 'Fixture');
  expect(response.status).toBe(400);
});
test('split multiple ranges returns a real ZIP', async () => {
  const response = await request(app).post('/api/pdf/split').attach('file', pdf, 'fixture.pdf').field('ranges', '[[0,0],[1,1]]').buffer(true).parse(binary);
  expect(response.status).toBe(200); expect(response.body.subarray(0, 2).toString()).toBe('PK');
});
test('compression never increases download size and returns a readable PDF', async () => {
  const response = await request(app).post('/api/pdf/compress').attach('file', pdf, 'fixture.pdf');
  expect(response.status).toBe(200); expect(response.body.length).toBeLessThanOrEqual(pdf.length);
  expect((await PDFDocument.load(response.body)).getPageCount()).toBe(2);
});
test('editor accepts multipart numeric strings and rejects out-of-range pages', async () => {
  const valid = await request(app).post('/api/editor/add-text').attach('file', pdf, 'fixture.pdf').field('pageIndex', '0').field('x', '0').field('y', '0').field('size', '20').field('text', 'Fixture');
  expect(valid.status).toBe(200); expect((await PDFDocument.load(valid.body)).getPageCount()).toBe(2);
  const invalid = await request(app).post('/api/editor/delete-page').attach('file', pdf, 'fixture.pdf').field('pageIndex', '99');
  expect(invalid.status).toBe(400);
});
test('save endpoint cannot label a text upload as PDF', async () => {
  const response = await request(app).post('/api/editor/save-pdf').attach('file', Buffer.from('not a PDF'), 'fake.txt');
  expect(response.status).toBe(400);
});
test('Markdown endpoint rejects other document types', async () => {
  const response = await request(app).post('/api/convert/md-to-docx').attach('file', pdf, 'fixture.pdf');
  expect(response.status).toBe(400);
});
test('Markdown produces DOCX bytes and omits remote images', async () => {
  const response = await request(app).post('/api/convert/md-to-docx/text').send({ markdown: '# Fixture\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n![blocked](http://127.0.0.1:1/image.png)', filename: 'fixture' }).buffer(true).parse(binary);
  expect(response.status).toBe(200); expect(response.body.subarray(0, 2).toString()).toBe('PK');
});
test('seeded article correction does not overwrite an edited article', () => {
  const slug = 'exploring-our-development-tools';
  expect(presentPost({ slug, content: corrections[slug].before }).content).not.toContain('Real-time collaboration');
  expect(presentPost({ slug, content: 'An independently edited guide.' }).content).toBe('An independently edited guide.');
});
test('blog pagination advances and invalid cursor is a client error', async () => {
  await Blog.deleteMany({});
  for (let index = 0; index < 3; index++) await Blog.create({ title: `Fixture ${index}`, slug: `fixture-${index}`, author: 'Test', excerpt: 'A sufficiently long excerpt for this isolated test fixture.', content: '<p>This is a sufficiently long article for an isolated pagination test.</p>' });
  const first = await request(app).get('/api/blog/posts?limit=1');
  const second = await request(app).get('/api/blog/posts?limit=1&page=2');
  const cursor = await request(app).get('/api/blog/posts?limit=1&cursor=' + first.body.nextCursor);
  expect(first.body.posts[0]._id).not.toBe(second.body.posts[0]._id);
  expect(cursor.body.posts[0]._id).toBe(second.body.posts[0]._id);
  expect(first.body.posts[0].readingTime).toBeGreaterThan(0);
  expect((await request(app).get('/api/blog/posts?cursor=invalid')).status).toBe(400);
  expect((await request(app).get('/api/blog/posts?limit=-1')).status).toBe(400);
  await Blog.deleteMany({});
});

test('corrupt PDFs and whitespace-only watermarks are client errors', async () => {
  const corrupt = await request(app).post('/api/pdf/compress').attach('file', Buffer.from('%PDF-1.7\nThis is not a valid PDF document.'), 'corrupt.pdf');
  expect(corrupt.status).toBe(400);
  const blank = await request(app).post('/api/pdf/watermark').attach('file', pdf, 'fixture.pdf').field('watermarkText', '   ');
  expect(blank.status).toBe(400);
});
