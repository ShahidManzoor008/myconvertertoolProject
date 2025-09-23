import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import app from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to create a sample PDF file for testing
async function createSamplePdf(pages = 1) {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = pdfDoc.addPage([500, 500]);
    page.drawText(`Test Page ${i + 1}`, {
      x: 50,
      y: 450,
      size: 20,
    });
  }
  return await pdfDoc.save();
}

describe('PDF Operations API', () => {
  const fixtures = path.join(__dirname, 'fixtures');
  const testFiles = {
    single: path.join(fixtures, 'test1.pdf'),
    multi: path.join(fixtures, 'test2.pdf'),
  };

  // Create test PDFs before tests
  beforeAll(async () => {
    await fs.mkdir(fixtures, { recursive: true });
    // Create single-page test PDF
    await fs.writeFile(testFiles.single, await createSamplePdf(1));
    // Create multi-page test PDF
    await fs.writeFile(testFiles.multi, await createSamplePdf(3));
  });

  // Clean up test files after tests
  afterAll(async () => {
    await Promise.all([
      fs.unlink(testFiles.single).catch(() => {}),
      fs.unlink(testFiles.multi).catch(() => {}),
    ]);
  });

  describe('POST /api/pdf/merge', () => {
    it('should merge multiple PDFs', async () => {
      const res = await request(app)
        .post('/api/pdf/merge')
        .attach('files', testFiles.single)
        .attach('files', testFiles.multi);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="merged.pdf"');
      
      // Verify the merged PDF has correct number of pages (1 + 3 = 4)
      const mergedPdf = await PDFDocument.load(res.body);
      expect(mergedPdf.getPageCount()).toBe(4);
    });

    it('should return 400 if no files are provided', async () => {
      const res = await request(app)
        .post('/api/pdf/merge')
        .send();

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/pdf/split', () => {
    it('should split a PDF by page ranges', async () => {
      const res = await request(app)
        .post('/api/pdf/split')
        .attach('file', testFiles.multi)
        .field('ranges', JSON.stringify([[0, 1]])); // Split first two pages

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="split.pdf"');

      // Verify the split PDF has correct number of pages
      const splitPdf = await PDFDocument.load(res.body);
      expect(splitPdf.getPageCount()).toBe(2);
    });

    it('should return 400 if no file is provided', async () => {
      const res = await request(app)
        .post('/api/pdf/split')
        .field('ranges', JSON.stringify([[0, 1]]));

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/pdf/rotate', () => {
    it('should rotate PDF pages', async () => {
      const rotations = [
        { pageIndex: 0, angle: 90 }
      ];

      const res = await request(app)
        .post('/api/pdf/rotate')
        .attach('file', testFiles.single)
        .field('rotations', JSON.stringify(rotations));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="rotated.pdf"');
      
      // Load the rotated PDF and verify rotation
      const rotatedPdf = await PDFDocument.load(res.body);
      const page = rotatedPdf.getPages()[0];
      expect(page.getRotation().angle).toBe(90);
    });

    it('should return 400 if no file is provided', async () => {
      const res = await request(app)
        .post('/api/pdf/rotate')
        .field('rotations', JSON.stringify([{ pageIndex: 0, angle: 90 }]));

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});