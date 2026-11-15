import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { readFile, stat, utimes, mkdir, rm } from 'node:fs/promises';

const uri = process.env.MONGO_URI_TEST;
const target = new URL(uri || 'mongodb://invalid');
if (target.hostname !== '127.0.0.1' || target.port !== '27019' || !target.pathname.endsWith('_test') || !process.env.BLOG_MEDIA_DIR?.startsWith('/home/ubuntu/.cache/mct-blog-test-media')) throw new Error('Use the isolated blog test database and media folder.');
process.env.JWT_SECRET = 'blog-test-secret'; process.env.NODE_ENV = 'test';
const { default: Blog } = await import('../models/Blog.js');
const { default: User } = await import('../models/User.js');
const { default: Session } = await import('../models/Session.js');
const { default: routes } = await import('../routes/blog.js');
const app = express(); app.use(express.json({ limit: '10mb' })); app.use(cookieParser()); app.use('/api/blog', routes);
let admin, member, draft, published, image;
before(async () => {
  await rm(process.env.BLOG_MEDIA_DIR, { recursive: true, force: true }); await mkdir(process.env.BLOG_MEDIA_DIR, { recursive: true });
  await mongoose.connect(uri);
  await Promise.all([Blog.init(), User.init(), Session.init()]);
  const create = async role => {
    const user = await User.create({ name: role, email: `${role}@example.com`, password: 'StrongPassword123!', role });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    await Session.create({ user: user._id, token }); return `mct_session=${token}`;
  };
  admin = await create('admin'); member = await create('user');
});
after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });
const markdown = '## First section\n\nA sufficiently detailed paragraph for publication that explains a useful workflow.\n\n### Details\n\n| Item | Value |\n| --- | --- |\n| One | Two |\n\n```html\n<script>alert(1)</script>\n```\n\n## First section\n\n[Unsafe](javascript:alert(1))';

test('blog mutations, previews and management reads require admin authorization', async () => {
  for (const endpoint of ['/posts', '/preview', '/images', '/media/cleanup']) {
    await request(app).post('/api/blog'+endpoint).send({}).expect(401);
    await request(app).post('/api/blog'+endpoint).set('Cookie', member).send({}).expect(403);
  }
  await request(app).get('/api/blog/manage/posts').set('Cookie', member).expect(403);
});
test('drafts are saved but excluded from public lists and direct article access', async () => {
  draft = (await request(app).post('/api/blog/posts').set('Cookie', admin).send({ title: 'Private draft', content: '', status: 'draft' }).expect(201)).body;
  assert.equal(draft.contentFormat, 'markdown');
  assert.equal((await request(app).get('/api/blog/posts').expect(200)).body.posts.length, 0);
  await request(app).get('/api/blog/posts/'+draft.slug).expect(404);
  assert.equal((await request(app).get('/api/blog/manage/posts/'+draft.slug).set('Cookie', admin).expect(200)).body.status, 'draft');
});
test('preview and public article use the same sanitized Markdown renderer', async () => {
  const preview = (await request(app).post('/api/blog/preview').set('Cookie', admin).send({ content: markdown }).expect(200)).body;
  published = (await request(app).post('/api/blog/posts').set('Cookie', admin).send({ title: 'A useful public guide', content: markdown, status: 'published', tags: 'guide,guide,JSON', category: 'Developer' }).expect(201)).body;
  assert.equal(preview.html, published.html);
  assert.match(published.html, /<table>/); assert.match(published.html, /&lt;script&gt;/);
  assert.ok(!published.html.includes('<script>')); assert.ok(!published.html.includes('href="javascript:'));
  assert.deepEqual(published.headings.map(h => h.id), ['section-first-section', 'section-details', 'section-first-section-2']);
  const response = await request(app).get('/api/blog/posts/'+published.slug).expect(200);
  assert.equal(response.body.content, preview.html); assert.equal(response.body.contentFormat, 'html'); assert.equal(response.body.sourceFormat, 'markdown');
  const list = (await request(app).get('/api/blog/posts?search=useful&category=Developer').expect(200)).body;
  assert.equal(list.posts.length, 1); assert.equal(list.posts[0].content, undefined); assert.deepEqual(list.posts[0].tags, ['guide', 'JSON']);
});
test('title edits keep URLs; revisions reject stale writes; duplicate titles get distinct URLs', async () => {
  const changed = (await request(app).put('/api/blog/posts/'+published.slug).set('Cookie', admin).send({ title: 'An improved title', author: 'Updated author', revision: published.revision }).expect(200)).body;
  assert.equal(changed.slug, published.slug); assert.equal(changed.author, 'Updated author');
  await request(app).put('/api/blog/posts/'+published.slug).set('Cookie', admin).send({ title: 'Stale text', revision: published.revision }).expect(409);
  published = changed;
  const another = (await request(app).post('/api/blog/posts').set('Cookie', admin).send({ title: 'Private draft', status: 'draft' }).expect(201)).body;
  assert.notEqual(another.slug, draft.slug);
});
test('image upload validates contents, produces WebP sizes, and keeps draft media private', async () => {
  await request(app).post('/api/blog/images').set('Cookie', admin).attach('image', Buffer.from('not an image'), 'fake.png').expect(400);
  const png = await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#2563eb' } }).png().toBuffer();
  image = (await request(app).post('/api/blog/images').set('Cookie', admin).attach('image', png, 'cover.png').expect(201)).body;
  await request(app).get(image.url).expect(404);
  const privateResponse = await request(app).get(image.url).set('Cookie', admin).expect(200);
  assert.match(privateResponse.headers['cache-control'], /no-store/);
  for (const [url, width] of [[image.url, 1280], [image.thumbnail, 480]]) {
    const metadata = await sharp(await readFile(process.env.BLOG_MEDIA_DIR+'/'+url.split('/').at(-1))).metadata(); assert.equal(metadata.format, 'webp'); assert.equal(metadata.width, width);
  }
  await request(app).put('/api/blog/posts/'+published.slug).set('Cookie', admin).send({ coverImage: image.url, coverThumbnail: image.thumbnail, revision: published.revision }).expect(400);
  published = (await request(app).put('/api/blog/posts/'+published.slug).set('Cookie', admin).send({ coverImage: image.url, coverThumbnail: image.thumbnail, coverAlt: 'A blue sample image', revision: published.revision }).expect(200)).body;
  assert.match((await request(app).get(image.url).expect(200)).headers['cache-control'], /immutable/);
});
test('unused-media cleanup retains referenced images including drafts and only removes old generated files', async () => {
  const png = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#fff' } }).png().toBuffer();
  const unused = (await request(app).post('/api/blog/images').set('Cookie', admin).attach('image', png, 'unused.png').expect(201)).body;
  for (const url of [unused.url, unused.thumbnail, image.url, image.thumbnail]) {
    const file = process.env.BLOG_MEDIA_DIR+'/'+url.split('/').at(-1), old = new Date(Date.now()-8*86400000); await utimes(file, old, old);
  }
  draft = (await request(app).put('/api/blog/posts/'+draft.slug).set('Cookie', admin).send({ content: `![Draft picture](${unused.url})`, revision: draft.revision }).expect(200)).body;
  const preview = (await request(app).get('/api/blog/media/unused').set('Cookie', admin).expect(200)).body;
  assert.deepEqual(preview.images.map(item => item.filename), [unused.thumbnail.split('/').at(-1)]);
  await request(app).post('/api/blog/media/cleanup').set('Cookie', admin).send({ confirm: false }).expect(400);
  const cleaned = (await request(app).post('/api/blog/media/cleanup').set('Cookie', admin).send({ confirm: true }).expect(200)).body;
  assert.equal(cleaned.removed, 1); await stat(process.env.BLOG_MEDIA_DIR+'/'+unused.url.split('/').at(-1));
});
test('equations render in the same pipeline while fenced code remains literal', async () => {
  const result = (await request(app).post('/api/blog/preview').set('Cookie', admin).send({ content: '## Math\n\nInline $\\frac{a}{b}$ and display:\n\n$$x^2+y^2=z^2$$\n\n```text\n$not_math$\n```' }).expect(200)).body;
  assert.match(result.html, /data:image\/png;base64/); assert.match(result.html, /\$not_math\$/); assert.ok(!result.html.includes('undefined'));
});

