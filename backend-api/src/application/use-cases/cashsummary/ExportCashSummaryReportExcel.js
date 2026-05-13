/**
 * Export Cash Summary Report to Excel
 */
const ExcelJS = require('exceljs');

class ExportCashSummaryReportExcel {
  constructor(cashWithdrawalRepository, pettyCashAssignmentRepository, otherExpenseRepository) {
    this.cashWithdrawalRepository = cashWithdrawalRepository;
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
    this.otherExpenseRepository = otherExpenseRepository;
  }

  async execute(fromDate, toDate) {
    if (!fromDate || !toDate) {
      throw new Error('From date and to date are required');
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    // Fetch all data
    const withdrawals = await this.cashWithdrawalRepository.findByDateRange(from, to);
    const assignments = await this.pettyCashAssignmentRepository.findByDateRange(from, to);
    const expenses = await this.otherExpenseRepository.findByDateRange(from, to);

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalPettyCash = assignments.reduce((sum, a) => sum + a.assignedAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const availableBalance = totalWithdrawn - totalPettyCash - totalExpenses;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

    const isSingleDay = fromDate === toDate;
    const dateLabel = isSingleDay
      ? `Report Date: ${fmtDate(fromDate)}`
      : `Period: ${fmtDate(fromDate)} — ${fmtDate(toDate)}`;

    // ── Build Workbook ─────────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Super Shine Cargo Service';
    workbook.created = new Date();

    // ── Sheet 1: Report ────────────────────────────────────────────────────
    const sheet = workbook.addWorksheet('Cash Summary Report', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
    });

    const DARK_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF101036' } };
    const BLUE_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a8a' } };
    const LIGHT_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    const ALT_FILL   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    const TOTAL_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    const WHITE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

    const WHITE_FONT = { color: { argb: 'FFFFFFFF' }, bold: true };
    const DARK_FONT  = { color: { argb: 'FF101036' }, bold: true };
    const BLUE_FONT  = { color: { argb: 'FF1e3a8a' }, bold: true };
    const GRAY_FONT  = { color: { argb: 'FF6B7280' } };
    const BODY_FONT  = { color: { argb: 'FF374151' } };

    const THIN_BORDER = {
      top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
    };

    // Column widths
    sheet.columns = [
      { key: 'col1', width: 16 },
      { key: 'col2', width: 14 },
      { key: 'col3', width: 20 },
      { key: 'col4', width: 30 },
      { key: 'col5', width: 16 },
      { key: 'col6', width: 20 },
    ];

    // ── Row 1: Company header ──────────────────────────────────────────────
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'SUPER SHINE CARGO SERVICE';
    titleCell.font = { ...WHITE_FONT, size: 14 };
    titleCell.fill = DARK_FILL;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 28;

    // ── Row 2: Sub-title ──────────────────────────────────────────────────
    sheet.mergeCells('A2:D2');
    const subCell = sheet.getCell('A2');
    subCell.value = 'Cash Summary Report';
    subCell.font = { ...WHITE_FONT, bold: false, size: 10 };
    subCell.fill = DARK_FILL;
    subCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    sheet.mergeCells('E2:F2');
    const dateCell = sheet.getCell('E2');
    dateCell.value = dateLabel;
    dateCell.font = { ...WHITE_FONT, bold: false, size: 10 };
    dateCell.fill = DARK_FILL;
    dateCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    sheet.getRow(2).height = 20;

    // ── Row 3: blank spacer ───────────────────────────────────────────────
    sheet.getRow(3).height = 6;

    // ── Rows 4-5: Summary cards ───────────────────────────────────────────
    const summaryData = [
      { label: 'Total Cash Withdrawn', value: totalWithdrawn, sub: `${withdrawals.length} withdrawals`, col: 'A' },
      { label: 'Petty Cash Issued',    value: totalPettyCash, sub: `${assignments.length} assignments`, col: 'C' },
      { label: 'Other Expenses',       value: totalExpenses,  sub: `${expenses.length} expenses`,      col: 'E' },
    ];

    summaryData.forEach(({ label, value, sub, col }) => {
      const endCol = String.fromCharCode(col.charCodeAt(0) + 1);
      sheet.mergeCells(`${col}4:${endCol}4`);
      sheet.mergeCells(`${col}5:${endCol}5`);

      const labelCell = sheet.getCell(`${col}4`);
      labelCell.value = label.toUpperCase();
      labelCell.font = { ...GRAY_FONT, size: 8, bold: true };
      labelCell.fill = LIGHT_FILL;
      labelCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      const valCell = sheet.getCell(`${col}5`);
      valCell.value = value;
      valCell.numFmt = '#,##0.00';
      valCell.font = { ...DARK_FONT, size: 12 };
      valCell.fill = LIGHT_FILL;
      valCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    });
    sheet.getRow(4).height = 16;
    sheet.getRow(5).height = 22;

    // ── Row 6: Available Balance card ─────────────────────────────────────
    sheet.mergeCells('A6:B6');
    sheet.mergeCells('A7:B7');
    
    const balLabelCell = sheet.getCell('A6');
    balLabelCell.value = 'AVAILABLE BALANCE';
    balLabelCell.font = { ...GRAY_FONT, size: 8, bold: true };
    balLabelCell.fill = LIGHT_FILL;
    balLabelCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    const balValCell = sheet.getCell('A7');
    balValCell.value = availableBalance;
    balValCell.numFmt = '#,##0.00';
    balValCell.font = { color: { argb: availableBalance >= 0 ? 'FF10b981' : 'FFef4444' }, bold: true, size: 12 };
    balValCell.fill = LIGHT_FILL;
    balValCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    sheet.getRow(6).height = 16;
    sheet.getRow(7).height = 22;

    // ── Row 8: blank spacer ───────────────────────────────────────────────
    sheet.getRow(8).height = 6;

    let currentRow = 9;

    // ── Cash Withdrawals Table ────────────────────────────────────────────
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const cwTitle = sheet.getCell(`A${currentRow}`);
    cwTitle.value = `Cash Withdrawals (${withdrawals.length})`;
    cwTitle.font = { ...DARK_FONT, size: 10 };
    cwTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    currentRow++;

    if (withdrawals.length > 0) {
      const headers = ['Withdrawal ID', 'Date', 'Bank Name', 'Amount (LKR)', 'Recorded By', 'Notes'];
      const headerRow = sheet.getRow(currentRow);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = WHITE_FONT;
        cell.fill = BLUE_FILL;
        cell.alignment = { horizontal: i === 3 ? 'right' : 'center', vertical: 'middle' };
        cell.border = THIN_BORDER;
      });
      headerRow.height = 20;
      currentRow++;

      withdrawals.forEach((w, idx) => {
        const row = sheet.getRow(currentRow);
        const fill = idx % 2 === 0 ? WHITE_FILL : ALT_FILL;

        const cells = [
          { v: w.withdrawalId || '-',        fmt: '@',        align: 'left'   },
          { v: fmtDate(w.withdrawalDate),    fmt: '@',        align: 'center' },
          { v: w.bankName || '-',            fmt: '@',        align: 'left'   },
          { v: w.amount,                     fmt: '#,##0.00', align: 'right', font: BLUE_FONT },
          { v: w.createdByName || '-',       fmt: '@',        align: 'left'   },
          { v: w.notes || '-',               fmt: '@',        align: 'left'   },
        ];

        cells.forEach((c, ci) => {
          const cell = row.getCell(ci + 1);
          cell.value = c.v;
          cell.numFmt = c.fmt;
          cell.font = c.font || BODY_FONT;
          cell.fill = fill;
          cell.alignment = { horizontal: c.align, vertical: 'middle' };
          cell.border = THIN_BORDER;
        });
        row.height = 18;
        currentRow++;
      });

      // Total row
      const totalRow = sheet.getRow(currentRow);
      const totalValues = ['', '', 'TOTAL', totalWithdrawn, '', ''];
      totalValues.forEach((v, i) => {
        const cell = totalRow.getCell(i + 1);
        cell.value = v;
        cell.numFmt = i === 3 ? '#,##0.00' : '@';
        cell.font = BLUE_FONT;
        cell.fill = TOTAL_FILL;
        cell.alignment = { horizontal: i === 3 ? 'right' : i === 2 ? 'left' : 'center', vertical: 'middle', indent: i === 2 ? 1 : 0 };
        cell.border = { ...THIN_BORDER, top: { style: 'medium', color: { argb: 'FF1e3a8a' } } };
      });
      totalRow.height = 20;
      currentRow++;
    }

