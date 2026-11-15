import { createHash } from 'node:crypto';
import { z } from 'zod';
import { AIWriterMeter } from '../models/AIWriter.js';
import { apiKeyInput, getWriterCredentials } from './aiWriterCredentials.js';
import { listGeminiModels, GeminiConnectionError } from './geminiWriter.js';
import { getWriterSettings, reserveWriterRequest } from './aiWriterService.js';

export const modelsInput = z.object({ apiKey: apiKeyInput.optional(), refresh: z.boolean().default(false) }).strict();
const cache = new Map(), pending = new Map();
const ttl = 10 * 60000;
export const clearWriterModelCache = () => { cache.clear(); pending.clear(); };
export async function discoverWriterModels(body, { list = listGeminiModels } = {}) {
  const input = modelsInput.parse(body);
  const apiKey = input.apiKey || (await getWriterCredentials()).apiKey;
  if (!apiKey) throw Object.assign(new Error('Enter an API key or save a connection before loading models.'), { status: 400 });
  const digest = createHash('sha256').update(apiKey).digest('hex');
  const previous = cache.get(digest);
  if (!input.refresh && previous && Date.now() - previous.savedAt < ttl) return { ...previous.result, fromCache: true };
  if (pending.has(digest)) return pending.get(digest);
  if (pending.size >= 2) throw Object.assign(new Error('Models are already being loaded. Try again shortly.'), { status: 429 });
  const work = (async () => {
    const id = 'models:' + new Date().toISOString().slice(0, 10);
    try { await AIWriterMeter.updateOne({ _id: id }, { $setOnInsert: { requests: 0, expiresAt: new Date(Date.now() + 7 * 86400000) } }, { upsert: true }); } catch (error) { if (error.code !== 11000) throw error; }
    if (!await AIWriterMeter.findOneAndUpdate({ _id: id, requests: { $lt: 20 } }, { $inc: { requests: 1 } })) throw Object.assign(new Error('The limit of 20 model-list refreshes per UTC day has been reached. The cached list remains available.'), { status: 429 });
    const settings = await getWriterSettings();
    let models;
    try { models = await list({ apiKey, beforeRequest: () => reserveWriterRequest(settings) }); }
    catch (error) { throw Object.assign(new Error(error instanceof GeminiConnectionError || error.status ? error.message : 'Could not load Google models. Try again later.'), { status: error.status || 400 }); }
    const result = { models, fetchedAt: new Date().toISOString(), fromCache: false, source: 'google', compatibleCount: models.filter(model => model.compatible).length };
    if (cache.size >= 8) cache.delete(cache.keys().next().value);
    cache.set(digest, { result, savedAt: Date.now() });
    return result;
  })();
  pending.set(digest, work);
  try { return await work; } finally { pending.delete(digest); }
}
