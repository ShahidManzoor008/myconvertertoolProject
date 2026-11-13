import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ExcelPdfConverter from './ExcelPdfConverter';
import { apiClient } from '../../utils/apiClient';
import { downloadFile } from '../../utils/fileDownloadUtils';

vi.mock('../../utils/apiClient', () => ({ apiClient: { upload: vi.fn() } }));
vi.mock('../../utils/fileDownloadUtils', () => ({ downloadFile: vi.fn() }));
const mount = (initialEntry = '/tools/excel-pdf') => render(<MemoryRouter initialEntries={[initialEntry]}><HelmetProvider><ExcelPdfConverter /></HelmetProvider></MemoryRouter>);
const choose = (name, type, label) => fireEvent.change(screen.getByLabelText(label), {
  target: { files: [new File(['fixture'], name, { type })] },
});
beforeEach(() => { vi.clearAllMocks(); });

test('a PDF-to-Excel card link opens the converter in PDF upload mode', () => {
  mount('/tools/excel-pdf?mode=pdf-to-excel');
  expect(screen.getByLabelText('Upload PDF document')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'PDF to Excel' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Convert to Excel' })).toBeDisabled();
});

test('Excel conversion submits layout options and offers the returned PDF download', async () => {
  apiClient.upload.mockResolvedValue({ filename: 'sales.pdf', mimeType: 'application/pdf', base64: btoa('pdf'), preview: [], warnings: [] });
  mount();
  fireEvent.change(screen.getByLabelText('Page orientation'), { target: { value: 'portrait' } });
  choose('sales.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Upload Excel workbook');
  await screen.findByText('sales.xlsx');
  fireEvent.click(screen.getByRole('button', { name: 'Convert to PDF' }));
  await screen.findByText('Your PDF is ready');
  const [endpoint, form] = apiClient.upload.mock.calls[0];
  expect(endpoint).toBe('/api/convert/excel-to-pdf');
  expect(form.get('orientation')).toBe('portrait');
  expect(form.get('fitToWidth')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
  expect(downloadFile).toHaveBeenCalledWith(expect.any(Blob), 'sales.pdf');
});

test('PDF mode clears the previous upload and previews extracted table cells', async () => {
  apiClient.upload.mockResolvedValue({ filename: 'tables.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', base64: btoa('xlsx'),
    preview: [{ name: 'Page 1 Table 1', rows: 2, columns: 2, sample: [['Product', 'Quantity'], ['Widget', 12]] }], warnings: ['Review extracted data.'] });
  mount();
  choose('sales.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Upload Excel workbook');
  await screen.findByText('sales.xlsx');
  fireEvent.click(screen.getByRole('button', { name: 'PDF to Excel' }));
  expect(screen.queryByText('sales.xlsx')).not.toBeInTheDocument();
  choose('tables.pdf', 'application/pdf', 'Upload PDF document');
  await screen.findByText('tables.pdf');
  fireEvent.change(screen.getByLabelText('Table detection'), { target: { value: 'text' } });
  fireEvent.click(screen.getByRole('button', { name: 'Convert to Excel' }));
  expect(await screen.findByRole('cell', { name: 'Widget' })).toBeInTheDocument();
  expect(apiClient.upload.mock.calls[0][1].get('tableMode')).toBe('text');
  expect(screen.getByRole('button', { name: 'Download Excel' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Table detection'), { target: { value: 'lines' } });
  expect(screen.queryByRole('button', { name: 'Download Excel' })).not.toBeInTheDocument();
});

test('conversion errors remain actionable and the user can retry', async () => {
  apiClient.upload.mockRejectedValue(new Error('Scanned PDFs require OCR.'));
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'PDF to Excel' }));
  choose('scan.pdf', 'application/pdf', 'Upload PDF document');
  await screen.findByText('scan.pdf');
  fireEvent.click(screen.getByRole('button', { name: 'Convert to Excel' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('OCR');
  expect(screen.getByRole('button', { name: 'Convert to Excel' })).toBeEnabled();
});

test('unsupported uploads are rejected without submitting a request', async () => {
  mount();
  choose('notes.txt', 'text/plain', 'Upload Excel workbook');
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('.xlsx or .xls'));
  expect(screen.getByRole('button', { name: 'Convert to PDF' })).toBeDisabled();
  expect(apiClient.upload).not.toHaveBeenCalled();
});
