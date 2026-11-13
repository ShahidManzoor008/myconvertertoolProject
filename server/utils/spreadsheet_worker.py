"""Isolated spreadsheet worker. File paths and options come from the Node controller."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import zipfile

import openpyxl
from openpyxl.utils import get_column_letter
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


def table_quality(table):
    """Prefer complete, dense tables over fragments and isolated aligned text."""
    width = max(map(len, table), default=0)
    if len(table) < 2 or width < 2:
        return 0
    filled = sum(bool(str(cell or '').strip()) for row in table for cell in row)
    total = sum(len(row) for row in table)
    density = filled / max(total, 1)
    consistent_width = sum(len(row) == width for row in table) / len(table)
    return len(table) * width * density * (0.75 + 0.25 * consistent_width)


def extract_word_position_tables(page):
    """Rebuild tables from aligned PDF words when page-wide text detection fragments them."""
    words = sorted(page.extract_words(x_tolerance=3, y_tolerance=3),
                   key=lambda word: (word['top'], word['x0']))
    lines = []
    for word in words:
        line = next((candidate for candidate in reversed(lines[-2:])
                     if abs(candidate['top'] - word['top']) <= 3), None)
        if line is None:
            lines.append({'top': word['top'], 'words': [word]})
        else:
            line['words'].append(word)

    for line in lines:
        cells = []
        for word in sorted(line['words'], key=lambda item: item['x0']):
            if cells and word['x0'] - cells[-1]['x1'] <= 8:
                cells[-1]['text'] += ' ' + word['text']
                cells[-1]['x1'] = word['x1']
            else:
                cells.append({'text': word['text'], 'x0': word['x0'], 'x1': word['x1']})
        line['cells'] = cells

    # Separate tables with larger whitespace gaps while keeping normal row spacing together.
    regions = []
    for line in lines:
        if not regions or line['top'] - regions[-1][-1]['top'] > 32:
            regions.append([line])
        else:
            regions[-1].append(line)

    tables = []
    number_pattern = re.compile(r'^[+-]?(?:\d[\d,]*(?:\.\d+)?|\.\d+)%?$')
    for region in regions:
        if len(region) < 2:
            continue

        # Text columns align on their left edge; numeric columns are often right aligned.
        positions = []
        for row_index, line in enumerate(region):
            for cell in line['cells']:
                numeric = bool(number_pattern.fullmatch(cell['text']))
                edge = cell['x1'] if numeric else cell['x0']
                positions.append((edge, row_index, numeric))

        clusters = []
        for edge, row_index, numeric in sorted(positions):
            cluster = min((item for item in clusters if item['numeric'] == numeric),
                          key=lambda item: abs(item['center'] - edge), default=None)
            if cluster and abs(cluster['center'] - edge) <= 20:
                cluster['edges'].append(edge)
                cluster['rows'].add(row_index)
                cluster['center'] = sorted(cluster['edges'])[len(cluster['edges']) // 2]
            else:
                clusters.append({'center': edge, 'edges': [edge], 'rows': {row_index},
                                 'numeric': numeric})

        minimum_support = max(2, (len(region) + 1) // 2)
        anchors = sorted(cluster['center'] for cluster in clusters
                         if len(cluster['rows']) >= minimum_support)
        if len(anchors) < 2:
            continue
        header_index = max(range(len(region)), key=lambda index: len(region[index]['cells']))
        matrix = []
        for row_index, line in enumerate(region):
            row = [''] * len(anchors)
            cells = line['cells']
            # When the header has one cell per column, its reading order is more reliable
            # than its alignment (headers are commonly centered above right-aligned values).
            if row_index == header_index and len(cells) == len(anchors):
                for column, cell in enumerate(cells):
                    row[column] = cell['text']
            elif row_index < header_index and len(cells) >= 2 and len(cells) < len(anchors) \
                    and all(not number_pattern.fullmatch(cell['text']) for cell in cells):
                # Sparse grouped headers are centered across the columns they label.
                for cell in cells:
                    center = (cell['x0'] + cell['x1']) / 2
                    column = min(range(len(anchors)), key=lambda index: abs(anchors[index] - center))
                    row[column] = (row[column] + ' ' + cell['text']).strip()
            else:
                for cell in cells:
                    numeric = bool(number_pattern.fullmatch(cell['text']))
                    edge = cell['x1'] if numeric else cell['x0']
                    column = min(range(len(anchors)), key=lambda index: abs(anchors[index] - edge))
                    row[column] = (row[column] + ' ' + cell['text']).strip()

            if sum(bool(value) for value in row) >= 2:
                matrix.append(row)

        # Drop columns that contain no values anywhere, without shifting genuine blank cells.
        populated_columns = [column for column in range(len(anchors))
                             if any(row[column] for row in matrix)]
        matrix = [[row[column] for column in populated_columns] for row in matrix]
        if len(matrix) >= 2 and table_quality(matrix):
            tables.append(matrix)
    return tables


def extract_page_tables(page, mode):
    """Try complementary rule and whitespace strategies and keep the strongest parse."""
    if mode == 'auto':
        word_tables = extract_word_position_tables(page)
        if word_tables:
            return word_tables

    strategies = {
        'lines': [{}],
        'text': [
            {'vertical_strategy': 'text', 'horizontal_strategy': 'text', 'min_words_vertical': 2},
            {'vertical_strategy': 'text', 'horizontal_strategy': 'text', 'min_words_vertical': 3},
        ],
        'auto': [
            {},
            {'vertical_strategy': 'text', 'horizontal_strategy': 'text', 'min_words_vertical': 2},
            {'vertical_strategy': 'text', 'horizontal_strategy': 'text', 'min_words_vertical': 3},
            {'vertical_strategy': 'lines', 'horizontal_strategy': 'text', 'min_words_vertical': 2},
            {'vertical_strategy': 'text', 'horizontal_strategy': 'lines', 'min_words_vertical': 2},
        ],
    }
    best_tables, best_score = [], 0
    for settings in strategies[mode]:
        found = page.extract_tables(settings)
        cleaned = []
        for table in found:
            rows = [[str(cell).strip() if cell is not None else None for cell in row] for row in table]
            rows = [row for row in rows if any(cell for cell in row)]
            if table_quality(rows):
                cleaned.append(rows)
        score = sum(table_quality(table) for table in cleaned)
        if score > best_score:
            best_tables, best_score = cleaned, score
    return best_tables


def merge_continued_tables(page_tables):
    """Join a table continued on the next page when its repeated header matches."""
    merged = []
    last_by_header = {}
    for page_number, table in page_tables:
        header = tuple(str(value or '').strip().casefold() for value in table[0])
        previous = last_by_header.get(header)
        if previous and previous['last_page'] == page_number - 1 \
                and len(previous['rows']) < len(table) and len(table) > 1:
            previous['rows'].extend(table[1:])
            previous['last_page'] = page_number
            continue
        item = {'page': page_number, 'last_page': page_number,
                'table_number': 1, 'rows': table}
        merged.append(item)
        last_by_header[header] = item
    counters = {}
    for item in merged:
        page = item['page']
        counters[page] = counters.get(page, 0) + 1
        item['table_number'] = counters[page]
    return merged


def restore_grouped_headers(sheet):
    """Recreate simple group headers, such as Q1 above Jan–Mar, as merged cells."""
    if sheet.max_row < 2:
        return
    for row_index in (1,):
        parent = [sheet.cell(row_index, column).value for column in range(1, sheet.max_column + 1)]
        child = [sheet.cell(row_index + 1, column).value for column in range(1, sheet.max_column + 1)]
        groups = [column for column, value in enumerate(parent, 1) if value not in (None, '')]
        child_columns = [column for column, value in enumerate(child, 1) if value not in (None, '')]
        if len(groups) < 2 or len(child_columns) < 5:
            continue
        if not all(isinstance(child[column - 1], str) for column in child_columns):
            continue
        first_child, last_child = child_columns[0] + 1, child_columns[-1]
        for group_index, column in enumerate(groups):
            if group_index:
                start = (groups[group_index - 1] + column) // 2 + 1
            else:
                start = first_child
            if group_index + 1 < len(groups):
                end = (column + groups[group_index + 1]) // 2
            else:
                end = last_child
            if end <= start or column < start or column > end:
                continue
            value = sheet.cell(row_index, column).value
            sheet.cell(row_index, start).value = value
            sheet.merge_cells(start_row=row_index, start_column=start,
                              end_row=row_index, end_column=end)


def pdf_to_excel(source, root, options):
    workbook = openpyxl.Workbook()
    workbook.remove(workbook.active)
    preview, skipped, cells = [], [], 0
    page_tables = []
    with pdfplumber.open(source) as pdf:
        if len(pdf.pages) > 50:
            raise ValueError('PDFs may contain at most 50 pages. Split this PDF first.')
        has_text = False
        for page_number, page in enumerate(pdf.pages, 1):
            has_text = has_text or bool(page.chars)
            tables = extract_page_tables(page, options['tableMode'])
            if not tables:
                skipped.append(page_number)
            for table in tables:
                page_tables.append((page_number, table))
            page.close()

    tables = merge_continued_tables(page_tables)
    for table_info in tables:
        table_number, table = table_info['table_number'], table_info['rows']
        page_number = table_info['page']
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
        restore_grouped_headers(sheet)
        for column_index, column in enumerate(sheet.columns, 1):
            width = min(45, max(12, max(len(str(c.value or '')) for c in column) + 2))
            sheet.column_dimensions[get_column_letter(column_index)].width = width
        preview.append({'name': sheet.title, 'rows': sheet.max_row,
                        'columns': sheet.max_column,
                        'sample': [[cell.value for cell in row[:12]] for row in list(sheet.rows)[:8]]})
    if not workbook.worksheets:
        if not has_text:
            raise ValueError('This PDF contains no selectable text. Scanned PDFs require OCR before conversion.')
        raise ValueError('No table structure could be detected in this PDF. Try “Borderless / aligned text” for columns separated by spacing, or “Border lines” if the table has clear grid lines. If the page is a scan or photo, run OCR first and upload the searchable PDF.')
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
