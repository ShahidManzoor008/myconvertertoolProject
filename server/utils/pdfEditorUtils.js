import { PDFDocument, rgb } from 'pdf-lib';

// Helper Function: Add Text to PDF
export const addTextToPdf = async (pdfDoc, page, text, x, y, size = 12, font = null, color = rgb(0, 0, 0)) => {
  const helveticaFont = font || await pdfDoc.embedFont('Helvetica');
  page.drawText(text, { x, y, font: helveticaFont, size, color });
};

// Helper Function: Remove Text from PDF (by drawing white rectangle)
export const removeTextFromPdf = (page, x, y, width, height) => {
  page.drawRectangle({
    x, y, width, height,
    color: rgb(1, 1, 1), // White color to cover text
  });
};
