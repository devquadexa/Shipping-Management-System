/**
 * Petty Cash Report Controller
 * Handles report generation and export endpoints
 */
class PettyCashReportController {
  constructor(
    getPettyCashReportByDate,
    exportPettyCashReportPDF,
    exportPettyCashReportExcel
  ) {
    this.getPettyCashReportByDate = getPettyCashReportByDate;
    this.exportPettyCashReportPDF = exportPettyCashReportPDF;
    this.exportPettyCashReportExcel = exportPettyCashReportExcel;
  }

  async getReport(req, res) {
    try {
      const { fromDate, toDate, date } = req.query;
      const from = fromDate || date;
      const to   = toDate   || fromDate || date;

      console.log(`[PettyCashReport] getReport - from: ${from}, to: ${to}, user role: "${req.user?.role}"`);

      if (!from) {
        return res.status(400).json({ message: 'fromDate parameter is required' });
      }

      const report = await this.getPettyCashReportByDate.execute(from, to);
      res.json(report);
    } catch (error) {
      console.error('Error in getReport:', error);
      res.status(500).json({ message: error.message || 'Error generating report' });
    }
  }

  async exportPDF(req, res) {
    try {
      const { fromDate, toDate, date } = req.query;
      const from = fromDate || date;
      const to   = toDate   || date;

      if (!from) {
        return res.status(400).json({ message: 'fromDate parameter is required' });
      }

      const pdfBuffer = await this.exportPettyCashReportPDF.execute(from, to);
      const fileLabel = from === to ? from : `${from}_to_${to}`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Petty_Cash_Report_${fileLabel}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error in exportPDF:', error);
      res.status(500).json({ message: error.message || 'Error generating PDF' });
    }
  }

  async exportExcel(req, res) {
    try {
      const { fromDate, toDate, date } = req.query;
      const from = fromDate || date;
      const to   = toDate   || date;

      if (!from) {
        return res.status(400).json({ message: 'fromDate parameter is required' });
      }

      const excelBuffer = await this.exportPettyCashReportExcel.execute(from, to);
      const fileLabel = from === to ? from : `${from}_to_${to}`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Petty_Cash_Report_${fileLabel}.xlsx"`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error in exportExcel:', error);
      res.status(500).json({ message: error.message || 'Error generating Excel' });
    }
  }
}

module.exports = PettyCashReportController;
