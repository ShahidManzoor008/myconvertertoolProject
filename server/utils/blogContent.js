import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import markdownMath from './markdownMath.js';

const md = new MarkdownIt({ html: false, linkify: true }).use(markdownMath);
export const cleanBlogHtml = source => sanitizeHtml(source, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption', 's', 'del']),
  allowedAttributes: { '*': ['id'], a: ['href', 'title', 'rel'], img: ['src', 'alt', 'width', 'height', 'loading', 'class'], code: ['class'] },
  allowedClasses: { img: ['equation', 'equation-block'] },
  allowedSchemes: ['http', 'https', 'mailto'], allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowProtocolRelative: false,
  transformTags: { h1: 'h2', a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }) },
});
export const plainText = value => md.utils.unescapeAll(sanitizeHtml(String(value || ''), { allowedTags: [], allowedAttributes: {} }))
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/[`#*_~>|]/g, '').replace(/\s+/g, ' ').trim();

export async function renderBlogContent(content, format = 'html') {
  if (typeof content !== 'string' || content.length > 200000) throw new Error('Article content must be under 200,000 characters.');
  let html;
  if (format === 'markdown') {
    const env = {}, tokens = md.parse(content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), env);
    let equations = 0;
    const visit = async list => {
      for (const token of list) {
        if (/^math_(inline|block)$/.test(token.type)) {
          if (++equations > 30 || token.content.length > 4000) throw new Error('Use at most 30 equations per article, each under 4,000 characters.');
          const { latexToImage } = await import('./markdownUtils.js');
          const image = await latexToImage(token.content, !!token.meta?.display);
          token.meta.html = `<img class="equation${token.type === 'math_block' ? ' equation-block' : ''}" src="${image.src}" width="${image.width}" height="${image.height}" alt="${md.utils.escapeHtml(token.content)}">`;
        }
        if (token.children) await visit(token.children);
      }
    };
    await visit(tokens);
    html = md.renderer.render(tokens, md.options, env);
  } else html = content;
  html = cleanBlogHtml(html);
  const headings = [], counts = new Map();
  html = html.replace(/<h([2-4])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (_, level, text) => {
    const label = plainText(text), base = label.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
    const count = (counts.get(base) || 0) + 1; counts.set(base, count);
    const id = `section-${base}${count > 1 ? `-${count}` : ''}`;
    headings.push({ id, level: Number(level), text: label });
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
  return { html, headings, readingTime: Math.max(1, Math.ceil(plainText(html).split(/\s+/).filter(Boolean).length / 200)) };
}
