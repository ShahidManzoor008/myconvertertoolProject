import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { mkdir, rm, readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
import { articleInput, assessArticle, localClock, safeSourceUrl, writerSettingsInput } from '../utils/aiWriterPolicy.js';
import { geminiRequest, generationPrompt, checkGeminiConnection } from '../utils/geminiWriter.js';
import { parsePublisherFeed, getPublisherSources } from '../utils/aiWriterSources.js';
import { renderBlogListingHtml, renderArticleHtml } from '../utils/pageSeo.js';

const uri = process.env.MONGO_URI_TEST;
const target = new URL(uri || 'mongodb://invalid');
if (target.hostname !== '127.0.0.1' || target.port !== '27019' || target.pathname !== '/ai_writer_test') throw new Error('Use isolated mongodb://127.0.0.1:27019/ai_writer_test only.');
process.env.GEMINI_WRITER_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.NODE_ENV = 'test'; process.env.JWT_SECRET = 'writer-isolated-test';
process.env.BLOG_MEDIA_DIR = '/home/ubuntu/.cache/mct-blog-test-media-aiwriter';
process.env.GEMINI_API_KEY = 'fake-key-never-send'; process.env.GEMINI_WRITER_MODEL = 'gemini-2.5-flash'; process.env.AI_WRITER_ALLOW_REQUESTS = 'true'; process.env.GEMINI_WRITER_BILLING_MODE = 'free';
const { AIWriterSettings, AIWriterJob, AIWriterMeter, AIWriterLock, AIWriterProvider } = await import('../models/AIWriter.js');
const { default: Blog } = await import('../models/Blog.js');
const { default: User } = await import('../models/User.js');
const { default: Session } = await import('../models/Session.js');
const { default: routes } = await import('../routes/aiWriter.js');
const { getWriterSettings, updateWriterSettings, pauseWriter, enqueueWriter, cancelWriterJob, processWriterJob, writerTick, saveWriterProvider, removeWriterProvider, testWriterConnection } = await import('../utils/aiWriterService.js');
const { getWriterCredentials, getWriterProviderStatus } = await import('../utils/aiWriterCredentials.js');
const app = express(); app.use(express.json()); app.use(cookieParser()); app.use('/api/ai-writer', routes);
let admin, member;
const models = [AIWriterSettings, AIWriterJob, AIWriterMeter, AIWriterLock, AIWriterProvider, Blog];
before(async () => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  await mkdir(process.env.BLOG_MEDIA_DIR, { recursive: true });
  await Promise.all([...models, User, Session].map(model => model.init()));
  const cookie = async role => {
    const user = await User.create({ name: role, email: `writer-${role}@example.com`, password: 'StrongPassword123!', role });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET); await Session.create({ user: user._id, token }); return `mct_session=${token}`;
  };
  admin = await cookie('admin'); member = await cookie('user');
});
beforeEach(async () => { for (const model of models) await model.deleteMany({}); });
after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); await rm(process.env.BLOG_MEDIA_DIR, { recursive: true, force: true }); });
const fields = ['enabled', 'paused', 'mode', 'articlesPerDay', 'timezone', 'hour', 'topics', 'instructions', 'excludedTopics', 'primaryDomains', 'monthlyRequestLimit', 'revision'];
const editable = settings => Object.fromEntries(fields.map(key => [key, settings[key]]));
const sources = [{ url: 'https://blog.google/technology/new-tool', title: 'Google announcement' }, { url: 'https://example.com/news/tool', title: 'Independent reporting' }];
const article = () => ({ title: 'A new AI document workflow explained clearly', excerpt: 'A practical look at the latest document workflow, its capabilities and the limitations users should understand.',
  content: `## What changed\n\n${'A useful explanation of the new announcement and its limits. '.repeat(7)}[Announcement](https://blog.google/technology/new-tool)\n\n## Who benefits\n\n${'Readers can use the new workflow for everyday tasks while checking its limitations. '.repeat(5)}\n\n## Practical limitations\n\nRead the [reporting](https://example.com/news/tool) and verify the latest availability.`,
  category: 'AI', tags: ['AI', 'documents'], eventDate: new Date().toISOString().slice(0, 10), topic: 'Specific newly announced document workflow 2026', sourceUrls: sources.map(source => source.url) });
