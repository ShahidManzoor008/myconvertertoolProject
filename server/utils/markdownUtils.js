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

const md = markdownit({ html: true });

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

// Helper Function: Convert Markdown to DOCX 
export const convertMarkdownToDocx = async (filePath) => {
  try {
    console.log(`📝 Processing Markdown file: ${path.basename(filePath)}`);

    // 1. Read the Markdown file content
    const markdownContent = await fs.readFile(filePath, 'utf-8');

    // 2. Preprocess LaTeX equations to base64 images
    const processedContent = await processLaTeX(markdownContent);
    console.log('✅ LaTeX equations preprocessed');

    // 3. Convert Markdown to HTML
    const htmlContent = md.render(processedContent);
    console.log('✅ Markdown converted to HTML');

    // 4. Convert HTML to a DOCX buffer
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

// This function is no longer needed with mammoth, but keeping it in case of other usages.
// It should be removed if not used elsewhere.
export const stripHtml = (str) => {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '');
};
