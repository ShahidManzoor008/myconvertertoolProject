import { downloadPublicFile } from './safeDownload.js';
import { plainText } from './blogContent.js';
import { safeSourceUrl } from './aiWriterPolicy.js';

export const publisherFeeds = [
  { url: 'https://openai.com/blog/rss.xml', hosts: ['openai.com', 'www.openai.com'] },
  { url: 'https://blog.google/rss/', hosts: ['blog.google', 'www.blog.google'] },
  { url: 'https://github.blog/feed/', hosts: ['github.blog'] },
];
const text = value => plainText(String(value).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).trim();
const field = (xml, tag) => xml.match(new RegExp(`<${tag}(?:\\s[^>]{0,500})?>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1] || '';

// Only bounded trusted publisher feeds are parsed. We do not expand XML entities
// or load DTDs, and do not crawl article URLs or download full news articles.
export function parsePublisherFeed(xml, feed, now = new Date()) {
  if (Buffer.byteLength(xml) > 2 * 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Unsupported publisher feed.');
  const entries = [...xml.matchAll(/<(?:item|entry)(?:\s[^>]{0,500})?>([\s\S]*?)<\/(?:item|entry)>/gi)].slice(0, 100);
  const articles = [];
  for (const [, entry] of entries) {
    const rawLink = text(field(entry, 'link')) || entry.match(/<link\b[^>]{0,300}\bhref=["']([^"']+)["']/i)?.[1];
    const url = safeSourceUrl(rawLink);
    const published = new Date(text(field(entry, 'pubDate') || field(entry, 'published') || field(entry, 'updated')));
    if (!url || !Number.isFinite(published.getTime()) || now - published < -3600000 || now - published > 72 * 3600000) continue;
    if (!feed.hosts.includes(new URL(url).hostname)) continue;
    const title = text(field(entry, 'title')).slice(0, 200);
    const summary = text(field(entry, 'description') || field(entry, 'summary')).slice(0, 1600);
    if (title.length < 8 || summary.length < 40) continue;
    articles.push({ url, title, publishedAt: published.toISOString(), summary, publisher: new URL(feed.url).hostname });
  }
  return articles;
}
export async function getPublisherSources(signal, download = downloadPublicFile, now = new Date()) {
  const sources = [];
  // Sequential downloads keep memory and outbound work small on this server.
  for (const feed of publisherFeeds) {
    if (signal.aborted) throw new Error('Source research cancelled.');
    try {
      const bytes = await download(feed.url, { allowedDomains: feed.hosts, maxBytes: 2 * 1024 * 1024, httpsOnly: true, signal });
      sources.push(...parsePublisherFeed(bytes.toString('utf8'), feed, now));
    } catch { /* Another publisher can still provide current primary evidence. */ }
  }
  return [...new Map(sources.map(source => [source.url, source])).values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 40);
}
