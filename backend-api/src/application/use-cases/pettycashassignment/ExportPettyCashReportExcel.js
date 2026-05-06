/**
 * Export Petty Cash Report to Excel
 * Generates a professional Excel report of petty cash assignments for a specific date
 */
const ExcelJS = require('exceljs');

class ExportPettyCashReportExcel {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(fromDate, toDate) {
    if (!fromDate) throw new Error('From date is required');
    const effectiveTo = toDate || fromDate;

    const from = new Date(fromDate);
    const to   = new Date(effectiveTo);
    if (isNaN(from.getTime())) throw new Error('Invalid from date. Use YYYY-MM-DD');
    if (isNaN(to.getTime()))   throw new Error('Invalid to date. Use YYYY-MM-DD');

    const rows = await this.pettyCashAssignmentRepository.findByDateRange(from, to);
    if (!rows || rows.length === 0) throw new Error('No data available for the selected date range');

    // Map rows
    const assignments = rows.map(row => ({
      assignmentId:   row.assignmentId,
      jobId:          row.jobId,
      customerName:   row.customerName || '-',
      assignedToName: row.assignedToName || '-',
      assignedAmount: parseFloat(row.assignedAmount) || 0,
      settledAmount:  parseFloat(row.settledAmount)  || 0,
      balanceAmount:  parseFloat(row.balanceAmount)  || 0,
      overAmount:     parseFloat(row.overAmount)     || 0,
      status:         row.status || 'Assigned',
      assignmentDate: row.assignedDate,
      settlementDate: row.settlementDate,
      assignmentCount: parseInt(row.assignmentCount) || 1,
    }));

    const totalAssigned = assignments.reduce((s, a) => s + a.assignedAmount, 0);
    const totalSettled  = assignments.reduce((s, a) => s + a.settledAmount,  0);
    const netBalance    = assignments.reduce((s, a) => s + (a.balanceAmount - a.overAmount), 0);
    const jobCount      = new Set(assignments.map(a => a.jobId)).size;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

    const isSingleDay = fromDate === effectiveTo;
    const dateLabel = isSingleDay
      ? `Report Date: ${fmtDate(fromDate)}`
      : `Period: ${fmtDate(fromDate)} — ${fmtDate(effectiveTo)}`;

    // ── Build Workbook ─────────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Super Shine Cargo Service';
    workbook.created = new Date();

