/**
 * Export Transporters Report to Excel
 * Generates a professional Excel report of transporter payments for a specific date range
 */
const ExcelJS = require('exceljs');

class ExportTransportersReportExcel {
  constructor(jobRepository, transporterRepository) {
    this.jobRepository = jobRepository;
    this.transporterRepository = transporterRepository;
  }

  async execute(fromDate, toDate) {
    if (!fromDate) throw new Error('From date is required');
    const effectiveTo = toDate || fromDate;

    const from = new Date(fromDate);
    const to = new Date(effectiveTo);
    if (isNaN(from.getTime())) throw new Error('Invalid from date. Use YYYY-MM-DD');
    if (isNaN(to.getTime())) throw new Error('Invalid to date. Use YYYY-MM-DD');

    // Fetch all jobs and transporters
    const jobs = await this.jobRepository.findAll();
    const transporters = await this.transporterRepository.findAll();

    if (!jobs || jobs.length === 0) throw new Error('No jobs found');
    if (!transporters || transporters.length === 0) throw new Error('No transporters found');

    // Filter jobs by payment date
    const filteredJobs = jobs.filter(job => {
      const payItems = Array.isArray(job?.payItems) ? job.payItems : [];
      const transporterCostItems = payItems.filter(item => {
        const label = (item?.description || item?.name || '').toLowerCase().trim();
        // Only check for new format with place names
        return label.startsWith('transporter cost (from');
      });

      if (transporterCostItems.length === 0) return false;

      const item = transporterCostItems[0];
      const paidAmount = parseFloat(item.paidAmount || 0) || 0;

      if (paidAmount <= 0) return false;

      const paymentDate = item.paidAt ? new Date(item.paidAt) : null;
      if (!paymentDate) return false;

      to.setHours(23, 59, 59, 999);
      return paymentDate >= from && paymentDate <= to;
    });

    // Build transporter reports
    const reports = {};

    filteredJobs.forEach(job => {
      const transporterName = (job?.transporter || '').trim().toLowerCase();
      const transporterId = (job?.transporterId || '').trim().toLowerCase();

      if (!transporterName && !transporterId) return;

      const matchingTransporter = transporters.find(t => {
        const tName = (t?.name || '').trim().toLowerCase();
        const tId = (t?.transporterId || '').trim().toLowerCase();
        return (transporterId && tId === transporterId) || (transporterName && tName === transporterName);
      });

      if (!matchingTransporter) return;

      const key = matchingTransporter.transporterId;
      if (!reports[key]) {
        reports[key] = {
          transporterId: matchingTransporter.transporterId,
          transporterName: matchingTransporter.name,
          mainPhone: matchingTransporter.mainPhone || matchingTransporter.phone,
          email: matchingTransporter.email,
          jobs: [],
          totalCost: 0,
          totalPaid: 0,
          totalBalance: 0,
        };
      }

      const payItems = Array.isArray(job?.payItems) ? job.payItems : [];
      const transporterCostItems = payItems.filter(item => {
        const label = (item?.description || item?.name || '').toLowerCase().trim();
        // Only check for new format with place names
        return label.startsWith('transporter cost (from');
      });

      if (transporterCostItems.length > 0) {
        const item = transporterCostItems[0];
        const cost = parseFloat(item.actualCost || item.amount || 0) || 0;
        const paid = parseFloat(item.paidAmount || 0) || 0;
        const balance = Math.max(0, cost - paid);

        reports[key].jobs.push({
          jobId: job.jobId,
          category: job.shipmentCategory,
          deliveryDate: job.transportDeliveryDate,
          cost,
          paid,
          balance,
          status: item.paymentStatus || 'Unpaid',
        });

        reports[key].totalCost += cost;
        reports[key].totalPaid += paid;
        reports[key].totalBalance += balance;
      }
    });

    const reportsArray = Object.values(reports).sort((a, b) =>
      a.transporterName.localeCompare(b.transporterName)
    );

    if (reportsArray.length === 0) throw new Error('No transporter payments found for the selected date range');

    const totalCost = reportsArray.reduce((s, r) => s + r.totalCost, 0);
    const totalPaid = reportsArray.reduce((s, r) => s + r.totalPaid, 0);
    const totalBalance = reportsArray.reduce((s, r) => s + r.totalBalance, 0);
    const jobCount = reportsArray.reduce((s, r) => s + r.jobs.length, 0);

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
    const sheet = workbook.addWorksheet('Transporters Report', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
    });

    const DARK_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF101036' } };
    const BLUE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a8a' } };
    const LIGHT_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    const ALT_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    const TOTAL_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    const WHITE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

    const WHITE_FONT = { color: { argb: 'FFFFFFFF' }, bold: true };
    const DARK_FONT = { color: { argb: 'FF101036' }, bold: true };
    const BLUE_FONT = { color: { argb: 'FF1e3a8a' }, bold: true };
    const GRAY_FONT = { color: { argb: 'FF6B7280' } };
    const BODY_FONT = { color: { argb: 'FF374151' } };
    const GREEN_FONT = { color: { argb: 'FF065F46' }, bold: true };
    const AMBER_FONT = { color: { argb: 'FF92400E' }, bold: true };