async function running(overrides = {}, trigger = 'manual') {
  const settings = await getWriterSettings(); await updateWriterSettings({ ...editable(settings), ...overrides });
  const job = await enqueueWriter('Focus on practical use for students.', trigger);
  await AIWriterLock.create({ _id: 'writer-worker', owner: 'test-worker', until: new Date(Date.now() + 600000) });
  return AIWriterJob.findByIdAndUpdate(job._id, { $set: { state: 'running', owner: 'test-worker' } }, { returnDocument: 'after' }).lean();
}
const cover = async () => ({ url: '', thumbnail: '', width: 1280, height: 720, thumbnailWidth: 480 });
const mockProvider = (draft = article(), onReview) => async ({ writing }) => {
  if (!writing && onReview) await onReview();
  return { text: JSON.stringify(writing ? draft : { pass: true, issues: [] }), sources, suggestions: '<div>Google suggestions</div>', usage: { tokens: 42, searches: writing ? 1 : 0 } };
};

test('all writer controls require admin and do not expose credentials', async () => {
  for (const [method, path] of [['get', ''], ['put', '/settings'], ['post', '/generate'], ['post', '/pause'], ['post', '/history/cleanup'], ['post', '/jobs/abc/cancel'], ['put', '/provider'], ['post', '/provider/test'], ['post', '/provider/disconnect'], ['post', '/generate-test'], ['get', '/jobs/abc']]) {
    await request(app)[method]('/api/ai-writer' + path).send({}).expect(401);
    await request(app)[method]('/api/ai-writer' + path).set('Cookie', member).send({}).expect(403);
  }
  const result = await request(app).get('/api/ai-writer').set('Cookie', admin).expect(200);
  assert.equal(result.body.settings.enabled, false); assert.equal(result.body.settings.mode, 'draft');
  assert.ok(!JSON.stringify(result.body).includes('fake-key')); assert.match(result.headers['cache-control'], /no-store/);
});
test('admin instructions are validated, persisted, revision protected and passed to the prompt', async () => {
  const settings = editable(await getWriterSettings());
  const input = { ...settings, instructions: 'Focus on free student tools; avoid hype.', topics: 'AI for students' };
  await request(app).put('/api/ai-writer/settings').set('Cookie', admin).send(input).expect(200);
  await request(app).put('/api/ai-writer/settings').set('Cookie', admin).send(input).expect(409);
  assert.match(generationPrompt(await getWriterSettings(), 'Cover document tools', [], new Date()), /Focus on free student tools/);
  assert.match(generationPrompt(await getWriterSettings(), 'Cover document tools', [], new Date()), /Cover document tools/);
  assert.throws(() => writerSettingsInput.parse({ ...settings, timezone: 'Invalid/Moon' }));
  assert.throws(() => writerSettingsInput.parse({ ...settings, monthlyRequestLimit: 999999 }));
  assert.throws(() => writerSettingsInput.parse({ ...settings, arbitraryApiKey: 'secret' }));
});
test('daily slots are atomic under concurrent requests and cancellation does not refund them', async () => {
  const results = await Promise.allSettled([enqueueWriter('first'), enqueueWriter('second')]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const job = results.find(result => result.status === 'fulfilled').value;
  await cancelWriterJob(job._id); await assert.rejects(enqueueWriter('again'), /slots/);
});
test('source-based content and passing review save a private draft by default', async () => {
  const job = await running();
  await processWriterJob(job, 'test-worker', { request: mockProvider(), getSources: async () => sources, makeCover: cover });
  const post = await Blog.findOne().lean(); assert.equal(post.status, 'draft'); assert.equal(post.contentFormat, 'markdown');
  assert.equal(post.aiWriter.sources.length, 2); assert.equal(post.aiWriter.generationId, String(job._id));
  const finished = await AIWriterJob.findById(job._id).lean(); assert.equal(finished.state, 'draft'); assert.equal(finished.usage.requests, 2); assert.equal(finished.usage.tokens, 84);
});
test('automatic publication requires clean checks and preserves generation provenance', async () => {
  const job = await running({ mode: 'auto' });
  await processWriterJob(job, 'test-worker', { request: mockProvider(), getSources: async () => sources, makeCover: cover });
  const post = await Blog.findOne().lean(); assert.equal(post.status, 'published'); assert.ok(post.publishedAt);
  assert.equal((await AIWriterJob.findById(job._id)).state, 'published');
});
test('writer creates original WebP covers with saved references and actual dimensions', async () => {
  const job = await running();
  await processWriterJob(job, 'test-worker', { request: mockProvider(), getSources: async () => sources });
  const post = await Blog.findOne().lean();
  assert.ok(post, (await AIWriterJob.findById(job._id)).reasons.join(' '));
  for (const [url, width] of [[post.coverImage, 1280], [post.coverThumbnail, 480]]) {
    const filename = url.split('/').at(-1);
    const metadata = await sharp(await readFile(process.env.BLOG_MEDIA_DIR + '/' + filename)).metadata();
    assert.equal(metadata.format, 'webp'); assert.equal(metadata.width, width); assert.ok(post.imageFiles.includes(filename));
  }
  assert.equal(post.coverWidth, 1280); assert.equal(post.coverHeight, 720);
});
test('unsupported dates or sources hold auto-publication as a draft with reasons', async () => {
  const job = await running({ mode: 'auto' }); const draft = article(); draft.eventDate = '2020-01-01';
  await processWriterJob(job, 'test-worker', { request: mockProvider(draft), getSources: async () => sources, makeCover: cover });
  assert.equal((await Blog.findOne()).status, 'draft');
  assert.match((await AIWriterJob.findById(job._id)).reasons.join(' '), /72 hours/);
});
test('changing instructions during a run prevents publication and cancels work', async () => {
  const job = await running({ mode: 'auto' });
  await processWriterJob(job, 'test-worker', { request: mockProvider(article(), async () => { await updateWriterSettings({ ...editable(await getWriterSettings()), instructions: 'New instructions' }); }), getSources: async () => sources, makeCover: cover });
  assert.equal(await Blog.countDocuments(), 0); assert.equal((await AIWriterJob.findById(job._id)).state, 'cancelled');
});
test('pause aborts unfinished writing and prevents new jobs', async () => {
  const job = await running({ mode: 'auto' });
  await processWriterJob(job, 'test-worker', { request: mockProvider(article(), pauseWriter), getSources: async () => sources, makeCover: cover });
  assert.equal(await Blog.countDocuments(), 0); await assert.rejects(enqueueWriter('test'), /paused/);
});
test('monthly request ceilings are reserved before provider calls, including failures', async () => {
  const job = await running({ monthlyRequestLimit: 2 });
  await AIWriterMeter.create({ _id: `month:${new Date().toISOString().slice(0, 7)}`, requests: 2 });
  let called = false;
  await processWriterJob(job, 'test-worker', { request: async () => { called = true; }, getSources: async () => sources, makeCover: cover });
  assert.equal(called, false); assert.match((await AIWriterJob.findById(job._id)).reasons.join(' '), /Monthly API request limit/);
});
test('provider errors do not publish or retry indefinitely', async () => {
  const job = await running(); let calls = 0;
  await processWriterJob(job, 'test-worker', { getSources: async () => sources, request: async () => { calls++; throw new Error('Google quota exhausted'); } });
  assert.equal(calls, 1); assert.equal(await Blog.countDocuments(), 0); assert.equal((await AIWriterJob.findById(job._id)).usage.requests, 1);
});
test('duplicate topic identity prevents an additional article', async () => {
  const job = await running();
  await processWriterJob(job, 'test-worker', { request: mockProvider(), getSources: async () => sources, makeCover: cover });
  await AIWriterJob.findByIdAndUpdate(job._id, { state: 'running' });
  await processWriterJob(job, 'test-worker', { request: mockProvider(), getSources: async () => sources, makeCover: cover });
  assert.equal(await Blog.countDocuments(), 1);
});
test('an expired worker cannot create an article even with a completed model response', async () => {
  const job = await running({ mode: 'auto' });
  await processWriterJob(job, 'test-worker', { request: mockProvider(article(), async () => { await AIWriterLock.updateOne({ _id: 'writer-worker' }, { $set: { owner: 'replacement' } }); }), getSources: async () => sources, makeCover: cover });
  assert.equal(await Blog.countDocuments(), 0);
});
test('scheduler fills at most the configured daily slots without overlapping workers', async () => {
  await updateWriterSettings({ ...editable(await getWriterSettings()), enabled: true, hour: 0, articlesPerDay: 3 });
  let calls = 0;
  const processJob = async job => { calls++; await AIWriterJob.updateOne({ _id: job._id }, { $set: { state: 'failed', completedAt: new Date() } }); };
  await Promise.all([writerTick({ processJob }), writerTick({ processJob })]);
  for (let i = 0; i < 4; i++) await writerTick({ processJob });
  assert.equal(calls, 3); assert.equal(await AIWriterJob.countDocuments(), 3);
  assert.equal(await Blog.countDocuments(), 0);
});
test('scheduler does not backfill old queued jobs and recovers saved articles after restart', async () => {
  const job = await running();
  await processWriterJob(job, 'test-worker', { request: mockProvider(), getSources: async () => sources, makeCover: cover });
  await AIWriterJob.updateOne({ _id: job._id }, { $set: { state: 'running' } });
  await AIWriterLock.updateOne({ _id: 'writer-worker' }, { $set: { until: new Date(0) } });
  const settings = await getWriterSettings();
  const old = await AIWriterJob.create({ key: '2000-01-01:1', day: '2000-01-01', slot: 1, state: 'queued', trigger: 'schedule', settings });
  await writerTick({ processJob: async () => { throw new Error('No provider work expected'); } });
  assert.equal((await AIWriterJob.findById(job._id)).state, 'draft');
  assert.equal((await AIWriterJob.findById(old._id)).state, 'cancelled');
  assert.equal(await Blog.countDocuments(), 1);
});
test('history cleanup keeps articles, active work and recent summaries', async () => {
  const settings = await getWriterSettings();
  await AIWriterJob.create({ key: 'old:1', settings, state: 'failed', completedAt: new Date(Date.now() - 8 * 86400000) });
  await AIWriterJob.create({ key: 'new:1', settings, state: 'queued' });
  await AIWriterJob.create({ key: 'new:2', settings, state: 'draft', completedAt: new Date() });
  const response = await request(app).post('/api/ai-writer/history/cleanup').set('Cookie', admin).send({}).expect(200);
  assert.equal(response.body.removed, 1); assert.equal(await AIWriterJob.countDocuments(), 2);
});
test('source and timezone policies reject unsafe URLs and handle DST/local day boundaries', () => {
  assert.equal(safeSourceUrl('http://example.com'), null); assert.equal(safeSourceUrl('https://127.0.0.1/x'), null); assert.equal(safeSourceUrl('https://user:pass@example.com'), null);
  assert.equal(safeSourceUrl('https://example.com/a?utm_source=foo#bar'), 'https://example.com/a');
  assert.equal(localClock(new Date('2026-11-14T20:00:00Z'), 'Asia/Karachi').day, '2026-11-15');
  assert.equal(localClock(new Date('2026-11-01T06:30:00Z'), 'America/New_York').hour, 1);
  assert.ok(assessArticle(articleInput.parse(article()), sources, { primaryDomains: ['blog.google'] }).length === 0);
});
test('publisher feeds accept recent official entries, strip markup and reject foreign/old/unsafe items', async () => {
  const now = new Date('2026-11-14T12:00:00Z');
  const feed = { url: 'https://blog.google/rss/', hosts: ['blog.google'] };
  const xml = `<rss><channel><item><title>Useful new AI announcement</title><link>https://blog.google/technology/ai/new</link><pubDate>Sat, 14 Nov 2026 09:00:00 GMT</pubDate><description><![CDATA[<p>This is a useful official explanation of a new feature available today.</p>]]></description></item><item><title>Unsafe feed entry</title><link>https://127.0.0.1/private</link><pubDate>Sat, 14 Nov 2026 09:00:00 GMT</pubDate><description>This should never become a source for the AI writer.</description></item></channel></rss>`;
  const entries = parsePublisherFeed(xml, feed, now);
  assert.equal(entries.length, 1); assert.equal(entries[0].publisher, 'blog.google'); assert.ok(!entries[0].summary.includes('<p>'));
  assert.equal(parsePublisherFeed(xml, feed, new Date('2026-12-01')).length, 0);
  assert.throws(() => parsePublisherFeed('<!DOCTYPE rss><rss/>', feed, now));
  const downloaded = [];
  const found = await getPublisherSources(new AbortController().signal, async (url, options) => { downloaded.push(url); assert.equal(options.httpsOnly, true); assert.equal(options.maxBytes, 2 * 1024 * 1024); return Buffer.from(xml); }, now);
  assert.equal(downloaded.length, 3); assert.equal(found.length, 1);
});
test('fixed-host Gemini adapter avoids Search grounding, counts usage and rejects invalid model IDs', async () => {
  let calledUrl;
  const response = await geminiRequest({ prompt: 'test', writing: true, model: 'gemini-2.5-flash' }, async (url, options) => {
    calledUrl = url; assert.equal(JSON.parse(options.body).tools, undefined); assert.equal(JSON.parse(options.body).generationConfig.responseMimeType, 'application/json');
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"skip":"no news"}' }] }, groundingMetadata: { groundingChunks: sources.map(web => ({ web: { uri: web.url, title: web.title } })), webSearchQueries: ['test'], searchEntryPoint: { renderedContent: '<div>Google</div>' } } }], usageMetadata: { totalTokenCount: 22 } }));
  });
  assert.match(calledUrl, /^https:\/\/generativelanguage.googleapis.com\//); assert.equal(response.usage.tokens, 22);
  await assert.rejects(geminiRequest({ model: '../../bad', prompt: '' }), /valid Gemini/);
  assert.equal((await getWriterProviderStatus()).configured, true);

});
test('article attribution discloses AI assistance and fresh blog HTML exposes new article links', async () => {
  const template = '<html><head></head><body><!--route-content-->old<!--/route-content--></body></html>';
  assert.match(renderBlogListingHtml(template, [{ title: 'Newest article', slug: 'newest', excerpt: 'New content' }]), /href="\/blog\/newest"/);
  const html = await renderArticleHtml(template, { ...article(), slug: 'ai-news', contentFormat: 'markdown', aiWriter: { generationId: 'run', sources } });
  assert.match(html, /created with AI assistance/); assert.ok(!html.includes('<script>bad()'));
});

const fakeKey = 'AIzaSy-test-credentials-for-writer-12345';
const providerConfig = (overrides = {}) => ({ apiKey: fakeKey, model: 'gemini-2.5-flash', billingMode: 'free', requestsEnabled: true, revision: 0, ...overrides });
const modelReply = () => new Response(JSON.stringify({ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] }));
test('admin can save an encrypted key without disclosing it through any management API', async () => {
  const response = await request(app).put('/api/ai-writer/provider').set('Cookie', admin).send(providerConfig()).expect(200);
  assert.equal(response.body.keyConfigured, true); assert.equal(response.body.configured, true);
  assert.ok(!JSON.stringify(response.body).includes(fakeKey)); assert.equal(response.body.encryptedKey, undefined);
  const raw = await AIWriterProvider.collection.findOne({ _id: 'gemini' });
  assert.match(raw.encryptedKey, /^v1\./); assert.ok(!JSON.stringify(raw).includes(fakeKey));
  assert.equal((await getWriterCredentials()).apiKey, fakeKey);
  assert.equal((await AIWriterProvider.findById('gemini').lean()).encryptedKey, undefined);
  const dashboard = await request(app).get('/api/ai-writer').set('Cookie', admin).expect(200);
  assert.ok(!JSON.stringify(dashboard.body).includes(fakeKey)); assert.ok(!JSON.stringify(dashboard.body).includes(raw.encryptedKey));
  await request(app).put('/api/ai-writer/provider').set('Cookie', admin).send(providerConfig()).expect(409);
});
test('blank replacement keeps the saved key; disconnect blocks environment fallback and stops the schedule', async () => {
  await saveWriterProvider(providerConfig());
  await saveWriterProvider(providerConfig({ apiKey: '', revision: 1, requestsEnabled: false }));
  assert.equal((await getWriterCredentials()).apiKey, fakeKey);
  assert.equal((await getWriterProviderStatus()).configured, false);
  await removeWriterProvider(2);
  assert.equal((await getWriterCredentials()).apiKey, '');
  assert.equal((await getWriterProviderStatus()).keyConfigured, false);
  assert.equal((await getWriterSettings()).enabled, false);
  await assert.rejects(enqueueWriter('must not use the environment key'), /Add your Gemini/);
});
test('connection check uses the saved key against model metadata and returns no secret', async () => {
  await saveWriterProvider(providerConfig({ requestsEnabled: false }));
  const previous = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash');
    assert.equal(options.headers['x-goog-api-key'], fakeKey); assert.equal(options.body, undefined);
    return modelReply();
  };
  try {
    const response = await request(app).post('/api/ai-writer/provider/test').set('Cookie', admin).send({}).expect(200);
    assert.equal(response.body.ok, true); assert.match(response.body.message, /supports text generation/);
    assert.ok(!JSON.stringify(response.body).includes(fakeKey));
    assert.equal((await getWriterProviderStatus()).lastTest.ok, true);
    assert.equal((await AIWriterMeter.findById(`month:${new Date().toISOString().slice(0, 7)}`)).requests, 1);
  } finally { globalThis.fetch = previous; }
});
test('connection failures are useful but never echo Google response bodies or credentials', async () => {
  await saveWriterProvider(providerConfig());
  const result = await testWriterConnection({ check: credentials => checkGeminiConnection(credentials, async () => new Response(fakeKey, { status: 403 })) });
  assert.equal(result.ok, false); assert.match(result.message, /rejected the key/); assert.ok(!JSON.stringify(result).includes(fakeKey));
  const unsafeFailure = await testWriterConnection({ check: async () => { throw new Error(fakeKey); } });
  assert.equal(unsafeFailure.ok, false); assert.ok(!unsafeFailure.message.includes(fakeKey));
});
test('connection checks respect both daily and monthly request ceilings', async () => {
  await saveWriterProvider(providerConfig());
  const settings = editable(await getWriterSettings()); await updateWriterSettings({ ...settings, monthlyRequestLimit: 2 });
  let checks = 0;
  const check = async () => { checks++; return 'Connection successful.'; };
  await testWriterConnection({ check }); await testWriterConnection({ check });
  await assert.rejects(testWriterConnection({ check }), /Monthly API request limit/); assert.equal(checks, 2);
  await AIWriterMeter.deleteMany({});
  await updateWriterSettings({ ...editable(await getWriterSettings()), monthlyRequestLimit: 90 });
  for (let i = 0; i < 5; i++) await testWriterConnection({ check });
  await assert.rejects(testWriterConnection({ check }), /five connection checks/);
});
test('a changed key cancels unfinished work and cannot inherit a stale successful connection test', async () => {
  const job = await running({ mode: 'auto' });
  await saveWriterProvider(providerConfig());
  assert.equal((await AIWriterJob.findById(job._id)).state, 'cancelled');
  await assert.rejects(testWriterConnection({ check: async () => {
    await saveWriterProvider(providerConfig({ revision: 1, apiKey: 'AIzaSy-a-different-key-for-tests-456789' }));
    return 'Connection successful.';
  } }), /changed during the connection test/);
  assert.equal((await getWriterProviderStatus()).lastTest, null);
});
test('one-click test generation always stays in drafts even when auto-publishing is enabled', async () => {
  const job = await running({ mode: 'auto' }, 'test');
  assert.equal(job.forceDraft, true);
  await processWriterJob(job, 'test-worker', { request: mockProvider(), getSources: async () => sources, makeCover: cover });
  const finished = await request(app).get('/api/ai-writer/jobs/' + job._id).set('Cookie', admin).expect(200);
  assert.equal(finished.body.state, 'draft'); assert.equal(finished.body.article.status, 'draft');
  assert.ok(finished.body.article.slug); assert.equal(finished.body.settings, undefined);
  assert.equal((await Blog.findOne()).publishedAt, null);
});
test('test generation has separate bounded slots and never bypasses pause', async () => {
  await request(app).post('/api/ai-writer/generate-test').set('Cookie', admin).send({ brief: 'Use our instructions.' }).expect(202);
  await request(app).post('/api/ai-writer/generate-test').set('Cookie', admin).send({}).expect(202);
  await request(app).post('/api/ai-writer/generate-test').set('Cookie', admin).send({}).expect(409);
  assert.equal((await AIWriterJob.findOne({ trigger: 'test' })).forceDraft, true);
  await enqueueWriter('normal daily slot still available');
  await pauseWriter(); await assert.rejects(enqueueWriter('', 'test'), /paused/);
});
test('invalid keys/models are rejected without echoing input and lost encryption keys fail closed', async () => {
  await request(app).put('/api/ai-writer/provider').set('Cookie', admin).send(providerConfig({ apiKey: 'bad key with spaces' })).expect(400);
  await request(app).put('/api/ai-writer/provider').set('Cookie', admin).send(providerConfig({ model: '../../private' })).expect(400);
  await saveWriterProvider(providerConfig());
  const original = process.env.GEMINI_WRITER_ENCRYPTION_KEY;
  process.env.GEMINI_WRITER_ENCRYPTION_KEY = Buffer.alloc(32, 8).toString('base64');
  try { await assert.rejects(getWriterCredentials(), /cannot be decrypted/); }
  finally { process.env.GEMINI_WRITER_ENCRYPTION_KEY = original; }
});
test('credential encryption creates a private external master key and does not replace a missing key on decryption', async () => {
  const original = process.env.GEMINI_WRITER_ENCRYPTION_KEY;
  const folder = '/home/ubuntu/.cache/mct-ai-writer-credential-test';
  const filename = folder + '/secret.key';
  delete process.env.GEMINI_WRITER_ENCRYPTION_KEY; process.env.GEMINI_WRITER_SECRET_KEY_FILE = filename;
  await rm(folder, { recursive: true, force: true });
  try {
    await saveWriterProvider(providerConfig());
    assert.equal((await stat(filename)).mode & 0o077, 0); assert.equal((await readFile(filename)).length, 32);
    assert.equal((await getWriterCredentials()).apiKey, fakeKey);
    await rm(filename);
    await assert.rejects(getWriterCredentials(), /cannot be decrypted/);
    await assert.rejects(stat(filename), { code: 'ENOENT' });
  } finally {
    process.env.GEMINI_WRITER_ENCRYPTION_KEY = original; delete process.env.GEMINI_WRITER_SECRET_KEY_FILE;
    await rm(folder, { recursive: true, force: true });
  }
});
test('the writer uses the admin-managed key and never copies it into a job or article', async () => {
  await saveWriterProvider(providerConfig());
  const job = await running(); let calls = 0;
  await processWriterJob(job, 'test-worker', { request: async options => { assert.equal(options.apiKey, fakeKey); calls++; return mockProvider()(options); }, getSources: async () => sources, makeCover: cover });
  assert.equal(calls, 2); assert.equal(await Blog.countDocuments(), 1);
  assert.ok(!JSON.stringify(await AIWriterJob.findById(job._id).lean()).includes(fakeKey));
  assert.ok(!JSON.stringify(await Blog.findOne().lean()).includes(fakeKey));
});
