import markdownit from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

import { promises as fs } from 'fs';
import path from 'path';
import { createRequire } from 'node:module';
const requireNative = createRequire(import.meta.url);
const htmlToDocx = requireNative('@turbodocx/html-to-docx');

import { init } from 'mathjax';
import sharp from 'sharp';

import markdownMath from './markdownMath.js';
import footnote from 'markdown-it-footnote';
import sub from 'markdown-it-sub';
import sup from 'markdown-it-sup';
import deflist from 'markdown-it-deflist';

const IMAGE_DENSITY = Math.min(600, Math.max(96, Number(process.env.IMAGE_DENSITY) || 300));
const latexCache = new Map();
const md = markdownit({ html: true, linkify: true, typographer: true })
  .use(markdownMath).use(footnote).use(sub).use(sup).use(deflist);
let mathJaxPromise;
const getMathJax = () => mathJaxPromise ||= init({
  loader: { load: ['input/tex', 'output/svg'] },
  // Keep the entire inline expression in one SVG; MathJax 4 splits it by default.
  svg: { fontCache: 'none', linebreaks: { inline: false } },
  tex: { maxBuffer: 20 * 1024, maxMacros: 1000 },
}).catch(error => { mathJaxPromise = undefined; throw error; });

const latexToImage = async (latex, display) => {
  const key = `${display}:${latex}`;
  if (latexCache.has(key)) return latexCache.get(key);
  const mathJax = await getMathJax();
  // MathJax 4 may load font ranges asynchronously (matrices, Greek, accents).
  const result = await mathJax.tex2svgPromise(latex, { display, em: 16, ex: 8, containerWidth: 620 });
  const output = mathJax.startup.adaptor.outerHTML(result);
  if (output.includes('data-mml-node="merror"')) {
    throw new Error('Invalid or unsupported LaTeX equation. Check its commands and braces.');
  }
  const svgNode = mathJax.startup.adaptor.tags(result, 'svg')[0];
  if (!svgNode) throw new Error('Could not render LaTeX equation');
  let svg = mathJax.startup.adaptor.outerHTML(svgNode);
  // The HTML adaptor leaves '<' literal in attributes such as data-latex.
  // That is valid HTML, but sharp reads SVG as XML and requires it escaped.
  // Preserve the adaptor's existing entity escaping (especially ampersands).
  svg = svg.replace(/="([^"]*)"/g, (_, value) => `="${value.replace(/</g, '&lt;')}"`);
  // Give both Word and Chromium explicit layout dimensions, independent of PNG DPI.
  const root = svg.match(/^<svg[^>]*>/)[0];
  const widthEx = Number(root.match(/width="([\d.]+)ex"/)?.[1]);
  const heightEx = Number(root.match(/height="([\d.]+)ex"/)?.[1]);
  const fullWidth = /width="100%"/.test(root);
  if ((!widthEx && !fullWidth) || !heightEx) throw new Error('Invalid equation dimensions');
  const naturalWidth = fullWidth ? 620 : widthEx * 8;
  const naturalHeight = heightEx * 8;
  const scale = Math.min(1, 620 / naturalWidth, 900 / naturalHeight);
  const width = Math.max(1, Math.ceil(naturalWidth * scale));
  const height = Math.max(1, Math.ceil(naturalHeight * scale));
  if (fullWidth) {
    // Tagged equations use a percentage viewport with transforms in pixel units.
    // Freeze that viewport so the equation and its right-hand label survive rasterization.
    svg = svg.replace('<svg ', `<svg viewBox="0 0 ${naturalWidth} ${naturalHeight}" `);
  }
  svg = svg.replace(/width="(?:[\d.]+ex|100%)"/, `width="${width}px"`)
    .replace(/height="[\d.]+ex"/, `height="${height}px"`);
  // PNG is embedded reliably in DOCX and requires no browser scripts or external fonts.
  const png = await sharp(Buffer.from(svg), { density: IMAGE_DENSITY }).png().toBuffer();
  const image = { src: `data:image/png;base64,${png.toString('base64')}`, width, height };
  if (latexCache.size >= 100) latexCache.delete(latexCache.keys().next().value);
  latexCache.set(key, image);
  return image;
};

export const processLaTeX = async (markdownContent) => {
  const tokens = md.parse(markdownContent.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), {});
  const renderMath = async tokens => {
    for (const token of tokens) {
      if (token.type === 'math_inline' || token.type === 'math_block') {
        const image = await latexToImage(token.content, token.meta.display);
        const alt = md.utils.escapeHtml(token.content);
        token.meta.html = `<img src="${image.src}" alt="${alt}" width="${image.width}" height="${image.height}" style="vertical-align: middle;" />`;
      }
      if (token.children) await renderMath(token.children);
    }
  };
  await renderMath(tokens);
  return md.renderer.render(tokens, md.options, {});
};

