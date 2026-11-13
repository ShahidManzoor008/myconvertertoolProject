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


def layout_regression_pdf(filename):
    """Generate the aligned, multi-page table fixture without checking in a PDF binary."""
    width, height = 842, 595
    pdf = canvas.Canvas(str(root / filename), pagesize=(width, height))
    pdf.setFont('Helvetica', 10)

    def text(x, top, value, right=False):
        y = height - top - 9
        (pdf.drawRightString if right else pdf.drawString)(x, y, value)

    def row(top, values):
        for x, value, right in values:
            text(x, top, value, right)

    text(51, 109, 'Test 1 — Fully bordered table')
    row(137, [(155, 'Employee ID', False), (226, 'Employee Name', False),
              (333, 'Department', False), (441, 'Join Date', False),
              (520, 'Monthly Salary (PKR)', False), (628, 'Status', False)])
    employees = [
        ('EMP-1001', 'Ayesha Khan', 'Electrical', '2021-03-15', '125,000', 'Active'),
        ('EMP-1002', 'Bilal Ahmed', 'Maintenance', '2020-11-02', '98,500', 'Active'),
        ('EMP-1003', 'Sara Malik', 'Instrumentation', '2022-07-19', '112,750', 'On Leave'),
        ('EMP-1004', 'Usman Raza', 'Production', '2019-01-08', '145,000', 'Active'),
        ('EMP-1005', 'Hina Shah', 'Quality Control', '2023-05-22', '87,250', 'Active'),
        ('EMP-1006', 'Danish Ali', 'Electrical', '2024-02-12', '76,000', 'Probation'),
    ]
    for index, values in enumerate(employees):
        top = 161 + index * 24
        row(top, [(155, values[0], False), (226, values[1], False),
                  (333, values[2], False), (468, values[3], False),
                  (616, values[4], True), (628, values[5], False)])

    row(320, [(145, 'Invoice No.', False), (221, 'Customer', False),
              (357, 'Invoice Date', False), (489, 'Subtotal (PKR)', False),
              (574, 'Tax (PKR)', False), (650, 'Total (PKR)', False)])
    invoices = [
        ('INV-24001', 'North Star Traders', '2026-10-02', '250,000.00', '45,000.00', '295,000.00'),
        ('INV-24002', 'Metro Engineering', '2026-10-05', '185,500.00', '33,390.00', '218,890.00'),
        ('INV-24003', 'Crescent Textiles', '2026-10-11', '420,000.00', '75,600.00', '495,600.00'),
        ('INV-24004', 'Prime Automation', '2026-10-14', '96,750.00', '17,415.00', '114,165.00'),
        ('INV-24005', 'Eastern Supplies', '2026-10-20', '310,250.00', '55,845.00', '366,095.00'),
    ]
    for index, values in enumerate(invoices):
        top = 344 + index * 24
        row(top, [(145, values[0], False), (221, values[1], False),
                  (357, values[2], False), (520, values[3], True),
                  (606, values[4], True), (697, values[5], True)])
    pdf.showPage()

    row(62, [(149, 'Product Code', False), (226, 'Description', False),
             (404, 'Qty', False), (449, 'Unit Price', False),
             (535, 'Discount %', False), (605, 'Net Amount', False)])
    products = [
        ('MTR-001', 'Digital Multimeter', '12', '8,500.00', '5%', '96,900.00'),
        ('SNS-014', 'Proximity Sensor', '25', '3,200.00', '0%', '80,000.00'),
        ('DRV-220', 'Variable Frequency Drive', '4', '78,000.00', '7.5%', '288,600.00'),
        ('CBL-035', 'Copper Cable (meter)', '500', '185.00', '2%', '90,650.00'),
        ('PLC-008', 'Programmable Logic Controller', '3', '125,000.00', '10%', '337,500.00'),
    ]
    for index, values in enumerate(products):
        top = 86 + index * 24
        row(top, [(149, values[0], False), (226, values[1], False),
                  (438, values[2], True), (523, values[3], True),
                  (594, values[4], True), (693, values[5], True)])
    pdf.showPage()

    text(353, 84, 'Q1')
    text(566, 84, 'Q2')
    row(106, [(191, 'Region', False), (280, 'Jan', False), (351, 'Feb', False),
              (422, 'Mar', False), (493, 'Apr', False), (563, 'May', False), (635, 'Jun', False)])
    quarters = [
        ('North', '125000', '132500', '128000', '141000', '138500', '145000'),
        ('South', '98500', '102000', '107500', '110000', '114500', '118000'),
        ('East', '113000', '116500', '119000', '121500', '124000', '129500'),
        ('West', '89000', '92500', '96000', '99500', '103000', '106500'),
    ]
    for index, values in enumerate(quarters):
        top = 128 + index * 22
        row(top, [(196, values[0], False)] + [
            (x, value, True) for x, value in zip([306, 377, 448, 518, 589, 660], values[1:])
        ])

    text(51, 235, 'Test 5 — Borderless table with blank cells')
    row(263, [(149, 'Asset Tag', False), (220, 'Machine', False), (328, 'Location', False),
              (427, 'Last Service', False), (512, 'Next Service', False), (597, 'Remarks', False)])
    assets = [
        ('AST-001', 'Air Compressor', 'Utility Room', '2026-01-12', '2026-07-12', 'OK'),
        ('AST-002', 'Loom Machine 14', 'Production Hall', '2026-02-05', '', 'Pending schedule'),
        ('AST-003', 'Hydraulic Pump', '', '2026-03-18', '2026-09-18', ''),
        ('AST-004', 'Cooling Tower', 'Roof', '', '2026-12-01', 'New asset'),
        ('AST-005', 'Generator 2', 'Power House', '2026-04-20', '2026-10-20', 'Check vibration'),
    ]
    for index, values in enumerate(assets):
        top = 287 + index * 24
        row(top, [(149, values[0], False), (220, values[1], False),
                  (328, values[2], False), (427, values[3], False),
                  (512, values[4], False), (597, values[5], False)])

    text(51, 427, 'Test 6 — Financial table with negative values and totals')
    row(455, [(158, 'Account', False), (342, 'Debit (PKR)', False),
              (455, 'Credit (PKR)', False), (569, 'Net Balance (PKR)', False)])
    for index, values in enumerate([
        ('Cash', '250,000', '175,000', '75,000'),
        ('Accounts Receivable', '420,000', '120,000', '300,000'),
    ]):
        top = 479 + index * 24
        row(top, [(158, values[0], False), (443, values[1], True),
                  (557, values[2], True), (684, values[3], True)])
    pdf.showPage()

    row(62, [(158, 'Account', False), (342, 'Debit (PKR)', False),
             (455, 'Credit (PKR)', False), (569, 'Net Balance (PKR)', False)])
    for index, values in enumerate([
        ('Accounts Payable', '90,000', '240,000', '-150,000'),
        ('Inventory', '310,000', '85,000', '225,000'),
        ('Utilities Expense', '65,500', '0', '65,500'),
        ('TOTAL', '1,135,500', '620,000', '515,500'),
    ]):
        top = 86 + index * 24
        row(top, [(158, values[0], False), (443, values[1], True),
                  (557, values[2], True), (684, values[3], True)])
    pdf.save()


table_pdf('tables.pdf')
table_pdf('borderless.pdf', borders=False)
table_pdf('locked.pdf', encrypted=True)
layout_regression_pdf('pdf-table-layout-regression.pdf')
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