test('publishing rejects oversized fields, unsafe cover URLs, and new raw HTML documents', async () => {
  for (const fields of [{ title: 'x'.repeat(201) }, { title: 'Safe title', content: 'x'.repeat(200001) }, { title: 'Safe title', coverImage: 'https://example.com/remote.png' }, { title: 'Safe title', status: 'scheduled' }, { title: 'Safe title', contentFormat: 'html', content: '<p>Raw HTML</p>' }]) {
    await request(app).post('/api/blog/posts').set('Cookie', admin).send(fields).expect(400);
  }
});

test('AI test drafts can be edited, saved privately and explicitly published with provenance retained', async () => {
  const generated = await Blog.create({ title: 'AI test guide', slug: 'ai-test-guide', content: markdown, status: 'draft', contentFormat: 'markdown', revision: 1,
    author: 'MyConverterTool Team', authorType: 'Organization', coverImage: image.url, coverThumbnail: image.thumbnail, coverAlt: 'A blue cover',
    coverWidth: image.width, coverHeight: image.height, coverThumbnailWidth: image.thumbnailWidth,
    aiWriter: { generationId: 'test-generation', topicKey: 'test-topic', sources: [{ title: 'Source', url: 'https://example.com/news' }] } });
  const endpoint = '/api/blog/posts/' + generated.slug;
  await request(app).get(endpoint).expect(404);
  const loaded = (await request(app).get('/api/blog/manage/posts/' + generated.slug).set('Cookie', admin).expect(200)).body;
  const fields = ['title', 'content', 'excerpt', 'author', 'authorType', 'category', 'tags', 'coverImage', 'coverThumbnail', 'coverWidth', 'coverHeight', 'coverThumbnailWidth', 'coverAlt', 'status', 'contentFormat', 'revision'];
  const payload = Object.fromEntries(fields.map(key => [key, loaded[key]]));
  payload.content += '\n\nAn administrator verified and improved this explanation.';
  const edited = (await request(app).put(endpoint).set('Cookie', admin).send(payload).expect(200)).body;
  assert.equal(edited.revision, 2); await request(app).get(endpoint).expect(404);
  await request(app).put(endpoint).set('Cookie', member).send({ ...payload, status: 'published', revision: 2 }).expect(403);
  await request(app).put(endpoint).set('Cookie', admin).send({ ...payload, status: 'published' }).expect(409);
  const released = (await request(app).put(endpoint).set('Cookie', admin).send({ ...payload, status: 'published', revision: edited.revision }).expect(200)).body;
  assert.ok(released.publishedAt); assert.equal(released.aiWriter.generationId, 'test-generation'); assert.equal(released.aiWriter.sources[0].url, 'https://example.com/news');
  assert.match((await request(app).get(endpoint).expect(200)).body.content, /administrator verified/);
  await request(app).delete(endpoint).set('Cookie', admin).expect(200);
});