    const THIN_BORDER = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    };

    // Column widths
    sheet.columns = [
      { key: 'num', width: 6 },
      { key: 'id', width: 14 },
      { key: 'name', width: 28 },
      { key: 'phone', width: 18 },
      { key: 'email', width: 24 },
      { key: 'cost', width: 20 },
      { key: 'paid', width: 20 },
      { key: 'balance', width: 20 },
      { key: 'jobs', width: 10 },
    ];

    // ── Row 1: Company header ──────────────────────────────────────────────
    sheet.mergeCells('A1:I1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'SUPER SHINE CARGO SERVICE';
    titleCell.font = { ...WHITE_FONT, size: 14 };
    titleCell.fill = DARK_FILL;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 28;

    // ── Row 2: Sub-title ──────────────────────────────────────────────────
    sheet.mergeCells('A2:F2');
    const subCell = sheet.getCell('A2');
    subCell.value = 'Transporters Report — Payment Details';
    subCell.font = { ...WHITE_FONT, bold: false, size: 10 };
    subCell.fill = DARK_FILL;
    subCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    sheet.mergeCells('G2:I2');
    const dateCell = sheet.getCell('G2');
    dateCell.value = dateLabel;
    dateCell.font = { ...WHITE_FONT, bold: false, size: 10 };
    dateCell.fill = DARK_FILL;
    dateCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    sheet.getRow(2).height = 20;

    // ── Row 3: blank spacer ───────────────────────────────────────────────
    sheet.getRow(3).height = 6;

    // ── Rows 4-5: Summary cards ───────────────────────────────────────────
    const summaryData = [
      { label: 'Total Cost', value: totalCost, sub: `${reportsArray.length} transporters`, col: 'A' },
      { label: 'Total Paid', value: totalPaid, sub: 'Completed', col: 'C' },
      { label: 'Outstanding Balance', value: totalBalance, sub: 'Pending payment', col: 'E' },
      { label: 'Jobs Covered', value: jobCount, sub: 'Total jobs', col: 'G', isCount: true },
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
    const headers = ['#', 'Transporter ID', 'Transporter Name', 'Phone', 'Email', 'Total Cost (LKR)', 'Total Paid (LKR)', 'Balance (LKR)', 'Jobs'];
    const headerRow = sheet.getRow(7);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = WHITE_FONT;
      cell.fill = BLUE_FILL;
      cell.alignment = { horizontal: i >= 5 && i <= 7 ? 'right' : 'center', vertical: 'middle' };
      cell.border = THIN_BORDER;
    });
    headerRow.height = 20;

    // ── Data rows ─────────────────────────────────────────────────────────
    reportsArray.forEach((r, idx) => {
      const rowNum = 8 + idx;
      const row = sheet.getRow(rowNum);
      const fill = idx % 2 === 0 ? WHITE_FILL : ALT_FILL;

      const cells = [
        { v: idx + 1, fmt: '0', align: 'center' },
        { v: r.transporterId || '-', fmt: '@', align: 'left' },
        { v: r.transporterName, fmt: '@', align: 'left' },
        { v: r.mainPhone || '-', fmt: '@', align: 'left' },
        { v: r.email || '-', fmt: '@', align: 'left' },
        { v: r.totalCost, fmt: '#,##0.00', align: 'right' },
        { v: r.totalPaid, fmt: '#,##0.00', align: 'right', font: GREEN_FONT },
        { v: r.totalBalance, fmt: '#,##0.00', align: 'right', font: r.totalBalance > 0 ? AMBER_FONT : GREEN_FONT },
        { v: r.jobs.length, fmt: '0', align: 'center' },
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
    });

    // ── Totals row ────────────────────────────────────────────────────────
    const totalRowNum = 8 + reportsArray.length;
    const totalRow = sheet.getRow(totalRowNum);
    const totalValues = ['', '', '', '', 'TOTAL', totalCost, totalPaid, totalBalance, jobCount];
    totalValues.forEach((v, i) => {
      const cell = totalRow.getCell(i + 1);
      cell.value = v;
      cell.numFmt = (i >= 5 && i <= 7) ? '#,##0.00' : (i === 8 ? '0' : '@');
      cell.font = BLUE_FONT;
      cell.fill = TOTAL_FILL;
      cell.alignment = { horizontal: (i >= 5 && i <= 7) ? 'right' : (i === 4 ? 'left' : 'center'), vertical: 'middle', indent: i === 4 ? 1 : 0 };
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

    summarySheet.addRow(['TRANSPORTERS REPORT SUMMARY']).getCell(1).font = { bold: true, size: 13, color: { argb: 'FF101036' } };
    summarySheet.addRow([dateLabel]).getCell(1).font = { color: { argb: 'FF6B7280' } };
    summarySheet.addRow([]);
    addSummaryRow('Total Cost (LKR)', totalCost);
    addSummaryRow('Total Paid (LKR)', totalPaid);
    addSummaryRow('Outstanding Balance (LKR)', totalBalance);
    summarySheet.addRow([]);
    addSummaryRow('Total Transporters', reportsArray.length, false);
    addSummaryRow('Total Jobs Covered', jobCount, false);

    // ── Return buffer ─────────────────────────────────────────────────────
    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = ExportTransportersReportExcel;
