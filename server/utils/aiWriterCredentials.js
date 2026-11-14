import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, open } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { AIWriterProvider } from '../models/AIWriter.js';

const modelPattern = /^gemini-[a-z0-9.-]+$/;
const fingerprint = key => key ? createHash('sha256').update(key).digest('hex').slice(0, 8) : '';
const problem = (message, status = 400) => Object.assign(new Error(message), { status });
const aad = Buffer.from('myconvertertool:gemini:v1');
export const providerInput = z.object({
  apiKey: z.string().trim().max(200).refine(value => value === '' || /^[A-Za-z0-9_-]{20,200}$/.test(value), 'Enter a valid Gemini API key.').optional(),
  model: z.string().trim().max(100).regex(modelPattern, 'Enter a Gemini model ID, for example gemini-2.5-flash.'),
  billingMode: z.enum(['free', 'paid']), requestsEnabled: z.boolean(), revision: z.number().int().nonnegative(),
}).strict();

async function encryptionKey(create = false) {
  if (process.env.GEMINI_WRITER_ENCRYPTION_KEY) {
    const key = Buffer.from(process.env.GEMINI_WRITER_ENCRYPTION_KEY, 'base64');
    if (key.length !== 32) throw problem('The server encryption key must decode to 32 bytes. Contact the server operator.', 503);
    return key;
  }
  const filename = process.env.GEMINI_WRITER_SECRET_KEY_FILE || path.join(homedir(), '.local/state/myconvertertool-secrets/gemini-writer.key');
  if (create) await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  try { if (create) {
    const file = await open(filename, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    try { await file.writeFile(randomBytes(32)); await file.sync(); } finally { await file.close(); }
  } } catch (error) { if (error.code !== 'EEXIST') throw problem('The server could not create secure credential storage. Contact the server operator.', 503); }
  const file = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await file.stat();
    if (!info.isFile() || (info.mode & 0o077) || (process.getuid && info.uid !== process.getuid()) || info.size !== 32) throw problem('The server credential encryption file is missing or has unsafe permissions. Contact the server operator.', 503);
    return await file.readFile();
  } finally { await file.close(); }
}
async function encrypt(key) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', await encryptionKey(true), iv);
  cipher.setAAD(aad);
  const encrypted = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}
async function decrypt(value) {
  try {
    const [version, iv, tag, bytes] = value.split('.');
    if (version !== 'v1') throw new Error('version');
    const cipher = createDecipheriv('aes-256-gcm', await encryptionKey(), Buffer.from(iv, 'base64url'));
    cipher.setAAD(aad); cipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([cipher.update(Buffer.from(bytes, 'base64url')), cipher.final()]).toString('utf8');
  } catch { throw problem('The saved Gemini key cannot be decrypted. Restore the server encryption key or replace the API key.', 503); }
}

function environmentProvider() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  return { apiKey, keyFingerprint: fingerprint(apiKey), model: process.env.GEMINI_WRITER_MODEL || '', billingMode: process.env.GEMINI_WRITER_BILLING_MODE || 'free', requestsEnabled: process.env.AI_WRITER_ALLOW_REQUESTS === 'true', revision: 0, source: apiKey ? 'environment' : 'none' };
}
export async function getWriterCredentials() {
  const stored = await AIWriterProvider.findById('gemini').select('+encryptedKey').lean();
  const provider = stored ? { ...stored, apiKey: stored.encryptedKey ? await decrypt(stored.encryptedKey) : '', source: 'admin' } : environmentProvider();
  if (provider.apiKey && !/^[A-Za-z0-9_-]+$/.test(provider.apiKey)) throw problem('The configured Gemini API key has an invalid format. Replace it in the admin panel.');
  return provider;
}
export async function getWriterProviderStatus() {
  const stored = await AIWriterProvider.findById('gemini').lean();
  const provider = stored ? { ...stored, source: 'admin' } : environmentProvider();
  const keyConfigured = Boolean(provider.keyFingerprint);
  const canTest = keyConfigured && modelPattern.test(provider.model);
  const configured = canTest && provider.requestsEnabled && ['free', 'paid'].includes(provider.billingMode);
  return {
    configured, canTest, keyConfigured, keyFingerprint: provider.keyFingerprint || '', model: provider.model || '',
    billingMode: provider.billingMode, requestsEnabled: Boolean(provider.requestsEnabled), revision: provider.revision,
    source: provider.source, lastTest: provider.lastTest || null,
    message: configured ? 'Gemini is configured. Research uses official publisher feeds.' : keyConfigured ? 'A key is saved. Set a model and allow API writing to generate articles.' : 'Add your Gemini API key and model below to connect the writer.',
  };
}

// These mutations run inside the service's writer-control lock.
export async function storeWriterProvider(input) {
  const previous = await AIWriterProvider.findById('gemini').select('+encryptedKey').lean();
  if ((previous?.revision || 0) !== input.revision) throw problem('Gemini settings changed in another tab. Reload before saving.', 409);
  let encryptedKey = previous?.encryptedKey || '', keyFingerprint = previous?.keyFingerprint || '';
  const newKey = input.apiKey || (!previous ? environmentProvider().apiKey : '');
  if (newKey) { encryptedKey = await encrypt(newKey); keyFingerprint = fingerprint(newKey); }
  if (!encryptedKey) throw problem('Enter a Gemini API key before saving the connection.');
  const value = { encryptedKey, keyFingerprint, model: input.model, billingMode: input.billingMode, requestsEnabled: input.requestsEnabled, revision: input.revision + 1 };
  await AIWriterProvider.updateOne({ _id: 'gemini' }, { $set: value, $unset: { lastTest: 1 } }, { upsert: true });
}
export async function disconnectWriterProvider(revision) {
  const previous = await AIWriterProvider.findById('gemini').lean();
  if ((previous?.revision || 0) !== revision) throw problem('Gemini settings changed in another tab. Reload before disconnecting.', 409);
  await AIWriterProvider.updateOne({ _id: 'gemini' }, { $set: { encryptedKey: '', keyFingerprint: '', requestsEnabled: false, model: previous?.model || environmentProvider().model, billingMode: previous?.billingMode || 'free', revision: revision + 1 }, $unset: { lastTest: 1 } }, { upsert: true });
}
