import markdownit from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  HeadingLevel,
} from 'docx';
import fs from 'fs';

// Helper Function: Convert Markdown to DOCX 
export const convertMarkdownToDocx = async (filePath) => {
  const mdContent = fs.readFileSync(filePath, 'utf-8');
  const md = markdownit();
  const htmlContent = md.render(mdContent);
  // Helper: Create Paragraph
  const createParagraph = (text, { bold = false, italic = false, bullet = false, heading = null } = {}) => {
    return new Paragraph({
      children: [new TextRun({ text, bold, italics: italic, size: 24 })],
      bullet: bullet ? { level: 0 } : undefined,
      heading,
      spacing: { after: 200 },
    });
  };
  // Helper: Create Table from Markdown
  const createTable = (rows) => {
    const tableRows = rows.map((row) => {
      const cells = row.split('|').filter(Boolean).map((cell) => (
        new TableCell({
          children: [new Paragraph(cell.trim())],
          width: { size: 2500, type: WidthType.DXA },
        })
      ));
      return new TableRow({ children: cells });
    });

    return new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  };
  // 📝 Parse Markdown Content
  let tableRows = [];
  const docContent = [];
  // Add Document Title
  docContent.push(
    new Paragraph({
      children: [new TextRun({ text: '📄 MarkdownToDOCX sms-coding.online', bold: true, size: 32 })],
      alignment: "center",
      spacing: { after: 300 },
    })
  );
  // Parse Markdown Content into DOCX
  htmlContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    // Tables
    if (line.startsWith('|') && line.includes('|')) {
      tableRows.push(line);
    } else {
      if (tableRows.length > 0) {
        docContent.push(createTable(tableRows));
        tableRows = [];
      }
      // Headings
      if (trimmed.startsWith('<h1>')) {
        docContent.push(createParagraph(stripHtml(trimmed), { bold: true, heading: HeadingLevel.HEADING_1 }));
      } else if (trimmed.startsWith('<h2>')) {
        docContent.push(createParagraph(stripHtml(trimmed), { bold: true, heading: HeadingLevel.HEADING_2 }));
      }
      else if (trimmed.startsWith('<h3>')) {
        docContent.push(createParagraph(stripHtml(trimmed), { bold: true, heading: HeadingLevel.HEADING_3 }));
      }
      // Lists
      else if (/^(\*|-)\s+/.test(trimmed)) {
        docContent.push(createParagraph(stripHtml(trimmed.replace(/^(\*|-)\s+/, '')), { bullet: true }));
      }
      // Paragraphs
      else if (trimmed !== '') {
        docContent.push(createParagraph(stripHtml(trimmed)));
      }
      // Blank Line
      else {
        docContent.push(new Paragraph({}));
      }
    }
  });
  // Add Remaining Table if Present
  if (tableRows.length) {
    docContent.push(createTable(tableRows));
  }
  // ✅ Create DOCX with Sections Immediately 
  const doc = new Document({
    creator: "Markdown Converter Tool",
    title: "Markdown to DOCX Document",
    description: "Converted from a Markdown file",
    sections: [
      {
        properties: {},
        children: docContent,
      },
    ],
  });
  // ✅ Generate DOCX Buffer
  return await Packer.toBuffer(doc);
};

// Helper: Strip HTML Tags
export const stripHtml = (str) => {
  if (!str) return '';
  // Remove any tags and attributes; keep plain text only
  try {
    const clean = sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });
    return clean;
  } catch (err) {
    console.error('Error sanitizing HTML:', err);
    return String(str).replace(/<\/?[^>]+(>|$)/g, '');
  }
};
