"""Isolated spreadsheet worker. File paths and options come from the Node controller."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import zipfile

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.properties import PageSetupProperties
import pdfplumber
from pdfminer.pdfdocument import PDFPasswordIncorrect
from pdfplumber.utils.exceptions import PdfminerException

MAX_CELLS = 200000


def check_archive(filename):
    with zipfile.ZipFile(filename) as archive:
        if sum(item.file_size for item in archive.infolist()) > 100 * 1024 * 1024:
            raise ValueError('Workbook expands beyond the 100 MB limit.')
        if len(archive.infolist()) > 10000:
            raise ValueError('Workbook contains too many internal files.')
        if any('vbaProject' in item.filename or item.filename.startswith('xl/externalLinks/')
               for item in archive.infolist()):
            raise ValueError('Remove macros and external workbook links before converting.')


def office_convert(source, output_dir, extension, root):
    profile = (root / 'office-profile').as_uri()
    result = subprocess.run([
        os.environ.get('LIBREOFFICE_PATH', '/usr/bin/soffice'),
        '-env:UserInstallation=' + profile, '--headless', '--nologo', '--nodefault',
        '--norestore', '--convert-to', extension, '--outdir', str(output_dir), str(source),
    ], capture_output=True, timeout=60, check=False)
    output = output_dir / (source.stem + '.' + extension.split(':')[0])
    if result.returncode != 0 or not output.is_file():
        raise ValueError('Could not open this workbook. Remove its password protection or repair it in Excel.')
    return output


def excel_to_pdf(source, root, options):
    if source.suffix == '.xls':
        # Validate the legacy container before passing it to LibreOffice.
        import xlrd
        legacy = xlrd.open_workbook(source, on_demand=True)
        if sum(s.nrows * s.ncols for s in legacy.sheets()) > MAX_CELLS:
            raise ValueError('Workbook exceeds the 200,000 cell limit.')
        legacy.release_resources()
        intermediate = root / 'intermediate'
        intermediate.mkdir()
        source = office_convert(source, intermediate, 'xlsx', root)
    check_archive(source)
    workbook = openpyxl.load_workbook(source, keep_links=False)
    if len(workbook.worksheets) > 50:
        raise ValueError('Workbooks may contain at most 50 sheets.')
    if sum(s.max_row * s.max_column for s in workbook.worksheets) > MAX_CELLS:
        raise ValueError('Workbook exceeds the 200,000 cell limit.')
    for sheet in workbook.worksheets:
        sheet.page_setup.orientation = options['orientation']
        sheet.page_setup.paperSize = {'A4': sheet.PAPERSIZE_A4, 'Letter': sheet.PAPERSIZE_LETTER}[options['paperSize']]
        sheet.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=options['fitToWidth'])
        if options['fitToWidth']:
            sheet.page_setup.fitToWidth = 1
            sheet.page_setup.fitToHeight = 0
        else:
            sheet.page_setup.scale = 100
    prepared = root / 'prepared.xlsx'
    workbook.save(prepared)
    workbook.close()
    output = office_convert(prepared, root, 'pdf:calc_pdf_Export', root)
    return {'output': str(output), 'warnings': []}


def cell_value(value):
    """Only unambiguous numbers become numeric. IDs and dates stay as printed."""
    value = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', str(value or ''))[:32767]
    significant_digits = len(value.replace('-', '').replace('.', '').lstrip('0'))
    if significant_digits <= 15 and re.fullmatch(r'-?(?:0|[1-9]\d{0,13})(?:\.\d+)?', value):
        return float(value) if '.' in value else int(value)
    return value


def pdf_to_excel(source, root, options):
    workbook = openpyxl.Workbook()
    workbook.remove(workbook.active)
    preview, skipped, cells = [], [], 0
    with pdfplumber.open(source) as pdf:
        if len(pdf.pages) > 50:
            raise ValueError('PDFs may contain at most 50 pages. Split this PDF first.')
        has_text = False
        for page_number, page in enumerate(pdf.pages, 1):
            has_text = has_text or bool(page.chars)
            settings = {} if options['tableMode'] == 'lines' else {
                'vertical_strategy': 'text', 'horizontal_strategy': 'text',
                'min_words_vertical': 3,
            }
            tables = page.extract_tables(settings)
            tables = [[row for row in table if any(str(cell or '').strip() for cell in row)] for table in tables]
            tables = [t for t in tables if len(t) >= 2 and max(map(len, t), default=0) >= 2]
            if not tables:
                skipped.append(page_number)
            for table_number, table in enumerate(tables, 1):
                if len(workbook.worksheets) >= 100:
                    raise ValueError('PDF contains more than 100 tables. Split this PDF first.')
                cells += sum(len(row) for row in table)
                if cells > MAX_CELLS or max(map(len, table)) > 256:
                    raise ValueError('Extracted tables exceed the 200,000 cell or 256 column limit.')
                sheet = workbook.create_sheet(f'Page {page_number} Table {table_number}')
                for row in table:
                    sheet.append([cell_value(value) for value in row])
                # PDF text must never become a formula or hyperlink in the output workbook.
                for row in sheet:
                    for cell in row:
                        if isinstance(cell.value, str):
                            cell.data_type = 's'
                        cell.alignment = Alignment(vertical='top', wrap_text=True)
                for cell in sheet[1]:
                    cell.font = Font(bold=True, color='FFFFFF')
                    cell.fill = PatternFill('solid', fgColor='047857')
                sheet.freeze_panes = 'A2'
                for column in sheet.columns:
                    width = min(45, max(12, max(len(str(c.value or '')) for c in column) + 2))
                    sheet.column_dimensions[column[0].column_letter].width = width
                preview.append({'name': sheet.title, 'rows': sheet.max_row,
                                'columns': sheet.max_column,
                                'sample': [[cell.value for cell in row[:12]] for row in list(sheet.rows)[:8]]})
            page.close()
    if not workbook.worksheets:
        if not has_text:
            raise ValueError('This PDF contains no selectable text. Scanned PDFs require OCR before conversion.')
        raise ValueError('No tables found. Try the borderless table option or upload a PDF containing tables.')
    output = root / 'tables.xlsx'
    workbook.save(output)
    warnings = ['Table extraction cannot restore original formulas or exact spreadsheet formatting.']
    if skipped:
        warnings.append('No tables extracted from pages: ' + ', '.join(map(str, skipped)) + '.')
    return {'output': str(output), 'preview': preview, 'warnings': warnings}


if __name__ == '__main__':
    try:
        mode, source, root, raw_options = sys.argv[1:]
        result = (excel_to_pdf if mode == 'excel-to-pdf' else pdf_to_excel)(
            Path(source), Path(root), json.loads(raw_options))
        print(json.dumps(result))
    except PDFPasswordIncorrect:
        print(json.dumps({'error': 'This PDF is password-protected. Upload an unlocked copy.'}))
    except PdfminerException as error:
        print(json.dumps({'error': 'This PDF is password-protected. Upload an unlocked copy.'
                          if error.args and isinstance(error.args[0], PDFPasswordIncorrect)
                          else 'Could not read this PDF. Check that it is a valid document.'}))
    except subprocess.TimeoutExpired:
        print(json.dumps({'error': 'Conversion timed out. Try a smaller workbook.'}))
    except (ValueError, zipfile.BadZipFile) as error:
        print(json.dumps({'error': str(error)}))
    except Exception:
        print(json.dumps({'error': 'Could not read this document. Check that it is a valid, unlocked PDF or Excel file.'}))