export const renderMarkdownHtml = async markdownContent => sanitizeHtml(await processLaTeX(markdownContent), {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
  allowedAttributes: {
    a: ['href', 'title', 'id'], sup: ['id'], li: ['id'], ol: ['start'],
    img: ['src', 'alt', 'width', 'height', 'style'],
    p: ['style'], th: ['style'], td: ['style'],
  },
  allowedStyles: {
    '*': { 'text-align': [/^(left|right|center)$/], 'vertical-align': [/^(middle|top|bottom)$/], margin: [/^12px 0$/] },
  },
  allowedSchemes: ['https', 'http', 'mailto'],
  allowedSchemesByTag: { img: ['data'] },
  allowProtocolRelative: false,
  transformTags: {
    img: (tagName, attribs) => /^data:image\/(?:png|jpeg);base64,[a-z0-9+/=]+$/i.test(attribs.src || '')
      ? { tagName, attribs }
      : { tagName: 'span', attribs: {}, text: `[Image: ${attribs.alt || 'external image omitted'}]` },
  },
});

const buildDocumentHtml = (bodyHtml) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
      }
      h1, h2, h3, h4 {
        color: #0f172a;
        font-weight: 700;
        line-height: 1.25;
        margin: 18pt 0 8pt;
      }
      h1 {
        border-bottom: 1px solid #dbe3ef;
        font-size: 24pt;
        padding-bottom: 8pt;
      }
      h2 {
        font-size: 18pt;
      }
      h3 {
        font-size: 14pt;
      }
      p {
        margin: 0 0 10pt;
      }
      a {
        color: #2563eb;
        text-decoration: underline;
      }
      blockquote {
        border-left: 4px solid #6366f1;
        color: #475569;
        margin: 12pt 0;
        padding: 8pt 14pt;
      }
      table {
        border-collapse: collapse;
        margin: 14pt 0;
        width: 100%;
      }
      th {
        background: #eef2ff;
        color: #1e1b4b;
        font-weight: 700;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 7pt 9pt;
        vertical-align: top;
      }
      code {
        background: #f1f5f9;
        color: #be123c;
        font-family: Consolas, Monaco, monospace;
        font-size: 9.5pt;
        padding: 1pt 3pt;
      }
      pre {
        background: #0f172a;
        border-radius: 6pt;
        color: #e2e8f0;
        font-family: Consolas, Monaco, monospace;
        font-size: 9.5pt;
        line-height: 1.45;
        margin: 12pt 0;
        padding: 12pt;
        white-space: pre-wrap;
      }
      pre code {
        background: transparent;
        color: inherit;
        padding: 0;
      }
      img {
        max-width: 100%;
      }
      hr {
        border: 0;
        border-top: 1px solid #dbe3ef;
        margin: 18pt 0;
      }
    </style>
  </head>
  <body>${bodyHtml}</body>
</html>`;

export const convertMarkdownContentToDocx = async (markdownContent, sourceLabel = 'pasted markdown') => {
  try {
    if (!markdownContent || !markdownContent.trim()) {
      throw new Error('Markdown content is empty');
    }

    console.log(`📝 Processing Markdown content: ${sourceLabel}`);

    const renderedHtml = await renderMarkdownHtml(markdownContent);
    const htmlContent = buildDocumentHtml(renderedHtml);
    console.log('✅ Markdown converted to styled HTML');

    // 3. Convert HTML to a DOCX buffer
    const docxBuffer = await htmlToDocx(htmlContent, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });
    console.log('✅ HTML converted to DOCX buffer');

    return docxBuffer;
  } catch (error) {
    console.error('❌ Error in Markdown to DOCX conversion:', error);
    throw new Error(`Failed to convert Markdown to DOCX: ${error.message}`);
  }
};

// Helper Function: Convert Markdown to DOCX
export const convertMarkdownToDocx = async (filePath) => {
  try {
    console.log(`📝 Processing Markdown file: ${path.basename(filePath)}`);

    // Read the Markdown file content and reuse the same pipeline as pasted text.
    const markdownContent = await fs.readFile(filePath, 'utf-8');
    return convertMarkdownContentToDocx(markdownContent, path.basename(filePath));
  } catch (error) {
    console.error('❌ Error in Markdown to DOCX conversion:', error);
    throw new Error(`Failed to convert Markdown to DOCX: ${error.message}`);
  }
};
