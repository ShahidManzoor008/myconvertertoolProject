# Excel ↔ PDF converter

The Excel ↔ PDF converter is available on the production site at `/tools/excel-pdf`.

## Local setup

Use Node 24, Python 3.10+ and LibreOffice. From the checkout root:

```sh
python3 -m venv .venv-spreadsheet
.venv-spreadsheet/bin/pip install -r server/requirements-spreadsheet.txt
```

Set `SPREADSHEET_PYTHON` to override the virtual environment's Python executable;
`LIBREOFFICE_PATH` overrides `/usr/bin/soffice`. Production hosts need LibreOffice
installed for Excel-to-PDF conversion. No production dependency installation is
needed during development.

The new page is `/tools/excel-pdf`, registered in the tool directory and public
route manifest. Clicking its card focuses the upload workspace.

## API

Both endpoints accept one multipart `file` (20 MB maximum) and return JSON with
`filename`, `mimeType`, `base64`, `preview`, and `warnings`.

- `POST /api/convert/excel-to-pdf`: `.xlsx` or `.xls`; `orientation` is `landscape`
  (default) or `portrait`; `paperSize` is `A4` (default) or `Letter`;
  `fitToWidth` is `true` (default) or `false`.
- `POST /api/convert/pdf-to-excel`: `.pdf`; `tableMode` is `auto` (default),
  `lines`, or `text`. Automatic mode compares bordered, borderless, and mixed
  line/text extraction strategies and keeps the strongest table parse per page.
  Returns `.xlsx`; preview includes
  the first 8 rows and 12 columns of every table, up to 100 tables.

PDFs are limited to 50 pages. Workbooks are limited to 50 sheets and 200,000
cells, including the rectangular used range. Extracted tables are limited to
200,000 cells and 256 columns. XLSX archives have a 100 MB expanded-size limit.
Outputs are limited to 30 MB. The worker serializes spreadsheet requests, uses
separate LibreOffice profiles, and has a 150-second process-tree timeout.
Input and generated temporary files are removed after conversion.

Excel export respects existing print areas and hidden sheets. LibreOffice
calculates formulas. Complex Excel-only objects may differ when converted;
openpyxl adjusts print settings and may not preserve unsupported drawing objects.
Macro-enabled and externally linked XLSX files are rejected.

PDF extraction preserves table order, creates a worksheet per detected table,
and reports pages without detected tables. It does not recover formulas, charts,
or original Excel formatting. Scanned PDFs require OCR, which is outside this
first version. Merged PDF cells can appear as blank adjacent cells. Plain numeric
values become numbers; dates, identifiers with leading zeros, and ambiguous
formatted values remain text. Extracted strings never become formulas.

## Validation

```sh
.venv-spreadsheet/bin/pip install -r server/requirements-spreadsheet-test.txt
npm run test:spreadsheet --workspace server
npm run test --workspace client
npm run build --workspace client
.venv-spreadsheet/bin/python server/tests/fixtures/generate_spreadsheet_fixtures.py /tmp/myconvertertool-spreadsheet-qa
node scripts/verify-spreadsheet-tool.mjs
```

Backend tests generate workbooks with merged headings, formulas, dates and
multiple sheets; legacy XLS; bordered and borderless multipage PDF tables;
password-protected and text-free PDFs; and malformed/oversized uploads.

Implementation references:

- [pdfplumber's table extraction API](https://github.com/jsvine/pdfplumber#extracting-tables)
- [openpyxl print settings](https://openpyxl.pages.heptapod.net/openpyxl/print_settings.html)
- [LibreOffice PDF export options](https://help.libreoffice.org/latest/en-US/text/shared/guide/pdf_params.html)
