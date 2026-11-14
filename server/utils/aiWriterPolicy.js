import { z } from 'zod';
import { isIP } from 'node:net';
import { createHash } from 'node:crypto';

export const writerSettingsInput = z.object({
  enabled: z.boolean(), paused: z.boolean(), mode: z.enum(['draft', 'auto']),
  articlesPerDay: z.number().int().min(1).max(3),
  timezone: z.string().max(80).refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }, 'Choose a valid IANA timezone.'),
  hour: z.number().int().min(0).max(23),
  topics: z.string().trim().min(3).max(2000),
  instructions: z.string().trim().max(12000),
  excludedTopics: z.string().trim().max(2000),
  primaryDomains: z.array(z.string().trim().toLowerCase().regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/)).min(1).max(30),
  monthlyRequestLimit: z.number().int().min(2).max(1000),
  revision: z.number().int().nonnegative(),
}).strict();
export const briefInput = z.object({ brief: z.string().trim().max(6000).default('') }).strict();
export function localClock(now, timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(part => [part.type, part.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}
export function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || isIP(url.hostname) || !url.hostname.includes('.') || /(?:^|\.)(localhost|local|internal|test|invalid)$/.test(url.hostname)) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|gclid|fbclid)/.test(key)) url.searchParams.delete(key);
    return url.href;
  } catch { return null; }
}
export const domainMatches = (url, domains) => {
  const host = new URL(url).hostname;
  return domains.some(domain => host === domain || host.endsWith('.' + domain));
};
export const topicFingerprint = text => createHash('sha256').update(text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()).digest('hex');
export const parseWriterJson = text => JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));

export const articleInput = z.object({
  title: z.string().trim().min(15).max(160),
  excerpt: z.string().trim().min(60).max(190),
  content: z.string().min(500).max(40000),
  category: z.enum(['AI', 'Technology', 'Developer', 'Productivity']),
  tags: z.array(z.string().trim().min(1).max(40)).min(1).max(6),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  topic: z.string().trim().min(10).max(200),
  sourceUrls: z.array(z.string().url()).min(1).max(5),
}).strict();

export function assessArticle(article, sources, settings, now = new Date()) {
  const issues = [];
  const age = now.getTime() - new Date(article.eventDate + 'T00:00:00Z').getTime();
  if (!Number.isFinite(age) || age < -86400000 || age > 72 * 3600000) issues.push('The event is not clearly within the last 72 hours.');
  if (!sources.length) issues.push('No current publisher source is available.');
  if (!sources.some(source => domainMatches(source.url, settings.primaryDomains))) issues.push('No publisher source matches the configured primary-source domains.');
  if ((article.content.match(/^## /gm) || []).length < 3) issues.push('Add at least three useful sections with H2 headings.');
  if (/^# /m.test(article.content)) issues.push('The body must start with H2 sections; the title is already H1.');
  if (/\b(?:I tested|we tested|hands-on testing|guaranteed rankings|rank #1)\b/i.test(article.content)) issues.push('Unsupported testing or ranking claims need human review.');
  if (/<\/?(?:script|iframe|style|html)\b/i.test(article.content)) issues.push('Embedded HTML needs review.');
  const permitted = new Set(sources.map(source => safeSourceUrl(source.url)));
  const links = [...article.content.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)].map(match => match[1]);
  if (links.some(link => !permitted.has(safeSourceUrl(link)))) issues.push('The article contains a link outside its supplied sources.');
  if (!links.some(link => permitted.has(safeSourceUrl(link)))) issues.push('The article needs inline source citations.');
  const normalize = value => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const body = normalize(article.content);
  for (const source of sources) {
    const words = normalize(source.summary || '').split(' ');
    if (words.length >= 25 && words.some((_, index) => index + 25 <= words.length && body.includes(words.slice(index, index + 25).join(' ')))) {
      issues.push('A long passage matches publisher wording. Rewrite it in original language.'); break;
    }
  }
  return issues;
}
