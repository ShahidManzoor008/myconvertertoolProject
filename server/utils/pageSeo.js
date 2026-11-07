import sanitizeHtml from 'sanitize-html';
import { presentPost } from './blogPresentation.js';
import markdownIt from 'markdown-it';
const SITE = 'https://myconvertertool.com';
const markdown = markdownIt({ html: false });
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
export const safeImageUrl = value => {
  try { const url = new URL(value || '/assets/og-default.png', SITE); return ['http:', 'https:'].includes(url.protocol) ? url.href : SITE + '/assets/og-default.png'; }
  catch { return SITE + '/assets/og-default.png'; }
};
export function renderPageHtml(template, { title, description, pathname, robots = 'index, follow', image, type = 'website', schema, content }) {
  const canonical = SITE + pathname;
  const metadata = `<title data-initial-seo="true">${escapeHtml(title)}</title>
<meta data-initial-seo="true" name="description" content="${escapeHtml(description)}">
<meta data-initial-seo="true" name="robots" content="${robots}">
<link data-initial-seo="true" rel="canonical" href="${escapeHtml(canonical)}">
<meta data-initial-seo="true" property="og:site_name" content="MyConverterTool">
<meta data-initial-seo="true" property="og:title" content="${escapeHtml(title)}">
<meta data-initial-seo="true" property="og:description" content="${escapeHtml(description)}">
<meta data-initial-seo="true" property="og:url" content="${escapeHtml(canonical)}">
<meta data-initial-seo="true" property="og:type" content="${type}">
<meta data-initial-seo="true" property="og:image" content="${escapeHtml(safeImageUrl(image))}">
<meta data-initial-seo="true" name="twitter:card" content="summary_large_image">
<meta data-initial-seo="true" name="twitter:title" content="${escapeHtml(title)}">
<meta data-initial-seo="true" name="twitter:description" content="${escapeHtml(description)}">
<meta data-initial-seo="true" name="twitter:image" content="${escapeHtml(safeImageUrl(image))}">
${schema ? `<script data-initial-seo="true" type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}`;
  let html = template.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<(meta|link)\b[^>]*data-(?:rh|initial-seo)="true"[^>]*>/gi, '')
    .replace(/<script\b[^>]*data-(?:rh|initial-seo)="true"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', metadata + '</head>');
  if (content) html = html.replace(/<!--route-content-->[\s\S]*?<!--\/route-content-->/, `<!--route-content-->${content}<!--/route-content-->`);
  return html;
}
export function renderArticleHtml(template, post) {
  post = presentPost(post);
  const pathname = '/blog/' + encodeURIComponent(post.slug);
  const source = /<[a-z][\s\S]*>/i.test(post.content) ? post.content : markdown.render(post.content);
  const content = sanitizeHtml(source, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: { a: ['href', 'title', 'rel'], img: ['src', 'alt', 'width', 'height', 'loading'] },
    allowedSchemes: ['http', 'https', 'mailto'], allowProtocolRelative: false,
    transformTags: { h1: 'h2' },
  });
  return renderPageHtml(template, {
    title: `${post.title} | MyConverterTool`, description: post.excerpt, pathname, image: post.coverImage, type: 'article',
    schema: { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt,
      image: safeImageUrl(post.coverImage), datePublished: post.createdAt, dateModified: post.updatedAt || post.createdAt,
      author: { '@type': 'Person', name: post.author }, publisher: { '@type': 'Organization', name: 'MyConverterTool',
        logo: { '@type': 'ImageObject', url: SITE + '/assets/MyConverterTool.png' } }, mainEntityOfPage: SITE + pathname },
    content: `<article class="mx-auto max-w-3xl py-12"><h1>${escapeHtml(post.title)}</h1><p class="my-6 text-lg">${escapeHtml(post.excerpt)}</p><div class="article-body">${content}</div></article>`,
  });
}
export function makeSitemap(routes, posts = []) {
  const entries = routes.map(route => `<url><loc>${SITE}${escapeHtml(route.path)}</loc></url>`);
  for (const post of posts) {
    const date = post.updatedAt && !isNaN(new Date(post.updatedAt)) ? `<lastmod>${new Date(post.updatedAt).toISOString().slice(0,10)}</lastmod>` : '';
    entries.push(`<url><loc>${SITE}/blog/${escapeHtml(encodeURIComponent(post.slug))}</loc>${date}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`;
}
