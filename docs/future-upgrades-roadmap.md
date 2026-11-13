# Future upgrades roadmap

## Current priority: frontend UX

Frontend UX improvements come first. The tool and AI ideas below are deferred until the UX work is reviewed and completed.

## Deferred tool upgrades

Prioritize additions that extend MyConverterTool's file conversion workflows:

1. **OCR for scanned PDFs** — make scanned PDFs searchable and export recognized text to TXT, DOCX, or spreadsheet formats where practical.
2. **PDF and spreadsheet conversions** — improve PDF-to-Excel table extraction and support useful CSV/XLSX conversion workflows.
3. **Image conversion and optimization** — add common HEIC, AVIF, and WebP conversions, image resize/compression, and image-to-PDF conversion.
4. **Document conversion quality** — continue improving Word, PDF, and Markdown conversions, including preservation of LaTeX and Pandoc-style equations.

The product decision to keep the PDF feature as an online viewer remains in place. A standalone PDF editor is not part of this roadmap.

## Deferred AI tools

Consider an AI document assistant after the core UX and conversion work. Initial functions could include:

- Summarize an uploaded PDF or Word document.
- Answer questions about the document and cite page numbers where possible.
- Extract tables, dates, and key facts into a copyable or downloadable format.

Before release, decide on provider, per-user quotas, file/page limits, retention and deletion behavior, and clear disclosure/consent for sending files to an AI provider. Keep API credentials server-side and never promise sensitive-document privacy without verifying provider terms and implementation.

## Adoption and SEO measurement

Use Google Search Console query and page data to select which deferred tools to build and measure their search impressions and clicks. Publish a page only when the tool works and its page gives users useful, accurate instructions; avoid generating thin pages solely to target keyword variations.