    // ── Sheet 1: Report ────────────────────────────────────────────────────
    const sheet = workbook.addWorksheet('Petty Cash Report', {
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
    const GREEN_FONT = { color: { argb: 'FF065F46' }, bold: true };
    const AMBER_FONT = { color: { argb: 'FF92400E' }, bold: true };

    const THIN_BORDER = {
      top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
    };

    // Column widths
    sheet.columns = [
      { key: 'num',        width: 6  },
      { key: 'jobId',      width: 14 },
      { key: 'cust',       width: 28 },
      { key: 'user',       width: 22 },
      { key: 'asgn',       width: 18 },
      { key: 'setl',       width: 18 },
      { key: 'balance',    width: 18 },
      { key: 'overdue',    width: 18 },
      { key: 'status',     width: 22 },
      { key: 'assignDate', width: 14 },
      { key: 'settleDate', width: 14 },
    ];

    // ── Row 1: Company header ──────────────────────────────────────────────
    sheet.mergeCells('A1:K1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'SUPER SHINE CARGO SERVICE';
    titleCell.font = { ...WHITE_FONT, size: 14 };
    titleCell.fill = DARK_FILL;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 28;

    // ── Row 2: Sub-title ──────────────────────────────────────────────────
    sheet.mergeCells('A2:F2');
    const subCell = sheet.getCell('A2');
    subCell.value = 'Petty Cash Report — Job-wise Breakdown';
    subCell.font = { ...WHITE_FONT, bold: false, size: 10 };
    subCell.fill = DARK_FILL;
    subCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    sheet.mergeCells('G2:K2');
    const dateCell = sheet.getCell('G2');
    dateCell.value = dateLabel;
    dateCell.font = { ...WHITE_FONT, bold: false, size: 10 };
    dateCell.fill = DARK_FILL;
    dateCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    sheet.getRow(2).height = 20;

    // ── Row 3: blank spacer ───────────────────────────────────────────────
    sheet.getRow(3).height = 6;

    // ── Rows 4-5: Summary cards ───────────────────────────────────────────
    const totalBalance = assignments.reduce((s, a) => s + a.balanceAmount, 0);
    const totalOverDue = assignments.reduce((s, a) => s + a.overAmount, 0);
    
    const summaryData = [
      { label: 'Total Assigned',      value: totalAssigned, sub: `${assignments.length} assignments`, col: 'A' },
      { label: 'Total Settled',       value: totalSettled,  sub: 'Completed',                         col: 'C' },
      { label: 'Total Balance',       value: totalBalance,  sub: 'To be returned',                    col: 'E' },
      { label: 'Total Over Due',      value: totalOverDue,  sub: 'Overdue collection',                col: 'G' },
      { label: 'Jobs Covered',        value: jobCount,      sub: 'Unique jobs',                       col: 'I', isCount: true },
    ];

    summaryData.forEach(({ label, value, sub, col, isCount }) => {
      const endCol = String.fromCharCode(col.charCodeAt(0) + 1);
      sheet.mergeCells(`${col}4:${endCol}4`);
      sheet.mergeCells(`${col}5:${endCol}5`);

      const labelCell = sheet.getCell(`${col}4`);
      labelCell.value = label.toUpperCase();
      labelCell.font = { ...GRAY_FONT, size: 8, bold: true };
      labelCell.fill = LIGHT_FILL;
      labelCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      const valCell = sheet.getCell(`${col}5`);
      valCell.value = isCount ? value : value;
      valCell.numFmt = isCount ? '0' : '#,##0.00';
      valCell.font = { ...DARK_FONT, size: 12 };
      valCell.fill = LIGHT_FILL;
      valCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    });
    sheet.getRow(4).height = 16;
    sheet.getRow(5).height = 22;

    // ── Row 6: blank spacer ───────────────────────────────────────────────
    sheet.getRow(6).height = 6;

    // ── Row 7: Table header ───────────────────────────────────────────────
    const headers = ['#', 'Job ID', 'Customer', 'Assigned To', 'Assigned (LKR)', 'Settled (LKR)', 'Balance (LKR)', 'Over Due (LKR)', 'Status', 'Assigned Date', 'Settle Date'];
    const headerRow = sheet.getRow(7);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = WHITE_FONT;
      cell.fill = BLUE_FILL;
      cell.alignment = { horizontal: i >= 4 && i <= 7 ? 'right' : 'center', vertical: 'middle' };
      cell.border = THIN_BORDER;
    });
    headerRow.height = 20;

    // ── Data rows ─────────────────────────────────────────────────────────
    assignments.forEach((a, idx) => {
      const rowNum = 8 + idx;
      const row = sheet.getRow(rowNum);
      const fill = idx % 2 === 0 ? WHITE_FILL : ALT_FILL;
      const isGrouped = a.assignmentCount > 1;

      const cells = [
        { v: idx + 1,           fmt: '0',          align: 'center' },
        { v: a.jobId || '-',    fmt: '@',          align: 'left'   },
        { v: a.customerName,    fmt: '@',          align: 'left'   },
        { v: a.assignedToName,  fmt: '@',          align: 'left'   },
        { v: a.assignedAmount,  fmt: '#,##0.00',   align: 'right', isGrouped: isGrouped, count: a.assignmentCount },
        { v: a.settledAmount,   fmt: '#,##0.00',   align: 'right', font: GREEN_FONT },
        { v: a.balanceAmount,   fmt: '#,##0.00',   align: 'right', font: a.balanceAmount > 0 ? AMBER_FONT : BODY_FONT },
        { v: a.overAmount,      fmt: '#,##0.00',   align: 'right', font: a.overAmount > 0 ? { color: { argb: 'FFDC2626' }, bold: true } : BODY_FONT },
        { v: a.status,          fmt: '@',          align: 'center' },
        { v: fmtDate(a.assignmentDate), fmt: '@', align: 'center' },
        { v: fmtDate(a.settlementDate), fmt: '@', align: 'center' },
      ];

      cells.forEach((c, ci) => {
        const cell = row.getCell(ci + 1);
        
        // Special handling for assigned amount with count
        if (c.isGrouped && ci === 4) {
          // Use rich text to make the count bold and larger (13pt)
          cell.value = {
            richText: [
              { text: new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(c.v) },
              { font: { bold: true, color: { argb: 'FF374151' }, size: 13 }, text: ` (${c.count})` }
            ]
          };
          cell.font = BODY_FONT;
        } else {
          cell.value = c.v;
          cell.numFmt = c.fmt;
          cell.font = c.font || BODY_FONT;
        }
        
        cell.fill = fill;
        cell.alignment = { horizontal: c.align, vertical: 'middle' };
        cell.border = THIN_BORDER;
      });
      row.height = 18;
    });

    // ── Totals row ────────────────────────────────────────────────────────
    const totalRowNum = 8 + assignments.length;
    const totalRow = sheet.getRow(totalRowNum);
    const totalValues = ['', '', '', 'TOTAL', totalAssigned, totalSettled, totalBalance, totalOverDue, '', '', ''];
    totalValues.forEach((v, i) => {
      const cell = totalRow.getCell(i + 1);
      cell.value = v;
      cell.numFmt = i >= 4 && i <= 7 ? '#,##0.00' : '@';
      cell.font = BLUE_FONT;
      cell.fill = TOTAL_FILL;
      cell.alignment = { horizontal: i >= 4 && i <= 7 ? 'right' : i === 3 ? 'left' : 'center', vertical: 'middle', indent: i === 3 ? 1 : 0 };
      cell.border = { ...THIN_BORDER, top: { style: 'medium', color: { argb: 'FF1e3a8a' } } };
    });
    totalRow.height = 20;

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

    const summaryTotalBalance = assignments.reduce((s, a) => s + a.balanceAmount, 0);
    const summaryTotalOverDue = assignments.reduce((s, a) => s + a.overAmount, 0);

    summarySheet.addRow(['PETTY CASH REPORT SUMMARY']).getCell(1).font = { bold: true, size: 13, color: { argb: 'FF101036' } };
    summarySheet.addRow([dateLabel]).getCell(1).font = { color: { argb: 'FF6B7280' } };
    summarySheet.addRow([]);
    addSummaryRow('Total Assigned (LKR)', totalAssigned);
    addSummaryRow('Total Settled (LKR)',  totalSettled);
    addSummaryRow('Total Balance (LKR)', summaryTotalBalance);
    addSummaryRow('Total Over Due (LKR)', summaryTotalOverDue);
    summarySheet.addRow([]);
    addSummaryRow('Total Assignments', assignments.length, false);
    addSummaryRow('Unique Jobs Covered', jobCount, false);

    // ── Return buffer ─────────────────────────────────────────────────────
    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = ExportPettyCashReportExcel;
