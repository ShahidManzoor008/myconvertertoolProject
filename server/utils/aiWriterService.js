import { randomUUID, createHash } from 'node:crypto';
import slugify from 'slugify';
import sharp from 'sharp';
import { AIWriterSettings, AIWriterJob, AIWriterMeter, AIWriterLock } from '../models/AIWriter.js';
import Blog from '../models/Blog.js';
import { withBlogWrite } from '../controllers/blogController.js';
import { imageReferences, storeBlogImage } from './blogMedia.js';
import { renderBlogContent } from './blogContent.js';
import { escapeHtml } from './pageSeo.js';
import { assessArticle, articleInput, localClock, topicFingerprint, writerSettingsInput } from './aiWriterPolicy.js';
import { geminiRequest, generationPrompt, parseWriterJson, reviewPrompt, checkGeminiConnection, GeminiConnectionError } from './geminiWriter.js';
import { getWriterCredentials, getWriterProviderStatus, storeWriterProvider, disconnectWriterProvider, providerInput } from './aiWriterCredentials.js';
import { AIWriterProvider } from '../models/AIWriter.js';
import { getPublisherSources } from './aiWriterSources.js';

const active = new Map();
const expires = () => new Date(Date.now() + 30 * 86400000);
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
export const getWriterSettings = async () => await AIWriterSettings.findById('writer').lean() || AIWriterSettings.findOneAndUpdate({ _id: 'writer' }, { $setOnInsert: { _id: 'writer' } }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }).lean();

