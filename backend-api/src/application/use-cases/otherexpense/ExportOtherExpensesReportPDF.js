/**
 * Export Other Expenses Report to PDF
 */
const PDFDocument = require('pdfkit');

class ExportOtherExpensesReportPDF {
  constructor(otherExpenseRepository) {
    this.otherExpenseRepository = otherExpenseRepository;
  }

  async execute(fromDate, toDate, category = null) {
    if (!fromDate || !toDate) {
      throw new Error('From date and to date are required');
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const expenses = await this.otherExpenseRepository.findByDateRange(from, to, category);
    const summary = await this.otherExpenseRepository.getSummaryByCategory(from, to);

    if (!expenses || expenses.length === 0) {
      throw new Error('No expenses found for the selected date range');
    }

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const fmt = (v) =>
      `LKR ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

    const isSingleDay = fromDate === toDate;
    const dateLabel = isSingleDay
      ? `Date: ${fmtDate(fromDate)}`
      : `Period: ${fmtDate(fromDate)} — ${fmtDate(toDate)}`;

    const categoryLabel = category ? ` - ${category}` : '';

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
         .text(`Other Expenses Report${categoryLabel}`, 20, 35);
      doc.fontSize(7)
         .text(dateLabel, 20, 48);

      // Table
      const tableTop = 75;
      const cols = [
        { label: '#', width: 25, align: 'center' },
        { label: 'Expense ID', width: 55, align: 'left' },
        { label: 'Date', width: 50, align: 'center' },
        { label: 'Category', width: 75, align: 'left' },
        { label: 'Description', width: 140, align: 'left' },
        { label: 'Amount', width: 65, align: 'right' },
        { label: 'Payment Method', width: 70, align: 'left' },
        { label: 'Recorded By', width: 70, align: 'left' },
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
      expenses.forEach((exp, idx) => {
        const bg = idx % 2 === 0 ? 'white' : '#f9fafb';
        doc.rect(20, rowY, W - 40, rowH).fill(bg);

        const cells = [
          { v: String(idx + 1), align: 'center' },
          { v: exp.expenseId || '-', align: 'left' },
          { v: fmtDate(exp.expenseDate), align: 'center' },
          { v: exp.category || '-', align: 'left' },
          { v: exp.description || '-', align: 'left' },
          { v: fmt(exp.amount), align: 'right', color: BLUE },
          { v: exp.paymentMethod || '-', align: 'left' },
          { v: exp.recordedByName || '-', align: 'left' },
        ];

        cx = 20;
        cells.forEach((cell, ci) => {
          doc.fillColor(cell.color || '#374151').fontSize(6.5).font('Helvetica')
             .text(cell.v, cx + 3, rowY + 5, { width: cols[ci].width - 6, align: cell.align, ellipsis: true });
          cx += cols[ci].width;
        });

        doc.moveTo(20, rowY + rowH).lineTo(W - 20, rowY + rowH).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        rowY += rowH;

        // Page break
        if (rowY > doc.page.height - 100) {
          doc.addPage({ margin: 20, size: 'A4', layout: 'portrait' });
          rowY = 40;
          
          // Repeat header
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

      // Total row
      doc.rect(20, rowY, W - 40, 18).fill('#eff6ff');
      cx = 20;
      const totalCells = [
        { v: '', align: 'center' },
        { v: '', align: 'left' },
        { v: '', align: 'center' },
        { v: '', align: 'left' },
        { v: 'TOTAL', align: 'left' },
        { v: fmt(totalAmount), align: 'right' },
        { v: '', align: 'left' },
        { v: '', align: 'left' },
      ];
      totalCells.forEach((cell, ci) => {
        doc.fillColor(BLUE).fontSize(6.5).font('Helvetica-Bold')
           .text(cell.v, cx + 3, rowY + 6, { width: cols[ci].width - 6, align: cell.align });
        cx += cols[ci].width;
      });

      rowY += 25;

      // Summary by category
      if (summary && summary.length > 0 && !category) {
        doc.fillColor(DARK).fontSize(8).font('Helvetica-Bold')
           .text('Summary by Category', 20, rowY);
        rowY += 15;

        summary.forEach(cat => {
          doc.fillColor('#374151').fontSize(7).font('Helvetica')
             .text(`${cat.category}: ${fmt(cat.totalAmount)} (${cat.count} expenses)`, 25, rowY);
          rowY += 12;
        });
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

module.exports = ExportOtherExpensesReportPDF;
