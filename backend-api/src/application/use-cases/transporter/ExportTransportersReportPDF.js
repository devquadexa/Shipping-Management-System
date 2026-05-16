/**
 * Export Transporters Report to PDF
 * Generates a professional PDF report of transporter payments for a specific date range
 */
const PDFDocument = require('pdfkit');

class ExportTransportersReportPDF {
  constructor(jobRepository, transporterRepository) {
    this.jobRepository = jobRepository;
    this.transporterRepository = transporterRepository;
  }

  async execute(fromDate, toDate) {
    if (!fromDate) throw new Error('From date is required');
    const effectiveTo = toDate || fromDate;

    const from = new Date(fromDate);
    const to   = new Date(effectiveTo);
    if (isNaN(from.getTime())) throw new Error('Invalid from date. Use YYYY-MM-DD');
    if (isNaN(to.getTime()))   throw new Error('Invalid to date. Use YYYY-MM-DD');

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
      const totalAmount = parseFloat(item.actualCost || item.amount || item.billingAmount || 0) || 0;
      
      // For unpaid jobs, include them regardless of date filtering
      if (paidAmount === 0 && totalAmount > 0) {
        return true;
      }
      
      // For paid/partially paid jobs, filter by payment date
      let paymentDate = null;
      if (item.paidAt) {
        paymentDate = new Date(item.paidAt);
      } else if (job.transportDeliveryDate) {
        paymentDate = new Date(job.transportDeliveryDate);
      } else if (job.createdDate) {
        paymentDate = new Date(job.createdDate);
      }
      
      if (!paymentDate) {
        return false;
      }

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

      // Get transporter cost from job
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

    const totalCost = reportsArray.reduce((s, r) => s + r.totalCost, 0);
    const totalPaid = reportsArray.reduce((s, r) => s + r.totalPaid, 0);
    const totalBalance = reportsArray.reduce((s, r) => s + r.totalBalance, 0);
    const jobCount = reportsArray.reduce((s, r) => s + r.jobs.length, 0);

    const fmt = (v) =>
      `LKR ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

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
      const TEAL  = '#14b8a6';

      // ── Header bar ──────────────────────────────────────────────────────
      doc.rect(0, 0, W, 60).fill(DARK);
      doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
         .text('SUPER SHINE CARGO SERVICE', 20, 15);
      doc.fontSize(8).font('Helvetica')
         .text('Transporters Report — Payment Details', 20, 35);
      doc.fontSize(7)
         .text(dateLabel, 20, 48);

      // ── Summary cards (3 cards) ────────────────────────────────────────
      const cardY = 75;
      const cardW = (W - 40 - 10) / 3;
      const cardH = 50;
      const cardGap = 5;
      
      const cards = [
        { label: 'Total Cost',      value: fmt(totalCost),    sub: `${jobCount} jobs`,           color: '#3b82f6', col: 0 },
        { label: 'Total Paid',      value: fmt(totalPaid),    sub: 'Completed payments',        color: '#10b981', col: 1 },
        { label: 'Balance',         value: fmt(totalBalance), sub: 'Pending payment',           color: TEAL,      col: 2 },
      ];
      
      cards.forEach((card) => {
        const x = 20 + card.col * (cardW + cardGap);
        const y = cardY;
        
        doc.rect(x, y, cardW, cardH).fill(LIGHT);
        doc.rect(x, y, 3, cardH).fill(card.color);
        doc.fillColor(GRAY).fontSize(6.5).font('Helvetica-Bold')
           .text(card.label.toUpperCase(), x + 8, y + 7, { width: cardW - 12 });
        doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold')
           .text(card.value, x + 8, y + 20, { width: cardW - 12 });
        doc.fillColor(GRAY).fontSize(6.5).font('Helvetica')
           .text(card.sub, x + 8, y + 35, { width: cardW - 12 });
      });

      // ── Table ────────────────────────────────────────────────────────────
      const tableTop = cardY + cardH + 15;
      const cols = [
        { label: '#',                width: 22,  align: 'center' },
        { label: 'Transporter ID',   width: 60,  align: 'left'   },
        { label: 'Name',             width: 80,  align: 'left'   },
        { label: 'Phone',            width: 70,  align: 'left'   },
        { label: 'Total Cost',       width: 70,  align: 'left'   },
        { label: 'Total Paid',       width: 70,  align: 'left'   },
        { label: 'Balance',          width: 70,  align: 'left'   },
        { label: 'Jobs',             width: 40,  align: 'center' },
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
      reportsArray.forEach((r, idx) => {
        const bg = idx % 2 === 0 ? 'white' : '#f9fafb';
        doc.rect(20, rowY, W - 40, rowH).fill(bg);

        const cells = [
          { v: String(idx + 1),           align: 'center' },
          { v: r.transporterId || '-',    align: 'left'   },
          { v: r.transporterName,         align: 'left'   },
          { v: r.mainPhone || '-',        align: 'left'   },
          { v: fmt(r.totalCost),          align: 'left'   },
          { v: fmt(r.totalPaid),          align: 'left', color: GREEN },
          { v: r.totalBalance > 0 ? fmt(r.totalBalance) : '-', align: 'left', color: '#f59e0b' },
          { v: String(r.jobs.length),     align: 'center' },
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
        { v: '',                align: 'center' },
        { v: '',                align: 'left'   },
        { v: '',                align: 'left'   },
        { v: 'TOTAL',           align: 'left'   },
        { v: fmt(totalCost),    align: 'left'   },
        { v: fmt(totalPaid),    align: 'left'   },
        { v: fmt(totalBalance), align: 'left'   },
        { v: String(jobCount),  align: 'center' },
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

module.exports = ExportTransportersReportPDF;
