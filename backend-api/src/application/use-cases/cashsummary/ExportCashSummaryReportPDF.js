/**
 * Export Cash Summary Report to PDF
 */
const PDFDocument = require('pdfkit');

class ExportCashSummaryReportPDF {
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

    const fmt = (v) =>
      `LKR ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

    const isSingleDay = fromDate === toDate;
    const dateLabel = isSingleDay
      ? `Date: ${fmtDate(fromDate)}`
      : `Period: ${fmtDate(fromDate)} — ${fmtDate(toDate)}`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 20, size: 'A4', layout: 'portrait' });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;
      const DARK = '#101036';
      const BLUE = '#1e3a8a';
      const GRAY = '#6b7280';

      // Header
      doc.rect(0, 0, W, 60).fill(DARK);
      doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
         .text('SUPER SHINE CARGO SERVICE', 20, 15);
      doc.fontSize(8).font('Helvetica')
         .text('Cash Summary Report', 20, 35);
      doc.fontSize(7)
         .text(dateLabel, 20, 48);

      let currentY = 75;

      // Summary Section - Grid Layout (2x2)
      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
         .text('Summary', 20, currentY);
      currentY += 15;

      const summaryData = [
        { label: 'Total Cash Withdrawn:', value: fmt(totalWithdrawn), color: '#3b82f6' },
        { label: 'Petty Cash Issued:', value: fmt(totalPettyCash), color: '#8b5cf6' },
        { label: 'Other Expenses:', value: fmt(totalExpenses), color: '#f59e0b' },
        { label: 'Available Balance:', value: fmt(availableBalance), color: availableBalance >= 0 ? '#10b981' : '#ef4444' }
      ];

      // Grid dimensions
      const gridStartX = 20;
      const gridWidth = W - 40;
      const cardWidth = (gridWidth - 10) / 2; // 2 columns with 10px gap
      const cardHeight = 35;
      const gap = 10;

      // Draw 2x2 grid
      summaryData.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = gridStartX + col * (cardWidth + gap);
        const y = currentY + row * (cardHeight + gap);

        // Card background with subtle border
        doc.rect(x, y, cardWidth, cardHeight).fillAndStroke('#f9fafb', '#e5e7eb');

        // Label
        doc.fillColor('#6b7280').fontSize(7).font('Helvetica')
           .text(item.label, x + 8, y + 8, { width: cardWidth - 16, align: 'left' });

        // Value
        doc.fillColor(item.color).fontSize(10).font('Helvetica-Bold')
           .text(item.value, x + 8, y + 20, { width: cardWidth - 16, align: 'left' });
      });

      currentY += (cardHeight * 2) + gap + 15;

      // Cash Withdrawals Table
      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
         .text(`Cash Withdrawals (${withdrawals.length})`, 20, currentY);
      currentY += 15;

      if (withdrawals.length > 0) {
        const cols = [
          { label: 'Withdrawal ID', width: 65, align: 'left' },
          { label: 'Date', width: 55, align: 'center' },
          { label: 'Bank Name', width: 85, align: 'left' },
          { label: 'Amount', width: 75, align: 'right' },
          { label: 'Recorded By', width: 85, align: 'left' },
          { label: 'Notes', width: 190, align: 'left' }
        ];

        // Header row
        doc.rect(20, currentY, W - 40, 16).fill(DARK);
        let cx = 20;
        cols.forEach(col => {
          doc.fillColor('white').fontSize(6.5).font('Helvetica-Bold')
             .text(col.label, cx + 3, currentY + 5, { width: col.width - 6, align: col.align });
          cx += col.width;
        });
        currentY += 16;

        // Data rows
        withdrawals.forEach((w, idx) => {
          const bg = idx % 2 === 0 ? 'white' : '#f9fafb';
          doc.rect(20, currentY, W - 40, 16).fill(bg);

          const cells = [
            { v: w.withdrawalId || '-', align: 'left' },
            { v: fmtDate(w.withdrawalDate), align: 'center' },
            { v: w.bankName || '-', align: 'left' },
            { v: fmt(w.amount), align: 'right', color: BLUE },
            { v: w.recordedByName || '-', align: 'left' },
            { v: w.notes || '-', align: 'left' }
          ];

          cx = 20;
          cells.forEach((cell, ci) => {
            doc.fillColor(cell.color || '#374151').fontSize(6.5).font('Helvetica')
               .text(cell.v, cx + 3, currentY + 4, { width: cols[ci].width - 6, align: cell.align, ellipsis: true });
            cx += cols[ci].width;
          });

          doc.moveTo(20, currentY + 16).lineTo(W - 20, currentY + 16).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
          currentY += 16;

          if (currentY > doc.page.height - 100) {
            doc.addPage({ margin: 20, size: 'A4', layout: 'portrait' });
            currentY = 40;
          }
        });

        // Total row
        doc.rect(20, currentY, W - 40, 16).fill('#eff6ff');
        cx = 20;
        doc.fillColor('#374151').fontSize(6.5).font('Helvetica-Bold')
           .text('TOTAL', cx + 3, currentY + 5, { width: cols[0].width + cols[1].width + cols[2].width - 6, align: 'left' });
        cx += cols[0].width + cols[1].width + cols[2].width;
        doc.fillColor(BLUE).fontSize(6.5).font('Helvetica-Bold')
           .text(fmt(totalWithdrawn), cx + 3, currentY + 5, { width: cols[3].width - 6, align: 'right' });
        currentY += 25;
      }

      // Petty Cash Issued Table
      if (currentY > doc.page.height - 200) {
        doc.addPage({ margin: 20, size: 'A4', layout: 'portrait' });
        currentY = 40;
      }

      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
         .text(`Petty Cash Issued (${assignments.length})`, 20, currentY);
      currentY += 15;

      if (assignments.length > 0) {
        const cols = [
          { label: 'Assignment ID', width: 55, align: 'left' },
          { label: 'Date', width: 55, align: 'center' },
          { label: 'Job ID', width: 60, align: 'left' },
          { label: 'Assigned To', width: 110, align: 'left' },
          { label: 'Amount', width: 75, align: 'right' },
          { label: 'Status', width: 200, align: 'left' }
        ];

        // Header row
        doc.rect(20, currentY, W - 40, 16).fill(DARK);
        let cx = 20;
        cols.forEach(col => {
          doc.fillColor('white').fontSize(6.5).font('Helvetica-Bold')
             .text(col.label, cx + 3, currentY + 5, { width: col.width - 6, align: col.align });
          cx += col.width;
        });
        currentY += 16;

        // Data rows
        assignments.forEach((a, idx) => {
          const bg = idx % 2 === 0 ? 'white' : '#f9fafb';
          doc.rect(20, currentY, W - 40, 16).fill(bg);

          const cells = [
            { v: a.assignmentId || '-', align: 'left' },
            { v: fmtDate(a.assignedDate), align: 'center' },
            { v: a.jobId || '-', align: 'left' },
            { v: a.assignedToName || '-', align: 'left' },
            { v: fmt(a.assignedAmount), align: 'right', color: BLUE },
            { v: a.status || '-', align: 'left' }
          ];

          cx = 20;
          cells.forEach((cell, ci) => {
            doc.fillColor(cell.color || '#374151').fontSize(6.5).font('Helvetica')
               .text(cell.v, cx + 3, currentY + 4, { width: cols[ci].width - 6, align: cell.align, ellipsis: true });
            cx += cols[ci].width;
          });

          doc.moveTo(20, currentY + 16).lineTo(W - 20, currentY + 16).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
          currentY += 16;

          if (currentY > doc.page.height - 100) {
            doc.addPage({ margin: 20, size: 'A4', layout: 'portrait' });
            currentY = 40;
          }
        });

        // Total row
        doc.rect(20, currentY, W - 40, 16).fill('#eff6ff');
        cx = 20;
        doc.fillColor('#374151').fontSize(6.5).font('Helvetica-Bold')
           .text('TOTAL', cx + 3, currentY + 5, { width: cols[0].width + cols[1].width + cols[2].width + cols[3].width - 6, align: 'left' });
        cx += cols[0].width + cols[1].width + cols[2].width + cols[3].width;
        doc.fillColor(BLUE).fontSize(6.5).font('Helvetica-Bold')
           .text(fmt(totalPettyCash), cx + 3, currentY + 5, { width: cols[4].width - 6, align: 'right' });
        currentY += 25;
      }

      // Other Expenses Table
      if (currentY > doc.page.height - 200) {
        doc.addPage({ margin: 20, size: 'A4', layout: 'portrait' });
        currentY = 40;
      }

      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
         .text(`Other Expenses (${expenses.length})`, 20, currentY);
      currentY += 15;

      if (expenses.length > 0) {
        const cols = [
          { label: 'Expense ID', width: 60, align: 'left' },
          { label: 'Date', width: 55, align: 'center' },
          { label: 'Category', width: 75, align: 'left' },
          { label: 'Description', width: 180, align: 'left' },
          { label: 'Amount', width: 75, align: 'right' },
          { label: 'Payment Method', width: 110, align: 'left' }
        ];

        // Header row
        doc.rect(20, currentY, W - 40, 16).fill(DARK);
        let cx = 20;
        cols.forEach(col => {
          doc.fillColor('white').fontSize(6.5).font('Helvetica-Bold')
             .text(col.label, cx + 3, currentY + 5, { width: col.width - 6, align: col.align });
          cx += col.width;
        });
        currentY += 16;

        // Data rows
        expenses.forEach((e, idx) => {
          const bg = idx % 2 === 0 ? 'white' : '#f9fafb';
          doc.rect(20, currentY, W - 40, 16).fill(bg);

          const cells = [
            { v: e.expenseId || '-', align: 'left' },
            { v: fmtDate(e.expenseDate), align: 'center' },
            { v: e.category || '-', align: 'left' },
            { v: e.description || '-', align: 'left' },
            { v: fmt(e.amount), align: 'right', color: BLUE },
            { v: e.paymentMethod || '-', align: 'left' }
          ];

          cx = 20;
          cells.forEach((cell, ci) => {
            doc.fillColor(cell.color || '#374151').fontSize(6.5).font('Helvetica')
               .text(cell.v, cx + 3, currentY + 4, { width: cols[ci].width - 6, align: cell.align, ellipsis: true });
            cx += cols[ci].width;
          });

          doc.moveTo(20, currentY + 16).lineTo(W - 20, currentY + 16).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
          currentY += 16;

          if (currentY > doc.page.height - 100) {
            doc.addPage({ margin: 20, size: 'A4', layout: 'portrait' });
            currentY = 40;
          }
        });

        // Total row
        doc.rect(20, currentY, W - 40, 16).fill('#eff6ff');
        cx = 20;
        doc.fillColor('#374151').fontSize(6.5).font('Helvetica-Bold')
           .text('TOTAL', cx + 3, currentY + 5, { width: cols[0].width + cols[1].width + cols[2].width + cols[3].width - 6, align: 'left' });
        cx += cols[0].width + cols[1].width + cols[2].width + cols[3].width;
        doc.fillColor(BLUE).fontSize(6.5).font('Helvetica-Bold')
           .text(fmt(totalExpenses), cx + 3, currentY + 5, { width: cols[4].width - 6, align: 'right' });
      }

      // Footer
      const footerY = doc.page.height - 25;
      doc.moveTo(20, footerY - 6).lineTo(W - 20, footerY - 6).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
         .text(`Super Shine Cargo Service — Confidential | Generated: ${fmtDate(new Date())}`, 20, footerY, { width: W - 40, align: 'center' });

      doc.end();
    });
  }
}

module.exports = ExportCashSummaryReportPDF;
