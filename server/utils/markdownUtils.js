import markdownit from 'markdown-it';
import { promises as fs } from 'fs';
import path from 'path';
import htmlToDocx from 'html-to-docx';
import { init } from 'mathjax';
import sharp from 'sharp';

// Configuration: image density for high‑resolution rendering (DPI)
const IMAGE_DENSITY = Number(process.env.IMAGE_DENSITY) || 300;

// Optional output format: 'png' (default) or 'svg'
const LATEX_IMAGE_FORMAT = process.env.LATEX_IMAGE_FORMAT || 'png';

// In‑memory cache to avoid re‑rendering identical LaTeX expressions
const latexCache = new Map();

const md = markdownit({
  html: true,
  linkify: true,
  typographer: true,
});

let MathJaxInstance = null;

const getMathJax = async () => {
  if (!MathJaxInstance) {
    MathJaxInstance = await init({
      loader: { load: ['input/tex', 'output/svg'] },
    });
  }
  return MathJaxInstance;
};

const latexToImageBase64 = async (latex, isDisplay) => {
  const cacheKey = `${latex}::${isDisplay}`;
  if (latexCache.has(cacheKey)) {
    return latexCache.get(cacheKey);
  }

  const MathJax = await getMathJax();
  const svg = MathJax.tex2svg(latex, { display: isDisplay });
  const svgString = MathJax.startup.adaptor.outerHTML(svg);

  const svgMatch = svgString.match(/<svg[^]*?<\/svg>/);
  if (!svgMatch) {
    throw new Error('No SVG element found in MathJax output');
  }
  const svgElement = svgMatch[0];

  // Decide output format
  if (LATEX_IMAGE_FORMAT === 'svg') {
    const base64Url = `data:image/svg+xml;base64,${Buffer.from(svgElement).toString('base64')}`;
    latexCache.set(cacheKey, base64Url);
    return base64Url;
  }

  // Default to PNG using sharp
  const pngBuffer = await sharp(Buffer.from(svgElement), { density: IMAGE_DENSITY })
    .png()
    .toBuffer();
  const base64Url = `data:image/png;base64,${pngBuffer.toString('base64')}`;
  latexCache.set(cacheKey, base64Url);
  return base64Url;
};

export const processLaTeX = async (markdownContent) => {
  const codeBlocks = [];
  let placeholderIndex = 0;

  // Protect block code blocks: ```code```
  let shieldedContent = markdownContent.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${placeholderIndex++}__`;
    codeBlocks.push({ placeholder, content: match });
    return placeholder;
  });

  // Protect inline code blocks: `code`
  shieldedContent = shieldedContent.replace(/`[^`\n]+`/g, (match) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${placeholderIndex++}__`;
    codeBlocks.push({ placeholder, content: match });
    return placeholder;
  });

  // 1. Block Math: $$ ... $$
  const blockMathRegex = /\$\$([\s\S]+?)\$\$/g;
  let match;
  const blockMatches = [];
  while ((match = blockMathRegex.exec(shieldedContent)) !== null) {
    blockMatches.push({ matchStr: match[0], latex: match[1].trim() });
  }

  for (const block of blockMatches) {
    try {
      const base64Url = await latexToImageBase64(block.latex, true);
      shieldedContent = shieldedContent.replace(block.matchStr, () => `<div style="text-align: center; margin: 12px 0;"><img src="${base64Url}" alt="display-equation" /></div>`);
    } catch (err) {
      console.error(`Failed to render block LaTeX: ${block.latex}`, err);
    }
  }

  // 2. Block LaTeX: \[ ... \]
  const blockDelimRegex = /\\\[([\s\S]+?)\\\]/g;
  const blockDelimMatches = [];
  while ((match = blockDelimRegex.exec(shieldedContent)) !== null) {
    blockDelimMatches.push({ matchStr: match[0], latex: match[1].trim() });
  }
  for (const block of blockDelimMatches) {
    try {
      const base64Url = await latexToImageBase64(block.latex, true);
      shieldedContent = shieldedContent.replace(block.matchStr, () => `<div style="text-align: center; margin: 12px 0;"><img src="${base64Url}" alt="display-equation" /></div>`);
    } catch (err) {
      console.error(`Failed to render block LaTeX: ${block.latex}`, err);
    }
  }

  // 3. Inline Math: $ ... $
  const inlineMathRegex = /\$([^\$\s](?:[^\$]*?[^\$\s])?)\$/g;
  const inlineMatches = [];
  inlineMathRegex.lastIndex = 0;
  while ((match = inlineMathRegex.exec(shieldedContent)) !== null) {
    inlineMatches.push({ matchStr: match[0], latex: match[1].trim() });
  }

  for (const inline of inlineMatches) {
    try {
const base64Url = await latexToImageBase64(inline.latex, false);
      shieldedContent = shieldedContent.replace(inline.matchStr, () => `<img src="${base64Url}" alt="inline-equation" style="vertical-align: middle; margin: 0 4px;" />`);
    } catch (err) {
      console.error(`Failed to render inline LaTeX: ${inline.latex}`, err);
    }
  }

  // 4. Inline LaTeX: \( ... \)
  const inlineDelimRegex = /\\\(([\s\S]+?)\\\)/g;
  const inlineDelimMatches = [];
  while ((match = inlineDelimRegex.exec(shieldedContent)) !== null) {
    inlineDelimMatches.push({ matchStr: match[0], latex: match[1].trim() });
  }
  for (const inline of inlineDelimMatches) {
    try {
      const base64Url = await latexToImageBase64(inline.latex, false);
      shieldedContent = shieldedContent.replace(inline.matchStr, () => `<img src="${base64Url}" alt="inline-equation" style="vertical-align: middle; margin: 0 4px;" />`);
    } catch (err) {
      console.error(`Failed to render inline LaTeX: ${inline.latex}`, err);
    }
  }

  // 5. Restore shielded code blocks
  for (const block of codeBlocks) {
    shieldedContent = shieldedContent.replace(block.placeholder, () => block.content);
  }

  return shieldedContent;
};

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

    // 1. Preprocess LaTeX equations to base64 images
    const processedContent = await processLaTeX(markdownContent);
    console.log('✅ LaTeX equations preprocessed');

    // 2. Convert Markdown to styled HTML
    const renderedHtml = md.render(processedContent);
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
