import { render, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, test, expect } from 'vitest';
import SEO from './SEO';
import { absoluteUrl } from './seoUrls';
afterEach(() => { cleanup(); });

test('route metadata has one description, a clean canonical and absolute social images', async () => {
  render(<HelmetProvider><MemoryRouter initialEntries={['/tools/json-formatter?utm_source=test#editor']}><SEO metadataOnly /><SEO title="Old verbose title" /></MemoryRouter></HelmetProvider>);
  await waitFor(() => expect(document.title).toBe('JSON Formatter & Validator Online | MyConverterTool'));
  expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.head.querySelector('link[rel="canonical"]').href).toBe('https://myconvertertool.com/tools/json-formatter');
  expect(document.head.querySelector('meta[name="twitter:image"]').content).toBe('https://myconvertertool.com/assets/og-default.png');
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
});
test('account pages are noindex', async () => {
  render(<HelmetProvider><MemoryRouter initialEntries={['/profile']}><SEO /></MemoryRouter></HelmetProvider>);
  await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').content).toContain('noindex'));
});
test('social URL normalization rejects executable protocols', () => {
  expect(absoluteUrl('javascript:alert(1)')).toBe('https://myconvertertool.com/');
  expect(absoluteUrl('/assets/image.png')).toBe('https://myconvertertool.com/assets/image.png');
});
