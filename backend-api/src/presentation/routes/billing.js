/**
 * Billing Routes (Clean Architecture)
 */
const express = require('express');
const { auth, checkRole } = require('../../middleware/auth');
const container = require('../../infrastructure/di/container');
const BillingController = require('../controllers/BillingController');

const router = express.Router();

// Initialize controller with use cases from DI container
const billingController = new BillingController(
  container.get('createBill'),
  container.get('getAllBills'),
  container.get('getBillById'),
  container.get('markBillAsPaid'),
  container.get('applyPartialPayment')
);

// Routes
router.post('/', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) =>
  billingController.create(req, res)
);
router.get('/', auth, (req, res) =>
  billingController.getAll(req, res)
);
router.get('/:id', auth, (req, res) =>
  billingController.getById(req, res)
);
router.patch('/:id/pay', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) =>
  billingController.markAsPaid(req, res)
);
router.patch('/:id/partial-pay', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) =>
  billingController.partialPayment(req, res)
);
router.put('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) =>
  billingController.markAsPaid(req, res)
);

// Pending Payments Report Routes
router.get('/report/pending-payments', auth, async (req, res) => {
  try {
    const { fromDate, toDate, showOverdueOnly } = req.query;
    const getPendingPaymentsReport = container.get('getPendingPaymentsReport');
    const result = await getPendingPaymentsReport.execute(fromDate, toDate, showOverdueOnly === 'true');
    res.json(result);
  } catch (error) {
    console.error('Error fetching pending payments report:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/report/pending-payments/export/pdf', auth, async (req, res) => {
  try {
    const { fromDate, toDate, showOverdueOnly } = req.query;
    const exportPendingPaymentsReportPDF = container.get('exportPendingPaymentsReportPDF');
    const pdfBuffer = await exportPendingPaymentsReportPDF.execute(fromDate, toDate, showOverdueOnly === 'true');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Pending_Payments_Report_${fromDate}_to_${toDate}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/report/pending-payments/export/excel', auth, async (req, res) => {
  try {
    const { fromDate, toDate, showOverdueOnly } = req.query;
    const exportPendingPaymentsReportExcel = container.get('exportPendingPaymentsReportExcel');
    const excelBuffer = await exportPendingPaymentsReportExcel.execute(fromDate, toDate, showOverdueOnly === 'true');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Pending_Payments_Report_${fromDate}_to_${toDate}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => 
  billingController.markAsPaid(req, res)
);

module.exports = router;
