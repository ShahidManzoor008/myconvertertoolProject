import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'node:path';
import { cleanupFiles, validateUploadedFile } from '../utils/fileUtils.js';

const invalid = message => Object.assign(new Error(message), { statusCode: 400 });
const numeric = (value, fallback, label, min = 0, max = 100000) => {
  if (value === undefined) return fallback;
  if (value === '' || value === null || !['string', 'number'].includes(typeof value)) throw invalid(`Invalid ${label}.`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw invalid(`Invalid ${label}.`);
  return number;
};
const pageAt = (document, value) => {
  const index = numeric(value, undefined, 'page index');
  if (!Number.isInteger(index) || index >= document.getPageCount()) throw invalid('Page index is outside the document.');
  return document.getPage(index);
};
const loadPdf = async file => {
  if (!await validateUploadedFile(file.path, file.originalname, ['pdf'])) throw invalid('Upload a valid PDF file.');
  try {
    const document = await PDFDocument.load(await fs.readFile(file.path), { throwOnInvalidObject: true });
    if (!document.getPageCount()) throw new Error('No usable PDF pages.');
    return document;
  }
  catch { throw invalid('This PDF is corrupt, encrypted, or unsupported.'); }
};
const drawText = async (document, edit) => {
  const page = pageAt(document, edit.pageIndex);
  if (typeof edit.text !== 'string' || !edit.text.trim() || edit.text.length > 1000) throw invalid('Enter 1 to 1,000 characters of text.');
  let color = edit.color;
  if (typeof color === 'string') { try { color = JSON.parse(color); } catch { throw invalid('Invalid text color.'); } }
  const components = color === undefined ? [0, 0, 0] : ['r', 'g', 'b'].map(key => numeric(color?.[key], undefined, 'color component', 0, 1));
  if (components.some(value => value === undefined)) throw invalid('Provide all RGB color components.');
  const font = await document.embedFont(StandardFonts.Helvetica);
  try {
    page.drawText(edit.text, {
      x: numeric(edit.x, 50, 'x coordinate'), y: numeric(edit.y, page.getHeight() - 50, 'y coordinate'),
      size: numeric(edit.size, 24, 'font size', 1, 300), font, color: rgb(...components),
    });
  } catch (error) { if (error.statusCode) throw error; throw invalid('This text cannot be rendered with the supported font.'); }
};
const run = operation => async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });
  try {
    const document = await loadPdf(req.file);
    await operation(document, req.body || {}, res);
    const bytes = await document.save();
    res.attachment(`edited_${path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`);
    res.type('application/pdf').send(Buffer.from(bytes));
  } catch (error) {
    res.status(error.statusCode === 400 ? 400 : 500).json({ error: error.statusCode === 400 ? error.message : 'Unable to edit this PDF. Please try again.' });
  } finally { cleanupFiles(req.file.path); }
};
export const addPage = run(document => { document.addPage(); });
export const deletePage = run((document, body) => {
  const page = pageAt(document, body.pageIndex);
  if (document.getPageCount() <= 1) throw invalid('Cannot delete the last page of the PDF.');
  document.removePage(document.getPages().indexOf(page));
});
export const addText = run(drawText);
export const savePdf = run(() => {});
export const editPdf = run(async (document, body, res) => {
  let edits = body.edits;
  if (typeof edits === 'string') { try { edits = JSON.parse(edits); } catch { throw invalid('Edits must be a JSON array.'); } }
  if (edits === undefined) return;
  if (!Array.isArray(edits) || edits.length > 100) throw invalid('Provide at most 100 edit operations.');
  for (const edit of edits) {
    if (!edit || typeof edit !== 'object') throw invalid('Invalid edit operation.');
    if (edit.type === 'addText') await drawText(document, edit);
    else if (edit.type === 'removeText' || edit.type === 'coverArea') {
      // A visual overlay is never secure redaction: underlying content remains extractable.
      const page = pageAt(document, edit.pageIndex);
      page.drawRectangle({ x: numeric(edit.x, 0, 'x'), y: numeric(edit.y, 0, 'y'), width: numeric(edit.width, 100, 'width', 1), height: numeric(edit.height, 20, 'height', 1), color: rgb(1, 1, 1) });
      res.set('Warning', '299 - "Visual overlay only; underlying content is not removed"');
    } else throw invalid('Unsupported edit operation.');
  }
});
