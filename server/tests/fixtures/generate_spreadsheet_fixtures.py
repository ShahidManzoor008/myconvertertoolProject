"""Generate realistic files without checking binary fixtures into Git."""
from datetime import datetime
from pathlib import Path
import sys

import openpyxl
from openpyxl.styles import Border, Side, Font
from reportlab.pdfgen import canvas
from reportlab.lib.pdfencrypt import StandardEncryption
import xlwt

root = Path(sys.argv[1])
root.mkdir(parents=True, exist_ok=True)
workbook = openpyxl.Workbook()
sheet = workbook.active
sheet.title = 'Sales'
sheet.append(['Quarterly sales'])
sheet.merge_cells('A1:C1')
sheet.append(['Product', 'Quantity', 'Revenue'])
sheet.append(['Widget', 12, 125.5])
sheet.append(['Gadget', 7, 99.95])
sheet.append(['Total', '=SUM(B3:B4)', '=SUM(C3:C4)'])
for row in sheet:
    for cell in row:
        cell.border = Border(*[Side(style='thin')] * 4)
sheet['A1'].font = Font(bold=True, size=18)
sheet.column_dimensions['A'].width = 25
sheet.column_dimensions['B'].width = 18
sheet.column_dimensions['C'].width = 18
sheet['C3'].number_format = '0.00'
sheet['C4'].number_format = '0.00'
second = workbook.create_sheet('Dates')
second.append(['Date', 'Reference'])
second.append([datetime(2026, 1, 15), '00123'])
second['A2'].number_format = 'yyyy-mm-dd'
for col in ['A', 'B']:
    second.column_dimensions[col].width = 22
workbook.save(root / 'sales.xlsx')
wide = openpyxl.Workbook()
wide.active.append([f'Column {index}' for index in range(1, 21)])
wide.active.append(['Value'] * 19 + ['Last column'])
for column in wide.active.columns:
    wide.active.column_dimensions[column[0].column_letter].width = 16
wide.save(root / 'wide.xlsx')
legacy = xlwt.Workbook()
ls = legacy.add_sheet('Legacy')
for r, row in enumerate([['Product', 'Qty'], ['Legacy widget', 42]]):
    for c, value in enumerate(row):
        ls.write(r, c, value)
legacy.save(root / 'legacy.xls')


def table_pdf(filename, borders=True, encrypted=False):
    pdf = canvas.Canvas(str(root / filename), pagesize=(600, 800),
                        encrypt=StandardEncryption('secret') if encrypted else None)
    for page in range(2):
        rows = [['Product', 'Quantity', 'Reference'], ['Widget', '12', '00123'],
                ['=1+1', '-4', '2026-01-15'], ['Gadget', '125.50', '+SUM(A1)']]
        for r, row in enumerate(rows):
            for c, value in enumerate(row):
                pdf.drawString(55 + c * 160, 700 - r * 30, value)
        if borders:
            for r in range(5):
                pdf.line(50, 720 - r * 30, 530, 720 - r * 30)
            for col in range(4):
                pdf.line(50 + col * 160, 720, 50 + col * 160, 600)
        pdf.showPage()
    pdf.save()


table_pdf('tables.pdf')
table_pdf('borderless.pdf', borders=False)
table_pdf('locked.pdf', encrypted=True)
pdf = canvas.Canvas(str(root / 'scanned.pdf'))
pdf.rect(20, 20, 200, 200, fill=1)
pdf.showPage()
pdf.save()
pdf = canvas.Canvas(str(root / 'prose.pdf'))
pdf.drawString(50, 700, 'A paragraph without a table.')
pdf.showPage()
pdf.save()
pdf = canvas.Canvas(str(root / 'too-many-pages.pdf'))
for page in range(51):
    pdf.drawString(50, 700, 'Page ' + str(page + 1))
    pdf.showPage()
pdf.save()
