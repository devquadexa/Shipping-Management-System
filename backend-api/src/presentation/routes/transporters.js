const express = require('express');
const router = express.Router();
const container = require('../../infrastructure/di/container');
const TransporterController = require('../controllers/TransporterController');
const TransporterPaymentController = require('../controllers/TransporterPaymentController');
const { auth, checkRole } = require('../../middleware/auth');
const { getConnection, sql } = require('../../config/database');
const MSSQLTransporterPaymentRepository = require('../../infrastructure/repositories/MSSQLTransporterPaymentRepository');
const MSSQLTransporterRepository = require('../../infrastructure/repositories/MSSQLTransporterRepository');
const CreateTransporterPayment = require('../../application/use-cases/transporter/CreateTransporterPayment');
const GetTransporterPayments = require('../../application/use-cases/transporter/GetTransporterPayments');
const UpdateTransporterPaymentStatus = require('../../application/use-cases/transporter/UpdateTransporterPaymentStatus');

const transporterController = new TransporterController(container);

// Initialize payment repository and use cases
const transporterPaymentRepository = new MSSQLTransporterPaymentRepository(getConnection, sql);
const transporterRepository = new MSSQLTransporterRepository(getConnection, sql);
const jobRepository = container.get('jobRepository');
const createTransporterPayment = new CreateTransporterPayment(transporterPaymentRepository, jobRepository, transporterRepository);
const getTransporterPayments = new GetTransporterPayments(transporterPaymentRepository);
const updateTransporterPaymentStatus = new UpdateTransporterPaymentStatus(transporterPaymentRepository);

const transporterPaymentController = new TransporterPaymentController(
  createTransporterPayment,
  getTransporterPayments,
  updateTransporterPaymentStatus
);

// Transporter CRUD routes
router.get('/', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => transporterController.getAll(req, res));
router.post('/', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => transporterController.create(req, res));
router.get('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => transporterController.getById(req, res));
router.put('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => transporterController.update(req, res));
router.delete('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => transporterController.delete(req, res));

// Transporter Payment routes
router.post('/payments/record', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => transporterPaymentController.create(req, res));
router.get('/:transporterId/payments', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => transporterPaymentController.getByTransporter(req, res));
router.put('/payments/:paymentId/status', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => transporterPaymentController.updateStatus(req, res));

// Report routes
router.get('/report/export/pdf', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const ExportTransportersReportPDF = require('../../application/use-cases/transporter/ExportTransportersReportPDF');
    const jobRepository = container.get('jobRepository');
    const transporterRepository = container.get('transporterRepository');
    
    const exportUseCase = new ExportTransportersReportPDF(jobRepository, transporterRepository);
    const pdfBuffer = await exportUseCase.execute(fromDate, toDate);
    
    const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Transporters_Report_${label}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting transporters report:', error);
    res.status(500).json({ message: error.message || 'Error generating PDF' });
  }
});

router.get('/report/export/excel', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const ExportTransportersReportExcel = require('../../application/use-cases/transporter/ExportTransportersReportExcel');
    const jobRepository = container.get('jobRepository');
    const transporterRepository = container.get('transporterRepository');
    
    const exportUseCase = new ExportTransportersReportExcel(jobRepository, transporterRepository);
    const excelBuffer = await exportUseCase.execute(fromDate, toDate);
    
    const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Transporters_Report_${label}.xlsx"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting transporters report:', error);
    res.status(500).json({ message: error.message || 'Error generating Excel' });
  }
});

module.exports = router;