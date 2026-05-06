/**
 * Export Pending Payments Report to PDF
 * Generates a professional PDF report of pending payment invoices
 */
const PDFDocument = require('pdfkit');

class ExportPendingPaymentsReportPDF {
  constructor(billRepository) {
    this.billRepository = billRepository;
  }

  async execute(fromDate, toDate, showOverdueOnly = false) {
    if (!fromDate) throw new Error('From date is required');
    const effectiveTo = toDate || fromDate;

    const from = new Date(fromDate);
    const to   = new Date(effectiveTo);
    if (isNaN(from.getTime())) throw new Error('Invalid from date. Use YYYY-MM-DD');
    if (isNaN(to.getTime()))   throw new Error('Invalid to date. Use YYYY-MM-DD');

    // Get data using the repository
    const pool = await this.billRepository.db();
    const fromDateStr = from.toISOString().split('T')[0];
    const toDateStr = to.toISOString().split('T')[0];

    const request = pool.request()
      .input('fromDate', this.billRepository.sql.VarChar, fromDateStr)
      .input('toDate', this.billRepository.sql.VarChar, toDateStr);

    let whereClause = `
      WHERE b.PaymentStatus IN ('Unpaid', 'Partially Paid')
        AND CONVERT(DATE, b.invoiceDate) BETWEEN CONVERT(DATE, @fromDate) AND CONVERT(DATE, @toDate)
    `;

    if (showOverdueOnly) {
      whereClause += ` AND (b.isOverdue = 1 OR b.dueDate < GETDATE())`;
    }

    const result = await request.query(`
      SELECT 
        b.BillId,
        b.JobId,
        b.InvoiceNumber,
        b.invoiceDate,
        b.dueDate,
        b.netTotal,
        b.paidAmount,
        b.remainingAmount,
        b.PaymentStatus,
        b.isOverdue,
        c.Name as customerName
      FROM Bills b
      LEFT JOIN Customers c ON b.CustomerId = c.customerId
      ${whereClause}
      ORDER BY b.invoiceDate DESC, b.JobId ASC
    `);

    if (!result.recordset || result.recordset.length === 0) {
      throw new Error('No pending payments found for the selected date range');
    }

    const invoices = result.recordset.map(row => ({
      billId: row.BillId,
      jobId: row.JobId,
      customerName: row.customerName || '-',
      invoiceNumber: row.InvoiceNumber,
      invoiceDate: row.invoiceDate,
      dueDate: row.dueDate,
      netTotal: parseFloat(row.netTotal) || 0,
      paidAmount: parseFloat(row.paidAmount) || 0,
      remainingAmount: parseFloat(row.remainingAmount) || parseFloat(row.netTotal) || 0,
      paymentStatus: row.PaymentStatus,
      isOverdue: row.isOverdue || false
    }));

    const totalInvoiceAmount = invoices.reduce((s, i) => s + i.netTotal, 0);
    const totalPaidAmount = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const totalRemaining = invoices.reduce((s, i) => s + i.remainingAmount, 0);

    const fmt = (v) =>
      `LKR ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

    // Date range label for header
    const isSingleDay = fromDateStr === toDateStr;
    const dateLabel = isSingleDay
      ? `Date: ${fmtDate(fromDate)}`
      : `Period: ${fmtDate(fromDate)} — ${fmtDate(toDate)}`;

    const reportTitle = showOverdueOnly ? 'Overdue Payments Report' : 'Pending Payments Report';

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
      const GREEN = '#065f46';
      const RED   = '#dc2626';
      const AMBER = '#92400e';

      // ── Header bar ──────────────────────────────────────────────────────
      doc.rect(0, 0, W, 60).fill(DARK);
      doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
         .text('SUPER SHINE CARGO SERVICE', 20, 15);
      doc.fontSize(8).font('Helvetica')
         .text(reportTitle, 20, 35);
      doc.fontSize(7)
         .text(dateLabel, 20, 48);

      // ── Table ────────────────────────────────────────────────────────────
      const tableTop = 75;
      const cols = [
        { label: '#',              width: 22,  align: 'center' },
        { label: 'Job ID',         width: 50,  align: 'left'   },
        { label: 'Customer',       width: 90,  align: 'left'   },
        { label: 'Invoice #',      width: 60,  align: 'left'   },
        { label: 'Invoice Date',   width: 55,  align: 'center' },
        { label: 'Due Date',       width: 55,  align: 'center' },
        { label: 'Invoice Amount', width: 65,  align: 'right'  },
        { label: 'Paid',           width: 55,  align: 'right'  },
        { label: 'Remaining',      width: 63,  align: 'right'  },
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
      invoices.forEach((inv, idx) => {
        const bg = idx % 2 === 0 ? 'white' : '#f9fafb';
        doc.rect(20, rowY, W - 40, rowH).fill(bg);

        const remainingColor = inv.isOverdue ? RED : (inv.remainingAmount > 0 ? AMBER : '#374151');
        
        const cells = [
          { v: String(idx + 1),            align: 'center' },
          { v: inv.jobId || '-',           align: 'left'   },
          { v: inv.customerName,           align: 'left'   },
          { v: inv.invoiceNumber || '-',   align: 'left'   },
          { v: fmtDate(inv.invoiceDate),   align: 'center' },
          { v: fmtDate(inv.dueDate),       align: 'center' },
          { v: fmt(inv.netTotal),          align: 'right'  },
          { v: fmt(inv.paidAmount),        align: 'right', color: GREEN },
          { v: fmt(inv.remainingAmount),   align: 'right', color: remainingColor },
        ];

        cx = 20;
        cells.forEach((cell, ci) => {
          doc.fillColor(cell.color || '#374151').fontSize(6.5).font('Helvetica')
             .text(cell.v, cx + 3, rowY + 5, { width: cols[ci].width - 6, align: cell.align, ellipsis: true });
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
        { v: '',                       align: 'center' },
        { v: '',                       align: 'left'   },
        { v: '',                       align: 'left'   },
        { v: 'TOTAL',                  align: 'left'   },
        { v: '',                       align: 'center' },
        { v: '',                       align: 'center' },
        { v: fmt(totalInvoiceAmount),  align: 'right'  },
        { v: fmt(totalPaidAmount),     align: 'right'  },
        { v: fmt(totalRemaining),      align: 'right'  },
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

module.exports = ExportPendingPaymentsReportPDF;
