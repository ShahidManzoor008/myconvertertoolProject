const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export function renderAIAttribution(ai) {
  if (!ai?.generationId) return '';
  const sources = (ai.sources || []).map(source => `<li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.title)}</a></li>`).join('');
  return `<section aria-label="Article sources"><p>This article was created with AI assistance using official publisher sources. Check the original sources for the latest details.</p>${sources ? `<h2>Sources</h2><ul>${sources}</ul>` : ''}</section>`;
}
