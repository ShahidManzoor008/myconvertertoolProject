import markdownit from 'markdown-it';
import { promises as fs } from 'fs';
import path from 'path';
import htmlToDocx from 'html-to-docx';

const md = markdownit();

// Helper Function: Convert Markdown to DOCX 
export const convertMarkdownToDocx = async (filePath) => {
  try {
    console.log(`📝 Processing Markdown file: ${path.basename(filePath)}`);

    // 1. Read the Markdown file content
    const markdownContent = await fs.readFile(filePath, 'utf-8');

    // 2. Convert Markdown to HTML
    const htmlContent = md.render(markdownContent);
    console.log('✅ Markdown converted to HTML');

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

// This function is no longer needed with mammoth, but keeping it in case of other usages.
// It should be removed if not used elsewhere.
export const stripHtml = (str) => {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '');
};
