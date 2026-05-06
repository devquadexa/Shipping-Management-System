/**
 * Export Petty Cash Report to PDF
 * Generates a professional PDF report of petty cash assignments for a specific date
 */
const PDFDocument = require('pdfkit');

class ExportPettyCashReportPDF {
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

    const fmt = (v) =>
      `LKR ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

    // Format status with abbreviations
    const fmtStatus = (status) => {
      if (!status) return 'Pending';
      const s = status.trim();
      if (s === 'Settled / Balance Returned' || s === 'Balance Returned') return 'Settled / BR';
      if (s === 'Settled / Over Due Collected' || s === 'Over Due Collected') return 'Settled / OC';
      return s;
    };

    // Date range label for header
    const isSingleDay = fromDate === effectiveTo;
    const dateLabel = isSingleDay
      ? `Date: ${fmtDate(fromDate)}`
      : `Period: ${fmtDate(fromDate)} — ${fmtDate(effectiveTo)}`;

    // ── Build PDF ──────────────────────────────────────────────────────────
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 20, size: 'A4', layout: 'portrait' });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;
      const DARK  = '#101036';
      const BLUE  = '#1e3a8a';
      const GRAY  = '#6b7280';
      const LIGHT = '#f3f4f6';
      const GREEN = '#065f46';
      const AMBER = '#92400e';
      const TEAL  = '#14b8a6';

      // ── Header bar ──────────────────────────────────────────────────────
      doc.rect(0, 0, W, 60).fill(DARK);
      doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
         .text('SUPER SHINE CARGO SERVICE', 20, 15);
      doc.fontSize(8).font('Helvetica')
         .text('Petty Cash Report — Job-wise Breakdown', 20, 35);
      doc.fontSize(7)
         .text(dateLabel, 20, 48);

      // ── Table ────────────────────────────────────────────────────────────
      const tableTop = 75;
      const cols = [
        { label: '#',            width: 22,  align: 'center' },
        { label: 'Job ID',       width: 45,  align: 'left'   },
        { label: 'Customer',     width: 68,  align: 'left'   },
        { label: 'Assigned To',  width: 73,  align: 'left'   },
        { label: 'Assigned',     width: 65,  align: 'left'   },
        { label: 'Settled',      width: 58,  align: 'left'   },
        { label: 'Balance',      width: 58,  align: 'left'   },
        { label: 'Status',       width: 55,  align: 'left'   },
        { label: 'Assigned Date', width: 50, align: 'center' },
        { label: 'Settle Date',  width: 50,  align: 'center' },
      ];

      // Header row
      doc.rect(20, tableTop, W - 40, 18).fill(DARK);
      let cx = 20;
      cols.forEach(col => {
        doc.fillColor('white').fontSize(6.5).font('Helvetica-Bold')
           .text(col.label, cx + 3, tableTop + 6, { width: col.width - 6, align: col.align });
        cx += col.width;
      });

      // Data rows
      let rowY = tableTop + 18;
      const rowH = 18;
      assignments.forEach((a, idx) => {
        const bg = idx % 2 === 0 ? 'white' : '#f9fafb';
        doc.rect(20, rowY, W - 40, rowH).fill(bg);

        const netBalance = a.balanceAmount - a.overAmount;
        const balanceColor = netBalance < 0 ? '#dc2626' : (netBalance > 0 ? AMBER : '#374151');
        const balanceText = netBalance === 0 ? '-' : (netBalance < 0 ? '-' + fmt(Math.abs(netBalance)) : fmt(netBalance));
        const isGrouped = a.assignmentCount > 1;
        
        const cells = [
          { v: String(idx + 1),          align: 'center' },
          { v: a.jobId || '-',            align: 'left'   },
          { v: a.customerName,            align: 'left'   },
          { v: a.assignedToName,          align: 'left'   },
          { v: fmt(a.assignedAmount),     align: 'left', showCount: isGrouped, count: a.assignmentCount },
          { v: fmt(a.settledAmount),      align: 'left', color: GREEN },
          { v: balanceText,               align: 'left', color: balanceColor },
          { v: fmtStatus(a.status),       align: 'left'   },
          { v: fmtDate(a.assignmentDate), align: 'center' },
          { v: fmtDate(a.settlementDate), align: 'center' },
        ];

        cx = 20;
        cells.forEach((cell, ci) => {
          if (cell.showCount) {
            // Render assigned amount with count on same line - smaller font for count
            const amountText = cell.v;
            const countText = ` (${cell.count})`;
            
            // Render amount
            doc.fillColor(cell.color || '#374151').fontSize(6.5).font('Helvetica')
               .text(amountText, cx + 3, rowY + 5, { width: cols[ci].width - 20, align: cell.align, continued: false });
            
            // Calculate position for count (right after amount with minimal spacing)
            const amountWidth = doc.widthOfString(amountText);
            
            // Render count with smaller font (7pt instead of 10pt) and bold
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#374151')
               .text(countText, cx + 3 + amountWidth + 1, rowY + 5.5, { width: 18, align: 'left' });
          } else {
            doc.fillColor(cell.color || '#374151').fontSize(6.5).font('Helvetica')
               .text(cell.v, cx + 3, rowY + 5, { width: cols[ci].width - 6, align: cell.align, ellipsis: true });
          }
          cx += cols[ci].width;
        });

        // Row border
        doc.moveTo(20, rowY + rowH).lineTo(W - 20, rowY + rowH).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        rowY += rowH;

        // Page break
        if (rowY > doc.page.height - 70) {
          doc.addPage({ margin: 20, size: 'A4', layout: 'portrait' });
          rowY = 40;
          
          // Repeat header on new page
          doc.rect(20, rowY, W - 40, 18).fill(DARK);
          cx = 20;
          cols.forEach(col => {
            doc.fillColor('white').fontSize(6.5).font('Helvetica-Bold')
               .text(col.label, cx + 3, rowY + 6, { width: col.width - 6, align: col.align });
            cx += col.width;
          });
          rowY += 18;
        }
      });

      // Totals row
      doc.rect(20, rowY, W - 40, 18).fill('#eff6ff');
      cx = 20;
      const totalCells = [
        { v: '',                    align: 'center' },
        { v: '',                    align: 'left'   },
        { v: '',                    align: 'left'   },
        { v: 'TOTAL',               align: 'left'   },
        { v: fmt(totalAssigned),    align: 'left'   },
        { v: fmt(totalSettled),     align: 'left'   },
        { v: '',                    align: 'left'   },
        { v: '',                    align: 'left'   },
        { v: '',                    align: 'center' },
        { v: '',                    align: 'center' },
      ];
      totalCells.forEach((cell, ci) => {
        doc.fillColor(BLUE).fontSize(6.5).font('Helvetica-Bold')
           .text(cell.v, cx + 3, rowY + 6, { width: cols[ci].width - 6, align: cell.align });
        cx += cols[ci].width;
      });

      // Footer
      const footerY = doc.page.height - 25;
      doc.moveTo(20, footerY - 6).lineTo(W - 20, footerY - 6).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
         .text(`Super Shine Cargo Service — Confidential | Generated: ${fmtDate(new Date())}`, 20, footerY, { width: W - 40, align: 'center' });

      doc.end();
    });
  }
}

module.exports = ExportPettyCashReportPDF;