async function initLock(id) {
  try { await AIWriterLock.updateOne({ _id: id }, { $setOnInsert: { until: new Date(0), owner: '' } }, { upsert: true }); } catch (error) { if (error.code !== 11000) throw error; }
}
async function claimLock(id, owner, milliseconds) {
  await initLock(id);
  return AIWriterLock.findOneAndUpdate({ _id: id, until: { $lte: new Date() } }, { $set: { owner, until: new Date(Date.now() + milliseconds) } }, { returnDocument: 'after' }).lean();
}
// Short cross-process critical section shared by admin controls and publication.
async function control(action) {
  return withBlogWrite(async () => {
    const owner = randomUUID();
    if (!await claimLock('writer-control', owner, 60000)) throw fail('Writer controls are busy. Try again shortly.', 409);
    try { return await action(); }
    finally { await AIWriterLock.updateOne({ _id: 'writer-control', owner }, { $set: { until: new Date(0) } }); }
  });
}
export async function updateWriterSettings(body) {
  const input = writerSettingsInput.parse(body);
  if (input.enabled && !(await getWriterProviderStatus()).configured) throw fail('Save a Gemini key, model and API writing permission before enabling the schedule.');
  return control(async () => {
    await getWriterSettings();
    const { revision, ...values } = input;
    const settings = await AIWriterSettings.findOneAndUpdate({ _id: 'writer', revision }, { $set: values, $inc: { revision: 1 } }, { returnDocument: 'after' }).lean();
    if (!settings) throw fail('Settings changed in another tab. Reload before saving.', 409);
    await AIWriterJob.updateMany({ state: { $in: ['queued', 'running'] } }, { $set: { state: 'cancelled', completedAt: new Date(), expiresAt: expires(), reasons: ['Admin settings changed. Generate again with the updated guidance.'] } });
    for (const controller of active.values()) controller.abort();
    return settings;
  });
}
export async function pauseWriter() {
  return control(async () => {
    await getWriterSettings();
    const settings = await AIWriterSettings.findByIdAndUpdate('writer', { $set: { paused: true }, $inc: { revision: 1 } }, { returnDocument: 'after' }).lean();
    await AIWriterJob.updateMany({ state: { $in: ['queued', 'running'] } }, { $set: { state: 'cancelled', completedAt: new Date(), expiresAt: expires(), reasons: ['Paused by admin.'] } });
    for (const controller of active.values()) controller.abort();
    return settings;
  });
}
async function invalidateConnectionWork() {
  await getWriterSettings();
  await AIWriterSettings.updateOne({ _id: 'writer' }, { $set: { enabled: false }, $inc: { revision: 1 } });
  await AIWriterJob.updateMany({ state: { $in: ['queued', 'running'] } }, { $set: { state: 'cancelled', completedAt: new Date(), expiresAt: expires(), reasons: ['Gemini connection changed. Generate again using the new connection.'] } });
  for (const controller of active.values()) controller.abort();
}
export async function saveWriterProvider(body) {
  const input = providerInput.parse(body);
  return control(async () => {
    await storeWriterProvider(input);
    await invalidateConnectionWork();
    return getWriterProviderStatus();
  });
}
export async function removeWriterProvider(revision) {
  return control(async () => {
    await disconnectWriterProvider(revision);
    await invalidateConnectionWork();
    return getWriterProviderStatus();
  });
}
export async function testWriterConnection({ check = checkGeminiConnection } = {}) {
  const credentials = await getWriterCredentials();
  if (!credentials.apiKey || !credentials.model) throw fail('Save an API key and model before testing the connection.');
  const day = new Date().toISOString().slice(0, 10), id = `connection:${day}`;
  try { await AIWriterMeter.updateOne({ _id: id }, { $setOnInsert: { requests: 0, expiresAt: new Date(Date.now() + 7 * 86400000) } }, { upsert: true }); } catch (error) { if (error.code !== 11000) throw error; }
  if (!await AIWriterMeter.findOneAndUpdate({ _id: id, requests: { $lt: 5 } }, { $inc: { requests: 1 } })) throw fail('The limit of five connection checks per UTC day has been reached.', 429);
  await reserveWriterRequest(await getWriterSettings());
  const start = Date.now(); let result;
  try { result = { ok: true, message: await check(credentials) }; }
  catch (error) { result = { ok: false, message: error instanceof GeminiConnectionError ? error.message : 'Connection failed. Check the Gemini key, model, API restrictions and Google quota, then try again.' }; }
  result = { ...result, checkedAt: new Date(), latencyMs: Date.now() - start };
  const latest = await getWriterProviderStatus();
  if (latest.source !== credentials.source || latest.revision !== credentials.revision) throw fail('Gemini settings changed during the connection test. Test the current connection again.', 409);
  if (credentials.source === 'admin') {
    const stored = await AIWriterProvider.updateOne({ _id: 'gemini', revision: credentials.revision }, { $set: { lastTest: result } });
    if (!stored.matchedCount) throw fail('Gemini settings changed during the connection test. Test the current connection again.', 409);
  }
  return result;
}
export async function enqueueWriter(brief = '', trigger = 'manual', expectedRevision) {
  return control(async () => {
    const provider = await getWriterProviderStatus();
    if (!provider.configured) throw fail(provider.message);
    const settings = await getWriterSettings();
    if (settings.paused) throw fail('Writer is paused. Resume it in settings first.');
    if (trigger === 'schedule' && (!settings.enabled || settings.revision !== expectedRevision)) return null;
    const { day } = localClock(new Date(), settings.timezone);
    // Global UTC ceiling also prevents timezone changes bypassing daily limits.
    const utcStart = new Date(new Date().toISOString().slice(0, 10));
    const testing = trigger === 'test';
    if (await AIWriterJob.countDocuments({ createdAt: { $gte: utcStart }, trigger: testing ? 'test' : { $ne: 'test' } }) >= (testing ? 2 : 3)) throw fail(testing ? 'The limit of two test blog attempts per UTC day has been reached.' : 'The maximum of three generation attempts per UTC day has been reached.', 409);
    for (let slot = 1; slot <= (testing ? 2 : settings.articlesPerDay); slot++) {
      const key = testing ? `test:${utcStart.toISOString().slice(0, 10)}:${slot}` : `${day}:${slot}`;
      try { return await AIWriterJob.create({ key, day, slot, trigger, brief, settings, forceDraft: testing, providerVersion: `${provider.source}:${provider.revision}` }); }
      catch (error) { if (error.code !== 11000) throw error; }
    }
    throw fail('Today’s generation slots are already used. Failed or cancelled attempts also consume a slot to bound API usage.', 409);
  });
}
export async function cancelWriterJob(id) {
  return control(async () => {
    const job = await AIWriterJob.findOneAndUpdate({ _id: id, state: { $in: ['queued', 'running'] } }, { $set: { state: 'cancelled', reasons: ['Cancelled by admin.'], completedAt: new Date(), expiresAt: expires() } }, { returnDocument: 'after' }).lean();
    if (!job) throw fail('This run has already finished or does not exist.', 409);
    active.get(String(id))?.abort(); return job;
  });
}

