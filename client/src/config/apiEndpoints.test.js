import { describe, expect, test } from 'vitest';
import { API_ENDPOINTS } from './apiEndpoints';
import { apiClient, batchApi } from '../utils/apiClient';
import { vi } from 'vitest';

describe('API route contracts', () => {
  test('editor targets the mounted backend route', () => {
    expect(API_ENDPOINTS.pdf.editor).toBe('/api/editor');
  });
  test('batch download reads a binary ZIP response', async () => {
    const zip = new Blob(['PK'], { type: 'application/zip' });
    const spy = vi.spyOn(apiClient, 'postBlob').mockResolvedValue(zip);
    try {
      expect(await batchApi.download([])).toBe(zip);
      expect(spy).toHaveBeenCalledWith('/api/batch', { files: [] });
    } finally { spy.mockRestore(); }
  });
});