    currentRow += 2;

    // ── Petty Cash Issued Table ───────────────────────────────────────────
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const pcTitle = sheet.getCell(`A${currentRow}`);
    pcTitle.value = `Petty Cash Issued (${assignments.length})`;
    pcTitle.font = { ...DARK_FONT, size: 10 };
    pcTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    currentRow++;

    if (assignments.length > 0) {
      const headers = ['Assignment ID', 'Date', 'Job ID', 'Assigned To', 'Amount (LKR)', 'Status'];
      const headerRow = sheet.getRow(currentRow);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = WHITE_FONT;
        cell.fill = BLUE_FILL;
        cell.alignment = { horizontal: i === 4 ? 'right' : 'center', vertical: 'middle' };
        cell.border = THIN_BORDER;
      });
      headerRow.height = 20;
      currentRow++;

      assignments.forEach((a, idx) => {
        const row = sheet.getRow(currentRow);
        const fill = idx % 2 === 0 ? WHITE_FILL : ALT_FILL;

        const cells = [
          { v: a.assignmentId || '-',     fmt: '0',        align: 'center' },
          { v: fmtDate(a.assignedDate),   fmt: '@',        align: 'center' },
          { v: a.jobId || '-',            fmt: '@',        align: 'left'   },
          { v: a.assignedToName || '-',   fmt: '@',        align: 'left'   },
          { v: a.assignedAmount,          fmt: '#,##0.00', align: 'right', font: BLUE_FONT },
          { v: a.status || '-',           fmt: '@',        align: 'center' },
        ];

        cells.forEach((c, ci) => {
          const cell = row.getCell(ci + 1);
          cell.value = c.v;
          cell.numFmt = c.fmt;
          cell.font = c.font || BODY_FONT;
          cell.fill = fill;
          cell.alignment = { horizontal: c.align, vertical: 'middle' };
          cell.border = THIN_BORDER;
        });
        row.height = 18;
        currentRow++;
      });

      // Total row
      const totalRow = sheet.getRow(currentRow);
      const totalValues = ['', '', '', 'TOTAL', totalPettyCash, ''];
      totalValues.forEach((v, i) => {
        const cell = totalRow.getCell(i + 1);
        cell.value = v;
        cell.numFmt = i === 4 ? '#,##0.00' : '@';
        cell.font = BLUE_FONT;
        cell.fill = TOTAL_FILL;
        cell.alignment = { horizontal: i === 4 ? 'right' : i === 3 ? 'left' : 'center', vertical: 'middle', indent: i === 3 ? 1 : 0 };
        cell.border = { ...THIN_BORDER, top: { style: 'medium', color: { argb: 'FF1e3a8a' } } };
      });
      totalRow.height = 20;
      currentRow++;
    }

    currentRow += 2;

    // ── Other Expenses Table ──────────────────────────────────────────────
    sheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const oeTitle = sheet.getCell(`A${currentRow}`);
    oeTitle.value = `Other Expenses (${expenses.length})`;
    oeTitle.font = { ...DARK_FONT, size: 10 };
    oeTitle.alignment = { horizontal: 'left', vertical: 'middle' };
    currentRow++;

    if (expenses.length > 0) {
      const headers = ['Expense ID', 'Date', 'Category', 'Description', 'Amount (LKR)', 'Payment Method'];
      const headerRow = sheet.getRow(currentRow);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = WHITE_FONT;
        cell.fill = BLUE_FILL;
        cell.alignment = { horizontal: i === 4 ? 'right' : 'center', vertical: 'middle' };
        cell.border = THIN_BORDER;
      });
      headerRow.height = 20;
      currentRow++;

      expenses.forEach((e, idx) => {
        const row = sheet.getRow(currentRow);
        const fill = idx % 2 === 0 ? WHITE_FILL : ALT_FILL;

        const cells = [
          { v: e.expenseId || '-',      fmt: '@',        align: 'left'   },
          { v: fmtDate(e.expenseDate),  fmt: '@',        align: 'center' },
          { v: e.category || '-',       fmt: '@',        align: 'left'   },
          { v: e.description || '-',    fmt: '@',        align: 'left'   },
          { v: e.amount,                fmt: '#,##0.00', align: 'right', font: BLUE_FONT },
          { v: e.paymentMethod || '-',  fmt: '@',        align: 'left'   },
        ];

        cells.forEach((c, ci) => {
          const cell = row.getCell(ci + 1);
          cell.value = c.v;
          cell.numFmt = c.fmt;
          cell.font = c.font || BODY_FONT;
          cell.fill = fill;
          cell.alignment = { horizontal: c.align, vertical: 'middle' };
          cell.border = THIN_BORDER;
        });
        row.height = 18;
        currentRow++;
      });

      // Total row
      const totalRow = sheet.getRow(currentRow);
      const totalValues = ['', '', '', 'TOTAL', totalExpenses, ''];
      totalValues.forEach((v, i) => {
        const cell = totalRow.getCell(i + 1);
        cell.value = v;
        cell.numFmt = i === 4 ? '#,##0.00' : '@';
        cell.font = BLUE_FONT;
        cell.fill = TOTAL_FILL;
        cell.alignment = { horizontal: i === 4 ? 'right' : i === 3 ? 'left' : 'center', vertical: 'middle', indent: i === 3 ? 1 : 0 };
        cell.border = { ...THIN_BORDER, top: { style: 'medium', color: { argb: 'FF1e3a8a' } } };
      });
      totalRow.height = 20;
    }

    // ── Sheet 2: Summary ──────────────────────────────────────────────────
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [{ width: 30 }, { width: 20 }];

    const addSummaryRow = (label, value, isCurrency = true) => {
      const r = summarySheet.addRow([label, value]);
      r.getCell(1).font = { bold: true, color: { argb: 'FF374151' } };
      r.getCell(2).numFmt = isCurrency ? '#,##0.00' : '0';
      r.getCell(2).alignment = { horizontal: 'right' };
      r.getCell(2).font = { bold: true, color: { argb: 'FF101036' } };
    };

    summarySheet.addRow(['CASH SUMMARY REPORT']).getCell(1).font = { bold: true, size: 13, color: { argb: 'FF101036' } };
    summarySheet.addRow([dateLabel]).getCell(1).font = { color: { argb: 'FF6B7280' } };
    summarySheet.addRow([]);
    addSummaryRow('Total Cash Withdrawn (LKR)', totalWithdrawn);
    addSummaryRow('Petty Cash Issued (LKR)', totalPettyCash);
    addSummaryRow('Other Expenses (LKR)', totalExpenses);
    addSummaryRow('Available Balance (LKR)', availableBalance);
    summarySheet.addRow([]);
    addSummaryRow('Total Withdrawals', withdrawals.length, false);
    addSummaryRow('Total Assignments', assignments.length, false);
    addSummaryRow('Total Expenses', expenses.length, false);

    // ── Return buffer ─────────────────────────────────────────────────────
    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = ExportCashSummaryReportExcel;