async function assertCurrent(job, owner) {
  const [settings, current, lock, provider] = await Promise.all([
    AIWriterSettings.findById('writer').lean(), AIWriterJob.findById(job._id).lean(),
    AIWriterLock.exists({ _id: 'writer-worker', owner, until: { $gt: new Date() } }),
    getWriterProviderStatus(),
  ]);
  if (!lock || current?.owner !== owner || current.state !== 'running' || settings?.paused || settings?.revision !== job.settings.revision || !provider.configured || (job.providerVersion && job.providerVersion !== `${provider.source}:${provider.revision}`)) throw fail('Run cancelled or its instructions/connection changed. No publication was made.', 409);
  return settings;
}
export async function reserveWriterRequest(settings, jobId) {
  const month = new Date().toISOString().slice(0, 7), id = `month:${month}`;
  try { await AIWriterMeter.updateOne({ _id: id }, { $setOnInsert: { requests: 0, expiresAt: new Date(Date.now() + 100 * 86400000) } }, { upsert: true }); } catch (error) { if (error.code !== 11000) throw error; }
  const configuredLimit = Number(process.env.GEMINI_WRITER_MAX_MONTHLY_REQUESTS || 90);
  const limit = Math.min(settings.monthlyRequestLimit, Number.isInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : 90);
  if (!await AIWriterMeter.findOneAndUpdate({ _id: id, requests: { $lt: limit } }, { $inc: { requests: 1, ...(!jobId ? { metadataRequests: 1 } : {}) } })) throw fail('Monthly API request limit reached. Raise the limit deliberately or wait until next month.');
  if (jobId) await AIWriterJob.updateOne({ _id: jobId }, { $inc: { 'usage.requests': 1 } });
  return id;
}
function similarTopic(title, recent) {
  const tokens = value => new Set(value.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []);
  const a = tokens(title);
  return recent.some(value => { const b = tokens(value); const shared = [...a].filter(word => b.has(word)).length; return shared / Math.max(1, Math.min(a.size, b.size)) >= 0.8; });
}
async function coverImage(category) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="bg"><stop stop-color="#0f172a"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs><rect width="1280" height="720" fill="url(#bg)"/><circle cx="1100" cy="120" r="300" fill="#38bdf8" opacity=".12"/><text x="80" y="140" font-size="34" font-family="sans-serif" fill="#93c5fd">MyConverterTool</text><text x="80" y="370" font-size="90" font-family="sans-serif" font-weight="bold" fill="white">${escapeHtml(category)}</text><text x="80" y="470" font-size="36" font-family="sans-serif" fill="#cbd5e1">News, ideas and practical insights</text></svg>`;
  return storeBlogImage(await sharp(Buffer.from(svg)).png().toBuffer());
}

export async function processWriterJob(job, owner, { request = geminiRequest, getSources = getPublisherSources, makeCover = coverImage } = {}) {
  const controller = new AbortController(); active.set(String(job._id), controller);
  let model = '', credentials;
  const call = async (prompt, writing = false) => {
    await assertCurrent(job, owner);
    const meterId = await reserveWriterRequest(job.settings, job._id);
    const period = new Date().toISOString().slice(0, 7), digest = createHash('sha256').update(credentials.apiKey).digest('hex');
    const modelMeterId = `generation:${period}:${digest}:${model}`;
    await AIWriterMeter.updateOne({ _id: modelMeterId }, { $setOnInsert: { expiresAt: new Date(Date.now() + 100 * 86400000) }, $set: { kind: 'generation', model, period, keyFingerprint: digest.slice(0, 8), lastRequestAt: new Date() }, $inc: { requests: 1 } }, { upsert: true });
    const recordUsage = async details => {
      const usage = Object.fromEntries(['tokens', 'promptTokens', 'outputTokens', 'thinkingTokens', 'cachedTokens', 'detailedRequests'].map(field => [field, Number.isFinite(Number(details?.[field])) ? Math.max(0, Number(details[field])) : 0]));
      await AIWriterMeter.updateOne({ _id: meterId }, { $inc: usage });
      await AIWriterMeter.updateOne({ _id: modelMeterId }, { $inc: usage });
      await AIWriterJob.updateOne({ _id: job._id, owner }, { $inc: Object.fromEntries(Object.entries(usage).map(([field, count]) => ['usage.' + field, count])) });
    };
    let result;
    try { result = await request({ prompt, writing, signal: controller.signal, model, apiKey: credentials.apiKey }); }
    catch (error) {
      if (error.usage) await recordUsage(error.usage);
      await AIWriterMeter.updateOne({ _id: modelMeterId }, { $inc: { failures: 1, rateLimited: error.httpStatus === 429 ? 1 : 0 }, $set: { lastHttpStatus: error.httpStatus || 0 } });
      throw error;
    }
    await recordUsage(result.usage);
    await AIWriterMeter.updateOne({ _id: modelMeterId }, { $set: { lastHttpStatus: 200 } });
    return result;
  };
  try {
    credentials = await getWriterCredentials(); model = credentials.model;
    const recentPosts = await Blog.find().sort({ createdAt: -1 }).limit(150).select('title aiWriter.topicKey aiWriter.sources').lean();
    const recent = recentPosts.map(post => post.title);
    await assertCurrent(job, owner);
    const usedSources = new Set(recentPosts.flatMap(post => (post.aiWriter?.sources || []).map(source => source.url)));
    const available = (await getSources(controller.signal)).filter(source => !usedSources.has(source.url));
    if (!available.length) throw fail('No unused recent publisher briefs are available. No Google request was made.');
    const result = await call(generationPrompt(job.settings, job.brief, recent, new Date(), available), true);
    const parsed = parseWriterJson(result.text);
    if (parsed.skip) throw fail(String(parsed.skip).slice(0, 400));
    const article = articleInput.parse(parsed);
    if (article.sourceUrls.some(url => !available.some(source => source.url === url))) throw fail('The writer cited a source outside the publisher evidence. Nothing was published.');
    const sources = available.filter(source => article.sourceUrls.includes(source.url));
    const topicKey = topicFingerprint(article.topic);
    if (recentPosts.some(post => post.aiWriter?.topicKey === topicKey) || similarTopic(article.title, recent)) throw fail('This topic appears to repeat an existing article. No duplicate was created.');
    const reasons = assessArticle(article, sources, job.settings);
    const review = parseWriterJson((await call(reviewPrompt(article, sources, { topics: job.settings.topics, excludedTopics: job.settings.excludedTopics, saved: job.settings.instructions, brief: job.brief }))).text);
    if (review.pass !== true || !Array.isArray(review.issues)) reasons.push('Editorial review did not approve this draft.');
    if (Array.isArray(review.issues)) reasons.push(...review.issues.slice(0, 10).map(value => String(value).slice(0, 400)));
    await assertCurrent(job, owner);
    const image = await makeCover(article.category);
    const rendered = await renderBlogContent(article.content, 'markdown');
    return await control(async () => {
      const settings = await assertCurrent(job, owner);
      const state = !job.forceDraft && settings.mode === 'auto' && !reasons.length ? 'published' : 'draft';
      const post = new Blog({ title: article.title, content: article.content, excerpt: article.excerpt,
        category: article.category, tags: article.tags, author: 'MyConverterTool Team', authorType: 'Organization', contentFormat: 'markdown', status: state,
        slug: `${slugify(article.title, { lower: true, strict: true }).slice(0, 150) || 'technology'}-${job._id.toString().slice(-8)}`,
        coverImage: image.url, coverThumbnail: image.thumbnail, coverWidth: image.width, coverHeight: image.height, coverThumbnailWidth: image.thumbnailWidth,
        coverAlt: `${article.category} news and insights from MyConverterTool`, readingTime: rendered.readingTime,
        revision: 1, publishedAt: state === 'published' ? new Date() : null,
        aiWriter: { generationId: String(job._id), topicKey, eventDate: article.eventDate, sources: sources.map(({ url, title, publishedAt }) => ({ url, title, publishedAt })),
          model, generatedAt: new Date() },
      });
      post.imageFiles = imageReferences(post);
      await post.save();
      await AIWriterJob.updateOne({ _id: job._id, owner, state: 'running' }, { $set: { state, article: post._id, topicKey, model, reasons: [...new Set(reasons)], completedAt: new Date(), expiresAt: expires() } });
      return post;
    });
  } catch (error) {
    // Recover a crash/connection error after an article save without regenerating.
    const saved = await Blog.findOne({ 'aiWriter.generationId': String(job._id) }).select('_id status').lean();
    const message = error.code === 11000 ? 'This topic already has an article. No duplicate was created.' : (error.name === 'ZodError' ? 'Google returned incomplete article fields. Nothing was published.' : (error.name === 'SyntaxError' ? 'Google returned invalid JSON. Nothing was published.' : (controller.signal.aborted ? 'Cancelled by admin.' : String(error.message).slice(0, 400))));
    await AIWriterJob.updateOne({ _id: job._id, owner, state: 'running' }, { $set: { state: saved ? (saved.status === 'published' ? 'published' : 'draft') : 'failed', article: saved?._id, model, reasons: saved ? ['Recovered saved article.'] : [message], completedAt: new Date(), expiresAt: expires() } });
  } finally { active.delete(String(job._id)); }
}

let ticking = false;
export async function writerTick({ processJob = processWriterJob } = {}) {
  if (ticking) return;
  ticking = true; const owner = randomUUID(); let lock;
  try {
    if (!(await getWriterProviderStatus()).configured) return;
    lock = await claimLock('writer-worker', owner, 10 * 60000);
    if (!lock) return;
    // A prior worker may have died after saving: recover it without another call.
    for (const abandoned of await AIWriterJob.find({ state: 'running' }).limit(10).lean()) {
      const post = await Blog.findOne({ 'aiWriter.generationId': String(abandoned._id) }).select('_id status').lean();
      await AIWriterJob.updateOne({ _id: abandoned._id, state: 'running' }, { $set: { state: post ? (post.status === 'published' ? 'published' : 'draft') : 'failed', article: post?._id, reasons: [post ? 'Recovered saved article after restart.' : 'Worker stopped before completion. No automatic retry was made.'], completedAt: new Date(), expiresAt: expires() } });
    }
    const settings = await getWriterSettings();
    if (settings.paused) return;
    const clock = localClock(new Date(), settings.timezone);
    await AIWriterJob.updateMany({ state: 'queued', day: { $ne: clock.day } }, { $set: { state: 'cancelled', reasons: ['A previous day was missed. Old work is not backfilled.'], completedAt: new Date(), expiresAt: expires() } });
    if (settings.enabled && clock.hour >= settings.hour) {
      try { await enqueueWriter('', 'schedule', settings.revision); } catch (error) { if (error.status !== 409) throw error; }
    }
    const job = await AIWriterJob.findOneAndUpdate({ state: 'queued' }, { $set: { state: 'running', owner, leaseUntil: lock.until }, $inc: { attempts: 1 } }, { sort: { createdAt: 1 }, returnDocument: 'after' }).lean();
    if (job) await processJob(job, owner);
  } finally {
    if (lock) await AIWriterLock.updateOne({ _id: 'writer-worker', owner }, { $set: { until: new Date(0) } });
    ticking = false;
  }
}
export function startWriterScheduler(logger, { isActive = () => true } = {}) {
  const tick = () => {
    if (!isActive()) return;
    return writerTick().catch(() => logger.warn('AI Writer scheduler could not finish its check. Check database connectivity and writer history.'));
  };
  const timer = setInterval(tick, 60000); timer.unref();
  tick();
  return () => { clearInterval(timer); for (const controller of active.values()) controller.abort(); };
}
