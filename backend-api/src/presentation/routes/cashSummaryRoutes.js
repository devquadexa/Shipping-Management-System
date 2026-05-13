const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../../middleware/auth');
const container = require('../../infrastructure/di/container');

// Export PDF
router.get('/export/pdf', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'From date and to date are required' });
    }

    const exportPDF = container.get('exportCashSummaryReportPDF');
    const pdfBuffer = await exportPDF.execute(fromDate, toDate);
    
    const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Cash_Summary_Report_${label}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(400).json({ message: error.message });
  }
});

// Export Excel
router.get('/export/excel', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'From date and to date are required' });
    }

    const exportExcel = container.get('exportCashSummaryReportExcel');
    const excelBuffer = await exportExcel.execute(fromDate, toDate);
    
    const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Cash_Summary_Report_${label}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
