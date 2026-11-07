export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
export function buildMetaTags({ title, description, url }) {
  let canonical = '';
  if (url.trim()) {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Use an absolute HTTP or HTTPS canonical URL without credentials.');
    canonical = parsed.href;
  }
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    ...(canonical ? [`<meta property="og:url" content="${escapeHtml(canonical)}">`, `<link rel="canonical" href="${escapeHtml(canonical)}">`] : []),
  ].join('\n');
}
